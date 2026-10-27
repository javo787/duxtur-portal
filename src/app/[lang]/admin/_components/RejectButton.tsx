'use client';

import { useState } from 'react';

type ActionResult = void | { error: string };

const REASON_MAX = 500;

/** «Отклонить» with an optional reason: the person who applied gets it in the e-mail and it is written to the audit log. */
export function RejectButton({ action, label = '❌ Отклонить' }: {
  action: (formData: FormData) => Promise<ActionResult>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition active:scale-95 bg-red-600 hover:bg-red-700"
      >
        {label}
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
        Причина (необязательно, придёт в письме заявителю)
      </label>
      <textarea
        id="reject-reason"
        name="reason"
        rows={3}
        maxLength={REASON_MAX}
        placeholder="Например: фото диплома нечёткое, пришлите ещё раз"
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
      />
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition">
          Отклонить
        </button>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700">
          Отмена
        </button>
      </div>
      {error && <p role="alert" className="text-[11px] leading-snug text-red-400">{error}</p>}
    </form>
  );
}
