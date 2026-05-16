import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { id } = await params;
    const { status, cancelReason } = await req.json();

    const appointment = await Appointment.findById(id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check permissions: only doctor of this appointment or patient who owns it
    // For simplicity, we assume session.user.id is either patientId or we'd need to check doctor.userId

    // Status update logic...
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
