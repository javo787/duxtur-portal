import { saveClinic, deleteManagedClinic } from '@/app/actions/admin-content';
import { CLINIC_TYPES, ALLOWED_CITIES, COMMON_SPECIALTIES } from '@/lib/clinic-constants';
import { specialtyId } from '@/lib/clinic-display';
import { CLINIC_STATUSES } from '@/lib/admin-content/clinic-form';
import { DAYS } from '@/lib/admin-content/common';
import { MAX_BRANCH_SLOTS } from '@/lib/admin-content/clinic-form';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import { STATUS_LABELS } from '../../_shared/AdminShell';
import { Card, Grid, ImagePicker, inputCls, Label, MultiLang } from '../../_shared/FormBits';

const DAY_LABELS: Record<string, string> = { mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг', fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье' };

export interface ClinicDoc {
  _id: string; userId?: unknown; slug?: string; status?: string; type?: string;
  name?: Record<string, string>; description?: Record<string, string>;
  city?: string; district?: string; address?: string;
  coordinates?: { lat?: number; lng?: number };
  phone?: string; phone2?: string; email?: string; website?: string;
  telegram?: string; whatsapp?: string; instagram?: string;
  workingHours?: Record<string, { open: string; close: string; isWorking: boolean }>;
  specialties?: string[];
  branches?: { label?: string; address?: string; city?: string; district?: string; phone?: string; coordinates?: { lat?: number; lng?: number } }[];
  logo?: string; coverImage?: string; licenseNumber?: string;
  importSource?: string; importSourceUrl?: string; verifiedAt?: string | Date;
}

