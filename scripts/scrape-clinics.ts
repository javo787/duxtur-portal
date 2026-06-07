
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';

// Colors
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
  blue:   '\x1b[34m',
};

const log = {
  info:    (msg: string) => console.log(`${C.cyan}i${C.reset}  ${msg}`),
  success: (msg: string) => console.log(`${C.green}OK${C.reset} ${msg}`),
  warn:    (msg: string) => console.log(`${C.yellow}!!${C.reset} ${msg}`),
  error:   (msg: string) => console.log(`${C.red}XX${C.reset} ${msg}`),
  step:    (msg: string) => console.log(`${C.blue}>>${C.reset} ${C.bold}${msg}${C.reset}`),
  dim:     (msg: string) => console.log(`${C.gray}   ${msg}${C.reset}`),
  divider: ()            => console.log(`${C.gray}${'='.repeat(55)}${C.reset}`),
};

interface RawClinic {
  name: string;
  address?: string;
  logoUrl?: string;
  profileUrl?: string;
  doctorCount?: number;
  reviewCount?: number;
}

interface ImportStats {
  total:    number;
  imported: number;
  skipped:  number;
  failed:   number;
  errors:   { clinic: string; reason: string }[];
}

// MongoDB connect
async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found in .env');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
}

// Inline Clinic schema (no import needed)
const MultilingualString = {
  ru: { type: String, default: '' },
  uz: { type: String, default: '' },
  kk: { type: String, default: '' },
  ky: { type: String, default: '' },
  tg: { type: String, default: '' },
};

const ClinicSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:         MultilingualString,
  slug:         { type: String, unique: true, required: true },
  type:         { type: String, default: 'clinic' },
  status:       { type: String, default: 'pre_imported' },
  logo:         { type: String, default: '' },
  city:         { type: String, default: '' },
  address:      { type: String, default: '' },
  phone:        { type: String, default: '' },
  website:      { type: String, default: '' },
  coordinates: {
    lat:         { type: Number },
    lng:         { type: Number },
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  importSource:    { type: String, default: 'ydoc' },
  importedAt:      { type: Date },
  rating:          { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  profileViews:    { type: Number, default: 0 },
  accentColor:     { type: String, default: '#2563eb' },
  specialties:     { type: [String], default: [] },
  services:        [{ name: MultilingualString, price: { type: Number, default: 0 }, currency: { type: String, default: 'TJS' } }],
  amenities:       { type: [String], default: [] },
  insurance:       { type: [String], default: [] },
  doctorIds:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  licenseNumber:   { type: String, default: '' },
  licenseDocument: { type: String, default: '' },
  description:     MultilingualString,
  quote:           MultilingualString,
  history:         MultilingualString,
  coverImage:      { type: String, default: '' },
  photos:          { type: [String], default: [] },
}, { timestamps: true });

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);

// Slug generator
function generateSlug(name: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d',
    'е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n',
    'о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
    'ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'',
    'э':'e','ю':'yu','я':'ya',
  };
  const base = name
    .toLowerCase()
    .split('')
    .map((c: string) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
  const suffix = Math.random().toString(36).substring(2, 6);
  return base + '-' + suffix;
}

// Translate via Google (free, no key needed)
async function translateName(text: string): Promise<Record<string, string>> {
  const langs = ['uz', 'tg', 'kk', 'ky'];
  const result: Record<string, string> = { ru: text };
  for (const lang of langs) {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=' + lang + '&dt=t&q=' + encodeURIComponent(text);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json();
      result[lang] = data?.[0]?.map((x: any) => x[0]).join('') || text;
      await sleep(300);
    } catch {
      result[lang] = text;
    }
  }
  return result;
}

// Geocode via Nominatim (free)
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(address + ', Khujand, Tajikistan');
    const res = await fetch(
      'https://nominatim.openstreetmap.org/search?q=' + q + '&format=json&limit=1',
      { headers: { 'User-Agent': 'duxtur.org/1.0 medical portal' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

// Upload logo to Cloudinary
async function uploadLogo(imageUrl: string, publicId: string): Promise<string> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey    = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder    = 'duxtur/clinics/logos';
    const pub_id    = 'clinic-' + publicId;
    const { createHash } = await import('crypto');
    const paramStr  = 'folder=' + folder + '&overwrite=false&public_id=' + pub_id + '&timestamp=' + timestamp + apiSecret;
    const signature = createHash('sha1').update(paramStr).digest('hex');
    const body = new URLSearchParams({
      file: imageUrl, api_key: apiKey, timestamp,
      signature, folder, public_id: pub_id, overwrite: 'false',
    });
    const res  = await fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/image/upload', { method: 'POST', body });
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    log.warn('Cloudinary: ' + (json.error?.message || 'error') + ' — using original URL');
    return imageUrl;
  } catch (e: any) {
    log.warn('Cloudinary failed: ' + e.message + ' — using original URL');
    return imageUrl;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Scrape ydoc listing with pagination
async function scrapeYdoc(): Promise<RawClinic[]> {
  const apiKey = process.env.SGAI_API_KEY;
  if (!apiKey) throw new Error('SGAI_API_KEY not found');
  const prompt = `Extract all medical clinics as JSON array. Each item:
- name: string (Russian, full name)
- address: string (street address)
- logoUrl: string (full https://ydoc.tj/media/... URL)
- profileUrl: string (full ydoc.tj clinic URL)
- doctorCount: number
- reviewCount: number (0 if none)
Return ONLY valid JSON array, no markdown.`;
  const baseUrl = 'https://ydoc.tj/hudzhand/lpu/';
  const pages = 3;
  const allClinics: RawClinic[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? baseUrl : baseUrl + '?page=' + page;
    log.step('Scraping page ' + page + '/' + pages + ': ' + url);
    try {
      const res = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'SGAI-APIKEY': apiKey },
        body: JSON.stringify({ url, prompt }),
      });
      const data = await res.json();
      const items = data.result ?? data.json?.items;
      if (!Array.isArray(items)) {
        log.warn('Page ' + page + ' unexpected — skipping');
        continue;
      }
      log.success('Page ' + page + ': ' + items.length + ' clinics');
      allClinics.push(...items);
      if (page < pages) await sleep(1000);
    } catch (e: any) {
      log.error('Page ' + page + ' failed: ' + e.message);
    }
  }
  return allClinics;
}

