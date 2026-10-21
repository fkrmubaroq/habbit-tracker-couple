# Test Matrix — Harmonisasi Komponen UI Finance Tracker Web dengan @repo/ui

| PROGRAM VERSION RELEASE | 1.0.0 | TESTER | Antigravity QA Agent | TEST CASE CREATED AT | 2026-10-09 |
|---|---|---|---|---|---|
| FOLDER TEST APP | apps/finance-tracker-web | PROGRAMMER | Antigravity Dev Agent | TEST CASE UPDATED AT | 2026-10-09 |
| IP DEV | http://localhost:5174 | TASK DEV | - | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/todo/finance-web-repo-ui-components/PRD.md
**Scope:** Perluasan package @repo/ui (Button destructive, Input, Select, Textarea), sinkronisasi habbit-tracker-web, pembuatan wrapper ui di finance-tracker-web, refactor seluruh modal dialog dan elemen form/button/card di finance-tracker-web
**Out of scope:** Skema database & endpoint backend REST API, charting internals (Recharts), canvas-confetti, logika bisnis TanStack Query

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases
setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 25 | 25 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 25 | 0 | 25 | 0 | 100% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

## Test Cases

### PB-1 — Perluasan Komponen di @repo/ui

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Varian destructive pada Button di packages/ui/src/components/button.tsx | [x] | TC1-1 |
| 2 | Komponen Input di packages/ui/src/components/input.tsx dengan forwardRef dan neo-brutalist styling | [x] | TC1-2 |
| 3 | Komponen Select di packages/ui/src/components/select.tsx dengan icon ChevronDown | [x] | TC1-3 |
| 4 | Komponen Textarea di packages/ui/src/components/textarea.tsx dengan forwardRef | [x] | TC1-4 |
| 5 | Ekspor seluruh komponen baru pada packages/ui/src/index.ts dan scripts di package.json | [x] | TC1-5 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | UI Button | | + | TC1-1 | destructive variant | Verifikasi varian Button destructive | Tombol destructive menggunakan style merah neo-brutalist | packages/ui terpasang | `<Button variant="destructive">Hapus</Button>` | 1. Import Button dari packages/ui<br>2. Render dengan variant="destructive" | 1. Komponen ter-render tanpa error<br>2. Memiliki kelas bg-red-500, border-red-700, shadow neo-brutalist | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `packages/ui/src/components/button.tsx` | PRD Scope 1 |
| 1 | UI Input | | + | TC1-2 | input primitive | Verifikasi komponen Input | Input mendukung forwardRef dan style token tema | packages/ui terpasang | `<Input type="text" placeholder="Test" />` | 1. Import Input dari packages/ui<br>2. Teruskan ref dan properti input | 1. Input merender elemen HTML input<br>2. Memiliki token border-border-color dan font-semibold | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `packages/ui/src/components/input.tsx` | PRD Scope 1 |
| 1 | UI Select | | + | TC1-3 | select primitive | Verifikasi komponen Select | Select membungkus elemen native dan icon chevron | packages/ui terpasang | `<Select><option>Pilihan</option></Select>` | 1. Import Select dari packages/ui<br>2. Periksa wrapper dan chevron icon | 1. Select ter-render dengan wrapper relative<br>2. Icon ChevronDown tampil di sisi kanan | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `packages/ui/src/components/select.tsx` | PRD Scope 1 |
| 1 | UI Textarea | | + | TC1-4 | textarea primitive | Verifikasi komponen Textarea | Textarea mendukung multi-line input dengan forwardRef | packages/ui terpasang | `<Textarea rows={3} />` | 1. Import Textarea dari packages/ui<br>2. Render dengan props native | 1. Textarea ter-render dengan min-height 80px<br>2. Memiliki border-border-color dan bg-card-surface | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `packages/ui/src/components/textarea.tsx` | PRD Scope 1 |
| 1 | Package Exports | | + | TC1-5 | index exports | Verifikasi ekspor @repo/ui | Seluruh komponen primitif diekspor melalui index.ts | packages/ui index.ts terupdate | import { Button, Input, Select, Textarea, Card, Dialog } from "@repo/ui" | 1. Periksa index.ts<br>2. Jalankan check-types pada @repo/ui | 1. Semua modul diekspor lengkap<br>2. tsc --noEmit lolos 0 error | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `packages/ui/src/index.ts`, `packages/ui/package.json` | PRD Scope 1 |

