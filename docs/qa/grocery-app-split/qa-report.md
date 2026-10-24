# QA Verification Report — Pemisahan Grocery Menjadi App Sendiri (FE + BE)

- **Slug:** `grocery-app-split`
- **Tanggal Pengujian:** 2026-10-24 (putaran 1) · 2026-10-24 (putaran 2, setelah perbaikan `/gate`)
- **Tester:** OpenCode QA Agent
- **Target Stack:** Express API (`apps/grocery-tracker-api`, :5052), React Vite SPA (`apps/grocery-tracker-web`, :4042), `@repo/ui`, `@repo/types`, `@repo/tailwind-config`, habit app (`apps/habbit-tracker-api` :5051 / `apps/habbit-tracker-web` :4041)
- **Status Akhir:** ✅ **PASSED (49/49 test case)**

---

## 1. Ringkasan Eksekutif

Pengujian menyeluruh dilaksanakan terhadap hasil pemisahan domain grocery menjadi dua app monorepo mandiri beserta seluruh konsekuensinya: pelepasan modul grocery dari habit app, shim redirect `/grocery-list*`, shell layout baru berbasis `Sidebar` dari `@repo/ui`, serta penyesuaian infra (script root, `deploy.sh`, `nginx.conf`, `AGENTS.md`).

Pengujian berjalan **dua putaran**. Putaran 1 memverifikasi 45 test case dan menemukan dua defect yang langsung diperbaiki. `/gate` kemudian menemukan dua defect blocking tambahan (B1: routing produksi di subpath `/grocery/`; B2: IDOR lintas couple). Setelah `/dev` Fase 6b memperbaikinya, putaran 2 **memperluas matrix menjadi 49 test case** dan menjalankan ulang **seluruh** kasus — bukan hanya empat kasus baru.

Seluruh **49 test case** pada [Test Matrix](./test-matrix.md) berstatus **Passed**, tanpa kegagalan fungsional dan tanpa sisa data uji di database.

### Rekapitulasi Metrik Pengujian

| Metrik | Nilai | Target / Syarat | Status |
|---|---|---|---|
| **Total Test Case** | 49 | 49 | 100% Tercakup |
| **Passed** | 49 | 49 | 100% Lolos |
| **Failed** | 0 | 0 | 0 Cacat |
| **Skip** | 0 | 0 | — |
| **Automated Verification** | 37 (75,51%) | > 24% | Memenuhi Syarat |
| **Teardown Cleanliness** | 100% bersih | Zero leftover test data | Berhasil dibersihkan |

### Runner otomatis yang dipakai

| Runner | Cakupan | Hasil |
|---|---|---|
| `apps/grocery-tracker-api/tests/qa-api-runner.mjs` | 17 test HTTP nyata (health, auth, CRUD, scoping pasangan, otorisasi lintas couple, migrasi, seed, clear-completed) | **17 passed, 0 failed, 0 skipped** |
| `apps/grocery-tracker-web/tests/qa-web-runner.mjs` | 19 test struktural/konfigurasi (shell, nav, switcher, tema, tanpa fallback localStorage, shim, script, nginx, build base, basepath router, dokumentasi) | **19 passed, 0 failed** |
| Browser E2E (agent browser) | 15 skenario alur nyata (sesi, redirect, checklist, manage, settings, shim, switcher, error handling, subpath produksi) | **15/15 sesuai expected result** |

---

## 2. Rincian Pengujian per Product Backlog (PB)

### PB-1: Backend grocery mandiri — `apps/grocery-tracker-api` (TC1-1 s/d TC4-2, 16 TC)

