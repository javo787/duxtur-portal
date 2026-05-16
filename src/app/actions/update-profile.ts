'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { stripHtml } from '@/lib/utils';
import { updateDoctorProfileByUserId, findDoctorByEmail } from '@/lib/db-doctor';
import { translateFields } from '@/lib/translation-service';

interface DoctorProfileData {
  name?: string;
  phone?: string;
  image?: string;
  specialty?: { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string } | string;
  experience?: number;
  languages?: string[];
  bio?: string | { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string };
  workplace?: string | { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string };
  education?: string | { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string };
  sameAs?: string[];
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  workingHours?: string;
  accentColor?: string;
  cardTheme?: string;
  city?: string;
  district?: string;
  address?: string;
  clinicName?: string;
  acceptsNewPatients?: boolean;
  consultationTypes?: string[];
  priceRange?: { min: number; max: number; currency: string };
  schedule?: Record<string, { open: string; close: string; isWorking: boolean }>;
}

export async function updateDoctorProfile(data: DoctorProfileData) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Не авторизован' };

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return { success: false, error: 'Пользователь не найден' };

    const doctor = await findDoctorByEmail(session.user.email);
    if (!doctor) return { success: false, error: 'Доктор не найден' };

    // Собираем поля для перевода
    const fieldsToTranslate: Record<string, string> = {};
    if (typeof data.bio === 'string' && data.bio !== doctor.bio?.ru) fieldsToTranslate.bio = stripHtml(data.bio);
    if (typeof data.workplace === 'string' && data.workplace !== doctor.workplace?.ru) fieldsToTranslate.workplace = stripHtml(data.workplace);
    if (typeof data.education === 'string' && data.education !== doctor.education?.ru) fieldsToTranslate.education = stripHtml(data.education);

    const incomingSpecialtyRu = typeof data.specialty === 'string' ? data.specialty : (data.specialty as any)?.ru;
    if (incomingSpecialtyRu && incomingSpecialtyRu !== doctor.specialty?.ru) {
        fieldsToTranslate.specialty = stripHtml(incomingSpecialtyRu);
    }

    // Выполняем перевод, если есть новые текстовые данные
    const translations = await translateFields(fieldsToTranslate);

    const updateFields: Record<string, unknown> = Object.fromEntries(
      Object.entries({
        name:         data.name ? stripHtml(data.name) : undefined,
        phone:        data.phone ? stripHtml(data.phone) : undefined,
        image:        data.image,
        experience:   data.experience,
        languages:    data.languages,
        sameAs:       data.sameAs,
        instagram:    data.instagram,
        telegram:     data.telegram,
        whatsapp:     data.whatsapp,
        workingHours: data.workingHours,
        accentColor:  data.accentColor,
        cardTheme:    data.cardTheme,
        city:               data.city,
        district:           data.district,
        address:            data.address,
        clinicName:         data.clinicName,
        acceptsNewPatients: data.acceptsNewPatients,
        consultationTypes:  data.consultationTypes,
        priceRange:         data.priceRange,
        schedule:           data.schedule,
      }).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Только если есть новый перевод или передан объект, обновляем поля.
    // Иначе не трогаем, чтобы не перетереть существующие переводы строкой.
    if (translations.specialty) updateFields.specialty = translations.specialty;
    else if (data.specialty && typeof data.specialty !== 'string') updateFields.specialty = data.specialty;

    if (translations.bio) updateFields.bio = translations.bio;
    else if (data.bio && typeof data.bio !== 'string') updateFields.bio = data.bio;

    if (translations.workplace) updateFields.workplace = translations.workplace;
    else if (data.workplace && typeof data.workplace !== 'string') updateFields.workplace = data.workplace;

    if (translations.education) updateFields.education = translations.education;
    else if (data.education && typeof data.education !== 'string') updateFields.education = data.education;

    await updateDoctorProfileByUserId((user as any)._id.toString(), updateFields);

    return { success: true };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { success: false, error: error.message };
  }
}
