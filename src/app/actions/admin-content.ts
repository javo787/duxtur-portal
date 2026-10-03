'use server';

import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { requireRole } from '@/lib/authGuards';
import { stableSlug } from '@/lib/ingest/normalize';
import { parseClinicForm } from '@/lib/admin-content/clinic-form';
import { parseDoctorForm } from '@/lib/admin-content/doctor-form';
import { buildPublicId, uploadImage, validateImageFile, type ImageRole } from '@/lib/cloudinary-upload';

/**
 * Content editor for the portal admin: edit any clinic/doctor (including scraped
 * `pre_imported` ones) or create one from scratch. Every action re-checks the role
 * on the server: Server Actions are public POST endpoints, hiding the UI is not enough.
 */

const base = (lang: string) => `/${/^[a-z]{2}$/.test(lang) ? lang : 'ru'}/admin/portal`;
const langOf = (fd: FormData) => String(fd.get('lang') ?? 'ru');
const failTo = (path: string, errors: string[]): never =>
  redirect(`${path}?error=${encodeURIComponent(errors.join('\n'))}`);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Uploads an optional image file from the form. Returns a URL, '' when no file, or an error string. */
async function maybeUpload(
  fd: FormData, key: string, kind: 'clinics' | 'doctors', slug: string, role: ImageRole
): Promise<{ url: string } | { error: string }> {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) return { url: '' };
  const problem = validateImageFile(f);
  if (problem) return { error: problem };
  try {
    return { url: await uploadImage(f, buildPublicId(kind, slug, role)) };
  } catch (e) {
    return { error: `Не удалось загрузить изображение: ${e instanceof Error ? e.message : 'ошибка Cloudinary'}` };
  }
}

function revalidateClinics() {
  revalidatePath('/[lang]/clinics', 'page');
  revalidatePath('/[lang]/clinics/[slug]', 'page');
  revalidatePath('/[lang]/admin/portal/clinics', 'page');
}
function revalidateDoctors() {
  revalidatePath('/[lang]/doctors', 'page');
  revalidatePath('/[lang]/doctors/[slug]', 'page');
  revalidatePath('/[lang]/admin/portal/doctors', 'page');
}

/** id === 'new' creates; otherwise edits the clinic with that id. */
export async function saveClinic(id: string, fd: FormData) {
  await requireRole('portal_admin');
  const lang = langOf(fd);
  const isNew = id === 'new';
  const back = `${base(lang)}/clinics/${isNew ? 'new' : id}`;

  const parsed = parseClinicForm(fd);
  if (!parsed.ok) return failTo(back, parsed.errors);
  const d = parsed.data;

  await dbConnect();
  const existing = isNew ? null : await Clinic.findById(id).lean<{ _id: unknown; slug: string }>();
  if (!isNew && !existing) return failTo(`${base(lang)}/clinics`, ['Клиника не найдена']);

  if (isNew) {
    const dup = await Clinic.findOne({
      'name.ru': { $regex: new RegExp(`^${escapeRegex(d.name.ru)}$`, 'i') },
      city: d.city,
    }).select('_id').lean<{ _id: unknown }>();
    if (dup) {
      return failTo(back, [`Клиника «${d.name.ru}» в городе «${d.city || '—'}» уже есть. Откройте её и отредактируйте, а не создавайте дубликат.`]);
    }
  }

  const slug = existing?.slug ?? stableSlug({ name: d.name.ru, source: 'manual', sourceId: randomUUID() });
  const logo = await maybeUpload(fd, 'logoFile', 'clinics', slug, 'logo');
  const cover = await maybeUpload(fd, 'coverFile', 'clinics', slug, 'cover');
  if ('error' in logo) return failTo(back, [logo.error]);
  if ('error' in cover) return failTo(back, [cover.error]);

  const fields = {
    name: d.name, description: d.description, type: d.type, status: d.status,
    city: d.city, district: d.district, address: d.address,
    phone: d.phone, phone2: d.phone2, email: d.email, website: d.website,
    telegram: d.telegram, whatsapp: d.whatsapp, instagram: d.instagram, facebook: d.facebook,
    specialties: d.specialties, licenseNumber: d.licenseNumber,
    branches: d.branches.map(b => ({
      label: b.label, address: b.address, city: b.city, district: b.district, phone: b.phone,
      ...(b.coordinates ? { coordinates: { lat: b.coordinates.lat, lng: b.coordinates.lng } } : {}),
    })),
    logo: logo.url || d.logo, coverImage: cover.url || d.coverImage,
    ...(d.workingHours ? { workingHours: d.workingHours } : {}),
    ...(d.coordinates
      ? { coordinates: { lat: d.coordinates.lat, lng: d.coordinates.lng, type: 'Point', coordinates: [d.coordinates.lng, d.coordinates.lat] } }
      : {}),
    ...(d.markVerified ? { verifiedAt: new Date(), dataSource: 'admin_verified' } : {}),
  };

  if (isNew) {
    await Clinic.create({ ...fields, slug, importSource: 'manual', dataSource: 'admin_verified' });
  } else {
    await Clinic.updateOne(
      { _id: id },
      { $set: fields, ...(d.coordinates ? {} : { $unset: { coordinates: '' } }) }
    );
  }

  revalidateClinics();
  redirect(`${base(lang)}/clinics?saved=1`);
}

