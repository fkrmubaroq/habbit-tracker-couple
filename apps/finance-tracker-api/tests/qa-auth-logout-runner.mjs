// apps/finance-tracker-api/tests/qa-auth-logout-runner.mjs
//
// Focused verification for the finance logout endpoint added in
// docs/prd/todo/sidebar-component (Fase 5c).
//
// Deliberately narrow: it does NOT touch the database and does NOT run the
// balance-dependent assertions from qa-api-runner.mjs, so it is safe to run
// against a dev database that already contains real couple data.
//
// Covers test-matrix rows TC4-1 (POST /api/auth/logout clears the cookie) and
// TC4-2 (session is gone afterwards).
//
// Usage: node apps/finance-tracker-api/tests/qa-auth-logout-runner.mjs
//   API_URL        default http://localhost:5050 (finance-tracker-api)
//   HABIT_API_URL  default http://localhost:5051 (habbit-tracker-api, issues the cookie)
//   QA_USERNAME    default romeo
//   QA_PASSWORD    default password123

const BASE_URL = process.env.API_URL || "http://localhost:5050";
const HABIT_API_URL = process.env.HABIT_API_URL || "http://localhost:5051";
const QA_USERNAME = process.env.QA_USERNAME || "romeo";
const QA_PASSWORD = process.env.QA_PASSWORD || "password123";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) throw new Error("Assertion failed: " + message);
}

async function runTest(id, name, fn) {
  process.stdout.write(`[${id}] ${name}... `);
  try {
    await fn();
    passed++;
    console.log("PASSED");
  } catch (err) {
    failed++;
    console.log("FAILED -> " + err.message);
  }
}

function readSetCookie(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie().join("\n");
  }
  return res.headers.get("set-cookie") || "";
}

async function main() {
  console.log("=================================================");
  console.log("QA: finance-tracker-api logout endpoint");
  console.log(`Target: ${BASE_URL} | Session issuer: ${HABIT_API_URL}`);
  console.log("=================================================");

  let tokenCookie = "";

  // --- preflight: obtain a real shared session cookie -----------------------
  try {
    const res = await fetch(`${HABIT_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: QA_USERNAME, password: QA_PASSWORD }),
    });
    if (res.status !== 200) {
      throw new Error(
        `Login to ${HABIT_API_URL} returned ${res.status}. Seed the database (pnpm db:seed) or set QA_USERNAME/QA_PASSWORD.`
      );
    }
    const match = readSetCookie(res).match(/(?:^|\n)token=([^;]+)/);
    if (!match) throw new Error("Login succeeded but no `token` cookie was returned");
    tokenCookie = `token=${match[1]}`;
    console.log(`Authenticated as ${QA_USERNAME} via ${HABIT_API_URL}`);
  } catch (err) {
    console.log("");
    console.log("PREFLIGHT FAILED: " + err.message);
    process.exitCode = 1;
    return;
  }

  // Sanity: the cookie is actually accepted by finance-tracker-api.
  await runTest("PREFLIGHT", "Shared cookie is accepted by finance /api/auth/me", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: tokenCookie } });
    assert(res.status === 200, `Expected 200 with a valid cookie, got ${res.status}`);
    const json = await res.json();
    assert(json.user && json.user.username === QA_USERNAME, "Expected the logged-in user in the response");
  });

  // --- TC4-1 ---------------------------------------------------------------
  await runTest("TC4-1", "POST /api/auth/logout returns 200 and clears the token cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: tokenCookie },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const json = await res.json();
    assert(
      typeof json.message === "string" && json.message.toLowerCase().includes("logout"),
      `Expected a logout confirmation message, got ${JSON.stringify(json)}`
    );

    const setCookie = readSetCookie(res);
    assert(setCookie.includes("token=;"), `Expected Set-Cookie to empty the token, got: ${setCookie}`);

    const clearsImmediately = /max-age=0/i.test(setCookie) || /expires=thu, 01 jan 1970/i.test(setCookie);
    assert(clearsImmediately, `Expected Max-Age=0 or an epoch Expires, got: ${setCookie}`);

    assert(/path=\//i.test(setCookie), `Expected Path=/ so the shared cookie is targeted, got: ${setCookie}`);
    assert(/httponly/i.test(setCookie), `Expected HttpOnly to match the issuing cookie, got: ${setCookie}`);
  });

  // --- TC4-2 ---------------------------------------------------------------
  await runTest("TC4-2", "GET /api/auth/me returns 401 once the cookie is gone", async () => {
    // Simulates the browser dropping the cookie after receiving the clearing Set-Cookie.
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert(res.status === 401, `Expected 401 without a cookie, got ${res.status}`);

    const json = await res.json();
    assert(json.success === false, "Expected success false");
    assert(
      typeof json.error === "string" && /unauthorized/i.test(json.error),
      `Expected an Unauthorized message, got ${JSON.stringify(json)}`
    );
  });

  console.log("-------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("-------------------------------------------------");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL QA TEST RUNNER ERROR:", err);
  process.exit(1);
});
