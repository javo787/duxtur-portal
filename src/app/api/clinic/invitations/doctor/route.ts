import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClinicInvitation from '@/models/ClinicInvitation';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const invitations = await ClinicInvitation.find({
      doctorId: doctor._id
    }).populate({
      path: 'clinicId',
      model: 'Clinic',
      select: 'name logo city type slug doctorIds'
    }).sort({ createdAt: -1 });

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error('Doctor invitations fetch error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
