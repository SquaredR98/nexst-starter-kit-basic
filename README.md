# Auth Starter Kit - Full Stack Authentication System

A production-ready, modular authentication and authorization system built with NestJS, Next.js, TypeORM, PostgreSQL, and Redis.

## 🎯 Features (Basic Tier)

### Authentication
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ Password authentication with Argon2/Bcrypt
- ✅ Email verification
- ✅ Password reset flow
- ✅ Account lockout after failed attempts
- ✅ Session management with device tracking
- ✅ OAuth 2.0 (Google, GitHub)
- ✅ Two-Factor Authentication (TOTP/Authenticator apps)

### Authorization
- ✅ Role-Based Access Control (RBAC)
- ✅ Permission-based authorization
- ✅ Protected routes and API endpoints

### Security
- ✅ Password hashing (Argon2id/Bcrypt)
- ✅ Brute force protection
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Password history tracking

---

## 📦 Monorepo Structure

```
auth-starter-kit/
├── apps/
│   ├── backend/              # NestJS API
│   └── web/                  # Next.js Frontend
├── packages/
│   └── types/                # Shared TypeScript types
├── deployment/
│   └── docker/               # Docker configurations
└── docs/                     # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 9+ (`npm install -g pnpm`)
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env

# 3. Start Docker services
cd deployment/docker && docker-compose up -d && cd ../..

# 4. Run migrations
pnpm db:migrate

# 5. Start development
pnpm dev
```

**Access:**
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## 📜 Available Scripts

```bash
pnpm dev              # Run all apps
pnpm backend:dev      # Backend only
pnpm web:dev          # Frontend only
pnpm build            # Build all
pnpm db:migrate       # Run migrations
pnpm test             # Run tests
pnpm lint             # Lint code
```

---

## 📚 Documentation

- [Getting Started](./docs/guides/getting-started.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Configuration](./docs/CONFIGURATION.md)
- [Tier Strategy](./docs/TIER-STRATEGY.md)

---

## 🛠️ Tech Stack

**Backend:** NestJS • TypeORM • PostgreSQL • Redis • Passport.js
**Frontend:** Next.js 15 • React • Tailwind CSS • TypeScript
**DevOps:** Turborepo • pnpm • Docker

---

## 📝 License

MIT License

**Version:** 1.0.0 (Basic Tier)
**Last Updated:** 2024-12-20
