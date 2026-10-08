# Test Matrix — Shared Tailwind Config Package (@repo/tailwind-config)

| PROGRAM VERSION RELEASE | - | TESTER | QA Agent | TEST CASE CREATED AT | 2026-10-09 |
|---|---|---|---|---|---|
| FOLDER TEST APP | packages/tailwind-config, apps/habbit-tracker-web | PROGRAMMER | Antigravity | TEST CASE UPDATED AT | 2026-10-09 |
| IP DEV | localhost:5173 | TASK DEV | Shared Tailwind Config | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/todo/tailwind-config-package/PRD.md, docs/prd/todo/tailwind-config-package/ISSUES.md  
**Scope:** Pembuatan shared package @repo/tailwind-config, ekspor stylesheet modular (theme.css, utilities.css, styles.css), integrasi ke apps/habbit-tracker-web, verifikasi build CSS di Vite  
**Out of scope:** Modifikasi konfigurasi runtime bundler Vite selain import CSS, pembuatan halaman/fitur penuh Personal Finance Tracker  

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 9 | 9 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 9 | 0 | 9 | 0 | 100% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

## Test Cases

### PB-1 — Pembuatan Shared Package @repo/tailwind-config

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Deklarasi metadata package dan ekspor CSS modular di package.json | [x] | TC1-1 |
| 2 | Definisi token @theme, CSS variables untuk seluruh tema (termasuk Finance/Teal) | [x] | TC1-2 |
| 3 | Utilitas kustom tombol 3D, card 3D, animasi, dan scrollbar | [x] | TC1-3 |
| 4 | Penggabungan Google Fonts, Tailwind directives, dan sub-modules di styles.css | [x] | TC1-4 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Package Structure | - | + | TC1-1 | Package Exports | Validasi konfigurasi ekspor modul CSS pada package.json | Memastikan package.json mengekspor styles.css, theme.css, dan utilities.css | Direktori packages/tailwind-config dibuat | packages/tailwind-config/package.json | 1. Buka `packages/tailwind-config/package.json`.<br>2. Periksa field `exports` dan `files`. | 1. Field `exports` menyediakan entry point `styles.css`, `theme.css`, dan `utilities.css`.<br>2. Package berstatus private: true. | Passed | package.json lines 6-16 | Struktur package valid | Masuk Test Step | 2026-10-09 | `packages/tailwind-config/package.json` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Design System | - | + | TC1-2 | Theme Variables | Validasi blok @theme dan CSS variables 5 tema | Memastikan token warna, font sans, dan palet Finance terdefinisi | File theme.css dibuat | packages/tailwind-config/theme.css | 1. Buka `packages/tailwind-config/theme.css`.<br>2. Periksa blok `@theme` (font, token warna).<br>3. Periksa selector `[data-theme="Finance"]`. | 1. Blok `@theme` memetakan `--color-*` ke CSS variables.<br>2. Tema Sakura, Duo, Light, Dark, dan Finance terdefinisi dengan palet Teal/Purple/Orange. | Passed | theme.css lines 1-87 | Variabel tema lengkap | Masuk Test Step | 2026-10-09 | `packages/tailwind-config/theme.css` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Utilities | - | + | TC1-3 | 3D & Animation | Validasi utilitas 3D dan animasi kustom | Memastikan style .btn-3d, .card-3d, dan animasi hover tersedia | File utilities.css dibuat | packages/tailwind-config/utilities.css | 1. Buka `packages/tailwind-config/utilities.css`.<br>2. Periksa definisi `.btn-3d`, `.card-3d`, dan class utilitas turunan. | Seluruh class tombol 3D, card 3D, badge, dan scrollbar styling terdefinisi dengan benar. | Passed | utilities.css | Custom utilities terekstrak | Masuk Test Step | 2026-10-09 | `packages/tailwind-config/utilities.css` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Master Bundle | - | + | TC1-4 | Main Stylesheet | Validasi entry point styles.css | Memastikan styles.css menggabungkan fonts, Tailwind directives, dan partials | File styles.css dibuat | packages/tailwind-config/styles.css | 1. Buka `packages/tailwind-config/styles.css`.<br>2. Periksa urutan import (Google Fonts, tailwindcss, theme.css, utilities.css). | Semua @import terstruktur rapi dan merujuk berkas yang valid. | Passed | styles.css lines 1-5 | Bundle entry point valid | Masuk Test Step | 2026-10-09 | `packages/tailwind-config/styles.css` | PRD Scope 1 & ISSUES Fase 1 |

