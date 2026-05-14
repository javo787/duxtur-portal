import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

export async function findDoctorByEmail(email: string) {
  await dbConnect();
  const user = await User.findOne({ email }).lean();
  if (!user) return null;
  return Doctor.findOne({ userId: (user as any)._id });
}

export async function findDoctorByUserId(userId: string) {
  await dbConnect();
  return Doctor.findOne({ userId });
}

export async function updateDoctorProfileByUserId(userId: string, updateFields: Record<string, unknown>) {
  await dbConnect();
  return Doctor.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { new: true, upsert: true, runValidators: true }
  );
}

export async function createDoctor(data: Record<string, unknown>) {
  await dbConnect();
  return Doctor.create(data);
}
