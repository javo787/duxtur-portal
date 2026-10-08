'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { likeArticle } from '@/app/actions/rating';

type Props = {
  slug: string;
  initialLikesUp: number;
  initialLikesDown: number;
  lang: string;
};

const ui: Record<string, Record<string, string>> = {
  useful_title: { ru: 'Эта статья была полезна?', uz: 'Bu maqola foydali bo\'ldimi?', tg: 'Оё ин мақола муфид буд?', kk: 'Бұл мақала пайдалы болды ма?', ky: 'Бул макала пайдалуу болдубу?' },
  thanks_like:  { ru: 'Спасибо за отзыв!', uz: 'Fikringiz uchun rahmat!', tg: 'Ташаккур барои фикр!', kk: 'Пікіріңіз үшін рахмет!', ky: 'Пикириңиз үчүн рахмат!' },
  read_min:     { ru: 'мин чтения', uz: 'daqiqa', tg: 'дақиқа', kk: 'мин', ky: 'мүн' },
};
const L = (key: string, lang: string) => ui[key]?.[lang] || ui[key]?.ru || '';

export default function ArticleEngagement({
  slug,
  initialLikesUp,
  initialLikesDown,
  lang,
}: Props) {
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [likesUp, setLikesUp] = useState(initialLikesUp);
  const [likesDown, setLikesDown] = useState(initialLikesDown);

  const handleLike = async (type: 'up' | 'down') => {
    if (liked) return;
    setLiked(type);
    if (type === 'up') setLikesUp((p) => p + 1);
    else setLikesDown((p) => p + 1);
    await likeArticle(slug, type);
  };

  const yes = { ru: 'Да', uz: 'Ha', tg: 'Ҳа', kk: 'Иә', ky: 'Ооба' }[lang] ?? 'Да';
  const no = { ru: 'Нет', uz: "Yo'q", tg: 'Не', kk: 'Жоқ', ky: 'Жок' }[lang] ?? 'Нет';
  const iconBtn =
    'inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div>
        <p className="font-semibold">{L('useful_title', lang)}</p>
        {liked ? (
          <p className="mt-3 text-sm text-ok" role="status">
            {L('thanks_like', lang)}
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => handleLike('up')} className={iconBtn}>
              <ThumbsUp className="size-4" aria-hidden="true" />
              {yes}
              {likesUp > 0 && <span className="text-foreground/65 tabular-nums">{likesUp}</span>}
            </button>
            <button type="button" onClick={() => handleLike('down')} className={iconBtn}>
              <ThumbsDown className="size-4" aria-hidden="true" />
              {no}
              {likesDown > 0 && <span className="text-foreground/65 tabular-nums">{likesDown}</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
