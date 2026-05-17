'use client';
import { Spinner } from './_shared';

interface Props {
  isSaving: boolean;
  onSave: () => void;
  saveState: 'idle' | 'saved' | 'error';
  errorMsg: string;
}

export default function SaveBar({ isSaving, onSave, saveState, errorMsg }: Props) {
  return (
    <div className="sticky bottom-4 z-10">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 hover:bg-blue-700
            disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl
            font-bold text-sm shadow-md shadow-blue-200 transition-all duration-150 shrink-0"
        >
          {isSaving ? (
            <><Spinner /> <span>Перевод на 5 языков<span className="animate-pulse">...</span></span></>
          ) : (
            <>💾 Сохранить профиль</>
          )}
        </button>

        {saveState === 'saved' && (
          <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
            Профиль обновлён
          </span>
        )}
        {saveState === 'error' && (
          <span className="flex items-center gap-2 text-red-500 font-semibold text-sm">
            <span className="text-xs">⚠️</span> {errorMsg}
          </span>
        )}

        <p className="text-[11px] text-slate-400 ml-auto hidden md:block">
          Текстовые поля переводятся автоматически на все языки
        </p>
      </div>
    </div>
  );
}
