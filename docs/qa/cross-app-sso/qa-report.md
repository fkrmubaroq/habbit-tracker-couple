# QA Verification Report — Login Sekali untuk Semua App (Shared Cookie SSO)

- **Slug:** `cross-app-sso`
- **Tanggal Pengujian:** 2026-10-23
- **Tester:** opencode QA (VERIFY stage)
- **Target Stack:** `apps/habbit-tracker-api` (:5000), `apps/finance-tracker-api` (:1907), `apps/habbit-tracker-web` (:5173), `apps/finance-tracker-web` (:5175), MySQL 8 (`habbit_couple`)
- **Sumber requirement:** `docs/prd/done/cross-app-sso/PRD.md`
- **Status Akhir:** ✅ **PASSED** untuk seluruh mekanisme yang dapat dieksekusi (23/23 cek API + 3/3 cek build/bundle). Keterbatasan browser dijelaskan di Bagian 5.

---

## 1. Ringkasan Eksekutif

Verifikasi dijalankan terhadap **server yang benar-benar hidup**: kedua API (`tsx watch`) dan kedua Vite dev server sudah berjalan, MySQL 8 aktif. Tidak ada server yang saya nyalakan sendiri, sehingga tidak ada proses yang perlu dimatikan di akhir.

Hasil: **23 dari 23** pemeriksaan API lulus, ditambah 3 pemeriksaan artefak build/bundle. Satu temuan terpisah ditemukan pada suite regresi `qa-api-runner.mjs` (3 assertion gagal karena data nyata di DB, bukan karena plan ini) — dijelaskan di Bagian 4.

| Lapisan | Hasil |
|---|---|
| Cek API lintas app (cookie, 401, redirect whitelist, logout) | **23/23 Passed** |
| Cek artefak build (localStorage, Bearer, URL app lain) | **3/3 Passed** |
| `qa-api-runner.mjs` finance (regresi, sudah diperbaiki di Fase 7) | 13/16 Passed — 3 gagal karena data DB nyata (lihat Bagian 4) |
| Kebersihan data uji | 0 transaksi & 0 kategori `qa-test` tersisa |

---

## 2. Bukti Eksekusi — Cek API Lintas App

```text
================================================================
cross-app-sso — API-level E2E verification
habit=http://localhost:5000  finance=http://localhost:1907
================================================================
[TC1-1] Kedua API hidup ... PASSED  (habit=200 finance=200)
[TC2-1] Login habit API berhasil ... PASSED  (status=200)
[TC2-2] Set-Cookie memuat token ... PASSED  (token=<ada>)
[TC2-3] Cookie HttpOnly ... PASSED
[TC2-4] Cookie SameSite=Lax ... PASSED
[TC2-5] Cookie Path=/ ... PASSED
[TC2-6] Cookie Max-Age 30 hari ... PASSED
[TC3-1] finance /api/auth/me menerima token habit ... PASSED  (status=200)
[TC3-2] Profil user lengkap dari finance ... PASSED  (user=romeo/husband)
[TC4-1] finance /api/auth/me tanpa cookie => 401 ... PASSED  (status=401)
[TC4-2] finance /api/categories tanpa cookie => 401 ... PASSED  (status=401)
[TC4-3] finance /api/transactions tanpa cookie => 401 ... PASSED  (status=401)
[TC4-4] finance menolak token invalid => 401 ... PASSED  (status=401)
[TC5-1] finance /api/categories dengan cookie => 200 ... PASSED  (status=200)
[TC6-1] returnTo origin asing ditolak ... PASSED  (redirectTo=null)
[TC6-2] returnTo '/\evil.example' ditolak (bypass backslash) ... PASSED  (redirectTo=null)
[TC6-3] returnTo tab-prefixed ditolak ... PASSED  (redirectTo=null)
[TC6-4] returnTo '//evil.example' ditolak ... PASSED  (redirectTo=null)
[TC6-5] returnTo origin finance diizinkan ... PASSED  (redirectTo="http://localhost:5175/transactions")
[TC6-6] returnTo path relatif diizinkan ... PASSED  (redirectTo="/habits")
[TC7-1] Logout => 200 ... PASSED  (status=200)
[TC7-2] Logout mengirim Set-Cookie penghapus ... PASSED
        (token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax)
[TC7-3] Logout memakai Path dan atribut sama ... PASSED
----------------------------------------------------------------
RESULT: 23 passed, 0 failed
----------------------------------------------------------------
```

### Pemetaan ke 6 item Manual E2E di `ISSUES.md`

| # | Item plan | Bukti | Status |
|---|---|---|---|
| 1 | Login di habit lalu buka finance langsung masuk | `TC2-*` cookie diterbitkan habit dengan `HttpOnly`/`SameSite=Lax`/`Path=/`; `TC3-1`/`TC3-2` token habit **diterima** finance `/api/auth/me` (shared `JWT_SECRET`); `TC5-1` endpoint finance berfungsi dengan cookie itu. Cookie host-only tanpa `Domain` → otomatis terkirim ke semua port di `localhost` | **Verified (API-level)** |
| 2 | Finance tanpa session → redirect ke login habit + kembali ke halaman asal | `TC4-1..4` finance menolak tanpa/invalid cookie dengan `401`; bundle finance memuat konstruksi `login?returnTo`; `TC6-5` `returnTo` origin finance diterima dan dikembalikan sebagai `redirectTo` | **Verified (API-level + bundle)** |
| 3 | Logout di habit → finance ikut keluar | `TC7-1..3` logout `200` dan mengirim `Set-Cookie` penghapus dengan atribut identik (`Path=/`, `HttpOnly`, `SameSite=Lax`, `Expires` 1970); `TC4-*` tanpa cookie finance menolak | **Verified (API-level)** |
| 4 | Finance API menolak tanpa cookie dengan `401` walau `NODE_ENV=development` | `TC4-1` (auth/me), `TC4-2` (categories), `TC4-3` (transactions), `TC4-4` (token invalid) semuanya `401` pada server dev yang sedang berjalan | **Verified penuh** |
| 5 | `localStorage` habit tidak berisi key `token` | Grep `apps/habbit-tracker-web/src/**` → `SRC_NO_TOKEN_IN_LOCALSTORAGE`; grep `apps/habbit-tracker-web/dist/**/*.js` → `DIST_NO_TOKEN_WRITE` | **Verified penuh** |
| 6 | `returnTo` origin asing diabaikan | `TC6-1` (`https://evil.example`) → `null`; plus 3 varian bypass: `/\evil.example`, `/\t/evil.example`, `//evil.example` → semuanya `null` | **Verified penuh** |

