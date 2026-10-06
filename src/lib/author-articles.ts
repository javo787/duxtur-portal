import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import ArticleDraft from '@/models/ArticleDraft';
import { stripHtml } from '@/lib/utils';

/**
 * Turning what the editors produce into an Article, and publishing the drafts of an author.
 * Shared by saveArticle (an approved doctor presses "Publish") and by the approval of a doctor
 * (the drafts that were waiting for the verification go live).
 */

const TRANSLIT: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  // Tajik
  'ӣ':'i','ӯ':'u','ҳ':'h','қ':'q','ғ':'g','ҷ':'j',
  // Kazakh / Kyrgyz
  'ң':'n','ү':'u','ұ':'u','ө':'o','ә':'a','і':'i',
};

export function articleSlug(title: string, now: number = Date.now()): string {
  const transliterated = (title || 'article').toLowerCase().split('').map(char => TRANSLIT[char] ?? char).join('');
  return (
    transliterated
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60) +
    '-' + now.toString().slice(-5)
  );
}

type EditorData = Record<string, unknown>;

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The Article document for what an editor produced, in one language. */
export function buildArticleDoc(data: EditorData, language: string, authorId: unknown) {
  const references = Array.isArray(data.references) ? data.references : [];
  const doc: Record<string, unknown> = {
    slug: articleSlug(str(data.title)),
    authorId,
    image: str(data.image),
    title: { [language]: stripHtml(str(data.title)) },
    overview: { [language]: stripHtml(str(data.overview)) },
    references,
    isVerified: false,
    aiGenerated: typeof data.aiGenerated === 'boolean' ? data.aiGenerated : true,
  };
  for (let i = 1; i <= 5; i++) {
    doc[`section${i}_title`] = { [language]: stripHtml(str(data[`section${i}_title`])) };
    doc[`section${i}_content`] = { [language]: stripHtml(str(data[`section${i}_content`])) };
  }
  return doc;
}

export async function publishArticle(data: EditorData, language: string, authorId: unknown): Promise<string> {
  await dbConnect();
  const created = await Article.create(buildArticleDoc(data, language, authorId));
  return created.slug as string;
}

/**
 * Publishes every draft of a person who is now an approved doctor. Each draft is taken out of the collection first
 * (so two runs at once cannot publish it twice) and put back if creating the article fails.
 */
export async function publishDraftsOf(userId: unknown, authorId: unknown): Promise<string[]> {
  await dbConnect();
  const drafts = (await ArticleDraft.find({ userId }).sort({ createdAt: 1 }).select('_id').lean()) as { _id: unknown }[];
  const slugs: string[] = [];
  for (const { _id } of drafts) {
    const draft = (await ArticleDraft.findOneAndDelete({ _id }).lean()) as
      | { userId: unknown; language: string; title?: string; data: EditorData; createdAt?: Date }
      | null;
    if (!draft) continue;
    try {
      slugs.push(await publishArticle(draft.data, draft.language, authorId));
    } catch (error) {
      await ArticleDraft.create({ userId: draft.userId, language: draft.language, title: draft.title, data: draft.data });
      throw error;
    }
  }
  return slugs;
}
