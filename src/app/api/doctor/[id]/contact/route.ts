import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await dbConnect();
    await Doctor.findOneAndUpdate(
      { $or: [{ slug: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }] },
      { $inc: { contactClicks: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Doctor contact tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
