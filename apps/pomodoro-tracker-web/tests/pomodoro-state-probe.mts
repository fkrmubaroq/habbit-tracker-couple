/**
 * Regression probe for the client state that the browser pass cannot pin down:
 * the offline queue's delivery loop (B6) and the per-owner timer slot (B7).
 *
 * Both defects were races — one needed a POST in flight while a session
 * finished, the other needed a second account to save its own timer. A browser
 * pass can only hope to hit those windows; here the interleaving is explicit, so
 * a regression fails every time instead of occasionally.
 *
 * Run with: `pnpm --filter=@repo/pomodoro-tracker-web test:probe`
 */

import type { PomodoroCreateSessionInput } from "@repo/types";
import { DEVICE_STATE_KEYS, clearDeviceState } from "../src/services/device-state";
import {
  enqueueSession,
  flushPendingSessions,
  readQueue,
} from "../src/services/pending-queue";
import { createIdleTimer, loadTimer, saveTimer } from "../src/services/timer-storage";

const JULIET = "81e5b08e-2246-4545-91dd-92a83ff03e15";
const ROMEO = "9ba64225-9a50-4fa4-b840-961ab250f412";

// ---------------------------------------------------------------- fake device

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

const store = new MemoryStorage();
// The modules guard on `typeof window`, then use `localStorage` directly.
(globalThis as Record<string, unknown>).window = { location: {} };
(globalThis as Record<string, unknown>).localStorage = store;

// ---------------------------------------------------------------- harness

let passed = 0;
let failed = 0;

