import { cache } from 'react';
import dbConnect from './mongodb';
import Clinic from '@/models/Clinic';
import { buildClinicQuery, buildClinicSort, ClinicFilters } from './clinic-query';
import { indexableListingFacets, type FacetSource, type ListingFacet } from './clinic-seo';

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

/**
 * Same as getClinics, but deduplicated within one request: generateMetadata and the page both need the
 * result, and React's cache() only matches calls whose arguments are identical, which a fresh filters
 * object never is. Primitive arguments are.
 */
export const getClinicsPage = cache(
  async (city: string, type: string, specialty: string, q: string, sort: string, page: number, limit: number) =>
    getClinics({
      city: city || undefined,
      type: type || undefined,
      specialty: specialty || undefined,
      q: q || undefined,
      sort: sort || undefined,
      page,
      limit,
    }),
);

let facetMemo: { at: number; facets: ListingFacet[] } | null = null;
const FACET_TTL_MS = 10 * 60 * 1000;

/**
 * City / type / specialty listings that have enough clinics to be indexable (the same list the sitemap uses).
 * Kept for a few minutes in memory: it changes only when clinics are added, and every directory render wants it.
 */
export async function getIndexableFacets(): Promise<ListingFacet[]> {
  if (facetMemo && Date.now() - facetMemo.at < FACET_TTL_MS) return facetMemo.facets;
  await dbConnect();
  const docs = await Clinic.find({ status: { $in: ['approved', 'pre_imported'] } })
    .select('city type specialties updatedAt')
    .lean();
  const facets = indexableListingFacets(docs as unknown as FacetSource[]);
  facetMemo = { at: Date.now(), facets };
  return facets;
}
