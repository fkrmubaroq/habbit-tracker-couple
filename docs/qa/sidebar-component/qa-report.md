# QA Report — Komponen Sidebar Bersama, AppSwitcher Bersama, dan Penyelarasan Sidebar Finance

| Field | Nilai |
|---|---|
| Plan | `docs/prd/todo/sidebar-component/` (`PRD.md`, `ISSUES.md`) |
| Test matrix | `docs/qa/sidebar-component/test-matrix.md` |
| Tanggal eksekusi | 2026-10-24 |
| Tahap pipeline | VERIFY (`/qa`) — setelah `/dev`, sebelum `/gate` |
| Lingkungan | Lokal: habit web `:4041`, finance web `:4040`, habit API `:5051`, finance API `:5050`, MySQL `127.0.0.1:3306` |
| Hasil | **31 / 31 test case Passed, 0 Failed** |
| Regression | Tidak ada. Tidak ada test data tertinggal di database |

---

## 1. Ringkasan Hasil

| PB | Cakupan | Total | Passed | Failed |
|---|---|---|---|---|
| PB-1 | Komponen Sidebar bersama di `@repo/ui` | 5 | 5 | 0 |
| PB-2 | Penerapan Sidebar di kedua app | 7 | 7 | 0 |
| PB-3 | AppSwitcher bersama + penyelarasan sidebar finance | 9 | 9 | 0 |
| PB-4 | Logout finance end-to-end | 5 | 5 | 0 |
| PB-5 | Integritas build dan active-state | 5 | 5 | 0 |
| **Total** | | **31** | **31** | **0** |

Penggunaan automation: **22 / 31 (71%)** — memenuhi syarat (ambang V4: > 24%). 9 test case bersifat manual-by-nature (pengamatan render/visual di browser) dan tercatat sebagai `Tanpa Automation`.

---

## 2. Alat Verifikasi

| Lapis | Alat | Cakupan |
|---|---|---|
| Statis / kontrak sumber | `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` | **39 test**, termasuk 7 guard `PB-Sidebar` dan 12 guard `PB-SidebarParity` |
| API (HTTP nyata) | `apps/finance-tracker-api/tests/qa-auth-logout-runner.mjs` (**baru**, dibuat di sesi `/qa` ini) | 3 test: preflight cookie bersama, `POST /api/auth/logout`, `GET /api/auth/me` → 401 |
| Browser nyata | Browser agent terhadap app dev yang berjalan (`:4040`, `:4041`) dengan sesi login asli (`romeo` / `password123`) | Render sidebar, modal switcher, navigasi switcher, alur logout |
| Responsif (CSS build asli) | Harness iframe 375px / 1056px yang memuat `apps/*/dist/assets/*.css` hasil `pnpm build` | `display` sidebar per breakpoint |
| Gate monorepo | `pnpm check-types`, `pnpm lint`, `pnpm build` | Seluruh workspace |

Catatan: repo ini belum punya framework E2E (Playwright/Cypress) terpasang, jadi verifikasi browser dilakukan lewat browser agent terhadap app dev yang berjalan, bukan spec E2E persisten. Ini dicatat eksplisit — tidak ada verifikasi yang dilewati diam-diam. Baris matriks yang tidak punya test code persisten ditandai `Tanpa Automation` dengan langkah manual yang reprodusibel.

---

## 3. Bukti per Area

### 3.1 E2E-1 — Sidebar habit di desktop (TC2-4)

App dev `http://localhost:4041/`, viewport **1056×875**, login `romeo`:

```json
{
  "display": "flex", "position": "fixed", "width": "256px",
  "rect": { "top": 0, "left": 0, "height": 875 },
  "header": "Habit Pasutri | Core App | 🦖 | Romeo | HUSBAND | …",
  "nav": ["Beranda", "Goals", "Habit", "Aktivitas", "Pengaturan"],
  "active": ["Beranda"],
  "footer": "BUAT HABIT | Keluar"
}
```

Mobile header (`md:hidden`) juga terverifikasi masih merender `AppSwitcher` varian `isMobileHeader` (teks "Habit Pasutri" + chevron, tanpa badge) — refactor `AppSwitcher` tidak merusak header mobile habit.

