# Test Matrix — Migrasi Arsitektur Monorepo Turborepo

| PROGRAM VERSION RELEASE | - | TESTER | QA Agent | TEST CASE CREATED AT | 2026-10-08 |
|---|---|---|---|---|---|
| FOLDER TEST APP | apps/*, packages/* | PROGRAMMER | Antigravity | TEST CASE UPDATED AT | 2026-10-08 |
| IP DEV | localhost:1906, localhost:5173 | TASK DEV | Migrasi Turborepo | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/done/monorepo-turborepo/PRD.md, docs/prd/done/monorepo-turborepo/ISSUES.md  
**Scope:** Setup Turborepo, pnpm workspaces, shared packages (@repo/types, @repo/ui, @repo/typescript-config), migrasi apps/api & apps/habbit-tracker-web, deploy script, AGENTS.md  
**Out of scope:** Migrasi ke Next.js/Turbopack, perubahan skema database/REST API endpoint  

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 11 | 11 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 11 | 0 | 11 | 0 | 100% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

## Test Cases

Satu section `### PB-<n>` per PB/requirement group. Nama kolom tabel mengikuti istilah tester manual persis (bahasa Inggris, urutan sama, jangan diterjemahkan/diubah) — isinya ditulis dalam **Bahasa Indonesia**.

### PB-1 — Setup Workspace & Tooling Turborepo

Mini traceability khusus PB ini — ganti "Traceability Matrix" global:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Deklarasi struktur pnpm workspace apps/* dan packages/* | [x] | TC1-1 |
| 2 | Konfigurasi turbo.json pipeline task dependencies dan caching | [x] | TC1-2 |
| 3 | Root package.json scripts mendelegasikan perintah via turbo run | [x] | TC1-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Setup Workspace | - | + | TC1-1 | Workspace Setup | Verifikasi instalasi dependencies workspace dan validitas symlink pnpm | Memastikan resolusi dependensi workspace pnpm berjalan tanpa error | File pnpm-workspace.yaml berisi apps/* dan packages/* | pnpm install --frozen-lockfile | 1. Jalankan `pnpm install` di root repository.<br>2. Periksa output resolusi paket dan symlink workspace. | 1. Seluruh package (@repo/*) terhubung via workspace symlink.<br>2. Tidak ada warning dependensi siklik atau kegagalan instalasi. | Passed | Output pnpm v12.9.1 | Validasi pnpm workspaces | Masuk Test Step | 2026-10-08 | `pnpm-workspace.yaml`, `package.json` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Setup Workspace | - | + | TC1-2 | Pipeline Turborepo | Validasi eksekusi pipeline task Turborepo | Menjalankan task turbo pipeline dengan dependency graph yang benar | turbo.json terkonfigurasi dengan pipeline build, lint, check-types | pnpm check-types | 1. Jalankan perintah `pnpm check-types`.<br>2. Periksa task output dari turbo untuk setiap package. | 1. Turbo mendeteksi 5 packages in scope.<br>2. Pipeline berhasil dijalankan dengan output Tasks: 2 successful, 2 total. | Passed | Tasks: 2 successful, 2 total | Eksekusi pipeline tsc --noEmit via turbo | Masuk Test Step | 2026-10-08 | `turbo.json`, `package.json` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Setup Workspace | - | + | TC1-3 | Root Scripts Proxy | Memastikan keselarasan script di package.json root dengan turbo run | Memvalidasi ketersediaan alias skrip dev, build, lint, check-types, db:migrate | Root package.json memiliki deklarasi script berbasis turbo | package.json scripts | 1. Buka package.json di root repository.<br>2. Validasi mapping seluruh lifecycle scripts ke command turbo. | 1. Script dev, build, lint, check-types merujuk ke `turbo run`.<br>2. Tidak ada path folder lama (backend/ atau frontend/) yang tersisa di scripts. | Passed | Validasi root package.json | Script delegation terstandarisasi | Masuk Test Step | 2026-10-08 | `package.json` | PRD Scope 1 & ISSUES Fase 1 |

### PB-2 — Shared Packages (@repo/types, @repo/ui, @repo/typescript-config)

Mini traceability khusus PB ini — ganti "Traceability Matrix" global:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Standarisasi shared configuration tsconfig base, node, dan react | [x] | TC2-1 |
| 2 | Ekspor shared DTO dan interface tipe data TypeScript di @repo/types | [x] | TC2-2 |
| 3 | Ekspor komponen UI shared primitives (Button, Card, Dialog) di @repo/ui | [x] | TC2-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Shared Packages | - | + | TC2-1 | Config Inheritance | Validasi pewarisan tsconfig dari @repo/typescript-config | Memastikan apps/api dan apps/habbit-tracker-web mewarisi konfigurasi compiler tsconfig | Package @repo/typescript-config menyediakan base.json, node.json, react.json | tsconfig.json di apps | 1. Buka tsconfig.json di apps/api dan pastikan extends node.json.<br>2. Buka tsconfig di apps/habbit-tracker-web dan pastikan extends react.json.<br>3. Jalankan `pnpm check-types`. | 1. Resolusi compiler options berhasil tanpa error modul tidak ditemukan.<br>2. Type check berhasil pada seluruh workspace. | Passed | Tasks: 2 successful, 2 total (check-types) | Shared tsconfig bekerja optimal | Masuk Test Step | 2026-10-08 | `packages/typescript-config/base.json`, `packages/typescript-config/node.json`, `packages/typescript-config/react.json` | PRD Scope 2 & ISSUES Fase 2 |
| 2 | Shared Packages | - | + | TC2-2 | Shared Types | Penggunaan tipe data bersama User, Habit, HabitLog, Auth di @repo/types | Memastikan @repo/types mengekspor types yang valid dan dapat diakses backend & frontend | packages/types mendefinisikan interface inti dan package.json mengekspor main/types | import from @repo/types | 1. Periksa file `packages/types/src/index.ts`.<br>2. Verifikasi impor pada backend (`apps/api/src/types/index.ts`) dan frontend (`apps/habbit-tracker-web/src/types/index.ts`).<br>3. Jalankan `pnpm build`. | 1. Tipe data berhasil diekspor dari @repo/types.<br>2. Backend dan frontend mengonsumsi types tanpa kompilasi error. | Passed | Output build sukses di apps/api dan apps/habbit-tracker-web | Single source of truth model data | Masuk Test Step | 2026-10-08 | `packages/types/src/index.ts`, `packages/types/package.json` | PRD Scope 2 & ISSUES Fase 2 |
| 2 | Shared Packages | - | + | TC2-3 | Shared UI | Penggunaan komponen UI Button, Card, Dialog dari @repo/ui | Memastikan @repo/ui mengekspor komponen dasar dan dikonsumsi frontend | packages/ui memiliki definisi Button, Card, Dialog yang kompatibel dengan Tailwind | import from @repo/ui | 1. Periksa ketersediaan komponen di `packages/ui/src/`.<br>2. Periksa re-export/konsumsi pada `apps/habbit-tracker-web/src/components/ui/button.tsx`.<br>3. Jalankan `pnpm build`. | 1. Komponen dasar terkompilasi dan dibundle dengan baik bersama styling Tailwind.<br>2. Vite build selesai tanpa broken imports. | Passed | Output Vite build sukses | Shared UI library terintegrasi | Masuk Test Step | 2026-10-08 | `packages/ui/src/index.ts`, `packages/ui/package.json` | PRD Scope 2 & ISSUES Fase 2 |

### PB-3 — Aplikasi & Interop (apps/api, apps/habbit-tracker-web)

Mini traceability khusus PB ini — ganti "Traceability Matrix" global:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Kompilasi dan type checking backend service pada apps/api | [x] | TC3-1 |
| 2 | Kompilasi dan bundling client SPA pada apps/habbit-tracker-web | [x] | TC3-2 |
| 3 | Konkurensi eksekusi local dev server backend dan frontend | [x] | TC3-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | Aplikasi & Interop | - | + | TC3-1 | Backend Build | Pengujian kompilasi backend REST API dalam monorepo | Memastikan backend apps/api dapat dikompilasi ke direktori dist/ | apps/api terpasang dependency @repo/types | pnpm --filter=@repo/api build | 1. Jalankan `pnpm --filter=@repo/api build`.<br>2. Periksa terbentuknya folder `apps/api/dist` dengan file index.js dan modul-modulnya. | 1. Kompilasi tsc selesai dengan status exit code 0.<br>2. Berkas JavaScript hasil build terbentuk di apps/api/dist. | Passed | apps/api/dist/index.js terbentuk | Backend build berhasil | Masuk Test Step | 2026-10-08 | `apps/api/package.json`, `apps/api/src/index.ts` | PRD Scope 3 & ISSUES Fase 3 |
| 3 | Aplikasi & Interop | - | + | TC3-2 | Frontend Build | Pengujian kompilasi & packaging PWA frontend dalam monorepo | Memastikan frontend apps/habbit-tracker-web dapat dibuild oleh Vite | apps/habbit-tracker-web terhubung ke @repo/types dan @repo/ui | pnpm --filter=@repo/habbit-tracker-web build | 1. Jalankan `pnpm --filter=@repo/habbit-tracker-web build`.<br>2. Verifikasi manifest PWA, service worker, dan asset bundle terbentuk di `apps/habbit-tracker-web/dist`. | 1. Vite mem-build modul tanpa kegagalan resolusi.<br>2. File index.html, assets, dan sw.js terbentuk di folder dist. | Passed | Output Vite: built in 11.18s, dist/sw.js generated | Frontend SPA build berhasil | Masuk Test Step | 2026-10-08 | `apps/habbit-tracker-web/package.json`, `apps/habbit-tracker-web/vite.config.ts` | PRD Scope 3 & ISSUES Fase 3 |
| 3 | Aplikasi & Interop | - | + | TC3-3 | Dev Server Launch | Pengujian konfigurasi concurrent dev server backend & frontend | Memastikan pipeline dev dapat meluncurkan kedua aplikasi bersamaan tanpa bentrok | turbo.json mengonfigurasi task dev persistent: true dan cache: false | pnpm turbo run dev --dry=json | 1. Periksa konfigurasi task dev pada `turbo.json`.<br>2. Verifikasi script dev pada apps/api dan apps/habbit-tracker-web.<br>3. Jalankan `pnpm turbo run dev --dry=json` untuk memvalidasi dependency graph eksekusi. | 1. Turbo mendaftarkan kedua task dev untuk @repo/api dan @repo/habbit-tracker-web secara paralel.<br>2. Port API (1906) dan Vite (5173) terisolasi dengan proxy /api. | Passed | Output turbo dry-run mencakup @repo/api#dev dan @repo/habbit-tracker-web#dev | Dev orchestration siap jalan | Masuk Test Step | 2026-10-08 | `turbo.json`, `apps/api/package.json`, `apps/habbit-tracker-web/package.json` | PRD Scope 3 & ISSUES Fase 3 |

### PB-4 — Skrip Deployment & Dokumentasi Operasional

Mini traceability khusus PB ini — ganti "Traceability Matrix" global:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi struktur path direktori pada skrip deploy (scripts/deploy.sh) | [x] | TC4-1 |
| 2 | Validasi integritas dokumentasi operasional di AGENTS.md | [x] | TC4-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Deployment & Docs | - | + | TC4-1 | Deploy Script Path | Validasi kesesuaian path direktori pada skrip deploy.sh | Memastikan scripts/deploy.sh merujuk ke apps/api dan apps/habbit-tracker-web | Folder lama sudah dimigrasikan ke direktori apps/ | scripts/deploy.sh | 1. Periksa baris transfer scp pada `scripts/deploy.sh`.<br>2. Pastikan tidak ada referensi root `${ROOT_DIR}/backend` atau `${ROOT_DIR}/frontend` untuk sumber file transfer.<br>3. Pastikan build menggunakan `pnpm turbo run build`. | 1. Sumber file backend menunjuk `${ROOT_DIR}/apps/api/dist` dan `${ROOT_DIR}/apps/api/package.json`.<br>2. Sumber file frontend menunjuk `${ROOT_DIR}/apps/habbit-tracker-web/dist` dan `${ROOT_DIR}/apps/habbit-tracker-web/package.json`.<br>3. Tahap build memanggil turbo build. | Passed | scripts/deploy.sh baris 56, 77, 91 | Script deploy sinkron dengan monorepo | Masuk Test Step | 2026-10-08 | `scripts/deploy.sh` | PRD Scope 4 & ISSUES Fase 4 |
| 4 | Deployment & Docs | - | + | TC4-2 | Operational Documentation | Validasi dokumentasi panduan kerja AI dan developer pada AGENTS.md | Memastikan direktori, teknologi monorepo, dan perintah turbo tercatat akurat | AGENTS.md memuat panduan operasional proyek | AGENTS.md | 1. Periksa bagian Directory Structure pada AGENTS.md.<br>2. Periksa bagian Verified Commands untuk dev, build, lint, check-types, db:migrate.<br>3. Validasi bahwa seluruh petunjuk sesuai dengan struktur monorepo. | 1. AGENTS.md mencakup deskripsi @repo/api, @repo/habbit-tracker-web, @repo/types, @repo/ui, dan @repo/typescript-config.<br>2. Perintah pnpm dan turbo tercatat dengan benar. | Passed | AGENTS.md section 2, 3, 4 | Dokumentasi operasional valid | Masuk Test Step | 2026-10-08 | `AGENTS.md` | PRD Scope 4 & ISSUES Fase 4 |
