# ISSUES — Pomodoro Tracker (Mini App Personal)

Rencana: [`PRD.md`](./PRD.md) · Slug: `pomodoro-app`

Legenda: kerjakan berurutan per fase. Setiap item harus bisa diverifikasi sendiri sebelum dicentang.

---

## Fase 0 — Scaffold backend `apps/pomodoro-tracker-api`

- [x] `apps/pomodoro-tracker-api/package.json` — name `@repo/pomodoro-tracker-api`, scripts `dev`/`build`/`start`/`db:migrate`/`db:seed`/`check-types`/`lint`, deps meniru grocery API.
- [x] `apps/pomodoro-tracker-api/tsconfig.json` — extends `@repo/typescript-config/node.json`.
- [x] `apps/pomodoro-tracker-api/.env.example` — `PORT=5053`, `JWT_SECRET`, `COOKIE_DOMAIN`, `DB_PROVIDER`, kredensial MySQL, `ALLOW_ORIGIN_CORS`, `APP_TIMEZONE=Asia/Jakarta`.
- [x] `src/config/env.ts` — parsing env + `APP_TIMEZONE` default `Asia/Jakarta`.
- [x] `src/config/database.ts` — pool multi-provider (`mysql`/`supabase`/`neondb`).
- [x] `src/middleware/error.middleware.ts` — error handler `{ message }`.
- [x] `src/middleware/auth.middleware.ts` — verifikasi cookie `token`, muat user (`id`, `name`, `username`, `partner_id`) read-only. *(deviasi: tabel `users` tidak punya kolom `email`, jadi `username` yang dimuat — sama seperti grocery/finance API)*
- [x] `src/modules/auth/auth.controller.ts` + `auth.routes.ts` — `GET /api/auth/me`, `POST /api/auth/logout` dengan cookie options identik habit API.
- [x] `src/app.ts` + `src/index.ts` — CORS credentials, cookie parser, `GET /health`, mount `/api/auth`, start di port 5053.

## Fase 1 — Data & API pomodoro

- [x] `src/migrations/mysql/001-pomodoro-schema.sql` — `pomodoro_sessions` + index `(user_id, started_at)` + `pomodoro_settings`, semua `CREATE TABLE IF NOT EXISTS`.
- [x] `src/migrations/supabase/001-pomodoro-schema.sql` — versi PostgreSQL dari skema yang sama.
- [x] `src/migrations/migrate.ts` — runner provider-aware (meniru grocery API).
- [x] `src/migrations/seed.ts` — idempotent, tidak menghapus data user.
- [x] `src/modules/pomodoro/pomodoro.schema.ts` — Zod: settings (rentang menit 1–180, interval 1–12) & sesi (uuid, label ≤80, `actual_minutes` ≥1, `ended_at > started_at`).
- [x] `src/modules/pomodoro/pomodoro.repository.ts` — `getSettings` (buat default bila kosong), `updateSettings`, `insertSession` (idempotent by `id`), `listSessions(from,to,limit)`, `aggregateStats(year)`; **semua** query terfilter `user_id`.
- [x] `src/modules/pomodoro/pomodoro.controller.ts` — handler settings/sessions/stats.
- [x] `src/modules/pomodoro/pomodoro.routes.ts` — mount `GET/PUT /settings`, `POST/GET /sessions`, `GET /stats` di bawah auth.
- [x] Verifikasi: `pnpm --filter=@repo/pomodoro-tracker-api db:migrate` jalan di DB lokal; `curl` ke semua endpoint dengan cookie habit mengembalikan bentuk sesuai PRD.
- [x] Verifikasi isolasi: sesi milik user lain tidak pernah muncul pada `GET /sessions` maupun `/stats`.

## Fase 2 — Scaffold frontend `apps/pomodoro-tracker-web`

