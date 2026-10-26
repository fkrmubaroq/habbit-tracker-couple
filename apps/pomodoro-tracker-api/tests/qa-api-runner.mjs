// apps/pomodoro-tracker-api/tests/qa-api-runner.mjs
// Automated verification for @repo/pomodoro-tracker-api
// (docs/qa/pomodoro-app/test-matrix.md PB-1).
//
// Runs against a live dev API over real HTTP. Every row it creates is tagged:
// sessions live under two temporary `qa-test-*` users that are deleted again in
// teardown, so the seeded dev data (juliet/romeo) is never touched.

import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const appRequire = createRequire(path.join(appDir, "package.json"));

const BASE_URL = process.env.POMODORO_API_URL || "http://localhost:5053";
const HABIT_API_URL = process.env.HABIT_API_URL || "http://localhost:5051";
const QA_USERNAME = process.env.QA_USERNAME || "juliet";
const PARTNER_USERNAME = process.env.QA_PARTNER_USERNAME || "romeo";
const QA_PASSWORD = process.env.QA_PASSWORD || "password123";
const TAG = `qa-test-${Date.now()}`;

const rawFetch = fetch;

let authCookie = "";
let partnerCookie = "";

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function login(username) {
  const res = await rawFetch(`${HABIT_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: QA_PASSWORD }),
  });

  if (res.status !== 200) {
    throw new Error(
      `Login "${username}" ke ${HABIT_API_URL} gagal (${res.status}). ` +
        `Jalankan "pnpm db:seed" atau set QA_USERNAME/QA_PASSWORD.`
    );
  }

  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie().join("; ")
      : res.headers.get("set-cookie") || "";
  const match = raw.match(/(?:^|,\s*)token=([^;]+)/);
  if (!match) throw new Error("Login sukses tapi cookie `token` tidak ditemukan");
  return `token=${match[1]}`;
}

async function api(pathname, options = {}, cookie = authCookie) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body) headers["Content-Type"] = "application/json";
  return rawFetch(`${BASE_URL}${pathname}`, { ...options, headers });
}

async function apiJson(pathname, options = {}, cookie = authCookie) {
  const res = await api(pathname, options, cookie);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body, res };
}

async function runTest(id, name, fn) {
  process.stdout.write(`[${id}] ${name}... `);
  try {
    const outcome = await fn();
    if (outcome === "skip") {
      skipped++;
      console.log("SKIPPED");
      results.push({ id, name, status: "Skip", error: null });
      return;
    }
    passed++;
    console.log("PASSED");
    results.push({ id, name, status: "Passed", error: null });
  } catch (err) {
    failed++;
    console.log(`FAILED -> ${err.message}`);
    results.push({ id, name, status: "Failed", error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Fixtures: temporary users + sessions.
//
// Stats math is only meaningful against a known data set, so this runner owns
// two users instead of reading juliet's seeded history.
// ---------------------------------------------------------------------------

const fixtureUserIds = [];

function loadDbConfig() {
  const dotenv = appRequire("dotenv");
  dotenv.config({ path: path.join(appDir, ".env") });
  return {
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "habbit_couple",
    port: Number(process.env.MYSQL_PORT || 3306),
  };
}

function jwtSecret() {
  const dotenv = appRequire("dotenv");
  dotenv.config({ path: path.join(appDir, ".env") });
  return process.env.JWT_SECRET || "";
}

async function withDb(fn) {
  const mysql = appRequire("mysql2/promise");
  const connection = await mysql.createConnection(loadDbConfig());
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

/** Creates a `qa-test-*` user and returns `{ id, cookie }` authenticated by JWT. */
async function createFixtureUser(label) {
  const jwt = appRequire("jsonwebtoken");
  const id = `${TAG}-${label}`.slice(0, 36);

  await withDb(async (db) => {
    await db.query(
      `INSERT INTO users (id, username, password_hash, name, avatar_emoji, role, partner_id)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [id, `${TAG}-${label}`.slice(0, 100), "qa-fixture-no-login", `QA ${label}`, "🧪", "husband"]
    );
  });

  fixtureUserIds.push(id);
  const token = jwt.sign({ userId: id }, jwtSecret(), { expiresIn: "1h" });
  return { id, cookie: `token=${token}` };
}

