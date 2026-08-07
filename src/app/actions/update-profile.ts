'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { stripHtml } from '@/lib/utils';
import { updateDoctorProfileByUserId, findDoctorByEmail } from '@/lib/db-doctor';
import { translateFields, translateText } from '@/lib/translation-service';

/**
 * Данные профиля врача, которые могут быть обновлены.
 * Поля типа string | { ru, uz, … } поддерживают как перевод одной строки (тогда ru берётся
 * из входящего значения), так и готовый объект переводов.
 */
interface DoctorProfileData {
  name?: string;
  phone?: string;
  image?: string;
  licenseNumber?: string;
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

  // ─── Премиум-профиль ───
  gallery?: string[];
  videoIntro?: string;
  achievements?: Array<{
    type: 'award' | 'certification' | 'membership' | 'publication';
    title: string; // ru-текст, переводится автоматически
    issuer?: string;
    year?: number;
  }>;
  expertiseTags?: string[]; // ru-теги, переводятся автоматически
  faq?: Array<{ question: string; answer: string }>; // ru-текст, переводится автоматически
  paymentMethods?: string[];
  insuranceProviders?: string[];
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

    // bio, workplace, education – handle both string and object with .ru
    const incomingBioRu = typeof data.bio === 'string' ? data.bio : (data.bio as any)?.ru;
    addFieldForTranslation('bio', incomingBioRu, doctor.bio?.ru);

    const incomingWorkplaceRu = typeof data.workplace === 'string' ? data.workplace : (data.workplace as any)?.ru;
    addFieldForTranslation('workplace', incomingWorkplaceRu, doctor.workplace?.ru);

    const incomingEducationRu = typeof data.education === 'string' ? data.education : (data.education as any)?.ru;
    addFieldForTranslation('education', incomingEducationRu, doctor.education?.ru);

    // specialty – может быть строкой или объектом с ru
    const incomingSpecialtyRu =
      typeof data.specialty === 'string'
        ? data.specialty
        : (data.specialty as any)?.ru;
    addFieldForTranslation('specialty', incomingSpecialtyRu, doctor.specialty?.ru);

    // 3. Запрашиваем переводы, если есть что переводить
    const translations = await translateFields(fieldsToTranslate);

    // 3.1 Переводим элементы массивов (достижения, FAQ, теги направлений) параллельно
    const [achievementsUpdate, faqUpdate, expertiseTagsUpdate] = await Promise.all([
      data.achievements
        ? Promise.all(
            data.achievements.map(async (a) => ({
              type: a.type || 'award',
              title: a.title ? await translateText(stripHtml(a.title)) : { ru: '', uz: '', kk: '', ky: '', tg: '' },
              issuer: a.issuer ? stripHtml(a.issuer) : '',
              year: a.year || undefined,
            })),
          )
        : undefined,
      data.faq
        ? Promise.all(
            data.faq.map(async (f) => ({
              question: f.question ? await translateText(stripHtml(f.question)) : { ru: '', uz: '', kk: '', ky: '', tg: '' },
              answer: f.answer ? await translateText(stripHtml(f.answer)) : { ru: '', uz: '', kk: '', ky: '', tg: '' },
            })),
          )
        : undefined,
      data.expertiseTags
        ? Promise.all(data.expertiseTags.filter(Boolean).map((tag) => translateText(stripHtml(tag))))
        : undefined,
    ]);

    // 4. Формируем объект для обновления (только не undefined / null поля)
    const updateFields: Record<string, unknown> = Object.fromEntries(
      Object.entries({
        name: data.name ? stripHtml(data.name) : undefined,
        phone: data.phone ? stripHtml(data.phone) : undefined,
        licenseNumber: data.licenseNumber ? stripHtml(data.licenseNumber) : undefined,
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
        gallery: data.gallery,
        videoIntro: data.videoIntro,
        paymentMethods: data.paymentMethods,
        insuranceProviders: data.insuranceProviders,
        achievements: achievementsUpdate,
        faq: faqUpdate,
        expertiseTags: expertiseTagsUpdate,
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