- **TC1-1**: `GET /health` merespons `{"status":"ok","service":"grocery-tracker-api"}`.
- **TC1-2**: Endpoint grocery dan `/api/auth/me` menolak request tanpa cookie `token` dengan HTTP 401.
- **TC1-3**: Cookie hasil login habit API (`POST http://localhost:5051/api/auth/login`) diterima grocery API → `GET /api/grocery` 200. Membuktikan `JWT_SECRET` identik antar service.
- **TC1-4**: `GET /api/auth/me` mengembalikan profil user termasuk `partner_id`.
- **TC1-5**: `POST /api/auth/logout` menghapus cookie dengan `Path=/` dan `SameSite=Lax`.
- **TC2-1 s/d TC2-6**: Kontrak CRUD dipertahankan — create (item + `user_id`/`partner_id`), validasi payload tanpa `name` → 400, update nama & estimasi harga, toggle dengan `completed_by`/`completed_at`, `clear-completed` (`deletedCount >= 1`), dan delete. **`TC2-5` dijalankan nyata pada putaran 2** (bukan skip): baris dev `CACA` disimpan sementara agar daftar hanya berisi data QA, lalu dipulihkan persis.
- **TC3-1**: Scoping pasangan terverifikasi dua akun — item buatan `romeo` muncul di daftar `juliet` dengan `creator_name` benar.
- **TC3-2** *(baru, penutup review B2)*: User di luar couple ditolak `PUT` / `PATCH toggle` / `DELETE` dengan **HTTP 404** (bukan 403, agar keberadaan item tidak bocor); item tetap utuh dan tidak muncul di daftar outsider. **Diverifikasi negatif:** dengan predikat lama, test gagal `PUT oleh stranger expected 404, got 200`; setelah predikat benar, hijau.
- **TC3-3** *(baru, penutup review B2)*: Dua user tanpa pasangan (`partner_id = null`) tidak saling menyentuh item — menangkap bug `null === null` yang sempat muncul saat implementasi. Owner tetap bisa `PUT` item miliknya (positive control), membuktikan test tidak vacuous.
- **TC4-1**: `002-grocery-schema.sql` dijalankan dua kali berturut-turut tanpa error (idempoten).
- **TC4-2**: Seeder grocery dev-only; jumlah baris `users` tetap 2 sebelum/sesudah seed (tabel `users` tidak disentuh).

### PB-2: Frontend grocery mandiri & shell layout — `apps/grocery-tracker-web` (TC5-1 s/d TC10-2, 18 TC)

- **TC5-1**: Membuka `http://localhost:4042/` dengan cookie habit langsung masuk halaman "Daftar Belanja" — tanpa `input[type=password]`, kartu profil menampilkan `Romeo`.
- **TC5-2**: Tanpa sesi, `/manage` dialihkan ke `http://localhost:4041/login?returnTo=http%3A%2F%2Flocalhost%3A4042%2Fmanage`; setelah login kembali ke `http://localhost:4042/manage`. **Temuan & perbaikan selama QA — lihat §3.1.** Diverifikasi ulang penuh pada putaran 2.
- **TC6-1**: Sidebar `@repo/ui` dengan 3 menu; tepat satu menu aktif per halaman (`/` → Daftar Belanja, `/manage` → Belanja, `/settings` → Pengaturan).
- **TC6-2**: Bottom nav `nav.md:hidden.fixed.bottom-0` memuat 3 menu yang sama; `display: none` pada viewport 1000px (mobile-only).
- **TC6-3**: App switcher memuat 4 kartu — Habit Pasutri (aktif), Grocery List (highlight + ikon check), Keuangan Pasutri, Jadwal & Kencan ("Segera Hadir", non-klik).
- **TC6-4**: 4 pilihan tema; memilih `Duo Green` mengubah `data-theme="Duo"` dan `localStorage.theme`, tetap tersimpan setelah reload.
- **TC7-1**: Ringkasan "X dari Y barang terbeli", 8 filter kategori (Semua + 7), dan penyaringan daftar per kategori bekerja (kategori tanpa item → daftar kosong).
- **TC7-2**: Quick add mengirim `POST /api/grocery`, input ter-reset, counter "Perlu Dibeli" bertambah.
- **TC7-3**: Klik kartu item mengirim `PATCH /api/grocery/:id/toggle`; "Sudah Dibeli" bertambah, ringkasan menjadi "2 dari 3 barang terbeli", dan item tampil `line-through`.
- **TC8-1 s/d TC8-4**: Form tambah item lengkap (nama, jumlah, satuan, kategori, estimasi harga, urgensi) tersimpan dan form ter-reset; dialog edit mengirim `PUT` dan nama berubah; hapus mengirim `DELETE` dan daftar berkurang; `Bersihkan Selesai` mengirim `POST /clear-completed` dan **hanya** menghapus item selesai (item belum selesai milik user tetap ada).
- **TC9-1**: Tombol salin memanggil `navigator.clipboard.writeText` (isi teks terverifikasi), label berubah "Tersalin!" + toast.
- **TC9-2**: `Reset Semua Centang` mengembalikan item selesai ke belum selesai (dipastikan dari `GET /api/grocery`: `is_completed` `true` → `false`).
- **TC9-3**: Dialog konfirmasi hapus-semua tampil dengan opsi Batal / "YA, HAPUS SEMUA"; konfirmasi mengosongkan daftar.
- **TC10-1**: Dengan grocery API dimatikan, full reload tidak menampilkan data palsu (pengecekan sesi gagal → dialihkan ke login habit), dan aksi mutasi memunculkan pesan error nyata (`Request failed with status code 500`). Tidak ada fallback diam-diam.
- **TC10-2**: `localStorage` tidak pernah menyimpan data item; satu-satunya key adalah `theme`.

