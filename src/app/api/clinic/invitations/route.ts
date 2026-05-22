import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClinicInvitation from '@/models/ClinicInvitation';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify ownership
    const clinic = await Clinic.findOne({ _id: clinicId, userId: session.user?.id });
    if (!clinic) {
       return NextResponse.json({ error: 'Clinic not found or not owned by user' }, { status: 404 });
    }

    const invitations = await ClinicInvitation.find({
      clinicId,
      status: 'pending'
    }).populate({
      path: 'doctorId',
      model: Doctor,
      select: 'name image specialty'
    });

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error('Clinic invitations fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