### 3.2 E2E-2 — Sidebar finance di desktop (TC2-5)

App dev `http://localhost:4040/`, viewport **1056×875** (juga dicek 1000×700):

```json
{
  "display": "flex", "position": "fixed", "width": "256px",
  "rect": { "top": 0, "left": 0, "height": 875 },
  "header": "💰 | Keuangan Pasutri | Mini App | 🦖 | Romeo | HUSBAND | …",
  "nav": ["Dashboard", "Transaksi", "Budget", "Laporan", "Net Worth", "Pengaturan"],
  "active": ["Dashboard"],
  "footer": "+ TRANSAKSI | Keluar",
  "hasBrand": false, "hasHabitLink": false, "hasThemeLabel": false
}
```

Tiga elemen yang diminta dihapus terbukti absen dari sidebar: brand "Finance Tracker", "Buka Habit Tracker", dan label "Tema:".

### 3.3 E2E-3 — Sidebar tersembunyi di mobile, tampil di desktop (TC2-6, TC5-4)

Harness iframe memakai CSS build asli hasil `pnpm build`:

| Frame | Viewport | `display` | `position` | `width` |
|---|---|---|---|---|
| habit 375 | 375×480 | **none** | fixed | 256px |
| habit 1056 | 1056×480 | **flex** | fixed | 256px |
| finance 375 | 375×480 | **none** | fixed | 256px |
| finance 1056 | 1056×480 | **flex** | fixed | 256px |

Konfirmasi tambahan pada CSS build: `.hidden{display:none}` berada di scope global (byte 9341), sedangkan `.md\:flex{display:flex}` berada di dalam `@media (min-width: 48rem)` (byte 35042). Karena `md:flex` muncul setelah `hidden` dengan spesifisitas sama, sidebar tampil ≥ 768px dan tersembunyi di bawahnya — persis yang diharapkan. Regresi Fase 5b tidak kembali.

### 3.4 E2E-4 — Modal AppSwitcher (TC3-7, TC3-8)

Finance `:4040` — klik trigger di header sidebar:

```json
{
  "title": "Pilih Aplikasi Pasutri",
  "subtitle": "Ganti ruang kerja bersama pasangan",
  "entries": [
    "💖 | Habit Pasutri | CORE APP | Pelacak kebiasaan & streak bersama pasangan",
    "🛒 | Grocery List | MINI APP | Daftar belanjaan & kebutuhan dapur pasutri",
    "💰 | Keuangan Pasutri | MINI APP | Pencatatan pengeluaran & tabungan bersama"
  ],
  "hasComingSoon": true,
  "activeMarkedByCheck": true,
  "bodyOverflow": "hidden"
}
```

Habit `:4041` — pilih "Grocery List" dari modal:

```json
{
  "path": "/grocery-list",
  "header": "🛒 | Grocery List | Mini App | 🦖 | Romeo | HUSBAND | …",
  "nav": ["Daftar Belanja", "Belanja", "Pengaturan"],
  "active": ["Daftar Belanja"],
  "modalClosed": true
}
```

Navigasi berjalan client-side (tanpa reload penuh) dan sidebar ikut berganti konteks app. Emoji 💰 tampil benar di kedua app — sebelumnya karakter rusak `U+FFFD`.

### 3.5 E2E-5 — Active-state per route (TC5-2, TC5-3)

| App | Route | Menu aktif | Jumlah aktif |
|---|---|---|---|
| habit | `/grocery-list` | Daftar Belanja | 1 |
| habit | `/grocery-list/manage` | Belanja | 1 |
| habit | `/grocery-list/settings` | Pengaturan | 1 |
| finance | `/transactions` | Transaksi | 1 |
| finance | `/transactions/create` | Transaksi | 1 |
| finance | `/` | Dashboard | 1 |
| finance | `/budget` | Budget | 1 |
| finance | `/net-worth` | Net Worth | 1 |

