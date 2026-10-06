'use server';

import { after } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ArticleDraft from '@/models/ArticleDraft';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { auth } from '@/auth';
import { evaluateAuthor, isFullName, isPhone, type AuthorField, type AuthorState } from '@/lib/author-profile';
import { publishDraftsOf } from '@/lib/author-articles';
import { notifyAdminNewDoctor } from '@/lib/telegram';
import { translateText } from '@/lib/translation-service';
import { generateSlug, stripHtml } from '@/lib/utils';
import type { StudioState } from '@/lib/author-types';

/**
 * The writing studio (/write) and the one-screen "finish your profile" step.
 *
 * Every function checks the session itself (a server action is a public endpoint) and only ever touches the drafts
 * and the doctor profile of the signed-in person.
 */

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
const DIPLOMA_URL = /^https:\/\/res\.cloudinary\.com\//;

async function currentPerson() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return null;
  const doctor = await Doctor.findOne({ userId: user._id });
  return { user, doctor };
}

const SIGNED_OUT: StudioState = { signedIn: false, role: '', name: '', standing: 'new', missing: [], drafts: [] };

export async function getStudioState(): Promise<StudioState> {
  try {
    const person = await currentPerson();
    if (!person) return SIGNED_OUT;
    const { user, doctor } = person;
    const state = evaluateAuthor(user.name || '', doctor);
    const drafts = (await ArticleDraft.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select('_id title language updatedAt')
      .lean()) as { _id: { toString(): string }; title?: string; language: string; updatedAt?: Date }[];
    return {
      signedIn: true,
      role: user.role,
      name: user.name || '',
      standing: state.standing,
      missing: state.missing,
      drafts: drafts.map(d => ({
        id: d._id.toString(),
        title: d.title || '',
        language: d.language,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
      })),
    };
  } catch (error) {
    console.error('getStudioState error:', error);
    return SIGNED_OUT;
  }
}

export interface ProfileInput {
  name: string;
  specialty: string;
  phone: string;
  documentImageUrl: string;
}

export type CompleteProfileResult =
  | { success: true; standing: AuthorState['standing'] }
  | { success: false; error: string; field?: keyof ProfileInput };

const FIELD_OF: Record<AuthorField, keyof ProfileInput> = {
  name: 'name',
  specialty: 'specialty',
  phone: 'phone',
  documentImage: 'documentImageUrl',
};

const MISSING_TEXT: Record<AuthorField, string> = {
  name: 'Укажите фамилию и имя',
  specialty: 'Укажите специальность',
  phone: 'Укажите телефон, например +992 900 00 00 00',
  documentImage: 'Загрузите фото диплома',
};

const clean = (value: unknown, max: number) => stripHtml(String(value ?? '')).trim().slice(0, max);

/**
 * Fills in the application of the doctor who is writing: the same four facts the registration form asks for.
 * The form asks only for what is still missing, so every field is optional here; what counts is that the profile
 * is complete once the new values are put on top of what is already on file.
 */
