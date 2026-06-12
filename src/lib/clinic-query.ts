export interface ClinicFilters {
  city?: string;
  type?: string;
  specialty?: string;
  q?: string;
  sort?: string;
}

import { escapeRegExp } from './utils/string';

export function buildClinicQuery(filters: ClinicFilters) {
  const query: Record<string, any> = {
    status: { $in: ['approved', 'pre_imported'] }
  };

  if (filters.city) {
    // Case-insensitive match for city
    query.city = { $regex: new RegExp('^' + escapeRegExp(filters.city) + '$', 'i') };
    // Case-insensitive match for city, accounting for potential leading/trailing whitespace in DB
    const escapedCity = filters.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.city = { $regex: new RegExp(`^\\s*${escapedCity}\\s*$`, 'i') };
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

export function buildClinicSort(sort?: string): Record<string, 1 | -1> {
  if (sort === 'reviews') {
    return { 'rating.count': -1 };
  } else if (sort === 'doctors') {
    return { 'doctorCount': -1 };
  }

  return { 'rating.avg': -1 };
}
