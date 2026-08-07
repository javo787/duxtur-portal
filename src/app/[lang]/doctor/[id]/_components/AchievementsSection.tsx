interface AchievementItem {
  type: 'award' | 'certification' | 'membership' | 'publication';
  title: string;
  issuer?: string;
  year?: number;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  award: { icon: '🏆', color: 'from-amber-50 to-amber-100/50 border-amber-100' },
  certification: { icon: '📜', color: 'from-blue-50 to-blue-100/50 border-blue-100' },
  membership: { icon: '🎓', color: 'from-violet-50 to-violet-100/50 border-violet-100' },
  publication: { icon: '📚', color: 'from-emerald-50 to-emerald-100/50 border-emerald-100' },
};

export default function AchievementsSection({ items, title }: { items: AchievementItem[]; title: string }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
      <h2 className="text-lg font-black text-slate-900 mb-5">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item, i) => {
          const meta = TYPE_META[item.type] || TYPE_META.award;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br border ${meta.color}`}
            >
              <span className="text-2xl shrink-0">{meta.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm leading-snug">{item.title}</p>
                {(item.issuer || item.year) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {item.issuer}{item.issuer && item.year ? ' · ' : ''}{item.year}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
