# ISSUES — Checklist Implementasi Keuangan Pasutri (`apps/finance-tracker-*`)

Berikut adalah daftar pekerjaan implementasi bertahap (*vertical slicing*) untuk modul **Finance Tracker** yang dibangun sebagai sepasang aplikasi terdedikasi di dalam monorepo:
- Backend: `apps/finance-tracker-api` (`@repo/finance-tracker-api`)
- Frontend: `apps/finance-tracker-web` (`@repo/finance-tracker-web`)

---

### Fase 1: Kontrak Tipe Bersama (`@repo/types`)
- [x] Buat file `packages/types/src/finance.ts` yang mendefinisikan tipe entitas (`FinanceCategory`, `FinanceTransaction`, `FinanceBudget`, `FinanceAsset`, `FinanceLiability`, `FinanceSettings`, `FinanceOverview`, `FinanceReport`) beserta Zod validation schemas
  - *Acceptance criteria*:
    - Ekspor TypeScript interfaces dan Zod schemas untuk semua DTO (request & response)
    - Tipe amount menggunakan `number` dengan format pembulatan 2 desimal
    - Tipe category type mencakup `'income' | 'expense'`
- [x] Daftarkan ekspor `finance.ts` pada `packages/types/src/index.ts`
  - *Acceptance criteria*:
    - `@repo/types` mengekspor seluruh tipe dan schema finance
    - `pnpm --filter=@repo/types build` atau type-check lolos tanpa error

---

### Fase 2: Setup Aplikasi Backend Dedicated (`apps/finance-tracker-api`)
- [x] Inisialisasi struktur workspace package `apps/finance-tracker-api`
  - *Acceptance criteria*:
    - Buat `apps/finance-tracker-api/package.json` dengan name `@repo/finance-tracker-api`, port 1907, dependencies `@repo/types`, `express`, `mysql2`, `pg`, `zod`, `dotenv`, `cors`, `cookie-parser`
    - Buat `tsconfig.json` yang meng-extends `@repo/typescript-config/node.json`
    - Buat file bootstrap `src/index.ts`, `src/app.ts`, `src/config/env.ts`, dan `src/config/database.ts`
- [x] Buat skema migrasi database SQL dan script runner di `apps/finance-tracker-api/src/migrations`
  - *Acceptance criteria*:
    - File SQL `001-finance-schema.sql` memuat tabel: `finance_settings`, `finance_categories`, `finance_transactions`, `finance_budgets`, `finance_assets`, `finance_liabilities`
    - Script `migrate.ts` dan `seed.ts` berjalan via `pnpm --filter=@repo/finance-tracker-api db:migrate` dan `db:seed`
    - Kategori default (Gaji, Freelance, Makanan, Transportasi, Tagihan, Belanja, Hiburan, dll.) berhasil ter-seed

> **Checkpoint 1**: Backend package terkonfigurasi, migrasi skema database terpasang, dan shared types siap digunakan.

---

### Fase 3: Implementasi Modul REST API (`apps/finance-tracker-api`)
- [x] Buat modul validasi request di `apps/finance-tracker-api/src/modules/finance/finance.schema.ts`
  - *Acceptance criteria*:
    - Validasi Zod untuk create/update transaksi, kategori, budget, aset, liabilitas, dan setting saldo awal
    - Menampilkan error validation terstruktur dengan status HTTP 400
- [x] Buat repository database di `apps/finance-tracker-api/src/modules/finance/finance.repository.ts`
  - *Acceptance criteria*:
    - Query transaksi, kategori, budget, aset, liabilitas, dan saldo awal dengan lingkup user/couple
    - Query join transaksi dengan kategori
    - Fungsi reassign kategori: memindahkan seluruh transaksi terkait ke `replacement_id` sebelum kategori lama dihapus
- [x] Buat controller handlers di `apps/finance-tracker-api/src/modules/finance/finance.controller.ts`
  - *Acceptance criteria*:
    - Endpoint: `getOverview`, `getSettings`, `updateSettings`, CRUD categories (dengan reassign), CRUD transactions, CRUD budgets, `getReports`, CRUD assets, CRUD liabilities, `getNetWorth`
    - Perhitungan saldo: `initial_balance + total_income - total_expense`
    - Perhitungan net worth: `saldo_berjalan + total_assets - total_liabilities`
- [x] Buat routes di `apps/finance-tracker-api/src/modules/finance/finance.routes.ts` dan daftarkan ke `app.ts` pada `/api`
  - *Acceptance criteria*:
    - Seluruh rute terpasang dan dapat diakses dengan respons JSON standar `{ success: true, data: ... }`
    - Penanganan global error middleware berfungsi dengan baik

> **Checkpoint 2**: REST API `apps/finance-tracker-api` selesai dan semua endpoint teruji secara lokal.

---

