import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
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

    // Check if user is the clinic owner of the doctor
    let isClinicOwner = false;
    if ((session.user as any)?.role === 'clinic') {
      const clinic = await Clinic.findOne({ userId: session.user.id });
      if (clinic && clinic.doctorIds.some((dId: any) => dId.toString() === appointment.doctorId.toString())) {
        isClinicOwner = true;
      }
    }

    if (!isPatient && !isDoctor && !isClinicOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clinic admins can only change status to 'confirmed', 'cancelled', or 'completed'
    if (isClinicOwner && !isDoctor && !isPatient) {
      const allowedClinicStatuses = ['confirmed', 'cancelled', 'completed'];
      if (!allowedClinicStatuses.includes(status)) {
        return NextResponse.json({ error: 'Clinic admins can only change status to Confirmed, Cancelled, or Completed' }, { status: 400 });
      }
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
