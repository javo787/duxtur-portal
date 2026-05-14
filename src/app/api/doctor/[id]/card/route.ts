import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  const lang = req.nextUrl.searchParams.get('lang') || 'ru';

  const doctor = await Doctor.findOne({ slug: id }).lean() as any;
  if (!doctor) return new NextResponse('Not found', { status: 404 });

  const articlesCount = await Article.countDocuments({ author: doctor._id, published: true });

  // Возвращаем JSON с нужными данными для клиентской генерации PDF
return NextResponse.json({
  name: doctor.name,
  image: doctor.image || null,
  specialty: doctor.specialty,
  specialization: doctor.specialization,
  workplace: doctor.workplace || '',
  experience: doctor.experience || 0,
  languages: doctor.languages || [],
  phone: doctor.phone || '',
  bio: doctor.bio || '',
  instagram: doctor.instagram || '',
  telegram: doctor.telegram || '',
  whatsapp: doctor.whatsapp || '',
  workingHours: doctor.workingHours || '',
  accentColor: doctor.accentColor || '#2563eb',
  cardTheme: doctor.cardTheme || 'dark',
  articlesCount,
  slug: doctor.slug,
});

// POST — обновляем счётчик скачиваний
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  await Doctor.updateOne({ slug: id }, { $inc: { downloadsCount: 1 } });
  return NextResponse.json({ ok: true });
}
