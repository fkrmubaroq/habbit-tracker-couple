// apps/pomodoro-tracker-web/tests/qa-web-runner.mjs
// Structural/config verification for @repo/pomodoro-tracker-web
// (docs/qa/pomodoro-app/test-matrix.md PB-2, PB-3, PB-5, PB-6, PB-7).
//
// This asserts the invariants the plan promised that cannot be observed from a
// screenshot: timestamp-based timer math, offline-queue retry rules, PWA
// manifest, cross-app registry entries and deploy wiring. The interactive
// flows (start/pause/refresh/notification) are covered by the browser pass and
// recorded in qa-report.md.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const web = path.resolve(repoRoot, "apps/pomodoro-tracker-web");
const api = path.resolve(repoRoot, "apps/pomodoro-tracker-api");
const habitWeb = path.resolve(repoRoot, "apps/habbit-tracker-web");
const financeWeb = path.resolve(repoRoot, "apps/finance-tracker-web");
const groceryWeb = path.resolve(repoRoot, "apps/grocery-tracker-web");

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
console.log("QA Suite — pomodoro web (struktural & konfigurasi)");
console.log("=================================================");

// ---------------------------------------------------------------- PB-2
test("TC7-1", "Halaman timer merangkai dial, tabs, preset, label, kontrol, ringkasan", () => {
  const page = read(path.join(web, "src/routes/index.tsx"));
  for (const component of [
    "TimerDial",
    "ModeTabs",
    "PresetChips",
    "LabelInput",
    "TimerControls",
    "SessionSummary",
  ]) {
    assert(page.includes(component), `Komponen ${component} tidak dipakai di halaman timer`);
  }
  assert(/confetti/.test(page), "Konfeti tidak dipanggil saat sesi fokus selesai");
  assert(/ModeTabs/.test(page) && /TimerDial/.test(page), "Susunan dial/tabs tidak lengkap");
});

test("TC7-2", "Engine timer menghitung sisa dari timestamp, bukan decrement", () => {
  const hook = read(path.join(web, "src/hooks/use-pomodoro-timer.ts"));
  assert(/startedAt/.test(hook), "State tidak menyimpan startedAt");
  assert(/pausedAccumMs/.test(hook), "State tidak menyimpan akumulasi pause");
  assert(/Date\.now\(\)/.test(hook), "Sisa waktu tidak dihitung dari Date.now()");
  assert(
    /setInterval/.test(hook),
    "Tidak ada interval re-render (dibutuhkan untuk countdown)"
  );
  // The interval must not be the source of truth: no `remaining - 1` style
  // decrement of the displayed time.
  assert(
    !/remaining\s*-\s*1\b/.test(hook) && !/remainingMs\s*-\s*1000\b/.test(hook),
    "Sisa waktu didecrement manual (bukan timestamp-based)"
  );
  assert(
    /durationOverride/.test(hook),
    "Tidak ada penanda durasi custom per sesi"
  );
});

test("TC7-12", "Input label dibatasi 80 karakter dan menampilkan counter", () => {
  const label = read(path.join(web, "src/components/timer/label-input.tsx"));
  assert(/const MAX_LENGTH = 80;/.test(label), "Konstanta batas 80 karakter tidak ada");
  assert(/maxLength=\{MAX_LENGTH\}/.test(label), "maxLength tidak diset dari MAX_LENGTH");
  assert(/\{value\.length\}\/\{MAX_LENGTH\}/.test(label), "Counter karakter tidak ditampilkan");
  const hook = read(path.join(web, "src/hooks/use-pomodoro-timer.ts"));
  assert(/label\.slice\(0, 80\)/.test(hook), "Engine tidak memotong label di 80 karakter");
});

test("TC7-13", "Preset menyimpan ketiga durasi ke server, bukan hanya durasi aktif", () => {
  const page = read(path.join(web, "src/routes/index.tsx"));
  const preset = read(path.join(web, "src/components/timer/preset-chips.tsx"));
  assert(/focus_minutes/.test(page), "Preset tidak mengirim focus_minutes");
  assert(/short_break_minutes/.test(page), "Preset tidak mengirim short_break_minutes");
  assert(/long_break_minutes/.test(page), "Preset tidak mengirim long_break_minutes");
  assert(
    /updateSettings|updateSettingsMutation|settingsMutation/.test(page),
    "Preset tidak memanggil updateSettings"
  );
  assert(/25 \/ 5 \/ 15/.test(preset), "Preset 25/5/15 tidak ada");
  assert(/50 \/ 10 \/ 20/.test(preset), "Preset 50/10/20 tidak ada");
  assert(/90 \/ 20 \/ 30/.test(preset), "Preset 90/20/30 tidak ada");
  assert(/Custom/.test(preset), "Opsi Custom tidak ada");
});

