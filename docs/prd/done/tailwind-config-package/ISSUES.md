# ISSUES — Checklist Implementasi Shared Tailwind Config Package

Daftar pekerjaan implementasi untuk pembuatan package `@repo/tailwind-config` dan penyesuaian aplikasi web:

### Fase 1: Pembuatan Shared Package `@repo/tailwind-config`
- [x] Buat file `packages/tailwind-config/package.json` dengan definisi nama package `@repo/tailwind-config`, ekspor CSS (`./styles.css`, `./theme.css`, `./utilities.css`), dan dependensi yang sesuai
- [x] Buat file `packages/tailwind-config/theme.css` yang mendefinisikan blok Tailwind v4 `@theme` (font, token warna) beserta variabel CSS tema (`:root`, `Sakura`, `Duo`, `Light`, `Dark`, dan tema baru `Finance`/Teal)
- [x] Buat file `packages/tailwind-config/utilities.css` yang memuat custom styling 3D (`.btn-3d`, `.card-3d`, varian warna), styling badge, animasi kustom, dan scrollbar
- [x] Buat file `packages/tailwind-config/styles.css` sebagai bundle utama yang menggabungkan Google Fonts, `@import "tailwindcss";`, `theme.css`, dan `utilities.css`

### Fase 2: Integrasi Workspace Dependencies & Refactoring Consumer
- [x] Evaluasi dependency `packages/ui` (dijaga tetap ramping tanpa `@repo/tailwind-config`, styling di-handle consumer)
- [x] Tambahkan dependency `@repo/tailwind-config: "workspace:*"` ke `apps/habbit-tracker-web/package.json`
- [x] Refactor `apps/habbit-tracker-web/src/index.css` agar mengimpor `@repo/tailwind-config/styles.css` dan membersihkan kode duplikat yang telah dipindahkan ke package

### Fase 3: Verifikasi Workspace & Build
- [x] Jalankan `pnpm install` di root workspace untuk menghubungkan symlink paket baru
- [x] Jalankan `pnpm check-types` untuk memastikan seluruh package lolos type-checking
- [x] Jalankan `pnpm lint` untuk memvalidasi aturan linting monorepo
- [x] Jalankan `pnpm build` untuk memverifikasi kompilasi bundling Vite pada frontend berjalan tanpa error
