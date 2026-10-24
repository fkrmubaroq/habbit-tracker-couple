# Review Report — Komponen Sidebar Bersama, AppSwitcher Bersama, dan Penyelarasan Sidebar Finance

| Field | Nilai |
|---|---|
| Plan | `docs/prd/done/sidebar-component/` (`PRD.md`, `ISSUES.md`) |
| Verifikasi acuan | `docs/qa/sidebar-component/qa-report.md` (31/31 Passed) |
| Tanggal review | 2026-10-24 |
| Tahap pipeline | REVIEW (`/gate`) — setelah `/qa`, sebelum `/promote` |
| Skill dipakai | `code-review-and-quality` (5 axis) + `security-review` (menyentuh auth/logout) |
| Verdict | **Approve with comments — 0 blocking finding** |

---

## 1. Ringkasan

Perubahan ini **memperbaiki kesehatan kode secara nyata**: ~290 baris markup `AppSwitcher` yang terduplikasi di habit diringkas menjadi thin wrapper 60 baris, dua komponen presentasional baru masuk ke `@repo/ui` dengan kontrak yang jelas, satu regresi CSS nyata diperbaiki (`@source`), satu bug active-state ganda diperbaiki, dan logout finance ditambahkan end-to-end.

Tidak ada defect yang menghalangi merge. Seluruh temuan di bawah bersifat non-blocking; sebagian besar adalah perilaku yang memang sudah ada sebelumnya dan dibawa apa adanya oleh refactor.

| Axis | Verdict | Catatan |
|---|---|---|
| Correctness | Lulus | Logika active-state, paritas kelas, dan alur logout benar; 1 gap kecil di jalur error (F3) |
| Readability | Lulus | Komponen pendek, props eksplisit, komentar menjelaskan keputusan non-obvious |
| Architecture | Lulus | `@repo/ui` tetap router-agnostik; navigasi diinjeksi lewat `linkComponent`/`onSelect` |
| Security | Lulus | Cookie clear memirror opsi penerbit; tidak ada secret baru; 1 risiko diterima (F-S3) |
| Performance | Lulus | Tidak ada perubahan berarti; array nav dibuat ulang per render (tidak terukur) |

---

## 2. Yang diverifikasi ulang secara independen

Review ini tidak hanya membaca laporan QA — beberapa klaim diuji ulang dari sumber:

1. **Paritas kelas habit dengan versi lama.** `item`, `itemActive`, `itemInactive` hasil merge `Sidebar` dibandingkan baris per baris dengan string `className` di `git show HEAD:apps/habbit-tracker-web/src/routes/__root.tsx` → identik. `.nav-active-duo` memang ada di `packages/tailwind-config/utilities.css` dengan `background-color/color/border-color` ber-`!important`, jadi mengganti `itemActive` dengan satu kelas itu tidak menghilangkan border (border-width tetap datang dari `item`).
2. **Bottom nav finance bukan regresi.** Versi HEAD memakai `location.pathname === item.to` (exact saja); versi baru memakai `isSidebarItemActive` sehingga `/transactions/create` kini ikut menyalakan "Transaksi". Daftar item tetap 6, tidak ada yang hilang/ditambah. Ini perbaikan konsistensi, bukan regresi.
3. **Utility baru benar-benar ter-generate** di kedua CSS build: `.border-3{border-width:3px}`, `.h-4\.5{height:calc(var(--spacing)*4.5)}`, `.backdrop-blur-xs`, `.bg-pink-100` dst.
4. **Tidak ada pelanggaran aturan hooks.** `AppSwitcher` menaruh `useState`/`useEffect` sebelum early return `if (!currentApp) return null`.
5. **`packages/ui` tidak menambah dependensi router.** `package.json` `@repo/ui` hanya berisi radix/clsx/cva/lucide/tailwind-merge; `lucide-react` sudah ada sebelumnya sehingga impor ikon di `app-switcher.tsx` sah.
6. **Kelas mati dikonfirmasi mati.** `animate-in`, `fade-in`, `zoom-in-95` → 0 kemunculan di CSS build habit **maupun** finance, dan `tailwindcss-animate` tidak terpasang di mana pun. Artinya kelas itu memang tidak pernah berefek, sebelum maupun sesudah refactor.

---

## 3. Temuan non-blocking

Severity mengikuti `code-review-and-quality`: **Nit** = opsional, **Optional/Consider** = saran, tanpa prefiks = wajib. Tidak ada temuan tanpa prefiks.

### F1 — Nit: kelas animasi mati di komponen bersama

`packages/ui/src/components/app-switcher.tsx:134,146,248`

`animate-in fade-in duration-200`, `animate-in zoom-in-95`, dan `py-0.2` tidak menghasilkan CSS apa pun (tidak ada plugin `tailwindcss-animate`). Modal muncul tanpa animasi. Perilaku ini identik dengan versi lama, jadi bukan regresi — tetapi sekarang kelas mati itu hidup di paket bersama dan akan disalin ke setiap consumer baru.

