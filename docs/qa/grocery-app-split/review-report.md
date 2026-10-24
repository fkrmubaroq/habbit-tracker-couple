# Review Report — Pemisahan Grocery Menjadi App Sendiri (FE + BE)

| Field | Nilai |
|---|---|
| Plan | `docs/prd/done/grocery-app-split/` (`PRD.md`, `ISSUES.md`) |
| Verifikasi acuan | `docs/qa/grocery-app-split/qa-report.md` (49/49 Passed, putaran 2) |
| Tanggal review | 2026-10-24 (putaran 1) · 2026-10-24 (putaran 2, re-review perbaikan) |
| Tahap pipeline | REVIEW (`/gate`) — setelah `/qa`, sebelum `/promote` |
| Skill dipakai | `code-review-and-quality` (5 axis) + `security-review` (menyentuh auth/session & data handling) |
| Verdict putaran 1 | **Changes requested** — 2 blocking (B1, B2) |
| **Verdict putaran 2** | **Approve with comments** — 0 blocking |

---

## 1. Ringkasan

Pemisahan grocery menjadi `apps/grocery-tracker-api` + `apps/grocery-tracker-web` dikerjakan dengan rapi: domain dipindah apa adanya, habit app dibersihkan sampai tidak ada sisa import, shim `/grocery-list*` bekerja, `@repo/ui` dipakai lewat re-export tipis (bukan duplikasi), dan infra (`deploy.sh`, `nginx.conf`, script root, `AGENTS.md`) ikut disesuaikan. Tidak ada schema change dan tidak ada dependensi baru yang tidak perlu.

Putaran 1 review memblokir karena dua defect: satu diperkenalkan plan ini dan hanya muncul di build produksi (router tidak mengenal prefix `/grocery/`), satu celah otorisasi yang ikut pindah ke service baru. Keduanya sudah diperbaiki di Fase 6b dan **diverifikasi ulang secara independen pada putaran 2** — lihat §3.

| Axis | Verdict putaran 2 | Catatan |
|---|---|---|
| Correctness | **Lulus** | B1 tertutup; build produksi di `/grocery/` merender ketiga route (dibuktikan ulang §3.1) |
| Readability | Lulus | Beberapa import mati masih ada (N2) |
| Architecture | Lulus | Pemisahan app bersih, `@repo/ui` re-export, predikat otorisasi dipusatkan di satu helper |
| Security | **Lulus** | B2 tertutup; seluruh 6 endpoint grocery kini konsisten read/write (§3.2) |
| Performance | Lulus | Reset/delete-all masih request per item (N8, pre-existing) |

---

## 2. Yang diverifikasi ulang secara independen

Review ini tidak hanya membaca laporan QA; klaim kunci diuji ulang dari sumber.

1. **B1 dibuktikan dengan eksekusi, bukan asumsi.** `apps/grocery-tracker-web` di-build (`pnpm build`) lalu `dist/` disajikan pada path `/grocery/` oleh server statis lokal yang meniru `location ^~ /grocery/` di `nginx.conf` (`try_files $uri $uri/ /grocery/index.html`) + respons palsu untuk `/api/auth/me` dan `/api/grocery`. Hasil pada putaran 2: `/grocery/` → `h1 = Daftar Belanja`, `/grocery/manage` → `h1 = Kelola Belanjaan`, `/grocery/settings` → `h1 = Pengaturan Grocery List`, tanpa "Not Found"; seluruh `href` sidebar berawalan `/grocery/`. Bundle produksi memang memuat `basepath:"/grocery/"`.
2. **B2 bukan regresi dari refactor.** `git show HEAD:apps/habbit-tracker-api/src/modules/grocery/grocery.controller.ts` menunjukkan kode tanpa pemeriksaan kepemilikan — celah ini sudah ada sebelumnya dan ikut pindah apa adanya. Ia ditutup di sini, bukan diwariskan lagi.
3. **Predikat otorisasi setara dengan jalur baca.** `isOwnedByCouple()` dibandingkan baris-per-baris dengan `findForCouple()` di **kedua** repository:
   - berpasangan → `user_id IN (me, partner) OR partner_id IN (me, partner)` — identik dengan `WHERE (g.user_id = ? OR g.user_id = ? OR g.partner_id = ? OR g.partner_id = ?)`;
   - tanpa pasangan → `user_id = me OR partner_id = me` — identik dengan cabang `else` di kedua repo.

   `req.partnerId` berasal dari baris `users` yang sama dengan yang dibaca `getGroceryItems`, jadi tidak ada asimetri sumber data.
