import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';
import { notifyAdminNewDoctor } from '@/lib/telegram'; // Pattern from instructions

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const body = await req.json();
    const { doctorId, patientName, patientPhone, patientEmail, date, timeSlot, type, notes } = body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'approved') {
      return NextResponse.json({ error: 'Doctor not found or not approved' }, { status: 404 });
    }

    const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: { $ne: 'cancelled' } });
    if (existing) {
      return NextResponse.json({ error: 'Time slot already taken' }, { status: 400 });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId: session.user?.id,
      patientName,
      patientPhone,
      patientEmail,
      date: new Date(date),
      timeSlot,
      type,
      notes
    });

    // Notify doctor (simulated using notifyAdminNewDoctor pattern as per task)
    // In Task 4 we will add notifyDoctorNewAppointment

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = { patientId: session.user?.id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name image specialty slug')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