**Saran:** hapus kelas tersebut, atau pasang `tailwindcss-animate` bila animasi memang diinginkan.

### F2 — Nit: modal belum memenuhi pola dialog yang dapat diakses

`packages/ui/src/components/app-switcher.tsx:142-167`

Tidak ada `role="dialog"`, `aria-modal="true"`, focus trap, maupun pemulihan fokus; tombol tutup (ikon `X`) tidak punya nama yang dapat dibaca screen reader. Terverifikasi **sudah begitu sejak HEAD** (`git show HEAD:.../app-switcher.tsx` tidak memuat `role=`/`aria-modal`), jadi bukan regresi.

Karena komponen ini sekarang shared dan `@radix-ui/react-dialog` **sudah** menjadi dependensi `@repo/ui`, migrasi ke `Dialog` Radix adalah perbaikan berbiaya rendah untuk follow-up.

### F3 — Optional: kegagalan logout finance tidak memberi umpan balik

`apps/finance-tracker-web/src/routes/__root.tsx:44-46`

```ts
} catch {
  setIsLoggingOut(false);
}
```

Bila `POST /auth/logout` gagal (API mati/jaringan putus), spinner berhenti dan tidak ada pesan apa pun — pengguna tidak tahu kenapa. Habit menampilkan toast untuk kasus yang sama (`showToast(t("common.logout_failed"))`).

Jalur ini jarang (endpoint tidak memakai `authMiddleware`, jadi normalnya selalu 200), dan finance belum punya sistem toast, sehingga menambahkan pesan inline kecil di bawah tombol sudah cukup. Tidak menghalangi merge.

### F4 — Nit: landmark `<nav>` tidak berlabel

`Sidebar` menerima prop `ariaLabel`, tetapi tidak ada pemanggil yang mengisinya. Akibatnya setiap halaman punya dua landmark navigasi tanpa nama (sidebar + bottom nav), sehingga sulit dibedakan oleh screen reader.

**Saran:** isi `ariaLabel` di kedua `__root.tsx` (mis. "Navigasi utama" / "Navigasi bawah").

### F5 — Nit: `SidebarItem` dipakai juga oleh `BottomNav`

`apps/finance-tracker-web/src/components/navigation/bottom-nav.tsx:2`

Tipe ini sekarang mendeskripsikan item navigasi umum, bukan khusus sidebar. Nama `NavItem` (dengan alias `SidebarItem` untuk kompatibilitas) akan lebih jujur. Bukan masalah fungsional — justru bagus karena `BottomNav` memakai `isSidebarItemActive` sebagai satu sumber kebenaran.

### F6 — Nit: double cast `as unknown as SidebarLinkComponent`

`apps/habbit-tracker-web/src/routes/__root.tsx:99`, `apps/finance-tracker-web/src/routes/__root.tsx:77`

Cast ganda mematikan pemeriksaan tipe untuk `to`, sehingga salah tulis path tidak tertangkap compiler (hanya jadi 404 saat runtime). Ini harga yang sudah didokumentasikan untuk router-agnostik (Design decision 3) dan dapat diterima; bila kelak ingin dikembalikan, `SidebarProps` bisa dibuat generik terhadap union route tiap app.

### F7 — Optional: cleanup `overflow` menimpa nilai sebelumnya

`packages/ui/src/components/app-switcher.tsx:59-62`

Cleanup menulis `document.body.style.overflow = "unset"` alih-alih memulihkan nilai inline sebelumnya. Bila komponen lain pernah men-set overflow inline, nilainya hilang. Dampak praktis nol saat ini (tidak ada consumer yang melakukannya). Menyimpan nilai lama di variabel lebih aman.

### F8 — Observasi (pre-existing, di luar scope): finance web tidak punya ESLint

`apps/finance-tracker-web/package.json` → `"lint": "tsc --noEmit"`, dan tidak ada `eslint.config.*` untuk app finance (terkonfirmasi: hanya `apps/habbit-tracker-web/eslint.config.js` yang ada, juga di HEAD). Konsekuensinya `pnpm lint` memberi **nol** cakupan ESLint untuk finance web; 51 warning yang dilaporkan semuanya berasal dari habit dan paket lain.

Laporan QA tetap akurat secara teknis, tetapi pembaca perlu tahu bahwa "lint 5/5" untuk finance berarti type-check saja. Kode finance baru (termasuk `bottom-nav.tsx`, `config/apps.config.ts`, `services/auth.service.ts`) hanya divalidasi `tsc`. Layak jadi backlog tersendiri.

### F9 — Observasi (pre-existing): default rahasia hardcoded di `env.ts`

`apps/finance-tracker-api/src/config/env.ts`

