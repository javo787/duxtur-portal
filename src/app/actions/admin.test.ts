import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const m = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  checkAccess: vi.fn(),
  dbConnect: vi.fn(),
  recordAudit: vi.fn(),
  revalidatePath: vi.fn(),
  sendEmail: vi.fn(),
  afterDoctorApproved: vi.fn(),
  reviewChanged: vi.fn(),
  trashDoctor: vi.fn(), trashClinic: vi.fn(), trashArticle: vi.fn(), trashReview: vi.fn(),
  doctor: { findOneAndUpdate: vi.fn(), findById: vi.fn() },
  clinic: { findOneAndUpdate: vi.fn(), findById: vi.fn() },
  article: { findByIdAndUpdate: vi.fn() },
  user: { findById: vi.fn() },
  review: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('@/lib/authGuards', () => ({ requireStaff: m.requireStaff }));
vi.mock('@/lib/admin-scope', () => ({ checkAccess: m.checkAccess }));
vi.mock('@/lib/mongodb', () => ({ default: m.dbConnect }));
vi.mock('@/lib/audit-log', () => ({ recordAudit: m.recordAudit }));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('resend', () => ({ Resend: class { emails = { send: m.sendEmail }; } }));
vi.mock('@/lib/author-approval', () => ({ afterDoctorApproved: m.afterDoctorApproved }));
vi.mock('@/lib/review-service', () => ({ reviewChanged: m.reviewChanged }));
vi.mock('@/lib/admin-trash', () => ({
  trashDoctor: m.trashDoctor, trashClinic: m.trashClinic, trashArticle: m.trashArticle, trashReview: m.trashReview,
}));
vi.mock('@/models/Doctor', () => ({ default: m.doctor }));
vi.mock('@/models/Clinic', () => ({ default: m.clinic }));
vi.mock('@/models/Article', () => ({ default: m.article }));
vi.mock('@/models/User', () => ({ default: m.user }));
vi.mock('@/models/Review', () => ({ default: m.review }));

import * as admin from './admin';

const ID = '507f1f77bcf86cd799439011';
const lean = (v: unknown) => ({ lean: async () => v });
const ACTOR = { userId: 'admin1', email: 'a@duxtur.org', role: 'portal_admin' as const };
const MANAGER = { userId: 'm1', email: 'm@duxtur.org', role: 'portal_manager' as const };
const reasonForm = (reason: string) => { const f = new FormData(); f.set('reason', reason); return f; };
const sentHtml = () => String(m.sendEmail.mock.calls[0][0].html);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 'test-key';
  m.requireStaff.mockResolvedValue(ACTOR);
  m.checkAccess.mockResolvedValue({ ok: true, record: {} });
  m.sendEmail.mockResolvedValue({});
  m.afterDoctorApproved.mockResolvedValue(undefined);
  m.reviewChanged.mockResolvedValue(undefined);
  m.trashDoctor.mockResolvedValue({ ok: true });
  m.trashClinic.mockResolvedValue({ ok: true });
  m.trashArticle.mockResolvedValue({ ok: true });
  m.trashReview.mockResolvedValue({ ok: true });
  m.doctor.findOneAndUpdate.mockReturnValue(lean({ name: 'Иванов Иван' }));
  m.doctor.findById.mockReturnValue(lean({ _id: ID, name: 'Иванов Иван', slug: 'ivanov', userId: 'u1' }));
  m.user.findById.mockReturnValue(lean({ email: 'doctor@example.com' }));
  m.clinic.findOneAndUpdate.mockReturnValue(lean({ name: { ru: 'Клиника Нур' } }));
  m.clinic.findById.mockReturnValue(lean({ _id: ID, name: { ru: 'Клиника Нур' }, userId: 'u2' }));
  m.article.findByIdAndUpdate.mockReturnValue(lean({ title: { ru: 'Статья' }, slug: 'statya' }));
  m.review.findById.mockResolvedValue({ _id: ID, isVerified: true, text: 'Хороший врач', doctorId: 'd1' });
});

