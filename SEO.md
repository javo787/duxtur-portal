# SEO Optimization - Duxtur.org

This document outlines the SEO strategies implemented in the Duxtur.org project and the roadmap for future improvements.

## 🚀 Implemented Features

### 1. Internationalization (i18n) & Hreflang
- **Multi-language support:** Tajikistan (tg), Uzbekistan (uz), Kazakhstan (kk), Kyrgyzstan (ky), and Russian (ru).
- **Hreflang implementation:** Automated `hreflang` tags using `buildAlternates` utility to ensure search engines serve the correct language version to users.
- **Localized Metadata:** Each page has unique `title` and `description` translated into all supported languages.

### 2. Structured Data (JSON-LD)
We use Schema.org structured data to help search engines understand our content better:
- **MedicalWebPage:** Used on the homepage and core landing pages.
- **Article & MedicalWebPage:** Implemented for all blog posts, including reading time, author info, and review status.
- **Physician & MedicalBusiness:** Detailed profiles for doctors, including education, experience, and contact info.
- **MedicalClinic:** Comprehensive data for clinics.
- **FAQPage:** Automatically generated from article sections to appear in "People Also Ask" results.
- **BreadcrumbList:** Clear navigation paths on all deep pages.
- **ItemList:** Used on specialty and category pages to list doctors/articles.

### 3. Sitemaps & Robots.txt
- **Dynamic Sitemap:** `sitemap.xml` is generated hourly, covering articles, doctors, clinics, specialties, and static pages across all languages.
- **Robots.txt:** Optimized rules for Googlebot and other crawlers, excluding private areas (admin, patient profiles) while allowing full access to public content.

### 4. Technical SEO
- **Canonical Tags:** Automated canonical URL generation to prevent duplicate content issues.
- **Heading Hierarchy:** Strictly enforced single `h1` per page and logical nesting of `h2`-`h4`.
- **Image Optimization:**
  - Using Next.js `next/image` for automatic resizing and WebP conversion.
  - Cloudinary integration for advanced image transformations.
  - Proper `alt` tags for all meaningful images.
- **Performance (Core Web Vitals):**
  - Optimized font loading (Geist, Inter, Fraunces) with `display: swap`.
  - Resource preloading for hero images and critical assets.
  - ISR (Incremental Static Regeneration) for fast page loads and fresh content.

---

## 🗺️ Roadmap for Future Improvements

### Short-term
- [ ] **OpenGraph Image Generation:** Automate dynamic OG image creation for every doctor and clinic profile (similar to how it's done for articles).
- [ ] **Internal Linking:** Implement a "Related Clinics" section on doctor pages and "Related Doctors" on clinic pages to improve crawl depth.
- [ ] **Social Media Meta:** Enhance Twitter/X cards with more specific data like "Specialty" or "Rating".

### Long-term
- [ ] **Backlink Strategy:** Partner with medical universities and health organizations in Central Asia to build high-quality backlinks.
- [ ] **Content Marketing:** Regular publication of high-intent medical guides (e.g., "Best pediatricians in Dushanbe").
- [ ] **Core Web Vitals Monitoring:** Continuous auditing of LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) especially on map-heavy pages.
- [ ] **User Reviews SEO:** Encourage more detailed text reviews from patients, as they provide unique, high-value long-tail keyword content.


---

## 📓 Журнал решений

### 2026-10 · Bing и IndexNow: чтобы ChatGPT и Bing видели новые страницы (ветка `feat/bing-indexnow`)

**Зачем.** Поиск ChatGPT опирается на индекс Bing (по публичным данным и отраслевым исследованиям; точные доли в них разные, OpenAI их не подтверждает), а страницу, которой нет в индексе, ИИ процитировать не может. Google в IndexNow не участвует, ему по-прежнему хватает sitemap и Search Console.