`MYSQL_PASSWORD` dan `JWT_SECRET` masih punya nilai default di dalam source. Baris ini **tidak** diperkenalkan plan ini (diff hanya mengubah `MYSQL_HOST`/`MYSQL_USER`/`MYSQL_DATABASE`/`PORT`), dan `.env` sudah masuk `.gitignore`. Namun default seperti ini membuat app tetap boot dengan kredensial yang salah alih-alih gagal cepat. Kandidat hardening terpisah.

### F10 — Observasi: helper test mencari blok lewat offset string

`apps/finance-tracker-web/tests/qa-ui-components-runner.mjs:298-305`

`financeSidebarBlock()` mengiris `__root.tsx` dari `<Sidebar` sampai `"\n      />"` pertama. Saat ini benar (tidak ada elemen self-closing ber-indentasi 6 spasi di dalam blok), tetapi satu perubahan format dapat mempersempit irisan secara diam-diam. Guard `assert` menahan kasus ekstrem, bukan kasus irisan yang salah tapi valid. Penanda komentar eksplisit atau parser ringan akan lebih tahan lama.

### F11 — Observasi: registry finance mencerminkan registry habit secara manual

`apps/finance-tracker-web/src/config/apps.config.ts`

Sudah diterima sebagai Design decision 10 (menghindari coupling build antar-app), tetapi daftar ini akan diam-diam menyimpang bila habit menambah app baru. Bila itu terjadi, pertimbangkan satu sumber JSON netral yang diimpor kedua app.

### F12 — Observasi: working tree membawa perubahan di luar plan

Selain pekerjaan sidebar, working tree juga memuat penomoran ulang port (`5050/5051`, `4040/4041`), default MySQL, `AGENTS.md`, sinkronisasi `.agent-skills-lock.json`, dan `.opencode/commands/`. Semua sudah diverifikasi berjalan, tetapi bukan bagian dari PRD plan ini. Saat commit, perubahan itu dipisahkan ke commit tersendiri agar riwayat PR tetap terbaca.

---

## 4. Security review

| Item | Hasil |
|---|---|
| Secret hardcoded baru | **Tidak ada.** Tidak ada kredensial/token baru di kode yang berubah. |
| `.env` ter-ignore | **Ya** — `.env` ada di `.gitignore`; hanya `.env.example` yang di-commit. |
| Opsi `clearCookie` | **Benar.** `httpOnly`, `secure` (production), `sameSite: "lax"`, `domain` dari `COOKIE_DOMAIN`, `path: "/"` — memirror opsi penerbit di habit API. Diverifikasi runner: `token=;`, `Max-Age=0`, `Path=/`, `HttpOnly`. |
| Endpoint logout tanpa `authMiddleware` | **Diterima.** Handler hanya menghapus cookie yang dikirim klien; tidak membaca/membocorkan data. Konsisten dengan habit API. |
| CSRF | `SameSite=Lax` + method `POST` membuat cross-site request tidak membawa cookie. Logout-CSRF tetap mungkin secara teori, dampaknya hanya memaksa login ulang. Setara dengan perilaku habit yang sudah ada. |
| Revokasi token | **Risiko diterima.** Logout = penghapusan cookie; JWT tetap valid sampai kedaluwarsa (30 hari). Desain stateless yang sama dengan habit. Bila kelak butuh revokasi segera, perlu token version/denylist — di luar scope. |
| Injeksi / validasi input | Tidak ada input pengguna baru yang diparsing. `logout` tidak menerima body. |
| Cross-origin | Finance web memanggil API-nya sendiri lewat proxy `/api`; hand-off antar-app memakai navigasi halaman penuh, bukan `postMessage`. Tidak ada permukaan baru. |

**Tidak ada temuan security yang menghalangi merge.**

---

## 5. Catatan atas cakupan pengujian

- Verifikasi tetap bergantung pada runner asersi sumber (`.mjs`) plus sesi browser agent; repo belum punya Playwright/Cypress. Konsekuensinya baris matriks yang murni visual ditandai `Tanpa Automation` (9 dari 31).
- `qa-api-runner.mjs` (suite penuh) tidak dapat dijalankan terhadap database dev yang sudah berisi data nyata, karena asersinya memakai saldo absolut. Runner baru `qa-auth-logout-runner.mjs` sengaja dibuat sempit dan bebas mutasi untuk menghindari masalah itu. Pembatasan ini sudah ada sebelumnya dan bukan akibat plan ini — tetapi perlu diketahui agar tidak dianggap suite penuh "lulus".

---

## 6. Kesimpulan

**Approve.** Tidak ada blocking finding, sehingga tidak ada item baru yang perlu ditulis ke `ISSUES.md`.

Sepuluh success criteria PRD terpenuhi dan tertelusuri di `qa-report.md`. Dua belas catatan di atas bersifat perbaikan lanjutan; F1/F2/F8 layak diprioritaskan bila ingin menaikkan kualitas komponen bersama, dan F3 adalah perbaikan kecil yang paling murah.

Plan siap masuk tahap **SHIP (`/promote`)**.
