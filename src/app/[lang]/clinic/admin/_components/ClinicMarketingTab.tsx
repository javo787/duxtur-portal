'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import { SectionHeader } from '@/app/[lang]/admin/_components/_profile-sections/_shared';

export default function ClinicMarketingTab({ lang, slug }: { lang: string, slug: string }) {
  const { t } = useT(lang);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${baseUrl}/api/clinic/${slug}/badge`;
  const profileUrl = `${baseUrl}/${lang}/clinic/${slug}`;

  const embedCode = `<a href="${profileUrl}" target="_blank">
  <img src="${badgeUrl}" alt="Verified by Duxtur.org" width="240" height="80" />
</a>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <SectionHeader title={t('clinic.marketing')} />

        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('clinic.badgePreview')}</h4>
          <div className="p-10 bg-slate-50 rounded-3xl flex justify-center border border-slate-100 border-dashed">
            <img src={badgeUrl} alt="Badge Preview" className="shadow-xl rounded-2xl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('clinic.embedCode')}</h4>
            <button
              onClick={handleCopy}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              {copied ? t('common.copied') : t('clinic.copyEmbed')}
            </button>
          </div>
          <div className="relative">
            <pre className="p-6 bg-slate-900 text-blue-400 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed">
              {embedCode}
            </pre>
          </div>
          <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wide">
            {t('clinic.badgeHint')}
          </p>
        </div>
      </div>

      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white space-y-4">
        <h3 className="text-xl font-black">{t('clinic.blueBadge')}</h3>
        <p className="text-sm text-blue-100 leading-relaxed font-medium">
          {t('clinic.badgeTrust')}
        </p>
      </div>
    </div>
  );
}
