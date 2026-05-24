import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'portal_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await Place.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: cutoffDate }
    });

    console.log(`[CLEANUP] Removed ${result.deletedCount} soft-deleted places older than ${retentionDays} days.`);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate,
      nextCleanupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
