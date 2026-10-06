/**
 * Clinic ingest CLI. DRY-RUN BY DEFAULT: nothing is written to MongoDB unless --write is passed.
 *
 *   npm run ingest -- --source osm                       # fetch OSM via Overpass
 *   npm run ingest -- --source osm --osm-file osm.json   # use a saved Overpass response
 *   npm run ingest -- --source website --input sites.txt # one clinic website URL per line
 *   npm run ingest -- --source samt                      # samt.tj listing via ScrapeGraphAI
 *   npm run ingest -- --source ydoc                      # ydoc.tj listing via ScrapeGraphAI
 *   add --city Душанбе to limit to one city, --write to save to MongoDB
 *
 * ScrapeGraphAI sources (samt, ydoc) need SGAI_API_KEY and spend credits:
 *   --listing-url <url>   listing page to start from (default: see SOURCE_CONFIG)
 *   --max-pages <n>       page cap, default 3 (every page is one metered call)
 *   --delay-ms <n>        pause between calls, default 1500
 *   --cache-dir <dir>     response cache, default import-output/.sgai-cache (re-runs cost nothing)
 *   --images              with --write: re-host logo + a couple of photos on Cloudinary
 *   --max-images <n>      photos per clinic (first = cover, rest = gallery), default 2
 *
 * Output: import-output/<timestamp>/{create,update,review,skipped,invalid}.json + report.json
 * Presigned image URLs are redacted in every report.
 */
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Clinic from '../src/models/Clinic';
import { fetchOsmClinics, parseOverpass } from '../src/lib/ingest/adapters/osm';
import { fetchWebsiteClinics } from '../src/lib/ingest/adapters/website';
import {
  SOURCE_CONFIG, collectListing, toRawClinic, redactSignedUrl, type ResponseCache,
} from '../src/lib/ingest/adapters/scrapegraph';
import { importClinicImages, prefetchSignedImages } from '../src/lib/ingest/images';
import { isCloudinaryConfigured } from '../src/lib/cloudinary-upload';
import { geocode } from '../src/lib/ingest/geocode';
import { normalizeRaw, stableSlug } from '../src/lib/ingest/normalize';
import { decide } from '../src/lib/ingest/dedupe';
import { toClinicDoc, fillEmptyPatch } from '../src/lib/ingest/writer';
import type { ClinicImages, Decision, ExistingClinic, RawClinic } from '../src/lib/ingest/types';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** One JSON file per URL. Presigned image URLs are stripped before they get here. */
function fileCache(dir: string): ResponseCache {
  fs.mkdirSync(dir, { recursive: true });
  const file = (key: string) => path.join(dir, `${createHash('sha1').update(key).digest('hex')}.json`);
  return {
    get: key => {
      try { return JSON.parse(fs.readFileSync(file(key), 'utf8')); } catch { return undefined; }
    },
    set: (key, value) => fs.writeFileSync(file(key), JSON.stringify(value)),
  };
}

