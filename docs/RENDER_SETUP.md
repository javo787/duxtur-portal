# Render: боты и визитки вне Vercel

Что переезжает на Render: **два Telegram-бота** (вебхуки) и **рендер визиток** (PDF/PNG в headless Chrome). Всё остальное (сайт, API, база) остаётся на Vercel. Код сервиса: `services/render-service/`. Логика ботов общая: `src/lib/bots/`; те же функции продолжают работать и в маршрутах Vercel, поэтому откат занимает минуту.

## Главное про деньги

- Сервис создаётся **вручную как Web Service на тарифе Free**. Free не требует карты.
- **Не используйте «New → Blueprint».** Он просит карту, а прежний `render.yaml` был на `plan: starter` ($7/мес): отсюда списания. Файл из корня убран, справочная копия лежит в `services/render-service/render.blueprint.example.yaml`.
- Не путайте с продуктом Render **Workflows**: он платный, нам не нужен.
- Если карту не привязывать, при превышении лимитов Render приостанавливает сервисы, а не списывает деньги.

## Почему один сервис

У Free-воркспейса **750 часов работы в месяц на все сервисы вместе**. Один сервис, который не засыпает, это ~744 часа, то есть почти весь лимит. Поэтому и боты, и визитки живут в **одном** процессе, а пингер будит его только днём (см. ниже). Если в воркспейсе уже есть другой Free-сервис, работающий круглосуточно (например, `study-api`), на двоих часов не хватит и **оба встанут в конце месяца**.

## Шаг 0. Очистка старого (≈10 минут)

1. Render → **Blueprints**: удалите старый Blueprint **и сервисы, которые он создал** (иначе Starter продолжит списывать).
2. **Billing**: убедитесь, что нет платных инстансов. Карту лучше удалить.
3. Запишите, что осталось в воркспейсе (особенно сервисы, которые работают круглосуточно).

## Шаг 1. Создать сервис

Render → **New → Web Service** → *Build and deploy from a Git repository* → репозиторий `javo787/duxtur-portal`:

| Поле | Значение |
|---|---|
| Name | `duxtur-render` (адрес будет `https://duxtur-render.onrender.com`; если имя занято, Render добавит суффикс) |
| Language | **Docker** |
| Branch | `main` |
| Region | Frankfurt (ближе всего к Mongo Atlas и Vercel) |
| Root Directory | **пусто** (образ собирается из корня репозитория) |
| Dockerfile Path | `./services/render-service/Dockerfile` |
| Docker Build Context Directory | `.` |
| Instance Type | **Free** |
| Health Check Path (Advanced) | `/healthz` |
| Auto-Deploy | On Commit |
| Build Filters → Included Paths | `services/render-service/**`, `src/lib/bots/**`, `src/lib/edu-*.ts`, `src/lib/mongodb.ts`, `src/lib/models.ts`, `src/lib/rate-limit.ts`, `src/models/**` |

Included Paths нужны, чтобы коммиты, которые касаются только сайта, не запускали сборку на Render: на Free всего 500 билд-минут в месяц. Названия полей в панели могут немного отличаться.

### Переменные окружения (Environment)

Значения берите из Vercel (Settings → Environment Variables, Production): они **должны совпадать**.

| Переменная | Обязательна | Зачем |
|---|---|---|
| `MONGODB_URI` | да | вход через бота и записи. Без неё процесс **намеренно не стартует** |
| `EDU_TELEGRAM_BOT_TOKEN`, `EDU_TELEGRAM_BOT_SECRET` | да | бот входа (@duxtur_bot) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_SECRET` | да | админский/врачебный бот |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | желательно | общий лимитер запросов; без них лимит считается в памяти инстанса |
| `DUXTUR_BASE_URL` | нет | откуда брать данные врача для визитки. По умолчанию `https://www.duxtur.org` |
| `ALLOWED_ORIGINS` | нет | кому разрешён CORS. По умолчанию `https://www.duxtur.org`, `https://duxtur.org`, `http://localhost:3000` |

Firebase-ключи Render **не нужны**: токен входа выдаёт Vercel. MongoDB Atlas: в *Network Access* должен быть `0.0.0.0/0` (как для Vercel), иначе Render не достучится до базы.

После **Create Web Service** дождитесь *Live* (первая сборка 5-10 минут) и проверьте:

```
curl https://duxtur-render.onrender.com/healthz
# {"ok":true,"uptimeSec":...}

curl -i -X POST https://duxtur-render.onrender.com/telegram/edu -H 'content-type: application/json' -d '{}'
# HTTP/2 401   (без секрета Telegram запрос отклоняется: так и должно быть)
```

## Шаг 2. Не давать сервису спать днём (пингер)

Free-сервис засыпает через 15 минут без запросов и просыпается около минуты: для бота входа это долго. Нужен внешний пингер, который раз в 10 минут дёргает `/healthz`.

