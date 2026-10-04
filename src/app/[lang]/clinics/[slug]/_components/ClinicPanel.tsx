import { MapPin, Phone } from 'lucide-react';
import { getT } from '@/i18n';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import { whatsappUrl } from '@/lib/clinic-display';
import ClinicHours from './ClinicHours';
import { btnPrimary, btnQuiet, mapsUrl, WhatsAppIcon, type ClinicView } from './shared';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

export function panelHasContent(clinic: ClinicView, hasBooking: boolean) {
  return !!(clinic.address || clinic.phone || clinic.whatsapp || hasBooking);
}

/**
 * The one boxed surface on the page: address, hours and phone as a ledger, then the actions.
 * The primary action follows what this clinic can really do: book if it has doctors, otherwise call.
 */
export default function ClinicPanel({ clinic, lang, hasBooking }: { clinic: ClinicView; lang: string; hasBooking: boolean }) {
  const t = getT(lang);
  const showHours = hasRealWorkingHours(clinic as never) && !!clinic.workingHours;
  const route = mapsUrl({ lat: clinic.coordinates?.lat, lng: clinic.coordinates?.lng, address: clinic.address, city: clinic.city });
  const wa = clinic.whatsapp ? whatsappUrl(clinic.whatsapp) : null;
  const callIsPrimary = !hasBooking && !!clinic.phone;
  const hasActions = hasBooking || !!clinic.phone || !!wa;

  return (
    <aside aria-label={t('clinic.contacts')} className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:pt-10">
      <div className="rounded-[10px] border border-border bg-card lg:sticky lg:top-6">
        <dl className="divide-y divide-border text-[0.9375rem]">
          {clinic.address && (
            <Row label={t('clinic.address')}>
              {clinic.address}
              {route && (
                <a
                  href={route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  {t('clinic.route')}
                </a>
              )}
            </Row>
          )}
          {showHours && (
            <Row label={t('clinic.today')}>
              <ClinicHours hours={clinic.workingHours} lang={lang} variant="status" />
            </Row>
          )}
          {clinic.phone && (
            <Row label={t('booking.phone')}>
              <a href={`tel:${clinic.phone}`} className="tabular-nums hover:underline">
                {clinic.phone}
              </a>
            </Row>
          )}
        </dl>

        {hasActions && (
          <div id="clinic-actions" className="grid grid-cols-2 gap-2 border-t border-border p-4">
            {hasBooking && (
              <a href="#doctors" className={`${btnPrimary} col-span-2`}>
                {t('clinic.book')}
              </a>
            )}
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className={`${callIsPrimary ? btnPrimary : btnQuiet} ${wa ? '' : 'col-span-2'}`}>
                <Phone className="size-4" aria-hidden="true" />
                {t('clinic.call')}
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnQuiet} ${clinic.phone ? '' : 'col-span-2'}`}
              >
                <WhatsAppIcon className="size-4 text-[#25D366]" />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
