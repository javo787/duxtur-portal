/**
 * Shared shapes for the clinic ingest pipeline.
 *
 * Deliberately NO rating / review fields: imported listings must never carry
 * engagement data from another site (see PARSING_ROADMAP.md, data principles).
 */

export type IngestSource = 'osm' | 'website' | '2gis' | 'manual';

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
