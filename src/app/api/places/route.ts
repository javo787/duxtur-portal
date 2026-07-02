import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(ip, 50, 60 * 1000); // 50 requests per minute
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type'); // clinic | pharmacy | all
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '20');

    if (!city && (isNaN(lat) || isNaN(lng))) {
      return NextResponse.json([]);
    }

    const query: any = { isVerified: true };
    if (type && type !== 'all') query.type = type;

    if (!isNaN(lat) && !isNaN(lng)) {
      query['coordinates.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000
        }
      };
    } else if (city) {
      query.city = new RegExp(city, 'i');
    }

    let places = [];
    try {
        places = await Place.find(query).limit(100).lean();

        // If $near was used but returned nothing, and we have a city, try city fallback
        if (places.length === 0 && query['coordinates.coordinates'] && city) {
            const fallbackQuery = { ...query };
            delete fallbackQuery['coordinates.coordinates'];
            fallbackQuery.city = new RegExp(city, 'i');
            places = await Place.find(fallbackQuery).limit(100).lean();
        }
    } catch (e) {
        // Fallback if $near fails with error (e.g. index not yet built or bad coordinates)
        if (query['coordinates.coordinates'] && city) {
            const fallbackQuery = { ...query };
            delete fallbackQuery['coordinates.coordinates'];
            fallbackQuery.city = new RegExp(city, 'i');
            places = await Place.find(fallbackQuery).limit(100).lean();
        } else {
            throw e;
        }
    }
    return NextResponse.json(places, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' }
    });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
