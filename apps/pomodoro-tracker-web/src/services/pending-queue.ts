/**
 * The offline queue for finished focus sessions: storage plus the delivery
 * loop, with no React in it.
 *
 * A finished session is the only thing this app ever writes, and it is
 * append-only, so the queue is a simple retry list — no merge conflicts, no
 * two-way sync. The client-generated UUID makes every retry idempotent on the
 * server (`POST /sessions` answers 200 for an id it already has).
 *
 * Two invariants keep sessions from disappearing:
 *
 * 1. **Every write re-reads first.** Nothing writes back an array that was
 *    read before an `await`. A session that finishes while a POST is in flight
 *    must survive the flush that was already running.
 * 2. **Every entry records its owner.** The queue lives on a device, which may
 *    be shared, so flushing is scoped to the signed-in account: another
 *    person's entries are neither sent under the wrong cookie nor deleted, and
 *    are delivered when their owner comes back.
 */

import type { PomodoroCreateSessionInput } from "@repo/types";
import { isTransientError, isUnauthenticatedError } from "./api-errors";
import { DEVICE_STATE_KEYS, belongsTo, readJson, writeJson } from "./device-state";

const STORAGE_KEY = DEVICE_STATE_KEYS.pendingSessions;

export interface PendingSession {
  /** Account that completed the session; the only account allowed to send it. */
  user_id: string;
  input: PomodoroCreateSessionInput;
  queuedAt: number;
}

export function readQueue(): PendingSession[] {
  const parsed = readJson(STORAGE_KEY);
  if (!Array.isArray(parsed)) return [];

  // Entries without an owner cannot be proven to belong to anyone. They can only
  // come from a build that predates ownership stamping, so they are dropped
  // rather than guessed at — sending them is the exact cross-account bug this
  // guards against.
  return parsed.filter(
    (entry): entry is PendingSession =>
      typeof entry?.user_id === "string" &&
      entry.user_id.length > 0 &&
      Boolean(entry?.input?.id) &&
      typeof entry?.input?.started_at === "string"
  );
}

function writeQueue(queue: PendingSession[]): PendingSession[] {
  writeJson(STORAGE_KEY, queue);
  return queue;
}

/** Adds a finished session to the queue; the same id twice is still one entry. */
export function enqueueSession(
  ownerId: string,
  input: PomodoroCreateSessionInput
): PendingSession[] {
  const withoutDuplicate = readQueue().filter((entry) => entry.input.id !== input.id);
  return writeQueue([
    ...withoutDuplicate,
    { user_id: ownerId, input, queuedAt: Date.now() },
  ]);
}

/**
 * Drops entries by id, re-reading at the moment of writing.
 *
 * This is the whole fix for the "flush clobbers the queue" bug: the read and
 * the write happen in one synchronous step, so an entry queued while a POST was
 * in flight cannot be dropped by a snapshot taken before that POST.
 */
function removeSessions(ids: readonly string[]): PendingSession[] {
  if (ids.length === 0) return readQueue();
  const drop = new Set(ids);
  return writeQueue(readQueue().filter((entry) => !drop.has(entry.input.id)));
}

export interface FlushDeps {
  send: (input: PomodoroCreateSessionInput) => Promise<unknown>;
  /** Called with the freshly-read queue after every write, so the UI follows. */
  onQueueChange?: (queue: PendingSession[]) => void;
}

/**
 * Delivers this account's queued sessions, in order, once.
 *
 * - Success or a permanent refusal (400/422) removes that one entry.
 * - A transient failure (offline / 5xx) leaves it and moves on to the next.
 * - 401/403 means the session ended mid-flush: keep this entry and everything
 *   after it, and stop — the rest would fail identically.
 *
 * Sessions queued *while* this runs are left for the next flush rather than
 * being chased here, so a flaky connection cannot turn into a busy loop.
 */
export async function flushPendingSessions(
  userId: string | null | undefined,
  { send, onQueueChange }: FlushDeps
): Promise<PendingSession[]> {
  // Nothing can be attributed without an account.
  if (!userId) return readQueue();

  /** Drops one entry and tells the UI, keeping the write independent of listeners. */
  const discard = (id: string) => {
    const next = removeSessions([id]);
    onQueueChange?.(next);
  };

  for (const entry of readQueue()) {
    // Someone else's session: keep it queued for its owner.
    if (!belongsTo(entry.user_id, userId)) continue;

    try {
      await send(entry.input);
      discard(entry.input.id);
    } catch (error) {
      if (isUnauthenticatedError(error)) break;
      // Transient: leave it queued and try the next one.
      if (isTransientError(error)) continue;
      // Permanent (400/422): the server refused this payload; retrying forever
      // would wedge the queue, so drop it.
      discard(entry.input.id);
    }
  }

  const latest = readQueue();
  onQueueChange?.(latest);
  return latest;
}