- [x] `apps/pomodoro-tracker-web/package.json` — name `@repo/pomodoro-tracker-web`, deps meniru grocery web + `recharts` + `dayjs` + `canvas-confetti`.
- [x] `vite.config.ts` — port **4043**, `base: /pomodoro/` saat production, proxy `/api` → `http://localhost:5053`, `VitePWA` (manifest Pomodoro, `registerType: "autoUpdate"`).
- [x] `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` / `index.html` / `src/main.tsx` / `src/index.css`. *(deviasi: tidak ada `eslint.config.js` — sama seperti grocery/finance web, `lint` = `tsc --noEmit`)*
- [x] `.env.example` — `VITE_BASE_URL_API`, `VITE_HABIT_APP_URL`, `VITE_FINANCE_APP_URL`, `VITE_GROCERY_APP_URL`, `VITE_POMODORO_APP_URL`.
- [x] `src/services/session-url.ts` — resolver URL 4 app lain + `getLoginUrl`/`redirectToLogin`.
- [x] `src/services/api.ts` — axios `withCredentials`, 401 → `redirectToLogin` dengan `returnTo`.
- [x] `src/services/auth.service.ts` + `src/hooks/use-session.ts`.
- [x] `src/stores/theme.store.ts` (default **Sakura**) + `src/stores/toast.store.ts`.
- [x] `src/components/ThemeSwitcher.tsx` + `src/components/Toaster.tsx` — pola grocery.
- [x] `src/components/app-switcher.tsx` + `src/config/apps.config.ts` — registry 5 app, `CURRENT_APP_ID = "pomodoro"`.
- [x] `src/routes/__root.tsx` — `Sidebar` `@repo/ui`, `AppSwitcher`, kartu profil `useSession`, `ThemeSwitcher`, `Toaster`, `BottomNav` mobile, navigasi `/`, `/stats`, `/settings`.
- [x] Verifikasi: `pnpm --filter=@repo/pomodoro-tracker-web dev` terbuka di 4043, sesi habit terbaca, AppSwitcher menampilkan 5 app.

## Fase 3 — Engine timer

- [x] `src/services/timer-storage.ts` — baca/tulis/hapus state timer aktif di `localStorage` (`id`, `mode`, `startedAt`, `plannedMinutes`, `pausedAccumMs`, `pausedAt`, `label`).
- [x] `src/hooks/use-pomodoro-timer.ts` — state machine `idle`/`running`/`paused`/`completed`; sisa waktu dihitung dari timestamp; pulihkan state saat mount; interval hanya untuk re-render (tick 250ms), bukan sumber kebenaran.
- [x] `src/hooks/use-pomodoro-timer.ts` — siklus mode: fokus selesai → break otomatis (bila `auto_start_break`), break selesai → fokus **menunggu** Start; long break tiap `long_break_interval` sesi fokus selesai.
- [x] `src/hooks/use-pomodoro-timer.ts` — aksi `start`, `pause`, `resume`, `reset` (tanpa mencatat sesi), `skip` (tanpa mencatat sesi), `complete`.
- [x] Verifikasi: sesi 1 menit → refresh di tengah → sisa waktu benar; refresh setelah sesi seharusnya selesai → status `completed` dan tercatat satu kali.

## Fase 4 — UI timer & preferensi

- [x] `src/services/pomodoro.service.ts` — klien settings/sessions/stats.
- [x] `src/components/timer/timer-dial.tsx` — ring progres SVG + angka countdown + warna per mode.
- [x] `src/components/timer/mode-tabs.tsx` — tab Fokus / Break / Long Break.
- [x] `src/components/timer/preset-chips.tsx` — 25/5/15, 50/10, 90/20, Custom (input menit).
- [x] `src/components/timer/label-input.tsx` — input label bebas maks 80 karakter.
- [x] `src/components/timer/timer-controls.tsx` — Start/Pause/Resume/Reset/Skip dengan state disabled yang benar.
- [x] `src/components/timer/session-summary.tsx` — jumlah sesi & total menit hari ini.
- [x] `src/routes/index.tsx` — rangkai semua komponen timer + konfeti (`canvas-confetti`) saat sesi fokus selesai.
- [x] `src/hooks/use-timer-alerts.ts` — `Notification` API (minta izin dari halaman Pengaturan, bukan otomatis), suara chime dengan toggle mute, countdown `document.title` saat timer berjalan.
- [x] `src/routes/settings.tsx` — form durasi fokus/break/long break, interval long break, auto-start break (tersimpan ke server), mute suara, tombol izin notifikasi, `ThemeSwitcher`, tautan ke app lain.
- [x] Verifikasi: ubah durasi di Pengaturan → reload → nilai tetap; mute bertahan per device; title tab berubah tiap detik saat berjalan.

