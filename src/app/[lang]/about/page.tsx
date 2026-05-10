// src/app/[lang]/about/page.tsx
// НОВЫЙ ФАЙЛ — создать папку about и поместить туда

import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: 'О нас — Duxtur.org | Медицинский портал Центральной Азии',
    uz: 'Biz haqimizda — Duxtur.org',
    tg: 'Дар бораи мо — Duxtur.org',
    kk: 'Біз туралы — Duxtur.org',
    ky: 'Биз жөнүндө — Duxtur.org',
  };
  const descs: Record<string, string> = {
    ru: 'Duxtur.org — первый верифицированный медицинский портал Центральной Азии. Узнайте как мы проверяем врачей и обеспечиваем качество контента.',
    uz: 'Duxtur.org — Markaziy Osiyoning birinchi tasdiqlangan tibbiy portali.',
    tg: 'Duxtur.org — аввалин порталии тиббии тасдиқшудаи Осиёи Марказӣ.',
    kk: 'Duxtur.org — Орталық Азияның алғашқы верификацияланған медициналық порталы.',
    ky: 'Duxtur.org — Борбордук Азиянын биринчи верификацияланган медициналык порталы.',
  };
 return {
    title: titles[lang] || titles.ru,
    description: descs[lang] || descs.ru,
    alternates: buildAlternates('about', lang),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'О Duxtur.org',
    url: `${baseUrl}/${lang}/about`,
    description: 'Первый верифицированный медицинский портал Центральной Азии',
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.org',
      url: baseUrl,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'editorial',
        url: 'https://t.me/duxturcom',
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Duxtur.org',
          item: `${baseUrl}/${lang}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: lang === 'ru' ? 'О нас' : lang === 'uz' ? 'Biz haqimizda' : lang === 'tg' ? 'Дар бораи мо' : lang === 'kk' ? 'Біз туралы' : 'Биз жөнүндө',
          item: `${baseUrl}/${lang}/about`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.com</span></span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            ← Главная
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            YMYL — Медицинский контент
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            О Duxtur.org
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Первый верифицированный медицинский портал Центральной Азии на таджикском, узбекском, казахском, кыргызском и русском языках.
          </p>
        </div>

        {/* Миссия */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Наша миссия</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            80+ миллионов жителей Центральной Азии ищут медицинскую информацию в интернете — и находят её либо на английском, либо на сомнительных сайтах без верификации. <strong>Duxtur.org решает эту проблему:</strong> платформа где практикующие врачи пишут статьи, а читатели получают проверенную информацию на своём родном языке.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Мы убеждены: доступ к достоверной медицинской информации на родном языке — это не роскошь, а базовое право каждого человека.
          </p>
        </section>

        {/* Как мы верифицируем врачей */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Как мы проверяем врачей</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Все авторы Duxtur.org — практикующие врачи с подтверждённым медицинским образованием. Мы применяем многоступенчатую верификацию перед допуском к публикации.
          </p>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'Регистрация с документами',
                text: 'Врач регистрируется и загружает фотографию диплома или медицинской лицензии. Без документа — регистрация невозможна.',
                color: 'bg-blue-50 border-blue-200',
                num: 'text-blue-600',
              },
              {
                step: '02',
                title: 'Ручная проверка администратором',
                text: 'Редакция Duxtur.org вручную проверяет каждую заявку: подлинность документа, специализацию врача, контактные данные. Автоматического одобрения не существует.',
                color: 'bg-green-50 border-green-200',
                num: 'text-green-600',
              },
              {
                step: '03',
                title: 'Одобрение или отклонение',
                text: 'Только после успешной проверки врач получает доступ к публикации. При малейших сомнениях в подлинности документов — заявка отклоняется.',
                color: 'bg-purple-50 border-purple-200',
                num: 'text-purple-600',
              },
              {
                step: '04',
                title: 'Постоянный мониторинг',
                text: 'Редакция следит за качеством публикуемых материалов. При нарушении стандартов качества или профессиональной этики аккаунт блокируется.',
                color: 'bg-amber-50 border-amber-200',
                num: 'text-amber-600',
              },
            ].map((item) => (
              <div key={item.step} className={`flex gap-5 p-5 rounded-2xl border ${item.color}`}>
                <div className={`text-2xl font-extrabold ${item.num} shrink-0 w-10`}>{item.step}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI и контент */}
        <section className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-extrabold text-gray-900">Использование ИИ в создании контента</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            Часть статей на Duxtur.org создаётся с помощью технологий искусственного интеллекта (Google Gemini) — это помогает врачам структурировать материал и адаптировать сложные медицинские тексты для широкой аудитории.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>Важно:</strong> каждая статья, созданная с помощью ИИ, написана или проверена практикующим врачом с верифицированным медицинским образованием. ИИ является инструментом оформления, но медицинская точность информации — ответственность автора-врача.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Статьи помечены соответствующим образом. Если вы нашли неточность — сообщите нам через Telegram.
          </p>
        </section>

        {/* Стандарты контента */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Стандарты качества контента</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: 'Авторство врачей', text: 'Только практикующие специалисты с подтверждёнными документами.' },
              { icon: '📚', title: 'Медицинские источники', text: 'Каждая статья содержит ссылки на WHO, CDC, PubMed или другие авторитетные источники.' },
              { icon: '🔄', title: 'Актуальность', text: 'Информация регулярно обновляется в соответствии с текущими медицинскими рекомендациями.' },
              { icon: '⚕️', title: 'Дисклеймер', text: 'Каждая статья содержит предупреждение: информация не заменяет консультацию врача.' },
              { icon: '🌍', title: 'Мультиязычность', text: 'Переводы выполняются с учётом медицинской терминологии на каждом языке.' },
              { icon: '🚫', title: 'Модерация', text: 'Редакция вправе удалить любую статью не соответствующую стандартам качества.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Контакты */}
        <section className="mb-12 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Контакты редакции</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            Нашли ошибку в статье? Хотите предложить тему? Есть вопросы о верификации? Напишите нам — редакция отвечает в течение 24 часов.
          </p>
          <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition active:scale-95">
            Написать в Telegram
          </a>
        </section>

        {/* Дата обновления */}
        <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
          Страница последний раз обновлена: апрель 2025 года
        </div>
      </main>
    </div>
  );
}