test("TC7-14", "Durasi custom hanya berlaku untuk sesi berjalan", () => {
  const hook = read(path.join(web, "src/hooks/use-pomodoro-timer.ts"));
  const page = read(path.join(web, "src/routes/index.tsx"));

  // Custom chip → engine-local override, never a server default.
  assert(
    /onCustom=\{\(minutes\) => timer\.setPlannedMinutes\(minutes\)\}/.test(page),
    "Chip Custom tidak memanggil setPlannedMinutes"
  );
  const setter = hook.slice(hook.indexOf("const setPlannedMinutes"), hook.indexOf("const setLabel"));
  assert(/durationOverride: true/.test(setter), "setPlannedMinutes tidak menandai durationOverride");

  // Preset chip → server defaults (the opposite path).
  assert(
    /onSelect=\{\(preset\) => presetMutation\.mutate\(preset\)\}/.test(page),
    "Chip preset tidak menyimpan ke server"
  );

  // The server-default sync must skip while an override is active, otherwise a
  // custom 1-minute session would be overwritten by the saved 25.
  assert(
    /if \(state\.durationOverride\) return;/.test(hook),
    "Sinkronisasi durasi server tidak menghormati durationOverride"
  );
});

test("TC7-15", "Layout responsif: BottomNav hanya di mobile, konten tidak tertutup", () => {
  const nav = read(path.join(web, "src/components/navigation/bottom-nav.tsx"));
  const root = read(path.join(web, "src/routes/__root.tsx"));
  assert(/md:hidden/.test(nav), "BottomNav tidak disembunyikan di layar >= md");
  assert(/fixed bottom-0/.test(nav), "BottomNav tidak menempel di bawah");
  assert(
    /pb-24 md:pb-8/.test(root),
    "Konten utama tidak menyisakan padding bawah untuk BottomNav di mobile"
  );
  // The timer card must stay usable on a 360px viewport: no fixed min-width.
  const page = read(path.join(web, "src/routes/index.tsx"));
  assert(!/min-w-\[(4|5|6)\d\dpx\]/.test(page), "Halaman timer punya min-width kaku");
});

// ---------------------------------------------------------------- PB-3
test("TC8-1", "Halaman pengaturan punya form durasi, interval, dan auto-start", () => {
  const page = read(path.join(web, "src/routes/settings.tsx"));
  for (const id of [
    "focus-minutes",
    "short-break-minutes",
    "long-break-minutes",
    "long-break-interval",
  ]) {
    assert(page.includes(`id="${id}"`), `Field ${id} tidak ada`);
  }
  assert(/auto_start_break/.test(page), "Toggle auto_start_break tidak ada");
  assert(/Simpan durasi/.test(page), "Tombol simpan durasi tidak ada");
});

