# PRD — Ganti `Select` Native dengan `Select` Shadcn UI

## Context
`packages/ui/src/components/select.tsx` saat ini membungkus elemen native `<select>` dengan ikon `ChevronDown`. Komponen ini di-re-export oleh `apps/finance-tracker-web/src/components/ui/select.tsx` dan `apps/habbit-tracker-web/src/components/ui/select.tsx`, lalu dipakai di 13 tempat (8 finance, 5 habit).

Monorepo sudah memakai `radix-ui` (unified package) untuk `Dialog` di `packages/ui/src/components/dialog.tsx`, jadi primitif Radix sudah tersedia tanpa dependensi baru.

## Problem / Motivation
1. **Dropdown native tidak bisa di-style.** Menu opsi dirender oleh OS/browser, sehingga tidak mengikuti tema neo-brutalist aplikasi (border 2px, shadow 3D, `--highlight` hover) dan tampil berbeda antar browser.
2. **Tidak konsisten dengan komponen lain.** `Button`, `Dialog`, `Input`, dan `Card` sudah berbasis Radix/primitif bersama, sementara `Select` masih HTML native.
3. **Aksesibilitas & posisi terbatas.** Native select tidak mendukung pencarian visual, grouping label, maupun ikon centang pada opsi terpilih.

## Scope
1. **`packages/ui/src/components/select.tsx`** — ganti total menjadi compound component shadcn-style di atas `SelectPrimitive` dari `radix-ui`: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`.
2. **Styling memakai token repo**, bukan token shadcn default (`popover`/`muted`/`foreground` tidak terdefinisi di `packages/tailwind-config/theme.css`): trigger `border-2 border-border-color bg-card-surface text-text-primary rounded-xl h-11`, content `bg-card-surface border-2 border-border-color rounded-xl shadow-[0_4px_0_0_var(--border-color)]`, item `focus:bg-highlight`, indikator terpilih `text-primary`.
3. **Wrapper re-export** di kedua web app disesuaikan agar meneruskan seluruh sub-komponen baru (bukan lagi `Select, type SelectProps`).
4. **Migrasi 13 call site** dari pola `<Select><option>` + `onChange(e)` ke `<Select value onValueChange>` + `<SelectTrigger><SelectValue/><SelectContent><SelectItem>`:
   - `apps/finance-tracker-web/src/routes/transactions_.create.tsx` (kategori, react-hook-form `Controller`)
   - `apps/finance-tracker-web/src/components/DeleteCategoryDialog.tsx` (kategori pengganti)
   - `apps/finance-tracker-web/src/routes/transactions.tsx` (filter kategori)
   - `apps/finance-tracker-web/src/routes/budget.tsx` (kategori anggaran)
   - `apps/finance-tracker-web/src/routes/net-worth.tsx` (kategori aset & liabilitas)
   - `apps/habbit-tracker-web/src/components/HabitForm.tsx` (frekuensi)
   - `apps/habbit-tracker-web/src/components/activity/yearly-activity-heatmap.tsx` (tahun, user, habit)
   - `apps/habbit-tracker-web/src/components/activity/monthly-habit-table.tsx` (bulan, tahun, frekuensi)
5. **Perbarui static QA runner** `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` agar asersinya mengikuti struktur compound baru (bukan lagi `React.forwardRef`/`SelectProps`).

## Design decisions
1. **Compound component, bukan pembungkus native.** Tujuan tugas ini memang mengganti dropdown native; mempertahankan `<option>` sebagai API hanya akan menambah lapisan tanpa mengubah hasil render.
2. **Pakai `radix-ui` unified package**, sama seperti `dialog.tsx`. Tidak menambah dependensi baru dan menjaga konsistensi impor di `@repo/ui`.
3. **Token desain repo, bukan token shadcn default.** `packages/tailwind-config/theme.css` hanya mendefinisikan `primary`, `secondary`, `accent`, `highlight`, `shared-bg`, `card-surface`, `border-color`, `text-primary`, `text-secondary`. Memakai `bg-popover`/`text-popover-foreground` akan menghasilkan class tanpa CSS.
4. **Nilai kosong tidak boleh dipakai sebagai `SelectItem`.** Radix melempar error untuk `value=""`. Opsi "semua"/"tanpa pilihan" memakai sentinel (`"all"`) yang dipetakan kembali ke state string kosong, atau dipindahkan ke `placeholder` pada `SelectValue`.
5. **Nilai numerik dikonversi di boundary.** Radix `onValueChange` selalu memberi `string`; state numerik (`selectedYear`, `selectedMonth`) dikonversi dengan `Number()` di call site.
6. **Tidak ada komponen `NativeSelect` yang dipertahankan.** Semua pemakaian dimigrasikan; menyisakan dua API select berdampingan akan mengundang pemakaian yang salah ke depannya.

## Out of scope
1. Mengganti komponen form lain (`Input`, `Textarea`) menjadi versi shadcn.
2. Menambah fitur pencarian/filter di dalam dropdown (combobox).
3. Mengubah logika filter, query, atau state bisnis di halaman yang dimigrasikan.
4. Memperbaiki token `popover`/`muted`/`foreground` yang hilang pada `Dialog` (temuan terpisah).
5. Perubahan backend/API.
6. Migrasi 4 elemen `<select>` native mentah di `apps/habbit-tracker-web/src/routes/grocery-list/manage.tsx` (baris 272, 289, 526, 544). Elemen itu tidak pernah memakai komponen `Select` dari `@repo/ui`, jadi di luar lingkup "ganti component Select". Dicatat sebagai utang konsistensi terpisah.

## Success criteria
1. `packages/ui/src/components/select.tsx` mengekspor compound `Select` berbasis Radix tanpa elemen `<select>` native.
2. Tidak ada lagi elemen `<option>` di seluruh file yang mengimpor `Select` dari `@repo/ui` (diverifikasi lewat grep).
3. Seluruh 13 call site memakai `onValueChange`, dan `pnpm check-types`, `pnpm lint`, `pnpm build` lulus.
4. Static QA runner `qa-ui-components-runner.mjs` lulus dengan asersi yang diperbarui.
