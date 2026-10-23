# Issues — Ganti `Select` Native dengan `Select` Shadcn UI

## Fase 1: Komponen `@repo/ui`
- [x] Tulis ulang `packages/ui/src/components/select.tsx` menjadi compound component Radix (`Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`) memakai `SelectPrimitive` dari `radix-ui`
- [x] Styling trigger/content/item memakai token repo (`card-surface`, `border-color`, `text-primary`, `text-secondary`, `highlight`, `primary`), bukan token shadcn default
- [x] Perbarui `apps/finance-tracker-web/src/components/ui/select.tsx` agar me-re-export seluruh sub-komponen baru
- [x] Perbarui `apps/habbit-tracker-web/src/components/ui/select.tsx` agar me-re-export seluruh sub-komponen baru

## Fase 2: Migrasi Call Site `finance-tracker-web`
- [x] Migrasikan Select kategori di `apps/finance-tracker-web/src/routes/transactions_.create.tsx` (react-hook-form `Controller` → `onValueChange`)
- [x] Migrasikan Select kategori pengganti di `apps/finance-tracker-web/src/components/DeleteCategoryDialog.tsx`
- [x] Migrasikan Select filter kategori di `apps/finance-tracker-web/src/routes/transactions.tsx` (opsi "Semua Kategori" pakai sentinel `all`)
- [x] Migrasikan Select kategori di `apps/finance-tracker-web/src/routes/budget.tsx`
- [x] Migrasikan Select kategori aset & liabilitas di `apps/finance-tracker-web/src/routes/net-worth.tsx`

## Fase 3: Migrasi Call Site `habbit-tracker-web`
- [x] Migrasikan Select frekuensi di `apps/habbit-tracker-web/src/components/HabitForm.tsx`
- [x] Migrasikan 3 Select filter (tahun, user, habit) di `apps/habbit-tracker-web/src/components/activity/yearly-activity-heatmap.tsx`
- [x] Migrasikan 3 Select filter (bulan, tahun, frekuensi) di `apps/habbit-tracker-web/src/components/activity/monthly-habit-table.tsx`

## Fase 4: Test & Verifikasi
- [x] Perbarui asersi `Select` pada `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` mengikuti struktur compound baru
- [x] Jalankan `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` (21 passed, 0 failed)
- [x] Pastikan tidak ada lagi elemen `<option>` di file yang memakai `Select` dari `@repo/ui` (4 sisa `<select>` mentah di `grocery-list/manage.tsx` di luar scope — lihat PRD "Out of scope" butir 6)
- [x] Jalankan `pnpm check-types`, `pnpm lint`, dan `pnpm build`
- [x] Verifikasi `/qa` — laporan lengkap di `docs/qa/shadcn-select/qa-report.md` (render SSR komponen, resolusi 10 ekspor kedua wrapper, audit 13 call site, 21/21 + 5/5 runner, 3 gerbang monorepo). Keterbatasan: interaksi dropdown di browser belum terbukti karena repo tidak memiliki framework E2E.

## Fase 5: Perbaikan Temuan Review (/gate)

- [ ] **Perbaiki tinggi viewport `SelectContent` yang tercekik.** `packages/ui/src/components/select.tsx:94` memakai `position = "popper"` (shadcn aslinya `item-aligned`), dan cabang popper di baris 118 memasang `h-[var(--radix-select-trigger-height)]`. Di mode popper Radix mengisi `--radix-popper-anchor-height` dengan `${anchorHeight}px` (terverifikasi di `@radix-ui/react-popper`), sehingga variabel itu bernilai tinggi trigger (44px dari `h-11`) dan viewport terkunci setinggi satu baris — daftar 6 item hanya menampilkan ~1 item dan harus di-scroll. Perbaiki dengan mengubah default menjadi `position = "item-aligned"` (menyamai shadcn) **atau** membuang `h-[var(--radix-select-trigger-height)]` dari cabang popper dan membiarkan `max-h-96` + `--radix-select-content-available-height` yang membatasi tinggi.
- [ ] **Samakan nilai default kategori liabilitas dengan opsi yang tersedia.** `apps/finance-tracker-web/src/routes/net-worth.tsx:65` menginisialisasi `liabilityCategory` dengan `"Pinjaman"`, sedangkan `SelectItem` di baris 432-436 hanya berisi `KPR`, `Kendaraan`, `Kartu Kredit`, `Pinjaman Bank`, `Lainnya`. Karena `value` non-kosong tidak cocok dengan item mana pun, Radix merender trigger **kosong** dan menekan placeholder (terbukti lewat render SSR: teks placeholder hilang saat `value="Pinjaman"`, muncul saat `value={undefined}`), sementara submit tanpa menyentuh field tetap mengirim `category: "Pinjaman"` (backend `createLiabilitySchema` menerima string apa pun). Perbaiki dengan mengubah nilai awal ke opsi yang benar-benar ada (`"KPR"`), atau menambahkan `SelectItem` untuk `"Pinjaman"` agar nilai awal punya representasi di UI.

## Fase 6: Review Closing
- [ ] Review (`/gate`) lulus
