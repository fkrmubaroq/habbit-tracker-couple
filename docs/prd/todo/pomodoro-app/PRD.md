# PRD — Pomodoro Tracker (Mini App Personal)

> **Changelog**
> - v1 — rencana awal hasil grill. Keputusan kunci: app terpisah di monorepo (pola `grocery-*`), **data personal per user** tanpa fitur pasangan, timer berbasis timestamp + offline-safe, statistik lengkap dengan heatmap.

## Context

Monorepo ini sudah memisahkan tiap domain menjadi pasangan app sendiri, dengan sesi login terpusat di `habbit-tracker-web`:

| App | Web | API |
|---|---|---|
| Habit Pasutri | `apps/habbit-tracker-web` (:4041) | `apps/habbit-tracker-api` (:5051) |
| Keuangan Pasutri | `apps/finance-tracker-web` (:4040) | `apps/finance-tracker-api` (:5050) |
| Grocery List | `apps/grocery-tracker-web` (:4042) | `apps/grocery-tracker-api` (:5052) |

SSO memakai cookie `token` yang diterbitkan hanya oleh habit API, diverifikasi dengan `JWT_SECRET` yang identik di semua API (lihat `docs/prd/done/cross-app-sso/PRD.md`). Setiap mini app punya modul auth **read-only** (`GET /api/auth/me`, `POST /api/auth/logout`) dan registry `AppSwitcher` sendiri.

Referensi pola pemisahan app: `docs/prd/done/grocery-app-split/PRD.md`.

Belum ada alat bantu fokus di keluarga app ini. **Pomodoro** akan menjadi mini app keempat: timer fokus yang akurat walau tab ditutup, dengan riwayat dan statistik yang bisa dilihat kembali.

## Problem / Motivation

1. **Tidak ada alat fokus yang terintegrasi.** Timer Pomodoro yang ada di web (mis. timer berbasis tab) kehilangan akurasi saat tab di-refresh atau HP dikunci, sehingga sesi fokus tidak tercatat.
2. **Butuh riwayat untuk evaluasi.** Tanpa catatan sesi, tidak ada cara mengetahui berapa lama benar-benar fokus per hari/minggu, label apa yang paling banyak menyita waktu, atau jam berapa paling produktif.
3. **Konsistensi arsitektur.** Menumpang di habit app akan menambah beban app core, menyulitkan deploy terpisah, dan mengulang kesalahan yang sudah diperbaiki di `grocery-app-split`.
4. **Akses lintas device.** Durasi kerja yang sudah disetel seharusnya sama di laptop dan HP, bukan tersimpan lokal per browser.

## Scope

### A. Backend baru — `apps/pomodoro-tracker-api` (`@repo/pomodoro-tracker-api`, port **5053**)

1. Scaffold meniru `apps/grocery-tracker-api`: `package.json` (scripts `dev`/`build`/`start`/`db:migrate`/`db:seed`/`check-types`/`lint`), `tsconfig.json`, `.env.example`.
2. `src/config/env.ts` + `src/config/database.ts`: multi-provider (`mysql`/`supabase`/`neondb`), `PORT` default **5053**, `JWT_SECRET`, `COOKIE_DOMAIN`, `ALLOW_ORIGIN_CORS`, **`APP_TIMEZONE`** (default `Asia/Jakarta`).
3. `src/middleware/auth.middleware.ts`: verifikasi cookie `token` dengan `JWT_SECRET` yang sama, muat user (`id`, `name`, `email`, `partner_id`) dari tabel `users` **read-only**.
4. `src/middleware/error.middleware.ts`: bentuk error konsisten `{ message }`.
5. Modul auth read-only `src/modules/auth/{auth.routes,auth.controller}.ts`: `GET /api/auth/me`, `POST /api/auth/logout` dengan cookie options identik habit API.
6. `src/modules/pomodoro/pomodoro.schema.ts`: validasi Zod untuk settings & sesi.
7. `src/modules/pomodoro/pomodoro.repository.ts`: query sesi & settings, **selalu** difilter `user_id`.
8. `src/modules/pomodoro/pomodoro.controller.ts` + `pomodoro.routes.ts`: endpoint di bagian *Data & API*.
9. `src/migrations/mysql/001-pomodoro-schema.sql` + `src/migrations/supabase/001-pomodoro-schema.sql`: `CREATE TABLE IF NOT EXISTS` untuk `pomodoro_sessions` dan `pomodoro_settings`.
10. `src/migrations/migrate.ts` + `src/migrations/seed.ts`: seed idempotent (tidak menghapus data user; hanya mengisi settings default bila diminta lewat flag).
11. `src/app.ts` + `src/index.ts`: CORS credentials, cookie parser, `GET /health`, mount `/api/auth` dan `/api/pomodoro`.

