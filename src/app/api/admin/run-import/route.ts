// src/app/api/admin/
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Защита — только ты можешь запустить
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Весь код скрипта переносишь сюда
  // Vercel сам подхватит все env переменные
  
  try {
    const { importClinics } = await import('@/lib/import-clinics');
    const result = await importClinics();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
