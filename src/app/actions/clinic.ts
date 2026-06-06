'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import * as bcrypt from 'bcryptjs';
import { translateText } from '@/lib/translation-service';
import { generateSlug } from '@/lib/utils';
import { sendMessageToAdmin } from '@/lib/telegram';
import { auth } from '@/auth';

export async function registerClinic(formData: Record<string, any>) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    const {
      name,
      email,
      phone,
      password,
      type,
      ownerName,
      city,
      address,
      coordinates,
      logo,
      licenseDocument,
      claimClinicId
    } = formData;

    if (!email || !password || !name || !licenseDocument) {
      return { success: false, error: 'Заполните обязательные поля и загрузите лицензию!' };
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return { success: false, error: 'Email уже занят.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create([{
      email,
      password: hashedPassword,
      role: 'clinic',
      name: ownerName || name,
    }], { session });

    let clinicId: string;

    if (claimClinicId) {
      const existingClinic = await Clinic.findById(claimClinicId).session(session);

      if (!existingClinic || existingClinic.status !== 'pre_imported') {
        await session.abortTransaction();
        return { success: false, error: 'Клиника не найдена или уже занята.' };
      }

      await Clinic.findByIdAndUpdate(
        claimClinicId,
        {
          $set: {
            userId: newUser[0]._id,
            status: 'pending',
            licenseDocument,
            // Update fields if they were provided during registration and were empty in pre_imported
            ...(existingClinic.phone ? {} : { phone }),
            ...(existingClinic.address ? {} : { address }),
            ...(existingClinic.logo ? {} : { logo }),
            ...(existingClinic.email ? {} : { email }),
          }
        },
        { session }
      );
      clinicId = claimClinicId;
    } else {
      const translatedName = await translateText(name);
      const geoCoordinates = (coordinates?.lat && coordinates?.lng)
        ? { lat: coordinates.lat, lng: coordinates.lng, type: 'Point' as const, coordinates: [coordinates.lng, coordinates.lat] }
        : undefined;

      try {
        const created = await Clinic.create([{
          userId: newUser[0]._id,
          name: translatedName,
          slug: generateSlug(name),
          email,
          phone,
          type,
          city,
          address,
          coordinates: geoCoordinates,
          logo,
          licenseDocument,
          status: 'pending',
        }], { session });
        clinicId = created[0]._id.toString();
      } catch (err: any) {
        if (err.code === 11000 && err.keyPattern?.slug) {
          // Retry once with a new slug (wait a bit to ensure timestamp suffix is different)
          await new Promise(resolve => setTimeout(resolve, 10));
          const created = await Clinic.create([{
            userId: newUser[0]._id,
            name: translatedName,
            slug: generateSlug(name),
            email,
            phone,
            type,
            city,
            address,
            coordinates: geoCoordinates,
            logo,
            licenseDocument,
            status: 'pending',
          }], { session });
          clinicId = created[0]._id.toString();
        } else {
          throw err;
        }
      }
    }

    await session.commitTransaction();

    // Notify admin
    const message = `🏥 *Новая заявка: Клиника*\n\n` +
      `📌 Название: ${name}\n` +
      `👤 Владелец: ${ownerName}\n` +
      `📍 Город: ${city}\n` +
      `📞 Тел: ${phone}\n` +
      `✉️ Email: ${email}\n` +
      `📂 [Лицензия](${licenseDocument})\n` +
      `${claimClinicId ? '🔗 Клейм существующего профиля' : '🆕 Новая клиника'}`;

    sendMessageToAdmin(message);

    return { success: true, clinicId };
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Clinic Reg Error:', error);
    return { success: false, error: (error as Error).message };
  } finally {
    await session.endSession();
  }
}

export async function updateClinicProfile(id: string, data: Record<string, any>, userId?: string) {
  try {
    if (!id || !id.match(/^[a-f\d]{24}$/i)) {
      return { success: false, error: 'Invalid clinic ID' };
    }
    await dbConnect();

    const clinic = await Clinic.findById(id);
    if (!clinic) {
       throw new Error('Clinic not found');
    }

    // If userId is provided, verify ownership
    if (userId && clinic.userId.toString() !== userId) {
       throw new Error('Access denied');
    }

    // Auto-translate name and description if they changed in RU
    const updateData = { ...data };
    if (data.name?.ru && data.name.ru !== clinic.name.ru) {
       updateData.name = await translateText(data.name.ru);
    }
    if (data.description?.ru && data.description.ru !== clinic.description.ru) {
       updateData.description = await translateText(data.description.ru);
    }

    await Clinic.findByIdAndUpdate(id, { $set: updateData }, { runValidators: true });
    return { success: true };
  } catch (error: any) {
    console.error('Update Clinic Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function translateFieldAction(text: string) {
  try {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const result = await translateText(text);

    if (result.didFallback) {
      console.warn(`[TRANSLATION ACTION] Translation for "${text.substring(0, 20)}..." returned fallback.`);
      return {
        success: true,
        isPartial: true,
        translations: result,
        warning: 'Translation service unavailable, using original text'
      };
    }

    return { success: true, translations: result };
  } catch (error: any) {
    console.error('[TRANSLATION ACTION] Error:', error);
    return {
      success: true,
      isPartial: true,
      translations: { ru: text, uz: text, tg: text, kk: text, ky: text, didFallback: true },
      warning: 'Translation failed, using original text'
    };
  }
}

export async function recalculateClinicRating(clinicId: string) {
  await dbConnect();
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return;

  const Review = (await import('@/models/Review')).default;

  const allReviews = await Review.find({
    $or: [
      { clinicId: clinic._id },
      { doctorId: { $in: clinic.doctorIds || [] } }
    ],
    isVerified: true
  });

  const count = allReviews.length;
  const sum = allReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
  const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  await Clinic.findByIdAndUpdate(clinicId, {
    'rating.avg': avg,
    'rating.count': count
  });

  try {
    const { revalidatePath } = await import('next/cache');
    if (clinic.slug) {
      revalidatePath(`/ru/clinic/${clinic.slug}`);
      revalidatePath(`/uz/clinic/${clinic.slug}`);
      revalidatePath(`/tj/clinic/${clinic.slug}`);
      revalidatePath(`/kk/clinic/${clinic.slug}`);
      revalidatePath(`/ky/clinic/${clinic.slug}`);
    }
  } catch (e) {
    console.error('Revalidation error:', e);
  }
}