### B. Frontend baru — `apps/pomodoro-tracker-web` (`@repo/pomodoro-tracker-web`, port **4043**)

12. Scaffold meniru `apps/grocery-tracker-web`: `package.json`, `vite.config.ts` (port **4043**, `base: /pomodoro/` di production, proxy `/api` → `http://localhost:5053`, `VitePWA`), `index.html`, `main.tsx`, `index.css`, `tsconfig*.json`, `eslint.config.js`, `.env.example`.
13. Shell `src/routes/__root.tsx`: `Sidebar` dari `@repo/ui`, `AppSwitcher`, kartu profil dari `useSession`, `ThemeSwitcher`, `Toaster`, `BottomNav` mobile.
14. `src/config/apps.config.ts`: registry **5 app** (Habit, Grocery, Keuangan, Pomodoro, Kalender "Segera Hadir"); `CURRENT_APP_ID = "pomodoro"`.
15. `src/components/app-switcher.tsx`: wrapper tipis di atas `AppSwitcher` dari `@repo/ui`.
16. Auth klien: `src/services/session-url.ts` (`VITE_HABIT_APP_URL`, `VITE_GROCERY_APP_URL`, `VITE_FINANCE_APP_URL`, `VITE_POMODORO_APP_URL`), `src/services/api.ts` (axios `withCredentials`, 401 → redirect login habit dengan `returnTo`), `src/services/auth.service.ts`, `src/hooks/use-session.ts`.
17. State & tema: `src/stores/theme.store.ts` (default **Sakura**), `src/stores/toast.store.ts`, `src/components/ThemeSwitcher.tsx`, `src/components/Toaster.tsx`.
18. `src/components/timer/timer-dial.tsx`: dial progres SVG melingkar + angka countdown + indikator mode.
19. `src/components/timer/mode-tabs.tsx`: tab Fokus / Break / Long Break (Long Break nonaktif sampai siklus memenuhi interval).
20. `src/components/timer/preset-chips.tsx`: chip **25/5/15**, **50/10**, **90/20**, dan "Custom" (input menit per sesi).
21. `src/components/timer/label-input.tsx`: input label bebas (maks 80 karakter) untuk sesi fokus.
22. `src/components/timer/timer-controls.tsx`: tombol Start / Pause / Resume / Reset / Skip.
23. `src/components/timer/session-summary.tsx`: ringkasan hari ini (jumlah sesi fokus + total menit) di halaman timer.
24. `src/hooks/use-pomodoro-timer.ts`: state machine timer berbasis timestamp (`startedAt`, `plannedMinutes`, akumulasi pause) — bukan decrement `setInterval`.
25. `src/hooks/use-timer-alerts.ts`: notifikasi browser + suara (mute-able) + countdown di `document.title`.
26. `src/hooks/use-offline-queue.ts`: antrean sesi selesai saat offline, dikirim ulang saat `online`/app dibuka.
27. `src/routes/index.tsx`: halaman timer — dial, tabs, preset, label, kontrol, ringkasan hari ini, konfeti saat sesi fokus selesai.
28. `src/routes/stats.tsx`: halaman statistik (lihat bagian *Statistik*).
29. `src/routes/settings.tsx`: durasi fokus/break/long break, interval long break, auto-start break, mute suara, izin notifikasi, tema, tautan ke app lain.
30. `src/services/pomodoro.service.ts`: klien API settings/sessions/stats.
31. `src/services/timer-storage.ts`: persist timer aktif ke `localStorage` + pemulihan saat mount (recompute dari timestamp).
32. PWA: manifest (nama **"Pomodoro"**, `short_name` "Pomodoro", `start_url`/`scope` mengikuti `base`), ikon 192/512, `registerType: "autoUpdate"`, precache app shell.

### C. Data & API

**Tabel `pomodoro_sessions`** — hanya sesi **fokus yang selesai**; break tidak pernah dicatat.

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | `VARCHAR(36)` PK | UUID dibuat **klien**, dasar idempotensi retry offline |
| `user_id` | `VARCHAR(36)` | FK `users.id`, index |
| `label` | `VARCHAR(80) NULL` | label bebas, nullable |
| `planned_minutes` | `INT` | durasi yang direncanakan |
| `actual_minutes` | `INT` | durasi aktual (dibulatkan ke bawah, min 1) |
| `started_at` | `DATETIME` | disimpan **UTC** |
| `ended_at` | `DATETIME` | disimpan **UTC** |
| `created_at` | `DATETIME` | default now |

Index: `(user_id, started_at)`.

**Tabel `pomodoro_settings`** — satu baris per user.

