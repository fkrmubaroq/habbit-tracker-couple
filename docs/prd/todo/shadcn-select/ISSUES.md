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

- [x] ~~**Perbaiki tinggi viewport `SelectContent` yang tercekik.**~~ **DIBATALKAN — false positive, diverifikasi ulang pada review pass ini.** Premisnya: cabang popper memasang `h-[var(--radix-select-trigger-height)]` sehingga viewport terkunci setinggi trigger (44px). Premis itu tidak berlaku karena `SelectViewport` Radix sendiri memasang inline `flex: 1 1 0%` (lihat `SelectViewport` di `@radix-ui/react-select`), dan pada flex container kolom `flex-basis: 0%` membuat properti `height` tidak dipakai sebagai ukuran main-axis. Terukur pada komponen nyata + Tailwind nyata + Radix nyata dengan dropdown terbuka (`defaultOpen`): `--radix-select-trigger-height` memang resolve ke `44px` dan kelasnya memang terpasang, tetapi tinggi viewport terpakai = **224px** (6 item × 36px + padding 8px), keenam item tampil penuh, `content` = 228px — identik dengan kontrol tanpa kelas tinggi. Jadi tidak ada yang perlu diperbaiki. Catatan: bukti "render SSR" pada pass `/gate` sebelumnya tidak valid, karena portal `SelectContent` tidak dirender saat dropdown tertutup.
- [x] **Samakan nilai default kategori liabilitas dengan opsi yang tersedia.** `apps/finance-tracker-web/src/routes/net-worth.tsx:65` menginisialisasi `liabilityCategory` dengan `"Pinjaman"`, sedangkan `SelectItem` di baris 432-436 hanya berisi `KPR`, `Kendaraan`, `Kartu Kredit`, `Pinjaman Bank`, `Lainnya`. Karena `shouldShowPlaceholder()` di Radix hanya bernilai true untuk `""`/`undefined`, nilai non-kosong yang tidak cocok dengan item mana pun membuat trigger dirender **kosong tanpa placeholder**. Terbukti pada browser sungguhan dengan komponen nyata: `value="Pinjaman"` → teks trigger `""` (kosong, tanpa atribut `data-placeholder`), sedangkan `value="Pinjaman Bank"` → `"Pinjaman Bank"` dan `value={undefined}` → placeholder `"Kategori"`. Akibatnya dialog "Tambah Liabilitas" terbuka dengan field kategori kosong; bila user tidak menyentuhnya, `handleSaveLiability` (baris 89) tetap mengirim `category: "Pinjaman"` dan backend menerimanya karena `createLiabilitySchema.category` hanya `z.string().default("Pinjaman")` (`packages/types/src/finance.ts:237`) — sehingga tersimpan liabilitas dengan kategori yang tidak ada di daftar UI. Perbaiki dengan salah satu: (a) ubah nilai awal menjadi opsi yang benar-benar ada (mis. `"Pinjaman Bank"`), atau (b) tambahkan `SelectItem value="Pinjaman"` agar nilai awal punya representasi di UI — opsi (b) sekaligus konsisten dengan default backend. Sekalian reset `liabilityCategory` setelah submit bersama `liabilityName`/`liabilityAmount`. **Selesai — opsi (a) + reset, lewat satu konstanta.** `DEFAULT_LIABILITY_CATEGORY = "Pinjaman Bank"` ditambahkan di dekat `formatRupiah` dengan komentar yang menjelaskan aturan Radix-nya, lalu dipakai **dua kali**: `useState(DEFAULT_LIABILITY_CATEGORY)` dan `setLiabilityCategory(DEFAULT_LIABILITY_CATEGORY)` di `handleSaveLiability`. Konstanta bersama ini sengaja dipilih agar nilai awal dan nilai reset tidak bisa menyimpang lagi — penyimpangan itulah akar masalahnya. Opsi (b) tidak dipilih karena akan memunculkan dua opsi bermakna sama di UI (`Pinjaman` dan `Pinjaman Bank`). Verifikasi: default `"Pinjaman Bank"` terbukti ada di antara `SelectItem`, tidak ada literal `useState("Pinjaman")` tersisa, `tsc --noEmit` bersih, build sukses, `qa-ui-components-runner.mjs` 39/39. Catatan untuk `/gate` (di luar scope item ini, bukan blocker): `createLiabilitySchema.category` di `packages/types/src/finance.ts:237` masih berdefault `"Pinjaman"` yang tidak ada di daftar UI; tidak menimbulkan trigger kosong karena `lib.category` dirender sebagai teks biasa (tidak pernah masuk `Select`) dan tidak ada UI edit liabilitas, tetapi kosakatanya tetap bercabang.

## Fase 6: Review Closing
- [ ] Review (`/gate`) lulus
