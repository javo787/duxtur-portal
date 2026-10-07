'use server';

import dbConnect from '@/lib/mongodb';
import ArticleDraft from '@/models/ArticleDraft';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { auth } from '@/auth';
import { evaluateAuthor } from '@/lib/author-profile';
import { publishArticle } from '@/lib/author-articles';
import { ARTICLE_LANGUAGES, MAX_DRAFTS_PER_AUTHOR, MAX_DRAFT_BYTES, type SaveOutcome } from '@/lib/author-types';

/**
 * The author pressed "Publish".
 *
 * - An approved doctor: the article is created at once (as before).
 * - Anybody else who may write (a new account, or a doctor still waiting for the check): the article is kept as a
 *   draft. `missing` lists what the profile still lacks, or is empty when the profile is complete and only the
 *   team's verification is left; the draft is published by itself when the doctor is approved.
 *
 * `draftId` is the draft this text came from (when an old draft is opened again): it is updated, not duplicated, and
 * removed once the article is published.
 */
export async function saveArticle(articleData: unknown, language: string, draftId?: string): Promise<SaveOutcome> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Необходима авторизация' };
    }
    if (!articleData || typeof articleData !== 'object' || Array.isArray(articleData)) {
      return { success: false, error: 'Пустая статья' };
    }
    if (!(ARTICLE_LANGUAGES as readonly string[]).includes(language)) {
      return { success: false, error: 'Неизвестный язык статьи' };
    }
    const data = articleData as Record<string, unknown>;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return { success: false, error: 'Пользователь не найден' };
    if (user.role !== 'patient' && user.role !== 'doctor') {
      return { success: false, error: 'Статьи пишут врачи и преподаватели. Войдите под своим аккаунтом.' };
    }

    const doctor = await Doctor.findOne({ userId: user._id });
    const state = evaluateAuthor(user.name || '', doctor);

    if (state.standing === 'blocked') {
      return { success: false, error: 'Ваш профиль врача не подтверждён. Напишите в поддержку, чтобы разобраться.' };
    }

    if (state.canPublishNow && doctor) {
      const slug = await publishArticle(data, language, doctor._id);
      if (draftId) await ArticleDraft.deleteOne({ _id: draftId, userId: user._id }).catch(() => undefined);
      return { success: true, outcome: 'published', slug };
    }

    // Not published yet: keep the text.
    if (JSON.stringify(data).length > MAX_DRAFT_BYTES) {
      return { success: false, error: 'Статья слишком большая. Сократите текст или уберите лишние фото.' };
    }
    const title = typeof data.title === 'string' ? data.title.slice(0, 200) : '';

    type Saved = { _id: { toString(): string } };
    let saved: Saved | null = null;
    if (draftId) {
      saved = await ArticleDraft.findOneAndUpdate(
        { _id: draftId, userId: user._id },
        { $set: { language, title, data } },
        { new: true }
      );
    }
    if (!saved) {
      if ((await ArticleDraft.countDocuments({ userId: user._id })) >= MAX_DRAFTS_PER_AUTHOR) {
        return { success: false, error: 'Накопилось много черновиков. Удалите ненужные и повторите.' };
      }
      saved = (await ArticleDraft.create({ userId: user._id, language, title, data })) as Saved;
    }

    return {
      success: true,
      outcome: state.canSubmit ? 'awaiting' : 'draft',
      draftId: saved._id.toString(),
      missing: state.missing,
    };
  } catch (error: unknown) {
    console.error('saveArticle error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить' };
  }
}
