# AGENTS.md — Habit Tracker Couple

This file provides operational guidance, architecture overview, and verified workflows for AI coding agents working in this repository.

---

## 1. Project Overview

**Habit Pasutri (Couple Habit Tracker)** is a collaborative habit-tracking application designed for couples. It features daily habit tracking, streaks, shared progress visualization, celebratory animations, and analytics.

The repository is organized as a lightweight monorepo containing a TypeScript Express backend and a React/Vite frontend.

---

## 2. Technology Stack & Tooling

| Component | Technology | Details |
|---|---|---|
| **Package Manager** | `pnpm` (v11+) | Workspace/multi-directory orchestration |
| **Backend** | Node.js + Express 4 | TypeScript (`tsc`), `tsx` runner, Zod validation |
| **Database** | MySQL / PostgreSQL / Neon | Multi-provider support via `mysql2`, `pg`, `@neondatabase/serverless` |
| **Auth** | JWT + Cookie | `jsonwebtoken`, `cookie-parser`, `bcryptjs` |
| **Frontend** | React 18 + Vite 5 | TypeScript, Tailwind CSS, TanStack Router & Query |
| **Frontend UI/State** | Radix UI + Zustand | `lucide-react`, `dayjs`, `recharts`, `canvas-confetti`, Vite PWA |
| **Linting** | ESLint 9 (Flat Config) | TypeScript-ESLint, React Hooks, React Refresh |

---

## 3. Verified Commands

All commands below have been tested and verified to work:

### Development
```bash
# Start both backend and frontend concurrently
pnpm dev

# Start backend dev server only (port 1906, tsx watch)
pnpm --dir backend dev

# Start frontend dev server only (port 5173, Vite HMR)
pnpm --dir frontend dev
```

### Build
```bash
# Build both backend and frontend in sequence
pnpm build

# Build backend only (tsc -> dist/)
pnpm --dir backend build

# Build frontend only (tsc & vite build -> dist/)
pnpm --dir frontend build
```

### Database Operations
```bash
# Run database migrations
pnpm db:migrate
# Or directly in backend:
pnpm --dir backend db:migrate

# Seed sample/initial database data
pnpm db:seed
# Or directly in backend:
pnpm --dir backend db:seed
```

### Linting
```bash
# Run ESLint on frontend code
pnpm --dir frontend lint
```

---

## 4. Key Directory Structure

```text
habbit-tracker-couple/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # Database pool (MySQL/Postgres) & env parsing
│   │   ├── controllers/      # Route request handlers
│   │   ├── middleware/       # Auth (JWT) & error handling middleware
│   │   ├── migrations/       # Schema definitions and seed scripts
│   │   ├── routes/           # Express router definitions
│   │   ├── services/         # Business logic layer
│   │   └── app.ts & index.ts # App setup and server listener
│   ├── .env                  # Backend local environment config
│   └── package.json
├── frontend/                 # React single-page app
│   ├── src/
│   │   ├── components/       # UI components (Radix primitives, habit cards, charts)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── routes/           # TanStack router routes
│   │   ├── store/            # Zustand global stores
│   │   └── services/         # Axios API clients
│   ├── vite.config.ts        # Vite configuration + API proxy
│   ├── eslint.config.js      # ESLint 9 flat config
│   └── package.json
├── scripts/                  # Deployment & infra helper scripts (deploy.sh, nginx.conf)
├── .agents/                  # Agent configurations & engineering skills
└── package.json              # Monorepo root scripts (dev, build, db:migrate, deploy)
```

---

## 5. Important Conventions & Gotchas

1. **pnpm v11 Build Scripts**:
   - `esbuild` and `core-js` postinstall build scripts are approved via `.npmrc` (`onlyBuiltDependencies` / `confirmModulesPurge=false`).
   - If clean-installing on a fresh machine without TTY, run `pnpm approve-builds --all` if prompted by pnpm.
2. **Database Provider Switching**:
   - Backend database choice is governed by `DB_PROVIDER` in `backend/.env` (`mysql`, `supabase`, or `neondb`).
   - In local dev without active MySQL, the backend server logs a warning and still starts up cleanly so frontend development is unblocked.
3. **Frontend API Proxying**:
   - Vite is configured to proxy `/api` requests to `http://localhost:1906`.
4. **Environment Variables**:
   - Backend requires `PORT`, `NODE_ENV`, `DB_PROVIDER`, `JWT_SECRET`, plus relevant database credentials.
