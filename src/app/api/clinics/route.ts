import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeSearchParams } from '@/lib/validation';
import { buildClinicQuery } from '@/lib/clinic-query';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await rateLimit(ip, 30, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);

    const rawParams = {
      city: searchParams.get('city') || undefined,
      type: searchParams.get('type') || undefined,
      specialty: searchParams.get('specialty') || undefined,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') || undefined,
      sort: searchParams.get('sort') || undefined,
    };

    const filters = sanitizeSearchParams(rawParams);
    const page = filters.page;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    await dbConnect();

    const query = buildClinicQuery(filters);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { 'rating.avg': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $addFields: {
          doctorCount: { $size: { $ifNull: ["$doctorIds", []] } }
        }
      },
      {
        $project: {
          doctorIds: 0,
          userId: 0,
          licenseNumber: 0,
          licenseDocument: 0,
          updatedAt: 0,
          __v: 0
        }
      }
    ];

    const [clinics, total] = await Promise.all([
      Clinic.aggregate(pipeline),
      Clinic.countDocuments(query)
    ]);

    return NextResponse.json({
      data: clinics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Clinics fetch error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