## Fase 5 — Statistik

- [x] `src/routes/stats.tsx` — kerangka halaman + query `GET /api/pomodoro/stats` dengan `useQuery`.
- [x] Kartu ringkasan: hari ini, minggu ini, streak hari beruntun.
- [x] Bar chart 7 hari terakhir (`recharts`).
- [x] Donut distribusi label (top 5 + "Lainnya").
- [x] Heatmap kalender tahunan (7×53, 4 tingkat warna, tooltip tanggal + menit).
- [x] Bar 24 jam "jam paling produktif" + highlight 3 jam teratas.
- [x] Tren bulanan 12 bulan terakhir.
- [x] Daftar riwayat sesi dengan tombol "muat lebih banyak". *(deviasi: API memakai `from`/`to`/`limit`, jadi "muat lebih banyak" menaikkan `limit`, bukan cursor `before`)*
- [x] State kosong & loading untuk semua blok (belum ada sesi, API error, offline).
- [x] Verifikasi: seed 60+ sesi contoh di DB lokal → semua chart terisi dan angkanya cocok dengan hitung manual.

## Fase 6 — Offline & PWA

- [x] `src/hooks/use-offline-queue.ts` — antrean sesi selesai di `localStorage`, flush saat `online` dan saat app mount, retry idempotent by `id`.
- [x] Integrasi antrean ke alur `complete`: gagal kirim → masuk antrean + toast informatif, bukan error merah.
- [x] Indikator status offline/antrean di UI (badge kecil di halaman timer).
- [x] Konfigurasi `VitePWA`: precache app shell, `start_url`/`scope` mengikuti `base`, ikon 192/512, `robots.txt`.
- [x] Salin aset `favicon/` + ikon PWA (warna tema Pomodoro) ke `public/`.
- [x] Verifikasi: API dimatikan (proxy Vite balas 502) → selesaikan sesi → antrean bertambah; API hidup → sesi terkirim, tidak duplikat saat flush dua kali. *(catatan: 5xx diperlakukan transient, hanya 4xx yang membuang entri antrean)*

## Fase 7 — Integrasi lintas app

- [x] `apps/habbit-tracker-web/src/config/apps.config.ts` — tambah entri `pomodoro` (🍅, "Mini App", `external`, `href` dari `VITE_POMODORO_APP_URL`).
- [x] `apps/finance-tracker-web/src/config/apps.config.ts` — entri `pomodoro` yang sama.
- [x] `apps/grocery-tracker-web/src/config/apps.config.ts` — entri `pomodoro` yang sama.
- [x] `.env.example` ketiga app — tambah `VITE_POMODORO_APP_URL=http://localhost:4043`.
- [x] Verifikasi: dari habit → Pomodoro → balik ke habit/grocery/finance tanpa login ulang.

## Fase 8 — Infra & dokumentasi

- [x] Root `package.json` — `db:migrate:pomodoro`, `db:seed:pomodoro`.
- [x] `scripts/deploy.sh` — kirim `dist` + `package.json` web & api pomodoro ke folder VPS terpisah.
- [x] `scripts/nginx.conf` — `location /pomodoro/` (SPA fallback) + `location /api/pomodoro` → `127.0.0.1:5053`.
- [x] `AGENTS.md` — struktur direktori, tabel port (4043/5053), perintah DB, daftar 4 mini app.

## Fase 9 — Verifikasi & penutupan

