import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { rateLimit } from '@/lib/rate-limit';
import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, ClinicType } from '@/lib/clinic-constants';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = rateLimit(ip, 30, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    const q = searchParams.get('q');

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Validation
    if (city && !ALLOWED_CITIES.includes(city)) {
       return NextResponse.json({ error: 'Invalid city' }, { status: 400 });
    }
    if (type && !ALLOWED_CLINIC_TYPES.includes(type as ClinicType)) {
       return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (specialty && specialty.length > 100) {
      return NextResponse.json({ error: 'Invalid specialty' }, { status: 400 });
    }

    // Sanitization of q
    let sanitizedQ = '';
    if (q) {
      sanitizedQ = q.slice(0, 100).replace(/[^\p{L}\p{N}\s]/gu, '');
    }

    await dbConnect();

    const query: any = { status: 'approved' };
    if (city) query.city = city;
    if (type) query.type = type;
    if (specialty) query.specialties = specialty;
    if (sanitizedQ) {
      query.$text = { $search: sanitizedQ };
    }

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
