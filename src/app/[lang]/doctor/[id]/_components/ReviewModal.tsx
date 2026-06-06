'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface Props {
  doctorId: string;
  doctorName: string;
  lang: string;
}

export default function ReviewModal({ doctorId, doctorName, lang }: Props) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSubmited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      signIn();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, rating, text, isAnonymous }),
      });

      if (res.ok) {
        setIsSubmited(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmited(false);
          setText('');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm"
      >
        Оставить отзыв
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8">
            {isSuccess ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Отзыв отправлен!</h3>
                <p className="text-sm text-gray-500">
                  Спасибо за ваш отзыв. Он появится на странице после модерации.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900">Ваш отзыв</h3>
                  <p className="text-xs text-gray-400 mt-1">О враче: {doctorName}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Оценка</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={`w-12 h-12 rounded-xl text-xl transition-all ${rating >= s ? 'bg-amber-50 text-amber-500 border-2 border-amber-200 shadow-sm shadow-amber-100' : 'bg-gray-50 text-gray-300 border-2 border-transparent'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Ваши впечатления</label>
                    <textarea
                      required
                      maxLength={500}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none text-sm transition"
                      placeholder="Расскажите о приёме..."
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-gray-400 font-bold">{text.length}/500</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Анонимный отзыв</p>
                      <p className="text-[11px] text-gray-400">Скрыть моё имя</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isAnonymous ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm hover:bg-gray-200 transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !text}
                      className="flex-2 py-4 bg-blue-600 text-white font-bold rounded-2xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
