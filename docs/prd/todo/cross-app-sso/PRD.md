# PRD — Login Sekali untuk Semua App (Shared Cookie SSO)

## Context
Monorepo ini menjalankan dua aplikasi web dan dua API terpisah yang berbagi satu database:

- `apps/habbit-tracker-web` (port 5173) → `apps/habbit-tracker-api` (port 5000)
- `apps/finance-tracker-web` (port 5175) → `apps/finance-tracker-api` (port 1907)

Keduanya memakai database `habbit_couple` (tabel `users` berasal dari migrasi `apps/habbit-tracker-api/src/migrations/mysql/001-initial-schema.sql`). Saat ini user harus login terpisah di tiap app, dan `finance-tracker-web` bahkan belum memiliki halaman login sama sekali.

## Problem / Motivation
1. **Session tidak bisa dipakai lintas app.** `JWT_SECRET` kedua API berbeda (`apps/habbit-tracker-api/.env` vs `apps/finance-tracker-api/.env`), sehingga token yang diterbitkan habit API gagal diverifikasi oleh finance API.
2. **Cookie tidak di-scope ke domain induk.** `res.cookie("token", ...)` di `apps/habbit-tracker-api/src/modules/auth/auth.controller.ts:68` dan `:108` tidak mengatur `domain` maupun `sameSite`, sehingga cookie tidak akan terbawa ke subdomain finance di produksi.
3. **Bug tertutup di development.** `apps/finance-tracker-api/src/middleware/auth.middleware.ts:56-81` punya fallback yang auto-login sebagai user pertama (atau user mock `dev-user-001`) tanpa token apa pun, sehingga masalah SSO tidak pernah kelihatan saat dev.
4. **Finance tidak punya konsep auth di frontend.** Tidak ada route login, tidak ada auth store, tidak ada cara mengetahui siapa yang login, dan tidak ada jalan kembali ke habit app.

## Scope

### Backend — `apps/habbit-tracker-api`
1. `src/config/env.ts`: tambah `COOKIE_DOMAIN` (optional) dan `ALLOWED_REDIRECT_ORIGINS` (optional, comma-separated).
2. `src/modules/auth/auth.controller.ts`: helper `cookieOptions()` yang menghasilkan `{ httpOnly: true, secure: NODE_ENV === "production", sameSite: "lax", domain: COOKIE_DOMAIN || undefined, maxAge: 30 hari, path: "/" }`; dipakai oleh `register`, `login`, dan `logout` (`clearCookie` harus memakai opsi yang sama).
3. `src/modules/auth/auth.controller.ts`: `logout` tetap `POST /api/auth/logout`, menghapus cookie dengan domain/path yang identik.
4. `src/modules/auth/auth.schema.ts` + `auth.controller.ts`: terima field opsional `returnTo` pada body login; validasi terhadap `ALLOWED_REDIRECT_ORIGINS` (origin harus persis cocok, atau `returnTo` berupa path relatif `/...`), selain itu abaikan dan kembalikan `null`. Nilai tervalidasi dikirim balik di response sebagai `redirectTo`.
5. `src/middleware/auth.middleware.ts`: tetap menerima cookie `token`; header `Bearer` dipertahankan sebagai jalur kompatibilitas untuk tooling/API client, bukan untuk web.

### Backend — `apps/finance-tracker-api`
6. `src/config/env.ts`: tambah `COOKIE_DOMAIN` (optional).
7. `src/middleware/auth.middleware.ts`: **hapus total** blok fallback development (baris 55-81). Semua environment wajib token valid; tanpa token → `401`.
8. Modul baru `src/modules/auth/auth.controller.ts` + `auth.routes.ts`: `GET /api/auth/me` (dilindungi `authMiddleware`) mengembalikan `{ user: { id, username, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences } }` dengan membaca tabel `users` yang sama lewat `executeQuery`.
9. `src/app.ts`: mount `app.use("/api/auth", authRoutes)` sebelum `app.use("/api", financeRoutes)`.
10. `src/middleware/auth.middleware.ts`: query `me` perlu kolom tambahan (`username`, `avatar_emoji`, `avatar_image`, `theme_preferences`) — perluas SELECT agar identitas user lengkap.

### Frontend — `apps/habbit-tracker-web`
11. `src/stores/auth.store.ts`: hapus `token` dari state dan localStorage. State menjadi `user`, `isAuthenticated`, `isLoading`, `setUser`, `login(user)`, `logout()`. `logout()` memanggil `POST /api/auth/logout` lalu reset state.
12. `src/lib/api-client.ts`: hapus interceptor request yang menyuntik `Authorization: Bearer`. Pertahankan `withCredentials: true` dan interceptor 401 (yang sekarang memanggil `logout()` lokal tanpa request tambahan, lalu redirect ke `/login`).
13. `src/routes/__root.tsx`: ganti penentuan `isAuthenticated` dari localStorage menjadi hasil `GET /api/auth/me` saat mount (lewat hook `use-session`), tampilkan loading state selama pengecekan.
14. `src/routes/login.tsx`: kirim `returnTo` dari query string `?returnTo=` ke `POST /api/auth/login`; setelah sukses, arahkan ke `redirectTo` dari response jika ada, jika tidak ke `/`.
15. `src/routes/login.tsx`: jika `returnTo` menunjuk ke origin finance, tampilkan teks bahwa user akan kembali ke aplikasi keuangan.
16. Komponen baru `src/components/app-switcher.tsx` (atau item menu di navigasi yang sudah ada): link ke finance app, URL diambil dari `import.meta.env.VITE_FINANCE_APP_URL` dengan fallback `http://localhost:5175`.