| Kolom | Tipe | Default |
|---|---|---|
| `user_id` | `VARCHAR(36)` PK | — |
| `focus_minutes` | `INT` | 25 |
| `short_break_minutes` | `INT` | 5 |
| `long_break_minutes` | `INT` | 15 |
| `long_break_interval` | `INT` | 4 |
| `auto_start_break` | `BOOLEAN` | true |
| `updated_at` | `DATETIME` | now |

**Endpoint** (semua butuh cookie `token`, semua terfilter `user_id`):

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/health` | tanpa auth |
| `GET` | `/api/auth/me` | user + `partner_id` |
| `POST` | `/api/auth/logout` | hapus cookie |
| `GET` | `/api/pomodoro/settings` | buat default bila belum ada |
| `PUT` | `/api/pomodoro/settings` | update durasi/interval/auto-start |
| `POST` | `/api/pomodoro/sessions` | idempotent by `id`; duplikat → `200` tanpa baris baru |
| `GET` | `/api/pomodoro/sessions?from&to&limit` | riwayat, urut `started_at DESC` |
| `GET` | `/api/pomodoro/stats?year=` | agregat untuk halaman statistik |

**Bentuk `GET /api/pomodoro/stats`** (semua dihitung pada `APP_TIMEZONE`):

```json
{
  "today": { "sessions": 3, "minutes": 75 },
  "week": { "sessions": 11, "minutes": 275 },
  "streakDays": 4,
  "last7Days": [{ "date": "2026-10-19", "sessions": 2, "minutes": 50 }],
  "labels": [{ "label": "Coding", "sessions": 8, "minutes": 200 }],
  "heatmap": [{ "date": "2026-10-19", "minutes": 50 }],
  "hourOfDay": [{ "hour": 9, "minutes": 100 }],
  "monthly": [{ "month": "2026-10", "sessions": 24, "minutes": 600 }]
}
```

### D. Statistik (halaman `/stats`)

33. Kartu ringkasan: sesi & menit hari ini, minggu ini (Senin–Minggu), dan **streak hari beruntun**.
34. Bar chart 7 hari terakhir (`recharts`).
35. Donut distribusi label (top 5 + "Lainnya").
36. **Heatmap kalender tahunan** bergaya GitHub (7 baris × 53 kolom), skala warna 4 tingkat, tooltip tanggal + menit.
37. **Jam paling produktif**: bar 24 jam, highlight 3 jam teratas.
38. **Tren bulanan**: line/area 12 bulan terakhir.
39. Daftar riwayat sesi terbaru (tanggal, jam, label, durasi) dengan pagination "muat lebih banyak".

### E. Integrasi lintas app

40. Entri `pomodoro` ditambahkan ke `SWITCHER_APPS`/`APPS_REGISTRY` di `apps/habbit-tracker-web/src/config/apps.config.ts`, `apps/finance-tracker-web/src/config/apps.config.ts`, dan `apps/grocery-tracker-web/src/config/apps.config.ts` — `external: true`, `href` dari `VITE_POMODORO_APP_URL` (default `http://localhost:4043`).
41. `.env.example` ketiga app tersebut ditambah `VITE_POMODORO_APP_URL`.

### F. Infra, konfigurasi, dokumentasi

42. Root `package.json`: `db:migrate:pomodoro`, `db:seed:pomodoro`; `db:migrate:all`/`db:seed:all` mencakup app baru lewat Turborepo.
43. `scripts/deploy.sh`: kirim `dist` + `package.json` web & api pomodoro ke VPS (folder terpisah).
44. `scripts/nginx.conf`: `location /pomodoro/` (SPA fallback ke `/pomodoro/index.html`) + `location /api/pomodoro` → `127.0.0.1:5053`.
45. `AGENTS.md`: perbarui struktur direktori, tabel port, perintah DB, dan daftar app.

## Design decisions

