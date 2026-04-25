import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json(null, { status: 404 });

  const doctor = await Doctor.findOne({ userId: user._id }).lean();
  if (!doctor) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(doctor);
}
