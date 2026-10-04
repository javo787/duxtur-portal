'use client';

import { useState } from 'react';
import { useT } from '@/i18n';

const btn =
  'inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Telegram, WhatsApp and copy-link: what people here actually use. No QR, no brand colours. */
export default function ArticleShare({ url, title, lang }: { url: string; title: string; lang: string }) {
  const { t } = useT(lang);
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const ti = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard can be blocked; the other two buttons still work */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-foreground/65">{t('common.share')}</span>
      <a href={`https://t.me/share/url?url=${u}&text=${ti}`} target="_blank" rel="noopener noreferrer" className={btn}>
        Telegram
      </a>
      <a href={`https://wa.me/?text=${ti}%20${u}`} target="_blank" rel="noopener noreferrer" className={btn}>
        WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? t('share.copied') : t('share.copy')}
      </button>
    </div>
  );
}
