# PRD — Personal & Couple Finance Tracker (`apps/finance-tracker-*`)

> **Changelog**:
> - Refinement (2026-10-09): Harmonisasi warna dan design system mengikuti Habit Tracker:
>   - Ganti warna hardcoded (teal-*, rose-*, dsb) menjadi token design system semantic (@repo/tailwind-config & @repo/ui).
>   - Integrasi Theme Switcher dinamis 4 tema pasangan (Sakura Pink, Duo Green, Light, Dark) tersinkronisasi via localStorage key "theme".
>   - Tambahkan Theme Switcher di halaman Pengaturan (/settings) dan tombol quick toggle di Desktop Sidebar & Mobile Header.
>   - Sesuaikan visualisasi chart Recharts agar reaktif terhadap warna tema aktif.

---

## Context
Aplikasi **Personal Finance Tracker** dirancang untuk membantu pengguna/pasangan mengelola keuangan pribadi maupun keluarga dalam satu tempat yang sederhana, modern, intuitif, dan responsif (*mobile-first*).

Di dalam arsitektur Turborepo monorepo ini, Finance Tracker diwujudkan sebagai sepasang aplikasi terdedikasi:
- `apps/finance-tracker-api`: Express 4 + TypeScript REST API dengan arsitektur multi-database (MySQL, Supabase, Neon).
- `apps/finance-tracker-web`: React 18 + Vite SPA menggunakan Tailwind CSS v4 (`@repo/tailwind-config`), TanStack Router & Query, Recharts, dan Zustand.
- Berbagi tipe data via `@repo/types` dan UI primitives via `@repo/ui`.

---

## Problem / Motivation
1. **Pemisahan Domain & Independensi**: Memisahkan aplikasi keuangan dari pelacak habit (`habbit-tracker-*`) menjaga keterpisahan tanggung jawab (*separation of concerns*), mempermudah deployment mandiri, dan membuat arsitektur monorepo lebih modular.
2. **Pengelolaan Arus Kas Komprehensif**: Pengguna membutuhkan pencatatan pemasukan (*Income*) dan pengeluaran (*Expense*), pemantauan saldo berjalan (*Balance*), arus kas (*Cash Flow*), dan kekayaan bersih (*Net Worth*).
3. **Kepatuhan Anggaran (Budgeting)**: Kurangnya visibilitas sisa anggaran sering menyebabkan pengeluaran berlebih (*overspending*). Diperlukan indikator visual jelas (Aman $\le 75\%$, Mendekati $75-100\%$, Melebihi $> 100\%$).
4. **Pencatatan Cepat & Responsif**: Form pencatatan transaksi harus sangat cepat digunakan dari perangkat seluler (Bottom Navigation) maupun desktop (Sidebar), dilengkapi visualisasi grafik yang mudah dipahami dalam hitungan detik.
5. **Konsistensi Design System Pasutri**: Antarmuka web harus mencerminkan bahasa visual pasutri yang konsisten (Sakura Pink untuk istri, Duo Green untuk suami, serta opsi Light & Dark), bukan sekadar warna hardcoded mandiri.

---

## Scope

### 1. Shared Types (`packages/types`)
- Penambahan `packages/types/src/finance.ts` dan re-export di `index.ts`.
- Tipe DTO & entitas:
  - `FinanceTransaction`, `CreateTransactionDTO`, `UpdateTransactionDTO`
  - `FinanceCategory`, `CreateCategoryDTO`, `UpdateCategoryDTO`
  - `FinanceBudget`, `CreateBudgetDTO`, `UpdateBudgetDTO`
  - `FinanceAsset`, `FinanceLiability`, `FinanceSettings`
  - `FinanceOverview`, `FinanceReportQuery`, `FinanceReportResponse`

### 2. Backend API (`apps/finance-tracker-api`)
- Setup workspace package `@repo/finance-tracker-api` di `apps/finance-tracker-api`:
  - `package.json`, `tsconfig.json`, `src/index.ts`, `src/app.ts`, `src/config/env.ts`
  - Server berjalan di port terpisah (default: `PORT=1907`).
