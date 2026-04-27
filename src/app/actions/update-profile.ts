'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

interface DoctorProfileData {
  name?: string;
  phone?: string;
  image?: string;
  specialty?: { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string };
  experience?: number;
  languages?: string[];
  bio?: string;
  workplace?: string;
  education?: string;
  sameAs?: string[];
}

export async function updateDoctorProfile(data: DoctorProfileData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Не авторизован' };

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return { success: false, error: 'Пользователь не найден' };

    const updateFields = Object.fromEntries(
      Object.entries({
        name:       data.name,
        phone:      data.phone,
        image:      data.image,
        specialty:  data.specialty,
        experience: data.experience,
        languages:  data.languages,
        bio:        data.bio,
        workplace:  data.workplace,
        education:  data.education,
        sameAs:     data.sameAs,
      }).filter(([_, v]) => v !== undefined && v !== null)
    );

    await Doctor.findOneAndUpdate(
      { userId: (user as any)._id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
