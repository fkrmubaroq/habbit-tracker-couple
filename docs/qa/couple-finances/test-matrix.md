# Test Matrix — Couple Finance Tracker

| PROGRAM VERSION RELEASE | - | TESTER | QA Agent | TEST CASE CREATED AT | 2026-10-09 |
|---|---|---|---|---|---|
| FOLDER TEST APP | apps/finance-tracker-api, apps/finance-tracker-web, packages/types | PROGRAMMER | Antigravity | TEST CASE UPDATED AT | 2026-10-09 |
| IP DEV | localhost:1907, localhost:5175 | TASK DEV | Couple Finance Tracker | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/todo/couple-finances/PRD.md, docs/prd/todo/couple-finances/ISSUES.md  
**Scope:** Backend REST API (`apps/finance-tracker-api`), Frontend SPA (`apps/finance-tracker-web`), Shared types & DTO contract (`@repo/types`), migrasi skema database & seeding, manajemen transaksi pemasukan & pengeluaran, saldo berjalan (*running balance*), sistem budgeting per kategori, agregasi laporan & grafik visual, pelacakan kekayaan bersih (*net worth*), proteksi hapus kategori dengan pengalihan transaksi (*reassign*), dan quality gates monorepo.  
**Out of scope:** Integrasi Open Banking API / koneksi bank langsung, OCR nota/struk belanja otomatis, dukungan multi-currency selain IDR.

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 33 | 33 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 33 | 0 | 33 | 0 | 100% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

## Test Cases

### PB-1 — Shared Contracts & Database Migrations

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Ekspor shared types, DTO, dan schema validasi Zod modul finance pada @repo/types | [x] | TC1-1 |
| 2 | Eksekusi migrasi skema database 001-finance-schema.sql untuk 6 tabel finansial | [x] | TC1-2 |
| 3 | Eksekusi seed kategori awal untuk 16 kategori bawaan lengkap dengan ikon dan warna | [x] | TC1-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Shared Contracts | - | + | TC1-1 | Type Definitions | Validasi kelengkapan kontrak tipe dan Zod schema | Memastikan @repo/types mengekspor FinanceTransaction, FinanceCategory, FinanceBudget, FinanceAsset, FinanceLiability, dan FinanceOverview | Package @repo/types di-build | packages/types/src/finance.ts | 1. Buka `packages/types/src/finance.ts`.<br>2. Periksa definisi interface dan schema Zod.<br>3. Jalankan type checking. | 1. Seluruh interface dan DTO diekspor tanpa error.<br>2. Schema validasi Zod siap digunakan backend dan frontend. | Passed | packages/types/src/index.ts | Tipe data shared valid | Masuk Test Step | 2026-10-09 | `packages/types/src/finance.ts` | PRD Scope 1 & ISSUES Fase 1 |
| 1 | Database Migrations | - | + | TC1-2 | Schema Execution | Validasi eksekusi migrasi tabel finansial pada database | Memastikan 6 tabel finansial dibuat dengan struktur kolom dan foreign key yang benar | Server database MySQL berjalan | migrations/001-finance-schema.sql | 1. Eksekusi `pnpm --filter=@repo/finance-tracker-api db:migrate`.<br>2. Periksa keberadaan tabel di database. | Tabel finance_settings, finance_categories, finance_transactions, finance_budgets, finance_assets, dan finance_liabilities terbentuk sukses. | Passed | Migration execution log | Skema database terpasang | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/migrations/001-finance-schema.sql` | PRD Scope 2 & ISSUES Fase 2 |
| 1 | Category Seeding | - | + | TC1-3 | Seed Data | Validasi ketersediaan kategori default | Memastikan 16 kategori bawaan (12 expense, 4 income) tersedia | Migrasi database selesai | migrations/seed.ts | 1. Jalankan `pnpm --filter=@repo/finance-tracker-api db:seed`.<br>2. Panggil `GET /api/categories`. | Kategori default (Gaji, Makanan, Transportasi, Belanja, dll) tersedia lengkap dengan ikon Lucide dan warna Tailwind. | Passed | HTTP GET /api/categories (16 items) | Seeding default kategori sukses | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/migrations/seed.ts` | PRD Scope 2 & ISSUES Fase 2 |

