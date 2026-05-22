import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    const q = searchParams.get('q');

    await dbConnect();

    const query: any = { status: 'approved' };

    if (city) query.city = city;
    if (type) query.type = type;
    if (specialty) query.specialties = specialty;
    if (q) {
      query.$text = { $search: q };
    }

    const clinics = await Clinic.find(query)
      .sort({ 'rating.avg': -1 })
      .limit(50)
      .select('slug name type city coverImage logo rating specialties doctorIds');

    // Transform to include doctorIds count
    const result = clinics.map(clinic => {
      const clinicObj = clinic.toObject();
      clinicObj.doctorCount = clinicObj.doctorIds?.length || 0;
      delete clinicObj.doctorIds;
      return clinicObj;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Clinics fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
