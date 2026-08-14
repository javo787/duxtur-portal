interface StarRatingProps {
  /** Rating from 0 to 5 (can be fractional; rounds to the nearest whole star). */
  rating: number;
  /** Tailwind size classes for each star, e.g. "w-4 h-4". */
  size?: string;
  className?: string;
}

/**
 * Единый визуальный стиль звёзд рейтинга для всего сайта.
 * Заменяет ненадёжный рендеринг символов '★'/'☆' (шрифто-зависимый,
 * на части устройств выглядит криво) на ту же SVG-звезду, что уже
 * используется в DoctorCard.
 */
export default function StarRating({ rating, size = 'w-4 h-4', className = '' }: StarRatingProps) {
  const rounded = Math.round(rating);
  return (
    <div className={`flex gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`${size} ${s <= rounded ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
