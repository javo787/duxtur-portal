'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { revalidatePath } from 'next/cache';

export async function updateDoctorStatus(doctorId: string, status: 'approved' | 'rejected') {
  await dbConnect();
  await Doctor.findByIdAndUpdate(doctorId, { status });
  
  // Обновляем кэш для всего сайта
  revalidatePath('/', 'layout'); 
  
  // ВАЖНО: Мы убрали "return { success: true }".
  // Теперь функция возвращает Promise<void>, и TypeScript счастлив.
}
