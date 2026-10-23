# Issues — Login Sekali untuk Semua App (Shared Cookie SSO)

## Fase 1: Konfigurasi Bersama (Secret, Cookie Domain, Redirect Whitelist)
- [x] Tambah `COOKIE_DOMAIN` (optional) dan `ALLOWED_REDIRECT_ORIGINS` (optional, comma-separated) ke `envSchema` di `apps/habbit-tracker-api/src/config/env.ts`
- [x] Tambah `COOKIE_DOMAIN` (optional) ke `envSchema` di `apps/finance-tracker-api/src/config/env.ts`
- [x] Perbarui `apps/habbit-tracker-api/.env.example`: `JWT_SECRET` (catatan harus sama dengan finance), `COOKIE_DOMAIN`, `ALLOWED_REDIRECT_ORIGINS`
- [x] Perbarui `apps/finance-tracker-api/.env.example`: `JWT_SECRET` (catatan harus sama dengan habit), `COOKIE_DOMAIN`
- [x] Set `JWT_SECRET` baru yang identik di `apps/habbit-tracker-api/.env` dan `apps/finance-tracker-api/.env`
- [x] Set `ALLOWED_REDIRECT_ORIGINS` di `.env` habit agar memuat origin `finance-tracker-web` (dev: `http://localhost:5175`)

## Fase 2: Backend Habit — Cookie Shared & Return URL
- [x] Buat helper `cookieOptions()` di `apps/habbit-tracker-api/src/modules/auth/auth.controller.ts` (`httpOnly`, `secure` saat production, `sameSite: "lax"`, `domain: env.COOKIE_DOMAIN || undefined`, `maxAge` 30 hari, `path: "/"`)
- [x] Pakai `cookieOptions()` pada `res.cookie("token", ...)` di handler `register`
- [x] Pakai `cookieOptions()` pada `res.cookie("token", ...)` di handler `login`
- [x] Perbaiki `logout` agar `res.clearCookie("token", cookieOptions())` memakai domain/path identik
- [x] Tambah util `resolveRedirectTarget(returnTo)` yang memvalidasi `returnTo` terhadap `ALLOWED_REDIRECT_ORIGINS` (cocokkan origin persis) atau path relatif `/...`, mengembalikan `string | null` (ditempatkan di `src/utils/redirect.util.ts`)
- [x] Tambah field opsional `returnTo` pada `loginSchema` di `apps/habbit-tracker-api/src/modules/auth/auth.schema.ts`
- [x] Kembalikan `redirectTo` hasil `resolveRedirectTarget` pada response `POST /api/auth/login`

## Fase 3: Backend Finance — Hapus Fallback Dev & Endpoint `/auth/me`
- [x] Hapus seluruh blok fallback development pada `apps/finance-tracker-api/src/middleware/auth.middleware.ts` sehingga tanpa token valid selalu `401`
- [x] Perluas query user di `apps/finance-tracker-api/src/middleware/auth.middleware.ts` agar memuat `username`, `avatar_emoji`, `avatar_image`, `theme_preferences`
- [x] Buat `apps/finance-tracker-api/src/modules/auth/auth.controller.ts` dengan handler `me` yang mengembalikan profil user lengkap
- [x] Buat `apps/finance-tracker-api/src/modules/auth/auth.routes.ts` dengan `GET /me` dilindungi `authMiddleware`
- [x] Mount `app.use("/api/auth", authRoutes)` di `apps/finance-tracker-api/src/app.ts` sebelum `app.use("/api", financeRoutes)`
- [x] Pastikan `ALLOW_ORIGIN_CORS` finance API memuat origin kedua web app (dev: `http://localhost:5173`, `http://localhost:5175`)