### PB-2 — Sinkronisasi Form Primitives di habbit-tracker-web

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Re-export Input dari @repo/ui pada habbit-tracker-web | [x] | TC2-1 |
| 2 | Re-export Select dari @repo/ui pada habbit-tracker-web | [x] | TC2-2 |
| 3 | Re-export Textarea dari @repo/ui pada habbit-tracker-web | [x] | TC2-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Habbit Form Sync | | + | TC2-1 | re-export input | Verifikasi re-export Input di habbit-tracker-web | Input diekspor dari @repo/ui | @repo/ui terpasang di habbit-tracker-web | `export { Input } from "@repo/ui"` | 1. Buka apps/habbit-tracker-web/src/components/ui/input.tsx<br>2. Jalankan typecheck | 1. File mere-export Input dari @repo/ui<br>2. tsc lolos tanpa konflik tipe | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/src/components/ui/input.tsx` | PRD Scope 2 |
| 2 | Habbit Form Sync | | + | TC2-2 | re-export select | Verifikasi re-export Select di habbit-tracker-web | Select diekspor dari @repo/ui | @repo/ui terpasang di habbit-tracker-web | `export { Select } from "@repo/ui"` | 1. Buka apps/habbit-tracker-web/src/components/ui/select.tsx<br>2. Jalankan typecheck | 1. File mere-export Select dari @repo/ui<br>2. tsc lolos tanpa konflik tipe | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/src/components/ui/select.tsx` | PRD Scope 2 |
| 2 | Habbit Form Sync | | + | TC2-3 | re-export textarea | Verifikasi re-export Textarea di habbit-tracker-web | Textarea diekspor dari @repo/ui | @repo/ui terpasang di habbit-tracker-web | `export { Textarea } from "@repo/ui"` | 1. Buka apps/habbit-tracker-web/src/components/ui/textarea.tsx<br>2. Jalankan typecheck | 1. File mere-export Textarea dari @repo/ui<br>2. tsc lolos tanpa konflik tipe | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/habbit-tracker-web/src/components/ui/textarea.tsx` | PRD Scope 2 |

### PB-3 — Struktur UI Wrapper di finance-tracker-web

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Folder src/components/ui menyediakan wrapper re-export untuk Button, Dialog, Card, Input, Select, Textarea | [x] | TC3-1 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | UI Wrapper Folder | | + | TC3-1 | wrapper barrel | Verifikasi folder src/components/ui di finance-tracker-web | Seluruh 6 primitif UI tersedia via wrapper lokal dan index barrel | apps/finance-tracker-web/src/components/ui terbuat | `button.tsx, dialog.tsx, card.tsx, input.tsx, select.tsx, textarea.tsx, index.ts` | 1. Periksa keberadaan setiap file wrapper<br>2. Periksa isi ekspor @repo/ui | 1. Semua 7 file ada di folder ui<br>2. Seluruh modul mere-export komponen dari @repo/ui | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/ui/*` | PRD Scope 3 |

