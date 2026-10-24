# Issues — Pisahkan Grocery Menjadi App Sendiri (FE + BE) & Sesuaikan Layout

> Rujukan: `docs/prd/done/grocery-app-split/PRD.md`
> Pola acuan implementasi: `apps/finance-tracker-api` + `apps/finance-tracker-web` (pemisahan app + shared session cookie).

## Fase 1: Scaffold `apps/grocery-tracker-api`

- [x] Buat `apps/grocery-tracker-api/package.json` (`@repo/grocery-tracker-api`, scripts `dev`/`build`/`start`/`db:migrate`/`db:seed`/`check-types`/`lint`, dependensi meniru `finance-tracker-api`)
- [x] Buat `apps/grocery-tracker-api/tsconfig.json` + referensi ke `@repo/typescript-config`
- [x] Buat `src/config/env.ts` (PORT default **5052**, `DB_PROVIDER`, `JWT_SECRET`, `COOKIE_DOMAIN`, `ALLOW_ORIGIN_CORS`, kredensial MySQL/Postgres)
- [x] Buat `src/config/database.ts` (pool multi-provider `mysql`/`supabase`/`neondb` + `testConnection`, meniru habit API)
- [x] Buat `src/middleware/error.middleware.ts` (respons error konsisten `{ error }`)
- [x] Buat `src/middleware/auth.middleware.ts` (verifikasi cookie `token` dengan `JWT_SECRET` bersama, muat user termasuk `partner_id` dari tabel `users`)
- [x] Buat `src/app.ts` (CORS credentials, `express.json`, `cookie-parser`, `GET /health`, mount `/api/auth` + `/api/grocery`)
- [x] Buat `src/index.ts` (listener + shutdown handler, log port/provider)
- [x] Buat `.env.example` dan `.env` lokal dengan `JWT_SECRET` **identik** `apps/habbit-tracker-api/.env`

## Fase 2: Pindahkan domain grocery ke `grocery-tracker-api`

- [x] Pindahkan `modules/grocery/{grocery.routes,grocery.controller,grocery.schema}.ts` dari habit API (kontrak response tidak berubah)
- [x] Pindahkan `repositories/interfaces/grocery.repository.interface.ts`
- [x] Pindahkan `repositories/mysql/grocery.mysql.repository.ts`
- [x] Pindahkan `repositories/supabase/grocery.supabase.repository.ts`
- [x] Buat `src/repositories/repository.factory.ts` versi grocery (hanya `groceryRepo` + helper baca `users` untuk `partner_id`)
- [x] Buat modul auth read-only `src/modules/auth/{auth.routes,auth.controller}.ts` (`GET /api/auth/me`, `POST /api/auth/logout` dengan cookie options identik habit)
- [x] Pindahkan `src/migrations/{mysql,supabase}/002-grocery-schema.sql` ke grocery API (isi tetap `CREATE TABLE IF NOT EXISTS`, tanpa perubahan kolom/index)
- [x] Buat `src/migrations/migrate.ts` + `src/migrations/seed.ts` versi grocery (seed hanya untuk dev)
- [x] Hapus modul + repo + migrasi grocery dari `apps/habbit-tracker-api` (module folder, 3 file repo, 2 file SQL, entri `repository.factory.ts`, mount di `src/app.ts:48`, `DELETE FROM grocery_items` di `src/migrations/seed.ts:91`)
- [x] Verifikasi `pnpm --filter=@repo/habbit-tracker-api check-types` hijau setelah pembersihan

## Fase 3: Scaffold `apps/grocery-tracker-web`

