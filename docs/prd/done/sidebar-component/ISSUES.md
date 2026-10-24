# Issues — Komponen `Sidebar` Bersama dengan Item Menu Dinamis

## Fase 1: Komponen `@repo/ui`

- [x] Buat `packages/ui/src/components/sidebar.tsx` yang mengekspor tipe `SidebarItem` (`label`, `to`, `icon`, `match?: "exact" | "prefix"`), `SidebarLinkComponent` (`React.ComponentType<SidebarLinkProps>` dengan `to: string`, `className?`, `children`), `SidebarClassNames` (`body`, `nav`, `item`, `itemActive`, `itemInactive`, `icon`, `label`), dan komponen `Sidebar` dengan props `items`, `activePath`, `linkComponent`, `header?`, `footer?`, `className?`, `classNames?`, `ariaLabel?`
- [x] Implementasikan helper `isSidebarItemActive(item, activePath)` di file yang sama: `exact` → `activePath === item.to`; `prefix` → `activePath === item.to || activePath.startsWith(item.to + "/")`; default `exact` bila `match` tidak diisi
- [x] Render `Sidebar` sebagai `<aside>` berisi wrapper body (`header` slot + `<nav>` + `footer` slot), dengan tiap item dirender via `<LinkComponent to={item.to} className={...}>` memakai `cn()` untuk menggabungkan `classNames.item` + `itemActive`/`itemInactive`; tanpa mengimpor `@tanstack/react-router`
- [x] Tambahkan `export * from "./components/sidebar";` di `packages/ui/src/index.ts`

## Fase 2: Wrapper Re-export Kedua App

- [x] Buat `apps/habbit-tracker-web/src/components/ui/sidebar.tsx` yang me-re-export `Sidebar`, `SidebarItem`, `SidebarLinkComponent`, dan `SidebarClassNames` dari `@repo/ui`
- [x] Buat `apps/finance-tracker-web/src/components/ui/sidebar.tsx` yang me-re-export nama-nama yang sama dari `@repo/ui`

## Fase 3: Terapkan di `habbit-tracker-web`

- [x] Ganti `<aside>` inline (baris 92-173) di `apps/habbit-tracker-web/src/routes/__root.tsx` dengan `<Sidebar>`: kirim `items={activeNavItems}`, `activePath={location.pathname}`, `linkComponent={Link as SidebarLinkComponent}`, `header` berisi `AppSwitcher` + kartu profil user, `footer` berisi tombol aksi cepat (habit/grocery) + tombol logout
- [x] Pindahkan styling khas habit ke props `className`/`classNames` agar tampilan identik: `p-4` pada `<aside>`, `gap-5` pada body, `gap-2` pada nav, kelas `nav-active-duo` sebagai `itemActive`, dan `h-5 w-5` sebagai `icon`
- [x] Tandai `match: "prefix"` pada item `/grocery-list` di `groceryNavItems`, dan biarkan `habitNavItems` memakai default `exact`
  - **Dikoreksi di Fase 5d:** penandaan `prefix` di sini ternyata salah. `/grocery-list/manage` dan `/grocery-list/settings` punya item menu sendiri, sehingga `prefix` pada `/grocery-list` membuat dua menu menyala bersamaan. Status akhir: `/grocery-list` kembali `exact`.

## Fase 4: Terapkan di `finance-tracker-web`

- [x] Ganti `<aside>` inline (baris 56-142) di `apps/finance-tracker-web/src/routes/__root.tsx` dengan `<Sidebar>`: kirim `items={navItems}`, `activePath={location.pathname}`, `linkComponent={Link as SidebarLinkComponent}`, `header` berisi brand "Keuangan Pasutri", `footer` berisi kartu profil user + link "Buka Habit Tracker" + `QuickThemeToggle` + tombol "+ Transaksi"
- [x] Pindahkan styling khas finance ke props `className`/`classNames` agar tampilan identik: `p-5` pada `<aside>`, `gap-6` pada body, `gap-1.5` pada nav, kelas `bg-highlight text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)] font-extrabold` sebagai `itemActive`, dan `h-5 w-5 stroke-[2.2]` sebagai `icon`
- [x] Tandai `match: "prefix"` pada item `/transactions` di `navItems` agar `/transactions/create` ikut menyorot menu "Transaksi"
- [x] Ekstrak `<nav>` bottom nav inline (baris 199-215) di `apps/finance-tracker-web/src/routes/__root.tsx` menjadi `apps/finance-tracker-web/src/components/navigation/bottom-nav.tsx` dengan props `items` + `activePath`, memakai `Link` dan logika active yang sama (termasuk `match: "prefix"` untuk `/transactions`)

