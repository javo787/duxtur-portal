import Link from 'next/link';
import {
  Stethoscope, Building2, Eye, ArrowRight,
  CircleCheck, CircleX, Trash2, Ban, Undo2,
} from 'lucide-react';
import type { Staff } from '@/lib/admin-access';
import { queueQuery, type OwnedIds } from '@/lib/admin-queue';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import {
  updateDoctorStatus, deleteDoctor, toggleDoctorBan,
  deleteClinic, banClinic,
} from '@/app/actions/admin';
import { ActionButton } from '../_components/ActionButton';
import { Avatar, Card, EmptyState, SectionHeader } from '../_components/ui';
import type { ClinicRow, DoctorRow } from '../_shared/rows';

const DIRECTORY_LIMIT = 60;
const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';

const shortDate = (d: unknown) => new Date(d as string).toLocaleDateString('ru');

const viewLinkCls =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-200 ring-1 ring-inset ring-white/10 transition-colors duration-150 hover:bg-white/[0.09]';

export async function DirectoryView({ lang, staff, own, counts }: {
  lang: string;
  staff: Staff;
  own: OwnedIds | null;
  counts: { doctorsApproved: number; clinicsApproved: number; doctorsBanned: number; doctorsRejected: number };
}) {
  const base = `/${lang}/admin/portal`;
  const [approvedDoctors, approvedClinics, bannedDoctors, rejectedDoctors] = await Promise.all([
    Doctor.find(queueQuery(staff, 'doctors', 'approved', own)).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<DoctorRow[]>(),
    Clinic.find(queueQuery(staff, 'clinics', 'approved', own)).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<ClinicRow[]>(),
    Doctor.find(queueQuery(staff, 'doctors', 'banned', own)).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
    Doctor.find(queueQuery(staff, 'doctors', 'rejected', own)).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
  ]);

  const seeAll = (href: string, shown: number, total: number) => (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:underline">
      {total > shown ? `Показаны ${shown} из ${total} · Все` : 'Открыть список'} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );

  return (
    <>
      <section aria-labelledby="authors">
        <SectionHeader
          id="authors" icon={Stethoscope} title="Активные врачи и авторы" count={counts.doctorsApproved} tone="emerald"
          action={seeAll(`${base}/doctors`, approvedDoctors.length, counts.doctorsApproved)}
        />
        {approvedDoctors.length === 0 ? (
          <EmptyState icon={Stethoscope} title="Нет активных врачей" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {approvedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 p-4">
                <Avatar src={doc.image || FALLBACK_AVATAR} name={doc.name || ''} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                  <p className="truncate text-xs text-sky-300">{doc.specialty?.ru}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{doc.phone}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} target="_blank" className={viewLinkCls}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Профиль
                  </Link>
                  <ActionButton action={toggleDoctorBan.bind(null, doc._id.toString(), true)} label="Бан" variant="warning" icon={Ban} confirm="Заблокировать врача?" />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить врача, его аккаунт и статьи? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="approved-clinics">
        <SectionHeader
          id="approved-clinics" icon={Building2} title="Одобренные клиники" count={counts.clinicsApproved} tone="sky"
          action={seeAll(`${base}/clinics`, approvedClinics.length, counts.clinicsApproved)}
        />
        {approvedClinics.length === 0 ? (
          <EmptyState icon={Building2} title="Нет одобренных клиник" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {approvedClinics.map((clinic: ClinicRow) => (
              <Card key={String(clinic._id)} as="article" className="flex items-center gap-4 p-4">
                <Avatar src={clinic.logo || FALLBACK_AVATAR} name={clinic.name?.ru || ''} size={52} rounded="xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{clinic.name?.ru}</p>
                  <p className="truncate text-xs text-sky-300">{[clinic.type, clinic.city].filter(Boolean).join(' · ')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Врачей: {clinic.doctorIds?.length || 0}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/${lang}/clinics/${clinic.slug}`} target="_blank" className={viewLinkCls}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Профиль
                  </Link>
                  <ActionButton action={banClinic.bind(null, clinic._id.toString(), true)} label="Бан" variant="warning" icon={Ban} confirm="Заблокировать клинику?" />
                  <ActionButton action={deleteClinic.bind(null, clinic._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить клинику? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {bannedDoctors.length > 0 && (
        <section aria-labelledby="banned">
          <SectionHeader id="banned" icon={Ban} title="Заблокированные" count={counts.doctorsBanned} tone="red" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bannedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 border-red-400/15 p-4">
                <div className="opacity-60"><Avatar src={doc.image || FALLBACK_AVATAR} name={doc.name || ''} size={44} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-300">{doc.name}</p>
                  <p className="truncate text-xs text-red-300/80">{doc.specialty?.ru}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton action={toggleDoctorBan.bind(null, doc._id.toString(), false)} label="Разбанить" variant="success" icon={Undo2} />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить врача, его аккаунт и статьи? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {rejectedDoctors.length > 0 && (
        <section aria-labelledby="rejected">
          <SectionHeader id="rejected" icon={CircleX} title="Отклонённые заявки" count={counts.doctorsRejected} tone="neutral" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rejectedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-300">{doc.name}</p>
                  <p className="truncate text-xs text-gray-500">{doc.specialty?.ru} · {doc.phone}</p>
                  <p className="text-xs text-gray-600">{shortDate(doc.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton action={updateDoctorStatus.bind(null, doc._id.toString(), 'approved')} label="Одобрить" variant="success" icon={CircleCheck} />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить заявку, аккаунт и статьи врача? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
