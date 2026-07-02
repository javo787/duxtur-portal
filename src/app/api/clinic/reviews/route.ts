import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    if (!clinicId) return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
    await dbConnect();
    const clinic = await Clinic.findOne({ _id: clinicId, userId: session.user?.id });
    if (!clinic) return NextResponse.json({ error: 'Clinic not found or not owned by user' }, { status: 404 });
    const reviews = await Review.find({ clinicId })
      .populate({ path: 'doctorId', model: Doctor, select: 'name' })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(reviews);
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
