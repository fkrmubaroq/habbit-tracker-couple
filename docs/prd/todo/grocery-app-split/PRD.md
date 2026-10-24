# PRD — Pisahkan Grocery Menjadi App Sendiri (FE + BE) & Sesuaikan Layout

## Context

Monorepo ini sudah memisahkan **Keuangan Pasutri** menjadi dua app sendiri:

- `apps/finance-tracker-web` (port 4040) → `apps/finance-tracker-api` (port 5050)
- `apps/habbit-tracker-web` (port 4041) → `apps/habbit-tracker-api` (port 5051)

Sesi login dibagi lewat cookie `token` + `JWT_SECRET` yang sama (lihat `docs/prd/done/cross-app-sso/PRD.md`), dan `finance-tracker-api` punya modul auth **read-only** (`GET /api/auth/me`, `POST /api/auth/logout`).

**Grocery List** masih menumpang di kedua app habit:

| Lapisan | Lokasi sekarang |
|---|---|
| Backend | `apps/habbit-tracker-api/src/modules/grocery/` (controller, routes, schema), repo di `src/repositories/{mysql,supabase}/grocery.*`, interface di `src/repositories/interfaces/grocery.repository.interface.ts`, mount di `src/app.ts:48` |
| Migrasi | `apps/habbit-tracker-api/src/migrations/{mysql,supabase}/002-grocery-schema.sql`, dan `DELETE FROM grocery_items` di `src/migrations/seed.ts:91` |
| Frontend | `apps/habbit-tracker-web/src/routes/grocery-list/{index,manage,settings}.tsx` (URL `/grocery-list*`) |
| Service | `apps/habbit-tracker-web/src/services/grocery.service.ts` (dengan fallback localStorage) |
| Navigasi | `groceryNavItems` + quick action di `src/routes/__root.tsx`, `GroceryBottomNav` di `src/components/navigation/`, entri `grocery-list` di `src/config/apps.config.ts` |

## Problem / Motivation

1. **Grocery bukan app, hanya kumpulan route di dalam habit app.** Ia memakai shell, sidebar, bottom nav, auth store, dan toast store milik habit — sehingga setiap perubahan layout habit ikut menggeser grocery, dan grocery tidak bisa di-deploy/di-scale sendiri.
2. **Layout grocery dipaksa mengikuti layout habit.** `__root.tsx` habit menentukan sidebar berdasarkan `getActiveApp(pathname)`; grocery tidak punya app shell sendiri, sehingga penempatan menu dan area kontennya selalu jadi warga kelas dua.
3. **Backend grocery menumpang proses habit.** Satu crash/deploy habit API ikut mematikan grocery API; modul grocery juga memaksa `repository.factory.ts` habit meng-instansiasi seluruh repo grocery untuk semua provider DB.
4. **Kepemilikan data kabur.** Tabel `grocery_items` dimigrasikan oleh habit API, tapi domainnya grocery; seed habit bahkan menghapus isi tabel grocery.
5. **Fallback localStorage menyembunyikan kegagalan sinkronisasi.** `grocery.service.ts` menyimpan item ke `localStorage` saat API gagal dan tetap tampak sukses — pada daftar belanja bersama pasangan ini menghasilkan dua daftar yang berbeda tanpa user sadar.

## Scope

### A. Backend baru — `apps/grocery-tracker-api` (`@repo/grocery-tracker-api`, port 5052)

