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

  const doctor = await Doctor.findOne({
    $or: [{ slug: id }, ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : [])],
  }).lean() as any;
  if (!doctor) return new NextResponse('Not found', { status: 404 });

  const articlesCount = await Article.countDocuments({ authorId: doctor._id });

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
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  await Doctor.updateOne({ slug: id }, { $inc: { downloadsCount: 1 } });
  return NextResponse.json({ ok: true });
}
