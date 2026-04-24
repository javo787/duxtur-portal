'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { revalidatePath } from 'next/cache';

export async function updateDoctorStatus(id: string, status: string) {
  await dbConnect();
  await Doctor.findByIdAndUpdate(id, { status });
  revalidatePath('/admin/portal');
}
