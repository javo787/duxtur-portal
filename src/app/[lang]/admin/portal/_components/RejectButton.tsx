'use client';

import { useState } from 'react';
import { CircleX } from 'lucide-react';
import type { ActionResult } from './ActionButton';

const REASON_MAX = 500;
const WARNING = 'bg-amber-500/10 text-amber-300 ring-amber-400/25 hover:bg-amber-500/20 hover:text-amber-200';

/** «Отклонить» with an optional reason: the applicant gets it in the e-mail and it is written to the audit log. */
export function RejectButton({ action }: { action: (formData: FormData) => Promise<ActionResult> }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${WARNING}`}
      >
        <CircleX className="h-3.5 w-3.5" aria-hidden /> Отклонить
      </button>
    );
  }

  return (
    <form
      className="w-full max-w-sm space-y-2"
      action={async (formData: FormData) => {
        setError('');
        try {
          const result = await action(formData);
          if (result && 'error' in result) setError(result.error);
          else setOpen(false);
        } catch {
          setError('Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.');
        }
      }}
    >
      <label className="block text-[11px] text-gray-400" htmlFor="reject-reason">
        Причина (необязательно, придёт заявителю в письме)
      </label>
      <textarea
        id="reject-reason"
        name="reason"
        rows={3}
        maxLength={REASON_MAX}
        placeholder="Например: фото диплома нечёткое, пришлите ещё раз"
        className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-gray-100 ring-1 ring-inset ring-white/10 placeholder:text-gray-600 focus:outline-2 focus:outline-sky-400"
      />
      <div className="flex gap-2">
        <button type="submit" className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${WARNING}`}>Отклонить</button>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.09]">
          Отмена
        </button>
      </div>
      {error && <p role="alert" className="text-[11px] leading-snug text-red-300">{error}</p>}
    </form>
  );
}