### PB-2 — Backend REST API Core

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Endpoint Health Check dan konektivitas database | [x] | TC2-1 |
| 2 | Pengaturan Saldo Awal GET dan PUT /api/settings | [x] | TC2-2 |
| 3 | Pembuatan kategori kustom POST /api/categories | [x] | TC2-3 |
| 4 | Proteksi penghapusan kategori tanpa kategori pengganti jika memiliki transaksi | [x] | TC2-4 |
| 5 | Penghapusan kategori dengan pengalihan transaksi ke kategori pengganti (reassign) | [x] | TC2-5 |
| 6 | Pencatatan transaksi baru (Income & Expense) dengan validasi Zod | [x] | TC2-6 |
| 7 | Validasi gagal pencatatan transaksi saat data tidak valid | [x] | TC2-7 |
| 8 | Filter dan pencarian transaksi berdasarkan tipe, kategori, tanggal, dan keyword | [x] | TC2-8 |
| 9 | Pembaruan dan penghapusan transaksi | [x] | TC2-9 |
| 10 | Kalkulasi ringkasan overview (Saldo Berjalan, Cash Flow, Budget Progress) | [x] | TC2-10 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | System Health | - | + | TC2-1 | Health Ping | Validasi ketersediaan server dan database | Memastikan endpoint /health merespons status OK | Server backend berjalan di port 1907 | GET /health | 1. Kirim HTTP GET ke `http://localhost:1907/health`.<br>2. Periksa response code dan body. | Status HTTP 200, status "ok", service "finance-tracker-api", database "connected". | Passed | HTTP 200 { status: 'ok', database: 'connected' } | Server sehat dan terhubung DB | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/app.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Settings API | - | + | TC2-2 | Initial Balance | Pengujian pembacaan dan pembaruan saldo awal keluarga | Memastikan saldo awal tersimpan dan diperbarui pada finance_settings | Pengguna terautentikasi | PUT /api/settings { initial_balance: 5000000 } | 1. Panggil `GET /api/settings`.<br>2. Panggil `PUT /api/settings` dengan saldo baru.<br>3. Verifikasi response. | Saldo awal berhasil disimpan dan nilai baru ter-update menjadi 5.000.000. | Passed | HTTP 200 { initial_balance: 5000000 } | Pengaturan saldo awal tersimpan | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Category API | - | + | TC2-3 | Category Creation | Pengujian penambahan kategori kustom baru | Memastikan kategori kustom tersimpan dengan tipe dan warna yang dipilih | Saldo awal tersetel | POST /api/categories | 1. Kirim request POST ke `/api/categories` dengan payload nama, icon, color, type.<br>2. Periksa response. | Status HTTP 201, kategori kustom baru dibuat dan memiliki id unik. | Passed | HTTP 201 { success: true, data: { name: 'Cat-Expense-A' } } | Kategori baru tersimpan | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Category Deletion | - | - | TC2-4 | Protection Check | Pengujian proteksi hapus kategori saat memiliki transaksi tertaut | Memastikan sistem menolak penghapusan kategori tanpa pengganti bila ada transaksi tertaut | Transaksi tertaut pada kategori A | DELETE /api/categories/:id | 1. Buat transaksi pada kategori A.<br>2. Kirim request `DELETE /api/categories/:id` tanpa replacementCategoryId. | Status HTTP 400 dengan error bahwa kategori memiliki transaksi dan flag hasTransactions: true. | Passed | HTTP 400 { hasTransactions: true } | Proteksi integritas data berhasil | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Category Deletion | - | + | TC2-5 | Reassign Flow | Pengujian penghapusan kategori dengan pengalihan transaksi | Memastikan seluruh transaksi dialihkan ke kategori pengganti saat kategori dihapus | Kategori A dan Kategori B tersedia | DELETE /api/categories/:catA?replacement_id=:catB | 1. Kirim request DELETE dengan replacement_id kategori B.<br>2. Verifikasi status response.<br>3. Periksa kategori transaksi terkait. | 1. Status HTTP 200.<br>2. Kategori A dihapus.<br>3. Transaksi otomatis beralih ke kategori B. | Passed | HTTP 200 & transaksi category_id = catB | Reassign transaksi berhasil | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.repository.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Transactions API | - | + | TC2-6 | Record Transaction | Pengujian pencatatan transaksi pemasukan dan pengeluaran | Memastikan transaksi tersimpan dengan nominal, kategori, dan deskripsi | Kategori tersedia | POST /api/transactions | 1. POST transaksi Income nominal 10.000.000.<br>2. POST transaksi Expense nominal 2.500.000.<br>3. Periksa response. | Transaksi tercatat dengan status HTTP 201 dan data tersimpan lengkap. | Passed | HTTP 201 Created | Transaksi berhasil dicatat | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Transactions API | - | - | TC2-7 | Zod Validation | Pengujian validasi penolakan data transaksi tidak valid | Memastikan transaksi ditolak bila deskripsi kosong atau nominal <= 0 | Server aktif | POST /api/transactions { amount: -50000, description: '' } | 1. Kirim POST transaksi dengan nominal negatif dan deskripsi kosong.<br>2. Periksa response. | Status HTTP 400, pesan validasi kegagalan input deskripsi dan nominal. | Passed | HTTP 400 { success: false, details: [...] } | Validasi Zod menolak input invalid | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.schema.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Transactions API | - | + | TC2-8 | Search & Filter | Pengujian filter transaksi berdasarkan kata kunci dan tipe | Memastikan endpoint GET /api/transactions menyaring transaksi secara akurat | Transaksi tersimpan | GET /api/transactions?search=...&type=expense | 1. Kirim GET request dengan query pencarian dan tipe.<br>2. Periksa daftar transaksi yang dikembalikan. | Hanya transaksi yang cocok dengan kata kunci dan bertipe expense yang dikembalikan. | Passed | HTTP 200 (filtered items match query) | Filter & search bekerja presisi | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.repository.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Transactions API | - | + | TC2-9 | Update Transaction | Pengujian pembaruan nominal dan catatan transaksi | Memastikan perubahan transaksi tersimpan dan merefleksikan data terkini | Transaksi ada | PUT /api/transactions/:id { amount: 3200000 } | 1. Kirim PUT request ke `/api/transactions/:id` dengan nominal baru.<br>2. Periksa response data. | Status HTTP 200, nominal transaksi ter-update menjadi 3.200.000. | Passed | HTTP 200 { data: { amount: 3200000 } } | Update transaksi berhasil | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 3 |
| 2 | Overview API | - | + | TC2-10 | Balance Calculation | Pengujian rumus saldo berjalan: Saldo Awal + Total Income - Total Expense | Memastikan saldo berjalan dihitung akurat berdasarkan agregasi transaksi | Saldo awal 5jt, Income 10jt, Expense 2.5jt | GET /api/overview | 1. Panggil `GET /api/overview`.<br>2. Periksa nilai current_balance dan net_cash_flow_this_month. | current_balance bernilai 12.500.000 dan net_cash_flow_this_month bernilai 7.500.000. | Passed | HTTP 200 current_balance = 12500000 | Kalkulasi saldo berjalan akurat | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.repository.ts` | PRD Scope 2 & ISSUES Fase 3 |

### PB-3 — Frontend Layout & Dashboard Finansial

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Layout responsif Desktop (Sidebar) dan Mobile (Bottom Navigation) | [x] | TC3-1 |
| 2 | Kartu Saldo Berjalan dan indikator Cash Flow bulanan | [x] | TC3-2 |
| 3 | Widget transaksi terkini dan ringkasan budget pada dashboard | [x] | TC3-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | Responsive Navigation | - | + | TC3-1 | Viewport Mode | Pengujian navigasi adaptif desktop dan perangkat seluler | Memastikan Sidebar muncul pada layar lebar dan Bottom Nav muncul pada layar mobile | Aplikasi web aktif di port 5175 | Viewport 1280px vs 375px | 1. Buka rute root `__root.tsx`.<br>2. Verifikasi sidebar navigasi desktop.<br>3. Verifikasi bottom nav mobile. | Navigasi berpindah secara mulus tanpa layout glitch, semua tautan rute berfungsi. | Passed | `__root.tsx` desktop sidebar & mobile nav | Layout responsif terverifikasi | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/__root.tsx` | PRD Scope 3 & ISSUES Fase 4 |
| 3 | Dashboard Cards | - | + | TC3-2 | Currency Display | Pengujian kartu Saldo Berjalan, Pemasukan, dan Pengeluaran | Memastikan nominal uang terformat Rupiah (Rp) dengan ikon indikator tren yang sesuai | Data overview termuat | GET /api/overview | 1. Buka Dashboard di `/`.<br>2. Periksa kartu Saldo Berjalan, Pemasukan, Pengeluaran, dan Net Cash Flow. | Angka terformat rapi dengan pemisah ribuan Rupiah, indikator hijau untuk surplus dan merah untuk defisit. | Passed | `routes/index.tsx` hero card rendering | Kartu saldo berjalan tampil prima | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/index.tsx` | PRD Scope 3 & ISSUES Fase 8 |
| 3 | Dashboard Summary | - | + | TC3-3 | Widgets | Pengujian widget 5 transaksi terbaru dan ringkasan anggaran | Memastikan transaksi terkini dan progress budget teratas tampil di dashboard | Data transaksi dan budget ada | Dashboard route | 1. Buka Dashboard di `/`.<br>2. Scroll ke bagian transaksi terbaru dan budget progress. | 5 transaksi terbaru tampil dengan badge kategori, widget budget menampilkan progress bar. | Passed | `routes/index.tsx` widgets block | Widget transaksi dan budget tampil | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/index.tsx` | PRD Scope 3 & ISSUES Fase 8 |

