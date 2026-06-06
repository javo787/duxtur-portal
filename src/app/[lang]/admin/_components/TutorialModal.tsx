'use client';

import { useState } from 'react';

const STEPS = [
  { icon: '👋', title: 'Добро пожаловать в кабинет врача!', text: 'Здесь вы можете публиковать медицинские статьи для пациентов Центральной Азии. AI-помощник поможет оформить ваши знания профессионально.' },
  { icon: '✍️', title: 'Режим "Написать"', text: 'Напишите черновик своими словами — хотя бы 100 символов о теме. AI сам структурирует статью: добавит разделы, источники и форматирование.' },
  { icon: '📄', title: 'Режим "Обработать"', text: 'Есть научная статья из PubMed или ВОЗ? Вставьте её — AI адаптирует сложный медицинский текст в понятный материал для пациентов.' },
  { icon: '🌐', title: 'Режим "Перевести"', text: 'Вставьте текст на любом языке — AI переведёт его профессионально на нужный язык (таджикский, узбекский, казахский, кыргызский, русский).' },
  { icon: '🚀', title: 'Готово! Начнём?', text: 'После обработки AI вы сможете редактировать каждый раздел, добавить обложку и опубликовать. Если нужна помощь — пишите нам в Telegram.' },
];

export function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">{current.title}</h3>
          <p className="text-gray-500 leading-relaxed text-sm">{current.text}</p>
        </div>

        {isLast && (
          <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#229ED9] text-white rounded-xl font-bold text-sm mb-4 hover:bg-[#1a8bbf] transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
            </svg>
            Написать в поддержку Telegram
          </a>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">
              ← Назад
            </button>
          )}
          <button onClick={isLast ? onClose : () => setStep(s => s + 1)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition">
            {isLast ? 'Начать работу 🚀' : 'Далее →'}
          </button>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
