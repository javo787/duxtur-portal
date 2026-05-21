'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import bcrypt from 'bcryptjs';
import { translateText } from '@/lib/translation-service';
import { stripHtml } from '@/lib/utils';
import { sendMessageToAdmin } from '@/lib/telegram';
import { auth } from '@/auth';

const translitMap: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  // Таджикские
  'ӣ':'i','ӯ':'u','ҳ':'h','қ':'q','ғ':'g','ҷ':'j',
  // Казахские/Кыргызские
  'ң':'n','ү':'u','ұ':'u','ө':'o','ә':'a','і':'i',
  // Узбекские
  'ʻ':'','ʼ':'',
};

function transliterate(text: string): string {
  return text.toLowerCase().split('').map(char => translitMap[char] ?? char).join('');
}

function generateSlug(name: string): string {
  return transliterate(name)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
    + '-' + Date.now().toString().slice(-4);
}

export async function registerClinic(formData: any) {
  try {
    await dbConnect();

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: 'Email уже занят.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'clinic',
      name: ownerName || name,
    });

    const translatedName = await translateText(name);

    await Clinic.create({
      userId: newUser._id,
      name: translatedName,
      slug: generateSlug(name),
      email,
      phone,
      type,
      city,
      address,
      coordinates,
      logo,
      licenseDocument,
      status: 'pending',
    });

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
    console.error('Clinic Reg Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateClinicProfile(id: string, data: any) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
       throw new Error('Unauthorized');
    }

    const clinic = await Clinic.findById(id);
    if (!clinic || clinic.userId.toString() !== session.user?.id) {
       throw new Error('Clinic not found or access denied');
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
