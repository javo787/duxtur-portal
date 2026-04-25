'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import { revalidatePath } from 'next/cache';

export async function updateDoctorStatus(id: string, status: string) {
  await dbConnect();
  await Doctor.findByIdAndUpdate(id, { status });
  revalidatePath('/admin/portal');
}

export async function deleteDoctor(id: string) {
  await dbConnect();
  const doctor = await Doctor.findById(id);
  if (!doctor) return;
  // Удаляем все статьи врача
  await Article.deleteMany({ authorId: id });
  // Удаляем User аккаунт
  await User.findByIdAndDelete(doctor.userId);
  // Удаляем профиль врача
  await Doctor.findByIdAndDelete(id);
  revalidatePath('/admin/portal');
}

export async function deleteArticle(id: string) {
  await dbConnect();
  await Article.findByIdAndDelete(id);
  revalidatePath('/admin/portal');
}

export async function toggleDoctorBan(id: string, banned: boolean) {
  await dbConnect();
  await Doctor.findByIdAndUpdate(id, { 
    status: banned ? 'banned' : 'approved' 
  });
  revalidatePath('/admin/portal');
}
