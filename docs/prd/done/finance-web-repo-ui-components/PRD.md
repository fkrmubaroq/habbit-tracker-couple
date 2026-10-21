# Harmonisasi Komponen UI Finance Tracker Web dengan @repo/ui

## Context
Aplikasi `apps/finance-tracker-web` saat ini menggunakan elemen HTML manual (`<button>`, `<input>`, `<select>`, `<textarea>`) serta custom modal overlay (`<div className="fixed inset-0 ...">`) yang dibuat mandiri di setiap route dan komponen. Sementara itu, monorepo telah memiliki shared package `@repo/ui` yang berisi komponen desain primitif bergaya neo-brutalist (Button, Dialog, Card) yang digunakan oleh `apps/habbit-tracker-web`.

Inisiatif ini bertujuan untuk memperluas pustaka komponen di `@repo/ui` dengan menyertakan form primitives (`Input`, `Select`, `Textarea`), menambahkan variant `destructive` pada `Button`, lalu mengadopsi seluruh komponen `@repo/ui` ke dalam `apps/finance-tracker-web` dan menyinkronkan `apps/habbit-tracker-web`.

## Problem / Motivation
1. **Duplikasi & Inkonsistensi Kode**: Modal dialog dan styling form di `finance-tracker-web` dibuat berulang kali secara manual di berbagai file (`TransactionFormDialog`, `DeleteCategoryDialog`, `budget.tsx`, `net-worth.tsx`), menyebabkan inkonsistensi animasi, interaktivitas, dan aksesibilitas (fokus trap, ARIA, escape key).
2. **Kekosongan Form Controls di @repo/ui**: Package `@repo/ui` saat ini baru mengekspor `Button`, `Card`, dan `Dialog`, sedangkan komponen dasar input form masih terisolasi di dalam `habbit-tracker-web`.
3. **Standarisasi Arsitektur Monorepo**: Kedua aplikasi web front-end (`habbit-tracker-web` dan `finance-tracker-web`) harus mengonsumsi design system bersama yang konsisten dari `@repo/ui` dengan struktur re-export folder `src/components/ui/` yang rapi.

## Scope
1. **Package `@repo/ui`**:
   - Menambahkan varian `destructive` pada `buttonVariants` di `src/components/button.tsx`.
   - Membuat komponen `Input` di `src/components/input.tsx`.
   - Membuat komponen `Select` di `src/components/select.tsx` (termasuk ikon panah chevron).
   - Membuat komponen `Textarea` di `src/components/textarea.tsx`.
   - Mengekspor semua komponen baru di `src/index.ts`.
2. **App `apps/habbit-tracker-web`**:
   - Memperbarui `src/components/ui/input.tsx`, `select.tsx`, dan `textarea.tsx` agar mere-export langsung dari `@repo/ui`.
3. **App `apps/finance-tracker-web`**:
   - Membuat direktori lokal `src/components/ui/` dengan wrapper/re-export dari `@repo/ui`: `button.tsx`, `dialog.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, serta `index.ts`.
   - Mengganti seluruh modal kustom menjadi Radix `Dialog` primitives dari `@repo/ui`:
     - `src/components/TransactionFormDialog.tsx`
     - `src/components/DeleteCategoryDialog.tsx`
     - Modal Anggaran di `src/routes/budget.tsx`
     - Modal Aset & Liabilitas di `src/routes/net-worth.tsx`
   - Mengganti elemen native button, input, select, textarea, dan container kartu dengan komponen dari `@repo/ui`:
     - `src/routes/transactions.tsx`
     - `src/routes/budget.tsx`
     - `src/routes/net-worth.tsx`
     - `src/routes/settings.tsx`
     - `src/routes/reports.tsx`
     - `src/routes/index.tsx`
     - `src/routes/__root.tsx`
     - `src/components/BudgetCard.tsx`
     - `src/components/ThemeSwitcher.tsx`

## Design Decisions
1. **Sentralisasi Form Primitives di @repo/ui**: Memindahkan `Input`, `Select`, dan `Textarea` ke `@repo/ui` agar reusable dan konsisten dengan token tema `border-border-color`, `bg-card-surface`, dan `focus-visible:border-primary`.
2. **Penambahan Varian `destructive`**: Tombol tindakan berbahaya (hapus transaksi, hapus anggaran, hapus kategori) memiliki varian resmi `destructive` di `buttonVariants` (warna merah solid dengan border/shadow neo-brutalist), menghindari inline style custom.
3. **Folder Perantara `src/components/ui/` di Setiap App**: Mengikuti pola `habbit-tracker-web`, `finance-tracker-web` memiliki folder `components/ui/` yang mere-export `@repo/ui`. Pola ini memudahkan alias impor lokal (`@/components/ui/...`) dan memungkinkan kustomisasi lokal jika sewaktu-waktu dibutuhkan.
4. **Adopsi Radix Dialog**: Menggantikan implementasi manual overlay `div` dengan Radix UI Dialog primitives (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, dll) untuk menjamin aksesibilitas layar, focus locking, escape-to-close, dan animasi halus.

## Out of scope
1. Mengubah kontrak API backend (`apps/finance-tracker-api`) atau skema database.
2. Mengubah logic bisnis, TanStack Query hooks, form validation logic (Zod), atau Zustand stores.
3. Memindahkan library pihak ketiga seperti Recharts, Lucide icons, atau Canvas Confetti ke `@repo/ui`.
4. Merombak visual tata letak halaman secara radikal di luar harmonisasi komponen UI.

## Success Criteria
1. Seluruh modal dialog di `finance-tracker-web` (transaksi, hapus kategori, tambah anggaran, tambah aset/liabilitas) berfungsi normal menggunakan Radix `Dialog` dari `@repo/ui`.
2. Semua elemen tombol dan input form di `finance-tracker-web` menggunakan komponen `Button`, `Input`, `Select`, dan `Textarea` dari `@repo/ui`.
3. Type-checking (`pnpm check-types`), linting (`pnpm lint`), dan build (`pnpm build`) berhasil tanpa error di seluruh workspace monorepo.
4. Tidak ada regresi fungsionalitas pada `habbit-tracker-web`.
