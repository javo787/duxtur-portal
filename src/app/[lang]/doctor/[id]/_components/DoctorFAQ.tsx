'use client';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function DoctorFAQ({ items, title }: { items: FAQItem[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
      <h2 className="text-lg font-black text-slate-900 mb-5">{title}</h2>
      <div className="divide-y divide-slate-100">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="py-1">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
              >
                <span className="font-bold text-slate-800 text-sm">{item.question}</span>
                <span
                  className={`shrink-0 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-45 bg-blue-50 text-blue-500' : ''}`}
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-all duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm text-slate-500 leading-relaxed pr-10">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
