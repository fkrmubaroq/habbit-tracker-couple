// apps/grocery-tracker-web/tests/qa-web-runner.mjs
// Static/structural verification for the grocery split (docs/qa/grocery-app-split/test-matrix.md).
// Complements the browser E2E pass: asserts the code/config invariants the plan promised.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const groceryWeb = path.resolve(repoRoot, "apps/grocery-tracker-web");
const groceryApi = path.resolve(repoRoot, "apps/grocery-tracker-api");
const habitWeb = path.resolve(repoRoot, "apps/habbit-tracker-web");
const habitApi = path.resolve(repoRoot, "apps/habbit-tracker-api");

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function exists(file) {
  return fs.existsSync(file);
}

function test(id, name, fn) {
  process.stdout.write(`[${id}] ${name}... `);
  try {
    fn();
    passed++;
    console.log("PASSED");
    results.push({ id, name, status: "Passed", error: null });
  } catch (err) {
    failed++;
    console.log(`FAILED -> ${err.message}`);
    results.push({ id, name, status: "Failed", error: err.message });
  }
}

console.log("=================================================");
console.log("QA Suite — grocery split (static & config)");
console.log("=================================================");

// ---------------------------------------------------------------- TC6-1
test("TC6-1", "Shell grocery memakai Sidebar @repo/ui dengan 3 menu", () => {
  const root = read(path.join(groceryWeb, "src/routes/__root.tsx"));
  assert(/from "\.\.\/components\/ui\/sidebar"/.test(root), "Sidebar tidak diimpor dari wrapper @repo/ui");
  const sidebarWrapper = read(path.join(groceryWeb, "src/components/ui/sidebar.tsx"));
  assert(/from "@repo\/ui"/.test(sidebarWrapper), "Wrapper sidebar bukan re-export @repo/ui");
  assert(/label: "Daftar Belanja", to: "\/"/.test(root), "Menu Daftar Belanja tidak ada");
  assert(/label: "Belanja", to: "\/manage"/.test(root), "Menu Belanja tidak ada");
  assert(/label: "Pengaturan", to: "\/settings"/.test(root), "Menu Pengaturan tidak ada");
  const items = root.match(/navItems: SidebarItem\[\] = \[[\s\S]*?\];/);
  assert(items, "navItems tidak ditemukan");
  assert((items[0].match(/to: "/g) || []).length === 3, "Jumlah menu bukan 3");
  assert(!/match: "prefix"/.test(items[0]), "Menu memakai prefix match (bisa menyorot 2 menu)");
});

// ---------------------------------------------------------------- TC6-2
test("TC6-2", "Bottom nav mobile dirender dengan navItems yang sama", () => {
  const root = read(path.join(groceryWeb, "src/routes/__root.tsx"));
  assert(/<BottomNav items=\{navItems\}/.test(root), "BottomNav tidak menerima navItems yang sama");
  const bottomNav = read(path.join(groceryWeb, "src/components/navigation/bottom-nav.tsx"));
  assert(/md:hidden/.test(bottomNav), "BottomNav tidak disembunyikan di desktop");
  assert(/isSidebarItemActive/.test(bottomNav), "BottomNav tidak memakai isSidebarItemActive");
});

// ---------------------------------------------------------------- TC6-3
test("TC6-3", "App switcher memuat 4 app dengan grocery aktif", () => {
  const config = read(path.join(groceryWeb, "src/config/apps.config.ts"));
  for (const id of ["habit-pasutri", "grocery-list", "couple-finances", "couple-calendar"]) {
    assert(config.includes(`id: "${id}"`), `App "${id}" tidak ada di registry`);
  }
  assert(/CURRENT_APP_ID = "grocery-list"/.test(config), "CURRENT_APP_ID bukan grocery-list");
  assert(/Segera Hadir/.test(config), "Calendar tidak berstatus Segera Hadir");
  const switcher = read(path.join(groceryWeb, "src/components/app-switcher.tsx"));
  assert(/activeAppId=\{CURRENT_APP_ID\}/.test(switcher), "Switcher tidak menandai app aktif");
});

// ---------------------------------------------------------------- TC6-4
test("TC6-4", "Theme store & ThemeSwitcher terpasang", () => {
  const store = read(path.join(groceryWeb, "src/stores/theme.store.ts"));
  assert(/localStorage/.test(store), "Theme store tidak memakai localStorage");
  assert(/theme/.test(store), "Theme store tidak menyimpan key theme");
  const html = read(path.join(groceryWeb, "index.html"));
  assert(/data-theme="Sakura"/.test(html), "index.html tidak punya tema default Sakura");
  const settings = read(path.join(groceryWeb, "src/routes/settings.tsx"));
  assert(/ThemeSwitcherSection/.test(settings), "ThemeSwitcherSection tidak dipakai di /settings");
});

// ---------------------------------------------------------------- TC7-2 / TC8 / TC9
test("TC7-2", "Halaman checklist punya quick add + filter kategori", () => {
  const page = read(path.join(groceryWeb, "src/routes/index.tsx"));
  assert(/Tambah cepat/.test(page), "Input quick add tidak ada");
  assert(/quickAddMutation/.test(page), "Mutation quick add tidak ada");
  assert(/CATEGORIES/.test(page), "Daftar kategori filter tidak ada");
});

test("TC8-1", "Halaman manage punya create/update/delete/clear", () => {
  const page = read(path.join(groceryWeb, "src/routes/manage.tsx"));
  assert(/createMutation/.test(page), "createMutation tidak ada");
  assert(/updateMutation/.test(page), "updateMutation tidak ada");
  assert(/deleteMutation/.test(page), "deleteMutation tidak ada");
  assert(/clearCompletedMutation/.test(page), "clearCompletedMutation tidak ada");
});

test("TC9-1", "Halaman settings punya salin/reset/hapus semua", () => {
  const page = read(path.join(groceryWeb, "src/routes/settings.tsx"));
  assert(/clipboard/i.test(page), "Fitur salin clipboard tidak ada");
  assert(/Reset Semua Centang/.test(page), "Tombol reset centang tidak ada");
  assert(/Hapus Semua Barang/.test(page), "Tombol hapus semua tidak ada");
  assert(/HABIT_APP_URL/.test(page), "Pintas ke habit app tidak ada");
  assert(/FINANCE_APP_URL/.test(page), "Pintas ke finance app tidak ada");
});

// ---------------------------------------------------------------- TC10-1
test("TC10-1", "Kegagalan API memunculkan error state, bukan data palsu", () => {
  const serviceRaw = read(path.join(groceryWeb, "src/services/grocery.service.ts"));
  // komentar yang menjelaskan "tidak ada localStorage" tidak dihitung sebagai pemakaian
  const service = serviceRaw
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//") && !line.trim().startsWith("/*"))
    .join("\n");
  assert(!/saveLocalItems|localStorage/.test(service), "Masih ada fallback localStorage di service");
  assert(!/ensureInitialSampleData/.test(service), "Masih ada generator data contoh palsu");
  for (const page of ["index.tsx", "manage.tsx"]) {
    const src = read(path.join(groceryWeb, "src/routes", page));
    assert(/isError/.test(src), `${page} tidak menangani isError`);
    assert(/onError/.test(src), `${page} tidak punya onError pada mutation`);
  }
});

// ---------------------------------------------------------------- TC10-2
test("TC10-2", "localStorage hanya dipakai untuk tema", () => {
  const srcDir = path.join(groceryWeb, "src");
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !full.endsWith("theme.store.ts")) {
        const content = read(full);
        // komentar yang menyebut localStorage tidak dihitung
        const code = content
          .split("\n")
          .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
          .join("\n");
        if (/localStorage\.(setItem|getItem|removeItem)/.test(code)) offenders.push(full);
      }
    }
  };
  walk(srcDir);
  assert(offenders.length === 0, `localStorage dipakai di: ${offenders.join(", ")}`);
});