## Fase 5: Test & Verifikasi

- [x] Perbarui asersi `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` — asersi PB-5 lama dipertahankan (masih valid: `__root.tsx` tetap merender `Button`), lalu ditambahkan 6 test `PB-Sidebar` yang memverifikasi: `packages/ui/src/components/sidebar.tsx` ada dan mengekspor `Sidebar`/`SidebarItem`/`isSidebarItemActive`, `@repo/ui` index mengekspornya, kedua app punya wrapper re-export, kedua `__root.tsx` tidak lagi memuat `<aside` dan mengimpor `Sidebar` dari `components/ui`, serta bottom nav finance berasal dari `components/navigation/bottom-nav.tsx`
- [x] Tambahkan asersi bahwa `packages/ui/src/components/sidebar.tsx` tidak mengimpor `@tanstack/react-router`, dan bahwa item `/transactions` serta `/grocery-list` memakai `match: "prefix"`
- [x] Jalankan `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` dan pastikan seluruh test lulus (27 passed, 0 failed)
- [x] Jalankan `pnpm check-types`, `pnpm lint`, dan `pnpm build` (5/5, 5/5 dengan 52 warning pra-ada 0 error, 4/4 sukses)

## Fase 5b: Perbaikan Regresi — Sidebar Tidak Tampil di Desktop

- [x] **Perbaiki akar masalah: Tailwind tidak memindai `packages/ui`.** Gejala: sidebar tidak muncul pada viewport ≥ 768px. Penyebab: `@repo/ui` diakses lewat symlink `node_modules/` yang di-ignore oleh deteksi sumber otomatis Tailwind v4, sehingga class yang hanya ada di `packages/ui` tidak pernah di-generate. Sebelum refactor, class sidebar berada di `apps/*/routes/__root.tsx` (dipindai), jadi masalah ini laten. Bukti: pada CSS build pra-perbaikan, `md:flex` = 0 kemunculan dan `w-64` = 0 (hanya ada di `packages/ui/src/components/sidebar.tsx`), sementara `hidden` = 1 (juga dipakai file app) — akibatnya `display:none` menang di semua viewport. Diperbaiki dengan menambahkan `@source "../ui/src";` di `packages/tailwind-config/styles.css`
- [x] Verifikasi perbaikan pada CSS build kedua app: `md:flex`, `w-64`, dan `hidden` semuanya ter-generate (`md:flex=1`, `w-64=1`, `hidden=1`). Media query terkonfirmasi `@media (min-width:48rem)` = 768px
- [x] Verifikasi render nyata di browser dengan harness yang memakai CSS build asli: viewport 1056px → `display: flex`, `position: fixed`, `width: 256px`, `justify-content: space-between`; viewport 375px → `display: none` (benar, sidebar memang hanya untuk desktop)
- [x] Tambahkan guard regresi `PB-Sidebar: Tailwind scans packages/ui so @repo/ui-only classes are generated` di `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` — mengassert `@source "../ui/src"` ada di stylesheet bersama, dan CSS build memuat `.md\:flex` serta `.w-64`
- [x] Jalankan ulang seluruh gate: runner **28 passed, 0 failed**, `pnpm check-types` 5/5, `pnpm lint` 5/5, `pnpm build` 4/4

## Fase 5c: Penyelarasan Sidebar Finance dengan Habit

Konteks: sidebar finance masih berbeda dari habit — ada brand header, link manual "Buka Habit Tracker", dan `QuickThemeToggle`, tetapi tidak punya app switcher. Akar masalah: `AppSwitcher` hanya hidup di app habit dan terikat ke router habit, sehingga finance tidak punya akses.

