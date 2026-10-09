import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { listPublicReviews } from '@/lib/review-service';
import { postReview } from '@/lib/review-http';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    const clinic = await Clinic.findOne({ slug });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const reviews = await listPublicReviews({ clinicId: clinic._id }, { limit: 20, withDoctorName: true });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Clinic reviews fetch error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return postReview(request, () => ({ kind: 'clinic', slug }));
}
