# Review Report — Ganti `Select` Native dengan `Select` Shadcn UI

- **Slug:** `shadcn-select`
- **Tanggal Review:** 2026-10-24
- **Reviewer:** opencode REVIEW stage (`/gate`)
- **Metodologi:** `code-review-and-quality` (lima axis) + `security-review`
- **Sumber requirement:** `docs/prd/todo/shadcn-select/PRD.md`
- **Prasyarat verifikasi:** `docs/qa/shadcn-select/qa-report.md` — status **PASSED** (butir verifikasi `/qa` di `ISSUES.md` sudah tercentang)
- **Status Akhir:** ❌ **Changes requested — 1 temuan blocking**

---

## 1. Ringkasan

Review menutup dua temuan blocking yang tercatat pada pass `/gate` sebelumnya. Hasilnya terbelah:

| # | Temuan lama | Status pass ini | Dasar |
|---|---|---|---|
| B1 | Viewport `SelectContent` terkunci 44px | **DIBATALKAN — false positive** | Diukur pada komponen + Tailwind + Radix nyata; viewport = 224px, 6/6 item tampil |
| B2 | Default kategori liabilitas tidak cocok dengan opsi | **Dikonfirmasi — masih terbuka** | Diukur pada browser nyata; trigger dirender kosong |

Tidak ada temuan blocking baru. Sembilan catatan non-blocking tetap sebagai backlog terpisah.

---

## 2. B1 — Dibatalkan (false positive)

**Klaim sebelumnya:** `packages/ui/src/components/select.tsx:118` memasang `h-[var(--radix-select-trigger-height)]`, dan di mode popper variabel itu bernilai tinggi trigger (44px), sehingga viewport terkunci setinggi satu baris.

**Mengapa klaim itu keliru.** `SelectViewport` milik Radix memasang inline style:

```text
position: relative; flex: 1 1 0%; overflow: hidden auto;
```

`flex: 1 1 0%` berarti `flex-basis: 0%`. Pada flex container kolom, `flex-basis` yang bukan `auto` menggantikan `height` sebagai ukuran main-axis — sehingga kelas `h-[var(...)]` tidak pernah menjadi tinggi terpakai.

**Pengukuran pada komponen nyata** (Vite + `@repo/ui` + `@repo/tailwind-config` + Radix, dropdown dipaksa terbuka lewat `defaultOpen`, 6 item):

```text
viewportClass        = "p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
--radix-select-trigger-height = 44px          ← variabel memang resolve ke 44px
inline style viewport         = "position: relative; flex: 1 1 0%; overflow: hidden auto;"
computed height               = 224px         ← bukan 44px
viewportHeight / scrollHeight = 224 / 224
content height                = 228px
jumlah item                   = 6 (keenamnya tampil penuh, tidak perlu scroll)
```

Kontrol pembanding tanpa kelas tinggi menghasilkan tinggi identik (224px). **Kelas itu tidak berefek, jadi tidak ada yang perlu diperbaiki.**

**Akar kesalahan pass sebelumnya:** bukti yang dipakai adalah "render SSR", padahal portal `SelectContent` tidak dirender saat dropdown tertutup — sehingga markup yang diperiksa tidak pernah memuat viewport yang dimaksud.

**Tindakan:** butir B1 di `ISSUES.md` Fase 5 diubah menjadi tercentang dengan catatan pembatalan + bukti, agar `/dev` tidak mengerjakan perubahan yang tidak perlu (mengubah default `position` ke `item-aligned` justru menyimpang dari default shadcn).

---

## 3. B2 — Blocking, masih terbuka

`apps/finance-tracker-web/src/routes/net-worth.tsx:65` menginisialisasi `liabilityCategory` dengan `"Pinjaman"`, sedangkan `SelectItem` di baris 432-436 hanya berisi `KPR`, `Kendaraan`, `Kartu Kredit`, `Pinjaman Bank`, `Lainnya`.

**Mekanisme** (dari sumber `@radix-ui/react-select@2.3.8`):

```js
function shouldShowPlaceholder(value) {
  return value === "" || value === void 0;
}
```

Nilai `"Pinjaman"` bukan `""`/`undefined`, jadi placeholder ditekan. Karena tidak ada `SelectItem` dengan nilai itu, tidak ada teks item yang diporting ke `SelectValue` — trigger kosong total.

**Bukti pada browser nyata** (komponen asli, empat kasus):

| `value` | Teks trigger | `data-placeholder` |
|---|---|---|
| `"Pinjaman"` (repro) | `""` (kosong) | tidak ada |
| `"Pinjaman Bank"` (kontrol) | `"Pinjaman Bank"` | tidak ada |
| `undefined` (kontrol) | `"Kategori"` | ada |
| `"Tabungan"` (kontrol) | `"Tabungan"` | tidak ada |

