/**
 * scripts/migrate-doctor-fields.ts
 * 
 * Запуск: npx tsx scripts/migrate-doctor-fields.ts
 * 
 * Конвертирует legacy String поля (specialty, bio, workplace, education)
 * в MultilingualObject {ru, uz, kk, ky, tg} для всех врачей в БД.
 */

import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MONGODB_URI = process.env.MONGODB_URI || '';
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';

if (!MONGODB_URI) throw new Error('Set MONGODB_URI in env');
if (!GOOGLE_AI_KEY) throw new Error('Set GOOGLE_AI_KEY in env');

const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY.replace(/["']/g, '').trim());
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function translateText(text: string) {
  if (!text?.trim()) return { ru: '', uz: '', kk: '', ky: '', tg: '' };

  const prompt = `Translate "${text.replace(/"/g, "'")}" into 5 languages.
Return ONLY valid JSON: {"ru":"...","uz":"...","kk":"...","ky":"...","tg":"..."}
ru=Russian, uz=Uzbek(Latin), kk=Kazakh(Cyrillic), ky=Kyrgyz(Cyrillic), tg=Tajik(Cyrillic ONLY)`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON');
    return JSON.parse(raw.substring(start, end + 1));
  } catch {
    return { ru: text, uz: text, kk: text, ky: text, tg: text };
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', new mongoose.Schema({}, { strict: false }));
  const doctors = await Doctor.find({}).lean() as any[];

  console.log(`Found ${doctors.length} doctors`);

  const FIELDS = ['specialty', 'bio', 'workplace', 'education'] as const;

  for (const doctor of doctors) {
    const updates: Record<string, any> = {};
    let needsUpdate = false;

    for (const field of FIELDS) {
      const val = doctor[field];
      if (typeof val === 'string' && val.trim()) {
        console.log(`  [${doctor.name}] Translating ${field}: "${val.substring(0, 40)}"`);
        updates[field] = await translateText(val);
        needsUpdate = true;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (needsUpdate) {
      await Doctor.updateOne({ _id: doctor._id }, { $set: updates });
      console.log(`  ✓ Updated ${doctor.name}`);
    } else {
      console.log(`  - ${doctor.name}: already multilingual, skipping`);
    }
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
}

main().catch(console.error);
