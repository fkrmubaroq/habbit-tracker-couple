# Test Matrix — Form Transaksi Halaman Luar (/transactions/create) & Masking Nominal

| PROGRAM VERSION RELEASE | 1.0.0 | TESTER | OpenCode QA Agent | TEST CASE CREATED AT | 2026-10-24 |
|---|---|---|---|---|---|
| FOLDER TEST APP | apps/finance-tracker-web | PROGRAMMER | OpenCode Dev Agent | TEST CASE UPDATED AT | 2026-10-24 |
| IP DEV | http://localhost:4040 | TASK DEV | docs/prd/done/inline-transaction-form/ISSUES.md | | |
| IP PROD | - | | | | |

**Sumber requirement:** docs/prd/done/inline-transaction-form/PRD.md, docs/prd/done/inline-transaction-form/ISSUES.md
**Scope:** Route mandiri `/transactions/create` beserta form inline, pengalihan seluruh tombol pencatatan ke route tersebut, penghapusan `TransactionFormDialog` + state modal di store, dan masking ribuan pada input nominal
**Out of scope:** Perubahan skema/endpoint backend finance, dialog modal modul lain (hapus kategori, anggaran, aset/liabilitas), fitur edit transaksi di halaman terpisah

## Summary

Hitung ulang dari kolom `Status`/`Automation Tools` di tabel Test Cases
setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| 24 | 24 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 21 | 0 | 21 | 3 | 87.50% | Memenuhi Syarat |

`Memenuhi Syarat` bila `Presentase` > 24% (rumus sheet V4).

**Runner otomatis:** `apps/finance-tracker-web/tests/qa-inline-form-runner.mjs` (19 test) + `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` (39 test).

## Test Cases

