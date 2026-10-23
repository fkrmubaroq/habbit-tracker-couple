# QA Verification Report — Ganti `Select` Native dengan `Select` Shadcn UI

- **Slug:** `shadcn-select`
- **Tanggal Pengujian:** 2026-10-23
- **Tester:** opencode QA (VERIFY stage)
- **Target Stack:** `@repo/ui` (`packages/ui`), React Vite SPA `apps/finance-tracker-web`, React Vite SPA `apps/habbit-tracker-web`
- **Sumber requirement:** `docs/prd/todo/shadcn-select/PRD.md`
- **Status Akhir:** ✅ **PASSED** untuk seluruh lapisan yang dapat dieksekusi di repo ini — dengan **1 keterbatasan yang dinyatakan eksplisit** (lihat Bagian 5)

---

## 1. Ringkasan Eksekutif

Verifikasi dijalankan terhadap implementasi penggantian `Select` native menjadi compound component Radix di `@repo/ui`, beserta migrasi 13 call site di dua web app.

Seluruh eksekusi otomatis lulus: **21/21** test UI, **5/5** test tema, **5/5** workspace `check-types`, **5/5** workspace `lint`, **4/4** build. Ditambah tiga verifikasi runtime yang ditulis khusus untuk pass ini (render SSR komponen, resolusi 10 ekspor dari kedua wrapper app, dan audit struktur 13 call site) — semuanya lulus.

**Catatan penting:** repo ini **tidak memiliki** framework browser E2E (Playwright/Cypress/Vitest tidak terpasang), sehingga interaksi dropdown nyata di browser (buka menu, navigasi keyboard, scroll, klik opsi) **belum terbukti secara otomatis**. Ini dicatat sebagai keterbatasan, bukan sebagai lulus.

---

## 2. Hasil per Fase Plan

### Fase 1 — Komponen `@repo/ui`

| Item | Verifikasi | Status |
|---|---|---|
| Compound component Radix | `packages/ui/src/components/select.tsx` mengimpor `SelectPrimitive` dari `radix-ui`; tidak ada `<select` native | Passed |
| 10 sub-komponen diekspor | Runtime import: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton` | Passed |
| Token desain repo (bukan token shadcn default) | Tidak ada `bg-popover`/`text-popover-foreground`/`bg-muted`; memakai `card-surface`, `border-color`, `text-primary`, `text-secondary`, `highlight`, `primary` | Passed |
| Wrapper `finance-tracker-web` | 10 ekspor ter-resolve sebagai fungsi | Passed |
| Wrapper `habbit-tracker-web` | 10 ekspor ter-resolve sebagai fungsi | Passed |

### Fase 2 — Call Site `finance-tracker-web`

| File | `<Select>` | `onValueChange` | `<option>` | `onChange` pada Select | Status |
|---|---|---|---|---|---|
| `routes/transactions_.create.tsx` | 1 | 1 | 0 | 0 | Passed |
| `components/DeleteCategoryDialog.tsx` | 1 | 1 | 0 | 0 | Passed |
| `routes/transactions.tsx` | 1 | 1 | 0 | 0 | Passed |
| `routes/budget.tsx` | 1 | 1 | 0 | 0 | Passed |
| `routes/net-worth.tsx` | 2 | 2 | 0 | 0 | Passed |

### Fase 3 — Call Site `habbit-tracker-web`

| File | `<Select>` | `onValueChange` | `<option>` | `onChange` pada Select | Status |
|---|---|---|---|---|---|
| `components/HabitForm.tsx` | 1 | 1 | 0 | 0 | Passed |
| `components/activity/yearly-activity-heatmap.tsx` | 3 | 3 | 0 | 0 | Passed |
| `components/activity/monthly-habit-table.tsx` | 3 | 3 | 0 | 0 | Passed |

### Fase 4 — Test & Verifikasi

| Item | Perintah | Hasil |
|---|---|---|
| Static QA runner UI | `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` | 21 passed, 0 failed |
| Static QA runner tema | `node apps/finance-tracker-web/tests/qa-theme-runner.mjs` | 5 passed, 0 failed |
| Type-check monorepo | `pnpm check-types` | 5 successful, 5 total |
| Lint monorepo | `pnpm lint` | 5 successful, 5 total (0 error, 51 warning pra-ada) |
| Build monorepo | `pnpm build` | 4 successful, 4 total |

---

## 3. Verifikasi Runtime Tambahan (khusus pass ini)

### A. Render komponen nyata (`react-dom/server`)

Komponen dirender melalui `tsx` dengan API compound baru:

```text
RENDER_OK
<button type="button" role="combobox" aria-expanded="false" ... data-slot="select-trigger">
  <span data-slot="select-value"></span>
  <svg class="lucide lucide-chevron-down ...">...</svg>
