import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { id } = await params;
    const { status, cancelReason } = await req.json();

    const appointment = await Appointment.findById(id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPatient = appointment.patientId.toString() === session.user.id;

    // Find if user is the doctor of this appointment
    const doctor = await Doctor.findOne({ userId: session.user.id });
    const isDoctor = doctor && appointment.doctorId.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Patient can ONLY cancel
    if (isPatient && !isDoctor && status !== 'cancelled') {
      return NextResponse.json({ error: 'Patients can only cancel appointments' }, { status: 403 });
    }

    // Update status
    appointment.status = status;
    if (cancelReason) appointment.cancelReason = cancelReason;
    await appointment.save();

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { id } = await params;
    const appointment = await Appointment.findById(id)
      .populate('doctorId', 'name image specialty slug')
      .populate('patientId', 'name email image')
      .lean();

    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
