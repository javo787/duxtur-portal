'use client';

interface ReadabilityMeterProps {
  text: string;
}

function calcScore(text: string): { score: number; label: string; color: string; hint: string } {
  if (!text || text.trim().length < 50) {
    return { score: 0, label: 'Нет текста', color: 'gray', hint: 'Добавьте содержание статьи' };
  }

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length === 0) return { score: 1, label: 'Очень мало', color: 'gray', hint: 'Добавьте больше предложений' };

  const words = text.split(/\s+/).filter(Boolean);
  const avgWordsPerSentence = words.length / sentences.length;

  // Long words (>6 chars = harder to read in medical text)
  const longWords = words.filter((w) => w.replace(/[^а-яёa-z]/gi, '').length > 6).length;
  const longWordRatio = longWords / words.length;

  // Score: lower avg sentence length = better, lower long word ratio = better
  let score = 5;
  if (avgWordsPerSentence > 25) score -= 2;
  else if (avgWordsPerSentence > 18) score -= 1;
  if (longWordRatio > 0.5) score -= 1;
  else if (longWordRatio < 0.3) score += 1;
  score = Math.max(1, Math.min(5, score));

  const levels = [
    { score: 1, label: 'Очень сложно', color: 'red',    hint: 'Слишком длинные предложения. Разбейте на короткие.' },
    { score: 2, label: 'Сложно',       color: 'orange',  hint: 'Упростите формулировки для пациентов.' },
    { score: 3, label: 'Средне',       color: 'yellow',  hint: 'Норм, но можно упростить.' },
    { score: 4, label: 'Хорошо',       color: 'lime',    hint: 'Текст понятен большинству читателей.' },
    { score: 5, label: 'Отлично',      color: 'green',   hint: 'Легко читается — идеально для пациентов.' },
  ];

  return levels[score - 1];
}

const DOT_COLORS: Record<string, { active: string; inactive: string }> = {
  gray:   { active: 'bg-gray-400',   inactive: 'bg-gray-200' },
  red:    { active: 'bg-red-500',    inactive: 'bg-red-100' },
  orange: { active: 'bg-orange-500', inactive: 'bg-orange-100' },
  yellow: { active: 'bg-yellow-500', inactive: 'bg-yellow-100' },
  lime:   { active: 'bg-lime-500',   inactive: 'bg-lime-100' },
  green:  { active: 'bg-green-500',  inactive: 'bg-green-100' },
};

const TEXT_COLORS: Record<string, string> = {
  gray: 'text-gray-400', red: 'text-red-600', orange: 'text-orange-600',
  yellow: 'text-yellow-700', lime: 'text-lime-700', green: 'text-green-700',
};

export function ReadabilityMeter({ text }: ReadabilityMeterProps) {
  const { score, label, color, hint } = calcScore(text);
  const dc = DOT_COLORS[color] || DOT_COLORS.gray;

  return (
    <div className="flex items-center gap-3" title={hint}>
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Читаемость:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i <= score ? dc.active : dc.inactive}`}
          />
        ))}
      </div>
      <span className={`text-xs font-bold ${TEXT_COLORS[color]}`}>{label}</span>
    </div>
  );
}
