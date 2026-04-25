'use server';

import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

export async function rateArticle(slug: string, rating: number) {
  await dbConnect();
  await Article.findOneAndUpdate(
    { slug },
    {
      $push: { ratings: rating },
    }
  );
  return { success: true };
}

export async function likeArticle(slug: string, type: 'up' | 'down') {
  await dbConnect();
  const update = type === 'up'
    ? { $inc: { likesUp: 1 } }
    : { $inc: { likesDown: 1 } };
  await Article.findOneAndUpdate({ slug }, update);
  return { success: true };
}
