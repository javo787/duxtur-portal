import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PatientProfile from '@/models/PatientProfile';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const profile = await PatientProfile.findOne({ userId: session.user?.id }).lean();
  return NextResponse.json(profile || {});
}

export async function PUT(req: NextRequest) {
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