</button>
```

Hasil: trigger ter-render sebagai `role="combobox"` (aksesibilitas Radix benar), ikon `ChevronDown` muncul, tidak ada error runtime. Elemen `<select aria-hidden="true">` yang muncul di HTML adalah **hidden form-compat bawaan Radix**, bukan `<select>` native yang dirender ke user.

### B. Resolusi ekspor dari kedua wrapper aplikasi

```text
finance.Select -> OK ... finance.SelectScrollDownButton -> OK   (10/10)
habit.Select   -> OK ... habit.SelectScrollDownButton   -> OK   (10/10)
WRAPPERS_OK
```

### C. Audit struktur 13 call site

```text
File                        Select Trigger Content Value Match
transactions_.create.tsx         1       1       1     1  True
DeleteCategoryDialog.tsx         1       1       1     1  True
transactions.tsx                 1       1       1     1  True
budget.tsx                       1       1       1     1  True
net-worth.tsx                    2       2       2     2  True
HabitForm.tsx                    1       1       1     1  True
yearly-activity-heatmap.tsx      3       3       3     3  True
monthly-habit-table.tsx          3       3       3     3  True
MISMATCH_COUNT=0
```

Tambahan: **tidak ada** `SelectItem` dengan `value=""` di seluruh `apps/**` — penting karena Radix melempar error untuk nilai kosong. Opsi "semua/tanpa pilihan" memakai sentinel (`all`) atau `placeholder`.

---

## 4. Regresi yang Dicek

1. **`grocery-list/manage.tsx`** masih memakai 4 `<select>` native mentah. Elemen ini **tidak pernah** memakai komponen `Select` dari `@repo/ui`, jadi sengaja tidak disentuh dan sudah tercatat sebagai out-of-scope butir 6 di PRD. Tidak ada regresi.
2. **`habbit-tracker-web` halaman lain** tetap ter-build (`pnpm build` 4/4 sukses), menandakan perubahan `HabitForm` dan dua komponen activity tidak merusak kompilasi.
3. **`finance-tracker-web`** seluruh route tetap ter-build, termasuk route yang memakai Select di dalam `Dialog` (`budget.tsx`, `net-worth.tsx`, `DeleteCategoryDialog.tsx`) — tidak ada konflik portal/focus trap yang terdeteksi saat build.

---

## 5. Keterbatasan Verifikasi (dinyatakan eksplisit)

1. **Tidak ada browser E2E di repo ini.** Playwright, Cypress, Vitest, dan Jest tidak terpasang. Satu-satunya eksekusi otomatis adalah runner `.mjs` berbasis pembacaan file + `fetch`.
2. **Interaksi dropdown belum diuji otomatis.** Membuka menu, navigasi keyboard (panah/Enter/Escape), scroll pada daftar panjang, dan klik opsi di dalam `SelectContent` memerlukan browser sungguhan. Semua ini **belum terbukti**.
3. **`finance-tracker-api/tests/qa-api-runner.mjs` tidak dijalankan** pada pass ini karena membutuhkan server habit + finance hidup dan tidak menyentuh komponen `Select`.
4. **Test matrix V4 formal belum ada** untuk slug ini (`docs/qa/shadcn-select/test-matrix.md` tidak dibuat di sini — pembuatan matrix adalah tugas `qa-engineer`/`test-case-matrix`, bukan `/qa`).

---

## 6. Kesimpulan

Implementasi `shadcn-select` **lulus** seluruh verifikasi yang dapat dieksekusi di lingkungan ini: render komponen, resolusi ekspor, struktur 13 call site, dua suite QA runner, serta tiga gerbang kualitas monorepo.

Sisa risiko terpusat pada perilaku interaktif dropdown di browser (Bagian 5 butir 2). Bila perilaku itu ingin dibuktikan, jalankan `qa-engineer` / `/test-case-matrix shadcn-select` lebih dulu agar coverage browser bisa dibuat, lalu ulangi `/qa`.

Langkah berikutnya: **`/gate`**.
