# AGENTS.md — Habit Tracker Couple

This file provides operational guidance, architecture overview, and verified workflows for AI coding agents working in this repository.

---

## 1. Project Overview

**Habit Pasutri (Couple Habit Tracker)** is a collaborative habit-tracking application designed for couples. It features daily habit tracking, streaks, shared progress visualization, celebratory animations, and analytics.

The repository is organized as a **Turborepo** monorepo using **pnpm workspaces**, containing:
- `apps/habbit-tracker-api`: TypeScript Express backend REST API (@repo/habbit-tracker-api)
- `apps/habbit-tracker-web`: React 18 + Vite frontend SPA
- `packages/types`: Shared TypeScript interfaces and DTOs (`@repo/types`)
- `packages/ui`: Shared UI component primitives (`@repo/ui`)
- `packages/typescript-config`: Shared base `tsconfig.json` configurations (`@repo/typescript-config`)
- `packages/tailwind-config`: Shared Tailwind CSS v4 design tokens and utilities (`@repo/tailwind-config`)

---

## 2. Technology Stack & Tooling

| Component | Technology | Details |
|---|---|---|
| **Monorepo Engine** | Turborepo (`turbo` v2) | Task orchestration, pipeline execution, and caching |
| **Package Manager** | `pnpm` (v11+) | Workspaces via `pnpm-workspace.yaml` |
| **Backend** | Node.js + Express 4 | TypeScript (`tsc`), `tsx` runner, Zod validation |
| **Database** | MySQL / PostgreSQL / Neon | Multi-provider support via `mysql2`, `pg`, `@neondatabase/serverless` |
| **Auth** | JWT + Cookie | `jsonwebtoken`, `cookie-parser`, `bcryptjs` |
| **Frontend** | React 18 + Vite 5 | TypeScript, Tailwind CSS, TanStack Router & Query |
| **Frontend UI/State** | Radix UI + Zustand | `@repo/ui`, `lucide-react`, `dayjs`, `recharts`, `canvas-confetti`, Vite PWA |
| **Shared Packages** | `@repo/types`, `@repo/ui`, `@repo/typescript-config`, `@repo/tailwind-config` | Internal workspace packages (`workspace:*`) |
| **Linting** | ESLint 9 (Flat Config) + TypeScript `tsc --noEmit` | Configured across apps and packages |

---

## 3. Verified Commands

All commands below have been tested and verified to work:

### Development
```bash
# Start all apps concurrently with Turborepo
pnpm dev
# (or: pnpm turbo run dev)

# Start backend only
pnpm --filter=@repo/habbit-tracker-api dev

# Start frontend only
pnpm --filter=@repo/habbit-tracker-web dev
```

### Build
```bash
# Build all packages and apps with Turborepo caching
pnpm build
# (or: pnpm turbo run build)

# Build backend only
pnpm --filter=@repo/habbit-tracker-api build

# Build frontend only
pnpm --filter=@repo/habbit-tracker-web build
```

### Database Operations
```bash
# Run migrations for all services
pnpm db:migrate:all
# (or: pnpm migrate:all)

# Run database migrations for specific service
pnpm db:migrate           # Habit Tracker API
pnpm db:migrate:finance   # Finance Tracker API
# Or via filter:
pnpm --filter=@repo/habbit-tracker-api db:migrate
pnpm --filter=@repo/finance-tracker-api db:migrate

# Seed sample/initial database data
pnpm db:seed:all          # All services
pnpm db:seed              # Habit Tracker API
pnpm db:seed:finance      # Finance Tracker API
```

### Linting & Type Checking
```bash
# Run lint across all workspaces
pnpm lint
# (or: pnpm turbo run lint)

# Type-check across all workspaces
pnpm check-types
# (or: pnpm turbo run check-types)
```

---

## 4. Key Directory Structure