### PB-4 — Manajemen & Riwayat Transaksi

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Modal dialog pencatatan transaksi menggunakan react-hook-form dan Controller | [x] | TC4-1 |
| 2 | Halaman riwayat transaksi dengan filter tipe, kategori, dan rentang tanggal | [x] | TC4-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Transaction Form | - | + | TC4-1 | Form Validation | Pengujian modal form tambah transaksi dengan react-hook-form | Memastikan form mendukung tab Income/Expense, format otomatis input Rupiah, dan validasi Zod | Modal terbuka | TransactionFormDialog | 1. Klik tombol "+ Catat Transaksi".<br>2. Pilih tipe transaksi.<br>3. Ketik nominal uang.<br>4. Pilih kategori dan simpan. | Form memformat nominal Rupiah, memvalidasi input wajib, dan memicu refetch data via TanStack Query. | Passed | `TransactionFormDialog.tsx` | Modal form berfungsi lancar | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx` | PRD Scope 3 & ISSUES Fase 5 |
| 4 | Transaction History | - | + | TC4-2 | Filter & Search | Pengujian riwayat transaksi lengkap dengan filter interaktif | Memastikan transaksi dapat difilter berdasarkan Semua, Pemasukan, Pengeluaran, kategori, dan tanggal | Riwayat transaksi ada | `/transactions` route | 1. Buka halaman `/transactions`.<br>2. Ubah tab filter tipe.<br>3. Masukkan kata kunci pencarian. | Tabel riwayat menampilkan daftar transaksi yang sesuai dengan kriteria filter secara reaktif. | Passed | `routes/transactions.tsx` | Riwayat dan filter transaksi bekerja | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/transactions.tsx` | PRD Scope 3 & ISSUES Fase 5 |

