import { saveDoctor, deleteManagedDoctor } from '@/app/actions/admin-content';
import { ALLOWED_CITIES } from '@/lib/clinic-constants';
import { DOCTOR_STATUSES, CONSULTATION_TYPES } from '@/lib/admin-content/doctor-form';
import { STATUS_LABELS } from '../../_shared/AdminShell';
import { Card, Grid, ImagePicker, inputCls, Label, MultiLang } from '../../_shared/FormBits';

const CONSULT_LABELS: Record<string, string> = { in_person: 'Очный приём', online: 'Онлайн', home_visit: 'Выезд на дом' };

export interface DoctorDoc {
  _id: string; userId?: unknown; slug?: string; status?: string; name?: string;
  specialty?: Record<string, string>; workplace?: Record<string, string>; bio?: Record<string, string>;
  phone?: string; city?: string; district?: string; address?: string;
  coordinates?: { lat?: number; lng?: number };
  clinicName?: string; clinicId?: string | null;
  experience?: number; price?: number; languages?: string[]; consultationTypes?: string[];
  acceptsNewPatients?: boolean; workingHours?: string; licenseNumber?: string; image?: string;
  instagram?: string; telegram?: string; whatsapp?: string; facebook?: string;
}
export interface ClinicOption { _id: string; name?: { ru?: string }; city?: string }

