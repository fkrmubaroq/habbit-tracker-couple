# Test Matrix — Rename apps/api Menjadi apps/habbit-tracker-api

| PROGRAM VERSION RELEASE | - | TESTER | QA Agent | TEST CASE CREATED AT | 2026-10-09 |
|---|---|---|---|---|---|
| FOLDER TEST APP | apps/habbit-tracker-api, apps/* | PROGRAMMER | Antigravity | TEST CASE UPDATED AT | 2026-10-09 |
| IP DEV | localhost:1906, localhost:5173 | TASK DEV | Refactor Folder & Package API | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/todo/rename-api-to-habbit-tracker-api/PRD.md, docs/prd/todo/rename-api-to-habbit-tracker-api/ISSUES.md  
**Scope:** Pemindahan direktori apps/api ke apps/habbit-tracker-api, pembaruan package.json @repo/habbit-tracker-api, root scripts, scripts/deploy.sh, AGENTS.md, verifikasi build & type-checking  
**Out of scope:** Perubahan logika REST API, routing, database schema, migrasi database runtime  

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 7 | 7 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 7 | 0 | 7 | 0 | 100% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

## Test Cases

### PB-1 — Pemindahan Direktori & Metadata Package

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi pemindahan seluruh berkas ke apps/habbit-tracker-api dan ketiadaan folder lama apps/api | [x] | TC1-1 |
| 2 | Validasi atribut name @repo/habbit-tracker-api pada package.json backend | [x] | TC1-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | File Structure | - | + | TC1-1 | Directory Rename | Verifikasi pemindahan direktori dan status git | Memastikan seluruh berkas backend berada di apps/habbit-tracker-api dan apps/api tidak ada lagi | Folder apps/api telah dimigrasikan via git mv | Git status & Test-Path | 1. Periksa ketiadaan folder `apps/api`.<br>2. Periksa keberadaan `apps/habbit-tracker-api/src/index.ts` dan file konfigurasi.<br>3. Jalankan `git status --short`. | 1. `apps/api` tidak ditemukan.<br>2. Seluruh file berada di `apps/habbit-tracker-api`.<br>3. Git mencatat operasi rename dengan bersih. | Passed | git status short | Direktori berpindah sempurna | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-api` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Package Metadata | - | + | TC1-2 | Package Identity | Validasi name package @repo/habbit-tracker-api | Memastikan package.json backend mendeklarasikan nama baru yang valid | Berkas package.json telah diperbarui | apps/habbit-tracker-api/package.json | 1. Buka `apps/habbit-tracker-api/package.json`.<br>2. Periksa field `name`.<br>3. Jalankan `pnpm install` untuk memeriksa resolusi workspace. | 1. Nilai `name` adalah `@repo/habbit-tracker-api`.<br>2. Resolusi workspace pnpm sukses tanpa error. | Passed | pnpm install output | Package name terdaftar di workspace | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-api/package.json` | PRD Scope 2 & ISSUES Fase 1 |

### PB-2 — Root Scripts & Task Orchestration

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi pembaruan filter script db:migrate dan db:seed di root package.json | [x] | TC2-1 |
| 2 | Validasi registrasi task graph Turborepo untuk @repo/habbit-tracker-api | [x] | TC2-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Root Scripts | - | + | TC2-1 | Script Filter | Validasi target script root package.json | Memastikan perintah filter menargetkan package backend baru | root package.json telah dimodifikasi | package.json | 1. Buka `package.json` di root.<br>2. Periksa baris `db:migrate` dan `db:seed`. | Baris perintah menggunakan `--filter=@repo/habbit-tracker-api`. | Passed | package.json lines 9-10 | Filter command akurat | Masuk Test Step | 2026-10-09 | `package.json` | PRD Scope 3 & ISSUES Fase 2 |
| 2 | Task Graph | - | + | TC2-2 | Turbo Task Graph | Validasi graph eksekusi dev Turborepo | Memastikan Turborepo mengenali @repo/habbit-tracker-api dalam pipeline | turbo.json aktif di workspace | pnpm turbo run dev --dry=json | 1. Jalankan `pnpm turbo run dev --dry=json`.<br>2. Cari task `@repo/habbit-tracker-api#dev`. | Task `@repo/habbit-tracker-api#dev` ditemukan dan berstatus valid. | Passed | Turbo dry-run output | Orchestrator mendeteksi package baru | Masuk Test Step | 2026-10-09 | `turbo.json`, `package.json` | PRD Scope 3 & ISSUES Fase 2 |

### PB-3 — Deployment Script & Panduan Operasional

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi sinkronisasi path transfer backend pada scripts/deploy.sh | [x] | TC3-1 |
| 2 | Validasi akurasi panduan perintah dan struktur folder di AGENTS.md | [x] | TC3-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | Deployment | - | + | TC3-1 | Deploy Script Path | Validasi kesesuaian target direktori deploy | Memastikan skrip deployment tidak menyisakan path direktori lama apps/api | scripts/deploy.sh telah diperbarui | scripts/deploy.sh | 1. Periksa bagian transfer file backend di `scripts/deploy.sh`.<br>2. Pastikan path menunjuk ke `${ROOT_DIR}/apps/habbit-tracker-api/`. | Seluruh perintah `scp` backend menggunakan path `apps/habbit-tracker-api`. | Passed | scripts/deploy.sh baris 76-88 | Path deploy valid | Masuk Test Step | 2026-10-09 | `scripts/deploy.sh` | PRD Scope 4 & ISSUES Fase 3 |
| 3 | Documentation | - | + | TC3-2 | Operational Guide | Validasi instruksi perintah agen dan developer | Memastikan AGENTS.md memuat filter command dan struktur direktori yang benar | AGENTS.md telah disinkronkan | AGENTS.md | 1. Periksa bagian Verified Commands di `AGENTS.md`.<br>2. Periksa bagian Key Directory Structure. | Seluruh referensi menggunakan `apps/habbit-tracker-api` dan `@repo/habbit-tracker-api`. | Passed | AGENTS.md section 1-5 | Dokumentasi akurat | Masuk Test Step | 2026-10-09 | `AGENTS.md` | PRD Scope 4 & ISSUES Fase 3 |

### PB-4 — Verifikasi Kompilasi & Build Pipeline

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi kompilasi build dan type checking @repo/habbit-tracker-api | [x] | TC4-1 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Build & Types | - | + | TC4-1 | Build Pipeline | Eksekusi build dan type checking workspace | Memastikan backend terkompilasi ke dist/ tanpa kesalahan TypeScript | Dependensi workspace terhubung | pnpm check-types && pnpm build | 1. Jalankan `pnpm check-types`.<br>2. Jalankan `pnpm build`.<br>3. Periksa keberadaan `apps/habbit-tracker-api/dist/index.js`. | 1. Type checking lolos 0 errors.<br>2. Build berhasil dengan output berkas di dist/. | Passed | Tasks: 2 successful (check-types & build) | Kompilasi tsc backend sukses | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-api/dist` | PRD Scope 4 & ISSUES Fase 4 |
