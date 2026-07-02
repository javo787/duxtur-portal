import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import ViewLog from '@/models/ViewLog';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const cookieName = `clinic_viewed_${slug}`;

    if (cookieStore.has(cookieName)) {
      return NextResponse.json({ message: 'Already viewed' }, { status: 200 });
    }

    await dbConnect();
    const clinic = await Clinic.findOneAndUpdate(
      { slug },
      { $inc: { profileViews: 1 } },
      { new: true }
    );

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Логируем просмотр в аналитику
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await ViewLog.findOneAndUpdate(
      { entityId: clinic._id, entityType: 'clinic', date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    ).catch(err => console.error('Clinic ViewLog update error:', err));

    // Устанавливаем куку на 24 часа
    cookieStore.set(cookieName, 'true', {
      maxAge: 60 * 60 * 24,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return NextResponse.json({ views: clinic.profileViews }, { status: 200 });
  } catch (error) {
    console.error('Clinic view increment error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
