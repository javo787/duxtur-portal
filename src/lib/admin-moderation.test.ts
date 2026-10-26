import { describe, it, expect } from 'vitest';
import {
  AUDIT_ACTIONS, auditEntityHref, buildAuditEntry, cleanReason, escapeHtml, isAuditAction, isObjectId,
  parseDoctorDecision, reasonFromForm, REASON_MAX_LENGTH, sanitizeMeta, TRASH_RETENTION_DAYS, trashDaysLeft, trashExpiry,
} from './admin-moderation';

describe('parseDoctorDecision', () => {
  it('accepts only approve and reject', () => {
    expect(parseDoctorDecision('approved')).toBe('approved');
    expect(parseDoctorDecision('rejected')).toBe('rejected');
  });
  it('refuses everything else a public POST could carry', () => {
    for (const bad of ['banned', 'pending', 'pre_imported', 'APPROVED', '', 'admin', undefined, null, 1, {}]) {
      expect(parseDoctorDecision(bad)).toBeNull();
    }
  });
});

describe('isObjectId', () => {
  it('accepts 24 hex characters only', () => {
    expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
    for (const bad of ['', 'abc', '507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111', 'zzzf1f77bcf86cd799439011', { $ne: 1 }, 5, null]) {
      expect(isObjectId(bad)).toBe(false);
    }
  });
});

describe('cleanReason', () => {
  it('trims, normalizes line breaks and keeps one blank line at most', () => {
    expect(cleanReason('  Фото нечёткое.\r\n\r\n\r\n\r\nПришлите заново  ')).toBe('Фото нечёткое.\n\nПришлите заново');
  });
  it('drops control characters', () => {
    expect(cleanReason('ok\u0000\u0007text')).toBe('oktext');
  });
  it('cuts to the maximum length', () => {
    expect(cleanReason('а'.repeat(REASON_MAX_LENGTH + 100))).toHaveLength(REASON_MAX_LENGTH);
  });
  it('returns an empty string for anything that is not text', () => {
    expect(cleanReason(undefined)).toBe('');
    expect(cleanReason(42)).toBe('');
    expect(cleanReason('   ')).toBe('');
  });
});

describe('reasonFromForm', () => {
  it('reads the reason field of a real FormData', () => {
    const fd = new FormData();
    fd.set('reason', ' нет лицензии ');
    expect(reasonFromForm(fd)).toBe('нет лицензии');
  });
  it('is empty when the action was called without a form', () => {
    expect(reasonFromForm(undefined)).toBe('');
    expect(reasonFromForm(null)).toBe('');
    expect(reasonFromForm('rejected')).toBe('');
    expect(reasonFromForm(new FormData())).toBe('');
  });
});

describe('escapeHtml', () => {
  it('neutralizes markup so a reason or a name cannot inject HTML into an e-mail', () => {
    expect(escapeHtml('<img src=x onerror="a()">&\'')).toBe('&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('trash retention', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  it('expires in exactly the retention period', () => {
    expect(trashExpiry(now).toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(TRASH_RETENTION_DAYS).toBe(30);
  });
  it('counts whole days left and never goes below zero', () => {
    expect(trashDaysLeft(trashExpiry(now), now)).toBe(30);
    expect(trashDaysLeft('2026-10-02T12:00:00Z', now)).toBe(2);
    expect(trashDaysLeft('2026-09-01T00:00:00Z', now)).toBe(0);
  });
});

describe('audit entries', () => {
  const actor = { userId: 'u1', email: 'Admin@Duxtur.ORG' };

  it('builds a normalized entry', () => {
    const e = buildAuditEntry({
      actor, action: 'doctor.rejected', entityType: 'doctor', entityId: '507f1f77bcf86cd799439011',
      entityLabel: '  Иванов Иван  ', meta: { reason: 'нет диплома' },
    });
    expect(e).toEqual({
      actorId: 'u1', actorEmail: 'admin@duxtur.org', action: 'doctor.rejected', entityType: 'doctor',
      entityId: '507f1f77bcf86cd799439011', entityLabel: 'Иванов Иван', meta: { reason: 'нет диплома' },
    });
  });

  it('keeps only short flat values in meta', () => {
    const meta = sanitizeMeta({
      a: 'x'.repeat(900), b: 3, c: true, d: null, e: { nested: 1 }, f: [1], g: undefined, h: NaN, i: () => 1,
    });
    expect(Object.keys(meta).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect((meta.a as string).length).toBe(500);
  });

  it('limits the number of meta keys and the label length', () => {
    const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i]));
    expect(Object.keys(sanitizeMeta(many))).toHaveLength(10);
    expect(buildAuditEntry({ actor, action: 'article.trashed', entityType: 'article', entityId: 'a', entityLabel: 'я'.repeat(500) }).entityLabel).toHaveLength(200);
  });

  it('has a Russian label for every action and recognizes only known ones', () => {
    for (const [key, label] of Object.entries(AUDIT_ACTIONS)) {
      expect(isAuditAction(key)).toBe(true);
      expect(label.length).toBeGreaterThan(3);
    }
    expect(isAuditAction('doctor.exploded')).toBe(false);
    expect(isAuditAction(undefined)).toBe(false);
  });

  it('links to the admin page of doctors and clinics only', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(auditEntityHref('doctor', id, 'ru')).toBe(`/ru/admin/portal/doctors/${id}`);
    expect(auditEntityHref('clinic', id, 'tg')).toBe(`/tg/admin/portal/clinics/${id}`);
    expect(auditEntityHref('article', id, 'ru')).toBeNull();
    expect(auditEntityHref('review', id, 'ru')).toBeNull();
    expect(auditEntityHref('doctor', 'not-an-id', 'ru')).toBeNull();
    expect(auditEntityHref('doctor', id, '../x')).toBe(`/ru/admin/portal/doctors/${id}`);
  });
});
