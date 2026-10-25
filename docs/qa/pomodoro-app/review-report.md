# Review Report — Pomodoro Tracker (Mini App Personal)

- **Slug:** `pomodoro-app`
- **Tanggal Review:** 2026-10-25 (pass 1–3), 2026-10-26 (pass 4)
- **Reviewer:** opencode REVIEW stage (`/gate`)
- **Metodologi:** `code-review-and-quality` (lima axis) + `security-review`
- **Sumber requirement:** `docs/prd/todo/pomodoro-app/PRD.md`, `docs/prd/todo/pomodoro-app/ISSUES.md`
- **Prasyarat verifikasi:** `docs/qa/pomodoro-app/qa-report.md` — status **PASSED** (98/98; butir verifikasi `/qa` di `ISSUES.md` sudah tercentang)
- **Pass:** 4 (pass 1 → B1–B3 → pass 2 → B4–B5 → pass 3 → B6–B7 → `/qa` 98/98 → pass 4 ini)
- **Status Akhir:** ✅ **Approve with comments** — seluruh temuan blocking B1–B7 terverifikasi beres; 0 blocking baru; 6 catatan non-blocking (2 di antaranya layak dikerjakan segera)

---

## 1. Ringkasan

Review pass 4 memeriksa delta perbaikan B6/B7 (`services/pending-queue.ts` dan `services/api-errors.ts` baru, `hooks/use-offline-queue.ts` yang menyusut jadi pembungkus React, `services/device-state.ts` + `services/timer-storage.ts` untuk slot per pemilik, `services/auth.service.ts` + `routes/__root.tsx` untuk `clearDeviceState(userId)`), lalu menyusuri ulang jalur yang tersentuh: pengiriman antrean offline, siklus hidup timer, dan pembersihan state saat logout.

**B6 dan B7 terverifikasi beres** — dan kali ini buktinya bukan lagi "terlihat benar dari kode":

| # | Temuan pass 3 | Perbaikan | Bukti ulang (pass 4) |
|---|---|---|---|
| B6 | `flush()` menulis balik antrean dari snapshot basi → entri yang masuk saat flush berjalan terhapus | Penulisan **per entri**: `removeSessions([id])` membaca ulang lalu menulis dalam satu langkah sinkron tanpa `await` di antaranya; tidak ada snapshot yang ditulis balik | TC15-1/TC15-2 **Passed** — probe menahan `send`, mengantrekan sesi kedua di tengah flush, lalu melepasnya: antrean berisi **entri baru saja**; flush kedua tidak mengirim ulang yang sudah sukses |
| B7 | Kunci `pomodoro-active-timer` tunggal → membuka app sebagai pasangan menghapus run yang sedang berjalan | `activeTimerKey(userId)` = `pomodoro-active-timer:<userId>`; `clearDeviceState(userId)` hanya membersihkan slot akun yang keluar | TC15-3/TC15-4/TC15-5 **Passed** — di browser: Juliet `24:57` → Romeo `25:00` kosong (slot Juliet utuh, `startedAt` tidak berubah) → Juliet kembali **`23:49`** dengan label utuh |

Dua hal yang membuat pass ini berbeda dari tiga pass sebelumnya:

1. **B6 diuji dengan interleaving yang dikendalikan tes, bukan timing.** Pass 3 secara eksplisit meminta kasus regresi B6 "harus benar-benar menahan flush agar interleaving-nya deterministik". Permintaan itu dipenuhi dengan memindahkan storage + loop pengiriman ke `services/pending-queue.ts` (tanpa React) sehingga `send` bisa diganti dengan promise yang dikendalikan tes. Konsekuensinya bukan cuma test yang lebih baik — probe itu **langsung menangkap bug di dalam perbaikan B6 sendiri** (lihat §2.3), yang tidak akan tertangkap assertion struktural mana pun.
2. **Deviasi dari usulan reviewer dinilai dan diterima.** Reviewer mengusulkan "catat `id` yang terkirim, lalu filter di akhir". Implementasi memilih hapus-per-entri. Saya menilai jaminannya **lebih kuat**, bukan sekadar setara: tidak ada jendela antara "loop selesai" dan "menulis", dan tidak perlu menyimpan set ID. Deviasi terdokumentasi di `ISSUES.md` dan di komentar modul.

**Tidak ditemukan blocking baru.** Enam catatan non-blocking dicatat di §3; dua di antaranya (portabilitas runner di Windows, dan toast "tersimpan" saat penulisan storage gagal) saya nilai layak dikerjakan pada kesempatan berikutnya, tetapi tidak memblokir karena tidak memengaruhi produk pada platform tempat gate ini berjalan dan gagal secara terbuka, bukan senyap.

