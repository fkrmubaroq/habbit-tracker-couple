# Issues — Form Transaksi Tampilan Luar (/transactions/create)

## Fase 1: Pembuatan Route & Form Transaksi Luar (`/transactions/create`)
- [x] Buat route baru `apps/finance-tracker-web/src/routes/transactions_.create.tsx` (un-nested top route `/transactions/create`)
- [x] Implementasikan form pencatatan transaksi inline di dalam `Card` dengan dukungan tipe (`expense`/`income`), nominal, kategori, tanggal, deskripsi, dan catatan
- [x] Tambahkan tombol navigasi "Kembali" serta aksi "Batal" dan "Simpan Transaksi" yang mengarahkan ke `/transactions`
- [x] Integrasikan mutation `useCreateTransactionMutation`, reset form, dan efek animasi confetti untuk pemasukan

## Fase 2: Pembaruan Navigasi & Penghapusan Tombol Modal
- [x] Ubah tombol `+ Transaksi` di Sidebar desktop `apps/finance-tracker-web/src/routes/__root.tsx` menjadi navigasi ke `/transactions/create`
- [x] Ubah tombol `Catat` di Header mobile `apps/finance-tracker-web/src/routes/__root.tsx` menjadi navigasi ke `/transactions/create`
- [x] Ubah tombol `+ Transaksi Baru` dan tombol pada empty state di `apps/finance-tracker-web/src/routes/transactions.tsx` menjadi navigasi ke `/transactions/create`

## Fase 3: Pembersihan Komponen Modal & State Store
- [x] Hapus pemanggilan `<TransactionFormDialog />` dari `apps/finance-tracker-web/src/routes/__root.tsx`
- [x] Hapus file `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx`
- [x] Bersihkan `isTransactionModalOpen` dan action modal dari `apps/finance-tracker-web/src/stores/finance-ui.store.ts`
- [x] Perbarui test suite `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` agar menyesuaikan penghapusan `TransactionFormDialog` dan memvalidasi route baru `/transactions/create`

## Fase 4: Verifikasi & Quality Checks
- [x] Jalankan type-check monorepo (`pnpm check-types`)
- [x] Jalankan linting monorepo (`pnpm lint`)
- [x] Jalankan build monorepo (`pnpm build`)
- [x] Jalankan automated UI runner (`node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs`)
