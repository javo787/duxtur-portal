# duxtur-render-service

Always-on сервис на Render: вебхуки двух Telegram-ботов и рендер PDF/PNG-визиток врачей в headless Chrome. Деплой и настройка: **[docs/RENDER_SETUP.md](../../docs/RENDER_SETUP.md)**.

## Эндпоинты

| Путь | Что делает |
|---|---|
| `GET /healthz` | лёгкая проверка (без БД и Chrome): её дёргает пингер |
| `POST /telegram/edu` | вебхук бота входа (@duxtur_bot), та же логика, что `api/edu-auth/telegram/webhook` на Vercel |
| `POST /telegram/admin` | вебхук админского/врачебного бота, та же логика, что `api/telegram/webhook` |
| `GET /card/:slug?lang=ru&format=pdf\|image` | визитка; один рендер за раз, лишние запросы получают 503 |
| `GET /warm` | заранее запускает Chrome (его закрывает таймер простоя) |

Логика ботов лежит в `src/lib/bots/` корневого проекта и подключается при сборке (`build.mjs`, esbuild). Сборка падает, если общий код начнёт импортировать пакет, которого нет в `package.json` сервиса.

## Локально

```bash
npm ci
npm run typecheck && npm run build && npm run smoke   # smoke поднимает собранный бандл и проверяет секреты, CORS, 404
npm run preview                                       # HTML визиток для просмотра без Chrome
```

Docker (контекст сборки это **корень репозитория**):

```bash
docker build -f services/render-service/Dockerfile -t duxtur-render .
docker run -p 3000:3000 -e MONGODB_URI=... duxtur-render
```

Тесты логики (`src/http.ts`, `src/card.ts`) запускаются из корня: `npm test`.