1. **Dua app baru di monorepo, bukan route di habit.** Konsisten dengan `grocery-app-split`: satu lockfile, satu `turbo run build`, deploy terpisah. Menumpang di habit membuat app core ikut menanggung perubahan layout & risiko crash.
2. **Data 100% personal per user — keputusan eksplisit, bukan "belum dibuat".** Setiap query difilter `user_id`. Tidak ada endpoint pasangan, tidak ada status real-time pasangan, tidak ada agregat gabungan. Alasannya: timer fokus adalah alat kerja personal; melihat menit fokus pasangan menciptakan perbandingan yang tidak diminta. Bila nanti diinginkan, jalurnya jelas — tambah `GET /api/pomodoro/partner-summary` read-only tanpa perlu mengubah data model.
3. **Timer dihitung dari timestamp, bukan decrement.** State tersimpan `{ id, mode, startedAt, plannedMinutes, pausedAccumMs, label }`. Saat mount/`visibilitychange`, sisa waktu dihitung ulang dari `Date.now()`. Konsekuensi: refresh, tab ditutup, atau HP dikunci tidak merusak sesi.
4. **Batas platform diakui jujur.** Notifikasi saat browser benar-benar tertutup **tidak dijamin** — tidak ada scheduling API yang reliable di web tanpa push server. Yang dijamin: state timer tetap akurat, dan alert muncul saat tab masih hidup (background) atau saat app dibuka kembali. Ini dicatat sebagai batasan, bukan bug.
5. **Hanya sesi fokus selesai yang dicatat.** Reset/stop di tengah jalan tidak mengirim apa pun. Tujuannya riwayat bersih dan statistik jujur (tidak ada entri setengah jadi). Break juga tidak dicatat karena bukan ukuran produktivitas.
6. **Offline-safe, bukan offline-first.** App shell di-precache; sesi yang selesai saat offline masuk antrean `localStorage` dan dikirim saat `online`. Statistik terakhir tetap tampil dari cache TanStack Query. Tidak ada dua arah penuh (edit offline) karena riwayat bersifat append-only.
7. **Idempotensi lewat UUID dari klien.** `POST /sessions` dengan `id` yang sudah ada mengembalikan `200` tanpa duplikasi, sehingga retry antrean offline aman tanpa dedup server-side yang rumit.
8. **Durasi di server, preferensi UI di lokal.** `focus_minutes` dkk. masuk `pomodoro_settings` supaya sama di semua device. Mute suara, izin notifikasi, dan tema tetap lokal — itu properti perangkat, bukan per akun.
9. **Fixed WIB via `APP_TIMEZONE`.** Agregasi hari/streak/heatmap dihitung di server dengan zona tetap, sehingga hasil konsisten walau device berpindah zona. Client mengirim timestamp UTC.
10. **Reuse `@repo/ui` dan `recharts`.** Dial dibuat sendiri (SVG) karena tidak ada primitif yang cocok; chart memakai `recharts` yang sudah jadi dependency app lain.
11. **Bahasa Indonesia + tema Sakura.** Konsisten dengan app lain; `ThemeSwitcher` dari `@repo/ui` dipakai apa adanya.

## Out of scope

- **Progress/riwayat pasangan dalam bentuk apa pun** (ringkasan angka, detail sesi, status real-time, timer bersama).
- Task list / manajemen proyek. Hanya label teks bebas per sesi.
- Target harian (sesi maupun menit).
- Edit atau hapus entri riwayat yang sudah tercatat.
- Ekspor data (CSV/JSON).
- Keyboard shortcut (Space/R/S).
- Melanjutkan sesi di device lain (timer server-authoritative).
- Getar (Vibration API).
- Toggle bahasa ID/EN.
- Integrasi ke habit tracker (menandai habit selesai, menampilkan menit fokus di dashboard habit).
- Test otomatis (unit/API/E2E). Verifikasi lewat build + QA manual.
- Push notification via server (Web Push) untuk browser yang tertutup.

## Success criteria

1. `pnpm --filter=@repo/pomodoro-tracker-api build` dan `pnpm --filter=@repo/pomodoro-tracker-web build` sukses; `pnpm lint` & `pnpm check-types` bersih untuk kedua app.
2. Login di habit app → buka `http://localhost:4043` → langsung masuk tanpa login ulang; membuka app lain lewat `AppSwitcher` berfungsi dua arah.
3. Mulai sesi fokus 25 menit → refresh halaman di tengah sesi → countdown melanjutkan dari sisa waktu yang benar, bukan reset.
4. Tutup tab, tunggu hingga sesi seharusnya selesai, buka kembali → sesi tercatat tepat satu kali dengan durasi benar.
5. Sesi selesai saat offline → muncul di antrean; saat koneksi kembali, sesi terkirim dan muncul di `/stats` tanpa duplikat.
6. Notifikasi + suara + countdown title tab berfungsi saat sesi selesai (tab background); mute di Pengaturan mematikan suara.
7. `/stats` menampilkan hari ini, minggu, streak, bar 7 hari, donut label, heatmap tahunan, jam produktif, tren bulanan, dan riwayat — semuanya hanya data user yang login.
8. User A tidak dapat melihat data user B: memanggil endpoint dengan sesi milik user lain (via `curl` dengan cookie berbeda) mengembalikan data kosong, bukan data user lain.
9. Ubah durasi di device A → login di device B → durasi ikut berubah; mute suara tetap terpisah per device.
10. PWA dapat di-install dan app shell terbuka saat offline.
11. Test-case matrix manual tersedia di `docs/qa/pomodoro-app/test-matrix.md` dan seluruh skenario dijalankan dengan hasil tercatat di `qa-report.md`.