- Migrasi database SQL & Seeding:
  - `finance_settings` (penyimpanan saldo awal)
  - `finance_categories` (kategori income & expense dengan ikon & warna)
  - `finance_transactions` (income & expense dengan tanggal, nominal, kategori, user pencatat)
  - `finance_budgets` (anggaran bulanan/tahunan per kategori pengeluaran)
  - `finance_assets` & `finance_liabilities` (aset & kewajiban manual)
- Modul REST API (`/api/...`):
  - `GET /api/overview` (Ringkasan saldo, cash flow bulan ini, budget terpakai, transaksi terbaru, net worth)
  - `GET/PUT /api/settings` (Pengaturan saldo awal)
  - CRUD `/api/categories` + endpoint hapus khusus dengan parameter `replacementCategoryId`
  - CRUD `/api/transactions` dengan filter rentang tanggal, jenis, kategori, pagination, search kata kunci
  - CRUD `/api/budgets` per bulan/tahun
  - `GET /api/reports` (Agregasi time-series & distribusi kategori untuk grafik)
  - CRUD `/api/assets` & CRUD `/api/liabilities`
  - `GET /api/net-worth`

### 3. Frontend Web (`apps/finance-tracker-web`)
- Setup workspace package `@repo/finance-tracker-web` di `apps/finance-tracker-web`:
  - `package.json`, `vite.config.ts` (dengan port 5175 dan proxy API ke port 1907)
  - Integrasi stylesheet dari `@repo/tailwind-config` dengan token tema lengkap (Sakura, Duo, Light, Dark)
  - Integrasi TanStack Router & TanStack Query
- Tata Letak & Navigasi Mandiri:
  - **Desktop**: Sidebar navigation (Dashboard, Transaksi, Budget, Laporan, Net Worth, Pengaturan) + Tombol Cepat "+ Transaksi" + Quick Theme Toggle.
  - **Mobile**: Top Header (Quick Theme Toggle) + Bottom navigation (Dashboard, Transaksi, Budget, Laporan, Net Worth).
- Tema Dinamis Pasangan:
  - Theme Store (`src/stores/theme.store.ts`) tersinkronisasi dengan `localStorage.getItem("theme")` dan atribut `data-theme` pada root HTML.
  - Theme Switcher card interaktif di `/settings`.
- Halaman & Komponen Kunci:
  - `/` — Dashboard ringkasan kondisi finansial lengkap dengan styling token tema pasutri (`bg-primary`, `bg-secondary`, `bg-card-surface`, `border-border-color`, `shadow-[0_4px_0_0_var(--border-color)]`)
  - `/transactions` — Riwayat transaksi lengkap dengan filter preset tanggal & modal pencatatan cepat (`react-hook-form` + `<Controller />`)
  - `/budget` — Kartu monitoring batas budget per kategori & status progress dengan style 3D
  - `/reports` — Laporan keuangan visual dengan Recharts yang reaktif mengikuti palet tema aktif
  - `/net-worth` — Rincian aset, liabilitas, dan hero card Net Worth bertema pasutri
  - `/settings` — Konfigurasi saldo awal, pengelolaan kategori, serta Section Theme Switcher pasangan

---

## Design Decisions