describe('authorization', () => {
  it('every action rejects a non-admin before touching the database, the trash or the log', async () => {
    m.requireStaff.mockRejectedValue(new Error('Unauthorized'));
    const calls: Array<() => Promise<unknown>> = [
      () => admin.updateDoctorStatus(ID, 'approved'),
      () => admin.approveClinic(ID),
      () => admin.rejectClinic(ID),
      () => admin.banClinic(ID, true),
      () => admin.deleteClinic(ID),
      () => admin.deleteDoctor(ID),
      () => admin.deleteArticle(ID),
      () => admin.toggleDoctorBan(ID, true),
      () => admin.approveArticle(ID),
      () => admin.approveReview(ID),
      () => admin.hideReview(ID),
      () => admin.deleteReview(ID),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow('Unauthorized');
    expect(m.requireStaff).toHaveBeenCalled();
    expect(m.checkAccess).not.toHaveBeenCalled();
    expect(m.dbConnect).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
    for (const t of [m.trashDoctor, m.trashClinic, m.trashArticle, m.trashReview]) expect(t).not.toHaveBeenCalled();
  });
});

describe('updateDoctorStatus', () => {
  it('refuses a status that is not approve or reject, without writing', async () => {
    for (const status of ['banned', 'pending', 'pre_imported', 'whatever', '']) {
      expect(await admin.updateDoctorStatus(ID, status)).toEqual({ error: 'Недопустимый статус заявки' });
    }
    expect(m.doctor.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses an id that is not an ObjectId, without writing', async () => {
    expect(await admin.updateDoctorStatus('{"$ne":1}', 'approved')).toEqual({ error: 'Некорректный идентификатор' });
    expect(m.doctor.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('approves: saves the status, e-mails, opens the cabinet, logs it', async () => {
    expect(await admin.updateDoctorStatus(ID, 'approved')).toBeUndefined();
    expect(m.doctor.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { status: 'approved' }, expect.anything());
    expect(m.sendEmail).toHaveBeenCalledTimes(1);
    expect(m.sendEmail.mock.calls[0][0].to).toBe('doctor@example.com');
    expect(m.afterDoctorApproved).toHaveBeenCalledWith(ID);
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'doctor.approved', entityType: 'doctor', entityId: ID, entityLabel: 'Иванов Иван',
    }));
  });

  it('rejects with a reason: it goes to the e-mail and to the log', async () => {
    await admin.updateDoctorStatus(ID, 'rejected', reasonForm('Фото диплома нечёткое'));
    expect(sentHtml()).toContain('Фото диплома нечёткое');
    expect(sentHtml()).not.toContain('Возможные причины');
    expect(m.afterDoctorApproved).not.toHaveBeenCalled();
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'doctor.rejected', meta: { reason: 'Фото диплома нечёткое' },
    }));
  });

  it('rejects without a reason: the usual list of possible reasons, nothing invented in the log', async () => {
    await admin.updateDoctorStatus(ID, 'rejected');
    expect(sentHtml()).toContain('Возможные причины');
    expect(m.recordAudit.mock.calls[0][0].meta).toBeUndefined();
  });

  it('escapes the reason and the name so they cannot inject HTML into the e-mail', async () => {
    m.doctor.findById.mockReturnValue(lean({ _id: ID, name: 'Иван <script>x()</script>', slug: 'i', userId: 'u1' }));
    await admin.updateDoctorStatus(ID, 'rejected', reasonForm('<a href="https://evil.example">нажмите</a>'));
    const html = sentHtml();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
    expect(html).toContain('&lt;script&gt;');
  });

  it('answers with an error for a doctor that does not exist and sends and logs nothing', async () => {
    m.doctor.findOneAndUpdate.mockReturnValue(lean(null));
    expect(await admin.updateDoctorStatus(ID, 'approved')).toEqual({ error: 'Врач: запись не найдена' });
    expect(m.sendEmail).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('a failed e-mail does not undo or hide the decision', async () => {
    m.sendEmail.mockRejectedValue(new Error('resend down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await admin.updateDoctorStatus(ID, 'approved')).toBeUndefined();
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'doctor.approved' }));
  });
});