async function test(id: string, name: string, fn: () => void | Promise<void>) {
  process.stdout.write(`[${id}] ${name}... `);
  store.clear();
  try {
    await fn();
    passed += 1;
    console.log("PASSED");
  } catch (error) {
    failed += 1;
    console.log(`FAILED -> ${(error as Error).message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message} (dapat ${a}, harus ${e})`);
}

function session(id: string, label: string): PomodoroCreateSessionInput {
  return {
    id,
    label,
    planned_minutes: 25,
    actual_minutes: 25,
    started_at: "2026-10-25T01:00:00.000Z",
    ended_at: "2026-10-25T01:25:00.000Z",
  };
}

/** A `send` whose completion is controlled by the test, so the race is exact. */
function controlledSend() {
  const calls: string[] = [];
  const pending = new Map<string, { resolve: () => void; reject: (error: unknown) => void }>();

  const send = (input: PomodoroCreateSessionInput) => {
    calls.push(input.id);
    return new Promise<void>((resolve, reject) => {
      pending.set(input.id, { resolve, reject });
    });
  };

  const settle = async (id: string, outcome: "ok" | unknown) => {
    const entry = pending.get(id);
    assert(entry, `POST untuk ${id} tidak pernah dikirim`);
    if (outcome === "ok") entry.resolve();
    else entry.reject(outcome);
    // Let the awaiting loop advance to its next statement.
    await new Promise((resolve) => setImmediate(resolve));
  };

  return { send, calls, settle };
}

// ---------------------------------------------------------------- B6

await test(
  "TC15-1",
  "Sesi yang masuk antrean saat flush berjalan tidak ikut terhapus (B6)",
  async () => {
    enqueueSession(JULIET, session("a", "Sesi A"));
    const { send, calls, settle } = controlledSend();

    // flush() reads the queue and starts POST(A); it is now suspended on await.
    const flushing = flushPendingSessions(JULIET, { send });
    await new Promise((resolve) => setImmediate(resolve));
    assertEqual(calls, ["a"], "flush harus mengirim A lebih dulu");

    // While POST(A) is in flight, a focus session finishes and is queued.
    enqueueSession(JULIET, session("b", "Sesi B"));
    assertEqual(
      readQueue().map((entry) => entry.input.id),
      ["a", "b"],
      "antrean harus memuat A dan B sebelum flush selesai"
    );

    await settle("a", "ok");
    const after = await flushing;

    assertEqual(
      after.map((entry) => entry.input.id),
      ["b"],
      "entri yang masuk saat flush berjalan harus bertahan"
    );
    assertEqual(
      readQueue().map((entry) => entry.input.id),
      ["b"],
      "storage harus sama dengan hasil flush"
    );
  }
);

await test("TC15-2", "Entri terkirim tidak dikirim ulang, 401 menunda, 400 membuang (B5/B6)", async () => {
  enqueueSession(JULIET, session("a", "Sesi A"));
  enqueueSession(JULIET, session("b", "Sesi B"));
  enqueueSession(JULIET, session("c", "Sesi C"));
  enqueueSession(ROMEO, session("r", "Milik Romeo"));

  const sent: string[] = [];
  const authError = Object.assign(new Error("belum login"), { status: 401 });
  const refused = Object.assign(new Error("payload ditolak"), { status: 400 });

  const first = await flushPendingSessions(JULIET, {
    send: async (input) => {
      sent.push(input.id);
      if (input.id === "a") return;
      if (input.id === "b") throw refused; // 400 -> dibuang
      throw authError; // 401 -> sisa antrean ditunda
    },
  });

  assertEqual(sent, ["a", "b", "c"], "hanya entri milik Juliet yang boleh dikirim");
  assertEqual(
    first.map((entry) => `${entry.user_id === JULIET ? "J" : "R"}:${entry.input.id}`),
    ["J:c", "R:r"],
    "A terkirim, B dibuang (400), C ditunda (401), milik Romeo tidak disentuh"
  );

  // Next flush delivers what was deferred, exactly once.
  const sentAgain: string[] = [];
  const second = await flushPendingSessions(JULIET, {
    send: async (input) => {
      sentAgain.push(input.id);
    },
  });

  assertEqual(sentAgain, ["c"], "C harus terkirim pada flush berikutnya");
  assertEqual(
    second.map((entry) => entry.input.id),
    ["r"],
    "antrean Juliet bersih, milik Romeo tetap utuh"
  );
});

// ---------------------------------------------------------------- B7

await test("TC15-3", "Run timer milik pasangan tidak terhapus saat akun lain membuka app (B7)", () => {
  const julietRun = {
    ...createIdleTimer("focus", 25),
    status: "running" as const,
    sessionId: "11111111-1111-4111-8111-111111111111",
    startedAt: Date.now() - 24 * 60_000,
    label: "Rahasia Juliet",
  };
  saveTimer(JULIET, julietRun);

  // Romeo opens the app: he must see his own idle timer, not Juliet's run.
  assert(loadTimer(ROMEO) === null, "Romeo tidak boleh mewarisi run Juliet");
  saveTimer(ROMEO, createIdleTimer("focus", 25));

  // Juliet comes back: her run — and her label — are still there.
  const resumed = loadTimer(JULIET);
  assert(resumed, "run Juliet hilang setelah Romeo memakai perangkat");
  assert(resumed.status === "running", `status run Juliet harus running, dapat ${resumed.status}`);
  assert(resumed.label === "Rahasia Juliet", `label Juliet hilang, dapat "${resumed.label}"`);
  assert(
    resumed.startedAt === julietRun.startedAt,
    "startedAt berubah — sisa waktu akan salah"
  );
  assert(loadTimer(ROMEO)?.status === "idle", "Romeo harus tetap punya slot idle miliknya");

  // A build before the per-owner slot left an owner-less payload behind. It can
  // never be attributed, so it is dropped rather than inherited by whoever
  // opens the app next — and its label must not be left lying on the device.
  store.setItem(
    DEVICE_STATE_KEYS.activeTimer,
    JSON.stringify({
      version: 1,
      mode: "focus",
      status: "running",
      sessionId: null,
      startedAt: Date.now() - 60_000,
      plannedMinutes: 25,
      pausedAccumMs: 0,
      pausedAt: null,
      label: "Sisa build lama",
      focusCompletedTotal: 0,
      durationOverride: false,
    })
  );
  assert(loadTimer(JULIET)?.label === "Rahasia Juliet", "payload lama tidak boleh menimpa slot pemilik");
  assert(
    store.getItem(DEVICE_STATE_KEYS.activeTimer) === null,
    "payload lama harus dibersihkan agar label pribadi tidak tertinggal"
  );
});

await test("TC15-4", "Logout hanya membersihkan slot timer milik akun yang keluar (B7)", () => {
  saveTimer(JULIET, {
    ...createIdleTimer("focus", 25),
    status: "running" as const,
    startedAt: Date.now() - 60_000,
    label: "Rahasia Juliet",
  });
  saveTimer(ROMEO, createIdleTimer("focus", 25));
  enqueueSession(JULIET, session("a", "Belum terkirim"));
  store.setItem(DEVICE_STATE_KEYS.sessionCache, JSON.stringify({ id: JULIET }));

  clearDeviceState(JULIET);

  assert(loadTimer(JULIET) === null, "slot timer Juliet harus dibersihkan saat logout");
  assert(store.getItem(DEVICE_STATE_KEYS.sessionCache) === null, "cache identitas harus dibersihkan");
  assert(loadTimer(ROMEO) !== null, "slot timer Romeo tidak boleh ikut terhapus");
  assert(readQueue().length === 1, "antrean sesi yang belum terkirim harus dipertahankan");
});

// ---------------------------------------------------------------- report

console.log("-------------------------------------------------");
console.log(`HASIL: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