// ---------------------------------------------------------------- TC11-3
test("TC11-3", "Shim redirect habit menangani root + semua sub-path", () => {
  assert(exists(path.join(habitWeb, "src/routes/grocery-list.tsx")), "Shim /grocery-list tidak ada");
  assert(exists(path.join(habitWeb, "src/routes/grocery-list.$.tsx")), "Shim splat tidak ada");
  const helper = read(path.join(habitWeb, "src/lib/grocery-redirect.ts"));
  assert(/replace\(\/\^\\\/grocery-list\//.test(helper), "Helper tidak memetakan suffix path");
  assert(/window\.location\.replace/.test(helper), "Helper tidak memakai location.replace");
  const tree = read(path.join(habitWeb, "src/routeTree.gen.ts"));
  assert(/'\/grocery-list'/.test(tree), "Route /grocery-list tidak terdaftar di routeTree");
  assert(/'\/grocery-list\/\$'/.test(tree), "Route /grocery-list/$ tidak terdaftar di routeTree");
  assert(!/'\/grocery-list\/manage'/.test(tree), "Route /grocery-list/manage masih terdaftar");
  assert(!/'\/grocery-list\/settings'/.test(tree), "Route /grocery-list/settings masih terdaftar");
});

// ---------------------------------------------------------------- TC12-1
test("TC12-1", "Habit app bersih dari grocery", () => {
  assert(!exists(path.join(habitWeb, "src/routes/grocery-list")), "Folder routes/grocery-list masih ada");
  assert(!exists(path.join(habitWeb, "src/services/grocery.service.ts")), "grocery.service.ts masih ada");
  assert(
    !exists(path.join(habitWeb, "src/components/navigation/grocery-bottom-nav.tsx")),
    "grocery-bottom-nav.tsx masih ada"
  );
  const root = read(path.join(habitWeb, "src/routes/__root.tsx"));
  assert(!/groceryNavItems/.test(root), "groceryNavItems masih ada di __root");
  assert(!/grocery\.add_item/.test(root), "Quick action grocery masih ada di __root");
  const bottomNav = read(path.join(habitWeb, "src/components/navigation/bottom-navigation.tsx"));
  assert(!/GroceryBottomNav/.test(bottomNav), "BottomNavigation masih merujuk GroceryBottomNav");
});

// ---------------------------------------------------------------- TC12-2
test("TC12-2", "Entri grocery di registry habit memakai externalUrl", () => {
  const config = read(path.join(habitWeb, "src/config/apps.config.ts"));
  const entry = config.match(/\{\s*id: "grocery-list"[\s\S]*?\n  \},/);
  assert(entry, "Entri grocery-list tidak ditemukan");
  assert(/externalUrl: GROCERY_APP_URL/.test(entry[0]), "Entri grocery tidak memakai externalUrl");
  assert(!/route: "\/grocery-list"/.test(entry[0]), "Entri grocery masih memakai route internal");
  assert(!/primaryAction/.test(entry[0]), "Entri grocery masih punya primaryAction internal");
  const switcher = read(path.join(habitWeb, "src/components/app-switcher.tsx"));
  assert(/external: Boolean\(app\.externalUrl\)/.test(switcher), "Switcher tidak membaca externalUrl");
});

// ---------------------------------------------------------------- TC13-1
test("TC13-1", "Root script db:migrate:grocery & db:seed:grocery", () => {
  const pkg = JSON.parse(read(path.join(repoRoot, "package.json")));
  assert(
    pkg.scripts["db:migrate:grocery"] === "turbo run db:migrate --filter=@repo/grocery-tracker-api",
    `db:migrate:grocery salah: ${pkg.scripts["db:migrate:grocery"]}`
  );
  assert(
    pkg.scripts["db:seed:grocery"] === "turbo run db:seed --filter=@repo/grocery-tracker-api",
    `db:seed:grocery salah: ${pkg.scripts["db:seed:grocery"]}`
  );
  const apiPkg = JSON.parse(read(path.join(groceryApi, "package.json")));
  for (const script of ["dev", "build", "start", "db:migrate", "db:seed", "check-types", "lint"]) {
    assert(apiPkg.scripts[script], `script ${script} tidak ada di grocery-tracker-api`);
  }
  const webPkg = JSON.parse(read(path.join(groceryWeb, "package.json")));
  for (const script of ["dev", "build", "check-types", "lint", "preview"]) {
    assert(webPkg.scripts[script], `script ${script} tidak ada di grocery-tracker-web`);
  }
});

// ---------------------------------------------------------------- TC13-2
test("TC13-2", "Port default & proxy dev grocery", () => {
  const envSrc = read(path.join(groceryApi, "src/config/env.ts"));
  assert(/PORT: z\.coerce\.number\(\)\.default\(5052\)/.test(envSrc), "Default PORT api bukan 5052");
  const vite = read(path.join(groceryWeb, "vite.config.ts"));
  assert(/port: 4042/.test(vite), "Port dev web bukan 4042");
  assert(/target: env\.VITE_BASE_URL_API \|\| "http:\/\/localhost:5052"/.test(vite), "Proxy /api bukan ke 5052");
  assert(/changeOrigin: true/.test(vite), "Proxy tanpa changeOrigin");
  const app = read(path.join(groceryApi, "src/app.ts"));
  assert(/app\.use\("\/api\/grocery", groceryRoutes\)/.test(app), "Mount /api/grocery tidak ada");
  assert(/app\.use\("\/api\/auth", authRoutes\)/.test(app), "Mount /api/auth tidak ada");
  const apiApp = read(path.join(habitApi, "src/app.ts"));
  assert(!/api\/grocery/.test(apiApp), "Habit API masih mount /api/grocery");
});

// ---------------------------------------------------------------- TC13-3
test("TC13-3", "deploy.sh mengirim kedua app grocery + PM2 grocery-backend", () => {
  const deploy = path.join(repoRoot, "scripts/deploy.sh");
  execSync(`bash -n "${deploy}"`, { stdio: "pipe" });
  const src = read(deploy);
  assert(/grocery-backend/.test(src), "Folder grocery-backend tidak ada");
  assert(/grocery-frontend/.test(src), "Folder grocery-frontend tidak ada");
  assert(/pm2 start dist\/index\.js --name grocery-backend/.test(src), "PM2 grocery-backend tidak didaftarkan");
  assert(/apps\/grocery-tracker-api\/dist/.test(src), "dist grocery API tidak dikirim");
  assert(/apps\/grocery-tracker-web\/dist/.test(src), "dist grocery web tidak dikirim");
});

// ---------------------------------------------------------------- TC14-1
test("TC14-1", "nginx.conf merutekan /api/grocery dan /grocery", () => {
  const conf = read(path.join(repoRoot, "scripts/nginx.conf"));
  assert(/location \/api\/grocery\/ \{/.test(conf), "location /api/grocery/ tidak ada");
  assert(
    /proxy_pass http:\/\/127\.0\.0\.1:5052\/api\/grocery\/;/.test(conf),
    "proxy_pass /api/grocery bukan ke 5052"
  );
  assert(/location \^~ \/grocery\/ \{/.test(conf), "location ^~ /grocery/ tidak ada (bisa direbut regex static)");
  assert(/alias .*grocery-frontend\/dist\//.test(conf), "alias grocery-frontend tidak ada");
  assert(/try_files \$uri \$uri\/ \/grocery\/index\.html/.test(conf), "SPA fallback /grocery/index.html tidak ada");
  const groceryIdx = conf.indexOf("location /api/grocery/");
  const apiIdx = conf.indexOf("location /api/ {");
  assert(groceryIdx > -1 && apiIdx > -1 && groceryIdx < apiIdx, "Blok /api/grocery harus sebelum /api/");
});

// ---------------------------------------------------------------- TC14-2
test("TC14-2", "Build produksi grocery memakai base /grocery/", () => {
  const vite = read(path.join(groceryWeb, "vite.config.ts"));
  assert(
    /base: mode === "production" \? "\/grocery\/" : "\/"/.test(vite),
    "base produksi bukan /grocery/"
  );
  const indexPath = path.join(groceryWeb, "dist/index.html");
  if (exists(indexPath)) {
    const html = read(indexPath);
    assert(/src="\/grocery\/assets\//.test(html), "dist/index.html tidak mereferensikan /grocery/assets/");
    const manifestPath = path.join(groceryWeb, "dist/manifest.webmanifest");
    const manifest = JSON.parse(read(manifestPath));
    assert(manifest.start_url === "/grocery/", `start_url manifest salah: ${manifest.start_url}`);
    assert(manifest.scope === "/grocery/", `scope manifest salah: ${manifest.scope}`);
  }
});

// ---------------------------------------------------------------- TC14-3
test("TC14-3", "AGENTS.md mendokumentasikan grocery", () => {
  const agents = read(path.join(repoRoot, "AGENTS.md"));
  assert(/apps\/grocery-tracker-api/.test(agents), "grocery-tracker-api tidak didokumentasikan");
  assert(/apps\/grocery-tracker-web/.test(agents), "grocery-tracker-web tidak didokumentasikan");
  assert(/5052/.test(agents) && /4042/.test(agents), "Port grocery tidak didokumentasikan");
  assert(
    /JWT_SECRET`? \*\*must be identical\*\* in `habbit-tracker-api`, `finance-tracker-api`, and `grocery-tracker-api`/.test(
      agents
    ),
    "Catatan JWT_SECRET bersama tidak lengkap"
  );
  assert(/redirect shims/.test(agents), "Shim redirect tidak didokumentasikan");
  assert(/db:migrate:grocery/.test(agents), "Script grocery tidak didokumentasikan");
});

// ---------------------------------------------------------------- TC14-4
test("TC14-4", "Router grocery memakai basepath dari Vite BASE_URL", () => {
  // Regression guard for review finding B1: `base: "/grocery/"` in
  // vite.config.ts only rewrites asset URLs. TanStack Router does not read
  // BASE_URL by itself, so without an explicit `basepath` every route
  // resolves against `/` and the production build renders "Not Found" at
  // /grocery/, /grocery/manage and /grocery/settings.
  const main = read(path.join(groceryWeb, "src/main.tsx"));
  assert(/basepath:/.test(main), "createRouter tidak menyetel basepath");
  assert(
    /basepath:\s*import\.meta\.env\.BASE_URL\.replace\(\s*\/\\\/\$\/\s*,\s*""\s*\)/.test(main),
    "basepath bukan turunan import.meta.env.BASE_URL (trailing slash harus dibuang)"
  );
  const routerIdx = main.indexOf("createRouter({");
  const basepathIdx = main.indexOf("basepath:");
  assert(routerIdx > -1 && basepathIdx > routerIdx, "basepath harus berada di dalam opsi createRouter");
});

console.log("=================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=================================================");
if (failed > 0) process.exit(1);