describe('clinics', () => {
  it('approve and reject log the decision; reject carries the reason to the owner', async () => {
    await admin.approveClinic(ID);
    expect(m.clinic.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { status: 'approved' }, expect.anything());
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'clinic.approved', entityLabel: 'Клиника Нур' }));

    m.sendEmail.mockClear();
    m.user.findById.mockReturnValue(lean({ email: 'owner@example.com' }));
    await admin.rejectClinic(ID, reasonForm('Нет лицензии'));
    expect(sentHtml()).toContain('Нет лицензии');
    expect(m.recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'clinic.rejected', meta: { reason: 'Нет лицензии' },
    }));
  });

  it('ban needs a real boolean and a real id', async () => {
    expect(await admin.banClinic(ID, 'true' as unknown as boolean)).toEqual({ error: 'Некорректный идентификатор' });
    expect(await admin.banClinic('x', true)).toEqual({ error: 'Некорректный идентификатор' });
    expect(m.clinic.findOneAndUpdate).not.toHaveBeenCalled();
    await admin.banClinic(ID, true);
    expect(m.clinic.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { status: 'banned' }, expect.anything());
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'clinic.banned' }));
  });
});

describe('doctor ban', () => {
  it('logs the ban and the return from it', async () => {
    await admin.toggleDoctorBan(ID, true);
    expect(m.recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'doctor.banned' }));
    expect(m.sendEmail).not.toHaveBeenCalled();
    await admin.toggleDoctorBan(ID, false);
    expect(m.recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'doctor.unbanned' }));
    expect(m.afterDoctorApproved).toHaveBeenCalledWith(ID);
  });
});

describe('deleting goes through the trash', () => {
  it('passes the signed-in admin to the trash and refreshes the pages on success', async () => {
    expect(await admin.deleteDoctor(ID)).toBeUndefined();
    expect(m.trashDoctor).toHaveBeenCalledWith(ID, ACTOR);
    expect(await admin.deleteClinic(ID)).toBeUndefined();
    expect(m.trashClinic).toHaveBeenCalledWith(ID, ACTOR);
    expect(await admin.deleteArticle(ID)).toBeUndefined();
    expect(m.trashArticle).toHaveBeenCalledWith(ID, ACTOR);
    expect(await admin.deleteReview(ID)).toBeUndefined();
    expect(m.trashReview).toHaveBeenCalledWith(ID, ACTOR);
    expect(m.revalidatePath).toHaveBeenCalled();
  });

  it('shows the trash error to the admin and refreshes nothing when nothing was deleted', async () => {
    m.trashDoctor.mockResolvedValue({ ok: false, error: 'Не удалось сохранить копию в корзину, ничего не удалено' });
    expect(await admin.deleteDoctor(ID)).toEqual({ error: 'Не удалось сохранить копию в корзину, ничего не удалено' });
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it('admin.ts itself never deletes: every delete is in src/lib/admin-trash.ts', () => {
    const source = readFileSync(resolve(__dirname, 'admin.ts'), 'utf8');
    expect(source).not.toMatch(/\b(deleteOne|deleteMany|findByIdAndDelete|findOneAndDelete|remove)\s*\(/);
  });
});

describe('articles and reviews', () => {
  it('approving an article is logged with its title', async () => {
    await admin.approveArticle(ID);
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'article.approved', entityLabel: 'Статья' }));
  });

  it('hiding a review refreshes the numbers and logs it; hiding it again changes nothing', async () => {
    expect(await admin.hideReview(ID)).toBeUndefined();
    expect(m.review.findByIdAndUpdate).toHaveBeenCalledWith(ID, { isVerified: false });
    expect(m.reviewChanged).toHaveBeenCalledTimes(1);
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'review.hidden', entityLabel: 'Хороший врач' }));

    vi.clearAllMocks();
    m.requireStaff.mockResolvedValue(ACTOR);
    m.checkAccess.mockResolvedValue({ ok: true, record: {} });
    m.review.findById.mockResolvedValue({ _id: ID, isVerified: false, text: 'x' });
    expect(await admin.hideReview(ID)).toBeUndefined();
    expect(m.review.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('answers with an error for a review that does not exist', async () => {
    m.review.findById.mockResolvedValue(null);
    expect(await admin.approveReview(ID)).toEqual({ error: 'Отзыв не найден' });
  });
});

