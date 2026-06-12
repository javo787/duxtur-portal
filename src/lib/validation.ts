import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, ClinicType } from './clinic-constants';

export interface ClinicSearchParams {
  city?: string;
  type?: string;
  specialty?: string;
  q?: string;
  page?: string;
  sort?: string;
}

export function sanitizeSearchParams(params: ClinicSearchParams) {
  const sanitized: {
    city?: string;
    type?: string;
    specialty?: string;
    q?: string;
    page: number;
    sort?: string;
  } = {
    page: 1
  };

  // City: trim and check against allowed list (case-insensitive)
  if (params.city) {
    const trimmedCity = params.city.trim();
    if (ALLOWED_CITIES.some(c => c.toLowerCase() === trimmedCity.toLowerCase())) {
      sanitized.city = trimmedCity;
    }
  }

  // Type: check against allowed list
  if (params.type && ALLOWED_CLINIC_TYPES.includes(params.type as ClinicType)) {
    sanitized.type = params.type;
  }

  // Specialty: trim and limit length
  if (params.specialty) {
    const trimmedSpecialty = params.specialty.trim();
    if (trimmedSpecialty.length > 0 && trimmedSpecialty.length <= 100) {
      sanitized.specialty = trimmedSpecialty;
    }
  }

  // Q: limit length and sanitize characters
  if (params.q) {
    sanitized.q = params.q.slice(0, 100).replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  }

  // Page: ensure it's a positive integer
  const page = parseInt(params.page || '1', 10);
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  sanitized.page = validPage;

  // Sort: check against allowed values
  const allowedSorts = ['reviews', 'doctors'];
  if (params.sort && allowedSorts.includes(params.sort)) {
    sanitized.sort = params.sort;
  }

  return sanitized;
}