Satu hal yang perlu dinyatakan terus terang: pass 3 memprediksi bahwa **kelas bug konkurensi** akan lolos dari kasus yang dijalankan berurutan. Prediksi itu benar untuk B6, dan pass ini menutupnya dengan cara yang benar — bukan dengan menambah kasus berurutan yang lebih banyak, melainkan dengan membuat interleaving-nya menjadi bagian dari tes.

---

## 2. Temuan Blocking — Semua Terverifikasi Beres

### 2.1 Pass 1 — B1, B2, B3 ✅ **FIXED & RE-VERIFIED**

| # | Temuan | Perbaikan | Bukti ulang |
|---|---|---|---|
| B1 | ID sesi unik global vs. idempotensi per user | PK komposit `(user_id, id)`; migrasi `002` idempoten untuk MySQL + Postgres; `insertSession` menangkap duplicate-key lalu baca ulang | TC13-1 Passed — dua user UUID sama → 2 baris, keduanya 201; retry → 200 `duplicate:true`; 66 baris utuh |
| B2 | Error 500 mengirim `err.message` mentah | Pesan spesifik hanya untuk `statusCode` eksplisit; 5xx tak terduga → generik, detail ke `console.error` | TC13-3 Passed — 500 generik tanpa nama tabel/constraint; 4xx eksplisit tetap mempertahankan pesan |
| B3 | `getSettings` kunjungan pertama tidak race-safe | `INSERT … ON DUPLICATE KEY UPDATE` / `ON CONFLICT (user_id) DO NOTHING` lalu baca ulang | TC13-2 Passed — 6/6 request paralel 200, tepat 1 baris settings |

### 2.2 Pass 2 — B4, B5 ✅ **FIXED & RE-VERIFIED**

- **Kasus regresi:** `TC14-1` s/d `TC14-7` (PB-5 grup 7–8), semuanya **Passed**

| # | Temuan | Perbaikan | Bukti ulang |
|---|---|---|---|
| B4 | State perangkat tidak terikat ke akun → sesi Juliet tercatat milik Romeo, label pribadinya tampil di layar Romeo | Helper kepemilikan tunggal `device-state.ts` (`belongsTo`, `readOwned`, `writeOwned`, `clearDeviceState`); antrean ber-`user_id` per entri; `loadTimer(userId)`/`saveTimer(userId, …)`; `readCachedSettings(userId)`; `queryKey` settings ikut `userId` | TC14-1: antrean Juliet utuh saat Romeo login, DB `romeo 0`, lalu terkirim tepat 1 baris atas nama Juliet (`66 → 67`). TC14-2: dial `25:00`, label kosong. TC14-3: cache owner Juliet (fokus 50) tidak dipakai Romeo (`25:00`), cache ditulis ulang ber-owner Romeo |
| B4-e | `logout()` hanya membersihkan satu kunci | `clearDeviceState()` membersihkan identitas + cache settings + timer aktif; antrean **sengaja** dipertahankan | TC14-4: marker klik `qa-keluar-clicked = yes`, tiga kunci `null`, antrean tetap 1 entri ber-owner Juliet |
| B5 | 401 diperlakukan sebagai penolakan permanen → sesi fokus hilang | `isUnauthenticatedError` (401/403) dipisah dari `isTransientError`; `submit()` mengantrekan lalu `"deferred"`; `flush()` mempertahankan entri dan berhenti pada 401 pertama | TC14-5: sesi 1 menit selesai dengan cookie dicabut → masuk antrean, lalu terkirim tepat 1 baris setelah login ulang. TC14-6: `flush` saat 401 → antrean tetap 1, DB tidak bertambah |

### 2.3 Pass 3 — B6, B7 ✅ **FIXED & RE-VERIFIED**

- **Kasus regresi:** `TC15-1` s/d `TC15-5` (PB-5 grup 9), semuanya **Passed**
- **Bukti:** `pomodoro-state-probe.mts` 4/4, `qa-web-runner.mjs` 29/29, `qa-api-runner.mjs` 38/38, browser pass 5/5 dengan `juliet` ↔ `romeo`
- **Lokasi perbaikan:** `services/pending-queue.ts` (baru), `services/api-errors.ts` (baru), `hooks/use-offline-queue.ts`, `services/device-state.ts`, `services/timer-storage.ts`, `services/auth.service.ts`, `routes/__root.tsx`