### PB-3: Pembersihan habit app & shim redirect (TC11-1 s/d TC12-3, 6 TC)

- **TC11-1**: `http://localhost:4041/grocery-list` → `http://localhost:4042/`.
- **TC11-2**: `/grocery-list/manage` → `/manage` (4042) dan `/grocery-list/settings` → `/settings` (4042).
- **TC11-3**: `/grocery-list/whatever` → `http://localhost:4042/whatever` (bukan 404 habit).
- **TC12-1**: Sidebar habit 5 menu (Beranda, Goals, Habit, Aktivitas, Pengaturan); bottom nav 5 target (4 berlabel + 1 FAB ikon-saja `to="/habits"`); tidak ada grocery di DOM maupun route/service tersisa.
- **TC12-2**: Kartu Grocery List di switcher habit bertanda external dan mengarahkan tab ke `http://localhost:4042/`.
- **TC12-3**: `GET http://localhost:5051/api/grocery` tidak lagi dilayani (bukan 200 berisi `{ items }`).

### PB-4: Infra, deploy, dan dokumentasi (TC13-1 s/d TC15-1, 9 TC)

- **TC13-1**: Script root `db:migrate:grocery` & `db:seed:grocery` memfilter `@repo/grocery-tracker-api`; kedua package grocery punya script `dev/build/start/db:migrate/db:seed/check-types/lint`.
- **TC13-2**: API di 5052, web di 4042, proxy dev `/api` meneruskan ke 5052.
- **TC13-3**: `scripts/deploy.sh` lolos `bash -n`, mengirim `apps/grocery-tracker-{api,web}/dist`, dan mendaftarkan PM2 `grocery-backend`.
- **TC14-1**: `nginx.conf` merutekan `/api/grocery/` → `127.0.0.1:5052` dan `^~ /grocery/` → build FE grocery dengan fallback `index.html`.
- **TC14-2**: Hasil `pnpm build` mereferensikan `/grocery/assets/...`; `manifest.webmanifest` memakai `start_url` dan `scope` `/grocery/`.
- **TC14-3**: `AGENTS.md` memuat kedua app grocery, port 5052/4042, catatan `JWT_SECRET` identik, shim redirect, dan script grocery.
- **TC14-4** *(baru, penutup review B1)*: `createRouter` memakai `basepath` turunan `import.meta.env.BASE_URL`; hasil build mengandung `basepath:"/grocery/"`.
- **TC14-5** *(baru, penutup review B1)*: Build produksi disajikan di subpath `/grocery/` (meniru `location ^~ /grocery/` + `try_files`) merender ketiga route dengan benar — `/grocery/` → "Daftar Belanja", `/grocery/manage` → "Kelola Belanjaan", `/grocery/settings` → "Pengaturan Grocery List" — dan seluruh `href` menu berawalan `/grocery/`. **Diverifikasi negatif:** tanpa `basepath`, ketiga route berakhir "Not Found".
- **TC15-1**: `pnpm check-types` 7/7, `pnpm lint` 7/7 (0 error), `pnpm build` 6/6 sukses.

