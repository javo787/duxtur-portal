import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const { name, phone, city } = await req.json();
    await dbConnect();

    // Search for candidates
    const candidates = await Clinic.find({
      status: 'pre_imported',
      city,
      $or: [
        // Exact phone match if provided
        ...(phone ? [{ phone }] : []),
        // Text search by name
        { $text: { $search: name } },
      ]
    })
    .select('_id name phone address type logo slug')
    .limit(3);

    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error('Check existing clinic error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
