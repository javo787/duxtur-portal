import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimit(ip, 50, 60 * 1000); // 50 requests per minute
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '25');
    const specialty = searchParams.get('specialty');
    const city = searchParams.get('city');
    const lang_code = searchParams.get('lang_code') || 'ru';
    const priceMin = parseInt(searchParams.get('priceMin') || '0');
    const priceMax = parseInt(searchParams.get('priceMax') || '0');
    const accepts = searchParams.get('accepts');
    const consultationType = searchParams.get('consultationType');

    const pipeline: any[] = [];

    const match: any = {};
    if (specialty) match['specialty.ru'] = specialty;
    if (city) match.city = new RegExp(city, 'i');
    if (priceMin > 0) match['priceRange.min'] = { $gte: priceMin };
    if (priceMax > 0) match['priceRange.max'] = { $lte: priceMax };
    if (accepts === 'true') match.acceptsNewPatients = true;
    if (consultationType) match.consultationTypes = consultationType;

    if (!isNaN(lat) && !isNaN(lng)) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceKm',
          spherical: true,
          maxDistance: radius * 1000,
          distanceMultiplier: 0.001,
          query: {
            status: 'approved',
            ...(city ? { city: new RegExp(city, 'i') } : {})
          }
        }
      });
    } else {
      pipeline.push({ $match: { status: 'approved' } });
      pipeline.push({ $sort: { reviewAvg: -1 } });
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $project: {
        _id: 1,
        slug: 1,
        name: 1,
        image: 1,
        city: 1,
        address: 1,
        coordinates: 1,
        specialty: 1,
        priceRange: 1,
        consultationTypes: 1,
        reviewAvg: 1,
        reviewCount: 1,
        acceptsNewPatients: 1,
        languages: 1,
        distanceKm: 1,
        phone: 1,
        telegram: 1,
        whatsapp: 1,
        instagram: 1,
        workingHours: 1
      }
    });

    pipeline.push({ $limit: 200 });

    const doctors = await Doctor.aggregate(pipeline);

    return NextResponse.json(doctors, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
