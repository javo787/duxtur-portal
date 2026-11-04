'use client';

import { useState } from 'react';
import type { QualityReport } from '@/lib/article-quality';

/** The editor's checklist above an AI-made article: what to fix before it goes out. Updates while the author edits. */
export function QualityPanel({ report, droppedReferences = [] }: { report: QualityReport; droppedReferences?: string[] }) {
  const [open, setOpen] = useState(true);
  const errors = report.issues.filter((i) => i.level === 'error');
  const warnings = report.issues.filter((i) => i.level === 'warn');
  const tone =
    errors.length > 0 ? 'border-red-200 bg-red-50 text-red-900'
    : warnings.length > 2 ? 'border-amber-200 bg-amber-50 text-amber-900'
    : 'border-green-200 bg-green-50 text-green-900';

  return (
    <section aria-labelledby="quality-title" className={`rounded-2xl border px-5 py-4 ${tone}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <h3 id="quality-title" className="font-extrabold text-sm">
          Проверка качества: {report.score}/100
          {report.issues.length === 0 ? ' — готово к публикации' : ` — замечаний: ${report.issues.length}`}
        </h3>
        <span className="text-xs font-bold opacity-70">{open ? 'Скрыть' : 'Показать'}</span>
      </button>

      {open && (report.issues.length > 0 || droppedReferences.length > 0) && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {errors.map((i) => (
            <li key={i.code} className="flex gap-2"><span aria-hidden="true">⛔</span><span>{i.message}</span></li>
          ))}
          {warnings.map((i) => (
            <li key={i.code} className="flex gap-2"><span aria-hidden="true">⚠️</span><span>{i.message}</span></li>
          ))}
          {droppedReferences.length > 0 && (
            <li className="flex gap-2">
              <span aria-hidden="true">🧹</span>
              <span>
                Убрано источников без ссылки на конкретную страницу: {droppedReferences.length}
                {' '}({droppedReferences.slice(0, 3).join('; ')}{droppedReferences.length > 3 ? '…' : ''}).
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