### PB-1 — Route /transactions/create & form inline

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Route `/transactions/create` menampilkan form inline tanpa overlay modal | [x] | TC1-1 |
| 2 | Form memuat field tipe, nominal, kategori, tanggal, deskripsi, dan catatan | [x] | TC1-2 |
| 3 | Simpan transaksi pengeluaran berhasil dan kembali ke `/transactions` | [x] | TC2-1 |
| 4 | Simpan transaksi pemasukan berhasil, memicu confetti, dan kembali | [x] | TC2-2 |
| 5 | Validasi menolak nominal/deskripsi kosong tanpa memanggil API | [x] | TC2-3 |
| 6 | Mengganti tipe transaksi memfilter daftar kategori | [x] | TC2-4 |
| 7 | Tombol "Batal" kembali ke `/transactions` tanpa menyimpan | [x] | TC3-1 |
| 8 | Tautan "Kembali ke Riwayat" kembali ke `/transactions` | [x] | TC3-2 |
| 9 | URL dapat diakses langsung (deep link) tanpa state modal | [x] | TC3-3 |
| 10 | Nominal berformat ribuan saat diketik (`80000` → `80.000`) | [x] | TC4-1 |
| 11 | Nilai `amount` yang dikirim ke API tetap number digit murni | [x] | TC4-2 |
| 12 | Input nominal dikosongkan menjadi `undefined`, bukan `NaN`/`0` | [x] | TC4-3 |
| 13 | Karakter non-digit diabaikan pada input nominal | [x] | TC4-4 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Halaman Form Transaksi | | + | TC1-1 | akses route | Verifikasi route form tampil tanpa modal | `/transactions/create` merender form inline penuh halaman | Login aktif di finance app, dev server 4040 jalan | Buka `http://localhost:4040/transactions/create` | 1. Login lewat habit app<br>2. Buka `/transactions/create`<br>3. Amati halaman | 1. Judul "Catat Transaksi Baru" tampil<br>2. Card form tampil di tengah, tanpa overlay/dialog<br>3. Tidak ada tombol close (X) modal | Passed | browser:assert | Browser: judul "Catat Transaksi Baru" tampil, `[role=dialog]` = 0 (tanpa overlay) | Tanpa Automation | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 1 |
| 1 | Halaman Form Transaksi | | + | TC1-2 | kelengkapan field | Verifikasi seluruh field form | Form memuat 6 field yang dijanjikan PRD | Buka `/transactions/create` | Lihat area form | 1. Periksa urutan field dari atas<br>2. Cek tipe input masing-masing | 1. Toggle Jenis Transaksi, Nominal (Rp), Kategori, Tanggal, Deskripsi, Catatan Tambahan<br>2. Nominal `inputMode="numeric"`, tanggal `type="date"`, kategori memakai Select, catatan memakai Textarea | Passed | browser:assert | Diverifikasi lewat browser: 3 `input` (nominal `inputmode=numeric`, tanggal `type=date`, deskripsi) + 1 `textarea` + 1 Select kategori | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 1 |
| 2 | Simpan Transaksi | | + | TC2-1 | pengeluaran valid | Verifikasi simpan pengeluaran | Transaksi pengeluaran tersimpan dan halaman kembali | Buka `/transactions/create`, kategori pengeluaran tersedia | Nominal `25000`, deskripsi `qa-test-expense-<timestamp>`, tanggal hari ini | 1. Pastikan toggle di "Pengeluaran"<br>2. Isi nominal dan deskripsi<br>3. Klik "Simpan Transaksi"<br>4. Amati halaman dan baris teratas riwayat | 1. Tombol berubah "Menyimpan..." saat proses<br>2. Diarahkan ke `/transactions`<br>3. Transaksi baru muncul di riwayat dengan nominal Rp 25.000 | Passed | browser:assert | Browser: `POST /api/transactions` 200, diarahkan ke `/transactions`, baris `qa-test-expense-<timestamp>` muncul di riwayat. Data QA dihapus setelah uji (DELETE 200) | Tanpa Automation | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 2 & 3 |
| 2 | Simpan Transaksi | | + | TC2-2 | pemasukan valid | Verifikasi simpan pemasukan + confetti | Transaksi pemasukan tersimpan dan memicu animasi | Buka `/transactions/create` | Nominal `100000`, deskripsi `qa-test-income-<timestamp>` | 1. Klik toggle "Pemasukan"<br>2. Isi nominal dan deskripsi<br>3. Klik "Simpan Transaksi"<br>4. Amati animasi sebelum pindah halaman | 1. Kategori berganti ke daftar pemasukan<br>2. Konfeti muncul singkat<br>3. Diarahkan ke `/transactions` dan transaksi pemasukan tercatat | Passed | browser:assert | Browser: kategori berganti ke daftar pemasukan, `POST /api/transactions` 200, diarahkan ke `/transactions`, transaksi tampil di riwayat. Konfeti dipanggil di handler (`canvas-confetti`) tetapi canvas-nya dibersihkan setelah animasi sehingga tidak tertangkap snapshot DOM; verifikasi visual tidak tersedia tanpa desktop. Data QA dihapus setelah uji | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Design Decision 4 |
| 2 | Simpan Transaksi | | - | TC2-3 | validasi kosong | Verifikasi validasi form | Submit tanpa nominal/deskripsi ditolak di klien | Buka `/transactions/create` | Nominal kosong, deskripsi kosong | 1. Biarkan nominal & deskripsi kosong<br>2. Klik "Simpan Transaksi"<br>3. Amati pesan error dan jaringan | 1. Pesan error merah muncul di bawah field nominal dan deskripsi<br>2. Tidak ada request `POST /api/transactions`<br>3. Tetap di halaman yang sama | Passed | browser:assert | Browser: pesan "Jumlah transaksi harus diisi" tampil, 0 request `POST /api/transactions`, tetap di halaman form | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx`, `packages/types/src/finance.ts` | PRD Success Criteria 1 |
| 2 | Simpan Transaksi | | + | TC2-4 | filter kategori per tipe | Verifikasi kategori mengikuti tipe | Daftar kategori berubah saat tipe diganti | Buka `/transactions/create` | Toggle Pengeluaran ↔ Pemasukan | 1. Buka dropdown Kategori saat tipe Pengeluaran<br>2. Tutup, ganti ke Pemasukan<br>3. Buka dropdown Kategori lagi | 1. Hanya kategori bertipe pengeluaran tampil<br>2. Tipe berganti dan kategori default di-reset ke kategori pemasukan pertama<br>3. Hanya kategori pemasukan tampil | Passed | browser:assert | Browser: kategori pengeluaran (Belanja & Kebutuhan … Transportasi) berganti ke kategori pemasukan (Bisnis, Bonus, Dividen & Investasi, Freelance, Gaji, Lainnya) saat toggle diganti | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 1 |
| 3 | Navigasi Keluar Form | | + | TC3-1 | tombol Batal | Verifikasi batal tanpa menyimpan | Tombol "Batal" kembali tanpa membuat transaksi | Buka `/transactions/create`, isi sebagian field | Nominal `50000`, deskripsi `qa-test-cancel` | 1. Isi nominal dan deskripsi<br>2. Klik "Batal"<br>3. Cari `qa-test-cancel` di riwayat | 1. Kembali ke `/transactions`<br>2. Tidak ada transaksi baru dengan deskripsi tersebut | Passed | browser:assert | Browser: field terisi (`50.000`, `qa-test-cancel`), klik Batal → `/transactions`, 0 request POST, transaksi tidak muncul di riwayat | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 2 |
| 3 | Navigasi Keluar Form | | + | TC3-2 | tautan kembali | Verifikasi tautan "Kembali ke Riwayat" | Tautan atas kembali ke daftar transaksi | Buka `/transactions/create` | Klik tautan "Kembali ke Riwayat" | 1. Klik tautan di kiri atas<br>2. Amati URL | 1. URL menjadi `/transactions`<br>2. Halaman riwayat transaksi tampil | Passed | browser:assert | Browser: tautan "Kembali ke Riwayat" → `/transactions` | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Scope 2 |
| 3 | Navigasi Keluar Form | | + | TC3-3 | deep link | Verifikasi akses langsung URL | Route bisa dibuka langsung tanpa state global | Login aktif, tidak pernah membuka modal | Paste `http://localhost:4040/transactions/create` di address bar | 1. Paste URL lalu Enter<br>2. Reload halaman sekali | 1. Form tampil penuh tanpa modal<br>2. Setelah reload form tetap tampil (tidak bergantung store) | Passed | browser:assert | Browser: URL langsung + reload tetap menampilkan form, `[role=dialog]` = 0 (tidak bergantung state store) | Tanpa Automation | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD Design Decision 1 |
| 4 | Masking Nominal | | + | TC4-1 | format ribuan | Verifikasi tampilan pemisah ribuan | Input menampilkan titik ribuan saat diketik | Buka `/transactions/create` | Ketik `80000` pada field Nominal | 1. Klik field Nominal<br>2. Ketik `80000` karakter demi karakter | 1. Field menampilkan `80.000`<br>2. Prefix `Rp` tetap di kiri<br>3. Kursor tidak meloncat ke awal | Passed | browser:assert | Browser: nilai field bertahap `8` → `80` → `800` → `8.000` → `80.000` | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | PRD / ISSUES Fase 5 |
| 4 | Masking Nominal | | + | TC4-2 | nilai payload | Verifikasi nilai tersimpan berupa digit | `amount` yang dikirim ke API berupa number tanpa titik | Buka `/transactions/create` | Nominal `80.000` di layar, deskripsi `qa-test-mask-<timestamp>` | 1. Isi nominal hingga tampil `80.000`<br>2. Simpan transaksi<br>3. Periksa payload `POST /api/transactions` | 1. Payload berisi `"amount": 80000` (number)<br>2. Tidak ada string `"80.000"`<br>3. Validasi `createTransactionSchema` lolos | Passed | test:finance-inline | Dicek via runner statis + browser | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | ISSUES Fase 5 |
| 4 | Masking Nominal | | - | TC4-3 | input dikosongkan | Verifikasi nilai kosong aman | Menghapus seluruh digit membuat `amount` undefined | Buka `/transactions/create` | Ketik `80000` lalu hapus semua | 1. Ketik `80000`<br>2. Tekan Backspace sampai kosong<br>3. Submit form | 1. Field kosong (bukan `0`)<br>2. Muncul pesan validasi nominal wajib, bukan error `NaN`<br>3. Tidak ada request API terkirim | Passed | browser:assert | Browser: field menjadi string kosong `''` (bukan `0`), submit memunculkan "Jumlah transaksi harus diisi" dan 0 request `POST /api/transactions` | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | ISSUES Fase 5 |
| 4 | Masking Nominal | | - | TC4-4 | karakter non-digit | Verifikasi sanitasi input | Huruf dan simbol tidak masuk ke nilai nominal | Buka `/transactions/create` | Ketik `12abc.000` | 1. Ketik `12abc.000` pada field Nominal<br>2. Periksa nilai field | 1. Field menampilkan `12.000`<br>2. Huruf `abc` dan titik manual diabaikan<br>3. Tidak ada karakter non-digit tersimpan | Passed | test:finance-inline | Dicek via runner statis + browser | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions_.create.tsx` | ISSUES Fase 5 |

### PB-2 — Navigasi tombol ke route baru

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Tombol `+ Transaksi` di sidebar desktop menuju `/transactions/create` | [x] | TC5-1 |
| 2 | Tombol `Catat` di header mobile menuju `/transactions/create` | [x] | TC5-2 |
| 3 | Tombol `+ Transaksi Baru` dan tombol empty state di halaman riwayat menuju route yang sama | [x] | TC5-3 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | Tombol Navigasi | | + | TC5-1 | sidebar desktop | Verifikasi tombol sidebar | Tombol `+ Transaksi` membuka form, bukan modal | Login aktif, viewport desktop | Klik tombol `+ Transaksi` di sidebar | 1. Buka `/transactions`<br>2. Klik tombol `+ Transaksi` di sidebar<br>3. Amati URL dan halaman | 1. URL menjadi `/transactions/create`<br>2. Form halaman penuh tampil<br>3. Tidak ada overlay modal | Passed | test:finance-inline | Dicek via runner statis + browser | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/__root.tsx` | PRD Scope 2 |
| 5 | Tombol Navigasi | | + | TC5-2 | header mobile | Verifikasi tombol header mobile | Tombol `Catat` di mobile membuka route form | Login aktif, viewport 390x844 | Klik tombol `Catat` di header | 1. Set viewport mobile<br>2. Buka `/`<br>3. Klik `Catat` | 1. URL menjadi `/transactions/create`<br>2. Form tampil tanpa sidebar (mode mobile) | Passed | test:finance-inline | Anchor `Catat` → `/transactions/create` ada dan klik-nya membuka form. Environment ini tidak menyediakan kontrol resize viewport, jadi tampilan mobile diverifikasi struktural (kelas `md:hidden`), bukan screenshot | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/__root.tsx` | PRD Scope 2 |
| 5 | Tombol Navigasi | | + | TC5-3 | halaman riwayat | Verifikasi tombol riwayat & empty state | Kedua tombol di halaman riwayat membuka route form | Login aktif, filter riwayat dibuat kosong untuk melihat empty state | Klik `+ Transaksi Baru` dan tombol pada empty state | 1. Buka `/transactions`, klik `+ Transaksi Baru`<br>2. Kembali, kosongkan filter sampai empty state tampil<br>3. Klik tombol pada empty state | 1. Keduanya menuju `/transactions/create`<br>2. Tidak ada dialog overlay yang terbuka | Passed | test:finance-inline | Dicek via runner statis + browser | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/transactions.tsx` | PRD Scope 2 |

