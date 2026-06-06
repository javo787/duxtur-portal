'use client';

import { useState } from 'react';
import { rateArticle, likeArticle } from '@/app/actions/rating';

type Props = {
  slug: string;
  initialRating: number;
  initialRatingCount: number;
  initialLikesUp: number;
  initialLikesDown: number;
  lang: string;
};

const ui: Record<string, Record<string, string>> = {
  rate_title:   { ru: 'Оцените статью', uz: 'Maqolani baholang', tg: 'Мақоларо баҳо диҳед', kk: 'Мақалаға баға беріңіз', ky: 'Макалага баа бериңиз' },
  useful_title: { ru: 'Эта статья была полезна?', uz: 'Bu maqola foydali bo\'ldimi?', tg: 'Оё ин мақола муфид буд?', kk: 'Бұл мақала пайдалы болды ма?', ky: 'Бул макала пайдалуу болдубу?' },
  thanks:       { ru: 'Спасибо за оценку!', uz: 'Baholаganingiz uchun rahmat!', tg: 'Ташаккур барои баҳо!', kk: 'Бағалағаныңыз үшін рахмет!', ky: 'Баалаганыңыз үчүн рахмат!' },
  thanks_like:  { ru: 'Спасибо за отзыв!', uz: 'Fikringiz uchun rahmat!', tg: 'Ташаккур барои фикр!', kk: 'Пікіріңіз үшін рахмет!', ky: 'Пикириңиз үчүн рахмат!' },
  read_min:     { ru: 'мин чтения', uz: 'daqiqa', tg: 'дақиқа', kk: 'мин', ky: 'мүн' },
};
const L = (key: string, lang: string) => ui[key]?.[lang] || ui[key]?.ru || '';

export default function ArticleEngagement({
  slug,
  initialRating,
  initialRatingCount,
  initialLikesUp,
  initialLikesDown,
  lang,
}: Props) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [likesUp, setLikesUp] = useState(initialLikesUp);
  const [likesDown, setLikesDown] = useState(initialLikesDown);
  const [avgRating, setAvgRating] = useState(initialRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);

  const handleRate = async (stars: number) => {
    if (rated) return;
    setUserRating(stars);
    setRated(true);
    // Оптимистичное обновление
    const newCount = ratingCount + 1;
    const newAvg = (avgRating * ratingCount + stars) / newCount;
    setAvgRating(Math.round(newAvg * 10) / 10);
    setRatingCount(newCount);
    await rateArticle(slug, stars);
  };

  const handleLike = async (type: 'up' | 'down') => {
    if (liked) return;
    setLiked(type);
    if (type === 'up') setLikesUp((p) => p + 1);
    else setLikesDown((p) => p + 1);
    await likeArticle(slug, type);
  };

  return (
    <div className="mt-14 space-y-6">

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="border-t border-gray-100" />

      {/* ЗВЁЗДОЧКИ */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 border border-blue-100 text-center">
        <p className="font-extrabold text-gray-900 text-lg mb-1">{L('rate_title', lang)}</p>

        {/* Текущий рейтинг */}
        {ratingCount > 0 && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-bold text-gray-600">{avgRating} ({ratingCount})</span>
          </div>
        )}

        {rated ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {L('thanks', lang)}
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-125 active:scale-110"
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || userRating)
                      ? 'text-yellow-400'
                      : 'text-gray-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ПОЛЕЗНО / НЕ ПОЛЕЗНО */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
        <p className="font-bold text-gray-800 mb-5">{L('useful_title', lang)}</p>

        {liked ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {L('thanks_like', lang)}
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleLike('up')}
              className="flex items-center gap-3 px-8 py-3.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl font-bold transition border border-green-200 hover:border-green-400 group"
            >
              <span className="text-2xl group-hover:scale-110 transition">👍</span>
              <span>
                {lang === 'ru' ? 'Да' : lang === 'uz' ? 'Ha' : lang === 'tg' ? 'Ҳа' : lang === 'kk' ? 'Иә' : 'Ооба'}
                {likesUp > 0 && <span className="ml-2 text-green-500 font-extrabold">{likesUp}</span>}
              </span>
            </button>
            <button
              onClick={() => handleLike('down')}
              className="flex items-center gap-3 px-8 py-3.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-2xl font-bold transition border border-gray-200 hover:border-red-200 group"
            >
              <span className="text-2xl group-hover:scale-110 transition">👎</span>
              <span>
                {lang === 'ru' ? 'Нет' : lang === 'uz' ? 'Yo\'q' : lang === 'tg' ? 'Не' : lang === 'kk' ? 'Жоқ' : 'Жок'}
                {likesDown > 0 && <span className="ml-2 text-red-400 font-extrabold">{likesDown}</span>}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
