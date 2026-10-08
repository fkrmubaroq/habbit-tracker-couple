# PRD — Shared Tailwind Config Package (`@repo/tailwind-config`)

## Context
Repository **Habit Pasutri (Couple Habit Tracker)** telah dimigrasikan ke arsitektur monorepo Turborepo dengan shared packages (`@repo/types`, `@repo/ui`, `@repo/typescript-config`). Saat ini styling aplikasi di `apps/habbit-tracker-web` mengandalkan file CSS lokal yang besar (`apps/habbit-tracker-web/src/index.css`) dengan konfigurasi Tailwind CSS v4 (`@tailwindcss/vite`).

Untuk meningkatkan konsistensi desain, menghindari duplikasi definisi tema/utilitas, serta mempermudah pengembangan aplikasi atau modul baru di masa mendatang (termasuk modul Personal Finance Tracker), dibuat package bersama `@repo/tailwind-config` yang memusatkan seluruh konfigurasi Tailwind v4, token desain, tema warna, dan utilitas visual.

## Problem / Motivation
1. **Pemusatan Stylesheet Monorepo**: Komponen bersama di `@repo/ui` dan aplikasi web di `apps/habbit-tracker-web` memerlukan single source of truth untuk token tema, variabel warna, dan utilitas visual 3D (.btn-3d, .card-3d).
2. **Kesiapan Tema Modul Masa Depan**: Modul Personal Finance Tracker membutuhkan palet warna baru (Teal, Purple, Orange) yang harus dapat diintegrasikan dengan mulus bersama tema eksisting (Sakura, Duo, Light, Dark).
3. **Kerapian Kode Consumer**: `apps/habbit-tracker-web/src/index.css` saat ini berisi 360+ baris CSS yang bercampur antara token tema, class komponen tombol 3D, animasi, dan scrollbar. Ini dapat disederhanakan dengan mengimpor centralized stylesheet dari package bersama.

## Scope
1. **Pembuatan Package `@repo/tailwind-config` di `packages/tailwind-config/`**:
   - `package.json` dengan deklarasi nama `@repo/tailwind-config`, ekspor CSS (`./styles.css`, `./theme.css`, `./base.css`).
   - File stylesheet modular:
     - `theme.css`: Direktif Tailwind v4 `@theme` (font family, color tokens, semantic variables) dan definisi tema CSS (`:root`, `Sakura`, `Duo`, `Light`, `Dark`, dan `Finance`/`Teal`).
     - `utilities.css`: Custom button 3D (`.btn-3d`, `.btn-3d-secondary`, dll.), card 3D (`.card-3d`), badge, animasi, dan scrollbar styling.
     - `styles.css`: Entry point utama yang menggabungkan font Google, `@import "tailwindcss"`, `theme.css`, dan `utilities.css`.
2. **Integrasi ke `apps/habbit-tracker-web`**:
   - Tambahkan `@repo/tailwind-config: "workspace:*"` pada dependencies `apps/habbit-tracker-web/package.json`.
   - Refactor `apps/habbit-tracker-web/src/index.css` agar mengimpor `@repo/tailwind-config/styles.css` (atau modul CSS terkait), menyisakan hanya penyesuaian spesifik aplikasi jika diperlukan.
3. **Integrasi ke `packages/ui`**:
   - Tambahkan referensi `@repo/tailwind-config: "workspace:*"` pada `packages/ui/package.json` agar pustaka UI primitives memiliki referensi styling yang konsisten.
4. **Verifikasi Monorepo & Build**:
   - Memastikan `pnpm install`, `pnpm check-types`, `pnpm lint`, dan `pnpm build` berjalan sukses tanpa kendala resolusi impor CSS.

## Design Decisions
- **Tailwind Version**: Tetap menggunakan **Tailwind CSS v4** dengan pendekatan **CSS-first** (`@theme` dan CSS variables) sesuai stack monorepo eksisting. Tidak menurunkan ke Tailwind v3 (`tailwind.config.js`).
- **Pendekatan Centralized Stylesheet**: Package mengekspor stylesheet lengkap sehingga aplikasi consumer hanya perlu satu baris import untuk mengaktifkan seluruh design system dan tema.
- **Inklusi Tema Finance (Teal Palette)**: Menyertakan token tema warna baru (`Finance`/`Teal`: Primary Teal `#38B2AC`, Secondary Purple `#805AD5`, Accent Orange `#ED8936`) pada `theme.css` di samping 4 tema eksisting (`Sakura`, `Duo`, `Light`, `Dark`).

## Out of Scope
- Migrasi balik ke Tailwind CSS v3 dengan file JavaScript `tailwind.config.js`.
- Implementasi penuh modul/halaman Personal Finance Tracker (akan dibuat di plan terpisah).
- Modifikasi runtime Vite atau plugin bundler selain integrasi import stylesheet.

## Success Criteria
- [x] Package `packages/tailwind-config` terdaftar dan terhubung dalam workspace pnpm (`workspace:*`).
- [x] File stylesheet modular (`theme.css`, `utilities.css`, `styles.css`) terdefinisi dengan bersih dan diekspor via `package.json`.
- [x] `apps/habbit-tracker-web` berhasil mengimpor stylesheet dari `@repo/tailwind-config` dengan styling visual tetap identik dan tidak ada regresi tampilan.
- [x] Tema `Finance` (Teal palette) terdaftar dan dapat digunakan melalui atribut `data-theme="Finance"`.
- [x] Perintah `pnpm build`, `pnpm check-types`, dan `pnpm lint` lolos 100% tanpa error.
