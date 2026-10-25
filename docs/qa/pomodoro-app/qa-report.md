# QA Verification Report — Pomodoro Tracker (Mini App Personal)

- **Slug:** `pomodoro-app`
- **Tanggal Pengujian:** 2026-10-25 (putaran 1–4), 2026-10-26 (putaran 5)
- **Tester:** OpenCode QA Agent
- **Target Stack:** Express API (`apps/pomodoro-tracker-api`, :5053), React Vite SPA + PWA (`apps/pomodoro-tracker-web`, :4043), `@repo/types`, `@repo/ui`, `@repo/tailwind-config`, habit app sebagai issuer sesi (:4041 / :5051), finance (:4040) & grocery (:4042) untuk AppSwitcher
- **Status Akhir:** ✅ **PASSED (98/98 test case)** — defect D1 serta temuan blocking review B1/B2/B3, B4/B5, dan B6/B7 sudah diperbaiki di `/dev` dan diverifikasi ulang
- **Putaran:** 5 (QA awal → perbaikan D1 → perbaikan review B1–B3 → perbaikan review B4–B5 → perbaikan review B6–B7)

---

## 1. Ringkasan Eksekutif

Pengujian menyeluruh dilaksanakan terhadap dua app baru hasil `docs/prd/todo/pomodoro-app/`: backend pomodoro (settings, sessions, stats, isolasi data per user) dan frontend timer PWA (engine berbasis timestamp, siklus mode, antrean offline, halaman statistik, integrasi AppSwitcher, serta wiring infra).

Dari **98 test case** pada [Test Matrix](./test-matrix.md), **seluruh 98 berstatus Passed** dan **0 Failed**.

