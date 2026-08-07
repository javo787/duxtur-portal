'use client';
import { SectionHeader, strField } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function FAQAdmin({ profile, setProfile }: Props) {
  const items: any[] = profile.faq || [];

  const update = (index: number, patch: Record<string, any>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    setProfile((p: any) => ({ ...p, faq: next }));
  };

  const remove = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setProfile((p: any) => ({ ...p, faq: next }));
  };

  const add = () => {
    setProfile((p: any) => ({ ...p, faq: [...items, { question: '', answer: '' }] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-7">
      <SectionHeader
        title="Свои частые вопросы"
        subtitle="Стандартные вопросы (оплата, страховка, онлайн-приём) уже показываются автоматически — здесь можно добавить свои"
        accent
      />

      <div className="space-y-3">
        {items.map((item, index) => {
          const q = typeof item.question === 'string' ? item.question : strField(item.question);
          const a = typeof item.answer === 'string' ? item.answer : strField(item.answer);
          return (
            <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Вопрос {index + 1}</span>
                <button onClick={() => remove(index)} className="text-red-400 hover:text-red-600 text-xs font-bold">
                  Удалить
                </button>
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => update(index, { question: e.target.value })}
                placeholder="Например: Принимаете ли вы детей до 3 лет?"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8"
              />
              <textarea
                value={a}
                onChange={(e) => update(index, { answer: e.target.value })}
                placeholder="Ваш ответ..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={add}
        className="w-full mt-3 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition"
      >
        + Добавить вопрос
      </button>
    </div>
  );
}
