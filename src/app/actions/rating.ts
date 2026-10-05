'use server';

import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

export async function rateArticle(slug: string, rating: number) {
  // Server actions can be called with any value, so check the range here
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { success: false };
  await dbConnect();
  await Article.findOneAndUpdate(
    { slug },
    {
      $push: { ratings: rating },
    },
    // A rating is not an edit: without this every vote moves updatedAt (dateModified in JSON-LD)
    { timestamps: false }
  );
  return { success: true };
}

export async function likeArticle(slug: string, type: 'up' | 'down') {
  await dbConnect();
  const update = type === 'up'
    ? { $inc: { likesUp: 1 } }
    : { $inc: { likesDown: 1 } };
  await Article.findOneAndUpdate({ slug }, update, { timestamps: false });
  return { success: true };
}
