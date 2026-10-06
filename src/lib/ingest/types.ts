/**
 * Shared shapes for the clinic ingest pipeline.
 *
 * Deliberately NO rating / review fields: imported listings must never carry
 * engagement data from another site (see PARSING_ROADMAP.md, data principles).
 */

export type IngestSource = 'osm' | 'website' | '2gis' | 'manual' | 'ydoc' | 'samt';

export type ClinicType =
  | 'clinic'
  | 'hospital'
  | 'diagnostic_center'
  | 'dental_clinic'
  | 'eye_clinic'
  | 'maternity'
  | 'rehabilitation'
  | 'polyclinic';

export type Lang = 'ru' | 'tg' | 'uz' | 'kk' | 'ky';

export interface RawClinic {
  source: IngestSource;
  /** Stable ID inside the source (e.g. "node/123"). Makes re-runs idempotent. */
  sourceId: string;
  sourceUrl?: string;
  name: string;
  /** Names the source itself provides per language. Never machine-translated. */
  nameLocal?: Partial<Record<Lang, string>>;
  type?: ClinicType;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  phones?: string[];
  website?: string;
  email?: string;
  /** Logo URL on the source (or the clinic's own site). Re-hosted on Cloudinary, never hot-linked. */
  logoUrl?: string;
  /** Up to a couple of photo URLs; first becomes the cover. Re-hosted on Cloudinary. */
  photoUrls?: string[];
  /** Canonical specialty ids (see clinic-constants COMMON_SPECIALTIES). Unknown labels are dropped. */
  specialties?: string[];
}

/** Cloudinary URLs produced by the image step; written to the clinic only into EMPTY fields. */
export interface ClinicImages {
  logo?: string;
  coverImage?: string;
  photos?: string[];
}

export interface ExistingClinic {
  id: string;
  status: string;
  importSource?: string;
  importSourceId?: string;
  nameRu: string;
  phones: string[];
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export type DecisionAction = 'create' | 'update' | 'skip_duplicate' | 'review' | 'invalid';

export interface Decision {
  action: DecisionAction;
  reason: string;
  existingId?: string;
  candidates?: { id: string; name: string; score: number }[];
}
