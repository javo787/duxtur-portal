'use client';

import { useState } from 'react';

type ActionResult = void | { error: string };

export default function AddManagerForm({ action, inputClass }: {
  action: (formData: FormData) => Promise<ActionResult>;
  inputClass: string;
}) {
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  return (
    <form
      className="space-y-2"
      action={async (formData: FormData) => {
        setError(''); setAdded(false);
        try {
          const result = await action(formData);
          if (result && 'error' in result) setError(result.error);
          else setAdded(true);
        } catch {
          setError('Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.');
        }
      }}
    >
      <div className="flex flex-wrap gap-3">
        <input name="email" type="email" required placeholder="E-mail аккаунта будущего менеджера" className={`${inputClass} max-w-sm`} />
        <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold">Назначить менеджером</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {added && <p className="text-sm text-emerald-400">Назначен. Пусть выйдет и войдёт на сайт заново.</p>}
    </form>
  );
}
