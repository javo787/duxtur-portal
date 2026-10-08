'use server';

import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

export async function likeArticle(slug: string, type: 'up' | 'down') {
  await dbConnect();
  const update = type === 'up'
    ? { $inc: { likesUp: 1 } }
    : { $inc: { likesDown: 1 } };
  await Article.findOneAndUpdate({ slug }, update, { timestamps: false });
  return { success: true };
}
