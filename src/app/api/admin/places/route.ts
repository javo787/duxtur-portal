import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';
import { auth } from '@/auth';
import { translateText } from '@/lib/translation-service';
import { toGeoPoint } from '@/lib/coordinates';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'portal_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const multilingualName = await translateText(body.name);

    // Ensure coordinates are properly formatted for GeoJSON
    const lat = body.coordinates?.lat;
    const lng = body.coordinates?.lng;
    const geoPoint = (lat && lng) ? toGeoPoint(lat, lng) : body.coordinates;

    const place = await Place.create({
      ...body,
      name: multilingualName,
      coordinates: geoPoint,
      isVerified: true
    });

    return NextResponse.json(place);
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'portal_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const places = await Place.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Place.countDocuments({ isDeleted: { $ne: true } });
    const deletedCount = await Place.countDocuments({ isDeleted: true });

    return NextResponse.json({ places, total, deletedCount, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    try {
      const session = await auth();
      if (!session || (session.user as any)?.role !== 'portal_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await dbConnect();
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      await Place.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