function hostOf(site?: string): string | undefined {
  if (!site) return undefined;
  try { return new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`).hostname; } catch { return undefined; }
}

/** Buffer-based Cloudinary upload. overwrite:false, so an image that is already there is never replaced. */
function makeUploader() {
  if (!isCloudinaryConfigured()) {
    throw new Error('--images needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return (buffer: Buffer, publicId: string) =>
    new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { public_id: publicId, overwrite: false, resource_type: 'image' },
          (err, res) => (err || !res ? reject(err ?? new Error('Empty Cloudinary response')) : resolve(res.secure_url))
        )
        .end(buffer);
    });
}

/** Reports must never contain a presigned URL (it carries a credential). */
const forReport = (r: RawClinic): RawClinic => ({
  ...r,
  logoUrl: redactSignedUrl(r.logoUrl),
  photoUrls: r.photoUrls?.map(u => redactSignedUrl(u) ?? u),
});

interface LeanClinic {
  _id: unknown;
  status: string;
  importSource?: string;
  importSourceId?: string;
  name?: { ru?: string };
  phone?: string;
  phone2?: string;
  address?: string;
  city?: string;
  coordinates?: { lat?: number; lng?: number };
}

async function loadExisting(): Promise<ExistingClinic[]> {
  const docs = (await Clinic.find(
    {},
    'name.ru phone phone2 address city coordinates status importSource importSourceId'
  ).lean()) as unknown as LeanClinic[];
  return docs.map(d => ({
    id: String(d._id),
    status: d.status,
    importSource: d.importSource,
    importSourceId: d.importSourceId || undefined,
    nameRu: d.name?.ru ?? '',
    phones: [d.phone, d.phone2].filter((p): p is string => !!p),
    address: d.address,
    city: d.city,
    lat: d.coordinates?.lat,
    lng: d.coordinates?.lng,
  }));
}

async function main() {
  const source = arg('source');
  const write = flag('write');
  const withImages = flag('images');
  const cityFilter = arg('city');
  if (source !== 'osm' && source !== 'website' && source !== 'ydoc' && source !== 'samt') {
    console.error('Usage: npm run ingest -- --source <osm|website|ydoc|samt> [--osm-file f.json] [--input sites.txt] [--listing-url u] [--max-pages n] [--city Душанбе] [--images] [--write]');
    process.exit(1);
  }
  if (withImages && !write) console.warn('--images is ignored in dry-run: nothing is downloaded or uploaded without --write');
  const uploadImages = withImages && write;
  const upload = uploadImages ? makeUploader() : undefined; // fail fast on missing CLOUDINARY_* before spending credits

  // 1. Collect
  let raws: RawClinic[] = [];
  const skippedSources: { url: string; reason: string }[] = [];
  if (source === 'osm') {
    const file = arg('osm-file');
    raws = file ? parseOverpass(JSON.parse(fs.readFileSync(file, 'utf8'))) : await fetchOsmClinics();
  } else if (source === 'website') {
    const input = arg('input');
    if (!input) throw new Error('--input <file with one URL per line> is required for --source website');
    const urls = fs.readFileSync(input, 'utf8').split('\n').map(s => s.trim()).filter(s => /^https?:\/\//.test(s));
    for (const r of await fetchWebsiteClinics(urls)) {
      if (r.record) raws.push(r.record);
      else skippedSources.push({ url: r.url, reason: r.skipped ?? 'unknown' });
    }
  } else {
    const cfg = SOURCE_CONFIG[source];
    const apiKey = process.env.SGAI_API_KEY;
    if (!apiKey) throw new Error(`SGAI_API_KEY is required for --source ${source}`);
    const listingUrl = arg('listing-url') ?? cfg.defaultListingUrl;
    const result = await collectListing({
      listingUrl,
      apiKey,
      maxPages: Number(arg('max-pages') ?? 3),
      delayMs: Number(arg('delay-ms') ?? 1500),
      cache: fileCache(arg('cache-dir') ?? path.resolve('import-output', '.sgai-cache')),
    });
    console.log(`Listing ${cfg.label}: ${result.items.length} clinics from ${result.pages} page(s), stopped: ${result.stoppedBecause}`);
    if (result.stoppedBecause === 'no_new_items' && result.pages >= 2) {
      console.warn(`Page ${result.pages} repeated rows already seen: the site probably ignores ?page=N. Only the first page(s) were collected.`);
    }
    for (const e of result.errors) {
      console.warn(e);
      skippedSources.push({ url: listingUrl, reason: e });
    }
    for (const item of result.items) {
      const r = toRawClinic(item, { source, city: cityFilter ?? cfg.city, pageUrl: listingUrl });
      if (r) raws.push(r);
    }
  }
  console.log(`Collected ${raws.length} raw records from ${source}`);

  // 1b. Presigned image links (samt.tj) die within minutes: grab them NOW, before geocoding and DB work.
  let imageFetch: typeof fetch = fetch;
  const imageErrors: string[] = [];
  if (uploadImages && (source === 'samt' || source === 'ydoc')) {
    const urls = raws.flatMap(r => [r.logoUrl, ...(r.photoUrls ?? [])]).filter((u): u is string => !!u);
    const pre = await prefetchSignedImages(urls, { allowedHosts: [...SOURCE_CONFIG[source].imageHosts] });
    imageFetch = pre.fetch;
    imageErrors.push(...pre.errors);
  }

  // 2. Normalize (+ geocode address-only records that came without coordinates)
  const invalid: { record: RawClinic; reason: string }[] = [];
  const clean: RawClinic[] = [];
  const geoCache = new Map();
  for (const r of raws) {
    let rec = r;
    if (source !== 'osm' && rec.address && rec.lat === undefined) {
      const g = await geocode(rec.address, rec.city, { cache: geoCache });
      await sleep(1100);
      if (g) rec = { ...rec, lat: g.lat, lng: g.lng };
    }
    const n = normalizeRaw(rec);
    if (!n.ok) invalid.push({ record: r, reason: n.reason });
    else if (!cityFilter || n.value.city === cityFilter) clean.push(n.value);
  }

  // 3. Decide against what's already in the DB (and earlier records in this batch)
  let pool: ExistingClinic[] = [];
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    pool = await loadExisting();
    console.log(`Loaded ${pool.length} existing clinics for matching`);
  } else {
    console.warn('MONGODB_URI not set: matching against an EMPTY database (dry-run only)');
    if (write) throw new Error('--write requires MONGODB_URI');
  }

  const buckets = {
    create: [] as { record: RawClinic; decision: Decision }[],
    update: [] as { record: RawClinic; decision: Decision }[],
    review: [] as { record: RawClinic; decision: Decision }[],
    skipped: [] as { record: RawClinic; decision: Decision }[],
  };
  for (const record of clean) {
    let decision = decide(record, pool);
    if (decision.existingId?.startsWith('new:')) {
      decision = { action: 'skip_duplicate', reason: 'duplicate of another record in this batch', existingId: decision.existingId };
    }
    if (decision.action === 'create') {
      buckets.create.push({ record, decision });
      pool.push({
        id: `new:${stableSlug(record)}`, status: 'pre_imported', importSource: record.source,
        importSourceId: record.sourceId, nameRu: record.name, phones: record.phones ?? [],
        address: record.address, city: record.city, lat: record.lat, lng: record.lng,
      });
    } else if (decision.action === 'update') buckets.update.push({ record, decision });
    else if (decision.action === 'review') buckets.review.push({ record, decision });
    else buckets.skipped.push({ record, decision });
  }

  // 4. Write reports (always) and DB (only with --write)
  const outDir = path.resolve('import-output', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [k, v] of Object.entries({ ...buckets, invalid })) {
    const safeRows = (v as { record: RawClinic }[]).map(row => ({ ...row, record: forReport(row.record) }));
    fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify(safeRows, null, 2));
  }

  const written = { created: 0, updated: 0, failed: 0, imagesStored: 0 };
  const imagesFor = async (record: RawClinic, slug: string): Promise<ClinicImages | undefined> => {
    if (!upload || (!record.logoUrl && !record.photoUrls?.length)) return undefined;
    const own = hostOf(record.website);
    const { images, errors } = await importClinicImages({
      slug,
      logoUrl: record.logoUrl,
      photoUrls: record.photoUrls,
      allowedHosts: [...(source === 'samt' || source === 'ydoc' ? SOURCE_CONFIG[source].imageHosts : []), ...(own ? [own] : [])],
      upload,
      fetchImpl: imageFetch,
      maxPhotos: Number(arg('max-images') ?? 2),
    });
    imageErrors.push(...errors.map(e => `${record.name}: ${e}`));
    written.imagesStored += (images.logo ? 1 : 0) + (images.coverImage ? 1 : 0) + (images.photos?.length ?? 0);
    return images;
  };

  if (write) {
    for (const { record } of buckets.create) {
      try {
        const images = await imagesFor(record, stableSlug(record));
        await Clinic.create(toClinicDoc(record, new Date(), images));
        written.created++;
      } catch (e) { written.failed++; console.error(`create failed for "${record.name}": ${msg(e)}`); }
    }
    for (const { record, decision } of buckets.update) {
      try {
        const existing = (await Clinic.findById(decision.existingId).lean()) as (Parameters<typeof fillEmptyPatch>[0] & { slug?: string }) | null;
        // download only when something is actually missing: never touch images a clinic already has
        const needsImages = !!existing && (!existing.logo || !existing.coverImage || !existing.photos?.length);
        const images = existing && needsImages ? await imagesFor(record, existing.slug || stableSlug(record)) : undefined;
        const patch = existing ? fillEmptyPatch(existing, record, images) : {};
        if (Object.keys(patch).length) await Clinic.updateOne({ _id: decision.existingId, status: 'pre_imported' }, { $set: patch });
        written.updated++;
      } catch (e) { written.failed++; console.error(`update failed for "${record.name}": ${msg(e)}`); }
    }
  }

  const report = {
    source, cityFilter: cityFilter ?? null, mode: write ? 'WRITE' : 'DRY-RUN', at: new Date().toISOString(),
    raw: raws.length, invalid: invalid.length,
    toCreate: buckets.create.length, toUpdate: buckets.update.length,
    needsReview: buckets.review.length, skipped: buckets.skipped.length,
    skippedSources: skippedSources.length, imageErrors: imageErrors.length, ...(write ? { written } : {}),
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  if (skippedSources.length) fs.writeFileSync(path.join(outDir, 'skipped-sources.json'), JSON.stringify(skippedSources, null, 2));
  if (imageErrors.length) fs.writeFileSync(path.join(outDir, 'image-errors.json'), JSON.stringify(imageErrors, null, 2));
  console.log(report);
  console.log(`Reports: ${outDir}`);
  if (mongoose.connection.readyState) await mongoose.disconnect();
  process.exit(write && written.failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
