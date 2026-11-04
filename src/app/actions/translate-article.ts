'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { getArticleActor } from '@/lib/article-access';
import { rateLimit } from '@/lib/rate-limit';
import { ARTICLE_LANGUAGES } from '@/lib/author-types';
import { articleToSourceText, languagesOf, translationUpdate, type TranslatableArticle } from '@/lib/article-translation';

/**
 * "Перевести" → "Моя статья": the author picks one of their published articles, the AI translates it, and the
 * translation is saved as another language of that article.
 *
 * Whose articles: an approved doctor — their own; the super admin — the articles of their editorial byline
 * («Редакция Duxtur»). A doctor's translation goes to moderation like any edit of theirs; the super admin's does not.
 */

export interface TranslatableSummary {
  slug: string;
  title: string;
  languages: string[];
}

type Owner = { ok: true; filter: Record<string, unknown>; admin: boolean } | { ok: false; error: string };

async function owner(): Promise<Owner> {
  const actor = await getArticleActor();
  if (actor.kind === 'doctor') return { ok: true, filter: { authorId: actor.doctorId }, admin: false };
  if (actor.kind === 'denied') return { ok: false, error: actor.error };

  const session = await auth();
  await dbConnect();
  const user = await User.findOne({ email: session?.user?.email }).select('_id').lean<{ _id: unknown }>();
  const editorial = user
    ? await Doctor.findOne({ userId: user._id, isEditorial: true }).select('_id').lean<{ _id: unknown }>()
    : null;
  if (!editorial) return { ok: false, error: 'У вас ещё нет опубликованных статей' };
  return { ok: true, filter: { authorId: editorial._id }, admin: true };
}

const FIELDS = 'slug title overview section1_title section1_content section2_title section2_content section3_title section3_content section4_title section4_content section5_title section5_content references';

const pickTitle = (article: TranslatableArticle, languages: string[]) =>
  (article.title?.ru || (languages[0] && article.title?.[languages[0]]) || '').trim();

/** The author's articles, newest first, with the languages each one already has. */
export async function listMyArticlesForTranslation(): Promise<
  { success: true; articles: TranslatableSummary[] } | { success: false; error: string }
> {
  const who = await owner();
  if (!who.ok) return { success: true, articles: [] };
  await dbConnect();
  const docs = await Article.find(who.filter).select(FIELDS).sort({ createdAt: -1 }).limit(200)
    .lean<(TranslatableArticle & { slug: string })[]>();
  const articles = docs
    .map(doc => {
      const languages = languagesOf(doc);
      return { slug: doc.slug, title: pickTitle(doc, languages), languages };
    })
    .filter(a => a.languages.length > 0);
  return { success: true, articles };
}

/** The text of one language of the author's article, ready for the translator. */
export async function getArticleForTranslation(slug: string, sourceLanguage: string): Promise<
  { success: true; text: string; languages: string[] } | { success: false; error: string }
> {
  const who = await owner();
  if (!who.ok) return { success: false, error: who.error };
  await dbConnect();
  const doc = await Article.findOne({ ...who.filter, slug: String(slug) }).select(FIELDS).lean<TranslatableArticle>();
  if (!doc) return { success: false, error: 'Статья не найдена' };
  const languages = languagesOf(doc);
  if (!languages.includes(sourceLanguage)) return { success: false, error: 'У статьи нет этой языковой версии' };
  return { success: true, text: articleToSourceText(doc, sourceLanguage), languages };
}

/** Saves the translation as the `language` version of the article. */
export async function saveArticleTranslation(slug: string, language: string, articleData: unknown): Promise<
  { success: true; slug: string; language: string; moderated: boolean } | { success: false; error: string }
> {
  try {
    if (!(ARTICLE_LANGUAGES as readonly string[]).includes(language)) return { success: false, error: 'Неизвестный язык' };
    if (!articleData || typeof articleData !== 'object' || Array.isArray(articleData)) return { success: false, error: 'Пустой перевод' };
    const data = articleData as Record<string, unknown>;
    if (typeof data.title !== 'string' || !data.title.trim()) return { success: false, error: 'У перевода нет заголовка' };

    const session = await auth();
    const { success } = await rateLimit(`translate:${session?.user?.email ?? 'anon'}`, 20, 10 * 60 * 1000);
    if (!success) return { success: false, error: 'Слишком много запросов. Попробуйте через несколько минут.' };

    const who = await owner();
    if (!who.ok) return { success: false, error: who.error };
    await dbConnect();
    const existing = await Article.findOne({ ...who.filter, slug: String(slug) })
      .select('_id slug references isVerified').lean<{ _id: unknown; slug: string; references?: string[]; isVerified?: boolean }>();
    if (!existing) return { success: false, error: 'Статья не найдена' };

    const update = {
      ...translationUpdate(data, language, existing.references || []),
      // A doctor's change goes back to moderation; the super admin's keeps the article as it was.
      isVerified: who.admin ? existing.isVerified === true : false,
      updatedAt: new Date(),
    };
    await Article.updateOne({ _id: existing._id }, { $set: update });

    revalidatePath(`/${language}/blog/${existing.slug}`);
    revalidatePath('/[lang]/blog', 'page');
    // Category pages are static: without this a new article would not appear there (and an empty one stays noindex)
    revalidatePath('/[lang]/blog/c/[category]', 'page');
    return { success: true, slug: existing.slug, language, moderated: !who.admin };
  } catch (error: unknown) {
    console.error('saveArticleTranslation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить перевод' };
  }
}
