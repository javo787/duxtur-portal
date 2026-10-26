// src/app/[lang]/admin/_components/ActionBtn.tsx
'use client';

import { useState } from 'react';

type ActionResult = void | { error: string };

/**
 * A button that runs a server action. The action gets the submitted form, may answer `{ error }` (shown under the
 * button) and a thrown error is turned into a message too, so a failed click never looks like it silently worked.
 */
export function ActionBtn({ action, label, color, confirm }: {
  action: (formData: FormData) => Promise<ActionResult>;
  label: string;
  color: string;
  confirm?: string;
}) {
  const [error, setError] = useState('');

  return (
    <form
      action={async (formData: FormData) => {
        setError('');
        try {
          const result = await action(formData);
          if (result && 'error' in result) setError(result.error);
        } catch {
          setError('Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.');
        }
      }}
    >
      <button
        type="submit"
        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition active:scale-95 ${color}`}
        onClick={confirm ? (e) => {
          if (!window.confirm(confirm)) e.preventDefault();
        } : undefined}
      >
        {label}
      </button>
      {error && <p role="alert" className="mt-1 max-w-[220px] text-[11px] leading-snug text-red-400">{error}</p>}
    </form>
  );
}
