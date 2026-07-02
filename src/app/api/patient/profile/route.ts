import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PatientProfile from '@/models/PatientProfile';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const profile = await PatientProfile.findOne({ userId: session.user?.id }).lean();
  return NextResponse.json(profile || {});
}

export async function PUT(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();
  const profile = await PatientProfile.findOneAndUpdate(
    { userId: session.user?.id },
    { ...body, userId: session.user?.id },
    { upsert: true, new: true }
  );
  return NextResponse.json(profile);
}
