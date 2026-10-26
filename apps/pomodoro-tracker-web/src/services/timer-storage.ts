/**
 * Persistence for the *running* timer.
 *
 * The timer is timestamp-based, not tick-based: what gets stored is when the
 * current run started, how long it was paused, and how long it is planned to
 * last. Remaining time is always recomputed from those numbers, so a refresh,
 * a closed tab, or a locked phone cannot desync the countdown.
 *
 * The stored run is stamped with its owner (see `device-state.ts`) and lives in
 * a slot of its own: a timer is one person's focus time, so a different account
 * on the same device must never inherit it — not the remaining countdown, not
 * the free-text label — and must not be able to overwrite it either.
 */

import {
  DEVICE_STATE_KEYS,
  activeTimerKey,
  readOwned,
  removeKey,
  writeOwned,
} from "./device-state";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface StoredTimerState {
  version: 1;
  mode: TimerMode;
  status: TimerStatus;
  /** UUID of the current focus run; sent as the session id when it completes. */
  sessionId: string | null;
  /** Epoch ms when the current run segment started. */
  startedAt: number | null;
  plannedMinutes: number;
  /** Total time spent paused so far in this run. */
  pausedAccumMs: number;
  /** Epoch ms when the current pause began, or null when not paused. */
  pausedAt: number | null;
  label: string;
  /** Focus sessions finished since the app started counting (drives long breaks). */
  focusCompletedTotal: number;
  /**
   * True when the user picked a custom length for *this* session only. Blocks
   * the "follow the server defaults" sync until the next mode change.
   */
  durationOverride: boolean;
}

const STORAGE_KEY = DEVICE_STATE_KEYS.activeTimer;

/**
 * Builds before the per-owner slot kept one timer for the whole device. That
 * payload can never be attributed, so it is dropped rather than migrated.
 */
function dropLegacySlot(): void {
  removeKey(STORAGE_KEY);
}

export function createIdleTimer(
  mode: TimerMode = "focus",
  plannedMinutes = 25,
  focusCompletedTotal = 0
): StoredTimerState {
  return {
    version: 1,
    mode,
    status: "idle",
    sessionId: null,
    startedAt: null,
    plannedMinutes,
    pausedAccumMs: 0,
    pausedAt: null,
    label: "",
    focusCompletedTotal,
    durationOverride: false,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Reads the stored timer for `userId` from that account's own slot, discarding
 * anything that is not owned by it or does not look structurally valid (older
 * shape, hand-edited localStorage, corrupted write).
 *
 * A run left behind by another account is ignored rather than adopted: resuming
 * it would show that person's label and, when it completed, record their focus
 * time under the current account.
 */
export function loadTimer(userId: string | null | undefined): StoredTimerState | null {
  if (!userId) return null;
  dropLegacySlot();

  return readOwned(activeTimerKey(userId), userId, (parsed) => {
    if (parsed.version !== 1) return null;
    if (!["focus", "short_break", "long_break"].includes(parsed.mode as string)) return null;
    if (!["idle", "running", "paused", "completed"].includes(parsed.status as string)) return null;
    if (!isFiniteNumber(parsed.plannedMinutes) || parsed.plannedMinutes <= 0) return null;
    if (parsed.startedAt !== null && !isFiniteNumber(parsed.startedAt)) return null;
    if (!isFiniteNumber(parsed.pausedAccumMs) || parsed.pausedAccumMs < 0) return null;
    if (parsed.pausedAt !== null && !isFiniteNumber(parsed.pausedAt)) return null;
    if (parsed.status === "running" && parsed.startedAt === null) return null;

    return {
      version: 1,
      mode: parsed.mode as TimerMode,
      status: parsed.status as TimerStatus,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      startedAt: parsed.startedAt ?? null,
      plannedMinutes: parsed.plannedMinutes,
      pausedAccumMs: parsed.pausedAccumMs,
      pausedAt: parsed.pausedAt ?? null,
      label: typeof parsed.label === "string" ? parsed.label.slice(0, 80) : "",
      focusCompletedTotal: isFiniteNumber(parsed.focusCompletedTotal)
        ? Math.max(0, Math.trunc(parsed.focusCompletedTotal))
        : 0,
      durationOverride: parsed.durationOverride === true,
    };
  });
}

export function saveTimer(userId: string | null | undefined, state: StoredTimerState): void {
  // Never persist a run we cannot attribute; it would be adopted by whoever
  // opens the app next.
  if (!userId) return;
  dropLegacySlot();
  // Own slot only: writing here must never disturb a partner's run in progress.
  writeOwned(activeTimerKey(userId), userId, state as unknown as Record<string, unknown>);
}

/** UUID v4 with a fallback for browsers without `crypto.randomUUID`. */
export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