1. Scaffold app baru meniru `apps/finance-tracker-api`: `package.json` (scripts `dev`/`build`/`start`/`db:migrate`/`db:seed`/`check-types`/`lint`), `tsconfig.json`, `.env.example`.
2. `src/config/env.ts` + `src/config/database.ts`: multi-provider (`mysql`/`supabase`/`neondb`) dengan `PORT` default **5052**, `JWT_SECRET`, `COOKIE_DOMAIN`, `ALLOW_ORIGIN_CORS`.
3. `src/middleware/auth.middleware.ts`: verifikasi cookie `token` dengan `JWT_SECRET` yang sama dengan habit API, lalu muat user (termasuk `partner_id`) dari tabel `users` **read-only**.
4. Modul auth read-only `src/modules/auth/{auth.routes,auth.controller}.ts`: `GET /api/auth/me` dan `POST /api/auth/logout` (cookie options identik dengan habit API).
5. Pindahkan modul grocery apa adanya: `src/modules/grocery/{grocery.routes,grocery.controller,grocery.schema}.ts`, tetap di-mount pada `/api/grocery` dengan kontrak response yang sama (`{ items }`, `{ item }`, `{ message }`, `{ deletedCount }`).
6. Pindahkan repository: `interfaces/grocery.repository.interface.ts`, `mysql/grocery.mysql.repository.ts`, `supabase/grocery.supabase.repository.ts`, plus `repository.factory.ts` versi grocery (hanya grocery + user read).
7. Pindahkan migrasi `002-grocery-schema.sql` (mysql + supabase) ke `apps/grocery-tracker-api/src/migrations/`, bersama `migrate.ts` dan `seed.ts` versi grocery. Migrasi tetap idempotent (`CREATE TABLE IF NOT EXISTS`) sehingga DB yang sudah ada tidak berubah.
8. `src/app.ts` + `src/index.ts`: CORS dengan credentials, cookie parser, `/health`, mount `/api/auth` dan `/api/grocery`.

### B. Frontend baru — `apps/grocery-tracker-web` (`@repo/grocery-tracker-web`, port 4042)

9. Scaffold app baru meniru `apps/finance-tracker-web` + aset PWA habit: `package.json`, `vite.config.ts` (port **4042**, proxy `/api` → `http://localhost:5052`, `VitePWA` manifest grocery), `index.html`, `main.tsx`, `index.css`, `.env.example`.
10. Shell `src/routes/__root.tsx`: `Sidebar` dari `packages/ui` (bukan layout habit), `AppSwitcher` di header, kartu profil user dari `useSession`, footer berisi quick-add + logout, header mobile, `BottomNav` mobile, `Toaster`.
11. `src/config/apps.config.ts`: registry 4 app (Habit Pasutri, Grocery List, Keuangan Pasutri, Kalender "Segera Hadir") dengan `href` absolut; `CURRENT_APP_ID = "grocery-list"`.
12. `src/components/app-switcher.tsx`: wrapper tipis di atas `AppSwitcher` dari `@repo/ui` (pola `finance-tracker-web`).
13. Auth klien: `src/services/session-url.ts` (`VITE_HABIT_APP_URL`), `src/services/api.ts` (axios `withCredentials`, 401 → redirect ke login habit), `src/services/auth.service.ts`, `src/hooks/use-session.ts`.
14. State & tema: `src/stores/theme.store.ts` + `src/stores/toast.store.ts` + `src/components/ThemeSwitcher.tsx`, default tema mengikuti nilai tersimpan (fallback Sakura) — sama seperti app lain.
15. Pindahkan 3 halaman grocery dengan route baru: `/` (checklist), `/manage`, `/settings` — dari `apps/habbit-tracker-web/src/routes/grocery-list/*`. Data, query key, dan fungsi tetap sama; path internal diperbarui.
16. `src/services/grocery.service.ts`: hasil pindahan **tanpa** fallback localStorage — kegagalan API menjadi error eksplisit (toast), bukan "sukses palsu".
17. Ganti ketergantungan `useAuthStore` habit di halaman grocery dengan `useSession`; tautan "Pintas Menu Lain" di halaman Pengaturan menunjuk ke app habit/finance lewat URL eksternal.
18. PWA: manifest (nama, ikon, `start_url: "/"`, `scope: "/"`), salin aset favicon/ikon yang diperlukan.

### C. Pembersihan habit app

