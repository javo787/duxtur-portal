import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import ViewLog from '@/models/ViewLog';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await dbConnect();
    // Increment profileViews counter on Doctor document
    // We use the slug or id to find the doctor
    const doctor = await Doctor.findOneAndUpdate(
      { $or: [{ slug: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }] },
      { $inc: { profileViews: 1 } }
    );

    if (doctor) {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);

      await ViewLog.findOneAndUpdate(
        { entityId: doctor._id, entityType: 'doctor', date: today },
        { $inc: { count: 1 } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Doctor view tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
