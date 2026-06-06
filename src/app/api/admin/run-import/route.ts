// src/app/api/admin/run-import/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // секунд — важно!

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { importClinics } = await import('@/lib/import-clinics');
    const result = await importClinics();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