- [x] Ekstrak `AppSwitcher` menjadi komponen bersama `packages/ui/src/components/app-switcher.tsx` yang router-agnostik — props `apps: AppSwitcherApp[]`, `activeAppId`, `onSelect(app)`, `isMobileHeader?`, `className?`, `title?`, `subtitle?`, `ariaLabel?`; seluruh markup trigger + modal (badge, section "Segera Hadir", footer tips) pindah apa adanya; `logoSrc` opsional untuk app yang memakai gambar logo alih-alih emoji
- [x] Tambahkan `export * from "./components/app-switcher";` di `packages/ui/src/index.ts`, lalu buat wrapper re-export `components/ui/app-switcher.tsx` di kedua app
- [x] Ubah `apps/habbit-tracker-web/src/components/app-switcher.tsx` menjadi thin wrapper: memetakan `APPS_REGISTRY` → `AppSwitcherApp`, meneruskan `getActiveApp(location.pathname).id` sebagai `activeAppId`, dan menangani navigasi di `onSelect` (`window.location.href` untuk `externalUrl`, `navigate({ to: route })` untuk app internal); `logoSrc` habit diisi `/favicon/favicon.svg`
- [x] Buat `apps/finance-tracker-web/src/config/apps.config.ts` berisi cermin registry (`habit-pasutri`, `grocery-list`, `couple-finances`, `couple-calendar`) dengan `href` absolut memakai `HABIT_APP_URL`, plus `CURRENT_APP_ID = "couple-finances"`
- [x] Buat `apps/finance-tracker-web/src/components/app-switcher.tsx` sebagai thin wrapper yang meneruskan daftar tersebut dan menavigasi lewat `window.location.href` (semua app saudara adalah deployment terpisah)
- [x] Ubah header sidebar finance: hapus brand "Keuangan Pasutri", ganti dengan `<AppSwitcher />` + kartu profil user (struktur sama dengan habit)
- [x] Ubah footer sidebar finance: hapus link "Buka Habit Tracker" dan baris "Tema:"/`QuickThemeToggle`, pertahankan tombol "+ Transaksi", lalu tambahkan tombol Logout bergaya sama dengan habit
- [x] Tambahkan `POST /api/auth/logout` di `apps/finance-tracker-api/src/modules/auth/auth.routes.ts` + `logout()` di `auth.controller.ts` yang memanggil `res.clearCookie("token", cookieOptions())` dengan opsi cookie identik habit (`httpOnly`, `secure` saat production, `sameSite: "lax"`, `domain` dari `COOKIE_DOMAIN`, `path: "/"`)
- [x] Tambahkan `logout()` dan `redirectAfterLogout()` di `apps/finance-tracker-web/src/services/auth.service.ts`; `redirectAfterLogout` mengarahkan ke `${HABIT_APP_URL}/login` karena sesi dimiliki app habit
- [x] Hubungkan tombol Logout di `__root.tsx` finance ke `handleLogout` dengan state `isLoggingOut` (spinner + label "Keluar...", tombol disabled saat proses berjalan)
- [x] Perbaiki emoji `couple-finances` di `apps/habbit-tracker-web/src/config/apps.config.ts` yang rusak menjadi karakter U+FFFD (`dY'�`) → `💰`
- [x] Tambahkan 12 test `PB-SidebarParity` di `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs`: komponen bersama + export index, router-agnostik (`onSelect`/`activeAppId`), wrapper di kedua app, habit jadi thin wrapper, finance menavigasi by URL + registry 4 app, header finance (AppSwitcher + profil), penghapusan brand/link/tema dari sidebar, footer (+ Transaksi + logout), endpoint logout API, service logout web, dan emoji registry bersih
- [x] Jalankan ulang seluruh gate: runner **39 passed, 0 failed**, `pnpm check-types` 5/5, `pnpm lint` 5/5 (0 error), `pnpm build` 4/4, serta verifikasi CSS build kedua app memuat `md:flex`, `w-64`, `bg-pink-100`, `bg-emerald-100`, `bg-amber-100`, `bg-blue-100`, `border-3`, `backdrop-blur-xs`, dan `h-4.5`

