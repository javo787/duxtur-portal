import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { getArticleActor } from '@/lib/article-access';

export async function GET() {
  const actor = await getArticleActor();
  if (actor.kind === 'denied') {
    return NextResponse.json(actor.status === 401 ? null : { error: actor.error }, { status: actor.status });
  }
  // The super admin works with every article through the portal, not through the doctor's cabinet.
  if (actor.kind === 'admin') return NextResponse.json([]);

  await dbConnect();
  const articles = await Article.find({ authorId: actor.doctorId })
    .select('slug title image category isVerified views createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(articles);
}
