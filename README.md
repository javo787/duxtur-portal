# 🏥 Duxtur.org — Medical Portal

> **Верифицированная медицинская платформа для Центральной Азии**
>
> Многоязычный портал с инструментами для публикации проверенных врачами статей, профилей докторов, записи к врачам и управления клиниками.

[![Live](https://img.shields.io/badge/Live-duxtur.org-blue)](https://duxtur.org) 
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/) 
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) 
[![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248)](https://www.mongodb.com/) 
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Содержание

- [Обзор](#обзор)
- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Установка и настройка](#установка-и-настройка)
- [База данных](#база-данных)
- [API маршруты](#api-маршруты)
- [Аутентификация](#аутентификация)
- [Структура проекта](#структура-проекта)
- [Поддерживаемые языки](#поддерживаемые-языки)
- [Развертывание](#развертывание)
- [Контрибьютинг](#контрибьютинг)

---

## 🎯 Обзор

**Duxtur.org** — это платформа для:

- **Врачей**: размещение профилей, управление расписанием, прием пациентов, публикация медицинских статей
- **Пациентов**: поиск врачей, запись на прием, доступ к проверенным медицинским статьям
- **Клиник**: управление врачами, аналитика, профиль клиники на портале
- **Администраторов**: модерация контента, управление пользователями, аналитика платформы

### ✨ Ключевые особенности

| Функция | Описание |
|---------|---------|
| 🌍 **5 языков** | Русский, Узбекский, Таджикский, Казахский, Кыргызский |
| 🔍 **Полнотекстовый поиск** | MongoDB text indexes для быстрого поиска врачей и статей |
| 📍 **Геолокация** | Карты Leaflet с кластеризацией врачей по городам |
| 📅 **Система записей** | Управление расписанием врачей, различные типы консультаций |
| ✅ **E-E-A-T верификация** | Проверка статей по Google E-E-A-T критериям |
| 🤖 **AI помощник** | Claude AI для админов, Gemini для генерации контента |
| 📱 **Рецепты и PDF** | Генерация рецептов, визиток, конвертация в PDF |
| 💬 **Telegram интеграция** | Уведомления о записях через Telegram бот |
| 🎨 **Персонализация** | Врачи могут кастомизировать свои визитки и профили |

---

## 💻 Стек технологий

### Frontend
- **Next.js 16** — React фреймворк, SSR/SSG, App Router
- **React 19** — UI библиотека
- **TypeScript 5** — типизация
- **TailwindCSS 4** — утилит-based CSS
- **Framer Motion** — анимации
- **React Leaflet** — карты (Leaflet + маркер-кластеры)
- **React-PDF/html2canvas** — экспорт в PDF

### Backend
- **Next.js API Routes** — REST API
- **MongoDB + Mongoose** — база данных
- **NextAuth v5** — аутентификация (credentials + Google OAuth)
- **Resend** — Email доставка

### AI & External Services
- **Claude 3.5 Sonnet** (Anthropic) — AI помощник для администраторов
- **Google Gemini** — генерация медицинского контента
- **Cloudinary** — облачное хранилище изображений
- **Telegram Bot API** — push-уведомления

### DevOps
- **Vercel** — хостинг и CI/CD
- **ESLint** — линтинг кода
- **Next.js Image Optimization** — оптимизация картинок

---

## 🏗️ Архитектура

### Слои приложения

```
┌─────────────────────────────────────┐
│   Frontend (Next.js App Router)     │
│  ├─ [lang]/page.tsx (Home)          │
│  ├─ [lang]/doctors/[slug]           │
│  ├─ [lang]/blog/[slug]              │
│  ├─ [lang]/admin/*                  │
│  └─ [lang]/clinic/admin/*           │
├─────────────────────────────────────┤
│   API Routes (/api/*)               │
│  ├─ /auth/* (NextAuth)              │
│  ├─ /doctor/* (профили)             │
│  ├─ /articles/* (статьи)            │
│  ├─ /appointments/* (записи)        │
│  └─ /admin/* (управление)           │
├─────────────────────────────────────┤
│   Middleware & Services             │
│  ├─ Authentication (NextAuth)       │
│  ├─ Database (Mongoose)             │
│  ├─ File Storage (Cloudinary)       │
│  └─ Email (Resend)                  │
├─────────────────────────────────────┤
│   Database (MongoDB)                │
│  ├─ User (аккаунты)                 │
│  ├─ Doctor (профили врачей)         │
│  ├─ Article (статьи)                │
│  ├─ Appointment (записи)            │
│  ├─ Clinic (клиники)                │
│  ├─ Review (рецензии)               │
│  ├─ ViewLog (аналитика)             │
│  └─ RefreshToken (сессии)           │
└─────────────────────────────────────┘
```

### Модели данных

#### User
```typescript
{
  email: string,           // Уникальный
  password: string,        // Хеш bcrypt
  role: 'doctor' | 'portal_admin' | 'patient' | 'clinic',
  name: string,
  image: string,           // URL аватарки
  provider: 'credentials' | 'google' | 'resend',
  resetPasswordToken?: string,
  resetPasswordExpires?: Date,
}
```

#### Doctor
```typescript
{
  userId: ObjectId,        // Связь с User
  name: string,
  specialty: { ru, uz, tg, kk, ky },  // Мультиязычные поля
  experience: number,      // Лет опыта
  phone: string,
  bio: { ru, uz, ... },
  city: string,
  coordinates: GeoPoint,   // Для геолокации
  image: string,           // URL фото
  status: 'pending' | 'approved' | 'rejected' | 'banned',
  
  // Консультации
  consultationTypes: ['in_person' | 'online' | 'home_visit'][],
  schedule: {              // День недели
    mon: { open: '09:00', close: '18:00', isWorking: true },
    // ...
  },
  
  // Соцсети
  telegram: string,        // Ник или ID
  instagram: string,
  whatsapp: string,
  
  // Статистика
  reviewCount: number,
  reviewAvg: number,
  profileViews: number,
  
  // Визитка врача (кастомизация)
  accentColor: string,     // Цвет темы
  cardTheme: 'dark' | 'light',
  
  verificationLevel: 'basic' | 'verified' | 'premium',
}
```

#### Article
```typescript
{
  slug: string,            // URL-friendly
  title: { ru, uz, tg, kk, ky },
  overview: { ru, uz, ... },
  symptoms: { ru, uz, ... },
  causes: { ru, uz, ... },
  diagnosis_treatment: { ru, uz, ... },
  prevention: { ru, uz, ... },
  
  // Дополнительные секции
  section1_title: { ru, uz, ... },
  section1_content: { ru, uz, ... },
  // ... (section2 - section5)
  
  category: 'cardiology' | 'neurology' | 'dentistry' | ... | 'general',
  
  authorId: ObjectId,      // Врач-автор
  image: string,           // Cover image
  
  // E-E-A-T
  aiGenerated: boolean,
  isVerified: boolean,
  reviewedBy: string,
  reviewedAt: Date,
  lastMedicalReview: Date,
  
  // Статистика
  views: number,
  ratingSum: number,
  ratingCount: number,
  likesUp: number,
  likesDown: number,
  
  references: string[],    // Ссылки на источники
}
```

#### Appointment
```typescript
{
  doctorId: ObjectId,
  patientId: ObjectId,
  patientName: string,
  patientPhone: string,
  patientEmail: string,
  date: Date,
  timeSlot: string,        // "09:00"
  type: 'in_person' | 'online' | 'home_visit',
  notes: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
}
```

---

## 🚀 Установка и настройка

### Требования

- **Node.js**: 18+
- **npm/pnpm/yarn**: последние версии
- **MongoDB**: 5.0+ (локально или Atlas)
- **Переменные окружения** (см. ниже)

### 1️⃣ Клонирование репозитория

```bash
git clone https://github.com/javo787/duxtur-portal.git
cd duxtur-portal
```

### 2️⃣ Установка зависимостей

```bash
npm install
# или
pnpm install
```

### 3️⃣ Настройка окружения

Создайте файл `.env.local` в корне проекта:

```env
# ─────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/duxtur?retryWrites=true&w=majority

# ─────────────────────────────────────────
# NEXTAUTH
# ─────────────────────────────────────────
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_SECRET=your-google-client-secret

# ─────────────────────────────────────────
# EMAIL & NOTIFICATIONS
# ─────────────────────────────────────────
RESEND_API_KEY=re_your_resend_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_SECRET=random-secret-for-webhook-validation
TELEGRAM_ADMIN_CHAT_ID=123456789

# ─────────────────────────────────────────
# AI & EXTERNAL SERVICES
# ─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_GEMINI_API_KEY=your-google-gemini-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─────────────────────────────────────────
# APP CONFIG
# ─────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 4️⃣ Запуск в режиме разработки

```bash
npm run dev
```

Откройте http://localhost:3000 в браузере.

---

## 📊 База данных

### Создание текстовых индексов

Для корректной работы поиска нужно создать MongoDB text indexes:

```bash
npx tsx src/scripts/create-indexes.ts
```

Или вручную через MongoDB:

```javascript
// Doctors search index
db.doctors.createIndex({
  name: "text",
  "specialty.ru": "text",
  city: "text"
});

// Articles search index
db.articles.createIndex({
  "title.ru": "text",
  "title.uz": "text",
  "overview.ru": "text",
  "overview.uz": "text"
  // ... остальные языки
});

// Geo index for coordinates
db.doctors.createIndex({ "coordinates.coordinates": "2dsphere" });
```

### Инициализация данных

```bash
# Если нужно заполнить начальные данные
npm run seed
```

---

## 🔌 API маршруты

### Аутентификация

| Метод | Маршрут | Описание |
|-------|---------|---------|
| POST | `/api/auth/register` | Регистрация пользователя |
| POST | `/api/auth/forgot-password` | Запрос на восстановление пароля |
| POST | `/api/auth/reset-password` | Сброс пароля по токену |
| GET | `/api/auth/callback/google` | Google OAuth callback |
| POST | `/api/auth/signout` | Выход из системы |

### Врачи

| Метод | Маршрут | Описание |
|-------|---------|---------|
| GET | `/api/doctor/search` | Поиск врачей (полнотекстовый) |
| GET | `/api/doctor/[slug]` | Получить профиль врача |
| POST | `/api/doctor/register` | Регистрация врача (требует документы) |
| GET | `/api/doctor/schedule?doctorId=X&date=YYYY-MM-DD` | Доступные слоты врача |
| PATCH | `/api/doctor/[id]` | Обновить профиль врача (авторизация) |
| GET | `/api/doctor/map` | Получить координаты врачей для карты |

### Статьи

| Метод | Маршрут | Описание |
|-------|---------|---------|
| GET | `/api/articles/search` | Поиск статей |
| GET | `/api/articles/[slug]` | Получить статью |
| POST | `/api/articles` | Создать статью (авторизованный врач) |
| PATCH | `/api/articles/[id]` | Обновить статью |
| POST | `/api/articles/[id]/rate` | Оценить статью (1-5 звезд) |
| GET | `/api/articles/category/[category]` | Статьи по категории |

### Записи на приём

| Метод | Маршрут | Описание |
|-------|---------|---------|
| POST | `/api/appointments` | Создать запись (авторизованный пациент) |
| GET | `/api/appointments` | Получить мои записи |
| PATCH | `/api/appointments/[id]` | Обновить запись |
| DELETE | `/api/appointments/[id]` | Отменить запись |
| GET | `/api/appointments/doctor/[doctorId]` | Записи врача на день |

### Админ панель

| Метод | Маршрут | Описание |
|-------|---------|---------|
| POST | `/api/admin/approve-doctor` | Одобрить врача (admin_portal) |
| GET | `/api/admin/doctors` | Список врачей на модерацию |
| POST | `/api/admin/chat` | AI помощник (Anthropic Claude) |
| GET | `/api/admin/analytics` | Статистика платформы |

### Клиники

| Метод | Маршрут | Описание |
|-------|---------|---------|
| GET | `/api/clinic/[id]` | Профиль клиники |
| PATCH | `/api/clinic/[id]` | Обновить профиль клиники (авторизация) |
| POST | `/api/clinic/[id]/doctors` | Добавить врача в клинику |

---

## 🔐 Аутентификация

### NextAuth v5 Beta

Приложение использует **NextAuth v5 (beta 31)** с поддержкой:

- **Credentials** (Email + пароль)
- **Google OAuth** (через Google Console)
- **JWT сессии** (30 дней)

### Роли пользователей

```typescript
type Role = 'patient' | 'doctor' | 'portal_admin' | 'clinic';
```

**Доступ по ролям:**

| Роль | Доступ |
|------|---------|
| `patient` | Запись на прием, просмотр профилей, рейтинги |
| `doctor` | Свой профиль, расписание, статьи, записи пациентов |
| `portal_admin` | Модерация врачей, контента, AI помощник, аналитика |
| `clinic` | Управление врачами клиники, аналитика клиники |

### Middleware авторизации

```typescript
// src/auth.config.ts
// Защита маршрутов через callbacks.authorized()
if (pathname.includes('/admin/portal')) {
  if (!isLoggedIn || role !== 'portal_admin') {
    return Response.redirect(new URL(`/${lang}/login`, nextUrl));
  }
}
```

---

## 🌍 Поддерживаемые языки

| Код | Язык | Статус |
|-----|------|---------|
| `ru` | Русский | ✅ Основной |
| `uz` | Узбекский | ✅ Полный |
| `tg` | Таджикский | ✅ Полный |
| `kk` | Казахский | ✅ Полный |
| `ky` | Кыргызский | ✅ Полный |

**Локализация:**

- i18n хранится в `/src/i18n/locales/`
- Мультиязычные поля в моделях: `{ ru: string, uz: string, ... }`
- Маршруты приложения: `/[lang]/...`
- Fallback на русский, если перевода нет

---

## 📁 Структура проекта

```
duxtur-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lang]/             # Динамические маршруты по языку
│   │   │   ├── page.tsx        # Главная страница
│   │   │   ├── doctors/        # Профили врачей
│   │   │   ├── blog/           # Статьи
│   │   │   ├── admin/          # Admin панель
│   │   │   └── clinic/         # Панель клиники
│   │   ├── api/                # REST API
│   │   │   ├── auth/           # Аутентификация
│   │   │   ├── doctor/         # Врачи
│   │   │   ├── articles/       # Статьи
│   │   │   ├── appointments/   # Записи
│   │   │   ├── admin/          # Админ функции
│   │   │   └── telegram/       # Telegram webhook
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Глобальные стили
│   │
│   ├── components/             # React компоненты
│   │   ├── BookingModal.tsx    # Модаль записи на прием
│   │   ├── DoctorCard.tsx      # Карточка врача
│   │   ├── Map.tsx             # Карта Leaflet
│   │   └── ...
│   │
│   ├── models/                 # Mongoose модели
│   │   ├── User.ts
│   │   ├── Doctor.ts
│   │   ├── Article.ts
│   │   ├── Appointment.ts
│   │   ├── Clinic.ts
│   │   ├── Review.ts
│   │   └── ViewLog.ts
│   │
│   ├── lib/                    # Утилиты и хелперы
│   │   ├── mongodb.ts          # Подключение BD
│   │   ├── seo.ts              # SEO функции
│   │   ├── telegram.ts         # Telegram интеграция
│   │   └── utils.ts            # Общие утилиты
│   │
│   ├── i18n/                   # Интернационализация
│   │   ├── locales/
│   │   │   ├── ru.ts
│   │   │   ├── uz.ts
│   │   │   ├── tg.ts
│   │   │   ├── kk.ts
│   │   │   └── ky.ts
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── auth.config.ts          # NextAuth конфигурация
│   ├── auth.ts                 # NextAuth инстанс
│   └── middleware.ts           # Next.js middleware
│
├── public/                     # Статические файлы
├── scripts/                    # Утилиты (create-indexes.ts, seed.ts)
├── package.json
├── tsconfig.json
├── next.config.ts              # Next.js конфигурация
├── tailwind.config.ts          # TailwindCSS конфигурация
└── README.md
```

---

## 🚢 Развертывание

### На Vercel (рекомендуется)

1. Сделайте fork репозитория на GitHub
2. Подключите к Vercel: https://vercel.com/new
3. Установите env переменные в **Settings → Environment Variables**
4. Нажмите **Deploy**

```bash
# Или через Vercel CLI
vercel deploy
```

### На собственном сервере (Node.js)

```bash
# Build
npm run build

# Start
npm run start

# Или с PM2
pm2 start npm --name duxtur -- start
```

### Docker (опционально)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📈 Развитие и SEO

### Оптимизация для поисковых машин

- ✅ **Dynamic sitemap**: `/sitemap.xml` генерируется автоматически
- ✅ **RSS feed**: `/[lang]/feed.xml` для подписки на статьи
- ✅ **Hreflang tags**: Для мультиязычности
- ✅ **Schema.org**: MedicalWebPage, LocalBusiness, FAQPage JSON-LD
- ✅ **ISR (Incremental Static Regeneration)**: Главная обновляется каждый час
- ✅ **Open Graph**: Превью в соцсетях

### Кэширование

- Статические ресурсы: `max-age=31536000` (1 год)
- Статьи блога: `s-maxage=21600` (6 часов) + `stale-while-revalidate=86400` (1 день)
- Главная: ISR каждый час

---

## 🤝 Контрибьютинг

Мы приветствуем вклады! Пожалуйста:

1. Создайте fork репозитория
2. Создайте ветку: `git checkout -b feature/amazing-feature`
3. Коммитьте изменения: `git commit -m 'Add amazing feature'`
4. Сделайте push: `git push origin feature/amazing-feature`
5. Откройте Pull Request

### Гайдлайны

- Используйте TypeScript
- Следуйте ESLint правилам: `npm run lint`
- Добавьте описание в PR
- Тестируйте локально перед отправкой

---

## 📞 Поддержка и контакты

- 🌐 **Сайт**: https://duxtur.org
- 📧 **Email**: contact@duxtur.org
- 💬 **Telegram**: [@duxtur_bot](https://t.me/duxtur_bot)
- 🐛 **Issues**: https://github.com/javo787/duxtur-portal/issues

---

## 📄 Лицензия

Этот проект лицензирован под MIT License — см. файл [LICENSE](LICENSE) для деталей.

---

## 🙏 Благодарности

Спасибо за использование Duxtur.org! Спасибо всем врачам, которые помогают просвещению о здоровье на Центральной Азии.

---

**Made with ❤️ for Central Asia** | Updated: May 2026
