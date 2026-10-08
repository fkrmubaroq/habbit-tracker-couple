# ISSUES — Checklist Migrasi Monorepo Turborepo

Berikut adalah daftar pekerjaan implementasi untuk migrasi arsitektur monorepo:

### Fase 1: Setup Workspace & Tooling Turborepo
- [x] Buat file `pnpm-workspace.yaml` di root dengan deklarasi direktori `apps/*` dan `packages/*`
- [x] Install dependency `turbo` pada root devDependencies
- [x] Buat file konfigurasi `turbo.json` di root dengan pipelines: `build`, `dev`, `lint`, `check-types`, `db:migrate`, `db:seed`
- [x] Perbarui root `package.json` untuk mengeksekusi scripts menggunakan Turbo (`pnpm turbo run dev`, `build`, `lint`)

### Fase 2: Pembuatan Shared Packages (`packages/`)
- [x] Buat package `@repo/typescript-config` di `packages/typescript-config` (`package.json`, `base.json`, `react.json`, `node.json`)
- [x] Buat package `@repo/types` di `packages/types` (`package.json`, `tsconfig.json`, `src/index.ts` dengan definisi types User, Habit, HabitLog, Auth, DTO)
- [x] Buat package `@repo/ui` di `packages/ui` (`package.json`, `tsconfig.json`, `src/index.ts` dengan fondasi komponen dasar: Button, Card, Dialog)

### Fase 3: Migrasi Direktori Aplikasi (`apps/`)
- [x] Pindahkan direktori `backend/` ke `apps/api`
- [x] Sesuaikan `apps/api/package.json` (nama package, dependency `@repo/types`, `@repo/typescript-config`) dan `tsconfig.json`
- [x] Refactor import types pada `apps/api` untuk mengonsumsi `@repo/types`
- [x] Pindahkan direktori `frontend/` ke `apps/habbit-tracker-web`
- [x] Sesuaikan `apps/habbit-tracker-web/package.json` (nama package, dependency `@repo/types`, `@repo/typescript-config`, `@repo/ui`) dan `tsconfig.json`
- [x] Hubungkan komponen dasar dari `@repo/ui` dan types dari `@repo/types` pada `apps/habbit-tracker-web`

### Fase 4: Pembaruan Skrip Infrastruktur & Dokumentasi
- [x] Perbarui file `scripts/deploy.sh` agar merujuk ke path baru (`apps/api` dan `apps/habbit-tracker-web`)
- [x] Perbarui file `AGENTS.md` dengan struktur monorepo baru, perintah `turbo`, dan alur kerja yang relevan

### Fase 5: Quality Gates & Verification
- [x] Jalankan `pnpm install` di root dan pastikan symlink workspace berhasil tanpa error
- [x] Jalankan `pnpm turbo run build` dan pastikan seluruh package & apps berhasil di-build
- [x] Jalankan `pnpm turbo run lint` dan pastikan tidak ada pelanggaran linting
- [x] Verifikasi local dev execution (`pnpm dev`) dapat menjalankan backend dan frontend secara bersamaan