19. Hapus `apps/habbit-tracker-api/src/modules/grocery/`, repo grocery (interface + mysql + supabase), entri grocery di `repository.factory.ts`, mount `app.use("/api/grocery", ...)` di `src/app.ts`, file migrasi `002-grocery-schema.sql` (mysql + supabase), dan baris `DELETE FROM grocery_items` di `src/migrations/seed.ts`.
20. Hapus `apps/habbit-tracker-web/src/routes/grocery-list/*`, `src/services/grocery.service.ts`, `GroceryBottomNav` + referensinya di `src/components/navigation/bottom-navigation.tsx`, `groceryNavItems` + quick action grocery di `src/routes/__root.tsx`.
21. `src/config/apps.config.ts` habit: entri `grocery-list` berubah menjadi `externalUrl` (pola finance) dan `getActiveApp()` tidak lagi punya cabang `/grocery-list`.
22. Shim kompatibilitas: route `/grocery-list`, `/grocery-list/manage`, `/grocery-list/settings` (dan wildcard di bawahnya) tetap ada tetapi hanya `beforeLoad` → redirect ke grocery app. Tidak muncul di menu mana pun.

### D. Infra, konfigurasi, dokumentasi

23. Root `package.json`: script `db:migrate:grocery` dan `db:seed:grocery`; `db:migrate:all`/`db:seed:all` otomatis mencakup app baru lewat Turborepo.
24. `scripts/deploy.sh`: kirim `dist` + `package.json` kedua app grocery ke VPS, dengan folder terpisah dari habit.
25. `scripts/nginx.conf`: contoh `location /grocery` (SPA fallback) + `location /api/grocery` → `127.0.0.1:5052`.
26. `AGENTS.md`: perbarui struktur direktori, tabel port, dan daftar perintah (`db:migrate:grocery`, filter package baru).

## Design decisions

1. **Dua app baru di dalam monorepo, bukan repo terpisah.** Konsisten dengan `finance-tracker-*`, tetap satu lockfile, satu `turbo run build`, dan satu alur deploy. Memisahkan repo berarti menduplikasi `@repo/types`/`@repo/ui` dan menambah beban sinkronisasi yang tidak dibutuhkan sekarang.
2. **Database bersama, kepemilikan tabel jelas.** `grocery-tracker-api` punya koneksi sendiri ke DB yang sama, **memiliki** tabel `grocery_items`, dan membaca `users` secara read-only untuk `partner_id`. Ini meniru `finance-tracker-api` dan menghindari call internal antar-API yang menambah latensi + titik gagal.
3. **Migrasi grocery pindah ke grocery-api, tetap idempotent.** Karena `CREATE TABLE IF NOT EXISTS`, DB existing aman; habit API berhenti mengurus tabel yang bukan domainnya. Tidak ada perubahan kolom/index.
4. **`/api/grocery` di habit API dihapus total pada PR yang sama.** FE lama ikut pindah, jadi tidak ada konsumen yang tertinggal; menyisakan dua implementasi hanya menciptakan dua sumber kebenaran.
5. **Auth grocery read-only, login tetap terpusat di habit.** Grocery tidak punya form login/register; 401 → redirect ke `${VITE_HABIT_APP_URL}/login?returnTo=<url grocery>`. Satu tempat login = satu tempat bug auth (keputusan yang sama dengan cross-app-sso).
6. **Redirect `/grocery-list*` dipertahankan sebagai shim tak terlihat.** Bookmark lama dan entri registry finance (yang masih menunjuk `${HABIT_APP_URL}/grocery-list`) tetap mendarat di grocery app. Menu, bottom nav, dan quick action grocery di habit dihapus agar tidak ada dua jalur navigasi.
7. **Shell grocery memakai `Sidebar` dari `packages/ui`, bukan menyalin layout habit.** `packages/ui` sengaja router-agnostic (`items` + `activePath`), jadi app baru cukup mengirim path dan komponen `Link`.
8. **AppSwitcher diduplikasi di level wrapper + registry, bukan diekstrak ke package.** Komponen primitifnya sudah ada di `packages/ui`; yang diduplikasi hanya registry & navigasi (seperti finance). Ini menjaga habit/finance tidak tersentuh, sesuai scope.
9. **Konten grocery: pindah + rapikan, bukan redesign.** Tiga route dan seluruh fungsi dipertahankan; visual memakai komponen `@repo/ui` yang sudah ada. Tidak ada fitur baru, sehingga risiko regresi produk minimal.
10. **Fallback localStorage dihapus.** Daftar belanja adalah data bersama pasangan; "berhasil" palsu di satu device adalah bug data, bukan fitur offline. Offline cache sejati butuh desain sinkronisasi sendiri (di luar scope).
11. **PWA disertakan sejak awal.** Grocery adalah daftar yang dipakai sambil berbelanja; manifest + service worker dipasang sekarang agar tidak perlu retrofit.
12. **Tanpa i18n di grocery.** Halaman grocery sekarang memang hardcoded Bahasa Indonesia; membawa `react-i18next` hanya menambah dependensi tanpa manfaat.
13. **Registry finance sengaja tidak diubah.** Entri grocery di `apps/finance-tracker-web/src/config/apps.config.ts` masih menunjuk `${HABIT_APP_URL}/grocery-list`; shim redirect membuatnya tetap benar. Mengubahnya ke `VITE_GROCERY_APP_URL` adalah follow-up kecil di luar scope ini (lihat Out of scope).
14. **Port 5052/4042 dan nama `grocery-tracker-*`.** Mengikuti pola `finance-tracker-*` dan tidak bentrok dengan 5050/5051/4040/4041.

