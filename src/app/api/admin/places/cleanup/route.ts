import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';
import CleanupLog from '@/models/CleanupLog';
import { auth } from '@/auth';

// Simple in-memory lock for race condition prevention (per-instance)
// For multi-instance deployments, use Redis.
let isCleanupRunning = false;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isCron = req.headers.get('x-vercel-cron') === 'true';

    if (!isCron && (!session || (session.user as any)?.role !== 'portal_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isCleanupRunning) {
      return NextResponse.json({ error: 'Cleanup already in progress' }, { status: 409 });
    }

    isCleanupRunning = true;

    try {
      await dbConnect();

      // Data Migration: Set deletedAt for records that don't have it
      const migrationCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await Place.updateMany(
        { isDeleted: true, deletedAt: null },
        { $set: { deletedAt: migrationCutoff } }
      );

      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await Place.deleteMany({
        isDeleted: true,
        deletedAt: { $lt: cutoffDate }
      });

      // Audit Logging
      await CleanupLog.create({
        performedBy: isCron ? 'cron' : (session?.user?.email || 'unknown'),
        deletedCount: result.deletedCount,
        cutoffDate,
        entityType: 'place'
      });

      console.log(`[CLEANUP] Removed ${result.deletedCount} soft-deleted places older than ${retentionDays} days.`);

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        nextCleanupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    } finally {
      isCleanupRunning = false;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'portal_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const logs = await CleanupLog.find({ entityType: 'place' })
      .sort({ performedAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
