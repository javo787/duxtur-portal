'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { notifyAdminNewDoctor } from '@/lib/telegram';
import { createDoctor } from '@/lib/db-doctor';
import { translateText } from '@/lib/translation-service';

const translitMap: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  // Таджикские
  'ӣ':'i','ӯ':'u','ҳ':'h','қ':'q','ғ':'g','ҷ':'j',
  // Казахские/Кыргызские
  'ң':'n','ү':'u','ұ':'u','ө':'o','ә':'a','і':'i',
  // Узбекские (латиница уже норм, но на всякий)
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

export async function registerDoctor(formData: FormData) {
  try {
    await dbConnect();

    const name             = formData.get('name') as string;
    const email            = formData.get('email') as string;
    const phone            = formData.get('phone') as string;
    const password         = formData.get('password') as string;
    const specialty        = formData.get('specialty') as string;
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