#### B6 — antrean tidak lagi ditimpa dari snapshot basi

**Akar masalah (dari pass 3):** `flush()` mengambil `current = readQueue()` sekali di awal, lalu setelah loop `await` menulis **seluruh** kunci dari snapshot itu. `enqueue()` menulis ke kunci yang sama dari pembacaan yang lebih baru; keduanya tidak saling tahu.

**Perbaikan yang diperiksa:** penulisan sekarang **per entri**. `removeSessions([id])` melakukan `readQueue()` → `filter` → `writeQueue()` dalam satu langkah sinkron, tanpa `await` di antaranya, sehingga tidak ada titik di mana JS bisa menyisipkan penulisan lain antara baca dan tulis. `flushPendingSessions` tidak pernah lagi menulis array yang dibaca sebelum `await`.

Saya memeriksa ulang interleaving pass 3 terhadap kode baru, termasuk kasus yang tidak ada di tes:

| Skenario | Hasil analisis |
|---|---|
| `t1 await POST(A)` → `t2 enqueue(B)` → `t3 A selesai` | `t3` membaca ulang saat menulis → `[A,B]` difilter `A` → `[B]`. **Tertutup** (TC15-1) |
| A gagal transien, B masuk antrean di tengah flush | Loop hanya menghapus entri yang diputuskan; `latest = readQueue()` di akhir memuat B. B dikirim flush berikutnya. **Tertutup** |
| Dua tab flush bersamaan atas `[A]` | Keduanya `POST A` → server idempoten (200 `duplicate`), keduanya menghapus `A` → `[]`. Tidak ada duplikat baris. **Aman** |
| Dua tab: tab1 snapshot `[A,B]`, tab2 enqueue `C`, tab1 mengirim `A` lalu `B` | Penghapusan per entri membaca ulang → `C` bertahan. **Tertutup** (sebelumnya hilang) |
| 401 di tengah loop | `break` tanpa menulis apa pun → entri itu dan sisanya tetap di antrean. **Tertutup** (TC15-2) |

**Deviasi dari usulan reviewer — dinilai dan diterima.** Reviewer mengusulkan mencatat `id` yang terkirim lalu `latest.filter(entry => !delivered.has(entry.input.id))` di akhir loop. Implementasi memilih hapus-per-entri saat itu juga. Saya menilai ini **lebih kuat**, bukan sekadar setara: (a) tidak ada jendela antara "loop selesai" dan "menulis" di mana penulisan lain bisa disisipkan; (b) tidak perlu menyimpan set ID yang bisa salah kelola; (c) aturan 401 menjadi lebih sederhana — cukup `break`, karena entri yang tidak dihapus memang tetap ada. Deviasi terdokumentasi di `ISSUES.md` (Fase 12) dan di komentar `pending-queue.ts`.

**Bug di dalam perbaikan B6 — tertangkap probe, bukan oleh review.** Versi pertama perbaikan menulis `onQueueChange?.(removeSessions([id]))`. Argumen pada *optional call* di-skip bila `onQueueChange` tidak terpasang, sehingga **penghapusan entri bergantung pada ada/tidaknya listener UI** — tanpa listener, antrean tidak pernah menyusut dan entri terkirim akan dikirim ulang selamanya. Probe TC15-1/TC15-2 gagal (`antrean tetap [a,b]`) dan bug itu diperbaiki dengan menghitung hasil lebih dulu lalu memberi tahu. Saya menyebut ini secara eksplisit karena inilah bukti bahwa tes regresinya menguji kode nyata: assertion struktural atas source **tidak akan pernah** menangkap kelas bug ini.

#### B7 — timer punya slot per pemilik

**Akar masalah (dari pass 3):** `STORAGE_KEY = DEVICE_STATE_KEYS.activeTimer` tunggal. `loadTimer` sudah menolak run akun lain (inti B4, benar), tetapi `saveTimer` akun berikutnya menimpa kunci yang sama — penolakan yang benar berubah menjadi penghapusan yang tidak perlu.

**Perbaikan yang diperiksa:**

