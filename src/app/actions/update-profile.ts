'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

export async function updateDoctorProfile(data: any) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Не авторизован' };

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return { success: false, error: 'Пользователь не найден' };

    await Doctor.findOneAndUpdate(
      { userId: user._id },
      {
        name: data.name,
        phone: data.phone,
        image: data.image,
        specialty: data.specialty,
        experience: data.experience,
        languages: data.languages,
        bio: data.bio,
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
