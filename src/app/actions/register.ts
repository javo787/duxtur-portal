'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import bcrypt from 'bcryptjs';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { notifyAdminNewDoctor } from '@/lib/telegram'; // Импортируем бота

export async function registerDoctor(formData: FormData) {
  try {
    await dbConnect();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const specialty = formData.get('specialty') as string;
    const diplomaFile = formData.get('diploma') as File;

    if (!email || !password || !name || !diplomaFile) {
      return { success: false, error: "Заполните все поля!" };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "Email уже занят." };
    }

    // Загрузка диплома
    const uploadData = new FormData();
    uploadData.append('file', diplomaFile);
    const uploadResult = await uploadImageToCloudinary(uploadData);

    if (!uploadResult.success) {
      return { success: false, error: "Ошибка загрузки диплома" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'doctor'
    });

    const newDoctor = await Doctor.create({
      userId: newUser._id,
      name,
      slug: name.toLowerCase().replace(/ /g, '-') + '-' + Date.now().toString().slice(-4),
      phone,
      specialty: { ru: specialty },
      documentImage: uploadResult.url,
      status: 'pending',
      image: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
    });

    // --- ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ В TELEGRAM ---
    // Это не блокирует регистрацию, работает в фоне
    notifyAdminNewDoctor(name, phone, specialty, uploadResult.url);

    return { success: true };

  } catch (error: any) {
    console.error("Reg Error:", error);
    return { success: false, error: error.message };
  }
}
