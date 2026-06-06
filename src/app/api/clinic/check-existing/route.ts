import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
