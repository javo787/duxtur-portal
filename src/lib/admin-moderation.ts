/**
 * Pure rules of the portal admin: what a moderation decision may be, how a rejection reason is cleaned,
 * how an audit entry and a trash expiry are built. No database and no Next.js here, so it is all unit-tested.
 */

export const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
export const isObjectId = (v: unknown): v is string => typeof v === 'string' && OBJECT_ID_RE.test(v);

// ─── Decisions on a doctor's application ───────────────────────────────────────────────────────────────────────────
// A server action is a public POST endpoint: the status that arrives is never trusted, only these two are accepted.
export const DOCTOR_DECISIONS = ['approved', 'rejected'] as const;
export type DoctorDecision = (typeof DOCTOR_DECISIONS)[number];

export function parseDoctorDecision(value: unknown): DoctorDecision | null {
  return (DOCTOR_DECISIONS as readonly unknown[]).includes(value) ? (value as DoctorDecision) : null;
}

// ─── Rejection reason ──────────────────────────────────────────────────────────────────────────────────────────────
export const REASON_MAX_LENGTH = 500;

/** Trims, drops control characters, keeps at most one blank line and cuts to REASON_MAX_LENGTH. */
export function cleanReason(value: unknown): string {
  if (typeof value !== 'string') return '';
  // control characters must not reach an e-mail or the log
  const text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n');
  return text.replace(/\n{3,}/g, '\n\n').trim().slice(0, REASON_MAX_LENGTH).trim();
}

/** Reads the `reason` field of a submitted form. Works with anything that looks like FormData (server actions get one). */
export function reasonFromForm(input: unknown): string {
  const form = input as { get?: (key: string) => unknown } | null | undefined;
  return typeof form?.get === 'function' ? cleanReason(form.get('reason')) : '';
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Trash ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const TRASH_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function trashExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRASH_RETENTION_DAYS * DAY_MS);
}

/** Whole days left before the trash item is purged by the database (never negative). */
export function trashDaysLeft(expiresAt: Date | string, now: Date = new Date()): number {
  const left = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

// ─── Audit log ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const AUDIT_ENTITY_TYPES = ['doctor', 'clinic', 'article', 'review'] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  doctor: 'Врач', clinic: 'Клиника', article: 'Статья', review: 'Отзыв',
};

export const AUDIT_ACTIONS = {
  'doctor.approved': 'Врач одобрен',
  'doctor.rejected': 'Заявка врача отклонена',
  'doctor.banned': 'Врач заблокирован',
  'doctor.unbanned': 'Врач разблокирован',
  'doctor.created': 'Профиль врача создан',
  'doctor.updated': 'Профиль врача изменён',
  'doctor.trashed': 'Врач удалён (в корзину)',
  'clinic.approved': 'Клиника одобрена',
  'clinic.rejected': 'Заявка клиники отклонена',
  'clinic.banned': 'Клиника заблокирована',
  'clinic.unbanned': 'Клиника разблокирована',
  'clinic.created': 'Клиника создана',
  'clinic.updated': 'Клиника изменена',
  'clinic.trashed': 'Клиника удалена (в корзину)',
  'article.approved': 'Статья одобрена',
  'article.trashed': 'Статья удалена (в корзину)',
  'review.shown': 'Отзыв показан',
  'review.hidden': 'Отзыв скрыт',
  'review.trashed': 'Отзыв удалён (в корзину)',
  'trash.restored': 'Восстановлено из корзины',
  'trash.purged': 'Удалено из корзины навсегда',
} as const;
export type AuditAction = keyof typeof AUDIT_ACTIONS;
export const isAuditAction = (v: unknown): v is AuditAction => typeof v === 'string' && v in AUDIT_ACTIONS;

export interface AuditInput {
  actor: { userId: string; email: string };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel?: string;
  meta?: Record<string, unknown>;
}

export interface AuditEntry {
  actorId: string; actorEmail: string; action: AuditAction; entityType: AuditEntityType;
  entityId: string; entityLabel: string; meta: Record<string, string | number | boolean | null>;
}

const META_MAX_KEYS = 10;
const META_MAX_STRING = 500;
const LABEL_MAX = 200;

/** Only flat, short values go to the log: no objects, no documents, nothing personal beyond what the caller passes. */
export function sanitizeMeta(meta: Record<string, unknown> | undefined): AuditEntry['meta'] {
  const out: AuditEntry['meta'] = {};
  for (const [key, value] of Object.entries(meta ?? {}).slice(0, META_MAX_KEYS)) {
    if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      out[key] = value as null | boolean | number;
    } else if (typeof value === 'string') {
      out[key] = value.slice(0, META_MAX_STRING);
    }
  }
  return out;
}

export function buildAuditEntry(input: AuditInput): AuditEntry {
  return {
    actorId: String(input.actor.userId),
    actorEmail: String(input.actor.email).toLowerCase(),
    action: input.action,
    entityType: input.entityType,
    entityId: String(input.entityId),
    entityLabel: String(input.entityLabel ?? '').trim().slice(0, LABEL_MAX),
    meta: sanitizeMeta(input.meta),
  };
}

/** Where the admin can open the thing a log line is about (articles and reviews have no admin page yet). */
export function auditEntityHref(type: string, id: string, lang: string): string | null {
  const l = /^[a-z]{2}$/.test(lang) ? lang : 'ru';
  if (!isObjectId(id)) return null;
  if (type === 'doctor') return `/${l}/admin/portal/doctors/${id}`;
  if (type === 'clinic') return `/${l}/admin/portal/clinics/${id}`;
  return null;
}
