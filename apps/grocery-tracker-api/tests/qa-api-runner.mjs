// apps/grocery-tracker-api/tests/qa-api-runner.mjs
// Automated verification for @repo/grocery-tracker-api (docs/qa/grocery-app-split/test-matrix.md PB-1, TC12-3).
// Creates only `qa-test-*` tagged rows and removes them in teardown.

import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const appRequire = createRequire(path.join(appDir, "package.json"));

const BASE_URL = process.env.GROCERY_API_URL || "http://localhost:5052";
const HABIT_API_URL = process.env.HABIT_API_URL || "http://localhost:5051";
const QA_USERNAME = process.env.QA_USERNAME || "romeo";
const QA_PASSWORD = process.env.QA_PASSWORD || "password123";
const PARTNER_USERNAME = process.env.QA_PARTNER_USERNAME || "juliet";
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

/** Retry for the dev-server (`tsx watch`) restart window during teardown. */
async function apiWithRetry(pathname, options = {}, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await api(pathname, options);
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
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

const createdIds = [];

// ---------------------------------------------------------------------------
// Outsider fixtures (TC3-2/TC3-3): real `users` rows that are NOT part of the
// romeo/juliet couple, so couple-scoped authorization can be tested against
// real data instead of a mocked one. Created and deleted by this runner only,
// and only with a `qa-test-*` username.
const outsiderIds = [];

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

async function withDb(fn) {
  const mysql = appRequire("mysql2/promise");
  const connection = await mysql.createConnection(loadDbConfig());
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

/**
 * Creates a `qa-test-*` user with no partner and returns a signed-token cookie
 * for it. `password_hash` is a non-hash placeholder on purpose: this fixture
 * never logs in with a password, it authenticates through the
 * `Authorization: Bearer` path `authMiddleware` already supports.
 */
async function createOutsider(label) {
  const jwt = appRequire("jsonwebtoken");
  const id = `qa-test-${Date.now()}-${label}`;

  await withDb(async (db) => {
    await db.execute(
      `INSERT INTO users (id, username, password_hash, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, id, "qa-test-no-login", `QA Outsider ${label}`, "🧪", null, "husband", null, null]
    );
  });

  outsiderIds.push(id);

  const dotenv = appRequire("dotenv");
  dotenv.config({ path: path.join(appDir, ".env") });
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { id, cookie: `token=${token}` };
}

async function deleteOutsiders() {
  if (outsiderIds.length === 0) return;
  await withDb(async (db) => {
    await db.query("DELETE FROM grocery_items WHERE name LIKE 'qa-test-%'");
    await db.query("DELETE FROM users WHERE username LIKE 'qa-test-%'");
  });
  outsiderIds.length = 0;
}

async function main() {
  console.log("=================================================");
  console.log("QA Suite — @repo/grocery-tracker-api");
  console.log(`API: ${BASE_URL} | Habit API: ${HABIT_API_URL} | Tag: ${TAG}`);
  console.log("=================================================");

  try {
    authCookie = await login(QA_USERNAME);
    console.log(`Autentikasi sebagai ${QA_USERNAME} via ${HABIT_API_URL}`);
  } catch (err) {
    console.log("");
    console.log(`PREFLIGHT FAILED: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    await runTest("TC1-1", "GET /health mengembalikan status ok", async () => {
      const res = await rawFetch(`${BASE_URL}/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.status === "ok", `Expected status ok, got ${json.status}`);
      assert(
        json.service === "grocery-tracker-api",
        `Expected service grocery-tracker-api, got ${json.service}`
      );
    });

    await runTest("TC1-2", "Request tanpa cookie ditolak 401", async () => {
      const groceryRes = await api("/api/grocery", {}, "");
      assert(groceryRes.status === 401, `GET /api/grocery expected 401, got ${groceryRes.status}`);
      const body = await groceryRes.json();
      assert(body.success === false, "Expected success:false");

      const meRes = await api("/api/auth/me", {}, "");
      assert(meRes.status === 401, `GET /api/auth/me expected 401, got ${meRes.status}`);
    });

    await runTest("TC1-3", "Cookie habit API diterima grocery API", async () => {
      const res = await api("/api/grocery");
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json.items), "Expected { items: [...] }");
    });

    let me = null;
    await runTest("TC1-4", "GET /api/auth/me mengembalikan user + partner_id", async () => {
      const res = await api("/api/auth/me");
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.user && json.user.id, "Expected user.id");
      assert(json.user.username === QA_USERNAME, `Expected username ${QA_USERNAME}`);
      assert(json.user.partner_id, "Expected partner_id terisi");
      me = json.user;
    });

    await runTest("TC1-5", "POST /api/auth/logout menghapus cookie token", async () => {
      const res = await api("/api/auth/logout", { method: "POST" });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.message === "Logout successful", `Unexpected message: ${json.message}`);

      const raw =
        typeof res.headers.getSetCookie === "function"
          ? res.headers.getSetCookie().join("; ")
          : res.headers.get("set-cookie") || "";
      assert(/token=;/.test(raw) || /token=($|;)/.test(raw), `Set-Cookie tidak mengosongkan token: ${raw}`);
      assert(/Path=\//i.test(raw), `Set-Cookie tanpa Path=/ : ${raw}`);
      assert(/SameSite=Lax/i.test(raw), `Set-Cookie tanpa SameSite=Lax : ${raw}`);
    });

    let itemId = "";
    await runTest("TC2-1", "POST /api/grocery membuat item", async () => {
      const res = await api("/api/grocery", {
        method: "POST",
        body: JSON.stringify({
          name: `${TAG}-create`,
          category: "Sayur & Buah",
          quantity: "2",
          unit: "ikat",
          is_urgent: true,
        }),
      });
      assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
      const json = await res.json();
      assert(json.item && json.item.id, "Expected item.id pada respons");
      assert(json.item.name === `${TAG}-create`, "Nama item tidak sesuai payload");
      assert(Boolean(json.item.is_urgent) === true, "Expected is_urgent true");
      assert(json.item.partner_id, "Expected partner_id terisi");
      itemId = json.item.id;
      createdIds.push(itemId);
    });

    await runTest("TC2-2", "POST /api/grocery menolak payload tanpa name", async () => {
      const res = await api("/api/grocery", {
        method: "POST",
        body: JSON.stringify({ category: "Lainnya", quantity: "1" }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(!json.item, "Tidak boleh mengembalikan item");
      assert(
        Boolean(json.error || json.details),
        "Expected error/details validasi pada respons"
      );
    });

    await runTest("TC2-3", "PUT /api/grocery/:id mengubah item", async () => {
      const res = await api(`/api/grocery/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ name: `${TAG}-edited`, estimated_price: 15000 }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.item.name === `${TAG}-edited`, `Nama tidak berubah: ${json.item.name}`);
      assert(Number(json.item.estimated_price) === 15000, "estimated_price tidak berubah");
    });

    await runTest("TC2-4", "PATCH /api/grocery/:id/toggle menandai selesai", async () => {
      const res = await api(`/api/grocery/${itemId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: true }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.item.is_completed === true, "Expected is_completed true");
      assert(json.item.completed_by === me?.id, "Expected completed_by = user login");
      assert(json.item.completed_at, "Expected completed_at terisi");
    });

    await runTest("TC2-5", "POST /api/grocery/clear-completed", async () => {
      const listRes = await api("/api/grocery");
      const listJson = await listRes.json();
      const foreignCompleted = (listJson.items || []).filter(
        (i) => i.is_completed && !String(i.name).startsWith("qa-test-")
      );

      if (foreignCompleted.length > 0) {
        console.log(
          `\n    -> dilewati: ada ${foreignCompleted.length} item selesai milik user ` +
            `(bukan data QA). Endpoint global akan menghapusnya.`
        );
        return "skip";
      }

      const res = await api("/api/grocery/clear-completed", { method: "POST" });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(typeof json.deletedCount === "number", "Expected deletedCount number");
      assert(json.deletedCount >= 1, `Expected deletedCount >= 1, got ${json.deletedCount}`);
      createdIds.splice(createdIds.indexOf(itemId), 1);
    });

    await runTest("TC2-6", "DELETE /api/grocery/:id menghapus item", async () => {
      const res = await api(`/api/grocery/${itemId}`, { method: "DELETE" });
      if (res.status === 404) {
        // Item sudah terhapus oleh TC2-5 — buat ulang lalu hapus agar tetap terverifikasi.
        const recreate = await api("/api/grocery", {
          method: "POST",
          body: JSON.stringify({ name: `${TAG}-delete`, category: "Lainnya", quantity: "1" }),
        });
        const recreated = await recreate.json();
        createdIds.push(recreated.item.id);
        const delRes = await api(`/api/grocery/${recreated.item.id}`, { method: "DELETE" });
        assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);
        createdIds.splice(createdIds.indexOf(recreated.item.id), 1);
      } else {
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        createdIds.splice(createdIds.indexOf(itemId), 1);
      }

      const listRes = await api("/api/grocery");
      const listJson = await listRes.json();
      assert(
        !(listJson.items || []).some((i) => i.id === itemId),
        "Item masih ada di daftar setelah dihapus"
      );
    });

    await runTest("TC3-1", "Item terlihat oleh akun pasangan", async () => {
      let partnerLoginError = null;
      try {
        partnerCookie = await login(PARTNER_USERNAME);
      } catch (err) {
        partnerLoginError = err.message;
      }
      if (partnerLoginError) {
        console.log(`\n    -> dilewati: ${partnerLoginError}`);
        return "skip";
      }

      const createRes = await api("/api/grocery", {
        method: "POST",
        body: JSON.stringify({ name: `${TAG}-partner`, category: "Lainnya", quantity: "1" }),
      });
      const created = await createRes.json();
      createdIds.push(created.item.id);

      const partnerList = await api("/api/grocery", {}, partnerCookie);
      const partnerJson = await partnerList.json();
      const found = (partnerJson.items || []).find((i) => i.id === created.item.id);
      assert(found, "Item tidak terlihat oleh pasangan");
      assert(found.creator_name === me?.name, `Expected creator_name ${me?.name}, got ${found.creator_name}`);
    });

    await runTest(
      "TC3-2",
      "User di luar couple tidak bisa update/toggle/delete item (404)",
      async () => {
        // Regression guard for review finding B2 (IDOR): read paths were
        // couple-scoped but update/toggle/delete only checked existence.
        let outsider;
        try {
          outsider = await createOutsider("outsider");
        } catch (err) {
          console.log(`\n    -> dilewati: gagal menyiapkan user uji (${err.message})`);
          return "skip";
        }

        const createRes = await api("/api/grocery", {
          method: "POST",
          body: JSON.stringify({
            name: `${TAG}-cross-couple`,
            category: "Lainnya",
            quantity: "3",
            unit: "pcs",
          }),
        });
        assert(createRes.status === 201, `Expected 201, got ${createRes.status}`);
        const created = await createRes.json();
        const targetId = created.item.id;
        createdIds.push(targetId);

        const asOutsider = (pathname, options = {}) =>
          api(pathname, options, outsider.cookie);

        const updateRes = await asOutsider(`/api/grocery/${targetId}`, {
          method: "PUT",
          body: JSON.stringify({ name: `${TAG}-hijacked` }),
        });
        assert(updateRes.status === 404, `PUT oleh outsider expected 404, got ${updateRes.status}`);

        const toggleRes = await asOutsider(`/api/grocery/${targetId}/toggle`, {
          method: "PATCH",
          body: JSON.stringify({ is_completed: true }),
        });
        assert(toggleRes.status === 404, `PATCH toggle oleh outsider expected 404, got ${toggleRes.status}`);

        const deleteRes = await asOutsider(`/api/grocery/${targetId}`, { method: "DELETE" });
        assert(deleteRes.status === 404, `DELETE oleh outsider expected 404, got ${deleteRes.status}`);

        // The item must be byte-for-byte unchanged for its real owners.
        const ownerList = await api("/api/grocery");
        const ownerJson = await ownerList.json();
        const still = (ownerJson.items || []).find((i) => i.id === targetId);
        assert(still, "Item hilang setelah percobaan oleh outsider");
        assert(still.name === `${TAG}-cross-couple`, `Nama item berubah jadi ${still.name}`);
        assert(Boolean(still.is_completed) === false, "is_completed berubah setelah percobaan outsider");
        assert(still.quantity === "3", `quantity berubah jadi ${still.quantity}`);

        // The item must also stay invisible to the outsider's own list.
        const outsiderList = await asOutsider("/api/grocery");
        const outsiderJson = await outsiderList.json();
        assert(
          !(outsiderJson.items || []).some((i) => i.id === targetId),
          "Item couple lain terlihat di daftar outsider"
        );
      }
    );

    await runTest(
      "TC3-3",
      "Dua user tanpa partner tidak bisa saling mengubah item (404)",
      async () => {
        // Regression guard for the `partner_id` null-vs-null hole: a naive
        // predicate `item.partner_id === req.partnerId` matches `null === null`,
        // so two partnerless users would each see the other's items as theirs.
        let owner;
        let stranger;
        try {
          owner = await createOutsider("solo-owner");
          stranger = await createOutsider("solo-stranger");
        } catch (err) {
          console.log(`\n    -> dilewati: gagal menyiapkan user uji (${err.message})`);
          return "skip";
        }

        const createRes = await api(
          "/api/grocery",
          {
            method: "POST",
            body: JSON.stringify({
              name: `${TAG}-solo`,
              category: "Lainnya",
              quantity: "1",
            }),
          },
          owner.cookie
        );
        assert(createRes.status === 201, `Expected 201, got ${createRes.status}`);
        const created = await createRes.json();
        const targetId = created.item.id;
        assert(created.item.partner_id === null, "Fixture salah: item owner harus partner_id null");

        const asStranger = (pathname, options = {}) => api(pathname, options, stranger.cookie);

        const updateRes = await asStranger(`/api/grocery/${targetId}`, {
          method: "PUT",
          body: JSON.stringify({ name: `${TAG}-solo-hijacked` }),
        });
        assert(updateRes.status === 404, `PUT oleh stranger expected 404, got ${updateRes.status}`);

        const toggleRes = await asStranger(`/api/grocery/${targetId}/toggle`, {
          method: "PATCH",
          body: JSON.stringify({ is_completed: true }),
        });
        assert(toggleRes.status === 404, `PATCH toggle oleh stranger expected 404, got ${toggleRes.status}`);

        const deleteRes = await asStranger(`/api/grocery/${targetId}`, { method: "DELETE" });
        assert(deleteRes.status === 404, `DELETE oleh stranger expected 404, got ${deleteRes.status}`);

        // Positive control: the owner must still be able to edit its own item.
        const ownerUpdate = await api(
          `/api/grocery/${targetId}`,
          { method: "PUT", body: JSON.stringify({ quantity: "7" }) },
          owner.cookie
        );
        assert(ownerUpdate.status === 200, `Owner PUT expected 200, got ${ownerUpdate.status}`);
        const ownerJson = await ownerUpdate.json();
        assert(ownerJson.item.quantity === "7", `Owner gagal mengubah item: ${ownerJson.item.quantity}`);
        assert(
          ownerJson.item.name === `${TAG}-solo`,
          `Nama item berubah setelah percobaan stranger: ${ownerJson.item.name}`
        );
      }
    );

    await runTest("TC12-3", "Habit API tidak lagi melayani /api/grocery", async () => {
      const res = await rawFetch(`${HABIT_API_URL}/api/grocery`, {
        headers: { Cookie: authCookie },
      });
      assert(
        res.status === 404,
        `Expected 404 dari habit API, got ${res.status} (route grocery masih ter-mount?)`
      );
    });

    await runTest("TC4-1", "Migrasi grocery idempoten (dijalankan 2x)", async () => {
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

    await runTest("TC4-2", "Seeder grocery aman & dev-only", async () => {
      const run = () =>
        execSync("pnpm exec tsx src/migrations/seed.ts", {
          cwd: appDir,
          encoding: "utf8",
          stdio: "pipe",
        });
      const output = run();
      assert(!/DELETE FROM users/i.test(output), "Seeder tidak boleh menghapus users");
      assert(
        /Skipping sample seed|already has|No users found|Seed completed/i.test(output),
        `Output seeder tidak dikenali: ${output.slice(0, 200)}`
      );
      const source = execSync("cat src/migrations/seed.ts", { cwd: appDir, encoding: "utf8" });
      assert(!/DELETE FROM users/i.test(source), "Source seeder memuat DELETE FROM users");
      assert(/production/i.test(source), "Seeder tidak menjaga production");
    });
  } finally {
    console.log("-------------------------------------------------");
    console.log("Teardown: menghapus data QA ber-tag...");
    for (const id of createdIds) {
      await apiWithRetry(`/api/grocery/${id}`, { method: "DELETE" });
    }
    const remaining = await apiWithRetry("/api/grocery");
    const remainingJson = await remaining.json();
    const leftovers = (remainingJson.items || []).filter((i) => String(i.name).startsWith("qa-test-"));
    if (leftovers.length > 0) {
      console.log(`PERINGATAN: ${leftovers.length} item QA masih tersisa`);
      for (const item of leftovers) {
        await apiWithRetry(`/api/grocery/${item.id}`, { method: "DELETE" });
      }
    }
    try {
      await deleteOutsiders();
    } catch (err) {
      console.log(`PERINGATAN: gagal menghapus fixture user uji: ${err.message}`);
    }
    console.log("Teardown selesai.");
    console.log("=================================================");
    console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log("=================================================");
  }

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL QA RUNNER ERROR:", err);
  process.exit(1);
});