### PB-3 — Pembersihan modal & store

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | File `TransactionFormDialog.tsx` sudah dihapus | [x] | TC6-1 |
| 2 | `__root.tsx` tidak lagi merender `TransactionFormDialog` | [x] | TC6-2 |
| 3 | Store `finance-ui.store.ts` bersih dari state/action modal transaksi | [x] | TC6-3 |
| 4 | Tidak ada sisa referensi modal transaksi di seluruh app finance | [x] | TC6-4 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Pembersihan Modal | | + | TC6-1 | file modal | Verifikasi file modal terhapus | `TransactionFormDialog.tsx` tidak ada di repo | Repo ter-update | Path `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx` | 1. Cek keberadaan file<br>2. Cek `git status` untuk status deleted | 1. File tidak ditemukan<br>2. Status penghapusan tercatat di git | Passed | test:finance-inline | Dicek via runner statis | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/components/TransactionFormDialog.tsx` | PRD Scope 3 |
| 6 | Pembersihan Modal | | - | TC6-2 | render modal | Verifikasi root tidak merender modal | `__root.tsx` bersih dari `TransactionFormDialog` | Repo ter-update | Baca `apps/finance-tracker-web/src/routes/__root.tsx` | 1. Grep `TransactionFormDialog`<br>2. Grep `isTransactionModalOpen` | 1. Tidak ada hasil<br>2. Tidak ada hasil | Passed | test:finance-inline | Dicek via runner statis | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/routes/__root.tsx` | PRD Scope 3 |
| 6 | Pembersihan Modal | | - | TC6-3 | state store | Verifikasi store bersih | `finance-ui.store.ts` tidak menyimpan state modal transaksi | Repo ter-update | Baca `apps/finance-tracker-web/src/stores/finance-ui.store.ts` | 1. Grep `isTransactionModalOpen`<br>2. Grep action `openTransactionModal`/`closeTransactionModal`<br>3. Cek `check-types` | 1. Tidak ada field state modal transaksi<br>2. Tidak ada action terkait<br>3. Type-check lulus | Passed | test:finance-inline | Dicek via runner statis | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src/stores/finance-ui.store.ts` | PRD Scope 3 |
| 6 | Pembersihan Modal | | - | TC6-4 | sisa referensi | Verifikasi tidak ada sisa referensi | Tidak ada import/nama modal transaksi tersisa | Repo ter-update | Grep seluruh `apps/finance-tracker-web/src` | 1. Grep `TransactionFormDialog`<br>2. Grep `TransactionModal`<br>3. Grep `isTransactionModalOpen` | 1. Tidak ada hasil di src<br>2. Tidak ada hasil di src<br>3. Tidak ada hasil di src | Passed | test:finance-inline | Dicek via runner statis | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/src` | PRD Scope 3 |

