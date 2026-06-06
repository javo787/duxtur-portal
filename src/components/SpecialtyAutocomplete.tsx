'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';

interface SpecialtyAutocompleteProps {
  defaultValue: string;
  lang: string;
  placeholder: string;
  inputClassName?: string; // ← добавить
}

export default function SpecialtyAutocomplete({
  defaultValue,
  lang,
  placeholder,
  inputClassName, // ← добавить
}: SpecialtyAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<{ key: string; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const staticOptions = Object.entries(CATEGORY_LABELS).map(([key, labels]) => ({
    key,
    label: labels[lang] || labels.ru
  }));

  useEffect(() => {
    if (defaultValue && CATEGORY_LABELS[defaultValue]) {
      setQuery(CATEGORY_LABELS[defaultValue][lang] || CATEGORY_LABELS[defaultValue].ru);
    } else {
      setQuery(defaultValue);
    }
  }, [defaultValue, lang]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (val.trim() === '') {
      setSuggestions(staticOptions);
    } else {
      const filtered = staticOptions.filter(opt =>
        opt.label.toLowerCase().includes(val.toLowerCase())
      );

      if (val.length > 2) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(val)}&type=doctors&lang=${lang}`);
          const data = await res.json();
          const dynamicOptions = (data.doctors || []).map((d: any) => ({
            key: d.specialty?.[lang] || d.specialty?.ru || 'general',
            label: d.specialty?.[lang] || d.specialty?.ru || ''
          })).filter((opt: any, index: number, self: any[]) =>
            opt.label && self.findIndex((t: any) => t.label === opt.label) === index
          );

          const combined = [...filtered];
          dynamicOptions.forEach((opt: any) => {
            if (!combined.find((c: any) => c.label === opt.label)) combined.push(opt);
          });
          setSuggestions(combined);
        } catch {
          setSuggestions(filtered);
        }
      } else {
        setSuggestions(filtered);
      }
    }
  };

  const selectOption = (opt: { key: string; label: string }) => {
    setQuery(opt.label);
    setSelected(opt.key);
    setIsOpen(false);
  };

  // Дефолтный className если inputClassName не передан
  const defaultInputClassName =
    'w-full px-6 py-3.5 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none border-b md:border-b-0 md:border-r border-slate-100';

  return (
    <div ref={wrapperRef} className="relative w-full md:flex-1">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          setIsOpen(true);
          if (query.trim() === '') setSuggestions(staticOptions);
        }}
        placeholder={placeholder}
        className={inputClassName ?? defaultInputClassName} // ← применить
      />
      <input type="hidden" name="specialty" value={selected} />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-2xl mt-2 py-2 z-50 max-h-60 overflow-y-auto">
          {suggestions.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => selectOption(opt)}
              className="w-full text-left px-6 py-2.5 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