// --- WIB calendar helpers ---------------------------------------------------
// APP_TIMEZONE is Asia/Jakarta (UTC+7, no DST), so the offset is fixed. The
// runner deliberately re-derives dates independently of the server code.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibDateOf(instant) {
  return new Date(instant.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function todayWib() {
  return wibDateOf(new Date());
}

function shiftDay(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/** Instant for a WIB wall-clock time, e.g. ("2026-10-25", "09:00"). */
function wibInstant(dateStr, hhmm) {
  return new Date(`${dateStr}T${hhmm}:00+07:00`);
}

/** Monday of the Mon–Sun week containing `dateStr`. */
function weekStart(dateStr) {
  const weekday = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const offset = weekday === 0 ? 6 : weekday - 1;
  return shiftDay(dateStr, -offset);
}

const createdSessionIds = [];

/**
 * Fixture set for the deterministic stats assertions.
 *
 * T = today (WIB). Times are chosen so the WIB calendar day and the UTC
 * calendar day disagree for S6, which is what TC4-3 checks.
 */
function buildStatsFixtures() {
  const T = todayWib();
  return [
    { key: "S1", label: "Coding", minutes: 25, at: wibInstant(T, "09:00"), day: T },
    { key: "S2", label: "Belajar", minutes: 50, at: wibInstant(T, "14:00"), day: T },
    { key: "S3", label: "Coding", minutes: 25, at: wibInstant(shiftDay(T, -1), "10:00"), day: shiftDay(T, -1) },
    { key: "S4", label: null, minutes: 15, at: wibInstant(shiftDay(T, -2), "10:00"), day: shiftDay(T, -2) },
    // Gap at T-3 on purpose: the streak must stop there.
    { key: "S5", label: "Meeting", minutes: 30, at: wibInstant(shiftDay(T, -5), "10:00"), day: shiftDay(T, -5) },
    // 00:30 WIB today == 17:30 UTC yesterday.
    { key: "S6", label: "Coding", minutes: 20, at: wibInstant(T, "00:30"), day: T },
  ];
}

async function seedStatsFixtures(cookie) {
  const fixtures = buildStatsFixtures();
  for (const fixture of fixtures) {
    const id = crypto.randomUUID();
    createdSessionIds.push(id);
    const ended = new Date(fixture.at.getTime() + fixture.minutes * 60 * 1000);
    const res = await api(
      "/api/pomodoro/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          id,
          label: fixture.label,
          planned_minutes: fixture.minutes,
          actual_minutes: fixture.minutes,
          started_at: fixture.at.toISOString(),
          ended_at: ended.toISOString(),
        }),
      },
      cookie
    );
    if (res.status !== 201) {
      throw new Error(
        `Gagal menyiapkan fixture ${fixture.key}: HTTP ${res.status} ${await res.text()}`
      );
    }
  }
  return fixtures;
}

function sumMinutes(fixtures) {
  return fixtures.reduce((total, f) => total + f.minutes, 0);
}

// ---------------------------------------------------------------------------

