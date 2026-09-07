---
name: api-testing
description: Use when writing or running backend/API tests that hit HTTP endpoints directly (no browser) — REST or GraphQL, via Supertest/Vitest (TS/JS) or httpx/pytest (Python). Decides, per test, whether to use a mock database, a real database with transaction rollback, or a real database hit black-box over HTTP with an explicit teardown script — and never lets test data linger uncleaned. Also covers the case where the flow under test depends on an entity owned by another repo/service (e.g. testing order-cancellation when order-creation lives elsewhere) — this skill stops and asks for that dependency instead of guessing its shape. Not for browser-driven E2E (use webapp-testing/e2e-testing) or React component tests (use react-testing).
license: MIT
metadata:
  category: testing
  author: lintang
  version: "1.0.0"
compatibility: "Requires a running (or in-process) backend to test against, and a test HTTP client (Supertest, httpx, or the project's existing one)."
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion]
compatible_with: [claude-code, opencode, antigravity, commandcode]
---

# API Testing (backend, no browser)

HTTP-level backend testing — REST/GraphQL endpoints hit directly, no
`page` involved. Covers request/response validation, auth, error handling,
**and, deliberately, the data-hygiene problem most API-testing guides skip:
deciding how the test's data touches the database, and making sure it never
leaves residue.**

**Related skills:** for browser-driven flows use `webapp-testing` (runner +
report) or `e2e-testing` (patterns only). For React component tests, use
`react-testing`. For the scenario list to test before writing specs, run
`test-case-matrix` first.

## When to use

- Writing integration tests for REST/GraphQL endpoints (no browser)
- Setting up a test DB strategy for a backend project that doesn't have one
- The flow under test creates/reads data that another service/repo owns

## When NOT to use

- Testing through the browser/UI — use `webapp-testing`/`e2e-testing`
- Testing a React component in isolation — use `react-testing`

## Step 0 — Is every entity this test touches owned by this repo?

Before writing any test that creates or depends on data (an order, a
subscription, a user profile owned by an identity service, etc.), check
whether the code that owns that entity's creation/validation lives in the
repo you're currently working in.

- **If yes** (this repo owns it): proceed to Step 1.
- **If no** (creation logic lives in another repo/service — e.g. this repo
  only *consumes* orders that an order-service elsewhere creates): **stop
  and ask**, don't guess. See
  [`references/cross-service-test-data.md`](references/cross-service-test-data.md)
  for the full reasoning; in short, ask the user for one of:
  1. That repo's path (so it can be added as a working directory and its
     real API/seed mechanism used), or
  2. Its API contract (OpenAPI/Swagger spec, Postman collection), or
  3. A reachable staging/dev endpoint plus test credentials.

  Never insert directly into a table owned by another service's schema as a
  substitute — you don't know its constraints, triggers, or derived fields,
  and a "valid-looking" row can still violate that service's actual
  invariants. Seed through that service's real API (even just to create
  fixture data) unless it ships its own official seed script.

## Step 1 — Choose the database mode for this test

This is conditional per test/suite, not a repo-wide setting — pick based on
how the test reaches the code, not preference. Full comparison table and
rationale in
[`references/db-strategy-and-cleanup.md`](references/db-strategy-and-cleanup.md).
Summary:

| Mode | Use when | Cleanup |
|---|---|---|
| Mock/in-memory DB | Testing logic, DB behavior itself isn't under test | None needed — instance is disposable |
| Real DB, transaction rollback | Test runs in-process with the app code (same connection) | Wrap in a transaction, roll back at the end |
| Real DB, black-box over HTTP | Test hits a running server (Supertest/httpx against `baseURL`) | Rollback doesn't apply (different connection) — **tag + explicit teardown, mandatory** |

If the platform you're on has no interactive question tool available, fall
back to asking in plain text rather than silently picking a mode — same
fallback convention this repo's `INSTALL.md` uses.

## Step 2 — Tag test data, always, when using a real DB

Whether transaction-rollback or black-box: give every row this test creates
a way to be identified as test data — a `run_id` generated once per suite
run, or a fixed prefix/domain (`test_`, `@e2e.test`). Untagged real-DB test
data is exactly what makes teardown scripts unreliable later.

## Step 3 — Write the test

Use the project's existing client if there is one; otherwise:

- **TS/JS**: Supertest + Vitest. Example patterns (request methods,
  headers, auth tokens, GraphQL queries, error-case assertions) — see
  `references/http-client-patterns.md` if present, or the equivalent
  section in `e2e-testing`'s reference material for shared conventions
  (POM doesn't apply here, but assertion style does).
- **Python**: httpx + pytest (+ FastAPI `TestClient` if applicable),
  fixtures for reusable auth/setup.

Cover both success and failure paths, and assert status code first, then
response shape.

## Step 4 — Cleanup is not optional when a real DB was touched

- **Transaction-rollback mode**: rollback happens automatically at test end
  — verify it actually does (a leaked commit defeats the whole mode).
- **Black-box mode**: run an explicit teardown that deletes everything
  tagged with this run's `run_id`/prefix, in two places:
  1. Automatic — `afterAll`/suite teardown, every run.
  2. **A standalone script**, runnable manually and idempotent (safe to run
     even if the data's already gone) — for the case where a crashed run
     never reached its `afterAll`. See
     [`references/db-strategy-and-cleanup.md`](references/db-strategy-and-cleanup.md)
     for the template and
     [`assets/cleanup_test_data.py`](assets/cleanup_test_data.py) for a
     ready-to-adapt script.

Never report a test suite "done" while black-box mode was used and no
teardown (automatic or standalone) exists — that's data pollution left for
someone else to discover later.

## Referensi

- `references/cross-service-test-data.md` — provider-contract reasoning,
  what to ask for and why, and why not to insert directly into another
  service's tables
- `references/db-strategy-and-cleanup.md` — full mock/rollback/black-box
  comparison, tagging convention, standalone cleanup script template
- `assets/cleanup_test_data.py` — adaptable standalone teardown script
  (stdlib-only Python, HTTP-based deletion against the app's own API)
