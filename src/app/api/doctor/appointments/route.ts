import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const doctor = await Doctor.findOne({ userId: session.user?.id });
    if (!doctor || doctor.status !== 'approved') {
      return NextResponse.json({ error: 'Doctor not found or not approved' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = { doctorId: doctor._id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email image')
      .sort({ date: 1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
