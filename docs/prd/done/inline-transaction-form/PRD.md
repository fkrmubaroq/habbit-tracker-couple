# PRD — Form Transaksi Tampilan Luar (/transactions/create)

## Context
Aplikasi `apps/finance-tracker-web` saat ini menggunakan modal popup overlay (`TransactionFormDialog`) yang dibungkus Radix `Dialog` dan dipicu melalui Zustand store (`useFinanceUIStore.isTransactionModalOpen`). Seluruh tombol `+ Transaksi` di sidebar desktop, header mobile, dan halaman riwayat memicu dialog overlay tersebut.

Inisiatif ini bertujuan untuk menghapus popup modal overlay tersebut dan menggantinya dengan halaman form transaksi mandiri di tampilan luar (`/transactions/create`), memberikan ruang pengisian yang lebih nyaman, deklaratif, dan bersih dari overlay.

## Problem / Motivation
1. **Overlay Modal Kurang Nyaman**: Form transaksi memiliki banyak field (tipe, nominal, kategori, tanggal, deskripsi, catatan). Tampilan dalam modal overlay membatasi ruang pandang dan rentan konflik scrolling di perangkat mobile.
2. **Ketergantungan State Modal Global**: Mengontrol form melalui global state (`isTransactionModalOpen`) di `__root.tsx` menambah kompleksitas yang tidak perlu dibanding navigasi route deklaratif.
3. **Pengalaman Pengguna Lebih Alami**: Halaman khusus `/transactions/create` memberikan layout yang lega, tombol navigasi kembali yang jelas, dan URL yang langsung dapat diakses.

## Scope
1. **Route Baru Dedicated Form Transaksi (`/transactions/create`)**:
   - Membuat route TanStack Router di `apps/finance-tracker-web/src/routes/transactions.create.tsx`.
   - Mengimplementasikan form transaksi di dalam Card elegan di tengah layar (`max-w-xl mx-auto`).
   - Menyediakan input lengkap:
     - Toggle Tipe: Pengeluaran vs Pemasukan
     - Nominal (Rp)
     - Kategori (Select dengan opsi terfilter berdasarkan tipe)
     - Tanggal (Date picker)
     - Deskripsi / Keterangan (Text input)
     - Catatan Tambahan (Textarea opsional)
   - Menggunakan komponen primitif dari `@repo/ui` (`Button`, `Card`, `Input`, `Select`, `Textarea`).
2. **Navigasi & Tombol Aksi**:
   - Mengubah tombol `+ Transaksi` di Sidebar desktop ([__root.tsx](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/routes/__root.tsx)) menjadi navigasi ke `/transactions/create`.
   - Mengubah tombol `Catat` di Header mobile ([__root.tsx](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/routes/__root.tsx)) menjadi navigasi ke `/transactions/create`.
   - Mengubah tombol `+ Transaksi Baru` dan tombol empty state di [transactions.tsx](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/routes/transactions.tsx) menjadi navigasi ke `/transactions/create`.
   - Tombol "Batal" dan aksi "Simpan Transaksi" yang sukses mengarahkan kembali ke `/transactions`.
   - Menjalankan animasi `canvas-confetti` saat transaksi pemasukan berhasil disimpan.
3. **Pembersihan Modal & Store**:
   - Menghapus komponen modal lama [TransactionFormDialog.tsx](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/components/TransactionFormDialog.tsx).
   - Menghapus pemanggilan `<TransactionFormDialog />` dari [__root.tsx](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/routes/__root.tsx).
   - Membersihkan `isTransactionModalOpen` dan action modal terkait dari [finance-ui.store.ts](file:///c:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/apps/finance-tracker-web/src/stores/finance-ui.store.ts).
   - Memperbarui file QA runner `qa-ui-components-runner.mjs`.

## Design Decisions
1. **Dedicated Route `/transactions/create`**: Menggunakan route tersendiri untuk menjamin state form terisolasi, URL jelas, dan tidak memerlukan portal modal DOM.
2. **Layout Card Elegan di Tengah (`max-w-xl mx-auto`)**: Layout card terpusat dengan estetika neo-brutalist / 3D shadow (`shadow-[0_4px_0_0_var(--border-color)]`) yang konsisten dengan tema aplikasi.
3. **Konsumsi Komponen Bersama `@repo/ui`**: Tetap mengonsumsi primitif form dari `@repo/ui` tanpa dependensi ke Radix Dialog untuk form transaksi.
4. **Alur Kembali ke `/transactions`**: Memastikan alur natural bagi pengguna setelah mencatat transaksi, yaitu langsung melihat hasil transaksi terbaru di tabel riwayat.

## Out of scope
1. Perubahan skema database atau endpoint REST API backend (`apps/finance-tracker-api`).
2. Perubahan dialog modal pada modul lain (`DeleteCategoryDialog`, dialog anggaran di `budget.tsx`, dan dialog aset/liabilitas di `net-worth.tsx`).
3. Fitur edit transaksi pada halaman terpisah.

## Success Criteria
1. Pengguna dapat membuka `/transactions/create` dan menyimpan transaksi pengeluaran/pemasukan baru secara inline tanpa modal overlay.
2. Seluruh tombol pencatatan transaksi di sidebar, header, dan halaman riwayat menavigasi ke `/transactions/create`.
3. Setelah simpan berhasil atau batal, aplikasi kembali ke `/transactions`.
4. Komponen `TransactionFormDialog` dan state modal usang telah terhapus bersih.
5. Pengecekan otomatis monorepo (`pnpm check-types`, `pnpm lint`, `pnpm build`, QA runner) berhasil 100% tanpa error.
