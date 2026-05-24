import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
