import { NextRequest, NextResponse } from 'next/server';
import { registerClinic } from '@/app/actions/clinic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerClinic(body);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