> **Bug ditemukan dan diperbaiki selama sesi `/qa` ini:** versi awal Fase 3 menandai `/grocery-list` sebagai `match: "prefix"`, sehingga `/grocery-list/manage` menyalakan **dua** menu sekaligus ("Daftar Belanja" + "Belanja"). Prefix hanya benar bila sub-route tidak punya item menu sendiri (seperti `/transactions`). Item `/grocery-list` dikembalikan ke `exact`, guard runner diperbarui agar mengassert kebalikannya, dan seluruh route grocery diverifikasi ulang di browser (tabel di atas). Detail tercatat di `ISSUES.md` Fase 5d.

### 3.6 E2E-6 — Logout finance end-to-end (TC4-1 … TC4-5)

**API** (`qa-auth-logout-runner.mjs`, HTTP nyata ke `:5050`):

```
[PREFLIGHT] Shared cookie is accepted by finance /api/auth/me... PASSED
[TC4-1] POST /api/auth/logout returns 200 and clears the token cookie... PASSED
[TC4-2] GET /api/auth/me returns 401 once the cookie is gone... PASSED
Results: 3 passed, 0 failed
```

TC4-1 memvalidasi lebih dari status 200: `Set-Cookie` harus memuat `token=;`, `Max-Age=0` (atau `Expires` epoch), `Path=/`, dan `HttpOnly` — agar penghapusan cookie benar-benar mengenai cookie bersama yang diterbitkan app habit, bukan sekadar membalas 200.

**State in-flight UI** (TC4-4) — dengan XHR dibekukan agar request tidak pernah resolve:

| | Label | `disabled` | Spinner |
|---|---|---|---|
| Sebelum klik | `Keluar` | `false` | tidak |
| Saat proses | `Keluar...` | `true` | ya |

Sesi tetap hidup (200) selama percobaan ini, membuktikan tidak ada efek samping.

**Alur penuh** (TC4-5) — klik "Keluar" di `:4040`:

| Tahap | Hasil |
|---|---|
| URL setelah klik | `http://localhost:4041/login` |
| `document.cookie` | kosong |
| `GET :4040/api/auth/me` | **401** — `{"success":false,"error":"Unauthorized: Token tidak valid atau tidak ditemukan"}` |
| `GET :4041/api/auth/me` | **401** — `{"error":"Unauthorized: Token missing"}` |

Cookie benar-benar dihapus dari browser (bukan hanya di sisi server), dan sesi bersama habit juga ikut berakhir sesuai desain satu-sesi.

### 3.7 CSS build — utility khusus `packages/ui` (TC5-1)

Kedua CSS build memuat seluruh utility yang sebelumnya tidak pernah di-generate:

| Utility | habit | finance |
|---|---|---|
| `md:flex` | 1 | 1 |
| `w-64` | 1 | 1 |
| `h-4.5` | 1 | 1 |
| `bg-pink-100` | 1 | 1 |
| `bg-emerald-100` | 1 | 1 |
| `bg-amber-100` | 1 | 1 |
| `bg-blue-100` | 1 | 1 |
| `border-3` | 1 | 1 |
| `backdrop-blur-xs` | 1 | 1 |

`bg-*-100` dan `border-3` hanya dipakai di `packages/ui/src/components/app-switcher.tsx`; kehadirannya membuktikan `@source "../ui/src"` bekerja untuk komponen baru juga, bukan hanya `Sidebar`.

### 3.8 Gate monorepo (TC5-5)

| Gate | Hasil |
|---|---|
| `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` | **39 passed, 0 failed** |
| `node apps/finance-tracker-api/tests/qa-auth-logout-runner.mjs` | **3 passed, 0 failed** |
| `pnpm check-types` | **5/5 task sukses** |
| `pnpm lint` | **5/5 task sukses**, 0 error, 51 warning pra-ada (tidak bertambah) |
| `pnpm build` | **4/4 task sukses** |

Konsol browser kedua app: **0 error**.

---

## 4. Traceability ke Success Criteria PRD

