/**
 * Probe for `errorMiddleware`, executed by `qa-api-runner.mjs` through `tsx`.
 *
 * The middleware lives in TypeScript, so a plain `node` test cannot import it.
 * This file only *collects* the responses and prints them as JSON — every
 * assertion stays in the runner, next to the other test cases.
 */
import { errorMiddleware } from "../src/middleware/error.middleware.js";

interface FakeResponse {
  statusCode: number;
  body: unknown;
  status: (code: number) => FakeResponse;
  json: (body: unknown) => FakeResponse;
}

function fakeResponse(): FakeResponse {
  const out = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      out.statusCode = code;
      return out;
    },
    json(body: unknown) {
      out.body = body;
      return out;
    },
  };
  return out;
}

function run(error: unknown) {
  const response = fakeResponse();
  errorMiddleware(error, {} as never, response as never, (() => {}) as never);
  return { statusCode: response.statusCode, body: response.body };
}

// Shape mysql2 throws for a duplicate key: no `status` / `statusCode`.
const driverError = new Error(
  "Duplicate entry '3c35929d-…' for key 'pomodoro_settings.PRIMARY'"
) as Error & { code?: string; errno?: number; sqlState?: string };
driverError.code = "ER_DUP_ENTRY";
driverError.errno = 1062;
driverError.sqlState = "23000";

// A handler that deliberately rejects the request.
const explicitError = new Error("Sesi tidak ditemukan") as Error & { statusCode?: number };
explicitError.statusCode = 404;

// Keep the probe's own output clean — the middleware logs every error.
const originalError = console.error;
console.error = () => {};
try {
  const unexpected = run(driverError);
  const explicit = run(explicitError);
  // stdout, so `execSync` in the runner can read it (it captures stdout only).
  process.stdout.write(`${JSON.stringify({ unexpected, explicit })}\n`);
} finally {
  console.error = originalError;
}
