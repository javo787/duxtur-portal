// scripts/scrape-clinics.ts
import dbConnect from '../src/lib/mongodb';
import Clinic from '../src/models/Clinic';
import { generateSlug } from '../src/lib/utils';
import { translateText } from '../src/lib/translation-service';
import dotenv from 'dotenv';

dotenv.config();

const SGAI_API_KEY = process.env.SGAI_API_KEY;

if (!SGAI_API_KEY) {
  console.error('SGAI_API_KEY is not defined in environment variables');
}

async function extractFromUrl(url: string, prompt: string) {
  if (!SGAI_API_KEY) return null;

  try {
    const res = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': SGAI_API_KEY,
      },
      body: JSON.stringify({ url, prompt }),
    });
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error(`Error extracting from ${url}:`, error);
    return null;
  }
}

async function scrape2GIS() {
  const url = 'https://2gis.tj/dushanbe/search/клиника';
  const prompt = `
    Extract all medical clinics from this page.
    For each clinic return JSON array with fields:
    name (string, Russian),
    address (string),
    phone (string),
    type (one of: clinic, hospital, dental_clinic, diagnostic_center, polyclinic),
    workingHours (object with open and close time if available).
    Return only JSON array, no extra text.
  `;
  return await extractFromUrl(url, prompt);
}

async function scrapeYdoc() {
  const url = 'https://ydoc.tj/clinics';
  const prompt = `
    Extract all clinics listed on this page.
    For each return JSON array:
    name (Russian), address, phone, website, specialties (array of strings).
    Return only JSON array.
  `;
  return await extractFromUrl(url, prompt);
}

interface RawClinic {
  name: string;
  address?: string;
  phone?: string;
  type?: string;
  specialties?: string[];
  source: string;
}

async function importClinics() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const [clinics2gis, clinicsYdoc] = await Promise.all([
      scrape2GIS(),
      scrapeYdoc(),
    ]);

    const all: RawClinic[] = [
      ...(Array.isArray(clinics2gis) ? clinics2gis.map((c) => ({ ...c, source: '2gis' })) : []),
      ...(Array.isArray(clinicsYdoc) ? clinicsYdoc.map((c) => ({ ...c, source: 'ydoc' })) : []),
    ];

    let imported = 0;
    let skipped = 0;

    for (const raw of all) {
      try {
        const slug = generateSlug(raw.name);

        // Пропускаем дубликаты
        const exists = await Clinic.findOne({ slug });
        if (exists) {
          skipped++;
          continue;
        }

        const translatedName = await translateText(raw.name);

        await Clinic.create({
          userId: null,
          name: translatedName,
          slug,
          phone: raw.phone || '',
          address: raw.address || '',
          city: 'Душанбе',
          type: raw.type || 'clinic',
          specialties: raw.specialties || [],
          status: 'pre_imported',
          importSource: raw.source,
          importedAt: new Date(),
        });

        imported++;
        console.log(`✅ ${raw.name}`);
      } catch (e) {
        console.error(`❌ ${raw.name}:`, e);
      }
    }

    console.log(`\nГотово: импортировано ${imported}, пропущено ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importClinics();