export default function ClinicForm({ lang, id, clinic }: { lang: string; id: string; clinic?: ClinicDoc }) {
  const isNew = id === 'new';
  const c = clinic;
  // Schema-default hours (08:00-18:00 every day) are a placeholder on imported clinics: don't prefill them as if real.
  const hours = c && hasRealWorkingHours({ status: c.status, workingHours: c.workingHours as never }) ? c.workingHours : undefined;
  const canDelete = !isNew && !c?.userId;

  return (
    <div className="space-y-6">
      <form action={saveClinic.bind(null, id)} className="space-y-6">
        <input type="hidden" name="lang" value={lang} />

        <Card title="Основное" hint="Обязательно только русское название. Остальные языки можно оставить пустыми: на сайте покажется русское.">
          <MultiLang prefix="name" values={c?.name} required />
          <Grid cols={3}>
            <Label text="Тип">
              <select name="type" defaultValue={c?.type ?? 'clinic'} className={inputCls}>
                {CLINIC_TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
              </select>
            </Label>
            <Label text="Статус" hint="«Импорт» = карточка ещё не подтверждена клиникой">
              <select name="status" defaultValue={c?.status ?? 'pre_imported'} className={inputCls}>
                {CLINIC_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Label>
            <Label text="Номер лицензии">
              <input name="licenseNumber" defaultValue={c?.licenseNumber ?? ''} className={inputCls} />
            </Label>
          </Grid>
        </Card>

        <Card title="Адрес и карта">
          <Grid cols={3}>
            <Label text="Город">
              <input name="city" list="cities" defaultValue={c?.city ?? ''} className={inputCls} />
              <datalist id="cities">{ALLOWED_CITIES.map(x => <option key={x} value={x} />)}</datalist>
            </Label>
            <Label text="Район"><input name="district" defaultValue={c?.district ?? ''} className={inputCls} /></Label>
            <Label text="Адрес"><input name="address" defaultValue={c?.address ?? ''} placeholder="ул. Мехнат, 10" className={inputCls} /></Label>
          </Grid>
          <Grid>
            <Label text="Широта" hint="Например 38.5598. Нужны обе координаты или ни одной.">
              <input name="lat" defaultValue={c?.coordinates?.lat ?? ''} inputMode="decimal" className={inputCls} />
            </Label>
            <Label text="Долгота" hint="Например 68.7870. Взять можно из карты: правый клик по точке.">
              <input name="lng" defaultValue={c?.coordinates?.lng ?? ''} inputMode="decimal" className={inputCls} />
            </Label>
          </Grid>
        </Card>

        <Card
          title="Филиалы"
          hint="Дополнительные адреса этой же клиники. Главный адрес указан выше. Пустые строки игнорируются; чтобы убрать филиал, очистите его поля."
        >
          <div className="space-y-4">
            {Array.from({ length: Math.min(MAX_BRANCH_SLOTS, Math.max((c?.branches?.length ?? 0) + 2, 3)) }, (_, i) => {
              const b = c?.branches?.[i];
              return (
                <fieldset key={i} className="border border-gray-800 rounded-xl p-4 space-y-3">
                  <legend className="px-2 text-xs text-gray-500">Филиал {i + 1}</legend>
                  <Grid>
                    <Label text="Название (необязательно)"><input name={`branch_${i}_label`} defaultValue={b?.label ?? ''} placeholder="Филиал на Рудаки" className={inputCls} /></Label>
                    <Label text="Адрес"><input name={`branch_${i}_address`} defaultValue={b?.address ?? ''} className={inputCls} /></Label>
                    <Label text="Город"><input name={`branch_${i}_city`} list="cities" defaultValue={b?.city ?? ''} className={inputCls} /></Label>
                    <Label text="Район"><input name={`branch_${i}_district`} defaultValue={b?.district ?? ''} className={inputCls} /></Label>
                    <Label text="Телефон филиала"><input name={`branch_${i}_phone`} defaultValue={b?.phone ?? ''} className={inputCls} /></Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Label text="Широта"><input name={`branch_${i}_lat`} defaultValue={b?.coordinates?.lat ?? ''} inputMode="decimal" className={inputCls} /></Label>
                      <Label text="Долгота"><input name={`branch_${i}_lng`} defaultValue={b?.coordinates?.lng ?? ''} inputMode="decimal" className={inputCls} /></Label>
                    </div>
                  </Grid>
                </fieldset>
              );
            })}
          </div>
        </Card>

        <Card title="Контакты" hint="Номера приводятся к формату +992…, в соцсетях можно вставлять ссылку целиком.">
          <Grid>
            <Label text="Телефон"><input name="phone" defaultValue={c?.phone ?? ''} placeholder="+992 90 000 0000" className={inputCls} /></Label>
            <Label text="Телефон 2"><input name="phone2" defaultValue={c?.phone2 ?? ''} className={inputCls} /></Label>
            <Label text="Email"><input name="email" type="email" defaultValue={c?.email ?? ''} className={inputCls} /></Label>
            <Label text="Сайт"><input name="website" defaultValue={c?.website ?? ''} placeholder="https://" className={inputCls} /></Label>
            <Label text="Telegram"><input name="telegram" defaultValue={c?.telegram ?? ''} placeholder="@name или ссылка" className={inputCls} /></Label>
            <Label text="WhatsApp" hint="Номер с кодом страны"><input name="whatsapp" defaultValue={c?.whatsapp ?? ''} className={inputCls} /></Label>
            <Label text="Instagram"><input name="instagram" defaultValue={c?.instagram ?? ''} placeholder="@name или ссылка" className={inputCls} /></Label>
          </Grid>
        </Card>

        <Card title="Часы работы" hint="Заполняйте только проверенные часы. Если оставить всё пустым, прежние значения не меняются, а у импортированных клиник блок не показывается.">
          <div className="space-y-2">
            {DAYS.map(d => {
              const h = hours?.[d];
              return (
                <div key={d} className="grid grid-cols-[110px_auto_1fr_1fr] items-center gap-3 text-sm">
                  <span className="text-gray-400">{DAY_LABELS[d]}</span>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400">
                    <input type="checkbox" name={`${d}_working`} defaultChecked={!!h?.isWorking} /> работает
                  </label>
                  <input type="time" name={`${d}_open`} defaultValue={h?.open ?? ''} className={inputCls} />
                  <input type="time" name={`${d}_close`} defaultValue={h?.close ?? ''} className={inputCls} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Специальности">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_SPECIALTIES.map(sp => (
              <label key={sp.id} className="flex items-center gap-2 text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <input type="checkbox" name="specialties" value={sp.id} defaultChecked={c?.specialties?.some(x => specialtyId(x) === sp.id)} />
                <span>{sp.emoji} {sp.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Описание" hint="Пишите своими словами по проверенным фактам. Не копируйте тексты с чужих сайтов.">
          <MultiLang prefix="description" values={c?.description} textarea rows={4} />
        </Card>

        <Card title="Изображения (Cloudinary)">
          <Grid>
            <ImagePicker label="Логотип" urlName="logo" fileName="logoFile" current={c?.logo} />
            <ImagePicker label="Обложка" urlName="coverImage" fileName="coverFile" current={c?.coverImage} />
          </Grid>
          <p className="text-xs text-amber-500/80">Загружайте только материалы, которые клиника сама прислала или разрешила использовать.</p>
        </Card>

        <Card title="Проверка данных">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="markVerified" /> Отметить данные как проверенные администратором
          </label>
          {c?.verifiedAt && <p className="text-xs text-gray-500">Последняя проверка: {new Date(c.verifiedAt).toLocaleDateString('ru-RU')}</p>}
          {c?.importSource && c.importSource !== 'manual' && (
            <p className="text-xs text-gray-500">Источник импорта: {c.importSource}{c.importSourceUrl ? ` (${c.importSourceUrl})` : ''}</p>
          )}
        </Card>

        <div className="flex items-center gap-3 sticky bottom-0 bg-gray-950/90 backdrop-blur py-3">
          <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold text-sm transition">
            {isNew ? 'Создать клинику' : 'Сохранить'}
          </button>
          <a href={`/${lang}/admin/portal/clinics`} className="text-sm text-gray-400 hover:text-white">Отмена</a>
          {c?.slug && <a href={`/${lang}/clinics/${c.slug}`} target="_blank" className="ml-auto text-sm text-blue-400 hover:underline">Открыть на сайте ↗</a>}
        </div>
      </form>

      {!isNew && (
        <form action={deleteManagedClinic.bind(null, id)} className="border border-red-900/60 rounded-2xl p-5 space-y-2">
          <input type="hidden" name="lang" value={lang} />
          <h3 className="font-bold text-red-300">Удаление</h3>
          {canDelete ? (
            <>
              <p className="text-xs text-gray-500">Клиника без аккаунта владельца удаляется навсегда. Врачи, привязанные к ней, останутся, но потеряют привязку.</p>
              <button className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold">Удалить клинику</button>
            </>
          ) : (
            <p className="text-xs text-gray-500">У клиники есть аккаунт владельца. Удалять её нужно через раздел модерации на главной панели.</p>
          )}
        </form>
      )}
    </div>
  );
}