### Fase 4: Setup Aplikasi Web Dedicated (`apps/finance-tracker-web`)
- [x] Inisialisasi struktur workspace package `apps/finance-tracker-web`
  - *Acceptance criteria*:
    - Buat `apps/finance-tracker-web/package.json` dengan name `@repo/finance-tracker-web`, dependencies React 18, Vite, TanStack Router & Query, Recharts, Lucide-react, React-hook-form, Zustand, `@repo/types`, `@repo/ui`, `@repo/tailwind-config`
    - Buat `vite.config.ts` dengan konfigurasi server port 5175 dan proxy `/api` ke `http://localhost:1907`
    - Buat `index.html`, `src/main.tsx`, dan `src/index.css` yang mengimpor `@repo/tailwind-config/styles.css`
- [x] Buat layout root dan navigasi di `apps/finance-tracker-web/src/routes/__root.tsx`
  - *Acceptance criteria*:
    - Desktop: Sidebar navigation (Dashboard, Transaksi, Budget, Laporan, Net Worth, Pengaturan) + Tombol Cepat "+ Transaksi"
    - Mobile: Bottom navigation (Dashboard, Transaksi, Budget, Laporan, Net Worth)
    - Desain responsif, clean, dan menerapkan tema warna Finance/Teal
- [x] Buat API client service dan TanStack Query hooks
  - *Acceptance criteria*:
    - Service di `src/services/finance.service.ts` memanggil endpoint backend dengan typing lengkap
    - Custom hooks di `src/hooks/use-finance.ts` mencakup fetching query dan invalidation cache saat mutasi

---

### Fase 5: Halaman Transaksi & Manajemen Kategori (`apps/finance-tracker-web`)
- [x] Buat komponen form modal transaksi `src/components/TransactionFormDialog.tsx` menggunakan `react-hook-form` dan `<Controller />`
  - *Acceptance criteria*:
    - Tab switch antara "Pengeluaran" dan "Pemasukan"
    - Input amount dengan format mata uang Rupiah
    - Dropdown kategori dengan ikon dan warna
    - Input tanggal transaksi dan catatan opsional
- [x] Buat dialog konfirmasi reassign kategori `src/components/DeleteCategoryDialog.tsx`
  - *Acceptance criteria*:
    - Menampilkan jumlah transaksi yang terdampak
    - Wajib memilih kategori pengganti sebelum tombol konfirmasi hapus aktif
- [x] Buat rute halaman transaksi `src/routes/transactions.tsx`
  - *Acceptance criteria*:
    - Filter preset tanggal (Hari Ini, 7 Hari, Bulan Ini, Bulan Lalu, 3 Bulan, Tahun Ini, Custom)
    - Filter tipe (Semua, Income, Expense) dan pencarian kata kunci deskripsi
    - List transaksi terkelompok per tanggal dengan aksi edit dan hapus
- [x] Buat rute halaman pengaturan & kategori `src/routes/settings.tsx`
  - *Acceptance criteria*:
    - Form edit Saldo Awal (Initial Balance)
    - Manajemen kategori (tab Income & Expense) dengan fitur tambah, edit warna/ikon, dan hapus (dengan dialog reassign)

> **Checkpoint 3**: Alur transaksi harian, saldo awal, dan manajemen kategori berfungsi penuh secara interaktif.

---

### Fase 6: Halaman Budget & Monitoring Pengeluaran (`apps/finance-tracker-web`)
- [x] Buat komponen kartu budget `src/components/BudgetCard.tsx`
  - *Acceptance criteria*:
    - Menampilkan nama kategori, ikon, nominal batas budget, nominal terpakai, dan sisa budget
    - Progress bar persentase dengan warna dinamis (Aman $\le 75\%$, Mendekati $75-100\%$, Melebihi $> 100\%$)
    - Indikator peringatan jika overbudget
- [x] Buat rute halaman budget `src/routes/budget.tsx`
  - *Acceptance criteria*:
    - Navigasi pemilih bulan/tahun (default bulan saat ini)
    - Ringkasan total budget vs total pengeluaran aktual
    - Grid kartu budget per kategori dengan tombol tambah/edit budget

---

### Fase 7: Halaman Laporan, Visualisasi & Net Worth (`apps/finance-tracker-web`)
- [x] Buat komponen visualisasi grafik dengan Recharts di `src/components/FinanceCharts.tsx`
  - *Acceptance criteria*:
    - Bar chart perbandingan Pemasukan vs Pengeluaran
    - Donut/Pie chart distribusi pengeluaran per kategori dengan tooltip persentase
    - Area/Line chart tren arus kas (*Cash Flow*) akumulatif
    - Komponen responsif terhadap ukuran layar mobile dan desktop
- [x] Buat rute halaman laporan `src/routes/reports.tsx`
  - *Acceptance criteria*:
    - Filter rentang periode laporan
    - Ringkasan metrik total pemasukan, pengeluaran, net cash flow, dan rata-rata harian
    - Menampilkan chart Recharts terintegrasi
- [x] Buat rute halaman Net Worth `src/routes/net-worth.tsx`
  - *Acceptance criteria*:
    - Kartu hero Net Worth: $(\text{Saldo Kas Berjalan} + \Sigma \text{Aset}) - \Sigma \text{Liabilitas}$
    - Komponen daftar aset manual dengan tombol tambah/edit/hapus
    - Komponen daftar liabilitas manual dengan tombol tambah/edit/hapus

