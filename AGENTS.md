# AGENTS.md — Habit Tracker Couple

This file provides operational guidance, architecture overview, and verified workflows for AI coding agents working in this repository.

---

## 1. Project Overview

**Habit Pasutri (Couple Habit Tracker)** is a collaborative habit-tracking application designed for couples. It features daily habit tracking, streaks, shared progress visualization, celebratory animations, and analytics.

The repository is organized as a **Turborepo** monorepo using **pnpm workspaces**, containing:
- `apps/habbit-tracker-api`: TypeScript Express backend REST API (@repo/habbit-tracker-api) — habits, auth, analytics, gamification
- `apps/habbit-tracker-web`: React 18 + Vite frontend SPA (habit app, also the login/session issuer)
- `apps/grocery-tracker-api`: TypeScript Express REST API for the grocery domain (`@repo/grocery-tracker-api`, port 5052)
- `apps/grocery-tracker-web`: React 18 + Vite SPA for the grocery list (`@repo/grocery-tracker-web`, port 4042)
- `apps/finance-tracker-api` / `apps/finance-tracker-web`: finance app (ports 5050 / 4040)
- `apps/pomodoro-tracker-api`: TypeScript Express REST API for the personal pomodoro timer (`@repo/pomodoro-tracker-api`, port 5053)
- `apps/pomodoro-tracker-web`: React 18 + Vite SPA for the pomodoro timer (`@repo/pomodoro-tracker-web`, port 4043)
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
pnpm db:migrate:grocery   # Grocery Tracker API
pnpm db:migrate:pomodoro  # Pomodoro Tracker API
# Or via filter:
pnpm --filter=@repo/habbit-tracker-api db:migrate
pnpm --filter=@repo/finance-tracker-api db:migrate
pnpm --filter=@repo/grocery-tracker-api db:migrate
pnpm --filter=@repo/pomodoro-tracker-api db:migrate

# Seed sample/initial database data
pnpm db:seed:all          # All services
pnpm db:seed              # Habit Tracker API
pnpm db:seed:finance      # Finance Tracker API
pnpm db:seed:grocery      # Grocery Tracker API (dev only, needs users from habit seed)
pnpm db:seed:pomodoro     # Pomodoro Tracker API (dev only, needs users from habit seed)
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
│   │   │   ├── modules/              # Domain modules (habit, auth, analytics, etc.)
│   │   │   ├── repositories/         # Multi-database repositories
│   │   │   ├── types/                # Types re-exported from @repo/types
│   │   │   └── app.ts & index.ts     # App setup and server listener
│   │   ├── .env                      # Backend local environment config
│   │   └── package.json
│   ├── habbit-tracker-web/           # React SPA (@repo/habbit-tracker-web)
│   │   ├── src/
│   │   │   ├── components/           # UI components & @repo/ui re-exports
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── routes/               # TanStack router routes
│   │   │   ├── stores/               # Zustand global stores
│   │   │   └── services/             # Axios API clients
│   │   ├── vite.config.ts            # Vite configuration + API proxy
│   │   ├── eslint.config.js          # ESLint 9 flat config
│   │   └── package.json
│   ├── grocery-tracker-api/          # Express REST API grocery (@repo/grocery-tracker-api, :5052)
│   │   └── src/
│   │       ├── config/               # Pool DB multi-provider + env
│   │       ├── middleware/           # Auth shared-cookie, validate, error
│   │       ├── migrations/           # mysql/ + supabase/ (pemilik grocery_items)
│   │       ├── modules/              # grocery (CRUD) & auth read-only (/me, /logout)
│   │       └── repositories/         # grocery repo (mysql/supabase) + users read-only
│   └── grocery-tracker-web/          # React SPA grocery (@repo/grocery-tracker-web, :4042)
│       └── src/
│           ├── components/           # Shell nav, AppSwitcher, ThemeSwitcher, Toaster
│           ├── config/               # Registry app switcher 4 app
│           ├── hooks/                # useSession
│           ├── routes/               # / (checklist), /manage, /settings
│           ├── services/             # api, auth, grocery, session-url
│           └── stores/               # theme & toast
│   ├── pomodoro-tracker-api/         # Express REST API pomodoro (@repo/pomodoro-tracker-api, :5053)
│   │   └── src/
│   │       ├── config/               # Pool DB multi-provider + env (APP_TIMEZONE)
│   │       ├── middleware/           # Auth shared-cookie, validate, error
│   │       ├── migrations/           # mysql/ + supabase/ (pemilik pomodoro_sessions & pomodoro_settings)
│   │       ├── modules/              # pomodoro (settings, sessions, stats) & auth read-only (/me, /logout)
│   │       └── repositories/         # settings/session repo + users read-only
│   └── pomodoro-tracker-web/         # React SPA pomodoro (@repo/pomodoro-tracker-web, :4043)
│       └── src/
│           ├── components/           # Shell, AppSwitcher, BottomNav, timer/*, stats/*
│           ├── hooks/                # use-pomodoro-timer, use-timer-alerts, use-offline-queue, use-session
│           ├── routes/               # / (timer), /stats, /settings
│           ├── services/             # api, auth, pomodoro, timer-storage, session-url
│           └── stores/               # theme, toast, preferences
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
   - Backend database choice is governed by `DB_PROVIDER` in each API's `.env` (`mysql`, `supabase`, or `neondb`). All APIs share **one** database.
   - In local dev without active MySQL, the backend server logs a warning and still starts up cleanly so frontend development is unblocked.
