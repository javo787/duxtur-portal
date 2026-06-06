import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { generateSlug } from '@/lib/utils';

// ── Типы ──────────────────────────────────────────────────────────────────────
interface RawClinic {
  name: string;
  address?: string;
  logoUrl?: string;
  profileUrl?: string;
  doctorCount?: number;
  reviewCount?: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  clinics: string[];
}

// ── Геокодирование через Nominatim (бесплатно, 0 кредитов) ───────────────────
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, Душанбе, Таджикистан`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'duxtur.org/1.0 medical portal Tajikistan' },
      }
    );
    const data = await res.json();
    if (data?.[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Загрузить лого на Cloudinary через URL ────────────────────────────────────
async function uploadLogoToCloudinary(
  imageUrl: string,
  slug: string
): Promise<string> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    // Cloudinary upload через fetch (без SDK — работает на Vercel edge)
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'duxtur/clinics/logos');
    formData.append('public_id', `clinic-${slug}`);
    formData.append('overwrite', 'false');

    // Используем signed upload
    const timestamp = Math.round(Date.now() / 1000).toString();
    const paramsToSign = `folder=duxtur/clinics/logos&overwrite=false&public_id=clinic-${slug}&timestamp=${timestamp}`;

    // Подпись через crypto
    const { createHmac } = await import('crypto');
    const signature = createHmac('sha256', apiSecret)
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const uploadData = new URLSearchParams();
    uploadData.append('file', imageUrl);
    uploadData.append('api_key', apiKey);
    uploadData.append('timestamp', timestamp);
    uploadData.append('signature', signature);
    uploadData.append('folder', 'duxtur/clinics/logos');
    uploadData.append('public_id', `clinic-${slug}`);
    uploadData.append('overwrite', 'false');

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadData,
      }
    );

    const result = await uploadRes.json();
    return result.secure_url || '';
  } catch (e) {
    console.error('Cloudinary upload error:', e);
    return '';
  }
}

// ── Перевод названия (простой вариант через твой translateText) ───────────────
async function translateClinicName(name: string) {
  try {
    const { translateText } = await import('@/lib/translation-service');
    return await translateText(name);
  } catch {
    // Fallback — везде одно название
    return { ru: name, uz: name, tg: name, kk: name, ky: name };
  }
}

// ── Скрапинг листинга ydoc ────────────────────────────────────────────────────
async function scrapeYdocListing(): Promise<RawClinic[]> {
  const apiKey = process.env.SGAI_API_KEY;
  if (!apiKey) throw new Error('SGAI_API_KEY не найден');

  const res = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SGAI-APIKEY': apiKey,
    },
    body: JSON.stringify({
      url: 'https://ydoc.tj/dushanbe/top/medcentr/',
      prompt: `
        Extract all medical clinics from this page as a JSON array.
        For each clinic return these fields:
        - name: string (full clinic name in Russian, e.g. "Клиника «Vedanta»")
        - address: string (street address only, e.g. "ул. Мехнат 10")
        - logoUrl: string (full absolute URL of the clinic logo/photo image, starts with https://ydoc.tj/media/...)
        - profileUrl: string (full absolute URL to the clinic page on ydoc.tj, starts with https://ydoc.tj/dushanbe/lpu/...)
        - doctorCount: number (number of doctors)
        - reviewCount: number (number of reviews, 0 if none)
        Return ONLY a valid JSON array. No explanations, no markdown.
      `,
    }),
  });

  const data = await res.json();

  const items = data.result ?? data.json?.items;
if (!Array.isArray(items)) {
  throw new Error(`Неожиданный ответ от SGAI: ${JSON.stringify(data)}`);
}
return items;
}

// ── Главная функция импорта ───────────────────────────────────────────────────
export async function importClinics(): Promise<ImportResult> {
  await dbConnect();

  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    clinics: [],
  };

  // 1. Скрапим листинг
  let rawClinics: RawClinic[] = [];
  try {
    rawClinics = await scrapeYdocListing();
  } catch (e: any) {
    result.errors.push(`Скрапинг не удался: ${e.message}`);
    return result;
  }

  if (rawClinics.length === 0) {
    result.errors.push('Скрапер вернул пустой список');
    return result;
  }

  // 2. Обрабатываем каждую клинику
  for (const raw of rawClinics) {
    if (!raw.name) {
      result.errors.push('Клиника без имени — пропущена');
      continue;
    }

    try {
      const slug = generateSlug(raw.name);

      // Проверка дублей
      const exists = await Clinic.findOne({ slug });
      if (exists) {
        result.skipped++;
        continue;
      }

      // Перевод названия
      const translatedName = await translateClinicName(raw.name);

      // Лого на Cloudinary
      let logoUrl = '';
      if (raw.logoUrl) {
        logoUrl = await uploadLogoToCloudinary(raw.logoUrl, slug);
      }

      // Координаты через Nominatim
      let coordinates = undefined;
      if (raw.address) {
        const geo = await geocodeAddress(raw.address);
        if (geo) {
          coordinates = {
            lat: geo.lat,
            lng: geo.lng,
            type: 'Point' as const,
            coordinates: [geo.lng, geo.lat],
          };
        }
      }

      // Сохраняем в MongoDB
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
      });

      result.imported++;
      result.clinics.push(raw.name);

      // Пауза между запросами к Nominatim (их лимит: 1 req/sec)
      await new Promise((r) => setTimeout(r, 1100));

    } catch (e: any) {
      result.errors.push(`${raw.name}: ${e.message}`);
    }
  }

  result.success = true;
  return result;
}
