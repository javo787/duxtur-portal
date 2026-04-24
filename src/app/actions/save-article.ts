'use server';

import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';

function cleanText(content: any): string {
  if (Array.isArray(content)) return content.map((item) => `• ${item}`).join('\n');
  return content || '';
}

export async function saveArticle(articleData: any, language: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Необходима авторизация' };
    }

    await dbConnect();

    if (!articleData.references || articleData.references.length < 2) {
      return { success: false, error: 'Минимум 2 источника (WHO, CDC, PubMed и т.д.)' };
    }

    // Находим профиль текущего врача
    const { User } = await import('@/models/User').then(m => ({ User: m.default }));
    const user = await User.findOne({ email: session.user.email });
    if (!user) return { success: false, error: 'Пользователь не найден' };

    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) return { success: false, error: 'Профиль врача не найден' };

    const slug = (articleData.title || 'article')
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-5);

    const newArticle = await Article.create({
      slug,
      authorId: doctor._id,
      image: articleData.image || '',
      title: { [language]: cleanText(articleData.title) },
      overview: { [language]: cleanText(articleData.overview) },
      symptoms: { [language]: cleanText(articleData.symptoms) },
      causes: { [language]: cleanText(articleData.causes) },
      diagnosis_treatment: { [language]: cleanText(articleData.diagnosis_treatment) },
      prevention: { [language]: cleanText(articleData.prevention) },
      references: articleData.references,
      isVerified: true,
    });

    return { success: true, slug: newArticle.slug };
  } catch (error: any) {
    console.error('saveArticle error:', error);
    return { success: false, error: error.message };
  }
}
