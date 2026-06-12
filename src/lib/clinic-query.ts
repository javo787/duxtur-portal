import { FilterQuery } from 'mongoose';

export interface ClinicFilters {
  city?: string;
  type?: string;
  specialty?: string;
  q?: string;
  sort?: string;
}

export function buildClinicQuery(filters: ClinicFilters) {
  const query: FilterQuery<Record<string, unknown>> = {
    status: { $in: ['approved', 'pre_imported'] }
  };

  if (filters.city) {
    // Case-insensitive match for city
    query.city = { $regex: new RegExp('^' + filters.city + '$', 'i') };
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.specialty) {
    query.specialties = filters.specialty;
  }

  if (filters.q) {
    query.$text = { $search: filters.q };
  }

  return query;
}

export function buildClinicSort(sort?: string) {
  let sortStage: Record<string, number> = { 'rating.avg': -1 };

  if (sort === 'reviews') {
    sortStage = { 'rating.count': -1 };
  } else if (sort === 'doctors') {
    sortStage = { 'doctorCount': -1 };
  }

  return sortStage;
}
