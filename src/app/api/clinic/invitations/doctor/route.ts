import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClinicInvitation from '@/models/ClinicInvitation';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const doctor = await Doctor.findOne({ userId: session.user?.id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const invitations = await ClinicInvitation.find({
      doctorId: doctor._id
    }).populate({
      path: 'clinicId',
      model: Clinic,
      select: 'name logo city type slug'
    }).sort({ createdAt: -1 });

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error('Doctor invitations fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