Putaran pertama pengujian menemukan satu defect produk (**D1**): parameter `year` pada `GET /api/pomodoro/stats` diterima dan divalidasi, tetapi diabaikan saat menyusun heatmap, sehingga pemilih tahun di halaman Statistik tidak pernah benar-benar mengganti tahun data. Defect itu sudah diperbaiki di `/dev` dan diverifikasi ulang (lihat [Bagian 3.1](#31-d1--year-pada-get-apipomodorostats-diabaikan-saat-menyusun-heatmap--fixed--re-verified)).

Putaran ketiga memverifikasi tiga temuan blocking dari `/gate` (**B1/B2/B3**) yang seluruhnya berada di backend: primary key sesi yang global, kebocoran detail database pada respons 500, dan race condition pada kunjungan pertama `GET /settings`. Ketiganya sudah diperbaiki di `/dev`; putaran ini membuktikan perbaikan tersebut lewat tiga kasus regresi baru (TC13-1 s/d TC13-3) **plus** verifikasi ulang alur tulis yang tersentuh perubahan skema di browser sungguhan (lihat [Bagian 3.2](#32-b1b2b3--temuan-blocking-review-gate--fixed--re-verified)).

Putaran keempat memverifikasi dua temuan blocking `/gate` pass 2 (**B4/B5**) yang keduanya berada di klien: state perangkat (`localStorage`) yang tidak terikat ke pemilik akun, dan `401` yang diperlakukan sebagai penolakan permanen sehingga sesi fokus bisa hilang. Tujuh kasus regresi baru (TC14-1 s/d TC14-7) dijalankan dengan **dua akun nyata bergantian di satu browser** — pola yang tidak pernah diuji pada tiga putaran sebelumnya, dan justru karena itu B4 lolos dari QA. Seluruh manifestasi yang direproduksi di `/gate` kini terbukti tertutup, termasuk pengiriman sesi Juliet atas namanya sendiri setelah Romeo memakai perangkat yang sama (lihat [Bagian 3.3](#33-b4b5--temuan-blocking-review-gate-pass-2--fixed--re-verified)).

Putaran kelima memverifikasi dua temuan blocking `/gate` pass 3 (**B6/B7**), keduanya juga di klien dan keduanya adalah **race/kepemilikan state**: `flush()` menulis balik seluruh antrean dari snapshot yang diambil sebelum `await`, sehingga sesi yang masuk antrean saat flush berjalan terhapus; dan timer hanya punya **satu** kunci penyimpanan untuk seluruh perangkat, sehingga membuka app sebagai pasangan menghapus run fokus yang sedang berjalan. Perbaikan B6 membuat antrean menulis **per entri** (baca-ulang lalu tulis dalam satu langkah sinkron), dan perbaikan B7 memberi tiap pemilik slot `pomodoro-active-timer:<userId>` sendiri. Karena keduanya race, verifikasinya tidak mengandalkan timing: probe `tests/pomodoro-state-probe.mts` menjalankan loop pengiriman yang sebenarnya dengan `send` yang ditahan tes (TC15-1/TC15-2), dan alur "Juliet → Romeo → Juliet" dijalankan di browser sungguhan sampai dial melanjutkan sisa waktunya (TC15-3 s/d TC15-5). Detail di [Bagian 3.4](#34-b6b7--temuan-blocking-review-gate-pass-3--fixed--re-verified).

Seluruh alur inti lolos: timer tetap akurat setelah refresh maupun setelah sesi lewat waktu, pause/resume menghitung jeda dengan benar, reset & skip tidak pernah tercatat, siklus fokus → break → fokus berjalan sesuai aturan, sesi yang selesai saat API mati masuk antrean lalu terkirim tepat sekali, isolasi data antar pasangan terbukti baik di API maupun di UI, dan pemilih tahun heatmap kini menampilkan tahun yang dipilih.

### Rekapitulasi Metrik Pengujian

| Metrik | Nilai | Target / Syarat | Status |
|---|---|---|---|
| **Total Test Case** | 98 | 98 | 100% Tercakup |
| **Passed** | 98 | 98 | 100% Lolos |
| **Failed** | 0 | 0 | — |
| **Skip** | 0 | 0 | — |
| **Automated Verification** | 67 (68,37%) | > 24% | Memenuhi Syarat |
| **Teardown Cleanliness** | 100% bersih | Zero leftover test data | Berhasil dibersihkan |

### Runner otomatis yang dipakai

| Runner | Cakupan | Hasil |
|---|---|---|
| `apps/pomodoro-tracker-api/tests/qa-api-runner.mjs` | 38 test HTTP nyata (health, auth SSO, settings + validasi, sessions + idempotensi, stats + agregasi zona waktu, isolasi user, migrasi, seed, **regresi B1/B2/B3**) | **38 passed, 0 failed** |
| `apps/pomodoro-tracker-api/tests/error-middleware-probe.mts` | Probe `errorMiddleware` via `tsx` (dipakai TC13-3): error driver tanpa `statusCode` vs error 4xx eksplisit | **2/2 sesuai expected** |
| `apps/pomodoro-tracker-web/tests/qa-web-runner.mjs` | 29 test struktural/konfigurasi (engine timestamp, label, preset, custom override, halaman settings, alert, tema, aturan retry antrean, manifest & precache PWA, cache sesi, registry AppSwitcher 3 app, script root, nginx, deploy, AGENTS.md, artefak build, **aturan kepemilikan state & pemisahan 401**, **regresi B6/B7**) | **29 passed, 0 failed** |
| `apps/pomodoro-tracker-web/tests/pomodoro-state-probe.mts` | 4 test regresi state klien via `tsx` — menjalankan `flushPendingSessions` sebenarnya dengan `send` yang dikendalikan tes (interleaving B6, aturan hapus/tunda/401, slot timer per pemilik B7, logout per akun) | **4 passed, 0 failed** |
| Browser E2E (agent browser, Chromium nyata) | 24 skenario alur interaktif (mulai, refresh, sesi lewat waktu, pause/resume, reset, skip, siklus break, long break, settings persist, jepit nilai, empty state pasangan, error state offline, antrean offline, navigasi lintas app, pemilih tahun heatmap) | **24/24 sesuai expected** |
| Browser E2E putaran 3 (alur yang tersentuh perubahan skema) | Login SSO habit → pomodoro, sesi fokus selesai → tersimpan tepat 1 baris di PK komposit, halaman statistik, simpan durasi di `/settings` → DB, dial timer mengikuti default server | **5/5 sesuai expected** |
| Browser E2E putaran 4 (dua akun bergantian di satu browser) | Antrean lintas akun, timer lintas akun, cache settings lintas akun, logout membersihkan state live, submit 401, flush 401 | **6/6 sesuai expected** |
| Browser E2E putaran 5 (run lintas akun + flush antrean nyata) | Juliet mulai run berlabel → Romeo buka app (dial sendiri, slot Juliet utuh) → Juliet kembali (dial lanjut + label utuh) → logout Romeo hanya menghapus slotnya → sesi 1 menit selesai tercatat atas nama Juliet → antrean di-seed lalu flush saat mount mengirim milik Juliet dan **tidak menyentuh** milik Romeo | **5/5 sesuai expected** |

---

## 2. Rincian Pengujian per Product Backlog (PB)

### PB-1: Backend pomodoro — auth, settings, sessions, stats, isolasi (TC1-1 s/d TC6-2 + TC13-1 s/d TC13-3, 38 TC)

- **TC1-1 s/d TC1-4 (auth & health)**: `GET /health` tanpa auth → 200 `{"status":"ok","service":"pomodoro-tracker-api"}`. Cookie hasil login habit API diterima pomodoro API; `GET /api/auth/me` mengembalikan `username`, `partner_id`, dan **tidak** membocorkan `password_hash`. Ketiga endpoint pomodoro menolak request tanpa cookie dengan 401. Logout mengosongkan cookie `token`.
- **TC2-1 s/d TC2-5 (settings)**: User baru otomatis mendapat baris settings default **25/5/15/4/true**. `PUT` menyimpan 50/10/20/3/false dan persist pada `GET` berikutnya. `focus_minutes: 0` → 400 dengan body `{ error, details[] }` (kontrak `validate` middleware, sama dengan app lain). Update parsial (`auto_start_break` saja) tidak mengubah field lain. Batas atas ditegakkan: focus 181, short 61, long 121, interval 13 → semuanya 400.
- **TC3-1 s/d TC3-10 (sessions)**: Sesi baru → 201 `duplicate:false`; retry dengan `id` sama → 200 `duplicate:true` dengan **jumlah baris DB tetap 1**. Validasi menolak `planned_minutes: 0`, label 81 karakter, `ended_at == started_at`, dan `id` bukan UUID. Riwayat urut `started_at` DESC, `limit=2` mengambil tepat 2 terbaru, `limit=201` → 400, filter `from`/`to` hanya mengembalikan sesi dalam rentang.
- **TC4-1 s/d TC4-7, TC4-9, TC4-10 (stats)**: Payload memuat `today, week, streakDays, last7Days, labels, heatmap, hourOfDay, monthly` dengan `timezone: "Asia/Jakarta"`. Diuji terhadap **fixture deterministik 6 sesi** pada user khusus:
  - `today` = 3 sesi / 95 menit, `week` = 6 sesi / 165 menit, `streakDays` = 3 (hari ke-3 sengaja kosong memutus streak).
  - **Bucketing WIB terbukti benar**: sesi pukul 00:30 WIB hari ini (tersimpan sebagai 17:30 UTC **kemarin**) masuk bucket hari ini, dan bucket kemarin tetap 1 sesi.
  - `last7Days` tepat 7 entri berurutan T-6..T; `hourOfDay` 24 entri dengan total menit = 165; `labels` urut menit desc dengan sesi tanpa label menjadi `"Tanpa label"`; `monthly` 12 entri berakhir bulan berjalan.
  - Streak tetap 2 pada user yang hari ini belum punya sesi (tidak dianggap putus).
  - `?year=1999` → 400.
- **TC4-8 (heatmap per tahun) — ✅ PASSED**: heatmap kini mengikuti `year` yang diminta. Regresi dijaga dengan menyisipkan sesi di tahun lalu: `?year=<tahun lalu>` mengembalikan **tepat 1 sel** (`<tahun-lalu>-06-15`, 25 menit), `?year=<tahun ini>` tidak memuat tanggal tahun lalu, `?year=2019` kosong. Detail di [Bagian 3](#3-defect-yang-ditemukan-dan-status-perbaikannya).
- **TC5-1 s/d TC5-4 (isolasi)**: User B tidak melihat satu pun sesi user A; stats user B tidak memuat label milik A dan total menitnya hanya miliknya sendiri; settings terpisah per `user_id`. Diuji juga dengan akun nyata `juliet` vs `romeo` — tidak ada id sesi yang beririsan.
- **TC6-1 s/d TC6-2 (migrasi & seed)**: Migrasi dijalankan dua kali berturut-turut tanpa error. Seeder tidak menghapus `users` (dicek dari output **dan** source) serta menjaga mode production.
- **TC13-1 s/d TC13-3 (regresi temuan review)**: Tiga kasus baru dari `/gate`, semuanya **Passed** — lihat [Bagian 3.2](#32-b1b2b3--temuan-blocking-review-gate--fixed--re-verified) untuk detail dan buktinya.

### PB-2: Engine timer & halaman timer (TC7-1 s/d TC7-15, 15 TC)

- **TC7-1**: Halaman timer merangkai `TimerDial`, `ModeTabs`, `PresetChips`, `LabelInput`, `TimerControls`, `SessionSummary`, dan memanggil konfeti saat fokus selesai (lihat [evidence/01-timer-page.png](./evidence/01-timer-page.png)).
- **TC7-2**: Engine menyimpan `startedAt` + `pausedAccumMs` dan menghitung sisa dari `Date.now()`; tidak ada decrement manual, `setInterval` hanya memicu render ulang.
- **TC7-3**: Mulai fokus → dial `25:00 → 24:09`, judul tab menjadi `"24:09 — Fokus"`, `startedAt` tersimpan.
- **TC7-4 (refresh)**: Saat tersisa `21:01`, halaman di-reload → dial `20:55` sementara hitungan independen memberi `20:54` (**selisih 1 detik**, akibat pembulatan tampilan), `sessionId` sama, status tetap `running`. Timer **tidak** ter-reset.
- **TC7-5 (sesi lewat waktu)**: `startedAt` dimundurkan 26 menit lalu halaman di-reload → sesi tercatat **tepat 1 baris** (`planned 25`, `actual 25`), tidak ada duplikat saat reload berikutnya.
- **TC7-6 (pause/resume)**: Dial beku di `20:45` selama jeda (judul `"20:45 — Fokus (jeda)"`); setelah lanjut `pausedAccumMs: 6791` dan dial tetap `20:45` — waktu jeda tidak dihitung sebagai fokus.
- **TC7-7 (reset)**: Status kembali `idle`, dial `25:00`, `sessionId: null`; jumlah baris DB tetap **66** (tidak ada sesi tercatat).
- **TC7-8 (skip)**: Pindah ke break `05:00` idle, `sessionId: null`, antrean offline 0, DB tidak bertambah.
- **TC7-9 (fokus → break otomatis)**: Dengan `auto_start_break: true`, sesi fokus selesai langsung memulai `short_break` berstatus `running`.
- **TC7-10 (break → fokus manual)**: Break selesai → mode `focus`, status `idle`, dial `25:00`, tombol "Mulai Fokus" menunggu klik.
- **TC7-11 (long break)**: Dengan `focusCompletedTotal: 3`, fokus ke-4 menghasilkan `long_break` 15 menit dan counter menjadi 4.
- **TC7-12**: Input label `maxLength` 80 dengan counter `n/80`, dan engine memotong label di 80 karakter.
- **TC7-13**: Preset mengirim **ketiga** durasi ke server (`focus_minutes`, `short_break_minutes`, `long_break_minutes`); tersedia 25/5/15, 50/10/20, 90/20/30, dan Custom.
- **TC7-14**: Custom memanggil `setPlannedMinutes` yang menandai `durationOverride: true` **tanpa** `PUT /settings`, dan sinkronisasi durasi server dilewati selama override aktif.
- **TC7-15**: `BottomNav` memakai `md:hidden fixed bottom-0`, konten utama `pb-24 md:pb-8`, tidak ada `min-width` kaku pada kartu timer.

### PB-3: Preferensi & alert (TC8-1 s/d TC8-7, 7 TC)

- **TC8-1**: Form durasi lengkap (fokus, break pendek, long break, interval, toggle auto-start, tombol "Simpan durasi") — lihat [evidence/04-settings.png](./evidence/04-settings.png).
- **TC8-2**: Fokus diubah 25 → 30, disimpan, lalu halaman di-reload → input tetap `30`, `pomodoro-settings-cache` = 30, dan server menyimpan 30.
- **TC8-3**: Input `999` dijepit menjadi `180` sebelum disimpan (tidak ada error ke user).
- **TC8-4**: `Notification.requestPermission()` hanya terpasang pada `onClick` tombol "Minta izin" di `/settings`; tidak dipanggil dari effect maupun dari halaman timer.
- **TC8-5**: `soundMuted` & preferensi notifikasi disimpan di `localStorage` (properti perangkat).
- **TC8-6**: Judul tab menampilkan countdown `"MM:SS — Fokus"`, `"(jeda)"` saat dijeda, dan kembali `"Pomodoro — Timer Fokus"` saat idle.
- **TC8-7**: Tema awal **Sakura Pink**, `index.html` memakai `data-theme="Sakura"`, pilihan tema tersimpan per device, `ThemeSwitcher` tersedia di `/settings`.

### PB-4: Halaman statistik (TC9-1 s/d TC9-11, 10 TC)

Diuji dengan akun `juliet` (66 sesi) dan `romeo` (0 sesi).

- **TC9-1**: Kartu ringkasan **Hari ini 7 sesi / 176 menit**, **Minggu ini 8 sesi / 201 menit**, **Streak 1 hari**.
- **TC9-2**: Bar chart 7 hari (Sen–Min) terisi dengan tooltip "n menit".
- **TC9-3**: Donut menampilkan Review 1080, Meeting 600, Belajar 300, Coding 300, Menulis 300, dan **Lainnya** 151 menit (label ke-6 digabung).
- **TC9-4**: Heatmap 365 sel dengan tooltip `"Kamis, 1 Januari 2026 — 0 menit (0 sesi)"` dan ringkasan `"2731 menit fokus di 2026"` (lihat [evidence/02-stats-filled.png](./evidence/02-stats-filled.png)).
- **TC9-5**: Bar 24 jam dengan tiga jam teratas disorot dan teks `"Puncak: 07:00 · 08:00 · 09:00"`.
- **TC9-6**: Area chart 12 bulan (Nov–Okt) mengikuti data.
- **TC9-7**: Riwayat 20 baris pertama, "Muat lebih banyak" menambah baris, sesi tanpa label tampil sebagai "Tanpa label".
- **TC9-8 (empty state pasangan)**: Login `romeo` → semua kartu 0, **enam** empty state "Belum ada…", tidak ada label milik `juliet` (lihat [evidence/03-stats-empty-partner.png](./evidence/03-stats-empty-partner.png)). Ini sekaligus bukti isolasi data di UI.
- **TC9-10 (UI vs API)**: Angka kartu ringkasan identik dengan respons `GET /api/pomodoro/stats` (`today 7/176`, `week 8/201`, `streak 1`).
- **TC9-11 (pemilih tahun) — ✅ PASSED**: dropdown `2026 → 2025 → 2026` diverifikasi dengan sesi 2025 sungguhan. Default 2026: 365 sel bertanggal 2026, 60 sel berisi data, ringkasan `"2731 menit fokus di 2026"`. Pilih 2025: 365 sel bertanggal 2025, **tepat 1 sel berisi data** (`"Minggu, 15 Juni 2025 — 25 menit (1 sesi)"`), ringkasan `"25 menit fokus di 2025"`. Tanpa data 2025: `"Belum ada sesi fokus di 2025"` — bukan lagi total 2026. Detail di [Bagian 3](#3-defect-yang-ditemukan-dan-status-perbaikannya).

### PB-5: Offline-safe & PWA (TC10-1 s/d TC10-6 + TC14-1 s/d TC14-7 + TC15-1 s/d TC15-5, 18 TC)

- **TC10-1 (sesi saat offline)**: API :5053 dimatikan, sesi 25 menit diselesaikan → `pomodoro-pending-sessions` berisi 1 entri, UI menampilkan badge **"1 sesi menunggu dikirim"** + **"Offline"**, tanpa error merah.
- **TC10-2 (kirim ulang)**: API dihidupkan lagi → antrean menjadi **0**, badge hilang, dan DB berisi **tepat 1 baris** dengan `id` yang sama (idempoten).
- **TC10-3 (aturan retry)**: `isTransientError` menganggap transien bila **tanpa status** atau **status ≥ 500**; 4xx **non-auth** yang membuang entri, sedangkan `401`/`403` hanya menunda (aturan ini diperluas oleh perbaikan B5). Ini yang memperbaiki kasus Vite proxy menjawab 502 saat API mati (sebelumnya sesi selesai ikut terbuang).
- **TC10-4 (manifest)**: `name`/`short_name` "Pomodoro", `lang: "id"`, `start_url` & `scope` relatif (`"."`), ikon 192 & 512, `robots.txt` tersedia, `base: "/pomodoro/"`.
- **TC10-5 (precache)**: `dist/sw.js` memuat precache **13 entri (892,90 KiB)**.
- **TC10-6 (cache sesi)**: Dengan API mati, cold load tetap di `:4043` (bukan dilempar ke `/login`), identitas dari `pomodoro-session-cache` tampil; hanya `401` yang memicu redirect.
- **TC14-1 s/d TC14-7 (kepemilikan state perangkat) — ✅ PASSED**: regresi untuk temuan review B4/B5, dijalankan dengan **dua akun nyata bergantian di satu browser**. Juliet menyisakan antrean ber-label + timer fokus berjalan ber-label, lalu Romeo memakai perangkat yang sama: DB `romeo` tetap **0 baris**, entri antrean Juliet utuh (owner `juliet`, label "Catatan pribadi Juliet"), badge "menunggu dikirim" tidak muncul, dial kembali `25:00` dan input label kosong. Saat Juliet kembali, antreannya terkirim **tepat satu baris** atas namanya (`juliet 66 → 67`). Cache settings milik Juliet (`focus_minutes: 50`) tidak dipakai Romeo (dial `25:00` mengikuti server) dan ditulis ulang dengan owner Romeo. Logout membersihkan identitas + cache settings + timer aktif tetapi **mempertahankan antrean**. `401` saat `submit()` menyimpan sesi ke antrean (tidak hilang), dan `401` saat `flush()` tidak menguras antrean. Detail di [Bagian 3.3](#33-b4b5--temuan-blocking-review-gate-pass-2--fixed--re-verified).
- **TC15-1 s/d TC15-5 (regresi B6/B7) — ✅ PASSED**: dua temuan blocking `/gate` pass 3. **B6** dibuktikan dengan interleaving eksplisit: `flushPendingSessions` dijalankan dengan `send` yang ditahan tes, sesi kedua diantrekan saat POST pertama masih berjalan, lalu POST pertama diselesaikan → antrean berisi **entri baru saja** (bukan kosong, bukan keduanya), dan entri itu terkirim pada flush berikutnya tanpa mengirim ulang yang sudah sukses (TC15-1/TC15-2). **B7** dibuktikan di browser sungguhan: Juliet menyisakan run 25 menit berlabel "Rahasia Juliet" (dial `24:57`) → Romeo membuka `:4043` dan mendapat dial `25:00` kosong dengan slot sendiri, sementara slot Juliet **utuh** (`startedAt` tidak berubah) → Juliet kembali dan dial **melanjutkan di `23:49`** dengan tombol "Jeda" dan label utuh (TC15-5); logout Romeo lewat tombol "Keluar" hanya menghapus slot Romeo (TC15-4). Sesi 1 menit berlabel "QA B7 Selesai" yang diselesaikan setelah run itu tercatat sebagai `username=juliet`. Detail di [Bagian 3.4](#34-b6b7--temuan-blocking-review-gate-pass-3--fixed--re-verified).

### PB-6: Integrasi lintas app (TC11-1 s/d TC11-5, 5 TC)

- **TC11-1 s/d TC11-3**: Entri `pomodoro` terdaftar di registry habit, finance, dan grocery, memakai `VITE_POMODORO_APP_URL` (finance & grocery menandainya `external: true`). Bukti visual: [habit](./evidence/06-switcher-habit.png), [finance](./evidence/07-switcher-finance.png), [grocery](./evidence/08-switcher-grocery.png).
- **TC11-4**: Ketiga `.env.example` memuat `VITE_POMODORO_APP_URL=http://localhost:4043`.
- **TC11-5 (SSO)**: Dari habit app `:4041`, membuka AppSwitcher lalu memilih Pomodoro → mendarat di `:4043/` dalam keadaan **sudah login** (nama "Juliet" tampil, tidak diarahkan ke `/login`).

### PB-7: Infra & dokumentasi (TC12-1 s/d TC12-5, 5 TC)

- **TC12-1**: `db:migrate:pomodoro` & `db:seed:pomodoro` tersedia di root dan menargetkan `@repo/pomodoro-tracker-api` (keduanya sudah dieksekusi sukses).
- **TC12-2**: `scripts/nginx.conf` memuat `location ^~ /pomodoro/` dengan SPA fallback, `location /api/pomodoro/` → `127.0.0.1:5053/api/pomodoro/`, dan blok tersebut dideklarasikan **sebelum** `location /api/` generik.
- **TC12-3**: `deploy.sh` mengirim `pomodoro-tracker-api/dist` & `pomodoro-tracker-web/dist`, mengunggah `.env`, dan mendaftarkan `pm2 start dist/index.js --name pomodoro-backend`.
- **TC12-4**: `AGENTS.md` memuat kedua app, perintah DB, port 4043/5053, `APP_TIMEZONE`, dan catatan data personal.
- **TC12-5 (quality gate)**: `pnpm lint` **9/9 sukses**, `pnpm check-types` **9/9 sukses**, `pnpm build` **8/8 sukses** (PWA 13 entri / 892,90 KiB). Artefak `dist/` kedua app ada.

---

## 3. Defect yang Ditemukan dan Status Perbaikannya

### 3.1 D1 — `year` pada `GET /api/pomodoro/stats` diabaikan saat menyusun heatmap — ✅ **FIXED & RE-VERIFIED**

- **Severity:** Medium (fungsional, user-visible pada data tahun sebelumnya; tidak ada risiko data/keamanan)
- **Kasus:** `TC4-8` (API), `TC9-11` (UI)
- **Ditemukan pada:** putaran QA pertama (2026-10-25)
- **Diperbaiki pada:** `/dev`, 2026-10-25
- **Lokasi:** `apps/pomodoro-tracker-api/src/modules/pomodoro/pomodoro.stats.ts`

**Gejala semula (API):**

```
GET /api/pomodoro/stats?year=2026  -> 60 sel, contoh tanggal: 2026-03-03, 2026-03-07, 2026-03-11
GET /api/pomodoro/stats?year=2025  -> 60 sel, contoh tanggal: 2026-03-03, 2026-03-07, 2026-03-11
GET /api/pomodoro/stats?year=2024  -> 60 sel, contoh tanggal: 2026-03-03, 2026-03-07, 2026-03-11
```

**Gejala semula (UI):** di `/stats`, dropdown tahun diubah `2026 → 2025`. Permintaan yang dikirim benar (`/api/pomodoro/stats?year=2025`), tetapi respons tetap berisi sel bertanggal 2026 sementara ringkasan berubah menjadi `"2731 menit fokus di 2025"` — angka tahun berjalan ditempel ke label tahun lain. Grid 2025 tampak kosong karena tidak ada tanggal 2026 yang cocok dengan sel 2025.

**Akar masalah:** `aggregateSessions` menurunkan tahun heatmap dari `todayDate.slice(0, 4)` (tahun berjalan), bukan dari parameter `year`. Parameter `year` hanya dipakai untuk melebarkan window query (`from`), sehingga ia tidak pernah memengaruhi isi `heatmap`.

**Perbaikan yang diterapkan:**

| File | Perubahan |
|---|---|
| `pomodoro.stats.ts` | `aggregateSessions(rows, tz, now, heatmapYear)` — heatmap disaring dengan `date.slice(0,4) === String(heatmapYear)`, bukan `todayDate`. Helper baru `calendarYearIn(now, tz)` sebagai satu-satunya sumber "tahun berjalan". |
| `pomodoro.repository.ts` | `aggregateStats(userId, requestedYear?)` meneruskan `year` ke agregasi **dan** ke window query. Bila `?year=` tidak dikirim, default diambil dari `APP_TIMEZONE`, bukan jam server. |
| `pomodoro.controller.ts` | `?year=` absen → `undefined`, agar default WIB yang menentukan (bukan `new Date().getFullYear()` menurut zona server). |

Perbaikan default tahun ikut disertakan karena kelas bug-nya sama: pada 1 Januari 00:00–06:59 WIB, jam server (UTC) masih menunjuk tahun lama sementara bucket `today` sudah masuk tahun baru.

**Penguatan test regresi:** versi TC4-8 sebelumnya hanya membuktikan "tahun lain kosong" — implementasi yang mengabaikan `year` tetap lolos. Test kini menyisipkan sesi di tahun lalu dan menuntut hasil positif: `?year=<tahun lalu>` = tepat 1 sel dengan 25 menit, `?year=<tahun ini>` tidak memuatnya, `?year=2019` kosong.

**Bukti setelah perbaikan (API):**

```
year=2026 -> cells: 60 | sample: 2026-03-03, 2026-03-07 | today: 7 | monthly last: 2026-10
year=2025 -> cells: 0  | sample: (kosong)                | today: 7 | monthly last: 2026-10
year=2024 -> cells: 0  | sample: (kosong)                | today: 7 | monthly last: 2026-10
tanpa param -> cells: 60 | sample: 2026-03-03
# dengan 1 sesi sementara 2025-06-15 25 menit:
year=2025 -> cells: 1 | sample: 2025-06-15:25m
year=2026 -> cells: 60 | sample: 2026-03-03:90m, 2026-03-07:50m
```

**Bukti setelah perbaikan (UI):**

```
onLoad   : { selectValue: "2026", cellCount: 365, cellYears: ["2026"], cellsWithData: 60, sumMinutes: 2731, summary: ["2731 menit fokus di 2026"] }
after2025: { selectValue: "2025", cellCount: 365, cellYears: ["2025"], cellsWithData: 1,
             dataCells: ["Minggu, 15 Juni 2025 — 25 menit (1 sesi)"], summary: ["25 menit fokus di 2025"] }
after2026: { selectValue: "2026", cellCount: 365, cellYears: ["2026"], cellsWithData: 60, summary: ["2731 menit fokus di 2026"] }
```

**Status akhir:** TC4-8 dan TC9-11 **Passed**. `qa-api-runner.mjs` 38/38, `qa-web-runner.mjs` 24/24.

**Catatan proses:** kegagalan pertama tertangkap justru karena matrix memuat kasus pemilih tahun sebagai skenario tersendiri; tanpa baris itu, defect ini hanya akan terlihat sebagai "heatmap kosong" yang mudah disalahartikan sebagai akun tanpa data.

---

### 3.2 B1/B2/B3 — Temuan blocking review `/gate` — ✅ **FIXED & RE-VERIFIED**

- **Severity:** High (B1 & B3 kehilangan data pengguna; B2 kebocoran detail skema ke UI)
- **Kasus:** `TC13-1` (B1), `TC13-2` (B3), `TC13-3` (B2)
- **Ditemukan pada:** `/gate`, 2026-10-25 — [review-report.md](./review-report.md)
- **Diperbaiki pada:** `/dev`, 2026-10-25
- **Lokasi:** `pomodoro.repository.ts`, `error.middleware.ts`, `migrations/{mysql,supabase}/002-pomodoro-session-pk.sql`

**Gejala semula (ketiganya direproduksi sebelum perbaikan):**

```
B1  user B mengirim UUID milik user A
    -> 500 "Duplicate entry '…' for key 'pomodoro_sessions.PRIMARY'"
B3  6 request paralel GET /settings untuk user baru
    -> 200, 500, 500, 200, 200, 200
       "Duplicate entry '…' for key 'pomodoro_settings.PRIMARY'"
B2  error driver tanpa statusCode
    -> body 500 memuat nama tabel/constraint, lalu tampil di toast UI
       lewat api.ts -> showToast(error.message)
```

**Akar masalah & perbaikan:**

| # | Akar masalah | Perbaikan |
|---|---|---|
| **B1** | `id VARCHAR(36) PRIMARY KEY` unik **global**, padahal idempotensi dicek `(id, user_id)`. User lain tidak menemukan barisnya, lalu `INSERT` menabrak PK. | PK menjadi komposit `(user_id, id)` — di 001 untuk instalasi baru, dan lewat migrasi `002` (MySQL + Postgres) untuk DB yang sudah ada. `insertSession` juga menangkap duplicate-key lalu membaca ulang barisnya. |
| **B2** | `errorMiddleware` meneruskan `err.message` apa adanya untuk 500 tak terduga. | Pesan spesifik hanya bila `statusCode`/`status` diset eksplisit (4xx); 5xx tak terduga → pesan generik, detail tetap di `console.error`. |
| **B3** | `getSettings` melakukan `SELECT` lalu `INSERT` tanpa penjagaan race. | `INSERT … ON DUPLICATE KEY UPDATE` (MySQL) / `ON CONFLICT (user_id) DO NOTHING` (Postgres), lalu baris dibaca ulang. |

**Catatan migrasi:** `migrate.ts` menjalankan ulang **semua** file `.sql` setiap kali (tidak ada ledger), sehingga `002` wajib idempoten — dijaga lewat `information_schema` + `PREPARE` (MySQL) dan blok `DO $$` (Postgres). Dijalankan dua kali: sukses, PK `user_id, id`, **66 baris utuh**, FK `pomodoro_sessions_ibfk_1` dan index `idx_pomodoro_sessions_user_started` tetap ada.

**Bukti setelah perbaikan (API):**

```
B1  A pertama   -> 201, owner A
    B UUID sama -> 201, label "milik B", owner B     (dulu 500)
    A retry     -> 200, duplicate:true
    baris DB    -> 2 (satu per user)
B3  statuses    -> 200, 200, 200, 200, 200, 200      (dulu 2 gagal 500)
    baris settings -> 1
B2  error driver -> 500 {"error":"Terjadi kesalahan internal pada server"}
    memuat nama tabel/constraint/nilai key? -> false
    error 4xx eksplisit -> 404 {"error":"Sesi tidak ditemukan"} (pesan dipertahankan)
```

**Bukti setelah perbaikan (browser, alur yang tersentuh perubahan skema):**

```
login SSO habit -> :4043 tampil "Juliet", tanpa redirect /login
sesi fokus selesai -> state focus/short_break, antrean 0, DB tepat 1 baris
                      (juliet 66 -> 67, lalu dihapus lagi)
/stats -> 365 sel, "2756 menit fokus di 2026" (2731 + 25 sesi uji)
/settings -> fokus 25 -> 30 -> DB focus_minutes = 30, cache = 30
timer idle -> dial "30:00" mengikuti default server
```

**Temuan tambahan saat `/qa` ini (bukan produk, tapi artefak):** baris matrix baru sempat memakai ID `TC7-1..TC7-3` yang **sudah terpakai** PB-2 (timer), sehingga terjadi tabrakan ID. Sudah diperbaiki menjadi `TC13-1..TC13-3` (grup 9, prefiks global lanjut setelah TC12) di matrix, runner, dan `ISSUES.md`. Diverifikasi ulang: **0 ID duplikat** (kini 93 baris setelah TC14-1 s/d TC14-7 ditambahkan di putaran 4).

**Status akhir:** TC13-1, TC13-2, TC13-3 **Passed**. `qa-api-runner.mjs` 38/38.

---

### 3.3 B4/B5 — Temuan blocking review `/gate` pass 2 — ✅ **FIXED & RE-VERIFIED**

- **Severity:** High (B4 mencatat sesi atas nama orang yang salah + menampilkan label pribadi pasangan; B5 menghilangkan sesi fokus yang sudah dikerjakan)
- **Kasus:** `TC14-1` s/d `TC14-3` (B4), `TC14-4` (B4-e), `TC14-5`/`TC14-6` (B5), `TC14-7` (invarian struktur keduanya)
- **Ditemukan pada:** `/gate` pass 2, 2026-10-25 — [review-report.md](./review-report.md)
- **Diperbaiki pada:** `/dev` Fase 11, 2026-10-25
- **Lokasi:** `services/device-state.ts` (baru), `hooks/use-offline-queue.ts`, `services/timer-storage.ts`, `services/pomodoro.service.ts`, `services/api.ts`, `services/auth.service.ts`, `hooks/use-session.ts`

**Mengapa tiga putaran QA sebelumnya tidak menangkapnya:** seluruh pengujian sebelumnya memakai **satu akun per sesi browser**. B4 hanya muncul saat dua akun bergantian di perangkat yang sama, dan B5 hanya muncul saat cookie tidak valid tepat pada saat sesi selesai. Kedua kondisi itu kini menjadi skenario wajib di matrix (PB-5 grup 7–8).

**Gejala semula (direproduksi di `/gate`):**

```
B4  Juliet menyisakan antrean 1 entri + timer fokus berlabel
    -> login Romeo, buka :4043
       antrean Juliet terkirim atas nama Romeo   (romeo 0 -> 1)
       dial mewarisi sisa waktu Juliet 19:29 + label "Rahasia Juliet"
B5  cookie dicabut saat sesi fokus selesai
    -> submit() menjawab 401 -> dianggap "payload ditolak"
       antrean tidak bertambah, sesi hilang permanen
    flush() saat 401 -> seluruh antrean terkuras
```

**Akar masalah & perbaikan:**

| # | Akar masalah | Perbaikan |
|---|---|---|
| **B4** | `pomodoro-pending-sessions`, `pomodoro-active-timer`, dan `pomodoro-settings-cache` memakai kunci global tanpa pemilik, sehingga state perangkat dipakai akun berikutnya. | Helper kepemilikan tunggal `services/device-state.ts` (`belongsTo`, `readOwned`, `writeOwned`, `clearDeviceState`) dipakai keempat modul. Antrean menyimpan `user_id` per entri dan `flush` melewati entri akun lain **tanpa mengirim maupun menghapus**; `loadTimer(userId)`/`saveTimer(userId, …)`; `readCachedSettings(userId)` menolak owner berbeda; `queryKey` settings ikut `userId`. |
| **B4-e** | `logout()` hanya membersihkan `pomodoro-session-cache`. | `clearDeviceState()` membersihkan identitas + cache settings + timer aktif. **Deviasi sadar:** antrean **tidak** dihapus — menghapusnya membuang sesi yang belum terkirim (kelas data-loss yang sama dengan B5); entri sudah ber-`user_id` sehingga inert bagi akun lain. |
| **B5** | `isTransientError` hanya mengenal "tanpa status / ≥ 500", sehingga `401` masuk kategori "payload ditolak". | `isUnauthenticatedError` (401/403) dipisah dari `isTransientError`. `submit()` mengantrekan lalu mengembalikan hasil baru `"deferred"`; `flush()` mempertahankan entri dan **berhenti** pada 401 pertama, bukan mencoba sisa antrean. Aturan buang untuk 400/422 tetap. |

**Bukti setelah perbaikan (browser, dua akun bergantian):**

```
TC14-1  Juliet antrean 1 entri -> login Romeo -> DB romeo 0, antrean tetap 1 (owner juliet)
        -> Juliet kembali -> terkirim tepat 1 baris (juliet 66 -> 67)
TC14-2  timer Juliet running+label -> login Romeo -> dial 25:00, label "", owner romeo, idle
TC14-3  cache settings owner juliet (focus 50) -> Romeo online -> dial 25:00, cache owner romeo
TC14-4  klik "Keluar" (marker qa-keluar-clicked = yes)
        -> sessionCache null, settingsCache null, activeTimer null, queue 1 (owner juliet)
TC14-5  sesi fokus 1 menit selesai dengan cookie dicabut
        -> antrean 1 (label "Sesi saat token kedaluwarsa"), tidak hilang
        -> login ulang -> DB tepat 1 baris, planned 1 menit, owner juliet
TC14-6  flush dipicu dengan cookie dicabut -> antrean tetap 1, DB tidak bertambah
TC14-7  struktur: helper kepemilikan dipakai 3 modul, 401/403 dipisah, flush berhenti pada 401
```

**Catatan pengamatan (non-blocking saat itu, kemudian dinaikkan menjadi blocking):** karena kunci `pomodoro-active-timer` tunggal, membuka app sebagai pasangan **menimpa** run yang sedang berjalan milik akun sebelumnya — Juliet kembali mendapati timer `25:00` idle, bukan sisa waktunya. Saat itu dinilai bukan pelanggaran butir B4(c) ("buang state milik akun lain") dan justru lebih baik daripada mewarisinya, sehingga dicatat tanpa diperbaiki. `/gate` pass 3 menaikkannya menjadi **B7**: menolak mewarisi run bukan alasan untuk menghapusnya, dan skenario "satu tablet dipakai bergantian" justru skenario yang memunculkan B4. Perbaikannya ada di [Bagian 3.4](#34-b6b7--temuan-blocking-review-gate-pass-3--fixed--re-verified).

**Status akhir:** TC14-1 s/d TC14-7 **Passed**. `qa-web-runner.mjs` **25/25**; `qa-api-runner.mjs` **38/38** (backend tidak tersentuh perubahan ini).

---

### 3.4 B6/B7 — Temuan blocking review `/gate` pass 3 — ✅ **FIXED & RE-VERIFIED**

- **Severity:** High (B6 menghilangkan sesi fokus yang baru selesai; B7 menghapus run fokus yang sedang berjalan milik pasangan)
- **Kasus:** `TC15-1`/`TC15-2` (B6), `TC15-3`/`TC15-4`/`TC15-5` (B7)
- **Ditemukan pada:** `/gate` pass 3, 2026-10-25 — [review-report.md](./review-report.md)
- **Diperbaiki pada:** `/dev` Fase 12, 2026-10-26
- **Lokasi:** `services/pending-queue.ts` (baru), `services/api-errors.ts` (baru), `hooks/use-offline-queue.ts`, `services/device-state.ts`, `services/timer-storage.ts`, `services/auth.service.ts`, `routes/__root.tsx`

**Gejala semula (direproduksi di `/gate`):**

```
B6  t0 flush: current = [A]
    t1 flush: await POST(A)
    t2 sesi fokus selesai, POST(B) gagal lagi -> enqueue(B) -> storage = [A, B]
    t3 flush: update([A]) -> storage = [A]        <-- B hilang permanen
B7  Juliet run fokus 24:xx berlabel -> login Romeo, buka :4043
    -> loadTimer(romeo) menolak run Juliet (benar)
    -> saveTimer(romeo, idle) menimpa KUNCI YANG SAMA
    -> Juliet kembali: dial 25:00 idle, run 24 menitnya hilang
```

**Akar masalah & perbaikan:**

| # | Akar masalah | Perbaikan |
|---|---|---|
| **B6** | `flush()` mengambil snapshot antrean sekali di awal, lalu setelah loop `await` menulis **seluruh** kunci dari snapshot itu. `enqueue()` menulis ke kunci yang sama dari pembacaan yang lebih baru; keduanya tidak saling tahu, sehingga entri yang masuk di tengah flush terhapus. | Antrean dipindah ke `services/pending-queue.ts` (storage + loop, tanpa React) dan penulisan menjadi **per entri**: `removeSessions([id])` membaca ulang lalu menulis dalam satu langkah sinkron tanpa `await` di antaranya, jadi entri baru tidak mungkin ikut terhapus. Tidak ada lagi snapshot yang ditulis balik; `401` cukup `break` karena entri yang tidak dihapus memang tetap di antrean. **Deviasi sadar** dari usulan reviewer (kumpulkan `delivered` lalu filter di akhir): jaminannya sama, tanpa perlu menyimpan set ID dan tanpa jendela antara "selesai loop" dan "menulis". |
| **B7** | `STORAGE_KEY = DEVICE_STATE_KEYS.activeTimer` tunggal untuk seluruh perangkat. `loadTimer` sudah menolak run akun lain (inti B4), tetapi `saveTimer` akun berikutnya menimpa kunci yang sama — penolakan yang benar berubah menjadi penghapusan yang tidak perlu. | `activeTimerKey(userId)` → `pomodoro-active-timer:<userId>`, tetap lewat `readOwned`/`writeOwned` agar aturan B4 tidak terduplikasi. `clearDeviceState(userId)` hanya menghapus slot akun yang keluar; `logout(userId)` meneruskan `user?.id` dari `__root.tsx`. Kunci tunggal dari build lama **dibuang, bukan dimigrasikan** (tidak bisa diatribusikan, dan membiarkannya menahan label pribadi di perangkat). |

**Bukti setelah perbaikan:**

```
TC15-1  send ditahan tes, sesi B diantrekan saat POST(A) berjalan
        -> setelah A selesai: antrean = [B]  (bukan [], bukan [A,B])
        -> flush berikutnya mengirim B; A tidak dikirim ulang
TC15-2  4 entri: a=200, b=400, c=401, r=milik akun lain
        -> hanya a,b,c dikirim; sisa antrean = [c, r]
        -> flush kedua hanya mengirim c
TC15-3  saveTimer(juliet, running+label) -> loadTimer(romeo) null
        -> saveTimer(romeo, idle) -> loadTimer(juliet) masih running,
           label utuh, startedAt sama
TC15-4  clearDeviceState(juliet) -> slot juliet hilang, slot romeo tetap,
        antrean 1 entri dipertahankan
TC15-5  browser: Juliet 25 menit berlabel (24:57) -> Romeo (25:00, label "")
        -> Juliet kembali: dial 23:49 + "Jeda" + label utuh, sessionId sama
        -> sesi 1 menit selesai: DB username=juliet, planned/actual 1/1
```

**Bug di dalam perbaikan pertama, tertangkap probe:** `onQueueChange?.(removeSessions([id]))` **tidak** mengeksekusi `removeSessions` ketika listener tidak terpasang — argumen pada optional call di-skip — sehingga penghapusan entri bergantung pada ada/tidaknya UI yang mendengarkan. Probe TC15-1/TC15-2 langsung gagal (`antrean tetap [a,b]`); diperbaiki dengan menghitung hasil lebih dulu lalu memberi tahu. Ini alasan probe ditulis sebagai eksekusi kode nyata, bukan assertion struktural.

**Verifikasi tambahan (regresi karena antrean berpindah modul):** antrean di-seed manual (1 entri Juliet + 1 entri Romeo) lalu halaman `:4043` di-reload. Flush saat mount mengirim entri Juliet (`0b6e7a10-1111…` → DB `username=juliet`), antrean Juliet kosong, dan entri Romeo **tetap di antrean** tanpa masuk DB — jalur `flush` yang dipindah tetap berperilaku sama seperti putaran 4.

**Status akhir:** TC15-1 s/d TC15-5 **Passed**. `pomodoro-state-probe.mts` **4/4**; `qa-web-runner.mjs` **29/29**; `qa-api-runner.mjs` **38/38** (backend tidak tersentuh); `pnpm lint` 9/9, `pnpm check-types` 9/9, `pnpm build` 8/8.

---

## 4. Catatan Metodologi & Keterbatasan

1. **Tooling.** Repo ini tidak memasang Playwright/Vitest/Jest (`node_modules/.bin` bersih). Verifikasi mengikuti konvensi repo yang sudah ada: runner Node `qa-*-runner.mjs` untuk API nyata (HTTP + fixture ber-tag + teardown) dan invarian struktural web, ditambah **probe `tsx`** (`pomodoro-state-probe.mts`) untuk logika klien yang tidak bisa dibuktikan secara struktural, dan eksekusi browser sungguhan (Chromium) untuk alur interaktif. Tidak ada verifikasi yang dilewati karena tooling.
2. **Bukti.** Seluruh skenario browser diverifikasi lewat assertion DOM/state (dump `localStorage`, judul tab, jumlah baris DB) yang dicatat pada kolom `Evidence` di matrix: 24 skenario putaran 1–2, 5 putaran 3, 6 putaran 4, dan 5 putaran 5. Delapan tangkapan layar tersedia di [`evidence/`](./evidence/). Pada paruh kedua sesi, tangkapan layar tambahan **tidak dapat diambil** karena jendela browser tidak terlihat oleh harness (`Screenshot needs a visible tab`); untuk kasus tersebut bukti berupa dump state/DB, bukan gambar — dicatat apa adanya alih-alih dilewati diam-diam.
3. **Race diuji dengan mengendalikan interleaving, bukan menunggu timing.** B6 hanya muncul bila entri masuk antrean saat `POST` lain masih berjalan. Alih-alih berharap jendela itu kebetulan terjadi, probe menahan `send` secara eksplisit sehingga urutan kejadiannya sama setiap kali dijalankan — regresi gagal deterministik, bukan "kadang lolos".
4. **Keterbatasan platform yang sudah diakui PRD.** Notifikasi saat browser benar-benar ditutup tidak diuji sebagai kegagalan karena memang di luar jaminan (tidak ada push server). Yang diverifikasi adalah alert saat tab hidup/background dan saat app dibuka kembali.
5. **Deviasi dari PRD yang diterima.** Bentuk error API mengikuti middleware repo (`{ error, details }` untuk 400 dan `{ success: false, error }` untuk 500), bukan `{ message }` seperti tertulis di PRD §Scope A; konsisten dengan `grocery`/`finance`, sehingga diperlakukan sebagai dokumentasi yang perlu dirapikan, bukan defect.

---

## 5. Pembersihan Data & Proses

| Item | Tindakan | Hasil |
|---|---|---|
| User fixture `qa-test-*` | Dihapus di teardown runner (dijalankan 5x: putaran awal, verifikasi D1, verifikasi B1–B3, verifikasi B4–B5, verifikasi B6–B7) | `qa_users = 0` |
| Sesi uji | Dihapus (termasuk `QA Past Due`, `QA Long Break`, `QA Offline`, `QA Verifikasi PK` dari putaran 3, `Catatan pribadi Juliet`, `Belum terkirim`, `Flush saat 401`, `Sesi saat token kedaluwarsa` dari putaran 4, serta `QA B7 Selesai`, `QA Queue Flush`, dan `Milik Romeo` dari putaran 5) | `qa_sessions = 0` |
| Sesi sementara 2025 untuk TC9-11 / TC4-8 | 1 baris disisipkan lalu dihapus setelah verifikasi | `DELETE` 1 baris, `juliet` kembali 66 |
| Data akun dev | Dipulihkan ke kondisi awal | `juliet = 66` sesi, `romeo = 0` sesi |
| Settings `juliet` | Diubah ke 30 saat menguji jalur simpan di `/settings`, lalu dikembalikan ke default | `25 / 5 / 15 / 4 / true` |
| `localStorage` browser | Semua kunci `pomodoro*` dibersihkan, termasuk slot per pemilik `pomodoro-active-timer:<userId>` dan antrean hasil seed, serta penanda `qa-keluar-clicked` dari putaran 4 | Tidak ada kunci `pomodoro*` tersisa |
| Dev server | API :5053 dihentikan sementara untuk skenario offline di putaran 1–4 lalu dinyalakan kembali. **Putaran 5 tidak menghentikan API**: skenario antrean diverifikasi dengan men-seed `pomodoro-pending-sessions` lalu me-reload halaman, sehingga jalur `flush` yang dipindah modul teruji tanpa mengganggu proses dev | Berjalan seperti sebelum pengujian |
| Tab browser sisa verifikasi | Ditutup setelah run selesai | Tidak ada proses tertinggal |
| Helper DB sementara (`tests/_qa-db.mjs`) | Dibuat untuk query verifikasi, dihapus setelah selesai | Bersih |
| Token QA sementara (`/tmp/qa-token.txt`) | Dihapus | Bersih |

---

## 6. Kesimpulan

**Verifikasi LULUS.** Seluruh 98 test case pada matrix berstatus Passed. Defect D1 (heatmap mengabaikan `year`) serta tujuh temuan blocking review (B1–B3 di backend, B4–B7 di klien) sudah diperbaiki dan diverifikasi ulang dengan bukti positif — bukan sekadar "tidak error": dua user benar-benar bisa memiliki UUID sesi yang sama, enam request paralel benar-benar semuanya 200 dengan tepat satu baris settings, respons 500 benar-benar tidak memuat nama tabel/constraint, sesi Juliet benar-benar terkirim atas namanya sendiri setelah Romeo memakai perangkat yang sama, sesi yang selesai tepat saat cookie dicabut benar-benar tidak hilang, dan — pada putaran ini — sesi yang masuk antrean **di tengah flush** benar-benar bertahan serta run fokus Juliet benar-benar **melanjutkan sisa waktunya** setelah Romeo memakai perangkat yang sama.

Perubahan skema (primary key komposit) juga diverifikasi ulang lewat alur tulis nyata di browser, karena lulusnya unit test belum menjamin jalur insert dari UI masih benar.

Tindak lanjut:

1. ~~Kembali ke **`/dev`** untuk memperbaiki D1~~ — **selesai**.
2. ~~Jalankan ulang **`/qa`**~~ — **selesai**: TC4-8 & TC9-11 `Passed`, matrix 83/83.
3. ~~Kembali ke **`/dev`** untuk memperbaiki B1/B2/B3 dari `/gate`~~ — **selesai**.
4. ~~Jalankan ulang **`/qa`** untuk memverifikasi B1/B2/B3~~ — **selesai**: TC13-1/13-2/13-3 `Passed`, matrix 86/86, runner 38/38.
5. ~~Kembali ke **`/dev`** untuk memperbaiki B4/B5 dari `/gate` pass 2~~ — **selesai**.
6. ~~Jalankan ulang **`/qa`** untuk memverifikasi B4/B5~~ — **selesai**: TC14-1 s/d TC14-7 `Passed`, matrix 93/93, `qa-web-runner.mjs` 25/25, `qa-api-runner.mjs` 38/38.
7. ~~Kembali ke **`/dev`** untuk memperbaiki B6/B7 dari `/gate` pass 3~~ — **selesai**.
8. ~~Jalankan ulang **`/qa`** untuk memverifikasi B6/B7~~ — **selesai**: TC15-1 s/d TC15-5 `Passed`, matrix 98/98, `pomodoro-state-probe.mts` 4/4, `qa-web-runner.mjs` 29/29, `qa-api-runner.mjs` 38/38.
9. Lanjut ke **`/gate`** pass 4 untuk code review lima axis & security review ulang (auth + isolasi data per user + penanganan error + kepemilikan state perangkat + konsistensi antrean).
