/**
 * One-off cleanup: scraped/pre_imported clinics must not carry rating data
 * copied from another site. Resets rating to {avg:0,count:0}.
 * Dry-run by default; pass --write to apply.
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import mongoose from 'mongoose';
import Clinic from '../src/models/Clinic';

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const filter = {
    status: 'pre_imported',
    // older imports have no dataSource field, so match on the import source instead
    importSource: { $in: ['ydoc', 'samt', '2gis', 'osm', 'website'] },
    $or: [{ 'rating.count': { $gt: 0 } }, { 'rating.avg': { $gt: 0 } }],
  };
  const n = await Clinic.countDocuments(filter);
  console.log(`${n} pre_imported clinics carry imported rating data`);
  if (process.argv.includes('--write') && n > 0) {
    const r = await Clinic.updateMany(filter, { $set: { 'rating.avg': 0, 'rating.count': 0 } });
    console.log(`Reset ${r.modifiedCount} clinics`);
  } else if (n > 0) console.log('Dry-run. Re-run with --write to apply.');
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
