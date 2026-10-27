'use client';

import { useFormStatus } from 'react-dom';
import { useState, type ComponentType, type ReactNode } from 'react';

export type ActionResult = void | { error: string };

export type ActionVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const VARIANTS: Record<ActionVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30 hover:bg-emerald-500/25 hover:text-emerald-200',
  danger: 'bg-red-500/10 text-red-300 ring-red-400/25 hover:bg-red-500/20 hover:text-red-200',
  warning: 'bg-amber-500/10 text-amber-300 ring-amber-400/25 hover:bg-amber-500/20 hover:text-amber-200',
  neutral: 'bg-white/[0.05] text-gray-200 ring-white/10 hover:bg-white/[0.09] hover:text-white',
  primary: 'bg-sky-500 text-white ring-sky-300/40 hover:bg-sky-400',
};

function Submit({ label, variant, icon: Icon, confirm }: {
  label: ReactNode; variant: ActionVariant; icon?: ComponentType<{ className?: string }>; confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault(); } : undefined}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-[transform,background-color,color] duration-150 ease-premium active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${VARIANTS[variant]}`}
    >
      {pending
        ? <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        : Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

/**
 * A server action behind a button: shows that it is working, asks first when `confirm` is given.
 * `action` is a server action already bound to its arguments (`approveArticle.bind(null, id)`). When the action
 * answers `{ error }` (or fails), the message appears under the button, so a refused click never looks like it worked.
 */
export function ActionButton({ action, label, variant = 'neutral', icon, confirm }: {
  action: (formData: FormData) => Promise<ActionResult>;
  label: ReactNode;
  variant?: ActionVariant;
  icon?: ComponentType<{ className?: string }>;
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
      <Submit label={label} variant={variant} icon={icon} confirm={confirm} />
      {error && <p role="alert" className="mt-1 max-w-[220px] text-[11px] leading-snug text-red-300">{error}</p>}
    </form>
  );
}
