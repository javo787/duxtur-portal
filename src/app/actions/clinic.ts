'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import bcrypt from 'bcryptjs';
import { translateText } from '@/lib/translation-service';
import { stripHtml, generateSlug } from '@/lib/utils';
import { sendMessageToAdmin } from '@/lib/telegram';
import { auth } from '@/auth';

export async function registerClinic(formData: any) {
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
      licenseDocument
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

    const translatedName = await translateText(name);

    const geoCoordinates = (coordinates?.lat && coordinates?.lng)
      ? { lat: coordinates.lat, lng: coordinates.lng, type: 'Point' as const, coordinates: [coordinates.lng, coordinates.lat] }
      : undefined;

    try {
      await Clinic.create([{
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
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.slug) {
        // Retry once with a new slug
        await Clinic.create([{
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
      } else {
        throw err;
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
      `📂 [Лицензия](${licenseDocument})`;

    sendMessageToAdmin(message);

    return { success: true };
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Clinic Reg Error:', error);
    return { success: false, error: error.message };
  } finally {
    await session.endSession();
  }
}

export async function updateClinicProfile(id: string, data: any, userId?: string) {
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
    return { success: false, error: error.message };
  }
}

export async function translateFieldAction(text: string) {
  try {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const result = await translateText(text);
    return { success: true, translations: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