| Aspek | Keputusan | Rasional |
|---|---|---|
| **Struktur Monorepo** | Dedicated `apps/finance-tracker-api` & `apps/finance-tracker-web` | Memenuhi arahan user untuk menjaga independensi aplikasi, mempermudah rilis mandiri, dan menjaga kebersihan arsitektur. |
| **Model Kepemilikan Data** | Terpadu / Pasangan (Couple) | Saldo, cash flow, budget, dan net worth dihitung secara agregat keluarga. Transaksi mencatat `user_id` pembuat untuk transparansi. |
| **Port & Koneksi Dev** | API: `1907`, Web: `5175` | Menghindari konflik port dengan `habbit-tracker-api` (1906) dan web (5173/5174). |
| **Kalkulasi Saldo** | $\text{Saldo} = \text{Saldo Awal} + \Sigma \text{Income} - \Sigma \text{Expense}$ | Nilai Saldo Awal disimpan di tabel settings keluarga, sehingga pengguna tidak perlu mencatat saldo awal sebagai transaksi semu. |
| **Kalkulasi Net Worth** | $\text{Net Worth} = (\text{Saldo Kas} + \Sigma \text{Aset}) - \Sigma \text{Liabilitas}$ | Saldo kas berjalan otomatis diakui sebagai salah satu komponen aset likuid keluarga. |
| **Penanganan Hapus Kategori** | Wajib Pilih Kategori Pengganti (Reassign) | Menjamin integritas referensial data transaksi. Pengguna wajib memilih kategori tujuan untuk memindahkan seluruh transaksi terkait sebelum kategori lama dihapus. |
| **Form Handling** | `react-hook-form` dengan `<Controller />` | Memenuhi spesifikasi Bagian 19 [file.md](file:///d:/DEV/antigravity-project/habbit-tracker-couple/file.md) dan menjamin performa rendering optimal pada form mobile. |
| **Design System & Tema** | `@repo/tailwind-config` + `@repo/ui` dengan 4 Tema Dinamis | Menggantikan warna Tailwind hardcoded (`teal-*`, `rose-*`, dll) dengan token semantic (`--primary`, `--secondary`, `--accent`, dsb). Mendukung tema Sakura Pink (Istri), Duo Green (Suami), Light, dan Dark dengan persistensi localStorage. |

---

## Data Model & Schema SQL

```sql
-- 1. Pengaturan Saldo Awal
CREATE TABLE IF NOT EXISTS finance_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fin_settings_user (user_id, partner_id)
);

-- 2. Kategori Transaksi
CREATE TABLE IF NOT EXISTS finance_categories (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    color VARCHAR(30) NOT NULL DEFAULT '#38B2AC',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fin_cat_user (user_id, partner_id, type)
);

-- 3. Transaksi
CREATE TABLE IF NOT EXISTS finance_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    category_id VARCHAR(36) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fin_tx_date (user_id, partner_id, date),
    INDEX idx_fin_tx_cat (category_id),
    FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT
);

-- 4. Budget
CREATE TABLE IF NOT EXISTS finance_budgets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    category_id VARCHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    period ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    month_year VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE CASCADE
);

-- 5. Aset
CREATE TABLE IF NOT EXISTS finance_assets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Tabungan',
    amount DECIMAL(14, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Liabilitas
CREATE TABLE IF NOT EXISTS finance_liabilities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Pinjaman',
    amount DECIMAL(14, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Out of Scope
- Sinkronisasi otomatis mutasi rekening bank / Open Banking API.
- Pemindaian struk / OCR nota otomatis.
- Multi-currency / valuta asing (semua pencatatan dalam Rupiah IDR).

---

## Success Criteria
- [x] `@repo/finance-tracker-api` dan `@repo/finance-tracker-web` terdaftar rapi dalam Turborepo pnpm workspace.
- [x] Shared package `@repo/types` memuat definisi type & Zod schema lengkap untuk modul keuangan.
- [x] Database migrations & seeds untuk finance tracker berhasil dieksekusi.
- [x] Seluruh endpoint REST API di `apps/finance-tracker-api` berfungsi dan tervalidasi.
- [x] Proteksi hapus kategori: Mewajibkan pemilihan kategori pengganti sebelum kategori dihapus.
- [x] Web app di `apps/finance-tracker-web` menyajikan UI Dashboard, Transaksi, Budget, Laporan, Net Worth, dan Pengaturan dengan responsive layout (Mobile Bottom Nav & Desktop Sidebar).
- [x] Semua form menggunakan `react-hook-form` dengan `<Controller />`.
- [x] Seluruh visualisasi chart Recharts tampil responsif dan informatif.
- [x] `pnpm check-types`, `pnpm lint`, dan `pnpm build` lolos 100% pada seluruh workspace.