export async function completeAuthorProfile(input: Partial<ProfileInput>): Promise<CompleteProfileResult> {
  try {
    const person = await currentPerson();
    if (!person) return { success: false, error: 'Необходима авторизация' };
    const { user, doctor } = person;
    if (user.role !== 'patient' && user.role !== 'doctor') {
      return { success: false, error: 'Недоступно для этого аккаунта' };
    }
    if (doctor?.status === 'approved') return { success: false, error: 'Ваш профиль врача уже подтверждён' };
    if (doctor?.status === 'rejected' || doctor?.status === 'banned') {
      return { success: false, error: 'Ваш профиль врача не подтверждён. Напишите в поддержку.' };
    }

    const provided: Partial<Record<keyof ProfileInput, string>> = {};
    if (input?.name !== undefined) provided.name = clean(input.name, 100);
    if (input?.specialty !== undefined) provided.specialty = clean(input.specialty, 120);
    if (input?.phone !== undefined) provided.phone = clean(input.phone, 30);
    if (input?.documentImageUrl !== undefined) provided.documentImageUrl = String(input.documentImageUrl);

    if (provided.name !== undefined && !isFullName(provided.name)) return { success: false, error: MISSING_TEXT.name, field: 'name' };
    if (provided.specialty !== undefined && provided.specialty.length < 2) return { success: false, error: MISSING_TEXT.specialty, field: 'specialty' };
    if (provided.phone !== undefined && !isPhone(provided.phone)) return { success: false, error: MISSING_TEXT.phone, field: 'phone' };
    if (provided.documentImageUrl !== undefined && !DIPLOMA_URL.test(provided.documentImageUrl)) {
      return { success: false, error: MISSING_TEXT.documentImage, field: 'documentImageUrl' };
    }

    // What the profile would look like with the new values on top.
    const merged = {
      name: provided.name ?? doctor?.name ?? user.name ?? '',
      phone: provided.phone ?? doctor?.phone ?? '',
      documentImage: provided.documentImageUrl ?? doctor?.documentImage ?? '',
      specialty: provided.specialty !== undefined ? { ru: provided.specialty } : (doctor?.specialty ?? null),
    };
    const result = evaluateAuthor(merged.name, { status: 'pending', ...merged });
    if (!result.canSubmit) {
      const first = result.missing[0];
      return { success: false, error: MISSING_TEXT[first], field: FIELD_OF[first] };
    }

    let doctorId: unknown;
    if (doctor) {
      const set: Record<string, string> = {};
      if (provided.name !== undefined) set.name = provided.name;
      if (provided.phone !== undefined) set.phone = provided.phone;
      if (provided.documentImageUrl !== undefined) set.documentImage = provided.documentImageUrl;
      if (provided.specialty !== undefined) set['specialty.ru'] = provided.specialty;
      if (Object.keys(set).length > 0) await Doctor.updateOne({ _id: doctor._id }, { $set: set });
      doctorId = doctor._id;
    } else {
      const created = await Doctor.create({
        userId: user._id,
        name: merged.name,
        slug: generateSlug(merged.name),
        phone: merged.phone,
        specialty: { ru: provided.specialty },
        documentImage: merged.documentImage,
        status: 'pending',
        image: user.image || DEFAULT_AVATAR,
      });
      doctorId = created._id;
      notifyAdminNewDoctor(merged.name, merged.phone, provided.specialty ?? '', merged.documentImage)?.catch?.(() => undefined);
    }

    // The byline of the articles is this name.
    if (provided.name !== undefined && user.name !== provided.name) {
      await User.updateOne({ _id: user._id }, { $set: { name: provided.name } });
    }

    // The specialty is shown in five languages; the translation can take a while, so the person does not wait for it.
    if (provided.specialty) {
      const specialty = provided.specialty;
      after(async () => {
        try {
          const { didFallback, ...translated } = await translateText(specialty);
          void didFallback;
          await Doctor.updateOne({ _id: doctorId }, { $set: { specialty: translated } });
        } catch (error) {
          console.error('specialty translation failed:', error);
        }
      });
    }

    return { success: true, standing: 'pending' };
  } catch (error: unknown) {
    console.error('completeAuthorProfile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить' };
  }
}

export type DraftResult =
  | { success: true; language: string; data: Record<string, unknown> }
  | { success: false; error: string };

export async function getAuthorDraft(id: string): Promise<DraftResult> {
  try {
    const person = await currentPerson();
    if (!person) return { success: false, error: 'Необходима авторизация' };
    const draft = (await ArticleDraft.findOne({ _id: id, userId: person.user._id }).lean()) as
      | { language: string; data: Record<string, unknown> }
      | null;
    if (!draft) return { success: false, error: 'Черновик не найден' };
    return { success: true, language: draft.language, data: draft.data };
  } catch {
    return { success: false, error: 'Черновик не найден' };
  }
}

export async function deleteAuthorDraft(id: string): Promise<{ success: boolean }> {
  try {
    const person = await currentPerson();
    if (!person) return { success: false };
    const res = await ArticleDraft.deleteOne({ _id: id, userId: person.user._id });
    return { success: res.deletedCount === 1 };
  } catch {
    return { success: false };
  }
}

/** For an approved doctor who still has drafts (approved by another route): publishes them all. */
export async function publishMyDrafts(): Promise<{ success: boolean; published: number; error?: string }> {
  try {
    const person = await currentPerson();
    if (!person) return { success: false, published: 0, error: 'Необходима авторизация' };
    const { user, doctor } = person;
    if (!doctor || doctor.status !== 'approved') {
      return { success: false, published: 0, error: 'Профиль врача ещё не подтверждён' };
    }
    const slugs = await publishDraftsOf(user._id, doctor._id);
    return { success: true, published: slugs.length };
  } catch (error: unknown) {
    console.error('publishMyDrafts error:', error);
    return { success: false, published: 0, error: error instanceof Error ? error.message : 'Не удалось опубликовать' };
  }
}
