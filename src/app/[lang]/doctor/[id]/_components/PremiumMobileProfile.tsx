'use client';

import { useState } from 'react';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import DownloadCardButton from '@/components/DownloadCardButton';
import { useT } from '@/i18n';
import { CATEGORY_GRADIENTS } from '@/lib/doctor-constants';
import {
  Stethoscope,
  Clock,
  FileText,
  Languages as LanguagesIcon,
  GraduationCap,
  ShieldCheck,
  Microscope,
  Newspaper,
  Building2,
  CalendarClock,
  ExternalLink,
  Check,
} from 'lucide-react';

interface PremiumMobileProfileProps {
  doctor: any;
  specialtyLabel: string;
  lastMedicalReviewDate: string | null;
  articles: any[];
  lang: string;
  doctorUrl: string;
  categoryKey?: string;
}

export function PremiumMobileProfile({
  doctor,
  specialtyLabel,
  lastMedicalReviewDate,
  articles,
  lang,
  categoryKey,
}: PremiumMobileProfileProps) {
  const { t: i18nT } = useT(lang);
  const [bioExpanded, setBioExpanded] = useState(false);

  const t = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ru'] || '';
  };

  const rawBio = t(doctor.bio);
  const workplaceLabel = t(doctor.workplace);
  const educationLabel = t(doctor.education);

  const shortBio = rawBio.length > 120 ? rawBio.slice(0, 120) + '…' : rawBio;
  const hasBio = rawBio.length > 0;
  const hasContacts =
    doctor.phone || doctor.telegram || doctor.whatsapp || doctor.instagram;

  // Личный цвет врача — деталь-подпись. Фон карточки — цвет специальности:
  // так пациент с первого взгляда узнаёт профиль кардиолога среди неврологов.
  const accent = doctor.accentColor || '#2563eb';
  const gradient = CATEGORY_GRADIENTS[categoryKey || 'general'] || CATEGORY_GRADIENTS.general;

  return (
    <div className="space-y-3 pb-2">
      {/* ── ГЛАВНАЯ КАРТОЧКА ──────────────────────────────────── */}
      <div
        className="relative rounded-[28px] overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${gradient.from} 0%, #0f2a52 48%, ${gradient.to} 100%)`,
          boxShadow: '0 20px 50px -14px rgba(10,22,40,0.5)',
        }}
      >
        {/* Тонкая сетка — фирменная фактура бренда */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        {/* Мягкое свечение личным цветом врача */}
        <div
          className="absolute -top-16 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: accent, opacity: 0.22 }}
        />

        {/* Верхняя нить-акцент — персональный цвет врача */}
        <div
          className="relative h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        {/* Основной контент */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Фото + имя */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: `0 0 0 2px ${accent}55, 0 10px 24px rgba(0,0,0,0.35)`,
                }}
              >
                <img
                  src={
                    doctor.image ||
                    'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'
                  }
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Верифицирован — бейдж */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full border-2 border-[#0f2a52] flex items-center justify-center"
                style={{ background: '#10b981' }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {/* Специальность */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{
                  background: `${accent}25`,
                  border: `1px solid ${accent}45`,
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <Stethoscope className="w-3 h-3" strokeWidth={2.25} />
                {specialtyLabel || i18nT('common.doctorSingle')}
              </div>
              <h1 className="font-display text-[22px] font-bold text-white leading-[1.15] tracking-tight">
                {doctor.name}
              </h1>
              {workplaceLabel && (
                <p className="text-[12px] text-white/65 mt-1.5 leading-tight truncate">
                  {workplaceLabel}
                </p>
              )}
            </div>
          </div>

          {/* Миссия / Биография */}
          {hasBio && (
            <div
              className="mb-4 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p className="text-[12.5px] text-white/80 leading-relaxed italic">
                «{bioExpanded ? rawBio : shortBio}»
              </p>
              {rawBio.length > 120 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-1.5 text-[11px] font-semibold"
                  style={{ color: accent === '#2563eb' ? '#93c5fd' : accent }}
                >
                  {bioExpanded ? i18nT('common.collapse') : i18nT('blog.readMore')}
                </button>
              )}
            </div>
          )}

          {/* Метрики — переносятся по строкам, ничего не обрезается */}
          <div className="flex flex-wrap gap-2">
            {articles.length > 0 && (
              <MetricChip
                icon={<FileText className="w-3.5 h-3.5" />}
                value={articles.length.toString()}
                label={i18nT('common.articles')}
              />
            )}
            {(doctor.experience || 0) > 0 && (
              <MetricChip
                icon={<Clock className="w-3.5 h-3.5" />}
                value={`${doctor.experience}`}
                label={i18nT('common.yearsExp')}
              />
            )}
            {doctor.languages?.length > 0 && (
              <MetricChip
                icon={<LanguagesIcon className="w-3.5 h-3.5" />}
                value={doctor.languages.join(' · ')}
                label={i18nT('common.languages')}
              />
            )}
            {educationLabel && (
              <MetricChip
                icon={<GraduationCap className="w-3.5 h-3.5" />}
                value={educationLabel.split(',')[0]}
                label={i18nT('doctor.education')}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── ДОВЕРИЕ ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <TrustBadge
          icon={<ShieldCheck className="w-4 h-4" />}
          title={i18nT('doctor.verified')}
          subtitle={i18nT('doctor.diplomaVerified')}
          color="#10b981"
        />
        {lastMedicalReviewDate ? (
          <TrustBadge
            icon={<Microscope className="w-4 h-4" />}
            title={i18nT('blog.articleMedicalReview')}
            subtitle={lastMedicalReviewDate}
            color="#3b82f6"
          />
        ) : (
          <TrustBadge
            icon={<Newspaper className="w-4 h-4" />}
            title={i18nT('doctor.articles')}
            subtitle={`${articles.length} ${i18nT('common.articles')}`}
            color="#8b5cf6"
          />
        )}
      </div>

      {/* ── КНОПКА СВЯЗАТЬСЯ ──────────────────────────────────── */}
      {hasContacts && (
        <ContactDoctorButton
          doctor={doctor}
          lang={lang}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:from-blue-800 active:to-blue-700 text-white font-bold rounded-2xl transition-all shadow-sm shadow-blue-200 btn-spring text-sm"
        />
      )}

      {/* ── СКАЧАТЬ ВИЗИТКУ ───────────────────────────────────── */}
      <DownloadCardButton doctorSlug={doctor.slug} lang={lang} />

      {/* ── ДОП. ИНФОРМАЦИЯ ───────────────────────────────────── */}
      {(doctor.workingHours || workplaceLabel || doctor.sameAs?.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {workplaceLabel && (
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label={i18nT('doctor.workplace')}
              value={workplaceLabel}
            />
          )}
          {doctor.workingHours && (
            <InfoRow
              icon={<CalendarClock className="w-4 h-4" />}
              label={i18nT('doctor.workingHours')}
              value={doctor.workingHours}
            />
          )}
          {doctor.sameAs?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                {i18nT('doctor.profiles')}
              </p>
              <div className="flex flex-wrap gap-2">
                {doctor.sameAs.map((link: string, i: number) => {
                  let hostname = link;
                  try { hostname = new URL(link).hostname.replace('www.', ''); } catch {}
                  return (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg font-medium"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {hostname}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Вспомогательные компоненты ────────────────────────────────

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl min-w-0"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span className="text-white/55 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-black text-white text-[12px] leading-none truncate max-w-[140px]">{value}</p>
        <p className="text-white/45 text-[10px] mt-0.5 whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

function TrustBadge({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-2xl border"
      style={{
        background: `${color}0c`,
        borderColor: `${color}25`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-gray-900 text-[12px] leading-tight">{title}</p>
        <p className="text-gray-400 text-[10.5px] mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}