## Fase 4: Frontend Habit — Full Cookie-Based Session
- [x] Hapus `token` dan penyimpanan `localStorage.setItem("token", ...)` dari `apps/habbit-tracker-web/src/stores/auth.store.ts`; tambah state `isLoading`
- [x] Ubah `logout()` di `apps/habbit-tracker-web/src/stores/auth.store.ts` agar memanggil `POST /api/auth/logout` lalu reset state (pakai `fetch` + `credentials: "include"` agar tidak ada circular import dengan `api-client`)
- [x] Hapus interceptor `Authorization: Bearer` dari `apps/habbit-tracker-web/src/lib/api-client.ts`, pertahankan `withCredentials` dan handling 401
- [x] Buat hook session (mis. `apps/habbit-tracker-web/src/hooks/use-session.ts`) yang memanggil `GET /api/auth/me` saat mount dan mengisi `auth.store`
- [x] Ubah `apps/habbit-tracker-web/src/routes/__root.tsx` agar status login berasal dari hook session (bukan localStorage) dan tampilkan loading state saat pengecekan
- [x] Kirim `returnTo` dari query string pada `POST /api/auth/login` di `apps/habbit-tracker-web/src/routes/login.tsx`
- [x] Arahkan user ke `redirectTo` dari response login bila ada, selain itu ke `/`, di `apps/habbit-tracker-web/src/routes/login.tsx`
- [x] Tambah link ke finance app (dari `VITE_FINANCE_APP_URL`, fallback `http://localhost:5175`) di navigasi habit (via `AppSwitcher` + `externalUrl` di `apps.config.ts`)

## Fase 5: Frontend Finance — Session Guard, Redirect, Identitas User
- [x] Buat `apps/finance-tracker-web/src/services/auth.service.ts` dengan `getMe()` dan `getLoginUrl(returnTo)` (memakai `VITE_HABIT_APP_URL`, fallback `http://localhost:5173`) — helper URL ada di `services/session-url.ts` dan di-re-export
- [x] Buat hook `apps/finance-tracker-web/src/hooks/use-session.ts` dengan React Query + `retry: false`, redirect ke login habit saat 401
- [x] Ubah `apps/finance-tracker-web/src/routes/__root.tsx` untuk menampilkan splash saat loading, redirect saat 401, dan render app saat session valid
- [x] Tambah interceptor response 401 pada `apps/finance-tracker-web/src/services/api.ts` yang mengarahkan ke login habit dengan `returnTo` halaman saat ini
- [x] Tampilkan nama + avatar emoji user dari session di sidebar desktop dan header mobile `apps/finance-tracker-web/src/routes/__root.tsx`
- [x] Tambah link "Buka Habit Tracker" di `apps/finance-tracker-web/src/routes/__root.tsx` menuju `VITE_HABIT_APP_URL`
- [x] Dokumentasikan `VITE_HABIT_APP_URL` di `apps/finance-tracker-web/.env` dan `VITE_FINANCE_APP_URL` di `apps/habbit-tracker-web/.env`

## Fase 6: Verifikasi
- [x] Jalankan `pnpm check-types` dan pastikan seluruh workspace lulus
- [x] Jalankan `pnpm lint` dan pastikan tidak ada error baru
- [x] Jalankan `pnpm build` untuk memastikan kedua web app dan kedua API ter-build

> **CATATAN (2026-10-23, diperbarui setelah `/qa`):** Verifikasi manual E2E di bawah ini **SUDAH DIJALANKAN** terhadap server yang benar-benar hidup (habit API :5000, finance API :1907, MySQL 8 aktif) — bukan lagi dilewati. Hasil lengkap: `docs/qa/cross-app-sso/qa-report.md` (23/23 cek API + 3/3 cek bundle lulus). Keterbatasan: tidak ada framework browser E2E di repo ini, sehingga navigasi browser nyata (klik/redirect di UI) tidak dieksekusi; yang terbukti adalah setiap mekanismenya (`401`, konstruksi URL login di bundle, validasi `returnTo`, cookie lintas port, penghapusan cookie saat logout).