## Out of scope

1. Fitur grocery baru: kategori custom, reminder, histori belanja, notifikasi, multi-list, dsb.
2. Perubahan skema/kolom/index tabel `grocery_items` (hanya file migrasi yang berpindah).
3. Perubahan pada fitur habit, analytics, gamification, dan seluruh `finance-tracker-*` (termasuk registry switcher finance).
4. i18n di grocery web (teks tetap Bahasa Indonesia hardcoded).
5. Test runner otomatis baru (API/UI) untuk grocery; verifikasi dilakukan manual + build/typecheck.
6. Offline cache/antrean sinkronisasi pengganti localStorage.
7. Memindahkan `AppSwitcher`/registry ke package bersama.
8. Perubahan desain besar pada konten grocery (hanya pemindahan + pemakaian komponen `@repo/ui`).

## Success criteria

1. `pnpm check-types` dan `pnpm build` lulus untuk seluruh workspace, termasuk dua app baru.
2. `pnpm --filter=@repo/grocery-tracker-api dev` jalan di port 5052 dan `pnpm --filter=@repo/grocery-tracker-web dev` jalan di port 4042.
3. Session habit dipakai langsung oleh grocery app: login di habit → buka `http://localhost:4042` → tidak diminta kredensial; logout di grocery mengakhiri session yang sama.
4. CRUD lengkap berfungsi lewat grocery API: list, create, update, toggle, delete, clear-completed — dan item yang dibuat user terlihat oleh pasangannya (`partner_id`).
5. Membuka `/grocery-list` (atau sub-route-nya) di habit app mendarat di grocery app pada halaman yang setara.
6. App switcher di grocery menampilkan 4 app dan berpindah ke habit/finance tanpa reload-state aneh; sidebar + bottom nav menyorot tepat satu menu per route.
7. `grep -r "grocery" apps/habbit-tracker-api/src` hanya menyisakan sisa yang disengaja (tidak ada module/mount/repo/migrasi grocery).
8. Fallback localStorage tidak ada lagi: mematikan grocery API menghasilkan pesan error, bukan item "tersimpan" di device.
