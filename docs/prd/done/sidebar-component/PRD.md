# PRD — Komponen `Sidebar` Bersama dengan Item Menu Dinamis

## Context

Sidebar desktop di dua web app semula ditulis inline di masing-masing `__root.tsx`:

- `apps/habbit-tracker-web/src/routes/__root.tsx` (baris 92-173) — `<aside>` dengan `AppSwitcher`, kartu profil user, daftar nav, tombol aksi cepat (habit/grocery), dan tombol logout. Item nav berasal dari dua array lokal (`habitNavItems`, `groceryNavItems`) yang dipilih lewat `getActiveApp(location.pathname)`.
- `apps/finance-tracker-web/src/routes/__root.tsx` (baris 56-142) — `<aside>` dengan brand "Keuangan Pasutri", daftar nav, kartu profil user, link "Buka Habit Tracker", `QuickThemeToggle`, dan tombol "+ Transaksi". Item nav dari array lokal `navItems`.

`packages/ui` sudah menjadi sumber komponen bersama (`Button`, `Card`, `Dialog`, `Input`, `Select`, `Textarea`) dan di-re-export oleh `apps/*/src/components/ui/`, tetapi belum memiliki komponen sidebar. Akibatnya layout `aside`, styling item, dan logika active-state diduplikasi dua kali dengan variasi kecil yang tidak disengaja.

Fase lanjutan dari plan ini menyelaraskan **isi** sidebar finance dengan habit. `AppSwitcher` semula hanya hidup di app habit dan terikat ke router habit, sehingga finance tidak bisa memakainya dan menggantinya dengan link manual "Buka Habit Tracker" + `QuickThemeToggle` lokal.

Plan ini bergantung pada konvensi yang sudah ada di `docs/prd/done/finance-web-repo-ui-components/` (pola re-export `apps/*/src/components/ui/`) dan `docs/prd/todo/shadcn-select/` (pola komponen bersama + update static runner).

## Problem / Motivation

1. **Duplikasi markup dan logika.** Dua `<aside>` ~80 baris dengan struktur sama (wrapper `fixed`, daftar `nav`, item `Link` + ikon + label) ditulis ulang; perubahan layout harus dikerjakan dua kali dan mudah menyimpang.
2. **Item menu tidak bisa dipakai ulang.** Daftar item dicampur langsung dengan markup JSX di dalam `RootComponent`, sehingga tidak ada kontrak data yang bisa diuji, dipindah, atau dipakai ulang oleh komponen navigasi lain (mis. bottom nav finance).
3. **Active-state hanya exact match, sehingga menu tidak tersorot di sub-route.** Kedua app memakai `location.pathname === item.to`. Kasus nyata yang salah: `finance-tracker-web` membuka `/transactions/create` (route `transactions_.create.tsx`) tidak menyorot menu "Transaksi".
4. **Bottom nav finance masih inline** di `__root.tsx` (baris 199-215), padahal ia memakai array `navItems` yang sama dengan sidebar — satu-satunya tempat lain yang menduplikasi daftar menu.
5. **Sidebar finance menyimpang dari habit.** Finance punya brand header sendiri, link manual "Buka Habit Tracker", dan `QuickThemeToggle` di sidebar, tetapi tidak punya app switcher. Penyebabnya arsitektural: `AppSwitcher` hanya ada di app habit dan memakai `useNavigate` + `APPS_REGISTRY` berisi route habit, sementara finance adalah deployment terpisah yang diakses habit lewat `externalUrl` (`window.location.href`). Akibatnya finance tidak pernah mendapat "sisi sebaliknya" dari switcher, sehingga muncul link manual sebagai pengganti.
6. **Finance tidak punya logout sama sekali.** Tidak ada tombol di UI, dan `apps/finance-tracker-api` hanya punya `GET /api/auth/me` — tidak ada `POST /api/auth/logout` — padahal sesi (`cookie "token"`) dipakai bersama kedua app.

## Scope

1. **Komponen baru `packages/ui/src/components/sidebar.tsx`.**
   - Mengekspor `Sidebar`, `SidebarItem` (tipe), `SidebarLinkComponent` (tipe), dan `SidebarClassNames` (tipe).
   - `Sidebar` merender elemen `<aside>` + `<nav>` + daftar item; **tidak** memiliki header/footer sendiri.
   - Menerima item menu lewat prop `items`, bukan hardcode.