### Frontend — `apps/finance-tracker-web`
17. `src/services/auth.service.ts`: `getMe()` memanggil `GET /api/auth/me`, `getLoginUrl(returnTo)` membangun URL login habit dari `import.meta.env.VITE_HABIT_APP_URL` (fallback `http://localhost:5173`) + `?returnTo=<origin+pathname+search saat ini>`.
18. Hook `src/hooks/use-session.ts`: React Query `useQuery(["session"], getMe, { retry: false })`; pada error 401 → `window.location.replace(getLoginUrl(...))`.
19. `src/routes/__root.tsx`: bungkus dengan pengecekan session — selama loading tampilkan splash; jika 401 redirect ke login habit; jika sukses render app.
20. `src/services/api.ts`: interceptor response 401 → redirect ke login habit dengan `returnTo` halaman saat ini (bukan hanya reject error).
21. Identitas user di sidebar desktop & header mobile: nama + avatar emoji dari `use-session`, plus tombol/link "Buka Habit Tracker" ke `VITE_HABIT_APP_URL`.
22. `vite.config.ts` dan `.env` finance: dokumentasikan `VITE_HABIT_APP_URL`; pastikan `ALLOW_ORIGIN_CORS` di finance API memuat origin kedua web app.

### Konfigurasi
23. Kedua `.env.example` (`apps/habbit-tracker-api`, `apps/finance-tracker-api`) memuat `COOKIE_DOMAIN` (contoh `.pasutri.com`) dan, untuk habit, `ALLOWED_REDIRECT_ORIGINS`. `JWT_SECRET` diberi catatan bahwa nilainya **harus sama** di kedua API.

## Design decisions
1. **Login terpusat di habit app.** Finance tidak memiliki halaman login/register/logout sendiri. Alasannya: hanya habit app yang punya alur registrasi dengan guardrail maksimal 2 user, dan satu tempat login berarti satu tempat bug auth.
2. **Cookie httpOnly ber-domain induk, bukan token di localStorage.** Karena produksi memakai satu domain dengan subdomain berbeda, `Domain=.domain` cukup untuk berbagi cookie. `httpOnly` menutup jalur pencurian token via XSS; localStorage token di habit web dihapus dan status login ditentukan dari server (`GET /api/auth/me`).
3. **Satu `JWT_SECRET` baru untuk kedua API.** Secret lama habit (`some-secure-random-string-here`) dan finance (`your-secret-key-change-in-production`) tidak layak dipakai produksi. Konsekuensi yang diterima: semua session lama invalid, user login ulang sekali setelah deploy.
4. **`SameSite=Lax`, bukan `None`.** Kedua app berada di site yang sama (beda subdomain), jadi `Lax` cukup dan lebih aman; `None` hanya diperlukan untuk domain yang benar-benar berbeda.
5. **Session 30 hari, tanpa refresh token.** Sama seperti perilaku sekarang; user cukup login sekali untuk pemakaian normal.
6. **`returnTo` divalidasi whitelist origin.** Mencegah open redirect: hanya origin yang terdaftar di `ALLOWED_REDIRECT_ORIGINS` atau path relatif yang diterima. Origin finance di produksi didaftarkan di env, bukan di kode.
7. **Fallback dev finance dihapus, bukan dipersempit.** Fallback itulah yang menyembunyikan bug SSO. Dengan dihapus, dev environment berperilaku sama dengan produksi.
8. **Finance mendapat `GET /api/auth/me` sendiri.** Finance tidak memanggil API habit secara cross-origin (menambah CORS + latensi) dan tidak menebak identitas dari endpoint finance biasa. Database-nya sama, jadi query langsung ke `users` konsisten.
9. **`COOKIE_DOMAIN` dikosongkan di localhost.** Cookie mengabaikan port, sehingga `localhost:5173` dan `localhost:5175` tetap berbagi cookie tanpa perlu domain eksplisit.
10. **Logout global lewat habit app saja.** Tombol logout di finance sengaja tidak dibuat agar tidak ada dua tempat yang bisa meninggalkan state setengah-logout.

## Out of scope
1. Refresh token / sliding session / session list multi-device.
2. 2FA, ubah password, reset password, atau role/permission baru.
3. Migrasi data user atau perubahan skema tabel `users`.
4. Deploy `finance-tracker-web`/`finance-tracker-api`: `scripts/deploy.sh` dan `scripts/nginx.conf` tidak diubah dalam PRD ini (subdomain finance butuh pekerjaan deploy terpisah).
5. Redesign UI di luar penambahan link antar-app dan identitas user di finance.
6. Automated E2E Playwright untuk skenario cross-app (verifikasi dilakukan manual).
7. Perubahan pada modul non-auth (habit, grocery, analytics, finance CRUD).

## Success criteria
1. Login di habit app → membuka finance app di tab yang sama langsung masuk tanpa diminta kredensial.
2. Membuka finance app tanpa session → otomatis diarahkan ke halaman login habit dengan `returnTo`, dan setelah login sukses kembali ke halaman finance yang tadi dibuka.
3. Logout di habit app → membuka finance app menghasilkan redirect ke login (session benar-benar mati di kedua app).
4. Finance API menolak request tanpa cookie valid dengan `401` di semua environment, termasuk `development`.
5. Finance app menampilkan nama dan avatar user yang sedang login serta link kembali ke habit app; habit app menampilkan link ke finance app.
6. Token tidak lagi tersimpan di `localStorage` pada habit web.
7. `pnpm lint` dan `pnpm check-types` lulus tanpa error di seluruh workspace.