| # | Success criterion | Test case | Status |
|---|---|---|---|
| 1 | `Sidebar` menerima `items`/`activePath`/`linkComponent`, tanpa impor TanStack Router | TC1-1 | ✅ |
| 2 | Kedua `__root.tsx` tanpa `<aside>` inline | TC2-1, TC2-2 | ✅ |
| 3 | Bottom nav finance dari `components/navigation/bottom-nav.tsx` | TC2-3 | ✅ |
| 4 | Active-state benar untuk sub-route, tepat satu menu aktif | TC5-2, TC5-3 | ✅ |
| 5 | Runner UI lulus dengan asersi diperbarui | TC5-5 | ✅ |
| 6 | `check-types`, `lint`, `build` lulus | TC5-5 | ✅ |
| 7 | `AppSwitcher` bersama, router-agnostik | TC3-1 | ✅ |
| 8 | Sidebar finance = habit, tanpa brand/link habit/toggle tema | TC2-5, TC3-4, TC3-5, TC3-6 | ✅ |
| 9 | Logout finance benar-benar mengakhiri sesi | TC4-1, TC4-2, TC4-5 | ✅ |
| 10 | App switcher kedua app menampilkan daftar app yang sama | TC3-7, TC3-8 | ✅ |

Tidak ada `⚠️ Gap` pada mini traceability di matriks.

---

## 5. Temuan

### 5.1 Bug ditemukan & diperbaiki saat `/qa` (blocking, sudah selesai)

**Dua menu grocery aktif bersamaan.** `match: "prefix"` pada item `/grocery-list` membuat "Daftar Belanja" dan "Belanja" menyala bersamaan di `/grocery-list/manage`. Penyebab: prefix diterapkan pada induk yang sub-route-nya sudah punya item menu sendiri. Perbaikan: kembalikan ke `exact`; guard runner diubah dari "harus prefix" menjadi "harus **tidak** prefix" agar regresi ini tidak bisa kembali. Diverifikasi ulang di browser untuk ketiga route grocery.

### 5.2 Observasi non-blocking

1. **Belum ada spec E2E persisten.** Repo belum memasang Playwright/Cypress; verifikasi browser dilakukan lewat browser agent. Jika pipeline ke depan butuh regresi otomatis untuk UI, ini kandidat untuk `webapp-testing`.
2. **`QuickThemeToggle` di mobile header finance dipertahankan** (sesuai Out of scope PRD poin 3). Artinya di layar kecil masih ada link "Buka Habit Tracker" + toggle tema, sementara di desktop keduanya sudah digantikan AppSwitcher. Bukan bug, tetapi ketidaksimetrisan yang disengaja.
3. **`pnpm lint` 51 warning pra-ada** (import tak terpakai, `any` eksplisit) tersebar di file di luar plan ini. Tidak bertambah oleh pekerjaan sidebar.

---

## 6. Kebersihan Data & Proses

| Item | Status |
|---|---|
| Test data di database | **Tidak ada yang dibuat.** Runner logout hanya login → logout, tanpa mutasi. |
| Verifikasi DB pasca-run | `finance_categories` 16 (seed), `finance_transactions` 1 (data nyata "hidayah"), `finance_assets` 0, `finance_liabilities` 0, `users` 2 — sama seperti baseline. Query `qa-test-%` = 0 baris di semua tabel. |
| Sesi login | Dipulihkan (`romeo`) setelah uji logout, agar lingkungan dev tetap bisa dipakai. |
| Proses dev yang dijalankan untuk verifikasi | Server statis sementara `python3 -m http.server :4600` untuk harness responsif — **sudah dimatikan**. |
| Direktori sementara | `…/T/opencode/qa-sidebar` (salinan CSS build + harness iframe) — **sudah dihapus**. |
| Tab browser harness | **Sudah ditutup**. |
| Proses dev app (`:4040`, `:4041`, `:5050`, `:5051`, MySQL) | Sudah berjalan sebelum sesi ini; dibiarkan hidup, bukan dijalankan oleh `/qa`. |

---

## 7. Kesimpulan

Seluruh 31 test case pada matriks lulus. Sepuluh success criteria PRD terpenuhi dan tertelusuri. Satu bug nyata (active-state ganda pada menu grocery) ditemukan lewat verifikasi browser, diperbaiki, dan dikunci dengan guard regresi. Tidak ada test data tertinggal dan tidak ada proses verifikasi yang masih berjalan.

Plan siap masuk tahap **REVIEW (`/gate`)**.
