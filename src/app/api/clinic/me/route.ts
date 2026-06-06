import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { auth } from '@/auth';
import { updateClinicProfile } from '@/app/actions/clinic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const clinic = await Clinic.findOne({ userId: session.user?.id }).lean();
    return NextResponse.json(clinic);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const clinic = await Clinic.findOne({ userId: session.user?.id }).lean();
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }
    const body = await req.json();

    // Whitelist allowed fields to prevent overwriting sensitive data like status or userId
    const {
      name, description, quote, history, address, city, coordinates, specialties,
      phone, phone2, email, website, telegram, whatsapp, instagram,
      workingHours, logo, coverImage, photos
    } = body;

    const updateData = {
      name, description, quote, history, address, city, coordinates, specialties,
      phone, phone2, email, website, telegram, whatsapp, instagram,
      workingHours, logo, coverImage, photos
    };

    const result = await updateClinicProfile((clinic as any)._id.toString(), updateData, session.user?.id);
    if (result.success) return NextResponse.json({ success: true });
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