### PB-5 — Budgeting & Monitoring Anggaran

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Pengaturan batas anggaran per kategori bulanan POST /api/budgets | [x] | TC5-1 |
| 2 | Pembaruan batas anggaran dan visualisasi status budget (Aman, Peringatan, Bahaya) | [x] | TC5-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | Budget Allocation | - | + | TC5-1 | Monthly Limit | Pengujian alokasi anggaran bulanan per kategori | Memastikan batas budget tersimpan dan persentase penggunaan terhitung terhadap pengeluaran aktual | Kategori pengeluaran ada | POST /api/budgets { amount: 3000000, month_year: '2026-10' } | 1. Kirim POST /api/budgets dengan nominal batas 3jt.<br>2. Periksa data budget pada GET /api/budgets. | Budget tersimpan, nominal terpakai (spent) dan persentase terhitung otomatis (83%). | Passed | HTTP 201 Created & GET /api/budgets | Alokasi anggaran berhasil | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.repository.ts` | PRD Scope 2 & ISSUES Fase 6 |
| 5 | Budget Monitoring | - | + | TC5-2 | Status Indicators | Pengujian visualisasi status budget (Aman <= 75%, Peringatan 75-100%, Melebihi > 100%) | Memastikan kartu budget menampilkan progress bar dan badge warna status yang akurat | Budget terpasang | PUT /api/budgets/:id { amount: 5000000 } | 1. Buka rute `/budget`.<br>2. Periksa kartu anggaran kategori.<br>3. Perbarui nominal batas menjadi 5jt. | Kartu budget merender warna progress bar dinamis (Kuning saat mendekati batas, Hijau saat longgar, Merah saat overbudget). | Passed | `BudgetCard.tsx` rendering & PUT /api/budgets/:id | Indikator visual budget akurat | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/BudgetCard.tsx` | PRD Scope 3 & ISSUES Fase 6 |

