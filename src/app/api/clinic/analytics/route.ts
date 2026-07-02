import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Appointment from '@/models/Appointment';
import ViewLog from '@/models/ViewLog';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const clinic = await Clinic.findOne({ userId: session.user?.id });
    if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const appointments = await Appointment.find({ doctorId: { $in: clinic.doctorIds } }).lean();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const viewHistory = await ViewLog.find({
      entityId: clinic._id,
      entityType: 'clinic',
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 }).lean();

    return NextResponse.json({
      profileViews: { total: clinic.profileViews || 0, history: viewHistory },
      appointments: {
        total: appointments.length,
        list: appointments
      }
    });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