- [x] Buat `apps/grocery-tracker-web/package.json` (`@repo/grocery-tracker-web`, dependensi web + `vite-plugin-pwa` seperti habit web)
- [x] Buat `vite.config.ts` (port **4042**, proxy `/api` → `VITE_BASE_URL_API` default `http://localhost:5052`, plugin React + TanStack Router + Tailwind + PWA manifest grocery)
- [x] Buat `index.html`, `src/main.tsx`, `src/index.css` (import token `@repo/tailwind-config`)
- [x] Buat `src/components/ui/*` sebagai re-export `@repo/ui` (button, card, dialog, input, select, textarea, sidebar, app-switcher) + `index.ts`
- [x] Buat `src/lib/utils.ts` (re-export `cn` dari `@repo/ui`)
- [x] Buat `src/services/session-url.ts` (`VITE_HABIT_APP_URL`, `getLoginUrl`, `redirectToLogin`)
- [x] Buat `src/services/api.ts` (axios `baseURL: "/api"`, `withCredentials`, interceptor 401 → `redirectToLogin`)
- [x] Buat `src/services/auth.service.ts` (`getMe`, `logout`) + `src/hooks/use-session.ts`
- [x] Buat `src/stores/theme.store.ts` dan `src/stores/toast.store.ts` (salin dari habit web)
- [x] Buat `src/components/ThemeSwitcher.tsx`
- [x] Buat `src/config/apps.config.ts` (registry 4 app dengan `href` absolut, `CURRENT_APP_ID = "grocery-list"`)
- [x] Buat `src/components/app-switcher.tsx` (wrapper tipis di atas `AppSwitcher` `@repo/ui`, navigasi via `window.location.href`)
- [x] Buat `src/components/navigation/bottom-nav.tsx` (3 item: `/`, `/manage`, `/settings`, aktif tepat satu)
- [x] Salin aset PWA (favicon/ikon 192 & 512) ke `public/` app baru
- [x] Buat `.env.example` + `.env` lokal (`VITE_BASE_URL_API`, `VITE_HABIT_APP_URL`, `VITE_FINANCE_APP_URL`, `VITE_GROCERY_APP_URL`)

## Fase 4: Shell & konten grocery

- [x] Buat `src/routes/__root.tsx`: `Sidebar` dari `@repo/ui` + `AppSwitcher` + kartu profil (`useSession`) + footer quick-add/logout + header mobile + `BottomNav` + `Toaster`; redirect ke login habit saat 401
- [x] Pindahkan `routes/grocery-list/index.tsx` → `src/routes/index.tsx` (path `/`, hapus dependensi i18n, tipe `GroceryItem` dari `@repo/types`)
- [x] Pindahkan `routes/grocery-list/manage.tsx` → `src/routes/manage.tsx` (path `/manage`, ganti `useAuthStore` → `useSession`)
- [x] Pindahkan `routes/grocery-list/settings.tsx` → `src/routes/settings.tsx` (path `/settings`, ganti `useAuthStore` → `useSession`, tautan "Pintas Menu Lain" jadi URL eksternal habit/finance)
- [x] Pindahkan `services/grocery.service.ts` dan **hapus** seluruh jalur fallback localStorage (`getLocalItems`, `saveLocalItems`, sample data, key `habbit_pasutri_local_grocery_items`)
- [x] Pastikan kegagalan API memunculkan toast error (bukan dianggap sukses) di ketiga halaman
- [x] Pastikan sidebar & bottom nav menyorot tepat satu menu untuk `/`, `/manage`, `/settings` (match exact, tanpa prefix)

## Fase 5: Bersihkan habit app + shim redirect

- [x] Hapus `apps/habbit-tracker-web/src/routes/grocery-list/` dan biarkan TanStack Router regenerate `routeTree.gen.ts`
- [x] Hapus `apps/habbit-tracker-web/src/services/grocery.service.ts` dan re-export tipe grocery yang tidak lagi dipakai
- [x] Hapus `src/components/navigation/grocery-bottom-nav.tsx` + referensinya di `bottom-navigation.tsx`
- [x] Hapus `groceryNavItems` dan quick action grocery di `src/routes/__root.tsx`
- [x] Ubah entri `grocery-list` di `src/config/apps.config.ts` menjadi `externalUrl` (`VITE_GROCERY_APP_URL` fallback `http://localhost:4042`) dan hapus cabang `/grocery-list` di `getActiveApp()`
- [x] Buat route shim `src/routes/grocery-list.tsx` yang hanya `beforeLoad` → `window.location.replace(<grocery app url>/...)` untuk `/grocery-list`, `/grocery-list/manage`, `/grocery-list/settings`, dan wildcard turunannya
  - **Catatan implementasi:** dipecah dua file — `src/routes/grocery-list.tsx` (path `/grocery-list`) dan `src/routes/grocery-list.$.tsx` (splat `$` untuk semua sub-path); logika pemetaan URL ada di `src/lib/grocery-redirect.ts`
- [x] Verifikasi `pnpm --filter=@repo/habbit-tracker-web check-types` hijau dan tidak ada import grocery yang tersisa

## Fase 6: Infra, deploy, dan dokumentasi