4. **Semua endpoint tulis tertutup, bukan hanya tiga yang dilaporkan.** `GET` (`findForCouple`), `POST` (owner diambil dari token), `PUT`/`PATCH toggle`/`DELETE` (`findOwnedItem`), dan `POST /clear-completed` (`clearCompleted(userId, partnerId)`) — keenamnya kini scoped. Tidak ada endpoint yang tersisa bolong.
5. **404 dipakai konsisten, bukan 403.** `findOwnedItem` mengembalikan `null` baik untuk "tidak ada" maupun "bukan milik couple", sehingga id milik couple lain tidak bisa dibedakan dari id yang tidak eksis — sesuai keputusan PRD.
6. **Test regresi tidak vacuous.** `TC3-2` dan `TC3-3` di `qa-api-runner.mjs` memakai `users` row sementara + JWT bertanda tangan lewat jalur `Authorization: Bearer` yang memang didukung `authMiddleware` (`auth.middleware.ts:37-41`). `TC3-3` menyertakan *positive control* (owner tetap bisa `PUT` item sendiri → 200), sehingga kegagalan predikat tidak bisa lolos diam-diam. `TC14-4` memeriksa `basepath` **di dalam** opsi `createRouter` (bukan sekadar ada string `basepath` di file).
7. **Tidak ada duplikasi komponen.** `apps/grocery-tracker-web/src/components/ui/sidebar.tsx` adalah re-export `@repo/ui` (8 baris), bukan salinan; `button.tsx` juga re-export.
8. **Tidak ada fallback localStorage yang tersisa.** `grocery.service.ts` hanya memanggil `api`; kegagalan API naik sebagai `Error` dan ditampilkan lewat toast (diverifikasi QA dengan API dimatikan).
9. **Cookie logout memirror opsi penerbit.** `cookieOptions()` grocery memakai `httpOnly`, `secure` (production), `sameSite: "lax"`, `domain: COOKIE_DOMAIN`, `path: "/"` — sama dengan habit, sehingga `clearCookie` benar-benar menghapus cookie bersama.
10. **`executeQuery` menangani placeholder lintas provider.** `?` diterjemahkan ke `$n` untuk pg/neon; query grocery tidak memuat literal `?` sehingga aman.
11. **Tidak ada secret yang ikut ter-commit.** `git check-ignore` mengonfirmasi `.env` kedua app grocery ter-ignore; yang masuk repo hanya `.env.example` dengan placeholder `change-me-to-a-long-random-string`.
12. **Tidak ada referensi grocery yang tertinggal di habit API.** `grep -rn "grocery" apps/habbit-tracker-api/src/` → kosong. Di habit web hanya tersisa dua file shim (`grocery-list.tsx`, `grocery-list.$.tsx`) yang memang disengaja.
13. **Tidak ada URL internal grocery yang melewati basepath.** Seluruh `window.location.href` di grocery web menunjuk app **lain** (habit/finance); navigasi antar-halaman grocery memakai `navigate({ to: ... })` yang menghormati `basepath`.

---

## 3. Temuan blocking putaran 1 — status perbaikan

### B1 — Critical: build produksi grocery menampilkan "Not Found" di semua route → **SUDAH DIPERBAIKI**

`apps/grocery-tracker-web/src/main.tsx:18-29`

`vite.config.ts` menyetel `base: "/grocery/"` untuk mode production, tetapi `createRouter` semula tidak diberi `basepath`. TanStack Router **tidak** otomatis membaca `import.meta.env.BASE_URL`, sehingga pada build produksi router mencoba mencocokkan `/grocery/...` terhadap route `/...` dan gagal — "Not Found" di dalam shell yang tetap tampil.

Perbaikan yang masuk:

```ts
const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, ""),
  context: { queryClient },
});
```

