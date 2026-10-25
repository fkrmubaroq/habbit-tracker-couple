/**
 * Ownership for the pomodoro state that lives in `localStorage`.
 *
 * Pomodoro data is personal, but `localStorage` is per *device*. Two accounts
 * sharing one browser — a couple's laptop, a shared tablet — would otherwise
 * inherit each other's running timer, cached durations, and (worst) flush each
 * other's queued sessions under the wrong cookie.
 *
 * So every payload written through here records its owner, and every read is
 * scoped to the account asking for it. Keeping the rule in one place is
 * deliberate: scattering `if (userId)` checks across four modules is how this
 * bug got in.
 *
 * `pomodoro-session-cache` is the exception — it is *not* owner-scoped. It is
 * the bootstrap identity used when the app boots offline and there is no server
 * answer to derive an id from, so requiring an id to read it would be circular.
 * It is cleared on logout instead.
 */

export const DEVICE_STATE_KEYS = {
  sessionCache: "pomodoro-session-cache",
  settingsCache: "pomodoro-settings-cache",
  activeTimer: "pomodoro-active-timer",
  pendingSessions: "pomodoro-pending-sessions",
} as const;

/** The field every owned payload carries. */
export const OWNER_FIELD = "user_id";

/**
 * Full storage key for one account's running timer.
 *
 * The timer gets a slot *per owner* rather than one slot for the device. With a
 * single key, `loadTimer` correctly refused another account's run — and then
 * that account's own `saveTimer` wrote its idle state over the same slot,
 * destroying the run that was still in progress. Refusing to adopt a run must
 * not amount to deleting it.
 */
export function activeTimerKey(userId: string): string {
  return `${DEVICE_STATE_KEYS.activeTimer}:${userId}`;
}

/**
 * True when `ownerId` is a real account id and it matches the active user.
 *
 * An absent `ownerId` never matches: a payload with no recorded owner cannot be
 * proven to belong to anyone, and guessing is exactly the failure being fixed.
 */
export function belongsTo(ownerId: unknown, userId: string | null | undefined): boolean {
  return typeof userId === "string" && userId.length > 0 && ownerId === userId;
}

export function readJson(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota. The value still works for this page load.
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Reads a single-object payload, returning it only when `userId` owns it.
 *
 * `parse` receives the raw record (owner field included) so each module keeps
 * its own structural validation without repeating the ownership check.
 */
export function readOwned<T>(
  key: string,
  userId: string | null | undefined,
  parse: (record: Record<string, unknown>) => T | null
): T | null {
  const raw = readJson(key);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  if (!belongsTo(record[OWNER_FIELD], userId)) return null;

  return parse(record);
}

/** Writes a single-object payload stamped with its owner. */
export function writeOwned(key: string, userId: string, value: Record<string, unknown>): void {
  writeJson(key, { ...value, [OWNER_FIELD]: userId });
}

/**
 * Drops the state that a *different* account on this device would inherit:
 * cached identity, cached durations, and the timer slot of the account that is
 * leaving.
 *
 * Only the leaver's timer slot is removed — a partner's run in progress lives
 * in its own slot and keeps counting down.
 *
 * Queued sessions are intentionally kept. They are stamped per entry, are never
 * sent or shown under another account, and deleting them on logout would throw
 * away focus time the user already did — the same data loss B5 fixes. They are
 * delivered when their owner logs back in.
 */
export function clearDeviceState(userId?: string | null): void {
  removeKey(DEVICE_STATE_KEYS.sessionCache);
  removeKey(DEVICE_STATE_KEYS.settingsCache);
  // Debris from builds that kept a single, owner-less timer for the whole
  // device. That payload can never be attributed, so it is not migrated.
  removeKey(DEVICE_STATE_KEYS.activeTimer);
  if (typeof userId === "string" && userId.length > 0) {
    removeKey(activeTimerKey(userId));
  }
}
