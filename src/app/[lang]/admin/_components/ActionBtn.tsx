// src/app/[lang]/admin/portal/_components/ActionBtn.tsx
'use client';

export function ActionBtn({ action, label, color, confirm }: {
  action: () => Promise<void>;
  label: string;
  color: string;
  confirm?: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition active:scale-95 ${color}`}
        onClick={confirm ? (e) => {
          if (!window.confirm(confirm)) e.preventDefault();
        } : undefined}
      >
        {label}
      </button>
    </form>
  );
}
