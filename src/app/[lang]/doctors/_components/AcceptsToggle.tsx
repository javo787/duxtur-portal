'use client';

import { useState } from 'react';

export function AcceptsToggle({ 
  defaultChecked,
  label 
}: { 
  defaultChecked: boolean;
  label: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <>
      <input 
        name="accepts" 
        type="hidden" 
        value={checked ? 'true' : 'false'} 
        form="search-form"
        id="accepts-input"
      />
      <div className="flex items-center justify-between group">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => setChecked(v => !v)}
          className={`w-10 h-5 rounded-full relative transition ${
            checked ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
            checked ? 'left-6' : 'left-1'
          }`} />
        </button>
      </div>
    </>
  );
}