- [x] Perbaikan defect D1 (temuan `/qa`): `GET /api/pomodoro/stats?year=` memfilter heatmap sesuai tahun yang diminta, bukan tahun berjalan. `aggregateSessions(rows, tz, now, heatmapYear)` + helper `calendarYearIn` (default tahun saat `?year=` tidak dikirim kini ikut `APP_TIMEZONE`, bukan jam server). Regresi dijaga TC4-8 yang sekarang menyisipkan sesi tahun lalu: `?year=<tahun lalu>` = tepat 1 sel, `?year=<tahun ini>` tidak memuatnya, `?year=2019` kosong — `qa-api-runner.mjs` 38/38.
- [x] `pnpm lint` bersih untuk seluruh workspace.
- [x] `pnpm check-types` bersih untuk seluruh workspace.
- [x] `pnpm build` sukses untuk kedua app baru.
- [x] `docs/qa/pomodoro-app/test-matrix.md` — skenario manual lengkap (timer, refresh, offline, notifikasi, statistik, isolasi user, PWA install, responsif mobile). **98 test case** dalam 7 PB, lint matrix bersih; Summary 98/98 Passed, automation 67 (68%). *(Awalnya 83; bertambah 3 kasus regresi review TC13-1 s/d TC13-3, lalu 7 kasus regresi review pass 2 TC14-1 s/d TC14-7 untuk B4/B5, lalu 5 kasus regresi review pass 3 TC15-1 s/d TC15-5 untuk B6/B7.)*
- [x] `docs/qa/pomodoro-app/qa-report.md` — hasil eksekusi tiap skenario + bukti (screenshot di `evidence/`). Status akhir ✅ PASSED; D1 (heatmap mengabaikan `year`) dan temuan blocking review B1/B2/B3 serta B4/B5 diperbaiki di `/dev` lalu diverifikasi ulang dengan bukti positif. Putaran 4 memakai dua akun nyata bergantian di satu browser — pola yang tidak pernah diuji sebelumnya dan justru karena itu B4 lolos. **Putaran 5 (2026-10-26):** B6/B7 diverifikasi ulang — 98/98 Passed, `pomodoro-state-probe.mts` 4/4 (interleaving flush dikendalikan tes, bukan timing), `qa-web-runner.mjs` 29/29, `qa-api-runner.mjs` 38/38; run Juliet terbukti melanjutkan sisa waktu (`23:49`) setelah Romeo memakai perangkat yang sama. Data uji dibersihkan (`juliet` 66 / `romeo` 0, `localStorage` kosong).
- [x] Code review lima axis (`code-review-and-quality`) + `security-review` untuk auth/isolasi data. **Pass 1 2026-10-25: ❌ changes requested** (B1–B3, selesai di Fase 10). **Pass 2 2026-10-25: ❌ changes requested** — B1–B3 terverifikasi beres, tetapi ditemukan **B4 & B5** (lihat Fase 11). **Pass 3 2026-10-25: ❌ changes requested** — B1–B5 terverifikasi beres (`/qa` 93/93, TC14-1 s/d TC14-7), tetapi ditemukan **B6 & B7** (lihat Fase 12). **`/qa` putaran 5 2026-10-26: B6 & B7 sudah diperbaiki dan diverifikasi** — TC15-1 s/d TC15-5 Passed, matrix 98/98, siap untuk pass 4. **Pass 4 2026-10-26: ✅ approve with comments** — B6/B7 terverifikasi beres (probe interleaving deterministik + bukti browser `23:49` dengan `startedAt` utuh + sesi tercatat atas nama Juliet); 0 blocking baru, 6 catatan non-blocking di `review-report.md` §3 (dua di antaranya layak masuk backlog: path `tsx` portabel di `qa-web-runner.mjs`, dan `writeJson` yang menelan kegagalan tulis sehingga toast bisa berbohong). Detail: [`review-report.md`](../../../qa/pomodoro-app/review-report.md).

## Fase 10 — Perbaikan temuan review `/gate`

Temuan lengkap: [`docs/qa/pomodoro-app/review-report.md`](../../../qa/pomodoro-app/review-report.md)

