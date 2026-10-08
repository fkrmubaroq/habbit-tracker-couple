# PRD — Migrasi Arsitektur Monorepo Turborepo

## Context
Aplikasi **Habit Pasutri (Couple Habit Tracker)** saat ini memiliki struktur direktori terpisah di root (`backend/` dan `frontend/`) tanpa workspace manager formal atau task orchestration terpadu (hanya menggunakan `concurrently` di root `package.json`).

Untuk meningkatkan skalabilitas, kecepatan build (caching), dan kemudahan sharing kode (tipe data TypeScript, konfigurasi, dan komponen UI), proyek ini dimigrasikan ke arsitektur **Turborepo** berbasis **pnpm workspaces**.

## Problem / Motivation
1. **Redundansi Kode & Tipe Data**: Model data (seperti entitas User, Habit, HabitLog, respons API) didefinisikan terpisah di backend dan frontend sehingga berpotensi desinkronisasi kontrak data.
2. **Ketiadaan Task Orchestration & Caching**: Eksekusi build dan lint dilakukan per-folder secara manual tanpa caching cerdas dari Turborepo.
3. **Struktur Direktori Belum Standar Monorepo**: Penempatan aplikasi di root tanpa direktori `apps/` dan `packages/` membatasi pengembangan fitur bersama (shared libraries).

## Scope
1. **Workspace & Task Orchestration Setup**:
   - Pembuatan `pnpm-workspace.yaml` yang mencakup direktori `apps/*` dan `packages/*`.
   - Konfigurasi `turbo.json` untuk pipelines `build`, `dev`, `lint`, `db:migrate`, `db:seed`, dan `check-types`.
   - Pembaruan root `package.json` dengan script delegasi `turbo run ...`.
2. **Shared Packages (`packages/`)**:
   - `packages/typescript-config` (`@repo/typescript-config`): Konfigurasi dasar `tsconfig.json` (base, react, node).
   - `packages/types` (`@repo/types`): Shared DTO dan interfaces TypeScript (User, Habit, Log, Auth, Partner).
   - `packages/ui` (`@repo/ui`): Fondasi shared UI components (Button, Card, Dialog) yang kompatibel dengan Tailwind CSS dan Radix UI.
3. **Aplikasi (`apps/`)**:
   - Migrasi direktori `backend/` ke `apps/api` (mempertahankan Express + TypeScript + tsx).
   - Migrasi direktori `frontend/` ke `apps/habbit-tracker-web` (mempertahankan React 18 + Vite + TanStack Router).
   - Menghubungkan dependencies internal workspace (`@repo/types`, `@repo/typescript-config`, `@repo/ui`).
4. **Infra & Tooling Support**:
   - Penyesuaian path transfer dan build pada `scripts/deploy.sh` agar merujuk ke direktori baru di dalam `apps/`.
   - Pembaruan panduan operasional agen di `AGENTS.md`.

## Design Decisions
- **Tooling Monorepo**: Menggunakan **Turborepo** (`turbo`) dipadukan dengan **pnpm workspaces**.
- **Framework Frontend & Backend**: Tidak mengubah runtime dasar (frontend tetap **Vite + React**, backend tetap **Express + TS**). Tidak menggunakan Next.js / bundler Turbopack untuk menghindari breaking rewrite.
- **Penamaan Apps**: Folder `apps/api` untuk backend service, dan `apps/habbit-tracker-web` untuk web client.
- **Cakupan `@repo/ui`**: Tahap awal mengekstrak komponen UI dasar (Button, Card, Dialog) sebagai pembuktian shared package, sementara komponen spesifik tetap berada di `apps/habbit-tracker-web`.
- **Package Manager**: Tetap mempertahankan **pnpm v11+** dengan `.npmrc` build approvals yang sudah ada.

## Out of Scope
- Migrasi frontend ke Next.js / bundler Turbopack.
- Refactor seluruh komponen UI di frontend ke `@repo/ui` secara serentak.
- Modifikasi endpoint REST API atau skema database.
- Perubahan alur autentikasi JWT atau state management Zustand.

## Success Criteria
- [x] Root `pnpm install` berhasil me-link seluruh workspace dependencies tanpa warning siklik atau error resolusi.
- [x] Perintah `pnpm turbo run build` berhasil mengompilasi semua packages dan apps dengan memanfaatkan cache Turborepo.
- [x] Perintah `pnpm turbo run lint` berjalan dengan lancar pada seluruh workspace.
- [x] Script backend (`apps/api`) dan frontend (`apps/habbit-tracker-web`) dapat dijalankan bersamaan dengan `pnpm dev`.
- [x] Script deploy `scripts/deploy.sh` tervalidasi merujuk ke direktori baru yang valid.