async function main() {
  console.log('');
  log.divider();
  console.log('  DUXTUR.ORG -- Clinic Import Tool');
  console.log('  Source: ydoc.tj/hudzhand/lpu/ (3 pages)');
  log.divider();
  console.log('');

  const startTime = Date.now();
  const stats: ImportStats = { total: 0, imported: 0, skipped: 0, failed: 0, errors: [] };

  // Connect DB
  log.step('Connecting to MongoDB...');
  try {
    await connectDB();
    log.success('MongoDB connected');
  } catch (e: any) {
    log.error('MongoDB: ' + e.message);
    process.exit(1);
  }

  log.divider();

  // Scrape
  let clinics: RawClinic[] = [];
  try {
    clinics = await scrapeYdoc();
    stats.total = clinics.length;
    log.success('Found ' + clinics.length + ' clinics total');
  } catch (e: any) {
    log.error('Scraping failed: ' + e.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  log.divider();

  // Process each clinic
  for (let i = 0; i < clinics.length; i++) {
    const raw = clinics[i];
    const num = '[' + (i + 1) + '/' + clinics.length + ']';

    if (!raw.name) {
      log.warn(num + ' No name — skipped');
      stats.skipped++;
      continue;
    }

    console.log('');
    console.log(C.bold + num + ' ' + raw.name + C.reset);

    try {
      // Check duplicate
      const existingByName = await Clinic.findOne({ 'name.ru': raw.name });
      if (existingByName) {
        log.warn('   Already exists — skipped');
        stats.skipped++;
        continue;
      }

      const slug = generateSlug(raw.name);

      // Translate
      log.dim('Translating name...');
      const translatedName = await translateName(raw.name);

      // Logo
      let logoUrl = '';
      if (raw.logoUrl) {
        log.dim('Uploading logo to Cloudinary...');
        logoUrl = await uploadLogo(raw.logoUrl, slug.substring(0, 40));
        log.dim('Logo done');
      }

      // Geocode
      let coordinates = undefined;
      if (raw.address) {
        log.dim('Geocoding: ' + raw.address);
        await sleep(1100);
        const geo = await geocode(raw.address);
        if (geo) {
          coordinates = {
            lat: geo.lat,
            lng: geo.lng,
            type: 'Point' as const,
            coordinates: [geo.lng, geo.lat],
          };
          log.dim('Coords: ' + geo.lat.toFixed(4) + ', ' + geo.lng.toFixed(4));
        } else {
          log.dim('Coordinates not found');
        }
      }

      // Save
      await Clinic.create({
        userId:       undefined,
        name:         translatedName,
        slug,
        address:      raw.address || '',
        city:         'Худжанд',
        logo:         logoUrl,
        type:         'clinic',
        status:       'pre_imported',
        ...(coordinates ? { coordinates } : {}),
        importSource: 'ydoc',
        importedAt:   new Date(),
        rating:       { avg: 0, count: raw.reviewCount || 0 },
      });

      log.success('   Saved to MongoDB');
      stats.imported++;

    } catch (e: any) {
      log.error('   Error: ' + e.message);
      stats.failed++;
      stats.errors.push({ clinic: raw.name, reason: e.message });
    }

    if (i < clinics.length - 1) await sleep(500);
  }

  // Summary
  const duration = Date.now() - startTime;
  console.log('');
  log.divider();
  console.log('  IMPORT RESULTS');
  log.divider();
  console.log('  ' + C.green + 'Imported: ' + C.reset + stats.imported);
  console.log('  ' + C.yellow + 'Skipped:  ' + C.reset + stats.skipped + ' (already exist)');
  console.log('  ' + C.red + 'Failed:   ' + C.reset + stats.failed);
  console.log('  ' + C.gray + 'Time:     ' + C.reset + (duration / 1000).toFixed(1) + 's');

  if (stats.errors.length > 0) {
    console.log('');
    console.log(C.red + '  Errors:' + C.reset);
    stats.errors.forEach(e => {
      console.log('  - ' + e.clinic + ': ' + e.reason);
    });
  }

  log.divider();
  console.log('');

  await mongoose.disconnect();
  log.success('Done. MongoDB disconnected.');
  console.log('');
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(e => {
  log.error('Fatal error: ' + e.message);
  process.exit(1);
});