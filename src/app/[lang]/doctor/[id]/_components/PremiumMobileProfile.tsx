'use client';

import { useState } from 'react';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import DownloadCardButton from '@/components/DownloadCardButton';

interface PremiumMobileProfileProps {
  doctor: any;
  specialtyLabel: string;
  lastMedicalReviewDate: string | null;
  articles: any[];
  lang: string;
  doctorUrl: string;
}

export function PremiumMobileProfile({
  doctor,
  specialtyLabel,
  lastMedicalReviewDate,
  articles,
  lang,
}: PremiumMobileProfileProps) {
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

  return (
    <div className="space-y-3 pb-2">
      {/* ── ГЛАВНАЯ КАРТОЧКА ──────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a1628 0%, #0f2a52 60%, #1a3a6e 100%)',
          boxShadow: '0 20px 60px rgba(15,42,82,0.4)',
        }}
      >
        {/* Верхняя полоса-акцент */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${doctor.accentColor || '#2563eb'}, #6d28d9)`,
          }}
        />

        {/* Основной контент */}
        <div className="px-5 pt-5 pb-4">
          {/* Фото + имя */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: `0 0 0 2px ${doctor.accentColor || '#2563eb'}40, 0 8px 24px rgba(0,0,0,0.4)`,
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
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {/* Специальность */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{
                  background: `${doctor.accentColor || '#2563eb'}25`,
                  border: `1px solid ${doctor.accentColor || '#2563eb'}40`,
                  color: '#93c5fd',
                }}
              >
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                {specialtyLabel || 'Врач'}
              </div>
              <h1 className="text-[18px] font-black text-white leading-tight">
                {doctor.name}
              </h1>
              {workplaceLabel && (
                <p className="text-[11.5px] text-blue-300/70 mt-1 leading-tight">
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
              <p className="text-[12px] text-blue-200/80 leading-relaxed italic">
                «{bioExpanded ? rawBio : shortBio}»
              </p>
              {rawBio.length > 120 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-1.5 text-[11px] font-semibold text-blue-400"
                >
                  {bioExpanded ? 'Свернуть' : 'Читать далее'}
                </button>
              )}
            </div>
          )}

          {/* Метрики — горизонтальный скролл */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {articles.length > 0 && (
              <MetricChip
                value={articles.length.toString()}
                label={articles.length === 1 ? 'статья' : articles.length < 5 ? 'статьи' : 'статей'}
                icon="📄"
                accent={doctor.accentColor}
              />
            )}
            {(doctor.experience || 0) > 0 && (
              <MetricChip
                value={`${doctor.experience}`}
                label="лет опыта"
                icon="⏱"
                accent={doctor.accentColor}
              />
            )}
            {doctor.languages?.length > 0 && (
              <MetricChip
                value={doctor.languages.join(' · ')}
                label="языки"
                icon="🌐"
                accent={doctor.accentColor}
              />
            )}
            {educationLabel && (
              <MetricChip
                value={educationLabel.split(',')[0]}
                label="образование"
                icon="🎓"
                accent={doctor.accentColor}
              />
            )}
          </div>
        </div>

        {/* Нижняя полоса-акцент */}
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${doctor.accentColor || '#2563eb'}60, transparent)`,
          }}
        />
      </div>

      {/* ── ДОВЕРИЕ ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <TrustBadge
          icon="✅"
          title="Верифицирован"
          subtitle="Диплом подтверждён"
          color="#10b981"
        />
        {lastMedicalReviewDate ? (
          <TrustBadge
            icon="🔬"
            title="Проверка"
            subtitle={lastMedicalReviewDate}
            color="#3b82f6"
          />
        ) : (
          <TrustBadge
            icon="📝"
            title="Публикации"
            subtitle={`${articles.length} материалов`}
            color="#8b5cf6"
          />
        )}
      </div>

      {/* ── КНОПКА СВЯЗАТЬСЯ ──────────────────────────────────── */}
      {hasContacts && (
        <div className="rounded-2xl overflow-hidden">
          <ContactDoctorButton doctor={doctor} lang={lang} />
        </div>
      )}

      {/* ── СКАЧАТЬ ВИЗИТКУ ───────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden">
        <DownloadCardButton doctorSlug={doctor.slug} lang={lang} />
      </div>

      {/* ── ДОП. ИНФОРМАЦИЯ ───────────────────────────────────── */}
      {(doctor.workingHours || workplaceLabel || doctor.sameAs?.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {workplaceLabel && (
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              label="Место работы"
              value={workplaceLabel}
            />
          )}
          {doctor.workingHours && (
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Часы приёма"
              value={doctor.workingHours}
            />
          )}
          {doctor.sameAs?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Профили
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
                      className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg font-medium"
                    >
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
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon: string;
  accent?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span className="text-base">{icon}</span>
      <div>
        <p className="font-black text-white text-[12px] leading-none">{value}</p>
        <p className="text-blue-200/50 text-[10px] mt-0.5 whitespace-nowrap">{label}</p>
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
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-2xl border"
      style={{
        background: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
        style={{ background: `${color}15` }}
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
