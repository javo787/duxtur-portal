'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { stripHtml } from '@/lib/utils';
import { updateDoctorProfileByUserId, findDoctorByEmail } from '@/lib/db-doctor';
import { translateFields } from '@/lib/translation-service';

/**
 * Данные профиля врача, которые могут быть обновлены.
 * Поля типа string | { ru, uz, … } поддерживают как перевод одной строки (тогда ru берётся
 * из входящего значения), так и готовый объект переводов.
 */
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
  /** Геолокация врача. Ожидается полный GeoJSON-подобный объект, создаваемый на клиенте */
  coordinates?: {
    lat: number;
    lng: number;
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

/**
 * Обновление профиля врача.
 * Текстовые поля, переданные как строки, автоматически переводятся на другие языки
 * при первом сохранении (или при изменении русского варианта).
 */
export async function updateDoctorProfile(data: DoctorProfileData) {
  try {
    // 1. Проверка авторизации
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Не авторизован' };
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return { success: false, error: 'Пользователь не найден' };
    }

    const doctor = await findDoctorByEmail(session.user.email);
    if (!doctor) {
      return { success: false, error: 'Доктор не найден' };
    }

    // 2. Собираем поля, которые нужно перевести (только если передан новый ru‑текст)
    const fieldsToTranslate: Record<string, string> = {};

    const addFieldForTranslation = (
      key: string,
      incomingValue: string | undefined,
      currentRuValue: string | undefined,
    ) => {
      if (incomingValue && incomingValue !== currentRuValue) {
        fieldsToTranslate[key] = stripHtml(incomingValue);
      }
    };

    // bio, workplace, education
    addFieldForTranslation(
      'bio',
      typeof data.bio === 'string' ? data.bio : undefined,
      doctor.bio?.ru,
    );
    addFieldForTranslation(
      'workplace',
      typeof data.workplace === 'string' ? data.workplace : undefined,
      doctor.workplace?.ru,
    );
    addFieldForTranslation(
      'education',
      typeof data.education === 'string' ? data.education : undefined,
      doctor.education?.ru,
    );

    // specialty – может быть строкой или объектом с ru
    const incomingSpecialtyRu =
      typeof data.specialty === 'string'
        ? data.specialty
        : (data.specialty as any)?.ru;
    addFieldForTranslation('specialty', incomingSpecialtyRu, doctor.specialty?.ru);

    // 3. Запрашиваем переводы, если есть что переводить
    const translations = await translateFields(fieldsToTranslate);

    // 4. Формируем объект для обновления (только не undefined / null поля)
    const updateFields: Record<string, unknown> = Object.fromEntries(
      Object.entries({
        name: data.name ? stripHtml(data.name) : undefined,
        phone: data.phone ? stripHtml(data.phone) : undefined,
        image: data.image,
        experience: data.experience,
        languages: data.languages,
        sameAs: data.sameAs,
        instagram: data.instagram,
        telegram: data.telegram,
        whatsapp: data.whatsapp,
        workingHours: data.workingHours,
        accentColor: data.accentColor,
        cardTheme: data.cardTheme,
        city: data.city,
        district: data.district,
        address: data.address,
        clinicName: data.clinicName,
        acceptsNewPatients: data.acceptsNewPatients,
        consultationTypes: data.consultationTypes,
        priceRange: data.priceRange,
        schedule: data.schedule,
        coordinates: data.coordinates, // ← исправление: сохраняем геолокацию
      }).filter(([_, v]) => v !== undefined && v !== null),
    );

    // 5. Для переводимых полей подставляем переводы или готовые объекты
    const setTranslatableField = (fieldName: string, incomingData: any) => {
      if (translations[fieldName]) {
        // есть свежий перевод – используем его (содержит ru, uz, tg…)
        updateFields[fieldName] = translations[fieldName];
      } else if (incomingData && typeof incomingData !== 'string') {
        // клиент прислал готовый объект переводов – сохраняем как есть
        updateFields[fieldName] = incomingData;
      }
      // иначе не трогаем – поле останется без изменений
    };

    setTranslatableField('specialty', data.specialty);
    setTranslatableField('bio', data.bio);
    setTranslatableField('workplace', data.workplace);
    setTranslatableField('education', data.education);

    // 6. Сохраняем в БД
    await updateDoctorProfileByUserId((user as any)._id.toString(), updateFields);

    return { success: true };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { success: false, error: error.message };
  }
}