```text
habbit-tracker-couple/
├── apps/
│   ├── habbit-tracker-api/           # Express REST API (@repo/habbit-tracker-api)
│   │   ├── src/
│   │   │   ├── config/               # Database pool & env parsing
│   │   │   ├── controllers/          # Route request handlers
│   │   │   ├── middleware/           # Auth (JWT) & error handling middleware
│   │   │   ├── migrations/           # Schema definitions and seed scripts
│   │   │   ├── modules/              # Domain modules (habit, auth, grocery, etc.)
│   │   │   ├── repositories/         # Multi-database repositories
│   │   │   ├── types/                # Types re-exported from @repo/types
│   │   │   └── app.ts & index.ts     # App setup and server listener
│   │   ├── .env                      # Backend local environment config
│   │   └── package.json
│   └── habbit-tracker-web/           # React SPA (@repo/habbit-tracker-web)
│       ├── src/
│       │   ├── components/           # UI components & @repo/ui re-exports
│       │   ├── hooks/                # Custom React hooks
│       │   ├── routes/               # TanStack router routes
│       │   ├── stores/               # Zustand global stores
│       │   └── services/             # Axios API clients
│       ├── vite.config.ts            # Vite configuration + API proxy
│       ├── eslint.config.js          # ESLint 9 flat config
│       └── package.json
├── packages/
│   ├── types/                        # @repo/types (User, Habit, Log, DTOs)
│   ├── ui/                           # @repo/ui (Button, Card, Dialog primitives)
│   ├── tailwind-config/              # @repo/tailwind-config (Tailwind v4 tokens & styles)
│   └── typescript-config/            # @repo/typescript-config (base, node, react)
├── scripts/                          # Deployment & infra helper scripts (deploy.sh, nginx.conf)
├── .agents/                          # Agent configurations & engineering skills
├── pnpm-workspace.yaml               # PNPM workspace definition
├── turbo.json                        # Turborepo task pipeline configuration
└── package.json                      # Root scripts and devDependencies
```

---

## 5. Important Conventions & Gotchas

1. **pnpm Workspace Execution**:
   - Workspace packages are linked via `"@repo/<pkg>": "workspace:*"`.
   - On Windows, if execution policy blocks `pnpm.ps1`, use `pnpm.cmd` directly from `C:\Users\Fikri\AppData\Local\pnpm\bin\pnpm.cmd` or add that directory to the front of `PATH`.
2. **Database Provider Switching**:
   - Backend database choice is governed by `DB_PROVIDER` in `apps/habbit-tracker-api/.env` (`mysql`, `supabase`, or `neondb`).
   - In local dev without active MySQL, the backend server logs a warning and still starts up cleanly so frontend development is unblocked.
3. **Frontend API Proxying**:
   - Vite in `apps/habbit-tracker-web` proxies `/api` requests to `http://localhost:1906`.
4. **Environment Variables**:
   - Backend requires `PORT`, `NODE_ENV`, `DB_PROVIDER`, `JWT_SECRET`, plus relevant database credentials in `apps/habbit-tracker-api/.env`.

---

## 6. Installed Skills & Pipeline Commands

Repository ini dilengkapi dengan skill dan pipeline command dari [knitto-agent-skills](https://github.com/knittotextile/knitto-agent-skills).

### Pipeline Commands (`DEFINE → BUILD → VERIFY → REVIEW → SHIP`)
- `/grill` — **DEFINE**: Perencanaan Product Backlog ke BRD / PRD+ISSUES melalui tanya-jawab terstruktur (`brd-reader` & `prd-grill`).
- `/dev` — **BUILD**: Implementasi checklist fitur pada plan `ISSUES.md` secara bertahap dengan cheap checks (`exec-todo`).
- `/qa` — **VERIFY**: Pengujian menyeluruh berbasis skenario via `test-case-matrix` dan test runner (`webapp-testing`, `api-testing`, dll).
- `/gate` — **REVIEW**: Code review lima-axis dan security review sebelum rilis (`code-review-and-quality` & `security-review`).
- `/promote` — **SHIP**: Membuka / update Pull Request ke branch trunk dan sync staging (`branching`).
- `/skill-sync` — Memeriksa dan memperbarui skill, agent, dan command terhadap katalog upstream menggunakan `.agent-skills-lock.json`.

### Subagents
- `reviewer` (`.agents/agents/reviewer.md`) — Independent code reviewer berbasis lima-axis quality review.
- `qa-engineer` (`.agents/agents/qa-engineer.md`) — Perencanaan & implementasi coverage pengujian berbasis test matrix.

---

## 7. Bahasa Operasional

Skill/agent dari katalog ini berinteraksi (pertanyaan, laporan, dan dokumen yang dihasilkan seperti PRD, BRD, test-case matrix, report review) dalam **Bahasa Indonesia**, kecuali user secara eksplisit meminta Bahasa Inggris untuk sesi/task tertentu.