/** Deletes only clinics without an owner account; owned clinics go through the existing moderation flow. */
export async function deleteManagedClinic(id: string, fd: FormData) {
  await requireRole('portal_admin');
  const lang = langOf(fd);
  await dbConnect();
  const clinic = await Clinic.findById(id).lean<{ userId?: unknown }>();
  if (!clinic) return failTo(`${base(lang)}/clinics`, ['Клиника не найдена']);
  if (clinic.userId) {
    return failTo(`${base(lang)}/clinics/${id}`, ['У клиники есть аккаунт владельца: удаляйте её через раздел модерации, чтобы не потерять аккаунт']);
  }
  await Doctor.updateMany({ clinicId: id }, { $set: { clinicId: null } });
  await Clinic.deleteOne({ _id: id });
  revalidateClinics();
  revalidateDoctors();
  redirect(`${base(lang)}/clinics?deleted=1`);
}

export async function saveDoctor(id: string, fd: FormData) {
  await requireRole('portal_admin');
  const lang = langOf(fd);
  const isNew = id === 'new';
  const back = `${base(lang)}/doctors/${isNew ? 'new' : id}`;

  const parsed = parseDoctorForm(fd);
  if (!parsed.ok) return failTo(back, parsed.errors);
  const d = parsed.data;

  await dbConnect();
  const existing = isNew ? null : await Doctor.findById(id).lean<{ _id: unknown; slug?: string; userId?: unknown }>();
  if (!isNew && !existing) return failTo(`${base(lang)}/doctors`, ['Врач не найден']);

  // Doctors with an account must keep a phone (model rule); only pre_imported ones may go without.
  if (d.status !== 'pre_imported' && !d.phone && !existing?.userId) {
    return failTo(back, ['Для статуса, отличного от «pre_imported», нужен телефон врача']);
  }
  if (d.clinicId && !(await Clinic.exists({ _id: d.clinicId }))) {
    return failTo(back, ['Выбранная клиника не найдена']);
  }

  const slug = existing?.slug || (isNew ? stableSlug({ name: d.name, source: 'manual', sourceId: randomUUID() }) : String(existing?._id));
  const img = await maybeUpload(fd, 'imageFile', 'doctors', slug, 'photo');
  if ('error' in img) return failTo(back, [img.error]);

  const fields = {
    name: d.name, specialty: d.specialty, workplace: d.workplace, bio: d.bio, status: d.status,
    phone: d.phone, city: d.city, district: d.district, address: d.address,
    clinicName: d.clinicName, clinicId: d.clinicId,
    experience: d.experience, price: d.price, languages: d.languages,
    consultationTypes: d.consultationTypes.length ? d.consultationTypes : ['in_person'],
    acceptsNewPatients: d.acceptsNewPatients, workingHours: d.workingHours, licenseNumber: d.licenseNumber,
    image: img.url || d.image || undefined,
    instagram: d.instagram, telegram: d.telegram, whatsapp: d.whatsapp, facebook: d.facebook,
    ...(d.coordinates
      ? { coordinates: { lat: d.coordinates.lat, lng: d.coordinates.lng, type: 'Point', coordinates: [d.coordinates.lng, d.coordinates.lat] } }
      : {}),
  };

  if (isNew) {
    await Doctor.create({ ...fields, slug, importedAt: new Date() });
  } else {
    await Doctor.updateOne({ _id: id }, { $set: fields, ...(d.coordinates ? {} : { $unset: { coordinates: '' } }) });
  }

  revalidateDoctors();
  redirect(`${base(lang)}/doctors?saved=1`);
}

export async function deleteManagedDoctor(id: string, fd: FormData) {
  await requireRole('portal_admin');
  const lang = langOf(fd);
  await dbConnect();
  const doctor = await Doctor.findById(id).lean<{ userId?: unknown }>();
  if (!doctor) return failTo(`${base(lang)}/doctors`, ['Врач не найден']);
  if (doctor.userId) {
    return failTo(`${base(lang)}/doctors/${id}`, ['У врача есть аккаунт: удаляйте его через раздел модерации, чтобы не потерять аккаунт и статьи']);
  }
  await Clinic.updateMany({ doctorIds: id }, { $pull: { doctorIds: id } });
  await Doctor.deleteOne({ _id: id });
  revalidateDoctors();
  redirect(`${base(lang)}/doctors?deleted=1`);
}
