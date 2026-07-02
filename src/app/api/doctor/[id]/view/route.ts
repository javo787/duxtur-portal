import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import ViewLog from '@/models/ViewLog';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

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