2. **Ekspor di `packages/ui/src/index.ts`** — tambahkan `export * from "./components/sidebar";`.
3. **Wrapper re-export** di kedua app, mengikuti pola komponen lain:
   - `apps/habbit-tracker-web/src/components/ui/sidebar.tsx`
   - `apps/finance-tracker-web/src/components/ui/sidebar.tsx`
4. **Terapkan di `apps/habbit-tracker-web/src/routes/__root.tsx`** — ganti `<aside>` inline dengan `<Sidebar>`; `AppSwitcher` dan kartu profil dikirim lewat slot `header`; tombol aksi cepat + logout lewat slot `footer`. Array `habitNavItems`/`groceryNavItems` tetap di app (tidak dipindah ke `packages/ui`).
5. **Terapkan di `apps/finance-tracker-web/src/routes/__root.tsx`** — ganti `<aside>` inline dengan `<Sidebar>`; item menu lewat `items`.
6. **Ekstrak bottom nav finance** ke `apps/finance-tracker-web/src/components/navigation/bottom-nav.tsx` (komponen lokal app, bukan `packages/ui`), menerima `items` + `activePath` agar `__root.tsx` tetap satu sumber daftar menu.
7. **Tandai mode match per item** untuk memperbaiki bug active-state: `/transactions` → `prefix`; item lain tetap `exact` (default).
8. **Perbarui static QA runner** `apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` agar asersinya mengikuti struktur baru.
9. **Ekstrak `AppSwitcher` ke `packages/ui`** sebagai komponen router-agnostik, lalu jadikan `apps/habbit-tracker-web/src/components/app-switcher.tsx` thin wrapper di atasnya.
10. **Selaraskan sidebar finance dengan habit:**
    - Header: `<AppSwitcher />` + kartu profil user (menggantikan brand "Keuangan Pasutri").
    - Footer: tombol "+ Transaksi" + tombol Logout (menggantikan kartu profil + "Buka Habit Tracker" + "Tema:"/`QuickThemeToggle`).
    - App switcher finance memakai `apps/finance-tracker-web/src/config/apps.config.ts` berisi cermin registry (habit, grocery, finance, calendar) dengan `href` absolut.
11. **Tambahkan logout finance end-to-end:** `POST /api/auth/logout` di `apps/finance-tracker-api` yang meng-clear cookie `"token"` dengan opsi identik habit, plus `logout()`/`redirectAfterLogout()` di `apps/finance-tracker-web/src/services/auth.service.ts`.

## Design decisions

1. **"Dinamis" berarti item lewat props, bukan registry/API.** Setiap app tetap mendefinisikan array item-nya sendiri di `__root.tsx` (tempat yang sama seperti sekarang) dan mengirimkannya ke `Sidebar`. Tidak ada perubahan backend untuk navigasi, tidak ada endpoint konfigurasi menu, dan `apps.config.ts` tidak dijadikan sumber menu — file itu mengurus app switcher, bukan navigasi internal.
2. **Navigasi di-inject lewat prop `linkComponent`, bukan `Link` langsung.** `packages/ui` sengaja tidak mendependensi `@tanstack/react-router` (dependency-nya hanya Radix, cva, clsx, tailwind-merge, lucide-react). Sidebar merender `<LinkComponent to=... className=...>`; masing-masing app mengirim `Link` dari TanStack Router sehingga client-side navigation tetap jalan dan `packages/ui` tetap router-agnostic.
   - Konsekuensi tipe: `Link` TanStack generik atas `to` (union path dari route tree), sehingga tidak assignable langsung ke `React.ComponentType<SidebarLinkProps>` dengan `to: string`. Kedua call site memakai satu cast terdokumentasi `Link as SidebarLinkComponent` beserta komentar alasannya; `pnpm check-types` adalah gerbang yang membuktikan kontrak ini.