- `activeTimerKey(userId)` → `pomodoro-active-timer:<userId>`, terpusat di `device-state.ts` bersama `belongsTo`/`readOwned`/`writeOwned` — aturan B4 **tidak terduplikasi**, hanya dipakai ulang dengan kunci yang berbeda.
- `clearDeviceState(userId)` menghapus slot akun yang keluar saja; `logout(user?.id)` meneruskan id dari `__root.tsx`. Slot pasangan tetap berjalan.
- Kunci tunggal dari build lama **dibuang, bukan dimigrasikan** (`dropLegacySlot()` di `loadTimer`/`saveTimer`). Saya menilai ini benar: payload itu tidak bisa diatribusikan ke siapa pun, dan membiarkannya berarti label pribadi tertinggal di perangkat tanpa pemilik. Membiarkannya "untuk migrasi" akan memaksa tebakan owner — persis kelas B4.

**Bukti browser (TC15-5), angka konkret:**

```
Juliet mulai fokus 25 menit, label "Rahasia Juliet"
  -> dial 24:57, slot pomodoro-active-timer:81e5b08e… status running
Romeo buka :4043
  -> dial 25:00, label "", tombol "Mulai Fokus", slot Romeo idle
  -> slot Juliet UTUH: startedAt 1792969067037 tidak berubah
Juliet kembali
  -> dial 23:49, tombol "Jeda", label "Rahasia Juliet", sessionId sama
Romeo logout (tombol "Keluar")
  -> slot Romeo terhapus, slot Juliet TETAP ADA
Sesi 1 menit berlabel "QA B7 Selesai" selesai setelah itu
  -> DB: username=juliet, planned/actual=1/1
```

Perhatikan bukti terakhir: bukan hanya "timer kembali", tetapi **sesi yang diselesaikan setelah pemulihan tercatat atas nama pemiliknya** — rantai penuh dari slot → dial → sesi → DB.

**Catatan model (pass 3) kini terjawab.** Pass 3 menulis: "'milik siapa' sudah dimodelkan untuk *pembacaan*, tetapi belum untuk *slot penyimpanan*". Sekarang keduanya: kunci penyimpanan dan pembacaan memakai owner yang sama, dan satu helper yang sama.

---

## 3. Catatan Non-Blocking

Tidak dijadikan blocker, tidak ditulis ke `ISSUES.md` sebagai item. Diurutkan dari yang paling layak dikerjakan.

1. **Required-kecil — `qa-web-runner.mjs` memanggil probe dengan path yang tidak portabel** (`tests/qa-web-runner.mjs:353-355`): `execFileSync(path.join(web, "node_modules/.bin/tsx"), …)`. Di Windows binernya `tsx.cmd`, jadi panggilan ini `ENOENT` → catch menelan → map hasil kosong → TC15-1 s/d TC15-4 **gagal** di platform itu, padahal `AGENTS.md` §5.1 mendokumentasikan Windows sebagai platform dev yang dipakai. Repo ini sudah punya pola kanonik untuk hal yang sama tiga file jauhnya: `qa-api-runner.mjs:1063` memakai `execSync("pnpm exec tsx tests/error-middleware-probe.mts", …)`. **Sebaiknya pakai pola itu** — satu baris, sekaligus menghapus ketergantungan pada layout `node_modules/.bin`. Tidak saya jadikan blocker karena: tidak ada dampak ke produk, tidak ada CI (gate berjalan di mesin dev), dan kegagalannya **terbuka** (tes tampil FAILED, bukan lolos diam-diam).
2. **Required-kecil — `submit()` bisa menampilkan "sesi disimpan" ketika penulisan storage gagal.** `writeJson` menelan exception (`device-state.ts:64-71`, alasan aslinya "nilai tetap berguna untuk page load ini") — tetapi untuk antrean, nilai itu **tidak** berguna: `readQueue()` membacanya dari `localStorage`, jadi entri yang gagal ditulis hilang seketika. UI lalu menampilkan toast sukses "Offline — sesi disimpan & dikirim otomatis nanti". Pemicunya jarang (mode privat, kuota penuh), dan pada kondisi itu timer pun tidak bisa dipersist, tetapi kontraknya salah: sebaiknya `writeJson` mengembalikan `boolean` sehingga `submit()` bisa menjawab `"rejected"` (toast jujur) alih-alih sukses palsu.
3. **Optional — `removeSessions` membuang berdasarkan `id` global, sementara ruang id di server per-user** (`PRIMARY KEY (user_id, id)`). Bila dua akun punya `id` sesi yang sama (kolisi UUID — praktis mustahil, tetapi modelnya mengizinkan, dan B1 justru mengukuhkan bahwa id itu per-user), flush akun pertama akan menghapus entri akun kedua. Menyelaraskan dengan model server (`user_id` + `id`) akan menghapus kelas ini sepenuhnya.
4. **Optional — `isFlushing` dan `pending` dikembalikan hook tetapi tidak dipakai siapa pun** (`routes/index.tsx:34` hanya mengambil `submit`, `pendingCount`, `isOnline`). `isFlushing` masih di-`set` pada setiap flush, jadi ia memicu render ulang untuk konsumen yang tidak ada. Hapus, atau pakai untuk menonaktifkan tombol selama flush.
5. **Optional — `submit()` mengembalikan `"deferred"` tanpa menyimpan apa pun bila `userId` kosong.** Masih **tidak terjangkau** (root menahan render sampai `user` ada; `loadTimer(undefined)` menghasilkan timer idle sehingga penyelesaian tidak mungkin terjadi). Tetap jebakan laten: kontrak "hasil sukses tanpa persistensi" akan berubah menjadi kehilangan sesi berbalut pesan menenangkan bila guard root dilonggarkan.
6. **FYI — `queuedAt` ditulis tetapi tidak pernah dibaca** (`pending-queue.ts:31`). Berguna untuk debugging manual; kalau tidak, ia hanya menambah field yang harus dijaga tetap konsisten.

