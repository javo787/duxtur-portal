import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const dateStr = searchParams.get('date');

    if (!doctorId || !dateStr) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const date = new Date(dateStr);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayNames[date.getDay()];
    const daySchedule = doctor.schedule?.[dayKey];

    if (!daySchedule?.isWorking) {
      return NextResponse.json([]);
    }

    const booked = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(date.setHours(0,0,0,0)),
        $lt: new Date(date.setHours(23,59,59,999))
      },
      status: { $ne: 'cancelled' }
    }).select('timeSlot').lean();

    const bookedSlots = booked.map(b => b.timeSlot);

    // Generate slots
    const slots = [];
    let current = daySchedule.open;
    const end = daySchedule.close;

    while (current < end) {
      if (!bookedSlots.includes(current)) {
        slots.push(current);
      }
      // Add 30 mins
      const [h, m] = current.split(':').map(Number);
      const nextMin = m + 30;
      const nextH = h + Math.floor(nextMin / 60);
      const finalM = nextMin % 60;
      current = `${nextH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    }

    return NextResponse.json(slots);
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
