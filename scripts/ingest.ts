/**
 * Clinic ingest CLI. DRY-RUN BY DEFAULT: nothing is written to MongoDB unless --write is passed.
 *
 *   npm run ingest -- --source osm                       # fetch OSM via Overpass
 *   npm run ingest -- --source osm --osm-file osm.json   # use a saved Overpass response
 *   npm run ingest -- --source website --input sites.txt # one clinic website URL per line
 *   add --city Душанбе to limit to one city, --write to save to MongoDB
 *
 * Output: import-output/<timestamp>/{create,update,review,skipped,invalid}.json + report.json
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import Clinic from '../src/models/Clinic';
import { fetchOsmClinics, parseOverpass } from '../src/lib/ingest/adapters/osm';
import { fetchWebsiteClinics } from '../src/lib/ingest/adapters/website';
import { geocode } from '../src/lib/ingest/geocode';
import { normalizeRaw, stableSlug } from '../src/lib/ingest/normalize';
import { decide } from '../src/lib/ingest/dedupe';
import { toClinicDoc, fillEmptyPatch } from '../src/lib/ingest/writer';
import type { Decision, ExistingClinic, RawClinic } from '../src/lib/ingest/types';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

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
  const cityFilter = arg('city');
  if (source !== 'osm' && source !== 'website') {
    console.error('Usage: npm run ingest -- --source <osm|website> [--osm-file f.json] [--input sites.txt] [--city Душанбе] [--write]');
    process.exit(1);
  }

  // 1. Collect
  let raws: RawClinic[] = [];
  const skippedSources: { url: string; reason: string }[] = [];
  if (source === 'osm') {
    const file = arg('osm-file');
    raws = file ? parseOverpass(JSON.parse(fs.readFileSync(file, 'utf8'))) : await fetchOsmClinics();
  } else {
    const input = arg('input');
    if (!input) throw new Error('--input <file with one URL per line> is required for --source website');
    const urls = fs.readFileSync(input, 'utf8').split('\n').map(s => s.trim()).filter(s => /^https?:\/\//.test(s));
    for (const r of await fetchWebsiteClinics(urls)) {
      if (r.record) raws.push(r.record);
      else skippedSources.push({ url: r.url, reason: r.skipped ?? 'unknown' });
    }
  }
  console.log(`Collected ${raws.length} raw records from ${source}`);

  // 2. Normalize (+ geocode address-only website records)
  const invalid: { record: RawClinic; reason: string }[] = [];
  const clean: RawClinic[] = [];
  const geoCache = new Map();
  for (const r of raws) {
    let rec = r;
    if (source === 'website' && rec.address && rec.lat === undefined) {
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
    fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify(v, null, 2));
  }

  const written = { created: 0, updated: 0, failed: 0 };
  if (write) {
    for (const { record } of buckets.create) {
      try { await Clinic.create(toClinicDoc(record)); written.created++; }
      catch (e) { written.failed++; console.error(`create failed for "${record.name}": ${msg(e)}`); }
    }
    for (const { record, decision } of buckets.update) {
      try {
        const existing = (await Clinic.findById(decision.existingId).lean()) as Parameters<typeof fillEmptyPatch>[0] | null;
        const patch = existing ? fillEmptyPatch(existing, record) : {};
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
    skippedSources: skippedSources.length, ...(write ? { written } : {}),
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  if (skippedSources.length) fs.writeFileSync(path.join(outDir, 'skipped-sources.json'), JSON.stringify(skippedSources, null, 2));
  console.log(report);
  console.log(`Reports: ${outDir}`);
  if (mongoose.connection.readyState) await mongoose.disconnect();
  process.exit(write && written.failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