---

## 3. Temuan Selama QA

### 3.1 [BLOCKING → SUDAH DIPERBAIKI, putaran 1] Origin grocery tidak ada di allowlist redirect habit API

- **Gejala:** setelah logout, membuka `http://localhost:4042/manage` memang dialihkan ke `http://localhost:4041/login?returnTo=...`, tetapi setelah login user mendarat di dashboard habit (`/`), bukan kembali ke grocery. Respons login mengembalikan `redirectTo: null`.
- **Akar masalah:** `resolveRedirectTarget()` hanya menerima origin yang terdaftar di `ALLOWED_REDIRECT_ORIGINS`. Nilai di `apps/habbit-tracker-api/.env` dan `.env.example` hanya memuat `http://localhost:4040` (finance), origin baru `http://localhost:4042` belum ditambahkan.
- **Perbaikan:** `ALLOWED_REDIRECT_ORIGINS=http://localhost:4040,http://localhost:4042` pada `.env` (dev lokal) dan `.env.example` (komit).
- **Verifikasi ulang:** putaran 2 mengulang alur penuh — `POST /api/auth/logout` 200 → reload `/manage` mendarat di login dengan `returnTo` benar → login `romeo` kembali ke "Kelola Belanjaan". Proteksi open-redirect tetap utuh.

### 3.2 [LOW → SUDAH DIPERBAIKI, putaran 1] Teks notifikasi login selalu menyebut "Keuangan Pasutri"

- **Gejala:** saat kembali ke app grocery, halaman login habit menampilkan "Setelah masuk, kamu akan diarahkan kembali ke aplikasi Keuangan Pasutri."
- **Perbaikan:** `apps/habbit-tracker-web/src/routes/login.tsx` menurunkan nama app tujuan dari origin `returnTo` menggunakan `VITE_GROCERY_APP_URL` / `VITE_FINANCE_APP_URL`, dengan fallback generik.
- **Verifikasi ulang:** putaran 2 mengonfirmasi teks "…aplikasi Grocery List." saat `returnTo` menunjuk 4042.

### 3.3 [BLOCKING → SUDAH DIPERBAIKI, putaran 2] Dua defect dari `/gate`

Detail lengkap ada di [`review-report.md`](./review-report.md). Ringkasnya:

| ID | Defect | Perbaikan | Bukti QA |
|---|---|---|---|
| **B1** | Router tidak memakai `basepath`, sehingga build produksi di `/grocery/` menampilkan "Not Found" di semua route | `basepath: import.meta.env.BASE_URL.replace(/\/$/, "")` pada `createRouter` | **TC14-4** (runner statis) + **TC14-5** (render nyata ketiga route di subpath, `href` menu berawalan `/grocery/`) |
| **B2** | IDOR: user di luar couple bisa `PUT`/`toggle`/`DELETE` item couple lain (200, bukan 404) | Helper `isOwnedByCouple()` + `findOwnedItem()` diterapkan pada update/toggle/delete, dengan guard `if (partnerId)` agar `null === null` tidak lolos | **TC3-2** (outsider → 404, data utuh) + **TC3-3** (dua user tanpa pasangan) |

