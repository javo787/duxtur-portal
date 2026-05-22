'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { notifyAdminNewDoctor } from '@/lib/telegram';
import { createDoctor } from '@/lib/db-doctor';
import { translateText } from '@/lib/translation-service';
import { stripHtml, generateSlug } from '@/lib/utils';

export async function registerDoctor(formData: FormData) {
  try {
    await dbConnect();

    const name             = stripHtml(formData.get('name') as string);
    const email            = formData.get('email') as string;
    const phone            = stripHtml(formData.get('phone') as string);
    const password         = formData.get('password') as string;
    const specialty        = stripHtml(formData.get('specialty') as string);
    const documentImageUrl = formData.get('documentImageUrl') as string;

    if (!email || !password || !name || !documentImageUrl) {
      return { success: false, error: 'Заполните все поля и загрузите диплом!' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: 'Email уже занят.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'doctor',
    });

    // Автоматический перевод специальности
    const translatedSpecialty = await translateText(specialty);

    await createDoctor({
      userId:        newUser._id,
      name,
      slug:          generateSlug(name),
      phone,
      specialty:     translatedSpecialty,
      documentImage: documentImageUrl,
      status:        'pending',
      image:         'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    });

    notifyAdminNewDoctor(name, phone, specialty, documentImageUrl);

    return { success: true };
  } catch (error: any) {
    console.error('Reg Error:', error);
    return { success: false, error: error.message };
  }
}