## Fase 5d: Perbaikan Bug Active-State Ganda pada Menu Grocery

Ditemukan saat verifikasi browser setelah Fase 5c: membuka `/grocery-list/manage` menyorot **dua** menu sekaligus ("Daftar Belanja" dan "Belanja"). Penyebabnya `match: "prefix"` pada `/grocery-list` yang ditambahkan di Fase 3 — padahal `/grocery-list/manage` dan `/grocery-list/settings` punya item menu sendiri, jadi tidak butuh prefix dari induknya.

- [x] Hapus `match: "prefix"` dari item `/grocery-list` di `apps/habbit-tracker-web/src/routes/__root.tsx` dan tambahkan komentar alasannya; `match: "prefix"` hanya dipakai bila sub-route tidak punya item sendiri (seperti `/transactions` di finance)
- [x] Perbarui asersi `PB-Sidebar: nested routes keep their parent menu item active` di runner: tetap mengassert `prefix` pada `/transactions`, tetapi sekarang mengassert `/grocery-list` **tidak** memakai `prefix`
- [x] Verifikasi di browser: `/grocery-list` → hanya "Daftar Belanja"; `/grocery-list/manage` → hanya "Belanja"; `/grocery-list/settings` → hanya "Pengaturan"; finance `/transactions` dan `/transactions/create` → hanya "Transaksi"
- [x] Jalankan ulang gate: runner **39 passed, 0 failed**, `pnpm check-types` 5/5, `pnpm lint` 5/5 (0 error, 51 warning pra-ada), `pnpm build` 4/4

## Fase 5e: Verifikasi Browser (Nyata, Bukan Hanya Statis)

- [x] Verifikasi sidebar finance di app berjalan (`http://localhost:4040`, viewport 1000×700): `display: flex`, `position: fixed`, `width: 256px`, header berisi app switcher "💰 Keuangan Pasutri | Mini App" + kartu profil "🦖 Romeo | HUSBAND", 6 item nav, footer "+ TRANSAKSI" + "Keluar"; tidak ada "Tema:", tidak ada "Buka Habit Tracker", tidak ada brand "Finance Tracker"
- [x] Verifikasi modal app switcher finance: judul "Pilih Aplikasi Pasutri", 3 app aktif (Habit Pasutri, Grocery List, Keuangan Pasutri dengan tanda centang), section "Segera Hadir" berisi "Jadwal & Kencan", footer tips tampil, `body` overflow terkunci saat modal terbuka
- [x] Verifikasi logout end-to-end: klik "Keluar" → `POST /api/auth/logout` → redirect ke `http://localhost:4041/login`; setelah itu `GET http://localhost:4040/api/auth/me` mengembalikan **401** dengan `document.cookie` kosong, membuktikan cookie `"token"` benar-benar terhapus
- [x] Verifikasi habit tetap utuh setelah `AppSwitcher` diekstrak (viewport 1056×875): `display: flex`, `position: fixed`, `width: 256px`, header "Habit Pasutri | Core App" + profil, 5 item nav, footer "BUAT HABIT | Keluar"; modal switcher tampil identik dan kini menampilkan 💰 (sebelumnya karakter rusak)
- [x] Verifikasi navigasi switcher habit: pilih "Grocery List" → `http://localhost:4041/grocery-list` dengan header trigger berubah menjadi "🛒 Grocery List" dan nav berganti ke 3 item grocery (client-side, tanpa reload)
- [x] Verifikasi sidebar tetap `display: none` di viewport 375px (mobile) dan `display: flex` pada 1056px memakai CSS build asli

## Fase 6: Closing

- [x] Verifikasi `/qa` — matrix `docs/qa/sidebar-component/test-matrix.md` (31 test case, **31/31 Passed**, automation 22/31 = 71%), laporan `docs/qa/sidebar-component/qa-report.md`
- [x] Review (`/gate`) lulus — 0 blocking finding, 12 catatan non-blocking di `docs/qa/sidebar-component/review-report.md` (5-axis `code-review-and-quality` + `security-review`)
