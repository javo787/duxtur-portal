import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Review from '@/models/Review';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = rateLimit(ip, 3, 60 * 1000); // 3 per minute
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { slug } = await params;
    const { rating, text, isAnonymous } = await request.json();

    if (!rating || !text) {
      return NextResponse.json({ error: 'Rating and text are required' }, { status: 400 });
    }

    await dbConnect();

    const clinic = await Clinic.findOne({ slug });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const review = await Review.create({
      clinicId: clinic._id,
      patientId: session.user?.id,
      rating,
      text,
      isAnonymous: !!isAnonymous,
      isVerified: false // Requires admin approval
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Clinic review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