### PB-4 — Quality gates

Mini traceability khusus PB ini:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | Type-check monorepo lulus | [x] | TC7-1 |
| 2 | Lint monorepo lulus tanpa error | [x] | TC7-2 |
| 3 | Build monorepo lulus | [x] | TC7-3 |
| 4 | Runner QA UI components diperbarui dan lulus | [x] | TC7-4 |

| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Quality Gates | | + | TC7-1 | type-check | Verifikasi type-check | `pnpm check-types` lulus di seluruh workspace | Perubahan selesai | `pnpm check-types` | 1. Jalankan perintah<br>2. Periksa exit code | 1. Semua package sukses<br>2. Exit code 0 | Passed | test:finance-inline | Dijalankan via runner statis | Masuk Test Step | 2026-10-24 | `package.json` | PRD Success Criteria 5 |
| 7 | Quality Gates | | + | TC7-2 | lint | Verifikasi lint | `pnpm lint` tanpa error | Perubahan selesai | `pnpm lint` | 1. Jalankan perintah<br>2. Periksa ringkasan | 1. Semua package sukses<br>2. 0 error (warning pre-existing boleh ada) | Passed | test:finance-inline | Dijalankan via runner statis | Masuk Test Step | 2026-10-24 | `package.json` | PRD Success Criteria 5 |
| 7 | Quality Gates | | + | TC7-3 | build | Verifikasi build | `pnpm build` lulus | Perubahan selesai | `pnpm build` | 1. Jalankan perintah<br>2. Periksa output | 1. Semua app ter-build<br>2. Exit code 0 | Passed | test:finance-inline | Dijalankan via runner statis | Masuk Test Step | 2026-10-24 | `package.json` | PRD Success Criteria 5 |
| 7 | Quality Gates | | + | TC7-4 | runner QA | Verifikasi runner QA UI | Runner lama menyesuaikan penghapusan modal dan memvalidasi route baru | Dependensi ter-install | `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` | 1. Jalankan runner<br>2. Periksa hasil | 1. Semua test PASSED<br>2. Exit code 0 dan tidak ada assertion tentang `TransactionFormDialog` | Passed | test:finance-inline | Dijalankan via runner statis | Masuk Test Step | 2026-10-24 | `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` | ISSUES Fase 3 |