---

## 3. Bukti Eksekusi — Artefak Build

```text
SRC_NO_TOKEN_IN_LOCALSTORAGE        # tidak ada localStorage token di source habit web
DIST_NO_TOKEN_WRITE                 # tidak ada setItem("token") di bundle produksi habit
FINANCE_NO_BEARER_HEADER            # finance web tidak mengirim header Authorization
HABIT_NO_BEARER_HEADER              # habit web tidak mengirim header Authorization
DIST_HAS_LOGIN_REDIRECT             # bundle finance memuat konstruksi login?returnTo
DIST_HAS_HABIT_URL_FALLBACK         # fallback VITE_HABIT_APP_URL ter-inline
HABIT_DIST_HAS_FINANCE_URL          # fallback VITE_FINANCE_APP_URL ter-inline
```

Ini membuktikan perpindahan penuh ke cookie-based session: tidak ada token yang disimpan atau dikirim lewat header dari kedua web app.

---

## 4. Temuan Terpisah — `qa-api-runner.mjs` (bukan regresi plan ini)

Runner yang diperbaiki pada Fase 7 kini **berhasil terautentikasi** (`Authenticated as romeo via http://localhost:5000`) dan **13/16** test lulus, dengan teardown bersih. Tiga test gagal:

```text
[TC2-10] Overview running balance = Initial + Income - Expense
         FAILED -> Expected current_balance 12500000, got 12420000
[TC6-1]  Reports aggregated metrics and cash flow trends
         FAILED -> Expected total_expense 2500000, got 2580000
[TC7-1]  Net Worth = Liquid Cash + Assets - Liabilities
         FAILED -> Expected liquid cash 12500000, got 12420000
```

**Analisis:** selisih konsisten **80.000** pada ketiga assertion. Penyebabnya adalah **data transaksi nyata milik user** yang sudah ada di database dev (`habbit_couple`) sebelum suite dijalankan — assertion memakai angka absolut, bukan selisih relatif terhadap baseline. Sebelum perbaikan Fase 7, seluruh 16 test gagal `401`; sekarang 13 lulus, jadi perbaikan autentikasi terbukti berhasil.

**Bukan kegagalan `cross-app-sso`** dan tidak memblokir plan ini. Ini utang kualitas test pada `apps/finance-tracker-api/tests/qa-api-runner.mjs`: assertion harus dihitung relatif terhadap baseline sebelum test (seperti `originalInitialBalance`), bukan angka absolut.

**Kebersihan data:** teardown berjalan bersih, dan verifikasi lanjutan mengonfirmasi `LEFTOVER_QA_TRANSACTIONS=0`, `LEFTOVER_QA_CATEGORIES=0`, serta `initial_balance` dipulihkan ke nilai aslinya (`0`).

---

## 5. Keterbatasan Verifikasi (dinyatakan eksplisit)

1. **Tidak ada framework browser E2E di repo ini.** Playwright, Cypress, Vitest, dan Jest tidak terpasang. Semua eksekusi dilakukan lewat HTTP langsung ke server yang berjalan plus inspeksi bundle.
2. **Navigasi browser tidak dieksekusi.** Perpindahan halaman nyata (finance memuat `useSession` → `401` → `window.location.replace` ke `:5173/login?returnTo=...`, lalu user mengetik kredensial dan browser mendarat kembali di `:5175`) belum dijalankan di browser sungguhan. Yang terbukti adalah setiap komponen mekanismenya: `401` dari API, konstruksi URL login di bundle, `returnTo` yang tervalidasi dan dikembalikan sebagai `redirectTo`, serta cookie yang valid lintas port.
3. **Tidak ada test matrix V4 formal** untuk slug ini (`docs/qa/cross-app-sso/test-matrix.md` tidak dibuat di sini — pembuatan matrix adalah tugas `qa-engineer`/`test-case-matrix`).
4. **`COOKIE_DOMAIN` produksi belum diuji.** Nilai produksi (`.pasutri.com`) memerlukan domain sungguhan; dev memakai cookie host-only `localhost` yang perilakunya berbeda dari subdomain lintas-domain.

---

## 6. Kesimpulan

Mekanisme inti `cross-app-sso` **terbukti bekerja pada server yang benar-benar berjalan**: satu cookie dari habit API diterima finance API, fallback dev sudah benar-benar hilang (semua endpoint `401` tanpa cookie meski `NODE_ENV=development`), logout menghapus cookie dengan atribut yang identik sehingga kedua app ikut keluar, dan validasi `returnTo` menolak seluruh varian bypass open redirect.

Langkah berikutnya: **`/gate`**.