- [x] Tambah script root `db:migrate:grocery` dan `db:seed:grocery` di `package.json` (filter `@repo/grocery-tracker-api`)
- [x] Perbarui `scripts/deploy.sh`: kirim `dist` + `package.json` kedua app grocery ke folder VPS terpisah
- [x] Perbarui `scripts/nginx.conf`: contoh `location /grocery` (SPA fallback) dan `location /api/grocery` → `127.0.0.1:5052`
- [x] Perbarui `AGENTS.md`: struktur direktori, tabel port (5052/4042), perintah baru, catatan `JWT_SECRET` bersama
- [x] Jalankan `pnpm install` agar workspace package baru ter-link
- [x] Set `base: "/grocery/"` pada build produksi `apps/grocery-tracker-web/vite.config.ts` agar aset & PWA manifest konsisten dengan `location /grocery/` di nginx (dev tetap di root 4042) *(ditambahkan saat implementasi — tidak ada di checklist awal)*
- [x] Tambahkan `VITE_GROCERY_APP_URL` ke `.env.example` `apps/habbit-tracker-web` (dipakai `GROCERY_APP_URL` di registry habit) *(ditambahkan saat implementasi)*

## Fase 6b: Perbaikan temuan review (/gate)

- [x] Tambahkan `basepath: import.meta.env.BASE_URL.replace(/\/$/, "")` pada `createRouter` di `apps/grocery-tracker-web/src/main.tsx` agar router mengenali prefix `/grocery/` pada build produksi — tanpa ini `/grocery/`, `/grocery/manage`, dan `/grocery/settings` menampilkan "Not Found" *(temuan blocking B1 di `docs/qa/grocery-app-split/review-report.md`)*
- [x] Tegakkan kepemilikan couple pada `updateGroceryItem`, `toggleGroceryItem`, dan `deleteGroceryItem` di `apps/grocery-tracker-api/src/modules/grocery/grocery.controller.ts`: tolak dengan **404** bila `existing.user_id` dan `existing.partner_id` bukan milik `req.userId`/`req.partnerId`, memakai predikat yang sama dengan `findForCouple` *(temuan blocking B2 — IDOR, pre-existing tapi ikut pindah ke service baru)*
  - **Catatan implementasi:** dipusatkan di dua helper (`isOwnedByCouple` + `findOwnedItem`) supaya ketiga handler memakai predikat identik; `req.partnerId` sudah dimuat `authMiddleware`, jadi tidak ada query tambahan
- [x] Tambahkan regression check `basepath` pada `apps/grocery-tracker-web/tests/qa-web-runner.mjs` dan test otorisasi cross-couple (update/toggle/delete oleh user di luar couple → 404, data tidak berubah) pada `apps/grocery-tracker-api/tests/qa-api-runner.mjs` *(penjaga agar B1/B2 tidak kembali)*
  - **Catatan implementasi:** TC14-4 (web, 19/0) dan TC3-2 (API, 15/0/1). TC3-2 membuat user uji `qa-test-*-outsider` sementara + JWT bertanda tangan untuk autentikasi, lalu menghapusnya di teardown

## Fase 7: Verifikasi & quality gate

- [x] Jalankan `pnpm check-types` di seluruh monorepo
- [x] Jalankan `pnpm lint` di seluruh monorepo
- [x] Jalankan `pnpm build` di seluruh monorepo
- [x] E2E manual: login di habit → buka `http://localhost:4042` tanpa diminta kredensial
- [x] E2E manual: CRUD item (create, edit, toggle, delete, clear-completed) dan item terlihat oleh akun pasangan
- [x] E2E manual: `/grocery-list`, `/grocery-list/manage`, `/grocery-list/settings` di habit mendarat di halaman setara di grocery app
- [x] E2E manual: app switcher grocery → habit → finance → grocery, plus sidebar/bottom nav mobile menyorot tepat satu menu
- [x] E2E manual: matikan grocery API → muncul pesan error, tidak ada item yang "tersimpan" di localStorage
- [x] Review kualitas kode lima-axis dan kesiapan rilis (/gate)
  - **Hasil:** `Approve with comments` — 0 blocking pada putaran 2. B1 (basepath router) dan B2 (IDOR lintas couple) diverifikasi ulang secara independen dan tertutup; N1–N9 tetap terbuka sebagai backlog terpisah. Laporan: `docs/qa/grocery-app-split/review-report.md`

> **Catatan verifikasi (QA putaran 2, 2026-10-24):** seluruh item Fase 7 di atas
> dijalankan ulang setelah perbaikan Fase 6b. Matrix diperluas 45 → 49 test case
> (TC3-2, TC3-3, TC14-4, TC14-5) dan semuanya **Passed**; `qa-api-runner` 17/0/0,
> `qa-web-runner` 19/0, ditambah verifikasi render nyata build produksi di subpath
> `/grocery/`. Laporan lengkap: `docs/qa/grocery-app-split/qa-report.md`.
