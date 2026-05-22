import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import ClinicInvitation from '@/models/ClinicInvitation';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { clinicId, doctorSlug } = await request.json();
    if (!clinicId || !doctorSlug) {
      return NextResponse.json({ error: 'clinicId and doctorSlug are required' }, { status: 400 });
    }
    await dbConnect();
    const clinic = await Clinic.findOne({ _id: clinicId, userId: session.user?.id });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found or not owned by user' }, { status: 404 });
    }
    let doctor = await Doctor.findOne({ slug: doctorSlug });
    if (!doctor) {
      const user = await User.findOne({ email: doctorSlug });
      if (user) doctor = await Doctor.findOne({ userId: user._id });
    }
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    const existing = await ClinicInvitation.findOne({ clinicId: clinic._id, doctorId: doctor._id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 });
    }
    const invitation = await ClinicInvitation.create({ clinicId: clinic._id, doctorId: doctor._id, status: 'pending' });
    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
