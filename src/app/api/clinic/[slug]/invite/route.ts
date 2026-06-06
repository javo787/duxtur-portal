import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import ClinicInvitation from '@/models/ClinicInvitation';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { doctorIdentifier } = await request.json(); // can be slug or email

    if (!doctorIdentifier) {
      return NextResponse.json({ error: 'Doctor identifier is required' }, { status: 400 });
    }

    await dbConnect();

    const clinic = await Clinic.findOne({ slug, userId: session.user?.id });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found or not owned by user' }, { status: 404 });
    }

    let doctor = await Doctor.findOne({ slug: doctorIdentifier });
    if (!doctor) {
      const user = await User.findOne({ email: doctorIdentifier });
      if (user) {
        doctor = await Doctor.findOne({ userId: user._id });
      }
    }

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const existingInvitation = await ClinicInvitation.findOne({
      clinicId: clinic._id,
      doctorId: doctor._id,
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already exists' }, { status: 400 });
    }

    const invitation = await ClinicInvitation.create({
      clinicId: clinic._id,
      doctorId: doctor._id,
      status: 'pending'
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Invite doctor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