test("TC8-4", "Izin notifikasi diminta lewat tombol, bukan otomatis saat load", () => {
  const page = read(path.join(web, "src/routes/settings.tsx"));
  const alerts = read(path.join(web, "src/hooks/use-timer-alerts.ts"));

  assert(/Notification\.requestPermission\(\)/.test(page), "Halaman Pengaturan tidak meminta izin");
  assert(
    /onClick=\{handleRequestPermission\}/.test(page),
    "Permintaan izin tidak terpasang pada tombol"
  );
  // No effect may prompt on mount — a permission dialog nobody clicked is a
  // dark pattern and gets denied permanently by some browsers.
  assert(
    !/useEffect\([\s\S]{0,500}?requestPermission\(\)/.test(alerts),
    "use-timer-alerts meminta izin otomatis dari effect"
  );
  const root = read(path.join(web, "src/routes/index.tsx"));
  assert(
    !/requestPermission/.test(root),
    "Halaman timer meminta izin notifikasi sendiri"
  );
});

test("TC8-5", "Mute suara disimpan per device (localStorage)", () => {
  const store = read(path.join(web, "src/stores/preferences.store.ts"));
  assert(/localStorage/.test(store), "Preferensi tidak memakai localStorage");
  assert(/soundMuted|muted/.test(store), "Tidak ada preferensi mute suara");
  assert(/notification/.test(store), "Tidak ada preferensi notifikasi");
});

test("TC8-6", "Countdown tampil di document.title saat timer berjalan", () => {
  const alerts = read(path.join(web, "src/hooks/use-timer-alerts.ts"));
  assert(/document\.title/.test(alerts), "document.title tidak diubah");
  assert(/Fokus/.test(alerts) && /Break/.test(alerts), "Label mode tidak ikut di title");
  assert(/idle|reset|Pomodoro/.test(alerts), "Title tidak dikembalikan saat timer tidak berjalan");
});

test("TC8-7", "Tema default Sakura dan pilihan tema tersimpan", () => {
  const store = read(path.join(web, "src/stores/theme.store.ts"));
  const html = read(path.join(web, "index.html"));
  const settings = read(path.join(web, "src/routes/settings.tsx"));
  assert(/Sakura/.test(store), "Tema default bukan Sakura di store");
  assert(/data-theme="Sakura"/.test(html), "index.html tidak memakai tema Sakura");
  assert(/localStorage/.test(store), "Tema tidak dipersist");
  assert(/ThemeSwitcherSection/.test(settings), "ThemeSwitcher tidak ada di /settings");
});

// ---------------------------------------------------------------- PB-5
test("TC10-3", "Antrean offline hanya membuang payload yang ditolak 4xx", () => {
  const hook = read(path.join(web, "src/hooks/use-offline-queue.ts"));
  const queue = read(path.join(web, "src/services/pending-queue.ts"));
  const apiErrors = read(path.join(web, "src/services/api-errors.ts"));
  const deviceState = read(path.join(web, "src/services/device-state.ts"));
  assert(/isTransientError/.test(queue), "Antrean tidak memakai isTransientError");
  assert(/export function isTransientError/.test(apiErrors), "Helper isTransientError tidak ada");
  assert(
    /status === undefined \|\| status >= 500/.test(apiErrors),
    "Aturan transien bukan `tanpa status atau >= 500`"
  );
  assert(
    /DEVICE_STATE_KEYS\.pendingSessions/.test(queue) && /localStorage/.test(deviceState),
    "Antrean tidak dipersist di localStorage"
  );
  assert(/online/.test(hook), "Antrean tidak flush saat event online");
});

test("TC10-4", "Manifest PWA memakai identitas Pomodoro dan base /pomodoro/", () => {
  const vite = read(path.join(web, "vite.config.ts"));
  assert(/name:\s*"Pomodoro"/.test(vite), "Nama manifest bukan Pomodoro");
  assert(/short_name:\s*"Pomodoro"/.test(vite), "short_name bukan Pomodoro");
  assert(/lang:\s*"id"/.test(vite), "lang manifest bukan id");
  assert(/registerType:\s*"autoUpdate"/.test(vite), "registerType bukan autoUpdate");
  assert(/192x192/.test(vite) && /512x512/.test(vite), "Ikon 192/512 tidak dideklarasikan");
  assert(/base:\s*["'`]\/pomodoro\//.test(vite) || /\/pomodoro\//.test(vite), "base /pomodoro/ tidak diset");
  assert(exists(path.join(web, "public/robots.txt")), "robots.txt tidak ada");
});

test("TC10-5", "App shell di-precache service worker", () => {
  const swPath = path.join(web, "dist/sw.js");
  assert(exists(swPath), "dist/sw.js belum ada — jalankan `pnpm build` dulu");
  const sw = read(swPath);
  assert(/precache/i.test(sw), "Service worker tidak memuat precache");
  const manifestPath = path.join(web, "dist/manifest.webmanifest");
  assert(exists(manifestPath), "manifest.webmanifest tidak dihasilkan");
  const manifest = JSON.parse(read(manifestPath));
  assert(manifest.start_url === ".", `start_url harus relatif, dapat ${manifest.start_url}`);
  assert(manifest.scope === ".", `scope harus relatif, dapat ${manifest.scope}`);
  assert(manifest.icons?.length >= 2, "Manifest tidak memuat ikon 192 & 512");
});

test("TC10-6", "Sesi offline bertahan: hanya 401 yang memaksa login ulang", () => {
  const hook = read(path.join(web, "src/hooks/use-session.ts"));
  const deviceState = read(path.join(web, "src/services/device-state.ts"));
  assert(/DEVICE_STATE_KEYS\.sessionCache/.test(hook), "Sesi tidak di-cache untuk mode offline");
  assert(/status === 401/.test(hook), "Tidak ada pengecekan khusus status 401");
  assert(/localStorage/.test(deviceState), "Cache sesi tidak memakai localStorage");
  const auth = read(path.join(web, "src/services/auth.service.ts"));
  assert(
    /clearDeviceState\(/.test(auth) && /sessionCache/.test(deviceState),
    "Cache sesi tidak dibersihkan saat logout"
  );
});

test("TC14-7", "Aturan kepemilikan terpusat & 401 dipisahkan dari 4xx", () => {
  const deviceState = read(path.join(web, "src/services/device-state.ts"));
  const apiErrors = read(path.join(web, "src/services/api-errors.ts"));
  const queue = read(path.join(web, "src/hooks/use-offline-queue.ts"));
  const queueService = read(path.join(web, "src/services/pending-queue.ts"));
  const timer = read(path.join(web, "src/services/timer-storage.ts"));
  const pomodoro = read(path.join(web, "src/services/pomodoro.service.ts"));

  // One ownership rule, not an `if (userId)` in every module.
  for (const helper of ["belongsTo", "readOwned", "writeOwned", "clearDeviceState"]) {
    assert(
      new RegExp(`export function ${helper}`).test(deviceState),
      `Helper kepemilikan ${helper} tidak ada di device-state.ts`
    );
  }
  for (const [name, source] of [
    ["use-offline-queue", queue],
    ["pending-queue", queueService],
    ["timer-storage", timer],
    ["pomodoro.service", pomodoro],
  ]) {
    assert(
      /from "\.\.?\/?.*device-state"/.test(source) || /from "\.\/device-state"/.test(source),
      `${name} tidak memakai helper kepemilikan`
    );
  }

  // 401/403 is "not signed in", not "payload refused".
  assert(
    /export function isUnauthenticatedError/.test(apiErrors),
    "isUnauthenticatedError tidak ada di api-errors.ts"
  );
  assert(
    /status === 401 \|\| status === 403/.test(apiErrors),
    "isUnauthenticatedError tidak membatasi ke 401/403"
  );
  assert(
    /status === undefined \|\| status >= 500/.test(apiErrors),
    "isTransientError berubah dari `tanpa status atau >= 500`"
  );

  // Both queue paths must consult 401 before the generic 4xx drop.
  for (const [name, source] of [
    ["use-offline-queue (submit)", queue],
    ["pending-queue (flush)", queueService],
  ]) {
    assert(
      /isUnauthenticatedError/.test(source),
      `${name} tidak memakai isUnauthenticatedError`
    );
  }
  const submitBranch = queue.slice(queue.indexOf("const submit ="));
  assert(
    submitBranch.indexOf("isUnauthenticatedError") < submitBranch.indexOf("isTransientError"),
    "submit() memeriksa isTransientError sebelum isUnauthenticatedError"
  );
  const flushBody = queueService.slice(queueService.indexOf("export async function flushPendingSessions"));
  assert(
    /isUnauthenticatedError\(error\)\) break/.test(flushBody),
    "flush() tidak berhenti pada 401 (sisa antrean akan ikut dicoba)"
  );

  // Timer and settings are read for a specific owner.
  assert(/export function loadTimer\(userId/.test(timer), "loadTimer tidak menerima userId");
  assert(/export function saveTimer\(userId/.test(timer), "saveTimer tidak menerima userId");
  assert(/async getSettings\(userId/.test(pomodoro), "getSettings tidak menerima userId");
});

// ---------------------------------------------------------------- PB-5 (review pass 3)
// The probe drives the queue's delivery loop and the timer slots directly, so
// the interleavings that caused B6/B7 fail deterministically instead of
// depending on a browser hitting the right window.
const probeResults = (() => {
  try {
    const output = execFileSync(
      path.join(web, "node_modules/.bin/tsx"),
      [path.join(web, "tests/pomodoro-state-probe.mts")],
      { cwd: web, encoding: "utf8" }
    );
    const map = new Map();
    for (const line of output.split("\n")) {
      const match = line.match(/^\[(TC\d+-\d+)\] .*\.\.\. (PASSED|FAILED)/);
      if (match) map.set(match[1], match[2]);
    }
    return map;
  } catch (error) {
    const stdout = String(error.stdout ?? "");
    const map = new Map();
    for (const line of stdout.split("\n")) {
      const match = line.match(/^\[(TC\d+-\d+)\] .*\.\.\. (PASSED|FAILED)/);
      if (match) map.set(match[1], match[2]);
    }
    return map;
  }
})();

function assertProbe(id) {
  const status = probeResults.get(id);
  assert(status === "PASSED", `probe ${id} tidak lulus (dapat ${status ?? "tidak dijalankan"})`);
}

test("TC15-1", "Sesi yang masuk antrean saat flush berjalan tidak ikut terhapus (B6)", () => {
  assertProbe("TC15-1");
});

test("TC15-2", "Entri terkirim tidak dikirim ulang, 401 menunda, 400 membuang (B5/B6)", () => {
  assertProbe("TC15-2");
});

test("TC15-3", "Run timer pasangan bertahan di slotnya sendiri (B7)", () => {
  assertProbe("TC15-3");
  const timer = read(path.join(web, "src/services/timer-storage.ts"));
  const deviceState = read(path.join(web, "src/services/device-state.ts"));
  assert(/export function activeTimerKey\(userId/.test(deviceState), "Kunci timer tidak per pemilik");
  assert(/activeTimerKey\(userId\)/.test(timer), "timer-storage tidak memakai slot per pemilik");
});

test("TC15-4", "Logout hanya membersihkan slot timer milik akun yang keluar (B7)", () => {
  assertProbe("TC15-4");
  const auth = read(path.join(web, "src/services/auth.service.ts"));
  const root = read(path.join(web, "src/routes/__root.tsx"));
  assert(/clearDeviceState\(userId\)/.test(auth), "logout tidak meneruskan userId ke clearDeviceState");
  assert(/logout\(user\?\.id\)/.test(root), "Pemanggil logout tidak mengirim id akun");
});

// ---------------------------------------------------------------- PB-6
test("TC11-1", "Habit app mendaftarkan Pomodoro di AppSwitcher", () => {
  const config = read(path.join(habitWeb, "src/config/apps.config.ts"));
  assert(/id: "pomodoro"/.test(config), "Entri pomodoro tidak ada di registry habit");
  assert(/POMODORO_APP_URL/.test(config), "POMODORO_APP_URL tidak dipakai");
  assert(/externalUrl:\s*POMODORO_APP_URL/.test(config), "Entri pomodoro bukan external URL");
});

test("TC11-2", "Finance app mendaftarkan Pomodoro di AppSwitcher", () => {
  const config = read(path.join(financeWeb, "src/config/apps.config.ts"));
  const urls = read(path.join(financeWeb, "src/services/session-url.ts"));
  assert(/id: "pomodoro"/.test(config), "Entri pomodoro tidak ada di registry finance");
  assert(/href:\s*POMODORO_APP_URL/.test(config), "href pomodoro bukan POMODORO_APP_URL");
  assert(/external:\s*true/.test(config), "Entri pomodoro tidak ditandai external");
  assert(/VITE_POMODORO_APP_URL/.test(urls), "Env VITE_POMODORO_APP_URL tidak dibaca");
});

test("TC11-3", "Grocery app mendaftarkan Pomodoro di AppSwitcher", () => {
  const config = read(path.join(groceryWeb, "src/config/apps.config.ts"));
  const urls = read(path.join(groceryWeb, "src/services/session-url.ts"));
  assert(/id: "pomodoro"/.test(config), "Entri pomodoro tidak ada di registry grocery");
  assert(/href:\s*POMODORO_APP_URL/.test(config), "href pomodoro bukan POMODORO_APP_URL");
  assert(/VITE_POMODORO_APP_URL/.test(urls), "Env VITE_POMODORO_APP_URL tidak dibaca");
});

test("TC11-4", "Ketiga app menyediakan VITE_POMODORO_APP_URL di .env.example", () => {
  for (const app of [habitWeb, financeWeb, groceryWeb]) {
    const file = path.join(app, ".env.example");
    assert(exists(file), `.env.example tidak ada di ${path.basename(app)}`);
    assert(
      /VITE_POMODORO_APP_URL=http:\/\/localhost:4043/.test(read(file)),
      `.env.example ${path.basename(app)} tidak memuat VITE_POMODORO_APP_URL`
    );
  }
});

// ---------------------------------------------------------------- PB-7
test("TC12-1", "Root package.json menyediakan script DB pomodoro", () => {
  const pkg = JSON.parse(read(path.join(repoRoot, "package.json")));
  assert(
    pkg.scripts["db:migrate:pomodoro"]?.includes("@repo/pomodoro-tracker-api"),
    "Script db:migrate:pomodoro tidak ada/ salah filter"
  );
  assert(
    pkg.scripts["db:seed:pomodoro"]?.includes("@repo/pomodoro-tracker-api"),
    "Script db:seed:pomodoro tidak ada/ salah filter"
  );
});

test("TC12-2", "Nginx menyajikan /pomodoro/ dan mem-proxy /api/pomodoro/", () => {
  const nginx = read(path.join(repoRoot, "scripts/nginx.conf"));
  assert(/location \^~ \/pomodoro\//.test(nginx), "location /pomodoro/ tidak ada");
  assert(/try_files \$uri \$uri\/ \/pomodoro\/index\.html/.test(nginx), "SPA fallback pomodoro tidak ada");
  assert(/location \/api\/pomodoro\//.test(nginx), "location /api/pomodoro/ tidak ada");
  assert(/proxy_pass http:\/\/127\.0\.0\.1:5053\/api\/pomodoro\//.test(nginx), "Proxy pomodoro bukan ke :5053");
  // Longest-prefix wins only if the pomodoro block precedes the generic /api/.
  assert(
    nginx.indexOf("/api/pomodoro/") < nginx.indexOf("location /api/ {"),
    "Blok /api/pomodoro/ harus dideklarasikan sebelum /api/"
  );
});

test("TC12-3", "deploy.sh mengirim kedua app pomodoro dan mendaftarkan PM2", () => {
  const deploy = read(path.join(repoRoot, "scripts/deploy.sh"));
  assert(/pomodoro-backend/.test(deploy), "Folder pomodoro-backend tidak dikirim");
  assert(/pomodoro-frontend/.test(deploy), "Folder pomodoro-frontend tidak dikirim");
  assert(/pomodoro-tracker-api\/dist/.test(deploy), "dist API pomodoro tidak dikirim");
  assert(/pomodoro-tracker-web\/dist/.test(deploy), "dist web pomodoro tidak dikirim");
  assert(/pm2 start dist\/index\.js --name pomodoro-backend/.test(deploy), "PM2 pomodoro tidak didaftarkan");
});

test("TC12-4", "AGENTS.md memuat app, port, perintah DB, dan aturan pomodoro", () => {
  const agents = read(path.join(repoRoot, "AGENTS.md"));
  assert(/apps\/pomodoro-tracker-api/.test(agents), "Struktur direktori API pomodoro tidak ada");
  assert(/apps\/pomodoro-tracker-web/.test(agents), "Struktur direktori web pomodoro tidak ada");
  assert(/db:migrate:pomodoro/.test(agents), "Perintah db:migrate:pomodoro tidak didokumentasikan");
  assert(/5053/.test(agents) && /4043/.test(agents), "Port 4043/5053 tidak didokumentasikan");
  assert(/APP_TIMEZONE/.test(agents), "APP_TIMEZONE tidak didokumentasikan");
});

test("TC12-5", "Kedua app punya artefak build dan script quality gate", () => {
  for (const app of [api, web]) {
    const pkg = JSON.parse(read(path.join(app, "package.json")));
    for (const script of ["build", "check-types", "lint"]) {
      assert(pkg.scripts[script], `${path.basename(app)} tidak punya script ${script}`);
    }
  }
  assert(exists(path.join(api, "dist/index.js")), "dist/index.js API belum ada — jalankan build");
  assert(exists(path.join(web, "dist/index.html")), "dist/index.html web belum ada — jalankan build");
});

console.log("-------------------------------------------------");
console.log(`HASIL: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("Detail kegagalan:");
  for (const r of results.filter((x) => x.status === "Failed")) {
    console.log(` - ${r.id}: ${r.error}`);
  }
  process.exitCode = 1;
}