3. **Slot `header` + `footer`, bukan config object.** `Sidebar` hanya memiliki layout `aside`, wrapper body, `nav`, dan render item; sisanya ReactNode dari app. Ini menghindari prop boolean/varian yang menumpuk untuk menampung perbedaan posisi.
4. **Active-state lewat `activePath` + `match` per item.** `packages/ui` tidak bisa `useLocation`, jadi app mengirim `activePath={location.pathname}`. Tiap item punya `match?: "exact" | "prefix"` (default `"exact"`). Aturan `prefix`: cocok bila `activePath === to` atau `activePath.startsWith(to + "/")` — pemisah `/` penting agar `/grocery-list` tidak ikut cocok dengan path hipotetis `/grocery-list-settings`, dan `to: "/"` tetap berperilaku exact karena `"/" + "/"` tidak pernah jadi prefix path lain.
   - `prefix` hanya dipakai bila **tidak ada** item lain yang menutupi sub-route tersebut. `/transactions` butuh `prefix` karena `/transactions/create` tidak punya item sendiri. Sebaliknya `/grocery-list` **tidak** boleh `prefix`: `/grocery-list/manage` dan `/grocery-list/settings` punya item sendiri, sehingga `prefix` membuat dua menu menyala bersamaan (bug ditemukan saat verifikasi browser dan sudah diperbaiki).
5. **Styling tetap dipertahankan apa adanya, tidak diseragamkan.** Kedua app punya gaya item aktif berbeda (habit memakai kelas `nav-active-duo`; finance memakai `bg-highlight text-primary border-2 border-primary`), dan juga beda padding (`p-4` vs `p-5`), gap nav (`gap-2` vs `gap-1.5`), serta ikon (`h-5 w-5` vs `h-5 w-5 stroke-[2.2]`). `Sidebar` menyediakan default netral + prop `classNames` (`nav`, `item`, `itemActive`, `itemInactive`, `icon`, `label`, `body`) dan `className` untuk `<aside>`; tiap app mengirim nilainya sendiri sehingga tampilan tidak berubah.
6. **Bottom nav finance jadi komponen lokal, bukan komponen bersama.** Hanya finance yang diminta dirapikan; habit sudah punya struktur sendiri (`BottomNavigation` → `CoreBottomNav`/`GroceryBottomNav` dengan notch SVG). Menarik keduanya ke `packages/ui` akan memperluas scope ke desain ulang navigasi mobile, bukan sekadar merapikan.
7. **Tidak ada perubahan pada `nav-active-duo` atau token desain.** Komponen memakai token yang sudah ada (`card-surface`, `border-color`, `text-primary`, `text-secondary`, `highlight`, `primary`) dan tidak menambah token baru di `packages/tailwind-config/theme.css`.
8. **`packages/ui` didaftarkan eksplisit sebagai sumber Tailwind.** Tailwind v4 melewati `node_modules`, dan workspace package diakses lewat symlink `node_modules/@repo/ui`, sehingga class yang hanya muncul di `packages/ui` tidak pernah di-generate. Ini bug laten yang sudah ada sebelumnya (mis. `shadow-[0_3px_0_0_#1f2937]` pada varian `default` `Button`), tetapi baru terlihat sebagai regresi nyata ketika seluruh base class sidebar dipindah ke `packages/ui` — `hidden` tetap ter-generate (dipakai file app) sementara `md:flex` tidak, sehingga sidebar tidak pernah tampil di desktop. Diperbaiki dengan `@source "../ui/src";` di `packages/tailwind-config/styles.css`, plus guard regresi di runner.
9. **`AppSwitcher` ikut diekstrak dengan pola yang sama seperti `Sidebar`: presentasi di `packages/ui`, navigasi di app.** Komponen bersama menerima `apps`, `activeAppId`, dan `onSelect`; app habit menavigasi lewat `navigate({ to })` untuk app internal dan `window.location.href` untuk `externalUrl`, sementara finance menavigasi semuanya lewat `window.location.href` karena setiap app saudara adalah deployment terpisah. Dengan begitu kedua app benar-benar memakai markup switcher yang identik tanpa `packages/ui` mengetahui router.
10. **Finance memakai cermin registry sendiri (`config/apps.config.ts`), bukan mengimpor config habit.** Impor lintas app akan mengikat finance ke source habit dan merusak pemisahan build. Cermin ini juga menjadi tempat satu-satunya `CURRENT_APP_ID = "couple-finances"` dan URL absolut berbasis `HABIT_APP_URL`.
11. **Logout finance ditambahkan di backend, bukan dialihkan ke app habit.** Cookie `"token"` bersifat host-only dan dipakai bersama; finance API sudah punya `cookie-parser`, `env.COOKIE_DOMAIN`, dan `env.NODE_ENV`, sehingga `res.clearCookie("token", cookieOptions())` dapat meniru habit persis tanpa CORS lintas origin. Setelah cookie dibersihkan, frontend melakukan full-page redirect ke `${HABIT_APP_URL}/login` karena sesi dimiliki app habit.
12. **`QuickThemeToggle` dihapus dari sidebar finance, tetapi tetap ada di mobile header.** Mobile header finance bukan sidebar dan tidak diminta berubah; menghapusnya akan menghilangkan satu-satunya akses tema di layar kecil.