### PB-6 — Laporan Finansial & Visualisasi Grafik

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Agregasi data laporan periode GET /api/reports (rata-rata pengeluaran harian, total income & expense) | [x] | TC6-1 |
| 2 | Visualisasi Donut Chart kategori pengeluaran dan Bar Chart tren arus kas | [x] | TC6-2 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Reports API | - | + | TC6-1 | Aggregation | Pengujian endpoint agregasi laporan periode rentang tanggal | Memastikan total pemasukan, pengeluaran, net cash flow, dan rata-rata pengeluaran harian teragregasi | Transaksi dalam rentang tanggal | GET /api/reports?startDate=...&endDate=... | 1. Panggil GET `/api/reports` dengan query rentang tanggal.<br>2. Verifikasi metrik agregasi. | Data period, total_income, total_expense, net_cash_flow, average_daily_expense, dan trend terhitung tepat. | Passed | HTTP 200 { total_income: 10jt, total_expense: 2.5jt, net: 7.5jt } | Agregasi laporan valid | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.repository.ts` | PRD Scope 2 & ISSUES Fase 7 |
| 6 | Finance Charts | - | + | TC6-2 | Recharts Components | Pengujian rendering grafik Donut Chart kategori dan Bar Chart arus kas | Memastikan komponen Recharts merender visualisasi data secara responsif | Data laporan tersedia | `/reports` route | 1. Buka halaman `/reports`.<br>2. Periksa visualisasi Donut Chart dan Bar Chart. | Grafik terender responsif dengan tooltip informatif, legend, dan palet warna kategori. | Passed | `FinanceCharts.tsx` & `routes/reports.tsx` | Visualisasi grafik tampil sempurna | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/FinanceCharts.tsx` | PRD Scope 3 & ISSUES Fase 7 |

