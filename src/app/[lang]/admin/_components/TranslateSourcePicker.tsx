'use client';

import { useEffect, useState } from 'react';
import {
  getArticleForTranslation,
  listMyArticlesForTranslation,
  type TranslatableSummary,
} from '@/app/actions/translate-article';

export const LANGUAGE_LABELS: Record<string, string> = {
  ru: '🇷🇺 Русский',
  uz: "🇺🇿 O'zbek",
  tg: '🇹🇯 Тоҷикӣ',
  ky: '🇰🇬 Кыргызча',
  kk: '🇰🇿 Қазақша',
};

/** One of the author's articles, loaded into the translator. */
export interface TranslationSource {
  slug: string;
  title: string;
  /** Languages the article already has. */
  languages: string[];
  /** The language the text was taken from. */
  sourceLanguage: string;
}

interface Props {
  /** The language the article is translated into (the selector of the form). */
  targetLanguage: string;
  selected: TranslationSource | null;
  onLoaded: (source: TranslationSource, text: string) => void;
  onClear: () => void;
}

/**
 * "Перевести" mode: instead of pasting a text, pick one of your own articles. The translation is then saved as
 * another language of the same article.
 */
export function TranslateSourcePicker({ targetLanguage, selected, onLoaded, onClear }: Props) {
  const [articles, setArticles] = useState<TranslatableSummary[] | null>(null);
  const [slug, setSlug] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listMyArticlesForTranslation()
      .then((res) => { if (alive) setArticles(res.success ? res.articles : []); })
      .catch(() => { if (alive) setArticles([]); });
    return () => { alive = false; };
  }, []);

  const article = articles?.find((a) => a.slug === slug) || null;

  const choose = (nextSlug: string) => {
    setSlug(nextSlug);
    setError('');
    const next = articles?.find((a) => a.slug === nextSlug);
    // Start from a language other than the target one: Russian if there is one, otherwise the first.
    const preferred = next?.languages.find((l) => l !== targetLanguage && l === 'ru') || next?.languages.find((l) => l !== targetLanguage) || next?.languages[0] || '';
    setSourceLanguage(preferred);
  };

  const load = async () => {
    if (!article || !sourceLanguage) return;
    setIsLoading(true);
    setError('');
    const res = await getArticleForTranslation(article.slug, sourceLanguage);
    setIsLoading(false);
    if (!res.success) { setError(res.error); return; }
    onLoaded({ slug: article.slug, title: article.title, languages: res.languages, sourceLanguage }, res.text);
  };

  if (articles === null) {
    return <p className="text-xs text-gray-400">Загружаем ваши статьи…</p>;
  }
  if (articles.length === 0) return null;

  if (selected) {
    const exists = selected.languages.includes(targetLanguage);
    const same = selected.sourceLanguage === targetLanguage;
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Перевод вашей статьи</p>
            <p className="text-sm font-bold text-gray-900 break-words">{selected.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Исходный язык: {LANGUAGE_LABELS[selected.sourceLanguage] || selected.sourceLanguage} → {LANGUAGE_LABELS[targetLanguage] || targetLanguage}
            </p>
          </div>
          <button type="button" onClick={onClear}
            className="shrink-0 text-xs font-bold text-blue-700 hover:underline">
            Другая статья
          </button>
        </div>
        {same && (
          <p className="text-xs font-medium text-red-600">Выберите в поле «Перевести на» другой язык — статья уже на этом языке.</p>
        )}
        {!same && exists && (
          <p className="text-xs font-medium text-amber-700">Версия на этом языке уже есть — после сохранения она будет заменена переводом.</p>
        )}
        {!same && !exists && (
          <p className="text-xs text-gray-600">Перевод появится на той же странице статьи как новая языковая версия — адрес, обложка и источники останутся прежними.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
      <div>
        <label htmlFor="translate-article" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          Перевести мою статью
        </label>
        <select id="translate-article" value={slug} onChange={(e) => choose(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-blue-500 outline-none">
          <option value="">— выберите статью —</option>
          {articles.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.title.length > 70 ? `${a.title.slice(0, 70)}…` : a.title} ({a.languages.map((l) => l.toUpperCase()).join(', ')})
            </option>
          ))}
        </select>
      </div>

      {article && (
        <>
          <fieldset>
            <legend className="text-xs font-bold text-gray-500 mb-1.5">Переводить с языка</legend>
            <div className="flex flex-wrap gap-2">
              {article.languages.map((l) => (
                <label key={l}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium ${sourceLanguage === l ? 'border-blue-600 bg-white text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                  <input type="radio" name="translate-source" value={l} checked={sourceLanguage === l}
                    onChange={() => setSourceLanguage(l)} className="sr-only" />
                  {LANGUAGE_LABELS[l] || l}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" onClick={load} disabled={isLoading || !sourceLanguage}
            className="w-full py-2.5 rounded-lg bg-white border-2 border-blue-600 text-blue-700 text-sm font-bold hover:bg-blue-50 disabled:opacity-50">
            {isLoading ? 'Загружаем текст…' : 'Загрузить текст статьи'}
          </button>
        </>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400">Или вставьте любой другой текст в поле ниже — он будет переведён как новая статья.</p>
    </div>
  );
}
