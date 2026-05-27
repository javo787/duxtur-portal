import { NextRequest, NextResponse } from 'next/server';
import { registerClinic } from '@/app/actions/clinic';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    const limiter = rateLimit(ip, 3, 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const result = await registerClinic(body);

    if (result.success) {
      return NextResponse.json({ success: true, clinicId: result.clinicId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
