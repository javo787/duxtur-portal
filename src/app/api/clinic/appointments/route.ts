import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const clinic = await Clinic.findOne({ userId: session.user?.id });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const appointments = await Appointment.find({
      doctorId: { $in: clinic.doctorIds }
    }).populate({
      path: 'doctorId',
      model: Doctor,
      select: 'name specialty'
    }).sort({ date: -1, timeSlot: -1 });

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Clinic appointments fetch error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