Keduanya diverifikasi **negatif** — dengan kode lama, test yang sama gagal — sehingga bukan test vacuous.

### 3.4 Catatan non-blocking (tidak diperbaiki, di luar scope)

1. Saat grocery API mati total, pengecekan sesi (`/api/auth/me`) tidak punya timeout sehingga halaman bertahan di status "Memeriksa sesi login..." sebelum akhirnya dialihkan. Tidak menampilkan data palsu, tetapi UX-nya bisa diperbaiki dengan timeout + pesan eksplisit.
2. Tombol ikon (edit/hapus) pada kartu item di `/manage` punya `title` tapi belum `aria-label`, sehingga accessible name-nya bergantung pada `title`. Di luar scope plan ini (a11y audit tersendiri).

---

## 4. Catatan Lingkungan & Metodologi

1. **Screenshot tidak tersedia.** Environment agent tidak menyediakan desktop/tab yang bisa di-capture (`browser.screenshot` gagal). Seluruh bukti E2E dicatat sebagai hasil assertion DOM/teks/URL/status HTTP pada kolom `Evidence`, bukan berkas gambar.
2. **Viewport tidak bisa di-resize.** Verifikasi mobile (TC6-2) dilakukan lewat struktur DOM + `getComputedStyle` (elemen `md:hidden` dengan `display: none` pada lebar 1000px), bukan screenshot mobile.
3. **Uji destruktif dengan pemulihan data.** `clear-completed` (TC2-5, TC8-4), reset centang (TC9-2), dan hapus-semua (TC9-3) menimpa data dev milik user (`CACA`). Data user disimpan lengkap sebelum uji (id, kategori, quantity, unit, `completed_by`, `completed_at`, `created_at`, `updated_at`) dan dikembalikan persis. Pada putaran 2 `CACA` dihapus sementara agar `TC2-5` benar-benar dieksekusi (bukan skip), lalu dipulihkan dengan `id` dan `completed_at` identik.
4. **Dev server.** Kelima app dijalankan via filter pnpm per app. Proses `grocery-tracker-api` di-restart terpisah saat pengujian kegagalan API.
5. **Build produksi.** `dist` grocery disajikan oleh server statis sementara di port 4043 yang meniru `location ^~ /grocery/` + `try_files $uri $uri/ /grocery/index.html`, dengan respons `/api` palsu agar sesi lolos dan UI benar-benar ter-render.
6. **Teardown.** Semua data uji ber-tag `qa-test-*` dihapus. Status akhir database diverifikasi: hanya `CACA` (selesai) + 2 baris `users`, 0 user `qa-test-*`. Seluruh proses dev (4041, 4042, 4043, 5051, 5052) dihentikan dan port kembali bebas.

---

## 5. Kesimpulan

Implementasi pemisahan grocery menjadi `apps/grocery-tracker-api` + `apps/grocery-tracker-web` **memenuhi seluruh requirement** pada `docs/prd/todo/grocery-app-split/PRD.md` dan checklist `ISSUES.md` (kecuali item review `/gate` yang memang menjadi tahap berikutnya).

Empat defect ditemukan dan diperbaiki selama siklus ini: dua pada putaran QA pertama (satu di antaranya memutus alur redirect-balik-ke-grocery setelah login), dua lagi dari `/gate` (routing subpath produksi dan IDOR lintas couple). Keempatnya kini tertutup oleh test regresi yang sudah dibuktikan gagal pada kode lama. Gate kualitas monorepo (type-check, lint, build) lulus penuh.

**Rekomendasi:** plan siap ditutup. `/gate` putaran 2 memberi verdict **Approve with comments** (0 blocking) — lihat [`review-report.md`](./review-report.md). Temuan non-blocking pada §3.4 layak dicatat sebagai backlog perbaikan terpisah.
