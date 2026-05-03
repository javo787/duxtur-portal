'use client';

import { useState, useRef } from 'react';

interface TagsInputProps {
  label: string;
  icon: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: 'blue' | 'orange' | 'green';
}

const COLORS = {
  blue:   { tag: 'bg-blue-50 text-blue-700 border-blue-200',   input: 'focus:border-blue-400 focus:ring-blue-50' },
  orange: { tag: 'bg-orange-50 text-orange-700 border-orange-200', input: 'focus:border-orange-400 focus:ring-orange-50' },
  green:  { tag: 'bg-green-50 text-green-700 border-green-200',  input: 'focus:border-green-400 focus:ring-green-50' },
};

export function TagsInput({ label, icon, tags, onChange, placeholder, color = 'blue' }: TagsInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const c = COLORS[color];

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
        <span>{icon}</span> {label}
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={`min-h-[48px] w-full p-2 border-2 border-gray-200 rounded-xl focus-within:ring-2 ${c.input} transition cursor-text flex flex-wrap gap-1.5 items-center`}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${c.tag}`}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="ml-0.5 opacity-60 hover:opacity-100 transition"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? (placeholder || 'Добавить тег...') : '+'}
          className="flex-1 min-w-[80px] text-sm text-gray-700 bg-transparent outline-none placeholder-gray-300 py-0.5 px-1"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Enter или запятая для добавления</p>
    </div>
  );
}
