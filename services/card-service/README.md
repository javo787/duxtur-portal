# duxtur-card-service

Рендерит PDF-визитку врача (2 стороны, 90×50мм) через настоящий HTML/CSS в headless Chrome — вместо `@react-pdf/renderer` в основном приложении.

## Почему отдельный сервис

Первая попытка (май 2026, см. git-историю `duxtur-portal`, коммиты вокруг `363df7f`–`69c9085`) рендерила PDF через Puppeteer + `@sparticuz/chromium` прямо в serverless-функции на Vercel. Это не прижилось — оба пакета были удалены в тот же день. Типичная причина именно этой комбинации на Vercel: серверлес-функция ограничена по размеру/времени выполнения/памяти, а headless Chrome в такие рамки вписывается плохо и нестабильно.

Решение: вынести рендеринг в отдельный always-on сервис (Render/Railway/Fly.io — не serverless), где Chromium — обычный системный процесс без искусственных ограничений. Основное приложение как было на Vercel, так и остаётся; меняется только то, где физически печатается PDF.

Данные сервис не хранит и в базу не ходит — берёт JSON из уже существующего `GET https://duxtur.org/api/doctor/{id}/card?lang={lang}` и просто рендерит HTML в PDF.

## Локальный запуск

```bash
npm install
npm run preview        # → preview-ru.html, открыть в браузере (реальный размер 90×50мм)
```

Полный сервис с Puppeteer локально требует системный Chromium:

```bash
docker build -t duxtur-card-service .
docker run -p 3000:3000 -e DUXTUR_BASE_URL=https://duxtur.org duxtur-card-service
curl http://localhost:3000/card/nuridinov-javokhir?lang=ru -o test.pdf
```

## Деплой на Render

1. Render Dashboard → **New → Blueprint** → выбрать репозиторий `javo787/duxtur-portal` (ветка с этим изменением). Render сам найдёт `render.yaml` в корне репо — он указывает `rootDir: services/card-service`, так что билдится только эта директория.
2. Render создаст сервис автоматически (Docker runtime, план Starter, регион Frankfurt — ближе всего к Душанбе/Ташкенту из доступных Render-регионов).
3. После деплоя Render выдаст URL вида `https://duxtur-card-service.onrender.com`.
4. Прописать этот URL в основном Next.js-приложении на Vercel как переменную окружения `NEXT_PUBLIC_CARD_SERVICE_URL`, затем передеплоить.

Starter-план на Render "засыпает" после 15 минут простоя (холодный старт ~30–50с на следующий запрос). Если это неприемлемо для продакшена — план Standard ($7/мес на момент написания, уточнить в Render Dashboard) держит сервис постоянно тёплым.

## Переменные окружения

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `PORT` | порт сервера | `3000` (Render подставляет сам) |
| `DUXTUR_BASE_URL` | откуда брать данные врача и на что вести QR-код | `https://duxtur.org` |
| `ALLOWED_ORIGINS` | CORS — с каких доменов разрешён запрос | `https://duxtur.org,http://localhost:3000` |
| `CHROMIUM_PATH` | путь к системному Chromium | `/usr/bin/chromium` |

## API

`GET /card/:doctorId?lang=ru` → `application/pdf`, 2 страницы (90×50мм каждая: лицевая + оборотная).
`GET /healthz` → `{ ok: true }`.
