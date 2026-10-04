import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getT } from '@/i18n';
import { COMMON_SPECIALTIES } from '@/lib/clinic-constants';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import { facebookHref } from '@/lib/social';
import { instagramUrl, isUnverifiedImport, safeHttpUrl, specialtyId, telegramUrl, websiteHost, whatsappUrl } from '@/lib/clinic-display';
import ClinicNav, { type NavItem } from './ClinicNav';
import ClinicDoctors from './ClinicDoctors';
import ClinicServices from './ClinicServices';
import ClinicReviews from './ClinicReviews';
import ClinicGallery from './ClinicGallery';
import ClinicHours from './ClinicHours';
import { mapsUrl, pick, type ClinicView } from './shared';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-b border-border py-9">
      <h2 id={`${id}-title`} className="mb-5 font-clinic text-2xl font-semibold tracking-[-0.005em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title }: { title: string }) {
  return <h3 className="mb-2 font-clinic text-lg font-semibold">{title}</h3>;
}

const linkCls = 'font-medium text-primary underline-offset-4 hover:underline';

export default function ClinicBody({ clinic, lang, doctors }: { clinic: ClinicView; lang: string; doctors: unknown[] }) {
  const t = getT(lang);
  const description = pick(clinic.description, lang);
  const quote = pick(clinic.quote, lang);
  const history = pick(clinic.history, lang);
  const name = pick(clinic.name, lang);

  const specialties = (clinic.specialties ?? []).flatMap(s => {
    const id = specialtyId(s);
    if (!id && /^[a-z_]+$/.test(s)) return []; // unknown raw key: never show it
    const key = `clinic.specialty_${id}`;
    const translated = id ? t(key) : s;
    const label = id && translated === key ? (COMMON_SPECIALTIES.find(c => c.id === id)?.label ?? s) : translated;
    return [{ label, id }];
  });

  const services = clinic.services ?? [];
  const photos = clinic.photos ?? [];
  const hasAbout = !!(description.text || quote.text || history.text || specialties.length);
  const hasReviews = (clinic.rating?.count ?? 0) > 0;
  const hasHours = hasRealWorkingHours(clinic as never) && !!clinic.workingHours;

  const nav: NavItem[] = [
    hasAbout && { id: 'about', label: t('clinic.about') },
    doctors.length > 0 && { id: 'doctors', label: t('clinic.doctors') },
    services.length > 0 && { id: 'services', label: t('clinic.services') },
    hasReviews && { id: 'reviews', label: t('clinic.reviews') },
    photos.length > 0 && { id: 'gallery', label: t('clinic.gallery') },
    { id: 'contacts', label: t('clinic.contacts') },
  ].filter(Boolean) as NavItem[];

  const socials = [
    clinic.telegram && { label: 'Telegram', href: telegramUrl(clinic.telegram) },
    clinic.instagram && { label: 'Instagram', href: instagramUrl(clinic.instagram) },
    clinic.whatsapp && { label: 'WhatsApp', href: whatsappUrl(clinic.whatsapp) },
    facebookHref(clinic.facebook) && { label: 'Facebook', href: facebookHref(clinic.facebook)! },
  ].filter(Boolean) as { label: string; href: string }[];

  const website = clinic.website ? safeHttpUrl(clinic.website) : null;
  const route = mapsUrl({ lat: clinic.coordinates?.lat, lng: clinic.coordinates?.lng, address: clinic.address, city: clinic.city });

  return (
    <div className="mt-8 min-w-0 lg:col-start-1 lg:row-start-2">
      {nav.length > 2 && <ClinicNav items={nav} label={t('clinic.overview')} />}

      {hasAbout && (
        <Section id="about" title={t('clinic.about')}>
          <div className="space-y-8">
            {quote.text && (
              <blockquote lang={quote.lang} className="max-w-[40ch] border-l-2 border-primary pl-5">
                <p className="font-clinic text-xl leading-snug md:text-2xl">{quote.text}</p>
                <footer className="mt-3 text-sm text-foreground/65">{t('clinic.chiefQuote')}</footer>
              </blockquote>
            )}
            {description.text && (
              <p lang={description.lang} className="max-w-[62ch] whitespace-pre-line leading-7">
                {description.text}
              </p>
            )}
            {history.text && (
              <div>
                <Sub title={t('clinic.history')} />
                <p lang={history.lang} className="max-w-[62ch] whitespace-pre-line leading-7">
                  {history.text}
                </p>
              </div>
            )}
            {specialties.length > 0 && (
              <div>
                <Sub title={t('clinic.specialties')} />
                <ul className="flex flex-wrap gap-2">
                  {specialties.map(({ label, id }) => (
                    <li key={label}>
                      {id ? (
                        <Link
                          href={`/${lang}/clinics?specialty=${id}`}
                          className="inline-block rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="inline-block rounded-md border border-border px-3 py-1.5 text-sm">{label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {doctors.length > 0 && (
        <Section id="doctors" title={t('clinic.doctors')}>
          <ClinicDoctors doctors={doctors as never} lang={lang} />
        </Section>
      )}

      {services.length > 0 && (
        <Section id="services" title={t('clinic.services')}>
          <ClinicServices services={services} lang={lang} />
        </Section>
      )}

      {hasReviews && (
        <Section id="reviews" title={t('clinic.reviews')}>
          <ClinicReviews slug={clinic.slug} lang={lang} rating={clinic.rating!} />
        </Section>
      )}

      {photos.length > 0 && (
        <Section id="gallery" title={t('clinic.gallery')}>
          <ClinicGallery photos={photos} lang={lang} alt={name.text} />
        </Section>
      )}

      <Section id="contacts" title={t('clinic.contacts')}>
        <dl className="grid gap-x-10 gap-y-6 text-[0.9375rem] sm:grid-cols-2">
          {clinic.address && (
            <div>
              <dt className="text-xs text-foreground/60">{t('clinic.address')}</dt>
              <dd className="mt-0.5 font-medium">{clinic.address}</dd>
              {route && (
                <dd className="mt-1">
                  <a href={route} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${linkCls}`}>
                    <MapPin className="size-4" aria-hidden="true" />
                    {t('clinic.route')}
                  </a>
                </dd>
              )}
            </div>
          )}
          {(clinic.phone || clinic.phone2) && (
            <div>
              <dt className="text-xs text-foreground/60">{t('booking.phone')}</dt>
              {[clinic.phone, clinic.phone2].filter(Boolean).map(p => (
                <dd key={p} className="mt-0.5 font-medium tabular-nums">
                  <a href={`tel:${p}`} className="hover:underline">
                    {p}
                  </a>
                </dd>
              ))}
            </div>
          )}
          {clinic.branches?.map((b, i) => {
            const bRoute = mapsUrl({ lat: b.coordinates?.lat, lng: b.coordinates?.lng, address: b.address, city: b.city });
            return (
              <div key={b._id ?? i}>
                <dt className="text-xs text-foreground/60">{b.label || t('clinic.branches')}</dt>
                <dd className="mt-0.5 font-medium">{[b.address, b.city].filter(Boolean).join(', ')}</dd>
                {b.phone && (
                  <dd className="tabular-nums">
                    <a href={`tel:${b.phone}`} className="hover:underline">
                      {b.phone}
                    </a>
                  </dd>
                )}
                {bRoute && (
                  <dd className="mt-1">
                    <a href={bRoute} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${linkCls}`}>
                      <MapPin className="size-4" aria-hidden="true" />
                      {t('clinic.route')}
                    </a>
                  </dd>
                )}
              </div>
            );
          })}
          {website && (
            <div>
              <dt className="text-xs text-foreground/60">{t('clinic.website')}</dt>
              <dd className="mt-0.5 break-all">
                <a href={website} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  {websiteHost(clinic.website!)}
                </a>
              </dd>
            </div>
          )}
          {clinic.email && (
            <div>
              <dt className="text-xs text-foreground/60">{t('clinic.email')}</dt>
              <dd className="mt-0.5 break-all">
                <a href={`mailto:${clinic.email}`} className={linkCls}>
                  {clinic.email}
                </a>
              </dd>
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <dt className="sr-only">Social</dt>
              <dd className="flex flex-wrap gap-x-5 gap-y-1">
                {socials.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {s.label}
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {hasHours && (
          <div className="mt-8 max-w-md">
            <Sub title={t('clinic.workingHours')} />
            <ClinicHours hours={clinic.workingHours} lang={lang} variant="table" />
          </div>
        )}
      </Section>

      {isUnverifiedImport(clinic) && (
        <section id="claim" className="my-10 rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-5">
          <p className="font-semibold">{t('clinic.unverified')}</p>
          <p className="mt-1 max-w-[56ch] text-[0.9375rem] text-foreground/75">{t('clinic.claimBody')}</p>
          <Link href={`/${lang}/clinic/register?claim=${clinic.slug}`} className={`mt-3 inline-block ${linkCls}`}>
            {t('clinic.claimClinic')}
          </Link>
        </section>
      )}

      <div id="clinic-end" aria-hidden="true" />
    </div>
  );
}
