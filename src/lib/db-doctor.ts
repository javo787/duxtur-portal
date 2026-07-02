import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import stringSimilarity from 'string-similarity';

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

export async function claimDoctorProfile(doctorId: string, data: { userId: any; phone: string; documentImage: string }) {
  await dbConnect();
  return Doctor.findOneAndUpdate(
    { _id: doctorId, status: 'pre_imported' },
    {
      $set: {
        userId: data.userId,
        phone: data.phone,
        documentImage: data.documentImage,
        status: 'pending',
        isClaimed: true,
        claimedAt: new Date()
      }
    },
    { new: true }
  );
}

export async function findSimilarPreImportedDoctors(name: string, specialty: string) {
  await dbConnect();
  const candidates = await Doctor.find({ status: 'pre_imported' }).lean();

  const scoredCandidates = candidates
    .map((doc: any) => {
      const nameScore = stringSimilarity.compareTwoStrings(name.toLowerCase(), doc.name.toLowerCase());

      // Secondary signal: specialty overlap (simple check for now)
      let specialtyScore = 0;
      if (specialty && doc.specialty?.ru) {
        specialtyScore = stringSimilarity.compareTwoStrings(specialty.toLowerCase(), doc.specialty.ru.toLowerCase());
      }

      // Final score weighted towards name
      const finalScore = (nameScore * 0.8) + (specialtyScore * 0.2);

      return {
        _id: doc._id.toString(),
        name: doc.name,
        specialty: doc.specialty,
        clinicName: doc.clinicName,
        experience: doc.experience,
        image: doc.image,
        score: finalScore
      };
    })
    .filter(doc => doc.score > 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scoredCandidates;
}
