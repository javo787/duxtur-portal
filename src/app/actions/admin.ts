'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { revalidatePath } from 'next/cache';

export async function updateDoctorStatus(doctorId: string, status: 'approved' | 'rejected') {
  await dbConnect();
  await Doctor.findByIdAndUpdate(doctorId, { status });
  
  // ВАЖНО: Обновляем кэш для ВСЕХ языковых версий админки
  // Так как мы не знаем, на каком языке сидит админ, используем layout или путь
  revalidatePath('/', 'layout'); 
  
  return { success: true };
}