export default function DoctorForm({
  lang, id, doctor, clinics,
}: { lang: string; id: string; doctor?: DoctorDoc; clinics: ClinicOption[] }) {
  const isNew = id === 'new';
  const d = doctor;
  const canDelete = !isNew && !d?.userId;

  return (
    <div className="space-y-6">
      <form action={saveDoctor.bind(null, id)} className="space-y-6">
        <input type="hidden" name="lang" value={lang} />

        <Card title="Основное">
          <Grid>
            <Label text="Имя и фамилия *">
              <input name="name" required defaultValue={d?.name ?? ''} className={inputCls} />
            </Label>
            <Label text="Статус" hint="«Импорт» = профиль создан администратором, врач его ещё не подтвердил">
              <select name="status" defaultValue={d?.status ?? 'pre_imported'} className={inputCls}>
                {DOCTOR_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Label>
          </Grid>
          <h4 className="text-xs font-semibold text-gray-400 pt-2">Специальность *</h4>
          <MultiLang prefix="specialty" values={d?.specialty} required />
          <Grid cols={3}>
            <Label text="Стаж, лет"><input name="experience" type="number" min={0} max={70} defaultValue={d?.experience ?? ''} className={inputCls} /></Label>
            <Label text="Цена приёма, сомони"><input name="price" type="number" min={0} defaultValue={d?.price ?? ''} className={inputCls} /></Label>
            <Label text="Номер лицензии"><input name="licenseNumber" defaultValue={d?.licenseNumber ?? ''} className={inputCls} /></Label>
          </Grid>
        </Card>

        <Card title="Место работы">
          <Grid>
            <Label text="Клиника из базы" hint="Привязка к карточке клиники на сайте">
              <select name="clinicId" defaultValue={d?.clinicId ?? ''} className={inputCls}>
                <option value="">— не привязан —</option>
                {clinics.map(c => <option key={String(c._id)} value={String(c._id)}>{c.name?.ru || '—'}{c.city ? ` (${c.city})` : ''}</option>)}
              </select>
            </Label>
            <Label text="Название клиники текстом" hint="Если клиники нет в базе">
              <input name="clinicName" defaultValue={d?.clinicName ?? ''} className={inputCls} />
            </Label>
          </Grid>
          <MultiLang prefix="workplace" values={d?.workplace} />
        </Card>

        <Card title="Контакты и адрес">
          <Grid>
            <Label text="Телефон" hint="Для статуса, отличного от «Импорт», обязателен">
              <input name="phone" defaultValue={d?.phone ?? ''} placeholder="+992 90 000 0000" className={inputCls} />
            </Label>
            <Label text="Telegram"><input name="telegram" defaultValue={d?.telegram ?? ''} className={inputCls} /></Label>
            <Label text="WhatsApp"><input name="whatsapp" defaultValue={d?.whatsapp ?? ''} className={inputCls} /></Label>
            <Label text="Instagram"><input name="instagram" defaultValue={d?.instagram ?? ''} className={inputCls} /></Label>
            <Label text="Facebook"><input name="facebook" defaultValue={d?.facebook ?? ''} placeholder="https://facebook.com/…" className={inputCls} /></Label>
            <Label text="Город">
              <input name="city" list="cities" defaultValue={d?.city ?? ''} className={inputCls} />
              <datalist id="cities">{ALLOWED_CITIES.map(x => <option key={x} value={x} />)}</datalist>
            </Label>
            <Label text="Район"><input name="district" defaultValue={d?.district ?? ''} className={inputCls} /></Label>
            <Label text="Адрес"><input name="address" defaultValue={d?.address ?? ''} className={inputCls} /></Label>
            <span />
            <Label text="Широта"><input name="lat" defaultValue={d?.coordinates?.lat ?? ''} inputMode="decimal" className={inputCls} /></Label>
            <Label text="Долгота"><input name="lng" defaultValue={d?.coordinates?.lng ?? ''} inputMode="decimal" className={inputCls} /></Label>
          </Grid>
        </Card>

        <Card title="Приём">
          <Grid>
            <Label text="Языки приёма" hint="Через запятую: русский, таджикский, английский">
              <input name="languages" defaultValue={d?.languages?.join(', ') ?? ''} className={inputCls} />
            </Label>
            <Label text="Часы приёма текстом" hint="Например: Пн–Пт 09:00–17:00">
              <input name="workingHours" defaultValue={d?.workingHours ?? ''} className={inputCls} />
            </Label>
          </Grid>
          <div className="flex flex-wrap gap-4 text-sm">
            {CONSULTATION_TYPES.map(t => (
              <label key={t} className="flex items-center gap-2">
                <input type="checkbox" name="consultationTypes" value={t} defaultChecked={d?.consultationTypes?.includes(t) ?? t === 'in_person'} />
                {CONSULT_LABELS[t]}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input type="checkbox" name="acceptsNewPatients" defaultChecked={d?.acceptsNewPatients ?? true} /> Принимает новых пациентов
            </label>
          </div>
        </Card>

        <Card title="О враче" hint="Пишите своими словами по проверенным фактам. Не копируйте биографии с чужих сайтов.">
          <MultiLang prefix="bio" values={d?.bio} textarea rows={4} />
        </Card>

        <Card title="Фото (Cloudinary)">
          <ImagePicker label="Фото врача" urlName="image" fileName="imageFile" current={d?.image} />
          <p className="text-xs text-amber-500/80">Загружайте только фото, которые врач сам прислал или разрешил использовать.</p>
        </Card>

        <div className="flex items-center gap-3 sticky bottom-0 bg-gray-950/90 backdrop-blur py-3">
          <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold text-sm transition">
            {isNew ? 'Создать врача' : 'Сохранить'}
          </button>
          <a href={`/${lang}/admin/portal/doctors`} className="text-sm text-gray-400 hover:text-white">Отмена</a>
          {d?.slug && <a href={`/${lang}/doctor/${d.slug}`} target="_blank" className="ml-auto text-sm text-blue-400 hover:underline">Открыть на сайте ↗</a>}
        </div>
      </form>

      {!isNew && (
        <form action={deleteManagedDoctor.bind(null, id)} className="border border-red-900/60 rounded-2xl p-5 space-y-2">
          <input type="hidden" name="lang" value={lang} />
          <h3 className="font-bold text-red-300">Удаление</h3>
          {canDelete ? (
            <>
              <p className="text-xs text-gray-500">Профиль без аккаунта удаляется навсегда и снимается с клиник.</p>
              <button className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold">Удалить врача</button>
            </>
          ) : (
            <p className="text-xs text-gray-500">У врача есть аккаунт. Удалять его нужно через раздел модерации на главной панели.</p>
          )}
        </form>
      )}
    </div>
  );
}
