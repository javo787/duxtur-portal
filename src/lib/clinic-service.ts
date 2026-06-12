import { cache } from 'react';
import dbConnect from './mongodb';
import Clinic from '@/models/Clinic';
import { buildClinicQuery, buildClinicSort, ClinicFilters } from './clinic-query';

export const getClinics = cache(async (filters: ClinicFilters & { page: number, limit: number }) => {
  await dbConnect();

  const query = buildClinicQuery(filters);
  const sortStage = buildClinicSort(filters.sort);
  const { page, limit } = filters;

  const [clinics, total] = await Promise.all([
    Clinic.aggregate([
      { $match: query },
      {
        $addFields: {
          doctorCount: { $size: { $ifNull: ["$doctorIds", []] } }
        }
      },
      { $sort: sortStage },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          userId: 0,
          licenseNumber: 0,
          licenseDocument: 0,
          updatedAt: 0,
          __v: 0,
          doctorIds: 0 // We use doctorCount instead
        }
      }
    ]),
    Clinic.countDocuments(query)
  ]);

  return { clinics, total };
});
