# PRD — Rename apps/api Menjadi apps/habbit-tracker-api

## Context
Aplikasi **Habit Pasutri (Couple Habit Tracker)** berjalan di atas arsitektur monorepo Turborepo dengan pnpm workspaces. Struktur aplikasi web frontend saat ini menggunakan direktori `apps/habbit-tracker-web` dengan package name `@repo/habbit-tracker-web`. Sedangkan backend service masih menggunakan nama generik `apps/api` dengan package name `@repo/api`.

Untuk menciptakan keselarasan penamaan, standarisasi konvensi monorepo, serta kejelasan identitas service backend, direktori dan package backend dimigrasikan dari `apps/api` (`@repo/api`) menjadi `apps/habbit-tracker-api` (`@repo/habbit-tracker-api`).

## Problem / Motivation
1. **Ketidakkonsistenan Penamaan**: Frontend menggunakan format spesifik `apps/habbit-tracker-web`, sementara backend masih menggunakan format generik `apps/api`.
2. **Kesesuaian Workspace Monorepo**: Standarisasi penamaan package `@repo/habbit-tracker-api` membuat penamaan target Turborepo (`--filter=@repo/habbit-tracker-*`) lebih teratur, jelas tujuannya, dan konsisten di seluruh dokumentasi maupun scripts.

## Scope
1. **Pemindahan Direktori**:
   - Memindahkan seluruh isi folder `apps/api/` ke `apps/habbit-tracker-api/`.
2. **Pembaruan Package Metadata**:
   - Memperbarui atribut `"name"` pada `apps/habbit-tracker-api/package.json` dari `@repo/api` menjadi `@repo/habbit-tracker-api`.
3. **Pembaruan Workspace Scripts & Root Configuration**:
   - Memperbarui script filter di root `package.json` (`db:migrate` dan `db:seed` yang sebelumnya menargetkan `--filter=@repo/api` diubah ke `--filter=@repo/habbit-tracker-api`).
   - Melakukan sinkronisasi symlink pnpm workspaces melalui `pnpm install`.
4. **Pembaruan Deployment Script & Dokumentasi**:
   - Memperbarui path pengiriman file backend pada `scripts/deploy.sh` dari `apps/api/` menjadi `apps/habbit-tracker-api/`.
   - Memperbarui dokumentasi panduan kerja AI/developer di `AGENTS.md` (struktur folder dan daftar verified commands).

## Design Decisions
- **Penamaan Folder & Package**: Folder dinamai `apps/habbit-tracker-api` dan package dinamai `@repo/habbit-tracker-api` agar simetris dengan `apps/habbit-tracker-web` dan `@repo/habbit-tracker-web`.
- **Tidak Mengubah Konfigurasi Runtime/Port**: Port backend (1906), environment variables (`.env`), skema database, dan REST API routing tetap dipertahankan persis seperti sebelumnya.
- **Isolasi Perubahan**: Refactoring ini murni perubahan metadata penamaan, path direktori, dan build tooling tanpa menyentuh source code logika backend.

## Out of Scope
- Perubahan kode logika aplikasi backend, controller, service, atau database repository.
- Perubahan skema basis data atau file migrasi.
- Perubahan kontrak tipe data bersama di `@repo/types`.
- Perubahan source code aplikasi frontend (`apps/habbit-tracker-web`).

## Success Criteria
- [x] Folder `apps/api` telah berpindah ke `apps/habbit-tracker-api` dan terdeteksi dengan bersih di git.
- [x] Root `pnpm install` berhasil me-link workspace dengan package baru `@repo/habbit-tracker-api` tanpa error.
- [x] Perintah `pnpm --filter=@repo/habbit-tracker-api build` dan `pnpm turbo run check-types` berhasil tanpa kesalahan kompilasi.
- [x] Perintah `pnpm db:migrate` dan `pnpm db:seed` di root berjalan normal dengan filter `@repo/habbit-tracker-api`.
- [x] `scripts/deploy.sh` dan `AGENTS.md` sinkron dengan struktur direktori baru.
