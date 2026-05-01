// src/app/[lang]/editorial/page.tsx
// НОВЫЙ ФАЙЛ — создать папку editorial

import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;

  const titles: Record<string, string> = {
    ru: 'Редакционная политика — Duxtur.com',
    uz: 'Tahririyat siyosati — Duxtur.com',
    tg: 'Сиёсати таҳририявӣ — Duxtur.com',
    kk: 'Редакциялық саясат — Duxtur.com',
    ky: 'Редакциялык саясат — Duxtur.com',
  };

  const descs: Record<string, string> = {
    ru: 'Редакционные стандарты Duxtur.com: как мы создаём, проверяем и публикуем медицинский контент. Процесс верификации врачей и стандарты качества.',
    uz: 'Duxtur.com tahririyat standartlari: tibbiy kontentni qanday yaratamiz, tekshiramiz va chop etamiz. Shifokorlarni tasdiqlash jarayoni.',
    tg: 'Стандартҳои таҳририявии Duxtur.com: чӣ тавр мо мӯҳтавои тиббӣ эҷод, тафтиш ва нашр мекунем. Раванди тасдиқи духтурон.',
    kk: 'Duxtur.com редакциялық стандарттары: медициналық контентті қалай жасаймыз, тексереміз және жариялаймыз. Дәрігерлерді верификациялау процесі.',
    ky: 'Duxtur.com редакциялык стандарттары: медициналык контентти кантип түзөбүз, текшеребиз жана жарыялайбыз. Дарыгерлерди верификациялоо процесси.',
  };

  return {
    title: titles[lang] ?? titles.ru,
    description: descs[lang] ?? descs.ru,
    robots: { index: true, follow: true },
    alternates: buildAlternates('editorial', lang),
  };
}

export default async function EditorialPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur-portal.vercel.app';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Редакционная политика Duxtur.com',
    url: `${baseUrl}/${lang}/editorial`,
    description: 'Стандарты создания и верификации медицинского контента',
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.com',
      url: baseUrl,
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
          <Link href={`/${lang}/about`} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            ← О нас
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">

        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Редакционная политика</h1>
          <p className="text-gray-500 text-sm">Последнее обновление: апрель 2025</p>
        </div>

        {/* Intro */}
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl mb-10">
          <p className="text-gray-700 leading-relaxed text-sm">
            Медицинская информация относится к категории <strong>YMYL (Your Money or Your Life)</strong> — контент с высоким влиянием на жизнь пользователей. Duxtur.com применяет строгие редакционные стандарты чтобы гарантировать точность, актуальность и безопасность публикуемых материалов.
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">01.</span> Кто может публиковать на Duxtur.com
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">К публикации допускаются исключительно:</p>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                'Врачи с дипломом о высшем медицинском образовании',
                'Специалисты с действующей врачебной лицензией',
                'Медицинские работники с практическим опытом работы',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-green-500 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3 text-sm">Авторы-не медики, журналисты без медицинского образования и анонимные пользователи к публикации не допускаются.</p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">02.</span> Процесс верификации автора
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              {[
                { n: '1', t: 'Подача заявки', d: 'Врач заполняет форму регистрации и загружает фото диплома или лицензии.' },
                { n: '2', t: 'Ручная проверка', d: 'Редактор Duxtur.com проверяет подлинность документа, соответствие специализации, контактные данные. Срок: 1-3 рабочих дня.' },
                { n: '3', t: 'Решение', d: 'Заявка одобряется или отклоняется. При отклонении врач получает пояснение.' },
                { n: '4', t: 'Пробный период', d: 'После одобрения первые 3 статьи проходят дополнительную редакционную проверку.' },
              ].map((item) => (
                <li key={item.n} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="font-extrabold text-blue-600 shrink-0 text-base">{item.n}.</span>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">{item.t}</p>
                    <p>{item.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">03.</span> Стандарты создания статей
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="leading-relaxed"><strong className="text-gray-900">Достоверность:</strong> все медицинские утверждения должны быть подкреплены источниками из авторитетных организаций: ВОЗ, CDC, Mayo Clinic, PubMed, национальные клинические рекомендации.</p>
              <p className="leading-relaxed"><strong className="text-gray-900">Актуальность:</strong> статья должна отражать актуальные медицинские стандарты. Устаревшие методы лечения недопустимы без соответствующей пометки.</p>
              <p className="leading-relaxed"><strong className="text-gray-900">Минимум 2 источника:</strong> каждая статья обязана содержать минимум 2 ссылки на авторитетные медицинские источники.</p>
              <p className="leading-relaxed"><strong className="text-gray-900">Дисклеймер:</strong> каждая статья автоматически получает предупреждение о том, что информация носит образовательный характер и не заменяет консультацию врача.</p>
              <p className="leading-relaxed"><strong className="text-gray-900">Запрещено:</strong> реклама конкретных лекарств, клиник или препаратов в тексте статьи; недоказанные методы лечения без соответствующей пометки; контент способный причинить вред.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">04.</span> Использование искусственного интеллекта
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700 leading-relaxed">
              <p className="mb-3">Duxtur.com использует инструменты на базе ИИ (Google Gemini) для помощи врачам в структурировании и оформлении статей. ИИ помогает:</p>
              <ul className="space-y-1 mb-3">
                <li className="flex gap-2"><span>•</span>Структурировать черновик врача в профессиональную статью</li>
                <li className="flex gap-2"><span>•</span>Адаптировать научные тексты для широкой аудитории</li>
                <li className="flex gap-2"><span>•</span>Переводить контент на языки Центральной Азии</li>
              </ul>
              <p className="font-medium text-amber-800">ИИ не является автором медицинских решений. Вся медицинская информация написана или проверена практикующим врачом. Статьи, созданные с помощью ИИ, помечаются соответствующим образом.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">05.</span> Обновление и удаление контента
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Медицинская информация меняется — рекомендации ВОЗ, протоколы лечения, новые исследования. Редакция обязуется:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                'Обновлять статьи при появлении новых клинических рекомендаций',
                'Удалять статьи содержащие устаревшую или опасную информацию',
                'Помечать статьи датой последнего обновления',
                'Принимать сообщения об ошибках от читателей через Telegram',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-blue-500 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">06.</span> Конфликт интересов
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Авторы не имеют права рекламировать в статьях конкретные препараты, клиники или медицинские услуги которые они предоставляют лично. Любой коммерческий контент должен быть явно помечен как рекламный материал и проходит отдельную проверку.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">07.</span> Сообщить об ошибке
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Если вы обнаружили медицинскую неточность, устаревшую информацию или нарушение редакционных стандартов — сообщите нам. Мы рассматриваем каждое обращение.
            </p>
            {/* НАЙТИ и ЗАМЕНИТЬ кнопку в editorial/page.tsx — секция 07 */}
            
              <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition">
              Написать редакции в Telegram
            </a>
            
            
          </section>

        </div>
      </main>
    </div>
  );
}
