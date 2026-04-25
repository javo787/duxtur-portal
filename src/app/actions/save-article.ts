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

    // Транслитерация кириллицы в латиницу
const translitMap: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  // Таджикские
  'ӣ':'i','ӯ':'u','ҳ':'h','қ':'q','ғ':'g','ҷ':'j',
  // Казахские/Кыргызские
  'ң':'n','ү':'u','ұ':'u','ө':'o','ә':'a','і':'i','ғ':'g','қ':'k',
};

const transliterate = (text: string): string =>
  text.toLowerCase().split('').map(char => translitMap[char] ?? char).join('');

const rawTitle = articleData.title || 'article';
const slug = transliterate(rawTitle)
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+|-+$/g, '')
  .substring(0, 60)
  + '-' + Date.now().toString().slice(-5);

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