**Что сделано.**
- `src/lib/indexnow.ts`: отправка списка URL в IndexNow (`api.indexnow.org`). Оставляет только https-адреса на `www.duxtur.org`, убирает дубли и XML-экранирование (`&amp;`), режет на пачки по 10 000, ответы 200 и 202 считает успехом, ошибки не выбрасывает.
- `/<ключ>.txt`: файл ключа отдаёт `src/app/api/indexnow/key/[key]/route.ts`, а `next.config.ts` (`afterFiles`) перенаправляет корневой путь на него. Отвечает только ключ из `INDEXNOW_KEY`, любое другое имя `*.txt` остаётся 404; `robots.txt` и `sitemap.xml` не затронуты.
- `GET /api/cron/indexnow` + запись в `vercel.json` (ежедневно, 03:00 UTC): берёт `sitemap()`, отправляет URL, у которых `lastmod` свежее 26 часов. `?hours=N` меняет окно, `?all=1` отправляет весь sitemap (разово после первого деплоя). Доступ только с `Authorization: Bearer $CRON_SECRET`; без `CRON_SECRET` всегда 401.
- `src/lib/bing-verification.ts` + `layout.tsx`: мета-тег `msvalidate.01` из `BING_SITE_VERIFICATION`. Нужен только если сайт добавляют в Bing не импортом из Search Console.

**Переменные окружения (Vercel).** `INDEXNOW_KEY` (8-128 символов: буквы, цифры, дефис; например `openssl rand -hex 16`), `CRON_SECRET` (случайная строка), `BING_SITE_VERIFICATION` (по желанию).

**Что сделать владельцу после деплоя.**
1. Задать `INDEXNOW_KEY` и `CRON_SECRET` в Vercel, передеплоить.
2. Открыть `https://www.duxtur.org/<ключ>.txt`: должен вернуться сам ключ.
3. В Bing Webmaster Tools добавить сайт: проще всего «Импорт из Google Search Console»; либо тег `BING_SITE_VERIFICATION`. Отправить `https://www.duxtur.org/sitemap.xml`.
4. Один раз отправить всё: `curl -H "Authorization: Bearer $CRON_SECRET" "https://www.duxtur.org/api/cron/indexnow?all=1"`. В ответе `ok: true` и `statuses: [200]` или `[202]`.

**Проверено:** `tsc --noEmit`, eslint по изменённым файлам, `vitest` (юнит-тесты на отправку, нормализацию URL, ключ-файл, cron и мета-тег; в `edu-next-config.test.ts` добавлена проверка шаблона rewrite), живой `next dev`: ключ-файл отдаётся с `text/plain`, чужое имя даёт 404, `robots.txt` на месте, cron без секрета даёт 401, тег `msvalidate.01` появляется в HTML при заданной переменной и отсутствует без неё.
**Не проверено:** реальный запрос к `api.indexnow.org` (из песочницы недоступен), `next build` (его гоняет CI), поведение на Vercel (cron, переменные), приём sitemap в Bing.

**Побочное наблюдение (не менял).** Существующий cron `/api/admin/places/cleanup` обрабатывает только `POST`, а Vercel Cron вызывает путь методом `GET`. Если это так, он ни разу не отработал: стоит проверить в логах Vercel.

### 2026-10 · Разбор отчёта Search Console «Страницы» (ветка `fix/gsc-indexing-hygiene`)

Снимок отчёта от 2026-10-06 (скриншот владельца): «Альтернативная страница с правильным canonical» 31 · Не найдено (404) 9 · Заблокировано в robots.txt 3 · Страница с редиректом 2 · Просканировано, не в индексе 3.

**Проверено:** код (robots, sitemap, canonical и hreflang на всех страницах, редиректы, ссылки в компонентах), `tsc --noEmit`, eslint по изменённым файлам, `vitest` (464 теста).
**Не проверено:** живой сайт и выдача (из песочницы недоступны), списки URL внутри отчёта, `next build` (его гоняет CI). Соответствие «причина → URL» ниже — вывод по коду, не по спискам из отчёта.