### PB-7 — Net Worth & Pengaturan Kategori

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Kalkulasi Net Worth = Saldo Kas Berjalan + Total Aset Manual - Total Liabilitas Manual | [x] | TC7-1 |
| 2 | Pengelolaan aset dan kewajiban manual (CRUD) | [x] | TC7-2 |
| 3 | Pengaturan saldo awal dan modal konfirmasi pengalihan kategori saat penghapusan | [x] | TC7-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Net Worth Logic | - | + | TC7-1 | Net Worth Formula | Pengujian kalkulasi kekayaan bersih terpadu | Memastikan saldo kas berjalan otomatis diakui sebagai aset likuid dan dihitung bersama aset/liabilitas | Saldo kas 12.5jt, Aset 20jt, Liabilitas 5jt | GET /api/net-worth | 1. Panggil `GET /api/net-worth`.<br>2. Verifikasi liquid_cash, manual_assets_total, total_liabilities, dan net_worth. | liquid_cash = 12.500.000, manual_assets_total = 20.000.000, total_assets = 32.500.000, net_worth = 27.500.000. | Passed | HTTP 200 { net_worth: 27500000 } | Kalkulasi Net Worth akurat | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-api/src/modules/finance/finance.controller.ts` | PRD Scope 2 & ISSUES Fase 8 |
| 7 | Assets & Liabilities | - | + | TC7-2 | Asset/Debt CRUD | Pengujian penambahan, pembaruan, dan penghapusan aset/liabilitas | Memastikan pengguna dapat mengelola pos aset tabungan/investasi dan pos hutang | Halaman Net Worth | POST/PUT/DELETE /api/assets & /api/liabilities | 1. Tambah pos aset baru.<br>2. Perbarui nilai valuasi aset.<br>3. Hapus pos kewajiban yang lunas. | Aset dan liabilitas diperbarui secara instan dan mengubah total Net Worth secara reaktif. | Passed | `routes/net-worth.tsx` & API CRUD | Pengelolaan aset/liabilitas lancar | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes/net-worth.tsx` | PRD Scope 3 & ISSUES Fase 8 |
| 7 | Category Settings | - | + | TC7-3 | Reassign Modal | Pengujian modal konfirmasi reassign kategori di halaman pengaturan | Memastikan modal mewajibkan pemilihan kategori tujuan sebelum mengeksekusi penghapusan kategori | Kategori tersedia | `DeleteCategoryDialog.tsx` | 1. Buka `/settings`.<br>2. Klik tombol hapus pada salah satu kategori.<br>3. Pilih kategori pengganti pada modal.<br>4. Konfirmasi penghapusan. | Modal menampilkan opsi kategori pengganti, tombol hapus hanya aktif jika kategori tujuan terpilih, dan transaksi dialihkan dengan aman. | Passed | `DeleteCategoryDialog.tsx` & `routes/settings.tsx` | Proteksi reassign dialog teruji | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/DeleteCategoryDialog.tsx` | PRD Scope 3 & ISSUES Fase 8 |

### PB-8 — Monorepo Quality Gates

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Validasi Type Checking TypeScript lintas workspace (pnpm check-types) | [x] | TC8-1 |
| 2 | Validasi Linter Monorepo (pnpm lint) | [x] | TC8-2 |
| 3 | Validasi Production Bundling (pnpm build) | [x] | TC8-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | Monorepo Types | - | + | TC8-1 | Type Check | Validasi tidak ada inkonsistensi tipe pada seluruh workspace | Memastikan kompilator tsc mendeteksi 0 error tipe di semua packages dan apps | Workspace dependencies terhubung | pnpm check-types | 1. Jalankan `pnpm check-types`.<br>2. Periksa output Turborepo pipeline. | Tasks: 4 successful, 4 total (0 error, exit code 0). | Passed | Turborepo check-types (4 of 4 passed) | Type safety 100% | Masuk Test Step | 2026-10-09 | `turbo.json` | PRD Success Criteria & ISSUES Fase 9 |
| 8 | Monorepo Linting | - | + | TC8-2 | ESLint Check | Validasi kepatuhan aturan format dan penulisan kode | Memastikan tidak ada error linter pada kode baru | Workspace packages aktif | pnpm lint | 1. Jalankan `pnpm lint`.<br>2. Periksa log ESLint. | 0 error pada aplikasi finance-tracker-api dan finance-tracker-web. | Passed | Turborepo lint (0 errors) | Kode bersih dan rapi | Masuk Test Step | 2026-10-09 | `turbo.json` | PRD Success Criteria & ISSUES Fase 9 |
| 8 | Production Build | - | + | TC8-3 | Vite & Tsc Build | Pengujian kompilasi backend dan bundling produksi web app | Memastikan dist/index.html, JS chunks, dan CSS bundle berhasil dihasilkan | Pipeline build aktif | pnpm build | 1. Jalankan `pnpm build`.<br>2. Periksa direktori dist pada apps/finance-tracker-web dan dist pada apps/finance-tracker-api. | Bundling Vite selesai sukses, tsc backend terkompilasi, exit code 0. | Passed | Turborepo build (4 of 4 passed) | Bundling produksi berhasil | Masuk Test Step | 2026-10-09 | `turbo.json` | PRD Success Criteria & ISSUES Fase 9 |
 
### PB-9 — Harmonisasi Warna & Integrasi Design System Pasutri

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Pengaturan State Tema & Sinkronisasi LocalStorage (Sakura, Duo, Light, Dark) | [x] | TC9-1 |
| 2 | Script Pencegah FOUC & Fallback Default Tema Sakura pada index.html | [x] | TC9-2 |
| 3 | Komponen Pengganti Tema (ThemeSwitcherSection di Settings & QuickThemeToggle di Navigasi) | [x] | TC9-3 |
| 4 | Eliminasi Utilitas Warna Legacy (0 hardcoded teal-*, rose-*, emerald-*) | [x] | TC9-4 |
| 5 | Penerapan Semantic Tokens Pasutri & 3D Buttons pada Seluruh Halaman Utama | [x] | TC9-5 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 9 | Theme State | - | + | TC9-1 | LocalStorage Sync | Validasi sinkronisasi state tema dengan atribut data-theme | Memastikan perubahan tema tersimpan di localStorage "theme" dan mengatur atribut data-theme pada document root | Web app terbuka | Theme: Sakura, Duo, Light, Dark | 1. Panggil `useThemeStore.setTheme("Duo")`.<br>2. Periksa localStorage.<br>3. Periksa document.documentElement.getAttribute("data-theme"). | localStorage bernilai "Duo" dan elemen html memiliki data-theme="Duo". | Passed | `qa-theme-runner.mjs` | Sinkronisasi tema terverifikasi | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/stores/theme.store.ts` | PRD Refinement & ISSUES Fase 10 |
| 9 | FOUC Prevention | - | + | TC9-2 | Head Script | Validasi pencegahan kedipan tema saat reload halaman | Memastikan script inline pada head index.html membaca tema tersimpan sebelum rendering body | Browser memuat halaman | index.html head script | 1. Buka index.html.<br>2. Verifikasi atribut data-theme="Sakura" default.<br>3. Verifikasi inline script pembaca localStorage. | Tema aktif diterapkan seketika sebelum konten body dimuat. | Passed | `qa-theme-runner.mjs` & `index.html` | Script FOUC siap | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/index.html` | PRD Refinement & ISSUES Fase 10 |
| 9 | Theme Switcher UI | - | + | TC9-3 | Switcher Components | Validasi ketersediaan komponen pengubah tema | Memastikan ThemeSwitcherSection tersedia di Settings dan QuickThemeToggle di Sidebar & Header Mobile | Rute web aktif | ThemeSwitcher.tsx | 1. Render ThemeSwitcherSection.<br>2. Render QuickThemeToggle.<br>3. Verifikasi interaksi klik ganti tema. | Tema beralih seketika tanpa refresh halaman, preview warna tampil akurat. | Passed | `ThemeSwitcher.tsx` & `qa-theme-runner.mjs` | Komponen tema berfungsi | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/components/ThemeSwitcher.tsx` | PRD Refinement & ISSUES Fase 10 |
| 9 | Color Tokenization | - | + | TC9-4 | Legacy Cleanliness | Validasi pembersihan warna hardcoded teal/rose/emerald | Memastikan 0 kelas hardcoded teal-*, rose-*, emerald-* di seluruh source code frontend | Direktori src | Static scan regex | 1. Scan semua file .ts dan .tsx di `apps/finance-tracker-web/src`.<br>2. Cari pola `teal-\d+`, `rose-\d+`, `emerald-\d+`. | Ditemukan 0 kecocokan, seluruh styling menggunakan token semantik pasutri. | Passed | `qa-theme-runner.mjs` (0 matches) | Bebas hardcoded legacy color | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src` | PRD Refinement & ISSUES Fase 10 |
| 9 | Semantic 3D Styling | - | + | TC9-5 | 3D Buttons & Cards | Validasi adopsi gaya 3D buttons dan card surfaces tokenized | Memastikan tombol aksi dan kartu utama menggunakan .btn-3d, border-border-color, dan shadow 3D | Seluruh rute UI | Dashboard, Transaksi, Budget, Net Worth, Settings, Reports | 1. Buka setiap rute utama.<br>2. Periksa penggunaan utility .btn-3d.<br>3. Periksa background kartu dan border color. | Tampilan konsisten mengikuti estetika pasutri Duolingo/Sakura dengan efek 3D responsif. | Passed | `qa-theme-runner.mjs` & UI review | Harmonisasi desain selesai | Masuk Test Step | 2026-10-09 | `apps/finance-tracker-web/src/routes` | PRD Refinement & ISSUES Fase 10 |