**Рекомендуется cron-job.org** (бесплатно, без карты): *Create cronjob* → URL `https://duxtur-render.onrender.com/healthz` → расписание **каждые 10 минут с 07:00 до 22:50** (в настройках аккаунта часовой пояс `Asia/Dushanbe`) → Save.

Ночью сервис засыпает, а утром первый запрос его будит. Расчёт часов: 16 ч × 31 дн ≈ 500 + «хвосты» и ночные пробуждения ≈ 550 из 750.

Не пингуйте из GitHub Actions: репозиторий приватный (2000 минут в месяц), а расписание GitHub к тому же запаздывает на 10-15 минут. UptimeRobot проверяет раз в 5 минут круглосуточно: это ~744 часа, весь лимит.

Дополнительно сайт сам будит сервис, когда на странице врача появляется кнопка «Скачать визитку».

## Шаг 3. Визитки

В Vercel → Environment Variables (Production): `NEXT_PUBLIC_CARD_SERVICE_URL=https://duxtur-render.onrender.com` → **Redeploy** (переменная `NEXT_PUBLIC_` вшивается при сборке, без нового деплоя она не подействует). Тот же домен автоматически попадает в CSP `connect-src`.

Проверка: страница врача → «Скачать визитку». Если сервис недоступен, PDF создаётся в браузере (как раньше); для формата «картинка» показывается сообщение «сервис просыпается».

Откат: удалите переменную и сделайте redeploy.

## Шаг 4. Переключить ботов

Делайте по одному боту, сначала логин-бот. Вебхуки на Vercel остаются рабочими: это ваш откат.

**4.1.** В Vercel добавьте `EDU_BOT_WEBHOOK_URL=https://duxtur-render.onrender.com/telegram/edu` и сделайте redeploy. Так диагностика `/api/edu-auth/telegram/health` перестанет считать новый адрес ошибкой.

**4.2. Бот входа:**

```
curl -X POST "https://api.telegram.org/bot<EDU_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://duxtur-render.onrender.com/telegram/edu" \
  -d "secret_token=<EDU_TELEGRAM_BOT_SECRET>"
```

**4.3. Админский бот:** секрет здесь передаётся **только заголовком** `secret_token` (в URL его нет: он попал бы в логи Render):

```
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://duxtur-render.onrender.com/telegram/admin" \
  -d "secret_token=<TELEGRAM_BOT_SECRET>"
```

**4.4. Проверка.** Откройте сайт → «Войти через Telegram» → подтвердите в боте: вход должен пройти. Затем `getWebhookInfo` по каждому боту: `url` новый, `last_error_message` пусто, `pending_update_count` близко к 0:

```
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

В Render → Logs видны строки `webhook:received` и `webhook:start-login` с `host`/`reqId`.

### Откат за минуту

```
curl -X POST "https://api.telegram.org/bot<EDU_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://www.duxtur.org/api/edu-auth/telegram/webhook" -d "secret_token=<EDU_TELEGRAM_BOT_SECRET>"
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://www.duxtur.org/api/telegram/webhook" -d "secret_token=<TELEGRAM_BOT_SECRET>"
```

И удалите `EDU_BOT_WEBHOOK_URL` в Vercel. Адрес именно `www.duxtur.org`: Telegram не следует редиректам.

Telegram хранит необработанные сообщения до суток и повторяет доставку, поэтому кратковременная недоступность Render сообщений не теряет.

## Если что-то не так

| Симптом | Причина |
|---|---|
| Деплой падает, в логах `Please define the MONGODB_URI` | не задана `MONGODB_URI` в Environment |
| В логах `MongooseServerSelectionError` | в Atlas Network Access нет `0.0.0.0/0` |
| Бот не отвечает, `getWebhookInfo` показывает 401 | `secret_token` в `setWebhook` не совпадает с секретом в Render |
| Бот отвечает через минуту после паузы | сервис спал: проверьте пингер |
| Визитка: «сервис просыпается» / браузерный PDF вместо серверного | сервис спал или занят (одна визитка за раз); повторите через минуту |
| Сервис перезапускается при визитках (в логах OOM) | 512 МБ и 0.1 CPU для Chrome на Free впритык. Варианты: оставить браузерный PDF, либо платный Starter, но это решение за вами |
| 750 часов исчерпаны | все Free-сервисы воркспейса приостановлены до 1-го числа: сократите окно пингера или уберите второй сервис |

## Ограничения Free, о которых стоит знать

Render сам пишет, что Free не предназначен для продакшена: инстанс могут перезапустить в любой момент, он спит, а CPU мизерный. Для бота входа это приемлемо благодаря повторной доставке Telegram и пингеру. Если нужна надёжность без пингера и сна, это платный тариф.