- [x] **B1** — Jadikan keunikan ID sesi per user: ubah primary key `pomodoro_sessions` dari `id` tunggal menjadi komposit `(user_id, id)` lewat migrasi baru (`002-…`) untuk MySQL **dan** Postgres, agar user B yang mengirim UUID milik user A tersimpan sebagai barisnya sendiri alih-alih gagal 500. `CREATE TABLE IF NOT EXISTS` di 001 tidak mengubah tabel yang sudah ada, jadi migrasi terpisah wajib. *(Migrasi `002` dijaga idempoten lewat guard `information_schema`/`DO $$` karena `migrate.ts` menjalankan ulang semua file setiap kali. `insertSession` juga menangkap duplicate-key lalu membaca ulang barisnya, agar dua request bersamaan untuk user yang sama tetap sukses. Terverifikasi: dua user UUID sama → 2 baris, keduanya 201.)*
- [x] **B2** — Hentikan kebocoran detail database di respons 500: `errorMiddleware` hanya mengirim pesan spesifik untuk error yang punya `statusCode` eksplisit (4xx), dan memakai pesan generik untuk 5xx tak terduga (detail tetap ke `console.error`). Saat ini `Duplicate entry '…' for key 'pomodoro_settings.PRIMARY'` sampai ke toast UI lewat `api.ts` → `showToast(error.message)`. Batasi perbaikan pada app pomodoro; grocery/finance punya cacat sama dan dicatat sebagai backlog terpisah. *(Terverifikasi: error driver → 500 generik tanpa nama tabel/constraint; error eksplisit 404 tetap mempertahankan pesannya.)*
- [x] **B3** — Buat `getSettings` kunjungan pertama race-safe: tulis default dengan `INSERT … ON DUPLICATE KEY UPDATE` (MySQL) / `ON CONFLICT (user_id) DO NOTHING` (Postgres) lalu baca ulang barisnya, atau tangkap error duplicate-key dan `SELECT` ulang. Terbukti 2 dari 6 request paralel saat ini gagal 500. *(Terverifikasi: 6/6 request paralel → 200, tepat 1 baris settings.)*
- [x] Tambahkan kasus regresi B1–B3 ke `docs/qa/pomodoro-app/test-matrix.md` saat `/qa` berikutnya: (a) dua user mengirim UUID sesi sama → keduanya tersimpan, bukan 500; (b) request paralel `GET /settings` user baru → semua 200; (c) respons 500 tidak memuat nama tabel/constraint. *(Ditambahkan sebagai TC13-1/TC13-2/TC13-3 di PB-1 grup 9 dan diimplementasikan di `qa-api-runner.mjs` + `tests/error-middleware-probe.mts`; runner 38/38. Summary matrix kini 86 kasus, automation 62 (72%). Prefiks `TC13` dipakai karena `TC7` sudah terpakai PB-2; penomoran sempat bentrok saat penulisan awal dan diperbaiki di `/qa`.)*

## Fase 11 — Perbaikan temuan review `/gate` pass 2

Temuan lengkap + bukti reproduksi: [`docs/qa/pomodoro-app/review-report.md`](../../../qa/pomodoro-app/review-report.md) bagian 2 (B4, B5).