Trailing slash dibuang karena TanStack Router menolak `basepath` berakhiran `/`; dev (`base: "/"`) menghasilkan string kosong sehingga perilaku dev tidak berubah. Komentar di atasnya menjelaskan alasan dan merujuk ke `vite.config.ts` + `nginx.conf`.

**Verifikasi ulang (putaran 2):**

| URL (dist produksi disajikan di `/grocery/`) | Hasil |
|---|---|
| `/grocery/` | `h1 = Daftar Belanja` |
| `/grocery/manage` | `h1 = Kelola Belanjaan` |
| `/grocery/settings` | `h1 = Pengaturan Grocery List` |
| `href` sidebar | `/grocery/`, `/grocery/manage`, `/grocery/settings` |

Penjaga regresi: `TC14-4` (runner statis, memastikan `basepath` berada di dalam `createRouter` dan diturunkan dari `BASE_URL`) + `TC14-5` (render nyata ketiga route di subpath). **Tertutup.**

### B2 — Critical: `update` / `toggle` / `delete` grocery tidak memeriksa kepemilikan couple (IDOR) → **SUDAH DIPERBAIKI**

`apps/grocery-tracker-api/src/modules/grocery/grocery.controller.ts:18-41, 92-162`

Semula ketiga handler hanya memanggil `groceryRepo.findById(id)` lalu `if (!existing) → 404`. Setiap user yang login dapat mengubah, mencentang, atau menghapus item milik couple lain bila mengetahui UUID-nya.

Perbaikan yang masuk memusatkan predikat di dua helper agar ketiga handler tidak bisa menyimpang:

```ts
function isOwnedByCouple(item: GroceryItem, req: AuthenticatedRequest): boolean {
  const userId = req.userId;
  if (!userId) return false;
  const partnerId = req.partnerId ?? null;
  if (item.user_id === userId || item.partner_id === userId) return true;
  if (partnerId) {
    if (item.user_id === partnerId || item.partner_id === partnerId) return true;
  }
  return false;
}

async function findOwnedItem(id, req) {
  const existing = await groceryRepo.findById(id);
  if (!existing) return null;
  return isOwnedByCouple(existing, req) ? existing : null;
}
```

Dua hal yang saya nilai benar secara khusus:

1. **Guard `if (partnerId)` bukan kosmetik.** Tanpa guard, `item.partner_id === req.partnerId` akan cocok saat keduanya `null`, sehingga dua user tanpa pasangan saling bisa menyentuh item. Ini bug nyata yang sempat muncul saat implementasi dan sekarang dijaga `TC3-3`.
2. **404 dipertahankan sebagai satu-satunya jawaban.** `findOwnedItem` tidak membedakan "tidak ada" dan "bukan milikmu", jadi tidak ada oracle keberadaan item.

**Verifikasi ulang (putaran 2):** `TC3-2` (outsider → `PUT`/`PATCH toggle`/`DELETE` semuanya 404; item tetap utuh `name`/`quantity`/`is_completed`; item tidak muncul di daftar outsider) dan `TC3-3` (dua user `partner_id = null`; stranger 404 di ketiganya, owner tetap 200 sebagai positive control). Keduanya dibuktikan **non-vacuous**: dengan predikat lama `TC3-2` gagal `PUT oleh outsider expected 404, got 200`. **Tertutup.**

---

## 4. Temuan non-blocking

Tidak ada temuan non-blocking **baru** pada putaran 2. Daftar di bawah adalah status N1–N9 dari putaran 1 setelah perbaikan; semuanya tetap di luar scope plan ini dan tidak menghalangi penutupan.

