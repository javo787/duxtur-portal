/** What the portal dashboard reads from the database (lean documents), typed so the lists do not need `any`. */
export interface Oid { toString(): string }

export interface Titles { ru?: string; uz?: string; tg?: string; ky?: string; kk?: string }

export interface DoctorRow {
  _id: Oid; name?: string; image?: string; phone?: string; documentImage?: string; isClaimed?: boolean;
  importSourceUrl?: string; slug?: string; specialty?: { ru?: string }; createdAt: Date;
}

export interface ClinicRow {
  _id: Oid; name?: { ru?: string }; slug?: string; type?: string; city?: string; phone?: string; logo?: string;
  licenseDocument?: string; doctorIds?: unknown[];
}

export interface ArticleRow {
  _id: Oid; title?: Titles; slug?: string; image?: string; category?: string; aiGenerated?: boolean; views?: number;
  createdAt: Date; authorId?: { name?: string } | null;
}

export interface ReviewRow {
  _id: Oid; rating: number; text: string; isVerified?: boolean; isAnonymous?: boolean; authorName?: string; createdAt: Date;
  doctorId?: { _id: Oid; name?: string; slug?: string } | null;
  clinicId?: { name?: { ru?: string }; slug?: string } | null;
  articleId?: { title?: Titles; slug?: string } | null;
  patientId?: { name?: string; email?: string; provider?: string; role?: string } | null;
}
