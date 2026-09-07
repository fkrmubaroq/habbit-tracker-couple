# DB strategy and cleanup — full detail

## The three modes

### 1. Mock / in-memory database

Use a fake repository, an in-memory SQLite, or a testcontainer spun up and
destroyed within the test process. Appropriate when the test is exercising
application logic and the database's own behavior (real constraints,
query planning, migrations) isn't what's being verified.

**Cleanup:** none needed. The instance never outlives the test process, so
it never touches anything that could be "polluted."

### 2. Real database, transaction rollback per test

Only works when the test runs **in the same process, sharing the same
connection/transaction**, as the code under test — i.e. calling application
functions directly, not going over HTTP to a separately-running server.
Wrap each test in a transaction (`BEGIN` before, `ROLLBACK` after,
regardless of pass/fail) so nothing is ever actually committed.

**Cleanup:** automatic, by construction — but verify it's actually wired up
(a missing rollback call means every test run leaves real rows behind, and
this is easy to miss because the tests still "pass").

### 3. Real database, black-box over HTTP

The test starts (or connects to) a running server and hits its endpoints
with an HTTP client (Supertest, httpx) — the same shape most API-testing
guides (e.g. Supertest/httpx-based skills) assume. This is also what
applies to **E2E/webapp testing**, since a browser-driven test is even more
clearly hitting the app over the network.

**Rollback does not apply here** — the test process and the server process
don't share a transaction. Cleanup must be explicit:

1. **Tag every row created during the run.** Generate one `run_id` (UUID or
   timestamp-based) at suite start; every fixture/factory call includes it
   (a dedicated column, or embedded in an already-free-text field like an
   email: `test+<run_id>@example.test`). A fixed prefix (`test_`) works too
   for suites that don't need per-run isolation, but a `run_id` is safer
   when tests might run concurrently (e.g. two CI jobs against the same
   staging DB).
2. **Automatic teardown** — `afterAll` (or the project's equivalent) calls
   a cleanup routine that deletes everything tagged with this run's id,
   through the app's own delete endpoints if they exist (keeps the same
   "seed through the real path" discipline as creation), or direct
   deletion by tag if there's no such endpoint.
3. **A standalone script**, separate from the test run, that does the same
   deletion by tag/prefix — and is **idempotent**: calling it when there's
   nothing left to delete is a no-op, not an error. This exists specifically
   for when a test run crashes (process killed, CI job cancelled) before
   `afterAll` fires — without this, that run's data is permanent residue,
   silently, until someone notices the database growing test-looking rows.
   See `assets/cleanup_test_data.py` for a template.

## Deciding which mode applies

Ask, in order:

1. Does the test call application code directly (same process)? → mode 2
   is available; prefer it if the project already sets it up (fastest,
   zero residue by construction).
2. Does the test go over HTTP/network to a running server? → mode 3,
   tagging and teardown are mandatory, not optional.
3. Is the database's own behavior irrelevant to what's being tested? →
   mode 1 is simplest and needs nothing on top.

A single project can legitimately use more than one mode — unit/integration
tests in mode 1 or 2, and true end-to-end/API-contract tests in mode 3. What
must not happen is mode-3-shaped tests (hitting a live server) skipping
tagging and cleanup because "it's just a mock" — it isn't, once the server
under test is real.

## Standalone cleanup script shape

Minimum structure, language-agnostic:

```
1. Read the tag/prefix to clean (arg, or a fixed convention like
   "everything older than N hours matching pattern X").
2. For each entity type the suite creates, in reverse dependency order
   (children before parents, to respect FK constraints):
   - List rows matching the tag.
   - Delete them (via the app's own API/delete path if available, else
     direct deletion).
   - Log what was deleted — silent cleanup makes future debugging harder.
3. Exit 0 whether or not anything was found — "nothing to clean" is
   success, not failure.
```

This is exactly the shape of `assets/cleanup_test_data.py` in this skill —
adapt the entity list and the deletion calls to the project, keep the
"idempotent, logs what it did, exits clean either way" contract.
