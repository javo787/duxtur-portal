import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import mongoose from 'mongoose';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');

  if (!doctorId) return NextResponse.json({ error: 'Missing doctorId' }, { status: 400 });

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  await dbConnect();
  const reviews = await Review.find({ doctorId, isVerified: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = rateLimit(ip, 3, 60 * 1000); // 3 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { doctorId, rating, text, isAnonymous } = await request.json();

    if (!doctorId || !rating || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const review = await Review.create({
      doctorId,
      clinicId: doctor.clinicId || undefined,
      patientId: session.user?.id,
      rating,
      text,
      isAnonymous: isAnonymous ?? true,
      isVerified: false, // Default to false, needs admin approval
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
