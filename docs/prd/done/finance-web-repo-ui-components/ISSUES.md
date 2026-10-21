# Issues — Harmonisasi Komponen UI Finance Tracker Web dengan @repo/ui

## Fase 1: Perluasan Komponen di `@repo/ui`
- [x] Tambahkan varian `destructive` pada `buttonVariants` di `packages/ui/src/components/button.tsx`
- [x] Buat komponen `Input` di `packages/ui/src/components/input.tsx`
- [x] Buat komponen `Select` di `packages/ui/src/components/select.tsx`
- [x] Buat komponen `Textarea` di `packages/ui/src/components/textarea.tsx`
- [x] Ekspor `input`, `select`, dan `textarea` di `packages/ui/src/index.ts`

## Fase 2: Sinkronisasi Form Primitives di `habbit-tracker-web`
- [x] Ubah `apps/habbit-tracker-web/src/components/ui/input.tsx` untuk re-export dari `@repo/ui`
- [x] Ubah `apps/habbit-tracker-web/src/components/ui/select.tsx` untuk re-export dari `@repo/ui`
- [x] Ubah `apps/habbit-tracker-web/src/components/ui/textarea.tsx` untuk re-export dari `@repo/ui`

## Fase 3: Struktur UI Wrapper di `finance-tracker-web`
- [x] Buat folder `apps/finance-tracker-web/src/components/ui/` dan file re-export untuk `button.tsx`, `dialog.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, serta `index.ts`

## Fase 4: Refactor Dialog Modals di `finance-tracker-web`
- [x] Refactor `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx` menggunakan `Dialog` primitives, `Button`, `Input`, `Select`, dan `Textarea` dari `@repo/ui`
- [x] Refactor `apps/finance-tracker-web/src/components/DeleteCategoryDialog.tsx` menggunakan `Dialog` primitives dan `Button` (`destructive` & `outline`) dari `@repo/ui`
- [x] Refactor modal Buat/Edit Anggaran di `apps/finance-tracker-web/src/routes/budget.tsx` menggunakan `Dialog` primitives dan form controls dari `@repo/ui`
- [x] Refactor modal Tambah Aset & Liabilitas di `apps/finance-tracker-web/src/routes/net-worth.tsx` menggunakan `Dialog` primitives dan form controls dari `@repo/ui`

## Fase 5: Refactor Buttons, Form Inputs, & Cards di Halaman `finance-tracker-web`
- [x] Refactor kontrol filter, search input, date input, dan aksi di `apps/finance-tracker-web/src/routes/transactions.tsx`
- [x] Refactor tombol aksi dan kartu di `apps/finance-tracker-web/src/routes/budget.tsx` dan `src/components/BudgetCard.tsx`
- [x] Refactor tombol aksi dan input di `apps/finance-tracker-web/src/routes/net-worth.tsx`
- [x] Refactor form kategori dan preferensi di `apps/finance-tracker-web/src/routes/settings.tsx`
- [x] Refactor tombol periode dan kartu di `apps/finance-tracker-web/src/routes/reports.tsx`
- [x] Refactor tombol aksi cepat dan kartu ringkasan di `apps/finance-tracker-web/src/routes/index.tsx`
- [x] Refactor tombol navigasi / quick action di `apps/finance-tracker-web/src/routes/__root.tsx` dan `src/components/ThemeSwitcher.tsx`

## Fase 6: Verifikasi & Quality Gate
- [x] Jalankan type-check di seluruh monorepo (`pnpm check-types`)
- [x] Jalankan linting di seluruh monorepo (`pnpm lint`)
- [x] Jalankan build di seluruh monorepo (`pnpm build`)
- [x] Verifikasi interaktivitas modal dan form di browser
- [x] Review kualitas kode lima-axis dan kesiapan rilis (/gate)
