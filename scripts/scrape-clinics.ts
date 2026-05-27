// scripts/scrape-clinics.ts
import dbConnect from '../src/lib/mongodb';
import Clinic from '../src/models/Clinic';
import { generateSlug } from '../src/lib/utils';
import { translateText } from '../src/lib/translation-service';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ── Cloudinary config ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const SGAI_API_KEY = process.env.SGAI_API_KEY!;

// ── Загрузить лого с ydoc на Cloudinary ───────────────────────────────────
async function uploadLogoFromUrl(imageUrl: string, clinicSlug: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'duxtur/clinics/logos',
      public_id: `clinic-${clinicSlug}`,
      overwrite: false,
      transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
    });
    return result.secure_url;
  } catch (e) {
    console.warn(`  ⚠️  Лого не загрузилось: ${imageUrl}`);
    return '';
  }
}

// ── Геокодирование через Nominatim (бесплатно) ────────────────────────────
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, Душанбе, Таджикистан`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'duxtur.org medical portal' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Скрапинг листинга ydoc ────────────────────────────────────────────────
async function scrapeYdocListing(): Promise<any[]> {
  const res = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SGAI-APIKEY': SGAI_API_KEY,
    },
    body: JSON.stringify({
      url: 'https://ydoc.tj/dushanbe/top/medcentr/',
      prompt: `
        Extract all medical clinics from this page as a JSON array.
        For each clinic return:
        - name: string (Russian, e.g. "Клиника «Vedanta»")
        - address: string (street address)
        - logoUrl: string (full URL of the clinic photo/logo image)
        - profileUrl: string (full URL to the clinic profile page on ydoc.tj)
        - doctorCount: number
        - reviewCount: number
        Return ONLY a JSON array, no extra text.
      `,
    }),
  });
  const data = await res.json();
  return Array.isArray(data.result) ? data.result : [];
}

// ── Скрапинг страницы клиники для телефона ────────────────────────────────
async function scrapeClinicDetail(profileUrl: string): Promise<{ phone?: string; website?: string }> {
  try {
    const res = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': SGAI_API_KEY,
      },
      body: JSON.stringify({
        url: profileUrl,
        prompt: `
          Extract from this clinic page:
          - phone: string (phone number)
          - website: string (website URL if present)
          Return only JSON object.
        `,
      }),
    });
    const data = await res.json();
    return data.result || {};
  } catch {
    return {};
  }
}

// ── Главная функция ───────────────────────────────────────────────────────
async function importClinics() {
  await dbConnect();
  console.log('✅ MongoDB подключён\n');

  console.log('🔍 Скрапим ydoc.tj...');
  const clinics = await scrapeYdocListing();
  console.log(`📋 Найдено клиник: ${clinics.length}\n`);

  let imported = 0;
  let skipped = 0;

  for (const raw of clinics) {
    console.log(`\n─── ${raw.name} ───`);

    const slug = generateSlug(raw.name);

    const exists = await Clinic.findOne({ slug });
    if (exists) {
      console.log(`  ⏭️  Уже существует`);
      skipped++;
      continue;
    }

    // 1. Переводим название
    const translatedName = await translateText(raw.name);

    // 2. Загружаем лого на Cloudinary
    let logoUrl = '';
    if (raw.logoUrl) {
      console.log(`  🖼️  Загружаем лого...`);
      logoUrl = await uploadLogoFromUrl(raw.logoUrl, slug);
    }

    // 3. Геокодируем адрес
    let coordinates = undefined;
    if (raw.address) {
      console.log(`  📍 Геокодируем: ${raw.address}`);
      const geo = await geocodeAddress(raw.address);
      if (geo) {
        coordinates = {
          lat: geo.lat,
          lng: geo.lng,
          type: 'Point' as const,
          coordinates: [geo.lng, geo.lat],
        };
        console.log(`     → ${geo.lat}, ${geo.lng}`);
      }
    }

    // 4. Получаем телефон со страницы клиники (опционально — тратит кредиты)
    // Раскомментируй если хочешь телефоны:
    // let details = {};
    // if (raw.profileUrl) {
    //   console.log(`  📞 Получаем телефон...`);
    //   details = await scrapeClinicDetail(raw.profileUrl);
    // }

    // 5. Сохраняем в MongoDB
    await Clinic.create({
      userId: null,
      name: translatedName,
      slug,
      address: raw.address || '',
      city: 'Душанбе',
      logo: logoUrl,
      type: 'clinic',
      status: 'pre_imported',
      coordinates,
      importSource: 'ydoc',
      importedAt: new Date(),
      // phone: (details as any).phone || '',
      // website: (details as any).website || '',
    });

    console.log(`  ✅ Импортировано`);
    imported++;

    // Небольшая пауза между запросами
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n════════════════════════════════`);
  console.log(`✅ Импортировано: ${imported}`);
  console.log(`⏭️  Пропущено:    ${skipped}`);
  process.exit(0);
}

importClinics().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