**Catatan yang tetap berlaku dari pass 3** (tidak berubah oleh perbaikan ini, tidak perlu diulang di sini): tidak ada listener `storage` sehingga `pendingCount` di tab lain baru benar setelah reload; `usePomodoroTimer` tidak menurunkan ulang state bila `userId` berubah tanpa remount (`key={userId}` akan membuat jaminan itu eksplisit); `updateSettings` read-modify-write; CORS fallback terbuka; `jwt.verify(...) as any`; tidak ada rate limiting (konsisten dengan app lain); `zonedParts` membuat formatter per baris; tanggal ekstrem diterima validasi.

**Dipertimbangkan lalu tidak dijadikan temuan:** `handleLogout` hanya memanggil `clearDeviceState` setelah `POST /auth/logout` berhasil, sehingga logout saat offline tidak membersihkan apa pun. Ini **benar**: bila server tidak pernah mencabut cookie, pengguna memang masih login, dan membersihkan state lokal justru akan menyesatkan. UI juga jujur — tidak redirect, tombol aktif kembali.

---

## 4. Review per Axis

| Axis | Hasil |
|---|---|
| **Correctness** | ✅ **B1–B7 beres.** Antrean kini punya satu invarian yang bisa dinyatakan dalam satu kalimat ("setiap penulisan membaca ulang lebih dulu") dan invarian itu diuji dengan interleaving eksplisit, bukan diasumsikan. Engine timer tetap murni turunan timestamp (`elapsedMs` dijepit `[0, plannedMs]`), `completionKeyRef` mencegah pencatatan ganda, `reset`/`skip` tidak pernah mencatat, `loadTimer` memvalidasi struktur **dan** kepemilikan, `flush` menangani tiga kelas error secara eksplisit. Catatan 2 dan 3 menyisakan dua jalur kehilangan data yang sempit tetapi nyata. |
| **Readability** | ✅ Pemisahan `pending-queue.ts` (storage + loop) dari `use-offline-queue.ts` (React binding) membuat masing-masing terbaca sendiri — hook turun dari 178 menjadi ~115 baris dan tidak lagi memuat aturan retry. Komentar menjelaskan *mengapa* (mis. mengapa legacy slot dibuang bukan dimigrasikan), bukan mengulang kode. `discard()` dengan komentar "keeping the write independent of listeners" adalah hasil langsung dari bug yang ditemukan probe. Catatan 4 (state mati) adalah satu-satunya sisa. |
| **Architecture** | ✅ **Catatan arsitektural pass 3 terjawab.** "Milik siapa" kini dimodelkan untuk pembacaan *dan* slot penyimpanan, lewat satu helper yang sama. `api-errors.ts` memisahkan klasifikasi error dari transport (`api.ts`) — pemisahan yang membuat loop antrean bisa diuji tanpa browser, jadi ia membayar dirinya sendiri, bukan abstraksi spekulatif. Arah dependensi bersih: `pending-queue` → `api-errors`/`device-state`, tidak pernah sebaliknya, dan `api.ts` tidak lagi menjadi tempat aturan bisnis bersembunyi. |
| **Security** | ✅ Tidak ada regresi. Seluruh SQL parameterized (`?`/`$1`), setiap route di belakang `authMiddleware`, `req.userId` dari baris DB (bukan payload token), setiap query difilter `user_id`, tidak ada secret di kode, cookie `httpOnly` + `secure` di produksi + `SameSite=Lax`, 500 tidak membocorkan internal, `password_hash` tidak pernah dikirim, label divalidasi `max(80)` di schema. Isolasi data dijaga dua lapis: server (setiap query `user_id`) dan klien (setiap kunci `localStorage` ber-owner, kini termasuk timer). Saya memeriksa ulang tidak ada `dangerouslySetInnerHTML`/`innerHTML` di seluruh app — label bebas-teks dirender lewat React dan di-escape. |
| **Performance** | ✅ Tidak ada N+1; `listSessions` berpagina (maks 200, divalidasi Zod); index `(user_id, started_at)`; `setInterval` 250 ms hanya memicu render ulang; `flush` berhenti pada 401 pertama. Penghapusan per entri menambah satu baca-tulis `localStorage` per entri terkirim — dapat diabaikan (antrean biasanya 0–2 entri) dan ditukar dengan jaminan yang jauh lebih penting. Catatan formatter dari pass 3 tetap berlaku. |

