import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import ViewLog from '@/models/ViewLog';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const doctor = await Doctor.findOne({ userId: session.user?.id });
  if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const appointments = await Appointment.find({ doctorId: doctor._id }).lean();
  const articles = await Article.find({ authorId: doctor._id }).select('views slug title').lean();

  const totalArticlesViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const viewHistory = await ViewLog.find({
    entityId: doctor._id,
    entityType: 'doctor',
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: 1 }).lean();

  return NextResponse.json({
    profileViews: { total: doctor.profileViews || 0, trend: '+0%', history: viewHistory },
    articleViews: { total: totalArticlesViews, byArticle: articles },
    appointments: {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      list: appointments // Include full list for CSV export
    },
    contactClicks: { total: doctor.contactClicks || 0 }
  });
}