**Dampak.** Dialog "Tambah Liabilitas" terbuka dengan field kategori kosong. Bila user tidak menyentuhnya, `handleSaveLiability` (baris 89) tetap mengirim `category: "Pinjaman"`, dan backend menerimanya karena `createLiabilitySchema.category` hanya `z.string().default("Pinjaman")` (`packages/types/src/finance.ts:237`) — bukan enum. Hasilnya liabilitas tersimpan dengan kategori yang tidak punya representasi di daftar UI.

**Cakupan.** Pemindaian sistematis seluruh 13 instance `Select` di 8 file menemukan kasus ini **hanya** di satu baris tersebut. Nilai lain valid: `transactions.tsx` memakai sentinel `"all"` yang punya item, `assetCategory = "Tabungan"` punya item, `budget.tsx`/`DeleteCategoryDialog.tsx`/`transactions_.create.tsx` memakai `value={x || undefined}` sehingga jatuh ke placeholder, dan seluruh filter habit (`"me"`, `"all"`, `"daily"`, `"weekly"`, `"monthly"`) punya item.

**Perbaikan yang diminta:** lihat butir `- [ ]` di `ISSUES.md` Fase 5 — pilih (a) nilai awal diganti opsi yang ada, atau (b) tambah `SelectItem value="Pinjaman"` (konsisten dengan default backend). Sekalian reset `liabilityCategory` setelah submit.

---

## 4. Catatan Non-Blocking

Tidak ditulis balik ke `ISSUES.md`; tetap sebagai backlog terpisah.

| # | Catatan |
|---|---|
| N1 | Varian `size="sm"` pada `SelectTrigger` praktis rusak: `h-11` ada di kelas dasar dan `h-9` ditambahkan setelahnya, tetapi keduanya utilitas `height` — pemenangnya ditentukan urutan CSS hasil build, bukan urutan string, sehingga `h-9` kemungkinan besar kalah. Varian ini tidak dipakai di mana pun (`size="sm"` = 0 occurrence), jadi belum berdampak. |
| N2 | Tiga call site habit memakai cast `as any` pada `onValueChange` (`HabitForm.tsx`, `yearly-activity-heatmap.tsx`, `monthly-habit-table.tsx`), melemahkan type-safety yang justru ingin didapat dari migrasi ini. |
| N3 | Runner QA (`qa-ui-components-runner.mjs`) hanya analisis statis. Ketiadaan uji interaksi browser adalah persis celah yang meloloskan B2 — direkomendasikan menambah minimal satu pemeriksaan render/interaksi nyata. |
| N4 | Commit `3ef0bbd` membundel 21 berkas `.agents/skills/shadcn/` bersama perubahan fitur; ukuran perubahan jadi sulit ditinjau dan tidak tercatat di plan. |
| N5 | `SelectTrigger` tidak punya accessible name — `<label>` di call site adalah sibling, tidak terhubung via `htmlFor`/`aria-labelledby`. Bukan regresi (native `<select>` sebelumnya juga begitu), tetapi tetap celah a11y. |

---

## 5. Axis Review

| Axis | Hasil |
|---|---|
| **Correctness** | ❌ 1 blocking (B2). B1 dibatalkan. |
| **Readability** | ✅ Komponen mengikuti konvensi shadcn; penamaan `data-slot` konsisten. |
| **Architecture** | ✅ Wrapper re-export di 2 app sesuai pola repo. Catatan: daftar ekspor terduplikasi di 3 tempat (N-level). |
| **Performance** | ✅ Portal hanya me-mount saat terbuka; tidak ada regresi terukur. |
| **Security** | ✅ Tidak ada permukaan baru. Nilai item berasal dari id/nama kategori server dan dirender sebagai children React (ter-escape); tidak ada `dangerouslySetInnerHTML` di komponen. `radix-ui` bukan dependensi baru pada plan ini. |
| **Testing** | ⚠️ Statis saja (N3). |

---

## 6. Status Checklist Plan

- Total butir: 20 — **18 tercentang, 2 terbuka**
- `- [ ]` Fase 5: B2 (blocking)
- `- [ ]` Fase 6: `Review (/gate) lulus` — **belum dicentang** (sengaja)

Plan **tidak** dipindahkan ke `docs/prd/done/` karena belum lulus review.

---

## 7. Langkah Berikutnya

1. Jalankan **`/dev`** untuk mengerjakan satu butir `- [ ]` yang tersisa di Fase 5.
2. Setelah perbaikan, jalankan **`/qa`** ulang — perbaikan kode bisa membatalkan verifikasi sebelumnya, dan laporan QA lama tidak memuat bukti untuk perilaku trigger yang baru.
3. Lalu **`/gate`** ulang. Bila B2 tertutup dan tidak ada temuan baru, butir review Fase 6 dicentang dan plan dipindahkan ke `docs/prd/done/` lewat `move-plan.mjs`.