async function main() {
  console.log("=================================================");
  console.log("QA Suite — @repo/pomodoro-tracker-api (HTTP nyata)");
  console.log("=================================================");
  console.log(`Base URL      : ${BASE_URL}`);
  console.log(`Habit API     : ${HABIT_API_URL}`);
  console.log(`Tag fixture   : ${TAG}`);

  try {
    authCookie = await login(QA_USERNAME);
    partnerCookie = await login(PARTNER_USERNAME);
  } catch (err) {
    console.error(`\nGAGAL menyiapkan sesi login: ${err.message}`);
    console.error("Pastikan habit API (:5051) dan pomodoro API (:5053) berjalan.");
    process.exitCode = 1;
    return;
  }

  let fixtureA;
  let fixtureB;
  let fixtures = [];

  try {
    // -----------------------------------------------------------------------
    // Group 1 — Autentikasi & health
    // -----------------------------------------------------------------------
    await runTest("TC1-1", "GET /health tanpa auth mengembalikan 200", async () => {
      const res = await rawFetch(`${BASE_URL}/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body = await res.json();
      assert(body.status === "ok", `Field status bukan "ok": ${JSON.stringify(body)}`);
      assert(
        body.service === "pomodoro-tracker-api",
        `Field service salah: ${JSON.stringify(body.service)}`
      );
    });

    await runTest("TC1-2", "GET /api/auth/me dengan cookie habit mengembalikan user login", async () => {
      const { status, body } = await apiJson("/api/auth/me");
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.user?.username === QA_USERNAME, `User salah: ${body.user?.username}`);
      assert(typeof body.user.partner_id === "string", "partner_id tidak dikirim");
      assert(body.user.password_hash === undefined, "password_hash bocor ke client");
    });

    await runTest("TC1-3", "Endpoint pomodoro tanpa cookie ditolak 401", async () => {
      for (const pathname of [
        "/api/pomodoro/settings",
        "/api/pomodoro/sessions",
        "/api/pomodoro/stats",
      ]) {
        const res = await api(pathname, {}, "");
        assert(res.status === 401, `${pathname} expected 401, got ${res.status}`);
      }
    });

    await runTest("TC1-4", "POST /api/auth/logout menghapus cookie token", async () => {
      const res = await api("/api/auth/logout", { method: "POST" });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const raw =
        typeof res.headers.getSetCookie === "function"
          ? res.headers.getSetCookie().join("; ")
          : res.headers.get("set-cookie") || "";
      assert(/token=;/.test(raw) || /Expires=Thu, 01 Jan 1970/i.test(raw), `Cookie tidak dikosongkan: ${raw}`);
    });

    // -----------------------------------------------------------------------
    // Group 2 — Settings
    // -----------------------------------------------------------------------
    fixtureA = await createFixtureUser("a");

    await runTest("TC2-1", "GET settings user baru membuat default 25/5/15/4/true", async () => {
      const { status, body } = await apiJson("/api/pomodoro/settings", {}, fixtureA.cookie);
      assert(status === 200, `Expected 200, got ${status}`);
      const s = body.settings;
      assert(s.focus_minutes === 25, `focus_minutes=${s.focus_minutes}`);
      assert(s.short_break_minutes === 5, `short_break_minutes=${s.short_break_minutes}`);
      assert(s.long_break_minutes === 15, `long_break_minutes=${s.long_break_minutes}`);
      assert(s.long_break_interval === 4, `long_break_interval=${s.long_break_interval}`);
      assert(s.auto_start_break === true, `auto_start_break=${s.auto_start_break}`);
    });

    await runTest("TC2-2", "PUT settings menyimpan perubahan dan persist di GET berikutnya", async () => {
      const put = await apiJson(
        "/api/pomodoro/settings",
        {
          method: "PUT",
          body: JSON.stringify({
            focus_minutes: 50,
            short_break_minutes: 10,
            long_break_minutes: 20,
            long_break_interval: 3,
            auto_start_break: false,
          }),
        },
        fixtureA.cookie
      );
      assert(put.status === 200, `PUT expected 200, got ${put.status}`);
      const get = await apiJson("/api/pomodoro/settings", {}, fixtureA.cookie);
      const s = get.body.settings;
      assert(s.focus_minutes === 50, `focus_minutes=${s.focus_minutes}`);
      assert(s.short_break_minutes === 10, `short_break_minutes=${s.short_break_minutes}`);
      assert(s.long_break_minutes === 20, `long_break_minutes=${s.long_break_minutes}`);
      assert(s.long_break_interval === 3, `long_break_interval=${s.long_break_interval}`);
      assert(s.auto_start_break === false, `auto_start_break=${s.auto_start_break}`);
    });

    await runTest("TC2-3", "PUT focus_minutes=0 ditolak 400", async () => {
      const res = await apiJson(
        "/api/pomodoro/settings",
        { method: "PUT", body: JSON.stringify({ focus_minutes: 0 }) },
        fixtureA.cookie
      );
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      // Validation failures follow the repo-wide `validate` middleware shape:
      // { error, details: [{ path, message }] }. The generic handler uses
      // { success: false, error }, so only `error` is common to both.
      assert(
        typeof res.body.error === "string" && res.body.error.length > 0,
        `Body error tidak berisi pesan: ${JSON.stringify(res.body)}`
      );
      assert(Array.isArray(res.body.details), "Body error tidak berisi details");
    });

    await runTest("TC2-4", "PUT parsial tidak mengubah field lain", async () => {
      const res = await apiJson(
        "/api/pomodoro/settings",
        { method: "PUT", body: JSON.stringify({ auto_start_break: true }) },
        fixtureA.cookie
      );
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const s = res.body.settings;
      assert(s.auto_start_break === true, `auto_start_break=${s.auto_start_break}`);
      assert(s.focus_minutes === 50, `focus_minutes ikut berubah: ${s.focus_minutes}`);
      assert(s.long_break_interval === 3, `long_break_interval ikut berubah: ${s.long_break_interval}`);
    });

    await runTest("TC2-5", "Batas atas tiap durasi ditegakkan (focus 181 / break 61 / interval 13)", async () => {
      const cases = [
        { focus_minutes: 181 },
        { short_break_minutes: 61 },
        { long_break_minutes: 121 },
        { long_break_interval: 13 },
      ];
      for (const payload of cases) {
        const res = await apiJson(
          "/api/pomodoro/settings",
          { method: "PUT", body: JSON.stringify(payload) },
          fixtureA.cookie
        );
        assert(
          res.status === 400,
          `${JSON.stringify(payload)} expected 400, got ${res.status}`
        );
      }
    });

    // -----------------------------------------------------------------------
    // Group 3 — Sessions
    // -----------------------------------------------------------------------
    await runTest("TC3-1", "POST sesi fokus baru mengembalikan 201 dan menyimpan label", async () => {
      const id = crypto.randomUUID();
      createdSessionIds.push(id);
      const startedAt = new Date(Date.now() - 30 * 60 * 1000);
      const res = await apiJson(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id,
            label: `${TAG} Fokus`,
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: startedAt.toISOString(),
            ended_at: new Date(startedAt.getTime() + 25 * 60 * 1000).toISOString(),
          }),
        },
        fixtureA.cookie
      );
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.duplicate === false, `duplicate harus false, dapat ${res.body.duplicate}`);
      assert(res.body.session.id === id, "id sesi tidak sama");
      assert(res.body.session.label === `${TAG} Fokus`, `label=${res.body.session.label}`);
    });

    await runTest("TC3-2", "POST id yang sama tidak menduplikasi baris (200 duplicate)", async () => {
      const id = crypto.randomUUID();
      createdSessionIds.push(id);
      const payload = JSON.stringify({
        id,
        label: `${TAG} Retry`,
        planned_minutes: 25,
        actual_minutes: 25,
        started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        ended_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      });

      const first = await apiJson(
        "/api/pomodoro/sessions",
        { method: "POST", body: payload },
        fixtureA.cookie
      );
      assert(first.status === 201, `Percobaan pertama expected 201, got ${first.status}`);

      const second = await apiJson(
        "/api/pomodoro/sessions",
        { method: "POST", body: payload },
        fixtureA.cookie
      );
      assert(second.status === 200, `Percobaan kedua expected 200, got ${second.status}`);
      assert(second.body.duplicate === true, "duplicate harus true pada retry");
      assert(second.body.session.id === id, "id berbeda pada retry");

      const rows = await withDb((db) =>
        db
          .query("SELECT COUNT(*) AS total FROM pomodoro_sessions WHERE id = ?", [id])
          .then(([r]) => Number(r[0].total))
      );
      assert(rows === 1, `Baris di DB harus 1, dapat ${rows}`);
    });

    await runTest("TC3-3", "POST planned_minutes=0 ditolak 400", async () => {
      const res = await apiJson(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id: crypto.randomUUID(),
            planned_minutes: 0,
            actual_minutes: 1,
            started_at: new Date().toISOString(),
            ended_at: new Date(Date.now() + 60000).toISOString(),
          }),
        },
        fixtureA.cookie
      );
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest("TC3-4", "POST label 81 karakter ditolak 400", async () => {
      const res = await apiJson(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id: crypto.randomUUID(),
            label: "x".repeat(81),
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: new Date().toISOString(),
            ended_at: new Date(Date.now() + 60000).toISOString(),
          }),
        },
        fixtureA.cookie
      );
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest("TC3-5", "POST ended_at <= started_at ditolak 400", async () => {
      const now = new Date();
      const res = await apiJson(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id: crypto.randomUUID(),
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: now.toISOString(),
            ended_at: now.toISOString(),
          }),
        },
        fixtureA.cookie
      );
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest("TC3-6", "POST id bukan UUID ditolak 400", async () => {
      const res = await apiJson(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id: "bukan-uuid",
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: new Date().toISOString(),
            ended_at: new Date(Date.now() + 60000).toISOString(),
          }),
        },
        fixtureA.cookie
      );
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest("TC3-7", "GET sessions diurutkan started_at DESC", async () => {
      const { status, body } = await apiJson("/api/pomodoro/sessions?limit=50", {}, fixtureA.cookie);
      assert(status === 200, `Expected 200, got ${status}`);
      const times = body.sessions.map((s) => Date.parse(s.started_at));
      const sorted = [...times].sort((a, b) => b - a);
      assert(
        times.every((t, i) => t === sorted[i]),
        "Urutan tidak menurun berdasarkan started_at"
      );
    });

    await runTest("TC3-8", "GET sessions?limit=2 mengembalikan tepat 2 baris terbaru", async () => {
      const all = await apiJson("/api/pomodoro/sessions?limit=50", {}, fixtureA.cookie);
      const { status, body } = await apiJson("/api/pomodoro/sessions?limit=2", {}, fixtureA.cookie);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.sessions.length === 2, `Expected 2 baris, dapat ${body.sessions.length}`);
      const newest = all.body.sessions
        .map((s) => Date.parse(s.started_at))
        .sort((a, b) => b - a)
        .slice(0, 2);
      const returned = body.sessions.map((s) => Date.parse(s.started_at));
      assert(
        returned[0] === newest[0] && returned[1] === newest[1],
        `Bukan 2 sesi terbaru: ${JSON.stringify(returned)} vs ${JSON.stringify(newest)}`
      );
    });

    await runTest("TC3-9", "GET sessions?limit=201 ditolak 400", async () => {
      const res = await apiJson("/api/pomodoro/sessions?limit=201", {}, fixtureA.cookie);
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest("TC3-10", "GET sessions?from&to memfilter rentang tanggal", async () => {
      const T = todayWib();
      const all = await apiJson("/api/pomodoro/sessions?limit=50", {}, fixtureA.cookie);
      const expected = all.body.sessions.filter(
        (s) => wibDateOf(new Date(s.started_at)) === T
      ).length;
      assert(expected > 0, "Fixture hari ini kosong, tes tidak bermakna");

      const from = wibInstant(T, "00:00").toISOString();
      const to = wibInstant(T, "23:59").toISOString();
      const { status, body } = await apiJson(
        `/api/pomodoro/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {},
        fixtureA.cookie
      );
      assert(status === 200, `Expected 200, got ${status}`);
      assert(
        body.sessions.length === expected,
        `Expected ${expected} sesi hari ini, dapat ${body.sessions.length}`
      );
      for (const session of body.sessions) {
        assert(
          wibDateOf(new Date(session.started_at)) === T,
          `Sesi di luar rentang ikut terkirim: ${session.started_at}`
        );
      }
    });

    // -----------------------------------------------------------------------
    // Group 4 — Stats
    //
    // Stats math is only meaningful against a known data set, so these run on
    // a dedicated user whose only sessions are the six fixtures above. Mixing
    // them with the CRUD fixtures from group 3 would make every count fuzzy.
    // -----------------------------------------------------------------------
    const fixtureStats = await createFixtureUser("stats");
    fixtures = await seedStatsFixtures(fixtureStats.cookie);

    let stats = null;

    await runTest("TC4-1", "GET stats mengembalikan seluruh blok payload", async () => {
      const { status, body } = await apiJson("/api/pomodoro/stats", {}, fixtureStats.cookie);
      assert(status === 200, `Expected 200, got ${status}`);
      stats = body;
      for (const key of [
        "today",
        "week",
        "streakDays",
        "last7Days",
        "labels",
        "heatmap",
        "hourOfDay",
        "monthly",
      ]) {
        assert(key in body, `Field "${key}" tidak ada di payload stats`);
      }
      assert(body.timezone === "Asia/Jakarta", `timezone=${body.timezone}`);
    });

    await runTest("TC4-2", "Angka today/week/streak cocok dengan hitung manual fixture", async () => {
      const T = todayWib();
      const todayFixtures = fixtures.filter((f) => f.day === T);
      assert(
        stats.today.sessions === todayFixtures.length,
        `today.sessions expected ${todayFixtures.length}, got ${stats.today.sessions}`
      );
      assert(
        stats.today.minutes === sumMinutes(todayFixtures),
        `today.minutes expected ${sumMinutes(todayFixtures)}, got ${stats.today.minutes}`
      );

      const monday = weekStart(T);
      const weekFixtures = fixtures.filter((f) => f.day >= monday && f.day <= T);
      assert(
        stats.week.sessions === weekFixtures.length,
        `week.sessions expected ${weekFixtures.length}, got ${stats.week.sessions}`
      );
      assert(
        stats.week.minutes === sumMinutes(weekFixtures),
        `week.minutes expected ${sumMinutes(weekFixtures)}, got ${stats.week.minutes}`
      );

      // T, T-1, T-2 punya sesi; T-3 sengaja kosong.
      assert(stats.streakDays === 3, `streakDays expected 3, got ${stats.streakDays}`);
    });

    await runTest("TC4-3", "Sesi 00:30 WIB (17:30 UTC kemarin) masuk bucket hari ini", async () => {
      const T = todayWib();
      const todayBucket = stats.last7Days.find((d) => d.date === T);
      assert(todayBucket, `Bucket ${T} tidak ada di last7Days`);
      const yesterday = shiftDay(T, -1);
      const yesterdayBucket = stats.last7Days.find((d) => d.date === yesterday);
      assert(yesterdayBucket, `Bucket ${yesterday} tidak ada`);

      const todayFixtures = fixtures.filter((f) => f.day === T);
      assert(
        todayBucket.sessions === todayFixtures.length,
        `Bucket hari ini expected ${todayFixtures.length} sesi, got ${todayBucket.sessions}`
      );
      assert(
        yesterdayBucket.sessions === 1,
        `Bucket kemarin expected 1 sesi (S3 saja), got ${yesterdayBucket.sessions}`
      );
      // S6 tersimpan sebagai 17:30 UTC kemarin, jadi ini benar-benar menguji
      // konversi zona, bukan sekadar pemetaan tanggal UTC.
      const s6 = fixtures.find((f) => f.key === "S6");
      assert(wibDateOf(s6.at) === T, "Fixture S6 salah: tanggal UTC-nya harus kemarin");
      assert(s6.at.toISOString().slice(0, 10) !== T, "Fixture S6 harus beda hari di UTC");
    });

    await runTest("TC4-4", "last7Days berisi 7 hari berurutan berakhir hari ini", async () => {
      const T = todayWib();
      assert(stats.last7Days.length === 7, `Expected 7 entri, got ${stats.last7Days.length}`);
      const expected = [];
      for (let i = 6; i >= 0; i -= 1) expected.push(shiftDay(T, -i));
      assert(
        JSON.stringify(stats.last7Days.map((d) => d.date)) === JSON.stringify(expected),
        `Urutan tanggal salah: ${stats.last7Days.map((d) => d.date).join(",")}`
      );
    });

    await runTest("TC4-5", "hourOfDay berisi 24 jam dengan distribusi benar", async () => {
      assert(stats.hourOfDay.length === 24, `Expected 24 entri, got ${stats.hourOfDay.length}`);
      const byHour = new Map(stats.hourOfDay.map((h) => [h.hour, h]));
      const expected = new Map();
      for (const f of fixtures) {
        const hour = Number(new Date(f.at.getTime() + WIB_OFFSET_MS).toISOString().slice(11, 13));
        const bucket = expected.get(hour) ?? { sessions: 0, minutes: 0 };
        bucket.sessions += 1;
        bucket.minutes += f.minutes;
        expected.set(hour, bucket);
      }
      for (const [hour, bucket] of expected) {
        const actual = byHour.get(hour);
        assert(
          actual.minutes === bucket.minutes,
          `Jam ${hour}: expected ${bucket.minutes} menit, got ${actual.minutes}`
        );
      }
      const totalMinutes = stats.hourOfDay.reduce((sum, h) => sum + h.minutes, 0);
      assert(
        totalMinutes === sumMinutes(fixtures),
        `Total menit hourOfDay ${totalMinutes} != ${sumMinutes(fixtures)}`
      );
    });

    await runTest("TC4-6", "labels urut menit desc dan label kosong jadi \"Tanpa label\"", async () => {
      const labels = stats.labels;
      assert(labels.length === 4, `Expected 4 label, got ${labels.length}`);
      const minutes = labels.map((l) => l.minutes);
      assert(
        minutes.every((m, i) => i === 0 || minutes[i - 1] >= m),
        `Label tidak urut menit desc: ${minutes.join(",")}`
      );
      assert(labels[0].label === "Coding", `Label teratas harus Coding, dapat ${labels[0].label}`);
      assert(labels[0].minutes === 70, `Coding expected 70 menit, got ${labels[0].minutes}`);
      const noLabel = labels.find((l) => l.label === "Tanpa label");
      assert(noLabel, "Sesi tanpa label tidak masuk bucket \"Tanpa label\"");
      assert(noLabel.sessions === 1, `Tanpa label expected 1 sesi, got ${noLabel.sessions}`);
    });

    await runTest("TC4-7", "monthly berisi 12 bulan berakhir bulan ini", async () => {
      assert(stats.monthly.length === 12, `Expected 12 entri, got ${stats.monthly.length}`);
      const currentMonth = todayWib().slice(0, 7);
      assert(
        stats.monthly[11].month === currentMonth,
        `Bulan terakhir harus ${currentMonth}, dapat ${stats.monthly[11].month}`
      );
      assert(
        stats.monthly[11].minutes === sumMinutes(fixtures),
        `Total menit bulan ini expected ${sumMinutes(fixtures)}, got ${stats.monthly[11].minutes}`
      );
    });

    await runTest("TC4-8", "heatmap difilter sesuai parameter year", async () => {
      const currentYear = todayWib().slice(0, 4);
      const previousYear = String(Number(currentYear) - 1);

      // Sesi di tahun lalu adalah satu-satunya bukti bahwa filter benar-benar
      // memakai `year` yang diminta. Tanpa ini, implementasi yang mengabaikan
      // `year` dan selalu memakai tahun berjalan tetap lolos (regresi D1).
      const pastId = crypto.randomUUID();
      createdSessionIds.push(pastId);
      const pastAt = wibInstant(`${previousYear}-06-15`, "09:00");
      const created = await api(
        "/api/pomodoro/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            id: pastId,
            label: `${TAG} tahun lalu`,
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: pastAt.toISOString(),
            ended_at: new Date(pastAt.getTime() + 25 * 60 * 1000).toISOString(),
          }),
        },
        fixtureStats.cookie
      );
      assert(created.status === 201, `Gagal membuat sesi tahun lalu: ${created.status}`);

      const { body: current } = await apiJson(
        `/api/pomodoro/stats?year=${currentYear}`,
        {},
        fixtureStats.cookie
      );
      assert(current.heatmap.length > 0, "Heatmap tahun berjalan kosong");
      for (const cell of current.heatmap) {
        assert(
          cell.date.startsWith(currentYear),
          `Heatmap memuat tanggal di luar tahun: ${cell.date}`
        );
      }
      assert(
        !current.heatmap.some((cell) => cell.date.startsWith(previousYear)),
        `Heatmap ${currentYear} tidak boleh memuat sesi ${previousYear}`
      );

      const { body: past } = await apiJson(
        `/api/pomodoro/stats?year=${previousYear}`,
        {},
        fixtureStats.cookie
      );
      assert(
        past.heatmap.length === 1 && past.heatmap[0].date === `${previousYear}-06-15`,
        `Heatmap ${previousYear} harus berisi tepat 1 sel ${previousYear}-06-15, dapat ${JSON.stringify(
          past.heatmap
        )}`
      );
      assert(
        past.heatmap[0].minutes === 25,
        `Menit sesi tahun lalu harus 25, dapat ${past.heatmap[0].minutes}`
      );

      const { body: old } = await apiJson("/api/pomodoro/stats?year=2019", {}, fixtureStats.cookie);
      assert(old.heatmap.length === 0, `Heatmap 2019 harus kosong, dapat ${old.heatmap.length}`);
    });

    await runTest("TC4-9", "streak tidak putus saat hari ini belum ada sesi", async () => {
      fixtureB = await createFixtureUser("b");
      const T = todayWib();
      for (const offset of [-1, -2]) {
        const id = crypto.randomUUID();
        createdSessionIds.push(id);
        const at = wibInstant(shiftDay(T, offset), "10:00");
        const res = await api(
          "/api/pomodoro/sessions",
          {
            method: "POST",
            body: JSON.stringify({
              id,
              label: `${TAG} streak`,
              planned_minutes: 25,
              actual_minutes: 25,
              started_at: at.toISOString(),
              ended_at: new Date(at.getTime() + 25 * 60 * 1000).toISOString(),
            }),
          },
          fixtureB.cookie
        );
        assert(res.status === 201, `Seed streak gagal: ${res.status}`);
      }

      const { body } = await apiJson("/api/pomodoro/stats", {}, fixtureB.cookie);
      assert(body.today.sessions === 0, `today harus 0, dapat ${body.today.sessions}`);
      assert(
        body.streakDays === 2,
        `streak harus tetap 2 walau hari ini kosong, dapat ${body.streakDays}`
      );
    });

    await runTest("TC4-10", "GET stats?year=1999 ditolak 400", async () => {
      const res = await apiJson("/api/pomodoro/stats?year=1999", {}, fixtureStats.cookie);
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // Group 5 — Isolasi data per user
    // -----------------------------------------------------------------------
    await runTest("TC5-1", "User B tidak melihat sesi user A", async () => {
      const a = await apiJson("/api/pomodoro/sessions?limit=50", {}, fixtureA.cookie);
      const b = await apiJson("/api/pomodoro/sessions?limit=50", {}, fixtureB.cookie);
      assert(a.body.sessions.length > 0, "Fixture A kosong, tes tidak bermakna");
      assert(
        b.body.sessions.length === 2,
        `User B harus melihat 2 sesinya sendiri, dapat ${b.body.sessions.length}`
      );
      const bIds = new Set(b.body.sessions.map((s) => s.id));
      for (const session of a.body.sessions) {
        assert(!bIds.has(session.id), `Sesi user A bocor ke user B: ${session.id}`);
      }
      for (const session of b.body.sessions) {
        assert(session.user_id === fixtureB.id, `user_id salah: ${session.user_id}`);
      }
    });

    await runTest("TC5-2", "Stats user B hanya menghitung sesi miliknya", async () => {
      const { body } = await apiJson("/api/pomodoro/stats", {}, fixtureB.cookie);
      assert(body.today.sessions === 0, `today user B harus 0, dapat ${body.today.sessions}`);
      assert(
        body.labels.every((l) => l.label !== "Coding"),
        "Label milik user A muncul di stats user B"
      );
      const totalMinutes = body.last7Days.reduce((sum, d) => sum + d.minutes, 0);
      assert(totalMinutes === 50, `Total menit user B expected 50, dapat ${totalMinutes}`);
    });

    await runTest("TC5-3", "Settings terpisah per user", async () => {
      const a = await apiJson("/api/pomodoro/settings", {}, fixtureA.cookie);
      const b = await apiJson("/api/pomodoro/settings", {}, fixtureB.cookie);
      assert(a.body.settings.focus_minutes === 50, `User A focus=${a.body.settings.focus_minutes}`);
      assert(b.body.settings.focus_minutes === 25, `User B harus default 25, dapat ${b.body.settings.focus_minutes}`);
      assert(
        a.body.settings.user_id !== b.body.settings.user_id,
        "Dua user berbagi baris settings yang sama"
      );
    });

    await runTest("TC5-4", "Login nyata juliet dan romeo sama-sama hanya melihat datanya sendiri", async () => {
      const juliet = await apiJson("/api/pomodoro/sessions?limit=5");
      const romeo = await apiJson("/api/pomodoro/sessions?limit=5", {}, partnerCookie);
      assert(juliet.status === 200 && romeo.status === 200, "GET sessions gagal");
      for (const session of juliet.body.sessions) {
        assert(session.user_id !== undefined, "user_id tidak dikirim");
      }
      const julietIds = new Set(juliet.body.sessions.map((s) => s.id));
      for (const session of romeo.body.sessions) {
        assert(!julietIds.has(session.id), `Sesi juliet bocor ke romeo: ${session.id}`);
      }
      const julietStats = await apiJson("/api/pomodoro/stats");
      const romeoStats = await apiJson("/api/pomodoro/stats", {}, partnerCookie);
      assert(
        julietStats.body.today.sessions >= 0 && romeoStats.body.today.sessions >= 0,
        "Stats gagal dimuat"
      );
      assert(
        julietStats.body.timezone === romeoStats.body.timezone,
        "Zona agregasi berbeda antar user"
      );
    });

    // -----------------------------------------------------------------------
    // Group 6 — Migrasi & seed
    // -----------------------------------------------------------------------
    await runTest("TC6-1", "Migrasi pomodoro idempoten (dijalankan 2x)", async () => {
      const run = () =>
        execSync("pnpm exec tsx src/migrations/migrate.ts", {
          cwd: appDir,
          encoding: "utf8",
          stdio: "pipe",
        });
      const first = run();
      const second = run();
      assert(/completed successfully/i.test(first), "Run pertama tidak melaporkan sukses");
      assert(/completed successfully/i.test(second), "Run kedua tidak melaporkan sukses");
      assert(!/error/i.test(second), `Run kedua memuat error: ${second.slice(0, 200)}`);
    });

    await runTest("TC6-2", "Seeder pomodoro aman (tidak menghapus data user)", async () => {
      const output = execSync("pnpm exec tsx src/migrations/seed.ts", {
        cwd: appDir,
        encoding: "utf8",
        stdio: "pipe",
      });
      assert(!/DELETE FROM users/i.test(output), "Seeder tidak boleh menghapus users");
      assert(
        /Skipping sample seed|already has|No users found|Seed completed/i.test(output),
        `Output seeder tidak dikenali: ${output.slice(0, 200)}`
      );
      const source = execSync("cat src/migrations/seed.ts", { cwd: appDir, encoding: "utf8" });
      assert(!/DELETE FROM users/i.test(source), "Source seeder memuat DELETE FROM users");
      assert(/production/i.test(source), "Seeder tidak menjaga production");
    });

    // -----------------------------------------------------------------------
    // Group 7 — Regresi temuan review `/gate` (B1/B2/B3)
    // -----------------------------------------------------------------------
    await runTest(
      "TC13-1",
      "Dua user boleh memiliki UUID sesi yang sama (B1)",
      async () => {
        const ownerA = await createFixtureUser("b1a");
        const ownerB = await createFixtureUser("b1b");
        const sharedId = crypto.randomUUID();
        const at = wibInstant(todayWib(), "11:00");

        const payload = (label) =>
          JSON.stringify({
            id: sharedId,
            label,
            planned_minutes: 25,
            actual_minutes: 25,
            started_at: at.toISOString(),
            ended_at: new Date(at.getTime() + 25 * 60 * 1000).toISOString(),
          });

        const post = (cookie, label) =>
          apiJson(
            "/api/pomodoro/sessions",
            { method: "POST", body: payload(label) },
            cookie
          );

        const first = await post(ownerA.cookie, `${TAG} milik A`);
        assert(first.status === 201, `A harus 201, dapat ${first.status}`);

        // Before the fix this was a 500 "Duplicate entry … for key PRIMARY".
        const second = await post(ownerB.cookie, `${TAG} milik B`);
        assert(
          second.status === 201,
          `B dengan UUID sama harus 201 (bukan ${second.status})`
        );
        assert(
          second.body.session.user_id === ownerB.id,
          "Sesi harus tercatat atas nama user B"
        );
        assert(second.body.duplicate === false, "B bukan duplikat bagi dirinya");

        // Idempotensi per user tetap berlaku.
        const retry = await post(ownerA.cookie, `${TAG} milik A`);
        assert(retry.status === 200, `Retry A harus 200, dapat ${retry.status}`);
        assert(retry.body.duplicate === true, "Retry A harus duplicate:true");

        const rows = await withDb(async (db) => {
          const [result] = await db.query(
            "SELECT user_id, label FROM pomodoro_sessions WHERE id = ? ORDER BY label",
            [sharedId]
          );
          return result;
        });

        assert(rows.length === 2, `Harus ada 2 baris (satu per user), dapat ${rows.length}`);
        assert(
          new Set(rows.map((row) => row.user_id)).size === 2,
          "Kedua baris harus milik user berbeda"
        );
      }
    );

    await runTest(
      "TC13-2",
      "Kunjungan pertama GET /settings aman saat request paralel (B3)",
      async () => {
        const fresh = await createFixtureUser("b3");

        // Six concurrent first reads: before the fix the losers hit the
        // `pomodoro_settings` primary key and answered 500.
        const responses = await Promise.all(
          Array.from({ length: 6 }, () =>
            apiJson("/api/pomodoro/settings", {}, fresh.cookie)
          )
        );

        const statuses = responses.map((response) => response.status);
        assert(
          statuses.every((status) => status === 200),
          `Semua harus 200, dapat: ${statuses.join(", ")}`
        );

        for (const response of responses) {
          assert(
            response.body.settings.focus_minutes === 25 &&
              response.body.settings.short_break_minutes === 5 &&
              response.body.settings.long_break_minutes === 15,
            `Default salah: ${JSON.stringify(response.body.settings)}`
          );
        }

        const count = await withDb(async (db) => {
          const [rows] = await db.query(
            "SELECT COUNT(*) AS total FROM pomodoro_settings WHERE user_id = ?",
            [fresh.id]
          );
          return Number(rows[0].total);
        });
        assert(count === 1, `Harus tepat 1 baris settings, dapat ${count}`);
      }
    );

    await runTest(
      "TC13-3",
      "Respons error 500 tidak membocorkan detail database (B2)",
      async () => {
        // The web client pipes `error` straight into a toast, so a driver
        // message naming a table/constraint would be user-visible.
        const leakPattern =
          /Duplicate entry|PRIMARY|pomodoro_settings|pomodoro_sessions|ER_DUP_ENTRY|sqlState|3c35929d/i;

        // The middleware is TypeScript, so it is exercised through `tsx`.
        const output = execSync("pnpm exec tsx tests/error-middleware-probe.mts", {
          cwd: appDir,
          encoding: "utf8",
          stdio: "pipe",
        });

        const parsed = JSON.parse(output.trim().split("\n").pop());
        const { unexpected, explicit } = parsed;

        assert(unexpected.statusCode === 500, `Harus 500, dapat ${unexpected.statusCode}`);
        assert(
          !leakPattern.test(JSON.stringify(unexpected.body)),
          `Body membocorkan detail database: ${JSON.stringify(unexpected.body)}`
        );
        assert(
          /kesalahan internal/i.test(unexpected.body.error),
          `Pesan harus generik, dapat: ${unexpected.body.error}`
        );

        // An explicit status is a deliberate rejection and keeps its message.
        assert(explicit.statusCode === 404, `Harus 404, dapat ${explicit.statusCode}`);
        assert(
          explicit.body.error === "Sesi tidak ditemukan",
          "Pesan 4xx eksplisit harus dipertahankan"
        );
      }
    );
  } finally {
    console.log("-------------------------------------------------");
    console.log("Teardown: menghapus fixture QA...");

    for (const userId of fixtureUserIds) {
      try {
        await withDb(async (db) => {
          await db.query("DELETE FROM pomodoro_sessions WHERE user_id = ?", [userId]);
          await db.query("DELETE FROM pomodoro_settings WHERE user_id = ?", [userId]);
          await db.query("DELETE FROM users WHERE id = ?", [userId]);
        });
      } catch (err) {
        console.log(`PERINGATAN: gagal menghapus fixture user ${userId}: ${err.message}`);
      }
    }

    const leftovers = await withDb((db) =>
      db
        .query("SELECT COUNT(*) AS total FROM pomodoro_sessions WHERE label LIKE ?", [`%${TAG}%`])
        .then(([r]) => Number(r[0].total))
    );
    if (leftovers > 0) {
      console.log(`PERINGATAN: ${leftovers} sesi QA masih tersisa`);
    } else {
      console.log("✓ Tidak ada sesi QA tersisa.");
    }

    console.log("-------------------------------------------------");
    console.log(`HASIL: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    if (failed > 0) {
      console.log("Detail kegagalan:");
      for (const r of results.filter((x) => x.status === "Failed")) {
        console.log(` - ${r.id}: ${r.error}`);
      }
      process.exitCode = 1;
    }
  }
}

await main();