---

### Fase 8: Dashboard Ringkasan & Polish Tampilan (`apps/finance-tracker-web`)
- [x] Buat rute utama dashboard keuangan `src/routes/index.tsx`
  - *Acceptance criteria*:
    - Kartu Saldo Berjalan terintegrasi dengan saldo awal
    - Kartu Pemasukan, Pengeluaran, dan Net Cash Flow bulan berjalan
    - Ringkasan penggunaan budget kategori tertinggi
    - Daftar 5 transaksi terbaru dengan tautan ke halaman riwayat lengkap
    - Tombol aksi cepat tambah transaksi (+ Income / + Expense)
- [x] Polish styling, micro-animations, dan layout responsive mobile & desktop
  - *Acceptance criteria*:
    - Styling 3D buttons dan cards konsisten menggunakan `@repo/tailwind-config`
    - Tampilan mobile (bottom navigation) dan desktop (sidebar) berjalan rapi tanpa glitch

---

### Fase 9: Quality Gates & Verification Monorepo
- [x] Jalankan type-checking lintas workspace monorepo (`pnpm check-types`)
  - *Acceptance criteria*: Tidak ada error tipe TypeScript pada seluruh package dan apps (`@repo/types`, `finance-tracker-api`, `finance-tracker-web`)
- [x] Jalankan linting monorepo (`pnpm lint`)
  - *Acceptance criteria*: Lolos aturan linting monorepo tanpa warning atau error
- [x] Jalankan build aplikasi (`pnpm build`)
  - *Acceptance criteria*: Kompilasi backend (`tsc`) dan bundling frontend (`vite build`) berhasil 100%
- [x] Pengujian fungsionalitas end-to-end / manual checklist
  - *Acceptance criteria*: Pencatatan transaksi, perhitungan saldo, alokasi budget, grafik analitik, dan Net Worth teruji dan berjalan akurat

---

### Fase 10: Harmonisasi Warna & Integrasi Design System Pasutri
- [x] Buat `src/stores/theme.store.ts` dan sinkronisasi atribut `data-theme` dengan `localStorage` ("Sakura", "Duo", "Light", "Dark")
  - *Acceptance criteria*:
    - State tema tersimpan di key localStorage `"theme"` agar tersinkronisasi lintas web app
    - Mengatur atribut `data-theme` pada root document (`<html>`)
    - Default fallback `"Sakura"` (atau sesuai penyimpanan sebelumnya)
- [x] Buat komponen `ThemeSwitcher` untuk pengaturan dan quick toggle
  - *Acceptance criteria*:
    - Komponen `ThemeSwitcher` cards di `/settings` dengan preview warna tema
    - Komponen `QuickThemeToggle` di Desktop Sidebar dan Mobile Top Header
    - Perpindahan tema terjadi seketika tanpa reload halaman
- [x] Refactor styling pada Shell & Navigasi (`src/routes/__root.tsx`)
  - *Acceptance criteria*:
    - Brand logo, icon badge, link navigasi aktif menggunakan `bg-primary/15 text-primary border-primary/30`
    - Tombol aksi "+ Transaksi" menggunakan tombol 3D (`btn-3d`)
    - Border dan background menggunakan `border-border-color` dan `bg-card-surface`
- [x] Refactor styling pada Dashboard (`src/routes/index.tsx`)
  - *Acceptance criteria*:
    - Kartu Hero Saldo Kas Berjalan menggunakan kombinasi warna dinamis bertema pasutri (bukan gradient teal hardcoded)
    - Tombol aksi cepat "+ Pemasukan" dan "+ Pengeluaran" menggunakan utility tokens yang harmonis
    - Kartu metrik dan widget 5 transaksi terbaru menggunakan border 2px dan shadow 3D (`var(--border-color)`)
- [x] Refactor styling pada Transaksi, Budget, Net Worth, dan Settings
  - *Acceptance criteria*:
    - `src/routes/transactions.tsx`: Tab filter dan badge status menggunakan token design system
    - `src/routes/budget.tsx` & `src/components/BudgetCard.tsx`: Kartu budget menggunakan border dan shadow 3D
    - `src/routes/net-worth.tsx`: Kartu net worth dan aset/liabilitas menggunakan styling token pasutri
    - `src/routes/settings.tsx`: Section pengaturan tema terintegrasi rapi bersama saldo awal & kategori
- [x] Sesuaikan visualisasi Recharts (`src/components/FinanceCharts.tsx`)
  - *Acceptance criteria*:
    - Donut Chart dan Bar Chart membaca warna tema aktif secara dinamis
    - Tooltip dan grid menggunakan `var(--card-surface)`, `var(--border-color)`, dan `var(--text-primary)`
- [x] Verifikasi Monorepo Quality Gates (`pnpm check-types`, `pnpm lint`, `pnpm build`)
  - *Acceptance criteria*:
    - Seluruh build dan linting lolos 100% tanpa error