### PB-4 — Refactor Dialog Modals di finance-tracker-web

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | TransactionFormDialog menggunakan Radix Dialog dan form primitives | [x] | TC4-1 |
| 2 | DeleteCategoryDialog menggunakan Radix Dialog dan Button destructive | [x] | TC4-2 |
| 3 | Modal Buat/Edit Anggaran di budget.tsx menggunakan Radix Dialog | [x] | TC4-3 |
| 4 | Modal Tambah Aset di net-worth.tsx menggunakan Radix Dialog | [x] | TC4-4 |
| 5 | Modal Tambah Liabilitas di net-worth.tsx menggunakan Radix Dialog | [x] | TC4-5 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Transaction Dialog | | + | TC4-1 | Radix Dialog migration | Verifikasi TransactionFormDialog menggunakan Dialog @repo/ui | Modal transaksi mengadopsi Radix Dialog, Input, Select, Textarea, Button | Modal terbuka saat isTransactionModalOpen=true | Transaksi Pengeluaran Rp 50.000 | 1. Buka TransactionFormDialog.tsx<br>2. Periksa komponen Dialog & Button<br>3. Pastikan tidak ada raw fixed inset-0 overlay | 1. Menggunakan Dialog & DialogContent<br>2. Menggunakan Input, Select, Textarea, Button<br>3. Zero manual fixed overlay | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx` | PRD Scope 4 |
| 4 | Delete Category Dialog | | + | TC4-2 | Radix Dialog & Destructive | Verifikasi DeleteCategoryDialog menggunakan Dialog dan Button destructive | Modal hapus kategori mengadopsi Radix Dialog dan varian destructive | Kategori memiliki transaksi terkait | Kategori pengganti | 1. Buka DeleteCategoryDialog.tsx<br>2. Periksa tombol aksi konfirmasi hapus | 1. Menggunakan Dialog & DialogContent<br>2. Tombol konfirmasi menggunakan variant="destructive"<br>3. Zero manual fixed overlay | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/DeleteCategoryDialog.tsx` | PRD Scope 4 |
| 4 | Budget Modal | | + | TC4-3 | Radix Dialog migration | Verifikasi modal anggaran di budget.tsx | Modal anggaran mengadopsi Radix Dialog, Select, Input, Button | Halaman /budget dibuka | Anggaran Rp 1.500.000 | 1. Buka routes/budget.tsx<br>2. Periksa modal add/edit budget | 1. Menggunakan Dialog, Select, Input, Button<br>2. Zero manual fixed overlay | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/budget.tsx` | PRD Scope 4 |
| 4 | Net Worth Asset Modal | | + | TC4-4 | Radix Dialog migration | Verifikasi modal tambah aset di net-worth.tsx | Modal aset mengadopsi Radix Dialog, Input, Select, Button | Halaman /net-worth dibuka | Aset Tabungan Rp 10.000.000 | 1. Buka routes/net-worth.tsx<br>2. Periksa modal add asset | 1. Menggunakan Dialog, Input, Select, Button<br>2. Zero manual fixed overlay | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/net-worth.tsx` | PRD Scope 4 |
| 4 | Net Worth Liability Modal | | + | TC4-5 | Radix Dialog migration | Verifikasi modal tambah liabilitas di net-worth.tsx | Modal liabilitas mengadopsi Radix Dialog, Input, Select, Button | Halaman /net-worth dibuka | Hutang Cicilan Rp 5.000.000 | 1. Buka routes/net-worth.tsx<br>2. Periksa modal add liability | 1. Menggunakan Dialog, Input, Select, Button<br>2. Zero manual fixed overlay | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/net-worth.tsx` | PRD Scope 4 |

### PB-5 — Refactor Halaman & Komponen di finance-tracker-web

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Halaman transactions.tsx mengadopsi Button, Input, Select, dan Card | [x] | TC5-1 |
| 2 | Komponen BudgetCard.tsx mengadopsi Card dan Button | [x] | TC5-2 |
| 3 | Halaman budget.tsx mengadopsi Card dan Button | [x] | TC5-3 |
| 4 | Halaman net-worth.tsx mengadopsi Card dan Button | [x] | TC5-4 |
| 5 | Halaman settings.tsx mengadopsi Card, Input, dan Button | [x] | TC5-5 |
| 6 | Halaman reports.tsx mengadopsi Card dan Button | [x] | TC5-6 |
| 7 | Halaman index.tsx mengadopsi Card dan Button | [x] | TC5-7 |
| 8 | Layout __root.tsx dan ThemeSwitcher.tsx mengadopsi Button dan Card | [x] | TC5-8 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | Transactions Page | | + | TC5-1 | Page component refactor | Verifikasi integrasi @repo/ui pada transactions.tsx | Halaman transaksi menggunakan Button, Input, Select, Card | Rute /transactions diakses | Filter periode, keyword, tipe | 1. Periksa elemen filter periode<br>2. Periksa kotak pencarian dan dropdown kategori | 1. Tombol filter menggunakan Button<br>2. Search menggunakan Input<br>3. Dropdown menggunakan Select<br>4. Toolbar dibungkus Card | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/transactions.tsx` | PRD Scope 5 |
| 5 | Budget Card | | + | TC5-2 | Component refactor | Verifikasi integrasi @repo/ui pada BudgetCard.tsx | Kartu anggaran menggunakan Card dan Button | Rute /budget memiliki data anggaran | Data budget | 1. Buka BudgetCard.tsx<br>2. Periksa container dan tombol edit/delete | 1. Container menggunakan Card<br>2. Tombol aksi menggunakan Button ghost | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/BudgetCard.tsx` | PRD Scope 5 |
| 5 | Budget Page | | + | TC5-3 | Page component refactor | Verifikasi integrasi @repo/ui pada budget.tsx | Halaman anggaran menggunakan Card dan Button | Rute /budget diakses | Ringkasan anggaran | 1. Periksa kartu ringkasan total<br>2. Periksa tombol navigasi bulan dan tambah anggaran | 1. Hero overview menggunakan Card<br>2. Tombol navigasi dan aksi menggunakan Button | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/budget.tsx` | PRD Scope 5 |
| 5 | Net Worth Page | | + | TC5-4 | Page component refactor | Verifikasi integrasi @repo/ui pada net-worth.tsx | Halaman kekayaan bersih menggunakan Card dan Button | Rute /net-worth diakses | Data aset dan liabilitas | 1. Periksa kartu total net worth<br>2. Periksa daftar aset dan liabilitas | 1. Container utama menggunakan Card<br>2. Tombol tambah aset/hutang dan delete menggunakan Button | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/net-worth.tsx` | PRD Scope 5 |
| 5 | Settings Page | | + | TC5-5 | Page component refactor | Verifikasi integrasi @repo/ui pada settings.tsx | Halaman pengaturan menggunakan Card, Input, Button | Rute /settings diakses | Saldo awal dan nama kategori | 1. Periksa form saldo awal<br>2. Periksa form tambah kategori | 1. Section dibungkus Card<br>2. Form menggunakan Input<br>3. Tombol simpan menggunakan Button | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/settings.tsx` | PRD Scope 5 |
| 5 | Reports Page | | + | TC5-6 | Page component refactor | Verifikasi integrasi @repo/ui pada reports.tsx | Halaman laporan menggunakan Card dan Button | Rute /reports diakses | Data laporan bulanan | 1. Periksa kartu metrik arus kas<br>2. Periksa container grafik dan tombol preset | 1. Metric card dan chart card menggunakan Card<br>2. Filter periode menggunakan Button | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/reports.tsx` | PRD Scope 5 |
| 5 | Dashboard Page | | + | TC5-7 | Page component refactor | Verifikasi integrasi @repo/ui pada index.tsx | Dashboard utama menggunakan Card dan Button | Rute / diakses | Ringkasan saldo dan transaksi | 1. Periksa tombol aksi cepat<br>2. Periksa kartu saldo, net worth, budget, dan transaksi | 1. Quick action menggunakan Button<br>2. Seluruh widget dashboard menggunakan Card | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/index.tsx` | PRD Scope 5 |
| 5 | Layout & Theme | | + | TC5-8 | Layout component refactor | Verifikasi integrasi @repo/ui pada __root.tsx & ThemeSwitcher.tsx | Sidebar, header mobile, dan tema switcher menggunakan Button & Card | Seluruh rute aplikasi | Navigasi & toggle tema | 1. Periksa sidebar action button<br>2. Periksa ThemeSwitcherSection & QuickThemeToggle | 1. Sidebar & header action menggunakan Button<br>2. ThemeSwitcherSection menggunakan Card<br>3. QuickThemeToggle menggunakan Button | Passed | test:finance-ui | Terverifikasi via qa-ui-components-runner.mjs | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/__root.tsx`, `apps/finance-tracker-web/src/components/ThemeSwitcher.tsx` | PRD Scope 5 |

### PB-6 — Monorepo Quality Gates

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Monorepo type-checking lolos tanpa error pada seluruh workspace | [x] | TC6-1 |
| 2 | Monorepo linter lolos tanpa error pada seluruh workspace | [x] | TC6-2 |
| 3 | Monorepo build produksi berhasil mengompilasi seluruh aplikasi dan package | [x] | TC6-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Quality Gates | | + | TC6-1 | Type-checking | Verifikasi typecheck monorepo | Eksekusi tsc --noEmit lolos 0 error di seluruh package | Seluruh modifikasi kode selesai | `pnpm check-types` | 1. Jalankan `pnpm check-types`<br>2. Periksa status exit code | 1. 5 task sukses dijalankan<br>2. Exit code 0, 0 error | Passed | check-types | Berhasil di 8 package | Masuk Test Step | 2026-10-09 | Monorepo root | PRD Quality Gate |
| 6 | Quality Gates | | + | TC6-2 | Linting | Verifikasi linter monorepo | Eksekusi linter lolos 0 error di seluruh package | Seluruh modifikasi kode selesai | `pnpm lint` | 1. Jalankan `pnpm lint`<br>2. Periksa status exit code | 1. 5 task sukses dijalankan<br>2. Exit code 0, 0 error | Passed | lint | Berhasil di seluruh workspace | Masuk Test Step | 2026-10-09 | Monorepo root | PRD Quality Gate |
| 6 | Quality Gates | | + | TC6-3 | Build | Verifikasi build produksi | Eksekusi build produksi mengompilasi seluruh package dan apps | Seluruh modifikasi kode selesai | `pnpm build` | 1. Jalankan `pnpm build`<br>2. Periksa artefak dist/ di web & api | 1. 4 task sukses dijalankan<br>2. Dist artefak ter-generate sempurna | Passed | build | Berhasil mengompilasi web & api | Masuk Test Step | 2026-10-09 | Monorepo root | PRD Quality Gate |