## Out of scope

1. **`BottomNav` bersama di `packages/ui`.** Bottom navigation habit (`BottomNavigation`, `CoreBottomNav`, `GroceryBottomNav`) tidak disentuh sama sekali.
2. **Mendesain ulang tampilan.** Struktur sidebar finance disamakan dengan habit, tetapi gaya khas masing-masing app (kelas item aktif, padding, ikon) tetap dipertahankan lewat `classNames`.
3. **Mobile top header** di kedua app (`<header className="md:hidden ...">`) tetap inline dan tetap memuat `QuickThemeToggle` serta link habit di finance.
4. **Menu berdasarkan role/permission** atau filter per user (husband/wife).
5. **Menu dari API backend** atau endpoint konfigurasi navigasi baru.
6. **Memindahkan array item menu ke `packages/ui` atau `apps.config.ts`.**
7. **`QuickThemeToggle`/`ThemeSwitcher`** — hanya dilepas dari sidebar finance, komponennya tidak diubah.
8. **Perubahan skema database, JWT, atau alur login/register.** Yang ditambahkan hanya endpoint logout (clear cookie).

## Success criteria

1. `packages/ui/src/components/sidebar.tsx` mengekspor `Sidebar` yang menerima `items`, `activePath`, dan `linkComponent`, serta **tidak** mengimpor `@tanstack/react-router` (diverifikasi lewat grep).
2. Kedua `__root.tsx` tidak lagi berisi elemen `<aside>` inline; sidebar dirender lewat `<Sidebar>` yang diimpor dari `components/ui` (re-export `@repo/ui`).
3. `apps/finance-tracker-web/src/routes/__root.tsx` tidak lagi berisi `<nav>` bottom nav inline; bottom nav berasal dari `components/navigation/bottom-nav.tsx`.
4. Menu "Transaksi" tersorot saat berada di `/transactions/create` (prefix). Menu grocery tepat satu yang tersorot di `/grocery-list`, `/grocery-list/manage`, dan `/grocery-list/settings`.
5. `node apps/finance-tracker-web/tests/qa-ui-components-runner.mjs` lulus dengan asersi yang diperbarui.
6. `pnpm check-types`, `pnpm lint`, dan `pnpm build` lulus di seluruh monorepo.
7. `packages/ui/src/components/app-switcher.tsx` mengekspor `AppSwitcher` yang menerima `apps`, `activeAppId`, dan `onSelect`, serta **tidak** mengimpor `@tanstack/react-router`.
8. Sidebar finance di viewport desktop berisi: app switcher + kartu profil di header, lalu nav, lalu "+ Transaksi" + Logout di footer — tanpa brand "Keuangan Pasutri", tanpa link "Buka Habit Tracker", dan tanpa `QuickThemeToggle`.
9. `POST /api/auth/logout` di finance API mengosongkan cookie `"token"`, sehingga `GET /api/auth/me` setelahnya mengembalikan 401 dan UI mengarahkan ke halaman login habit.
10. App switcher di kedua app menampilkan daftar app yang sama (Habit Pasutri, Grocery List, Keuangan Pasutri, Jadwal & Kencan) dengan app aktif yang benar.