- [x] Manual E2E — login di habit (`http://localhost:5173/login`) lalu buka finance (`http://localhost:5175`) dan pastikan langsung masuk tanpa diminta kredensial — **(API-level)** token habit diterima `finance /api/auth/me` (200, `romeo/husband`); cookie `HttpOnly`+`SameSite=Lax`+`Path=/` host-only sehingga terkirim lintas port
- [x] Manual E2E — buka finance tanpa session (clear cookie), pastikan redirect ke login habit dengan `returnTo`, dan setelah login kembali ke halaman finance yang tadi dibuka — **(API-level + bundle)** finance menolak tanpa/invalid cookie dengan `401`; bundle memuat `login?returnTo`; `returnTo=http://localhost:5175/transactions` diterima dan dikembalikan sebagai `redirectTo`
- [x] Manual E2E — logout di habit, lalu buka finance dan pastikan diarahkan ke login (session mati di kedua app) — **(API-level)** logout `200` + `Set-Cookie` penghapus (`Expires=1970`, `Path=/`, `HttpOnly`, `SameSite=Lax`); tanpa cookie finance `401`
- [x] Manual E2E — pastikan finance API menolak request tanpa cookie dengan `401` walau `NODE_ENV=development` — **terverifikasi penuh** pada `/api/auth/me`, `/api/categories`, `/api/transactions`, dan token invalid
- [x] Manual E2E — pastikan `localStorage` habit tidak lagi berisi key `token` — **terverifikasi penuh** (grep source & bundle produksi: tidak ada penulisan `token`)
- [x] Manual E2E — pastikan `returnTo` ke origin yang tidak terdaftar (mis. `https://evil.example`) diabaikan dan user mendarat di `/` — **terverifikasi penuh**, termasuk 3 varian bypass (`/\evil.example`, tab-prefixed, `//evil.example`) yang semuanya ditolak (`redirectTo: null`)

## Fase 7: Perbaikan Temuan Review (/gate)

### Blocking
- [x] **[SECURITY] Tutup bypass open redirect di `apps/habbit-tracker-api/src/utils/redirect.util.ts`.** Guard `value.startsWith("//")` saja tidak cukup: `/\evil.example` dan `/<tab>/evil.example` tetap lolos karena browser menormalkan backslash/tab menjadi `/` untuk skema http(s), sehingga `window.location.href` berakhir ke host eksternal. Terbukti: `new URL("/\\evil.example", "http://localhost:5173/login").href === "http://evil.example/"`. Perbaiki dengan menolak nilai yang mengandung `\`, karakter kontrol (`\t`, `\n`, `\r`), dan verifikasi ulang hasil akhir tetap ber-origin sama (mis. resolve terhadap base lalu bandingkan `origin`).
- [x] **Perbaiki `apps/finance-tracker-api/tests/qa-api-runner.mjs` agar terautentikasi.** Runner ini melakukan 29 `fetch` ke `/api/*` tanpa cookie/token; setelah fallback dev dihapus, seluruh 16 test case akan gagal `401`. Tambahkan login lewat habit API di awal suite, simpan cookie `token`, dan kirimkan pada setiap request (plus sesuaikan teardown).

### Non-blocking (tetap diselesaikan sebelum promote)
- [x] Hapus file artefak build yang tidak sengaja ter-commit `apps/finance-tracker-web/.tanstack/tmp/c2c2bdff-2c38b8029552c532a9716fa825f528c2`, dan tambahkan `.tanstack/` ke `.gitignore`.
- [x] Tangani kegagalan jaringan pada `logout()` di `apps/habbit-tracker-web/src/stores/auth.store.ts`: saat ini `.catch(() => undefined)` membuat state lokal bersih padahal cookie server masih hidup, sehingga user terlihat logout tapi kembali login setelah refresh. Tampilkan error dan jangan bersihkan state jika request gagal.

## Fase 8: Review Closing
- [x] Review (`/gate`) lulus setelah temuan Fase 7 diselesaikan — review 2026-10-23: tanpa temuan blocking. Fase 7 (open redirect, runner auth, artefak `.tanstack`, `logout()` swallow) terverifikasi diperbaiki. Catatan non-blocking dicatat di PRD changelog.