3. **Frontend API Proxying**:
   - `apps/habbit-tracker-web` proxies `/api` to `http://localhost:5051`.
   - `apps/finance-tracker-web` proxies `/api` to `http://localhost:5050`.
   - `apps/grocery-tracker-web` proxies `/api` to `http://localhost:5052`.
   - `apps/pomodoro-tracker-web` proxies `/api` to `http://localhost:5053`.
4. **Environment Variables**:
   - Backend requires `PORT`, `NODE_ENV`, `DB_PROVIDER`, `JWT_SECRET`, plus relevant database credentials in each app's `.env`.
   - `JWT_SECRET` **must be identical** in `habbit-tracker-api`, `finance-tracker-api`, `grocery-tracker-api`, and `pomodoro-tracker-api` — the shared `token` cookie is issued only by the habit API.
   - `APP_TIMEZONE` (default `Asia/Jakarta`) fixes the day/week boundary used by pomodoro stats, so streaks don't shift with the server's clock.
5. **Cross-app navigation**:
   - Habit and finance link to grocery via `VITE_GROCERY_APP_URL` (default `http://localhost:4042`).
   - `/grocery-list` and `/grocery-list/*` in the habit app are **redirect shims** to the grocery app (`src/lib/grocery-redirect.ts`); they are not real pages anymore.
   - Production serves grocery under `/grocery/` (see `base` in `apps/grocery-tracker-web/vite.config.ts` and `scripts/nginx.conf`), so set `VITE_GROCERY_APP_URL` accordingly.
   - Pomodoro is reachable from the AppSwitcher in habit, finance, and grocery via `VITE_POMODORO_APP_URL` (default `http://localhost:4043`); production serves it under `/pomodoro/` with its API at `/api/pomodoro`.
   - Pomodoro data is **personal per user** — no partner read path exists, unlike the couple-shared domains.

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

Lokasi file (level project):
- Skill: `.agents/skills/<nama>/SKILL.md` (30 skill + 5 adapter pipeline `grill`/`dev`/`qa`/`gate`/`promote`).
- Slash command OpenCode: `.opencode/commands/<nama>.md` — wrapper tipis yang memanggil skill terkait, dibaca OpenCode sebagai `/nama`.
- Agent: `.agents/agents/<nama>.md`.
- Baseline sinkronisasi: `.agent-skills-lock.json` (saat ini commit `f23a0ae`).

### Subagents
- `reviewer` (`.agents/agents/reviewer.md`) — Independent code reviewer berbasis lima-axis quality review.
- `qa-engineer` (`.agents/agents/qa-engineer.md`) — Perencanaan & implementasi coverage pengujian berbasis test matrix.

---

## 7. Bahasa Operasional

Skill/agent dari katalog ini berinteraksi (pertanyaan, laporan, dan dokumen yang dihasilkan seperti PRD, BRD, test-case matrix, report review) dalam **Bahasa Indonesia**, kecuali user secara eksplisit meminta Bahasa Inggris untuk sesi/task tertentu.


<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
