import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import { rateLimit } from '@/lib/rate-limit';

type Lang = 'ru' | 'uz' | 'kk' | 'ky' | 'tg';

/** Safely resolve a multilingual field to a plain string */
function t(field: unknown, lang: Lang): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    const f = field as Record<string, string>;
    return f[lang] || f.ru || '';
  }
  return '';
}

const VALID_LANGS: Lang[] = ['ru', 'uz', 'kk', 'ky', 'tg'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();

  const { id } = await params;
  const rawLang = req.nextUrl.searchParams.get('lang') ?? 'ru';
  const lang: Lang = VALID_LANGS.includes(rawLang as Lang) ? (rawLang as Lang) : 'ru';

  const doctor = await Doctor.findOne({
    $or: [
      { slug: id },
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
    ],
  }).lean() as any;

  if (!doctor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const articlesCount = await Article.countDocuments({ authorId: doctor._id });

  return NextResponse.json({
    name:         doctor.name            ?? '',
    image:        doctor.image           ?? null,
    specialty:    t(doctor.specialty,  lang),
    workplace:    t(doctor.workplace,  lang),
    bio:          t(doctor.bio,        lang),
    experience:   doctor.experience      ?? 0,
    languages:    doctor.languages       ?? [],
    phone:        doctor.phone           ?? '',
    instagram:    doctor.instagram       ?? '',
    telegram:     doctor.telegram        ?? '',
    whatsapp:     doctor.whatsapp        ?? '',
    workingHours: doctor.workingHours    ?? '',
    accentColor:  doctor.accentColor     ?? '#2563eb',
    cardTheme:    doctor.cardTheme       ?? 'dark',
    articlesCount,
    slug:         doctor.slug            ?? '',
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  await connectToDatabase();

  const { id } = await params;

  const result = await Doctor.updateOne(
    { slug: id },
    { $inc: { downloadsCount: 1 } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
