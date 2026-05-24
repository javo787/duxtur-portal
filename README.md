# duxtur-portal

> A Next.js 16 portal application built with TypeScript, React 19, and MongoDB

## 🎯 Overview

**duxtur-portal** is a full-stack web application featuring:
- 🔐 Authentication & Authorization (NextAuth v5)
- 🗺️ Interactive Maps (Leaflet with clustering)
- 📄 PDF Generation & Export
- 🤖 AI Integration (Google Generative AI)
- 🎨 Modern UI (Tailwind CSS + Radix UI)
- 📊 Data Management (MongoDB)
- 🚀 Deployment (Vercel)

**Live Demo:** https://duxtur-portal.vercel.app

---

## 📋 Prerequisites

- Node.js 18+ (recommended: 20.x LTS)
- npm 9+ or pnpm 8+
- MongoDB 5.0+ (Atlas or local instance)
- Git

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/javo787/duxtur-portal.git
cd duxtur-portal
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- MongoDB connection string
- NextAuth secret
- API keys (Google AI, Cloudinary, Resend, etc.)

### 4. Database Setup

```bash
# Create MongoDB indexes
npx tsx src/scripts/create-indexes.ts
```

### 5. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
duxtur-portal/
├── src/
│   ├── app/                 # Next.js 16 app directory
│   │   ├── api/            # API routes
│   │   ├── (auth)/         # Auth routes group
│   │   ├── (main)/         # Main app routes group
│   │   └── layout.tsx
│   ├── components/          # React components
│   │   ├── common/         # Shared components
│   │   ├── forms/          # Form components
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & helpers
│   │   ├── auth.ts         # NextAuth config
│   │   ├── db.ts           # MongoDB connection
│   │   └── api-client.ts   # API client
│   ├── types/              # TypeScript types
│   ├── styles/             # Global styles
│   └── scripts/            # Utility scripts
├── public/                 # Static assets
├── next.config.js          # Next.js config
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── .eslintrc.json          # ESLint config
├── .prettierrc.json        # Prettier config
├── package.json            # Project metadata
└── OPTIMIZATION_PLAN.md    # Performance roadmap
```

---

## 🛠️ Available Scripts

### Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
```

### Quality & Maintenance

```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
npm run format       # Code formatting (Prettier)
npm run analyze      # Bundle analysis
```

### Database

```bash
npx tsx src/scripts/create-indexes.ts    # Create MongoDB indexes
npx tsx src/scripts/seed-data.ts         # Seed sample data (if exists)
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `MONGODB_DB` | ✅ | Database name |
| `AUTH_SECRET` | ✅ | NextAuth secret (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Application URL |
| `RESEND_API_KEY` | ✅ | Email service API key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | ✅ | Google Generative AI key |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Error tracking (optional) |
| `REDIS_URL` | ❌ | Redis cache (optional, Phase 4) |

Full documentation: [`.env.example`](.env.example)

---

## 🔐 Authentication

Uses **NextAuth v5** with MongoDB adapter.

### Supported Providers

- Email/Password
- Google OAuth
- GitHub OAuth (configurable)

### Session Management

- JWT-based sessions
- MongoDB session storage
- Automatic session refresh

---

## 📚 Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.1 | React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Mongoose | 9.1.3 | MongoDB ORM |
| NextAuth | 5.0.0-beta | Authentication |
| Leaflet | 1.9.4 | Maps |
| Framer Motion | 12.38.0 | Animations |
| React PDF | 4.5.1 | PDF export |

---

## 🎨 UI Components

Built with **Radix UI** primitives and **Tailwind CSS**:

- Forms with validation
- Data tables
- Modals & dialogs
- Toast notifications
- Loading states
- Error boundaries

---

## 🗺️ Maps Integration

Uses **Leaflet** + **React Leaflet**:

```typescript
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

export default function Map() {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[51.5, -0.09]} />
    </MapContainer>
  );
}
```

---

## 📄 PDF Generation

Uses **React PDF** + **html2canvas**:

```typescript
import { Document, Page, Text } from '@react-pdf/renderer';

const MyDocument = () => (
  <Document>
    <Page>
      <Text>Hello PDF!</Text>
    </Page>
  </Document>
);
```

---

## 🤖 AI Integration

Uses **Google Generative AI**:

```typescript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
const response = await client.generateText({ prompt: "..." });
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

```bash
vercel --prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Performance

See [**OPTIMIZATION_PLAN.md**](OPTIMIZATION_PLAN.md) for comprehensive performance roadmap.

### Current Metrics

- Lighthouse Score: ~65/100
- Bundle Size: ~250KB (gzipped)
- First Contentful Paint: ~2.5s
- Largest Contentful Paint: ~3.2s

### Target Metrics (Post-Optimization)

- Lighthouse Score: 85+/100
- Bundle Size: ~120KB (gzipped)
- First Contentful Paint: ~1.2s
- Largest Contentful Paint: ~1.8s

---

## 🔒 Security

- ✅ NextAuth for authentication
- ✅ HTTPS only (Vercel managed)
- ✅ CORS configured
- ✅ CSP headers enabled
- ✅ Input validation
- ✅ XSS protection
- ✅ CSRF tokens

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Test connection
npx tsx src/lib/db.ts
```

### Build Fails with TypeScript Errors

```bash
npm run type-check  # Identify issues
npm run format      # Auto-fix formatting
```

### Environment Variables Not Loading

```bash
# Ensure .env.local exists in project root
cp .env.example .env.local

# Restart dev server
npm run dev
```

---

## 📝 Code Quality

### ESLint

```bash
npm run lint
npm run lint -- --fix  # Auto-fix
```

### Prettier

```bash
npm run format
```

### Type Checking

```bash
npm run type-check
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m "feat: add amazing feature"`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## 📄 License

This project is unlicensed. See [LICENSE](LICENSE) for details.

---

## 👤 Author

**javo787**
- GitHub: [@javo787](https://github.com/javo787)

---

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [MongoDB Documentation](https://docs.mongodb.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js](https://next-auth.js.org)

---

## 📞 Support

For issues and questions:
- 🐛 Report bugs: [GitHub Issues](https://github.com/javo787/duxtur-portal/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/javo787/duxtur-portal/discussions)

---

**Status:** 🟢 Active Development  
**Last Updated:** 2026-05-24  
**Version:** 0.1.0
