import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    const clinic = await Clinic.findOne({ slug, status: 'approved' })
      .populate({
        path: 'doctorIds',
        model: Doctor,
        select: 'name image specialty slug experience reviewAvg reviewCount',
      });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic, { status: 200 });
  } catch (error) {
    console.error('Clinic fetch error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