**Ukuran delta pass ini:** ~250 baris bersih (2 modul baru + probe 200 baris + penyusutan hook), satu perubahan logis: "antrean dan timer dimiliki per akun, dan setiap penulisan membaca ulang". Tidak perlu dipecah.

---

## 5. Verifikasi yang Diperiksa (bukan dijalankan ulang)

Sesuai `code-review-and-quality` Step 5, bukti dibaca dari artefak yang ada:

- `docs/qa/pomodoro-app/qa-report.md` — **PASSED**, 98/98 test case (putaran 5), termasuk §3.4 untuk B6/B7.
- `docs/qa/pomodoro-app/test-matrix.md` — 98 kasus, seluruhnya `Passed`, lint matrix bersih; TC15-1 s/d TC15-5 ada dan menguji perilaku.
- `pomodoro-state-probe.mts` **4/4**, `qa-web-runner.mjs` **29/29**, `qa-api-runner.mjs` **38/38**.
- `pnpm lint` 9/9, `pnpm check-types` 9/9, `pnpm build` 8/8.

**Yang saya periksa khusus, karena inilah yang gagal di pass 3:**

1. **Apakah TC15-1 benar-benar deterministik?** Ya — probe mengganti `send` dengan promise yang diselesaikan tes (`controlledSend`), sehingga urutan `POST(A) → enqueue(B) → selesai(A)` sama setiap kali. Tidak ada `setTimeout`/`sleep` yang bergantung timing.
2. **Apakah TC15-1 menguji kode produksi, bukan salinannya?** Ya — probe mengimpor `flushPendingSessions` dan `enqueueSession` dari `src/services/pending-queue.ts`. Bukti tambahan: probe **gagal** pada versi pertama perbaikan dan lulus setelah bug optional-call diperbaiki.
3. **Apakah bukti browser TC15-5 auditable?** Ya — angka yang dilaporkan saling mengunci: `startedAt` Juliet tidak berubah antar kunjungan, dial turun dari `24:57` ke `23:49` (≈68 detik, konsisten dengan waktu yang dihabiskan berpindah akun), dan sesi yang diselesaikan setelahnya muncul di DB dengan `username=juliet` serta `planned/actual=1/1`. Baseline dipulihkan: `juliet 66`, `romeo 0`.
4. **Apakah perbaikan B6 tidak merusak aturan B5?** TC15-2 menguji keempat kelas dalam satu flush (200/400/401/akun lain) dan memastikan flush kedua tidak mengirim ulang yang sudah sukses — jadi aturan lama diuji ulang di jalur baru, bukan diasumsikan ikut terbawa.

---

## 6. Tindak Lanjut

1. ~~Kembali ke **`/dev`** untuk B6/B7~~ — **selesai** (Fase 12).
2. ~~Jalankan ulang **`/qa`**~~ — **selesai**: 98/98, TC15-1 s/d TC15-5 Passed.
3. **Butir review di `ISSUES.md` dicentang** dan plan dipindahkan ke `docs/prd/done/pomodoro-app/` — review pass 4 lulus dengan catatan, dan seluruh butir penutupan sudah terpenuhi.
4. **Kandidat perbaikan berikutnya** (bukan blocker, tidak menghalangi rilis): catatan 1 (path `tsx` portabel di `qa-web-runner.mjs`) dan catatan 2 (`writeJson` melaporkan kegagalan agar toast tidak berbohong). Keduanya kecil dan berdiri sendiri; layak masuk backlog terpisah bersama catatan non-blocking pass 3.
5. Lanjut ke **`/promote`** untuk branch/PR.