- [x] **B4** — Ikat seluruh state perangkat ke pemiliknya, jangan hanya ke perangkat. Saat ini `pomodoro-pending-sessions`, `pomodoro-active-timer`, dan `pomodoro-settings-cache` disimpan dengan kunci global tanpa `user_id`, sehingga di satu browser bekas akun lain: antrean offline akun A terkirim atas nama akun B (terbukti — sesi `juliet` tercatat milik `romeo`), timer akun A diwarisi akun B lengkap dengan label pribadinya (terbukti — label "Rahasia Juliet" tampil di layar Romeo beserta sisa 19:29), dan `readCachedSettings` memakai durasi akun lain karena tidak mencocokkan `user_id` yang sudah ada di payload. Perbaikan: (a) simpan `user_id` pada tiap entri antrean dan pada `StoredTimerState`; (b) `flush` hanya mengirim entri milik user aktif dan **membiarkan utuh** entri milik akun lain (jangan dikirim, jangan dihapus); (c) `loadTimer` membuang state yang `user_id`-nya bukan user aktif; (d) `readCachedSettings` menolak cache dengan `user_id` berbeda; (e) `logout()` membersihkan keempat kunci (kini hanya `pomodoro-session-cache`; `clearTimer()` yang sudah ada bisa dipakai). Pengikatan ke pemilik adalah perbaikan utama — menghapus state saat logout saja tidak cukup karena sesi juga bisa berakhir tanpa logout. Terima: `juliet` menyisakan antrean + timer berlabel, login `romeo` → tidak ada yang terkirim dan timer idle/label kosong; setelah `juliet` login lagi, antreannya terkirim atas namanya. Tambahkan kasus regresi ini ke `test-matrix.md` di `/qa` berikutnya. **Selesai:** helper kepemilikan baru `services/device-state.ts` (`belongsTo`, `readOwned`, `writeOwned`, `clearDeviceState`) — satu tempat untuk aturan "milik siapa", bukan `if (userId)` tersebar di empat file. Antrean menyimpan `user_id` per entri dan `flush` melewati entri akun lain tanpa mengirim/menghapus; `loadTimer(userId)`/`saveTimer(userId, …)` membuang run milik akun lain; `readCachedSettings(userId)` menolak cache dengan owner berbeda; `queryKey` settings ikut `userId`. **Deviasi sadar dari butir (e):** `logout()` membersihkan identitas + cache settings + timer aktif, tetapi **tidak** menghapus antrean — menghapusnya akan membuang sesi yang belum terkirim (kelas data-loss yang sama dengan B5); entri antrean sudah ber-`user_id` sehingga inert bagi akun lain dan terkirim saat pemiliknya kembali. `clearTimer()` yang tadinya dead code dihapus, digantikan `clearDeviceState()`. Entri antrean lama tanpa `user_id` (dari build sebelumnya) dibuang saat dibaca, bukan ditebak pemiliknya. Diverifikasi di browser: Romeo tidak menerima apa pun dari antrean/timer Juliet (DB tetap `romeo 0`), lalu Juliet kembali → entri terkirim tepat sekali (`juliet 66 → 67`); timer tidak diwarisi (dial `25:00`, label kosong, state tersimpan ber-owner Romeo).
- [x] **B5** — Jangan buang sesi fokus yang ditolak `401`. `isTransientError` (`services/api.ts`) hanya menganggap transien bila tanpa status atau ≥ 500, sehingga 401 masuk kategori "payload ditolak": `submit()` mengembalikan `rejected` tanpa `enqueue`, dan `flush()` tidak memasukkan entri ke `remaining` sehingga terhapus dari antrean. Akibatnya sesi yang sudah dikerjakan hilang bila cookie 30 hari kedaluwarsa atau user logout di tab lain tepat saat sesi selesai. Perbaikan: pisahkan "belum terautentikasi" (401/403) dari "payload ditolak" (400/422) — 401/403 harus **menunda**: entri dipertahankan di antrean, tidak dikirim selama belum login, lalu terkirim tepat sekali setelah login berikutnya; aturan buang untuk 400/422 tetap berlaku. Terima: `POST /sessions` yang menjawab 401 tidak mengurangi panjang antrean, dan setelah login ulang entri terkirim tepat satu baris. Tambahkan kasus regresi ini ke `test-matrix.md` di `/qa` berikutnya. **Selesai:** helper baru `isUnauthenticatedError` (`services/api.ts`) memisahkan 401/403 ("belum login", tunda) dari 400/422 ("payload ditolak", buang); `isTransientError` tetap untuk jaringan/5xx. `submit()` mengantrekan lalu mengembalikan hasil baru `"deferred"` (toast: "Sesi disimpan — login lagi untuk mengirimnya"), dan `flush()` mempertahankan entri lalu berhenti pada 401 pertama alih-alih mencoba sisanya. Diverifikasi: entri ber-`user_id` Juliet disisakan, cookie dicabut, `online` dipicu → 401, antrean tidak hilang; setelah login ulang entri terkirim tepat satu baris (`juliet 66 → 67`).

## Fase 12 — Perbaikan temuan review `/gate` pass 3