| ID | Status putaran 2 | Ringkas |
|---|---|---|
| **N1** | Masih ada | `navigate({ to: "/" })` asinkron lalu query DOM untuk fokus input "Tambah cepat" — dari `/manage`/`/settings` halaman berpindah tetapi input tidak ter-fokus (`__root.tsx:103-116`). Saran: fokus lewat `useEffect` di halaman `/`. |
| **N2** | Masih ada | Import ikon mati. Diverifikasi ulang dengan `grep`: `index.tsx` — `Square`, `Receipt`, `RotateCcw`, `Sparkles`, `Filter` (tidak ada `<Filter` di JSX); `manage.tsx` — `CheckCircle2`, `Circle`, `Layers`, `Sparkles`, `ArrowLeft`, `DollarSign`, `PieChart`. Tidak tertangkap karena `lint` app ini hanya `tsc --noEmit` (N3). |
| **N3** | Masih ada | `lint` grocery (dan 5 dari 6 app) hanya `tsc --noEmit`, identik dengan `check-types`. Konvensi repo-wide; tabel `AGENTS.md` yang menyebut "ESLint 9 … across apps and packages" menyesatkan. Bukan temuan plan ini. |
| **N4** | Masih ada | `apps/grocery-tracker-api/src/config/env.ts:19` — `JWT_SECRET` default `habitpasutri-default-secret-key-12345`, sama dengan habit. Deployment yang lupa mengisi `.env` tetap "jalan" dengan secret publik. Lebih aman fail-fast saat `NODE_ENV=production`. |
| **N5** | Masih ada | `scripts/deploy.sh` cabang `nohup` grocery tidak `pkill` lebih dulu (cabang habit melakukannya). Deploy kedua tanpa PM2 akan `EADDRINUSE`. Tambahkan `pkill -f "grocery-tracker-api/dist/index.js"` (pola spesifik agar tidak membunuh backend habit). |
| **N6** | Masih ada | `apps/habbit-tracker-web/src/config/apps.config.ts:123` — `getActiveApp(pathname)` mengabaikan argumen dan selalu mengembalikan `APPS_REGISTRY[0]`. Sederhanakan menjadi konstanta atau hapus. |
| **N7** | Masih ada | `apps/habbit-tracker-web/src/routes/login.tsx:50-61` — `appNames` di-key dengan **URL penuh** (`VITE_GROCERY_APP_URL`) tetapi di-lookup dengan `origin`. Di dev cocok (`http://localhost:4042`); di produksi grocery ada di `https://<domain>/grocery` sehingga origin `https://<domain>` tidak pernah cocok → teks jatuh ke generik. Perbaikan murah: key dengan `new URL(APP_URL).origin`. |
| **N8** | Masih ada | `settings.tsx:45-78` dan `manage.tsx:129-144` melakukan loop `await` satu request per item untuk reset/delete-all — lambat dan tidak atomik. Pertimbangkan endpoint bulk sebagai follow-up. |
| **N9** | Masih ada (FYI) | `apps/grocery-tracker-api/src/app.ts:13-22` — bila `ALLOW_ORIGIN_CORS` kosong, `origin: true` memantulkan semua origin dengan `credentials: true`. Sama dengan habit/finance; `.env.example` sudah mengisi daftar eksplisit. Isi variabel ini saat deploy produksi. |

### FYI tambahan (pola repo, bukan temuan plan ini)

`apps/grocery-tracker-api/src/middleware/error.middleware.ts:28-31` mengirim `err.message` mentah ke klien untuk status 500. Untuk error driver database, pesan itu bisa memuat nama tabel/fragmen SQL. Pola ini **identik** di `habbit-tracker-api` dan `finance-tracker-api`, jadi konsisten dengan konvensi repo dan tidak saya jadikan temuan plan ini — tetapi layak jadi perbaikan lintas-app tersendiri (kirim pesan generik, log detailnya saja).

### Catatan higiene test

`deleteOutsiders()` di `qa-api-runner.mjs` menjalankan `DELETE FROM grocery_items WHERE name LIKE 'qa-test-%'` tanpa filter pemilik. Aman untuk DB dev dan konsisten dengan tag QA, tetapi akan ikut menghapus item siapa pun yang kebetulan diawali `qa-test-`. Cukup disadari; tidak perlu diubah sekarang.

---

## 5. Verdict

**Approve with comments.** Kedua temuan blocking putaran 1 (B1, B2) sudah diperbaiki dengan benar dan diverifikasi ulang secara independen — bukan hanya dipercaya dari laporan QA. Tidak ada temuan blocking baru.

Sembilan catatan non-blocking (N1–N9) tetap terbuka sebagai backlog terpisah; tidak satu pun menghalangi penutupan plan karena berada di luar scope pemisahan app dan/atau merupakan konvensi repo-wide yang pre-existing.

Item review di Fase 7 `ISSUES.md` dicentang, dan plan dipindahkan ke `docs/prd/done/grocery-app-split/` sesuai konvensi output `prd-grill`.