| Причина в отчёте | Что в коде | Решение |
|---|---|---|
| Альтернативная страница с canonical (31) | **Список URL из отчёта показал главную причину: все 31 страница — на `www.duxtur.org`** (`/ru`, `/tg`, `/ru/blog`, `/kk/blog/c/cardiology`, `/ru/doctor/…`). Сайт отвечает на www без редиректа, а canonical, hreflang, sitemap и JSON-LD везде указывали на `duxtur.org` без www: Google считает www-страницы копиями страниц чужого хоста. Параметрические дубли (`?specialty=`, `?category=`) — вторично (в списке их 3 из 31). | `BASE_URL` → `https://www.duxtur.org` и все места с жёстко прописанным хостом (см. «Главный хост»). Дополнительно: `?specialty=X` без других фильтров → canonical на `/doctors/X`; `?category=X` → `/blog/c/X` (только для 5 категорий с посадочной); ссылки с главной ведут прямо на посадочные; hreflang — только у чистых списков. |
| Просканировано, не в индексе (3) | `/doctors/map` — целиком клиентская карта, для краулера текста нет, а в sitemap стояла с приоритетом 0.9. Страницы специальностей без врачей лежали в sitemap и не были noindex. | Карта: `noindex,follow`, вне sitemap. Специальность без одобренного врача: `noindex,follow`, вне sitemap; порог — `MIN_INDEXABLE_SPECIALTY_DOCTORS` в `clinic-seo.ts`. `lastmod` специальности — по самому свежему врачу этой специальности, а не «по любому». |
| 404 (9) | По сетке ссылок в компонентах одна битая: в админке «Открыть на сайте» вела на `/doctors/<slug>` вместо `/doctor/<slug>`. Админка закрыта от краулеров, так что на отчёт это не влияет. | Ссылка исправлена. Остальные 404 — нужны URL из отчёта (вероятно, удалённые врачи/клиники/статьи или старые адреса). |
| Заблокировано в robots.txt (3) | Ожидаемо: `login`, `register`, `signup`, `search`, `forgot-password`, `reset-password`, `admin`, `patient`, `?sort=`, `?q=`. | Менять нечего. Добавлен тест: ни один URL из sitemap не закрыт в robots.txt. Если среди 3 URL есть нужный для индекса — разбирать отдельно. |
| Страница с редиректом (2) | `/`→`/ru`, `/blog`, `/authors`, `/doctors` (307), адрес без локали → `/ru/...` (307), `*.vercel.app` → duxtur.org (постоянный). | Норма. Решение владельца ниже. |

**Главный хост: `www.duxtur.org`.** Что известно: (1) в Search Console свойство `https://www.duxtur.org/`, и все 31 URL группы «альтернативная страница» — на www и были просканированы (код 200, не редирект); (2) в коде Telegram-вебхука записано, что www — хост, который «отвечает без редиректа», то есть голый `duxtur.org` перенаправляет (это настройка Vercel, в репозитории её нет); (3) весь код строил canonical на `duxtur.org`. Чего не проверено: ответ голого `duxtur.org` (код и куда ведёт) — из песочницы сайт недоступен.
Решение: один хост — тот, что отвечает 200. Чинить код, а не переводить сайт на голый домен: иначе пришлось бы перерегистрировать Telegram-вебхук и менять домен в BotFather. Сделано: `BASE_URL` в `src/lib/seo.ts` → `https://www.duxtur.org`; тот же хост в `metadataBase` и картинках `layout.tsx`, в `clinics/page.tsx`, в JSON-LD `about` и `editorial` (убран `NEXT_PUBLIC_BASE_URL`, он мог переопределить хост), в редиректе `*.vercel.app` (`next.config.ts`, `middleware.ts`). Тест `canonical-host.test.ts` падает, если в страницах, layout, sitemap, robots, feed, SEO-библиотеках, `next.config.ts` или `middleware.ts` снова появится `https://duxtur.org`.
Не тронуто (работает через редирект, на индексацию не влияет): QR на карточке врача (`DownloadCardButton`), ссылки в письмах (`forgot-password`, `actions/admin.ts` берут `NEXT_PUBLIC_BASE_URL`), список CORS для Edu (там оба хоста).
Вне репозитория (делает владелец): Vercel → Domains → `duxtur.org` → редирект на `www.duxtur.org` с кодом **308** (если стоит 307, Google держит старый адрес дольше); проверить `NEXT_PUBLIC_BASE_URL` в переменных Vercel (должен быть `https://www.duxtur.org` или не задан); в Search Console добавить свойство «Домен» `duxtur.org` (подтверждение через DNS), оно покрывает оба хоста; sitemap отправлять как `https://www.duxtur.org/sitemap.xml`.
Ожидаемо после деплоя: ещё несколько недель в выдаче могут быть оба адреса, группа «альтернативная страница» в свойстве www должна стать пустой.