### PB-2 — Integrasi Consumer (apps/habbit-tracker-web)

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Pemasangan dependensi internal @repo/tailwind-config ke web app | [x] | TC2-1 |
| 2 | Refactoring index.css consumer untuk mengimpor shared stylesheet | [x] | TC2-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Dependency Linking | - | + | TC2-1 | Workspace Dep | Validasi pemasangan dependency workspace pada apps/habbit-tracker-web | Memastikan package @repo/tailwind-config terhubung via pnpm workspace | Root pnpm-workspace.yaml mencakup packages/* | apps/habbit-tracker-web/package.json | 1. Buka `apps/habbit-tracker-web/package.json`.<br>2. Periksa dependencies untuk `@repo/tailwind-config`.<br>3. Jalankan `pnpm install`. | 1. Dependency terdaftar sebagai `workspace:*`.<br>2. Resolusi symlink pnpm berhasil tanpa error. | Passed | package.json line 24 & pnpm install | Workspace linking berhasil | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/package.json` | PRD Scope 2 & ISSUES Fase 2 |
| 2 | Consumer Stylesheet | - | + | TC2-2 | CSS Import | Validasi penyederhanaan index.css pada aplikasi web | Memastikan index.css consumer mengimpor shared stylesheet tanpa duplikasi | Package @repo/tailwind-config terpasang | apps/habbit-tracker-web/src/index.css | 1. Buka `apps/habbit-tracker-web/src/index.css`.<br>2. Periksa isi file. | File hanya memuat `@import "@repo/tailwind-config/styles.css";` secara bersih dan ringkas. | Passed | index.css line 1 | Kode consumer ramping | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/src/index.css` | PRD Scope 2 & ISSUES Fase 2 |

### PB-3 — Verifikasi Monorepo Pipeline & Bundling

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi type checking TypeScript di seluruh workspace | [x] | TC3-1 |
| 2 | Validasi linting ESLint di seluruh workspace | [x] | TC3-2 |
| 3 | Validasi bundling produksi Vite dan kompilasi CSS | [x] | TC3-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | Type Checking | - | + | TC3-1 | Type Check | Validasi tidak ada konflik tipe atau modul dari penambahan package | Memastikan pnpm check-types lolos di seluruh monorepo | Workspace packages terkonfigurasi | pnpm check-types | 1. Jalankan `pnpm check-types`.<br>2. Periksa output compiler. | 1. Seluruh package berhasil di-check.<br>2. 0 error exit code 0. | Passed | Tasks: 2 successful, 2 total | Type checking valid | Masuk Test Step | 2026-10-09 | `turbo.json` | PRD Scope 4 & ISSUES Fase 3 |
| 3 | Linting | - | + | TC3-2 | Lint Validation | Validasi kepatuhan aturan linter monorepo | Memastikan pnpm lint berjalan lancar tanpa error formatting/syntax | Workspace packages terpasang | pnpm lint | 1. Jalankan `pnpm lint`.<br>2. Periksa hasil eslint dan tsc lint. | Tasks: 2 successful, 0 errors. | Passed | Tasks: 2 successful, 2 total | Linting valid | Masuk Test Step | 2026-10-09 | `turbo.json` | PRD Scope 4 & ISSUES Fase 3 |
| 3 | Production Build | - | + | TC3-3 | Vite Bundling | Pengujian kompilasi bundling Vite dengan shared Tailwind stylesheet | Memastikan Vite berhasil memproses `@import "@repo/tailwind-config/styles.css"` dan menghasilkan file CSS di dist/ | Build pipeline aktif | pnpm build | 1. Jalankan `pnpm build`.<br>2. Periksa output `apps/habbit-tracker-web/dist/assets/index-*.css`. | 1. Vite berhasil mentransformasi modul dan menghasilkan bundle dist/assets/index-*.css (~63 kB).<br>2. Exit code 0. | Passed | Vite build output (dist/assets/index-*.css) | CSS bundling sukses | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/dist` | PRD Scope 4 & ISSUES Fase 3 |