describe('a manager', () => {
  beforeEach(() => { m.requireStaff.mockResolvedValue(MANAGER); });

  it('takes an application from the queue by approving it: the doctor becomes theirs', async () => {
    m.checkAccess.mockResolvedValue({ ok: true, record: { status: 'pending' } });
    expect(await admin.updateDoctorStatus(ID, 'approved')).toBeUndefined();
    expect(m.checkAccess).toHaveBeenCalledWith(MANAGER, 'approve', 'doctor', ID);
    const [filter, update] = m.doctor.findOneAndUpdate.mock.calls[0];
    expect(update).toEqual({ status: 'approved', managedBy: 'm1' });
    // the database repeats the rule, so two managers cannot take the same application at once
    expect(filter).toEqual({ _id: ID, $or: [{ managedBy: null }, { managedBy: 'm1' }] });
    expect(m.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ actor: MANAGER, action: 'doctor.approved' }));
  });

  it('does not claim a record that is already theirs', async () => {
    m.checkAccess.mockResolvedValue({ ok: true, record: { managedBy: 'm1', status: 'approved' } });
    await admin.updateDoctorStatus(ID, 'rejected');
    expect(m.doctor.findOneAndUpdate.mock.calls[0][1]).toEqual({ status: 'rejected' });
  });

  it('is refused somebody else\'s doctor, with nothing written, e-mailed or logged', async () => {
    m.checkAccess.mockResolvedValue({ ok: false, error: 'Эта запись не ваша' });
    for (const call of [
      () => admin.updateDoctorStatus(ID, 'approved'),
      () => admin.toggleDoctorBan(ID, true),
      () => admin.deleteDoctor(ID),
      () => admin.approveClinic(ID),
      () => admin.rejectClinic(ID),
      () => admin.banClinic(ID, true),
      () => admin.deleteClinic(ID),
      () => admin.approveArticle(ID),
      () => admin.deleteArticle(ID),
      () => admin.approveReview(ID),
      () => admin.hideReview(ID),
      () => admin.deleteReview(ID),
    ]) {
      expect(await call()).toEqual({ error: 'Эта запись не ваша' });
    }
    for (const w of [m.doctor.findOneAndUpdate, m.clinic.findOneAndUpdate, m.article.findByIdAndUpdate, m.review.findByIdAndUpdate]) {
      expect(w).not.toHaveBeenCalled();
    }
    for (const t of [m.trashDoctor, m.trashClinic, m.trashArticle, m.trashReview]) expect(t).not.toHaveBeenCalled();
    expect(m.sendEmail).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('asks the right question for every kind of action', async () => {
    await admin.toggleDoctorBan(ID, true);
    expect(m.checkAccess).toHaveBeenLastCalledWith(MANAGER, 'ban', 'doctor', ID);
    expect(m.doctor.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: ID, managedBy: 'm1' });
    await admin.deleteClinic(ID);
    expect(m.checkAccess).toHaveBeenLastCalledWith(MANAGER, 'delete', 'clinic', ID);
    await admin.deleteArticle(ID);
    expect(m.checkAccess).toHaveBeenLastCalledWith(MANAGER, 'delete', 'article', ID);
    await admin.hideReview(ID);
    expect(m.checkAccess).toHaveBeenLastCalledWith(MANAGER, 'edit', 'review', ID);
    await admin.approveReview(ID);
    expect(m.checkAccess).toHaveBeenLastCalledWith(MANAGER, 'approve', 'review', ID);
  });

  it('says so when somebody took the application between the check and the write', async () => {
    m.checkAccess.mockResolvedValue({ ok: true, record: { status: 'pending' } });
    m.doctor.findOneAndUpdate.mockReturnValue(lean(null));
    expect(await admin.updateDoctorStatus(ID, 'approved')).toEqual({ error: expect.stringContaining('другой менеджер') });
    expect(m.sendEmail).not.toHaveBeenCalled();
    expect(m.recordAudit).not.toHaveBeenCalled();
  });

  it('deleting goes to the trash with the manager as the one who deleted', async () => {
    await admin.deleteDoctor(ID);
    expect(m.trashDoctor).toHaveBeenCalledWith(ID, MANAGER);
  });
});