**Почему так (коротко):**
- Страница специальности теперь читает БД в `generateMetadata`, поэтому на ней стоит `dynamic = 'force-dynamic'`: в CI база пустая, и `noindex` не должен «запечься» при сборке.
- Для `/doctors` пагинация и сортировка по-прежнему не создают отдельный URL: canonical ведёт на первую страницу списка (как и было), чтобы не менять поведение без решения владельца.
- `HomeCategories` ведёт на `/blog/c/<slug>` только для 5 категорий с посадочной страницей; для `ophthalmology`, `surgery`, `gynecology`, `general` оставлен `?category=` — иначе была бы ссылка на 404.

**Нужны решения владельца:**
1. Редирект адреса без локали (`/blog/x` → `/ru/blog/x`) сделать постоянным (308)? Сейчас 307. Плюс: старые адреса без локали склеиваются с русскими. Минус: браузеры кэшируют 308.
2. Чипы специальностей на `/doctors` вести на `/doctors/<специальность>`, а не на `?specialty=`? Лучше для перелинковки, но меняет поведение фильтра (другой шаблон страницы).
3. `/doctors/map` оставить `noindex`, или делать для карты серверный список врачей, чтобы её можно было индексировать?

**Найдено, но не тронуто (отдельные задачи):**
- `new RegExp(sp.city, 'i')` на `/doctors` и `/doctors/[specialty]`: пользовательский ввод идёт в регулярное выражение. `?city=(` даёт 500 (краулеру), плюс риск ReDoS. Нужно экранировать ввод.
- У блога нет пагинации, а `?page=2` отдаёт ту же страницу с `noindex` и canonical на основную: сигналы противоречат друг другу, но вреда нет.
- Версии статьи на языке без перевода: `noindex` вместе с canonical на другой язык, та же пара сигналов.
- Долг `no-explicit-any` в тронутых файлах не разбирал: на уже существовавших строках стоят точечные `eslint-disable`, потому что CI линтит файлы целиком.

**Как проверить после деплоя:**
- `curl -sI https://duxtur.org/ru`: код 308 и `location: https://www.duxtur.org/ru`; `curl -s https://www.duxtur.org/ru | grep canonical`: canonical на www.
- `https://www.duxtur.org/robots.txt`: строка `Sitemap: https://www.duxtur.org/sitemap.xml`.
- `https://duxtur.org/sitemap.xml`: нет `/doctors/map`, нет специальностей без врачей, у специальностей настоящий `lastmod`.
- `/ru/doctors?specialty=cardiology`: canonical → `/ru/doctors/cardiology`, нет hreflang.
- `/ru/doctors/map`: `<meta name="robots" content="noindex, follow">`.
- `/ru/doctors/cardiology` (если врачи есть): без `noindex`, с hreflang.
- `/ru/blog?category=cardiology`: canonical → `/ru/blog/c/cardiology`.
- В Search Console: отчёт «Страницы» → «Проверить исправление» по группам 404, redirect, crawled-not-indexed; счётчики смотреть через 2–4 недели, не раньше.

---
*Last updated: October 2026*
