'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function Section({ title, content, onChange }: {
  title: string;
  content: any;
  onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<'write' | 'preview'>('preview');
  const safeContent = Array.isArray(content)
    ? content.map((item: string) => `• ${item}`).join('\n\n')
    : (content || '');

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <label className="font-bold text-gray-700">{title}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          {(['write', 'preview'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}>
              {m === 'write' ? '✏️ Правка' : '👁️ Просмотр'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea value={safeContent} onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[180px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 font-mono text-sm leading-relaxed outline-none resize-none" />
      ) : (
        <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed min-h-[80px]">
          <ReactMarkdown>{safeContent || '*Пусто...*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
