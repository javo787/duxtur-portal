import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type'); // clinic | pharmacy | all

    const query: any = { isVerified: true };
    if (city) query.city = new RegExp(city, 'i');
    if (type && type !== 'all') query.type = type;

    const places = await Place.find(query).limit(100).lean();
    return NextResponse.json(places, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