Temuan lengkap + interleaving reproduksi: [`docs/qa/pomodoro-app/review-report.md`](../../../qa/pomodoro-app/review-report.md) §2 (B6, B7).

- [x] **B6** — Hentikan `flush()` menimpa antrean dari snapshot basi, agar sesi yang masuk antrean saat flush berjalan tidak terhapus. Saat ini `flush()` mengambil `current = readQueue()` sekali di awal lalu, setelah loop `await`, memanggil `update(remaining)` yang menulis **seluruh** kunci dari snapshot itu; `enqueue()` menulis ke kunci yang sama dari pembacaan yang lebih baru, dan keduanya tidak saling tahu. Interleaving yang menghilangkan data: `t0 flush: current=[A]` → `t1 flush: await POST(A)` → `t2 sesi fokus selesai, POST(B) gagal karena jaringan putus lagi → enqueue(B) → storage=[A,B]` → `t3 flush: update([A]) → storage=[A]`, B hilang dan tidak pernah sampai ke server. Realistis karena `flush()` dipanggil tepat pada dua momen yang paling mungkin bertabrakan dengan penyelesaian sesi: saat mount (user membuka app tepat ketika timer sudah lewat waktunya — skenario TC7-5) dan saat event `online` (jaringan berkedip, POST berikutnya gagal lagi sehingga `submit()` mengantrekan di tengah flush). Perbaikan: jangan menulis balik seluruh antrean dari snapshot — catat `id` yang benar-benar terkirim (atau dibuang sebagai 400/422 permanen) selama loop, lalu setelah loop baca ulang antrean dan tulis hasil filter `latest.filter(entry => !delivered.has(entry.input.id))`, sehingga entri yang masuk selama flush tetap hidup. Terima: flush ditahan dengan respons `POST` lambat → sesi fokus selesai di tengah flush → setelah flush selesai entri baru **masih ada** di antrean dan terkirim pada flush berikutnya; entri yang sudah terkirim tidak terkirim ulang. **Selesai:** antrean dipindah ke `services/pending-queue.ts` (storage + loop pengiriman, tanpa React) dan hook tinggal membungkusnya — pemisahan ini yang membuat interleaving-nya bisa diuji tanpa browser. Penulisan sekarang **per entri**: `removeSessions([id])` membaca ulang lalu menulis dalam satu langkah sinkron (tanpa `await` di antaranya), jadi entri yang masuk saat POST berjalan tidak mungkin ikut terhapus; tidak ada lagi `remaining`/snapshot yang ditulis balik. *(Deviasi kecil dari usulan reviewer: bukan `delivered` + filter di akhir, melainkan hapus-per-entri saat itu juga — jaminannya sama, tapi tidak perlu menyimpan set ID dan tidak ada jendela antara "selesai loop" dan "menulis".)* 401 kini cukup `break` tanpa menulis apa pun, karena entri yang tidak dihapus memang tetap di antrean. Regresi dijaga `tests/pomodoro-state-probe.mts` TC15-1/TC15-2 yang menahan `send` secara eksplisit — deterministik, tanpa mengandalkan timing. **Bug di perbaikan pertama ikut tertangkap probe:** `onQueueChange?.(removeSessions([id]))` tidak mengeksekusi `removeSessions` saat listener tidak terpasang (argumen pada optional call di-skip), sehingga penghapusan bergantung pada ada/tidaknya UI — sudah diperbaiki dengan menghitung hasil lebih dulu lalu memberi tahu.
- [x] **B7** — Beri timer aktif satu slot penyimpanan per pemilik, agar run fokus yang sedang berjalan milik pasangan tidak terhapus saat akun lain membuka app di perangkat yang sama. Saat ini `STORAGE_KEY = DEVICE_STATE_KEYS.activeTimer` tunggal: `loadTimer(romeo)` benar menolak run Juliet (inti B4, jangan diubah), tetapi efek `saveTimer(romeo, state)` berikutnya **menimpa** kunci yang sama dengan state idle milik Romeo. Akibatnya Juliet kembali mendapati dial `25:00` idle — run 24 menitnya hilang dan tidak pernah tercatat di mana pun, tanpa peringatan (teramati di `/qa` TC14-2 sebagai pengamatan non-blocking; dinaikkan menjadi blocking di pass 3 karena dampaknya kehilangan run yang sedang berjalan, dan skenario "satu tablet dipakai bergantian" justru skenario yang memunculkan B4). Penolakan yang benar berubah menjadi penghapusan yang tidak perlu. Perbaikan: simpan per pemilik — mis. `pomodoro-active-timer:<userId>` atau satu peta `{ [userId]: StoredTimerState }` di dalam kunci yang ada. `loadTimer`/`saveTimer` sudah menerima `userId`, jadi perubahan terpusat di `timer-storage.ts`; `clearDeviceState()` perlu menerima `userId` agar hanya membersihkan slot pemilik yang logout (teruskan dari `logout()`), dan `readOwned`/`writeOwned` tetap dipakai untuk validasi struktur + kepemilikan supaya aturan B4 tidak terduplikasi. Terima: Juliet menyisakan run berjalan berlabel → Romeo membuka app (dial `25:00`, label kosong, miliknya sendiri) → Juliet kembali dan dial **melanjutkan sisa waktunya** dengan label utuh → run Juliet selesai dan tercatat atas namanya. **Selesai:** `activeTimerKey(userId)` di `device-state.ts` menghasilkan `pomodoro-active-timer:<userId>`; `loadTimer`/`saveTimer` memakai slot itu dan tetap lewat `readOwned`/`writeOwned` (aturan B4 tidak terduplikasi). `clearDeviceState(userId)` hanya menghapus slot akun yang keluar — slot pasangan tetap berjalan — dan `logout(userId)` dipanggil dengan `user?.id` dari `__root.tsx`. Kunci tunggal dari build sebelumnya **dibuang, bukan dimigrasikan**: payload itu tidak bisa diatribusikan, dan membiarkannya berarti label pribadi tertinggal di perangkat; `loadTimer`/`saveTimer` membersihkannya sekali saat timer disentuh. Regresi dijaga probe TC15-3/TC15-4 (slot Juliet bertahan setelah Romeo menulis slotnya sendiri; logout hanya membersihkan slot sendiri) — **lapisan storage terbukti, verifikasi browser menyusul di `/qa` sebagai TC15-5**.
- [x] Tambahkan kasus regresi B6–B7 ke `docs/qa/pomodoro-app/test-matrix.md` saat `/qa` berikutnya: (a) **B6** — flush ditahan (respons `POST /sessions` ditunda) → sesi fokus selesai sehingga entri baru masuk antrean → flush selesai → entri baru masih ada di antrean lalu terkirim pada flush berikutnya (harus deterministik dengan menahan respons, bukan mengandalkan timing); (b) **B7** — run Juliet berjalan berlabel → login Romeo → login Juliet kembali → dial melanjutkan sisa waktu + label utuh, dan sesi tercatat atas nama Juliet. *(Ditambahkan sebagai TC15-1 s/d TC15-5 di PB-5 grup 9, plus baris traceability 11–14. TC15-1 s/d TC15-4 sudah **Passed**: diimplementasikan di `tests/pomodoro-state-probe.mts` dan dijalankan dari `qa-web-runner.mjs`, dengan interleaving yang dikendalikan tes (`send` yang menggantung), bukan timing. TC15-5 — Juliet kembali dan dial melanjutkan sisa waktu — juga **Passed** di `/qa` putaran 5 (bukti browser: dial `23:49`, `startedAt` utuh, sesi tercatat atas nama Juliet). Summary matrix kini 98 kasus, **98 Passed / 0 Progress**, automation 67 (68%).)*

## Fase 13 — Penutupan

- [x] Semua item di atas dicentang → pindahkan `docs/prd/done/pomodoro-app/` ke `docs/prd/done/pomodoro-app/`. **Selesai 2026-10-26:** dipindahkan dengan `move-plan.mjs --slug pomodoro-app --to done` (satu `git mv` + penulisan ulang tautan relatif; tidak ada direktori kosong tersisa di `todo/`).
