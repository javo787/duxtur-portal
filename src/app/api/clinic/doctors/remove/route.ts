import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clinicId, doctorId } = await request.json();

    if (!clinicId || !doctorId) {
      return NextResponse.json({ error: 'clinicId and doctorId are required' }, { status: 400 });
    }

    await dbConnect();

    const clinic = await Clinic.findOne({ _id: clinicId, userId: session.user?.id });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found or not owned by user' }, { status: 404 });
    }

    await Clinic.findByIdAndUpdate(clinicId, {
      $pull: { doctorIds: doctorId }
    });

    await Doctor.findByIdAndUpdate(doctorId, {
      $set: { clinicId: null }
    });

    // Recalculate clinic stats
    const { recalculateClinicRating } = await import('@/app/actions/clinic');
    await recalculateClinicRating(clinicId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
