import { describe, expect, it } from 'vitest';
import { MIN_INDEXABLE_SPECIALTY_DOCTORS } from './clinic-seo';
import {
  doctorsListingCanonicalPath,
  isPlainDoctorsListing,
  isPlainSpecialtyListing,
  specialtyIndexable,
  specialtyStats,
} from './doctor-seo';

const SLUGS = ['cardiology', 'neurology', 'dentistry'];

describe('doctorsListingCanonicalPath', () => {
  it('points ?specialty= on its own at the landing page of that specialty', () => {
    expect(doctorsListingCanonicalPath({ specialty: 'cardiology' }, SLUGS)).toBe('doctors/cardiology');
  });

  it('ignores sorting and paging: they never make a page of their own', () => {
    expect(doctorsListingCanonicalPath({ specialty: 'cardiology', sort: 'rating', page: '3' }, SLUGS)).toBe('doctors/cardiology');
  });

  it('falls back to the plain directory as soon as another filter narrows the list', () => {
    for (const extra of [{ city: 'Душанбе' }, { type: 'online' }, { accepts: 'true' }, { priceMin: '100' }, { exp: '5' }, { lang_spoken: ['ru', 'tg'] }, { lat: '38.5', lng: '68.7' }]) {
      expect(doctorsListingCanonicalPath({ specialty: 'cardiology', ...extra }, SLUGS)).toBe('doctors');
    }
  });

  it('falls back to the plain directory for an unknown specialty, including prototype names', () => {
    expect(doctorsListingCanonicalPath({ specialty: 'nonsense' }, SLUGS)).toBe('doctors');
    expect(doctorsListingCanonicalPath({ specialty: 'constructor' }, SLUGS)).toBe('doctors');
    expect(doctorsListingCanonicalPath({ specialty: ['cardiology', 'neurology'] }, SLUGS)).toBe('doctors');
  });

  it('treats empty values as absent', () => {
    expect(doctorsListingCanonicalPath({ specialty: 'cardiology', city: '  ' }, SLUGS)).toBe('doctors/cardiology');
    expect(doctorsListingCanonicalPath({}, SLUGS)).toBe('doctors');
  });
});

describe('isPlainDoctorsListing', () => {
  it('is true only for the unfiltered, unsorted first page', () => {
    expect(isPlainDoctorsListing({})).toBe(true);
    expect(isPlainDoctorsListing({ page: '1' })).toBe(true);
    expect(isPlainDoctorsListing({ page: 'abc' })).toBe(true);
    expect(isPlainDoctorsListing({ utm_source: 'telegram' })).toBe(true);
  });

  it('is false for any filter, sorting or later page', () => {
    for (const sp of [{ specialty: 'cardiology' }, { city: 'Душанбе' }, { sort: 'rating' }, { page: '2' }, { lang_spoken: ['ru'] }, { lat: '1', lng: '2' }]) {
      expect(isPlainDoctorsListing(sp)).toBe(false);
    }
  });
});

describe('isPlainSpecialtyListing', () => {
  it('is false for a city, a consultation type, a sorting or a later page', () => {
    expect(isPlainSpecialtyListing({})).toBe(true);
    expect(isPlainSpecialtyListing({ page: '1' })).toBe(true);
    for (const sp of [{ city: 'Худжанд' }, { type: 'online' }, { sort: 'price_asc' }, { page: '2' }]) {
      expect(isPlainSpecialtyListing(sp)).toBe(false);
    }
  });
});

describe('specialtyIndexable', () => {
  it('needs the threshold number of approved doctors', () => {
    expect(specialtyIndexable(0)).toBe(false);
    expect(specialtyIndexable(MIN_INDEXABLE_SPECIALTY_DOCTORS)).toBe(true);
    expect(specialtyIndexable(40)).toBe(true);
  });
});

describe('specialtyStats', () => {
  const labels = { cardiology: 'Кардиология', neurology: 'Неврология', dentistry: 'Стоматология' };

  it('counts doctors per specialty by the Russian name, in the order of the labels', () => {
    const stats = specialtyStats(
      [
        { specialty: { ru: 'Неврология' } },
        { specialty: { ru: 'Кардиология' } },
        { specialty: { ru: 'Кардиология' } },
      ],
      labels,
    );
    expect(stats.map((s) => [s.slug, s.count])).toEqual([['cardiology', 2], ['neurology', 1]]);
  });

  it('leaves out specialties nobody practises and doctors whose specialty is not in the list', () => {
    const stats = specialtyStats([{ specialty: { ru: 'Кардиология' } }, { specialty: { ru: 'Гомеопатия' } }, { specialty: null }, {}], labels);
    expect(stats.map((s) => s.slug)).toEqual(['cardiology']);
  });

  it('dates a specialty by its newest real update and never invents one', () => {
    const [cardio, neuro] = specialtyStats(
      [
        { specialty: { ru: 'Кардиология' }, updatedAt: '2026-01-10T00:00:00.000Z' },
        { specialty: { ru: 'Кардиология' }, updatedAt: new Date('2026-03-05T00:00:00.000Z') },
        { specialty: { ru: 'Кардиология' }, updatedAt: 'not a date' },
        { specialty: { ru: 'Неврология' } },
      ],
      labels,
    );
    expect(cardio.lastModified).toEqual(new Date('2026-03-05T00:00:00.000Z'));
    expect(neuro).not.toHaveProperty('lastModified');
  });
});
