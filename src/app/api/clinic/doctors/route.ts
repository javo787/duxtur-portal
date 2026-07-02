import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    await dbConnect();

    const clinic = await Clinic.findById(clinicId).populate({
      path: 'doctorIds',
      model: Doctor,
      select: 'name image specialty slug'
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic.doctorIds, { status: 200 });
  } catch (error) {
    console.error('Clinic doctors fetch error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
