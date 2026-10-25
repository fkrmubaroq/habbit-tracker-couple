/**
 * How a failed request should be treated by the offline queue.
 *
 * These two rules are the whole retry policy, and they are pure: no HTTP
 * client, no `window`. That keeps them importable from a plain Node test
 * (`tests/pomodoro-state-probe.mts`) instead of only from a browser, which is
 * how the queue's behaviour was verified before.
 */

/**
 * True when the request was refused because the caller is not (or no longer)
 * signed in.
 *
 * This is deliberately *not* folded into `isTransientError` or into the generic
 * 4xx rule: 401/403 says nothing about the payload. The same request succeeds
 * after signing in again, so queued work must be kept and retried, not dropped.
 */
export function isUnauthenticatedError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * True when a failure is worth retrying later.
 *
 * - No `status`: the request never reached a server (offline, DNS, connection
 *   reset).
 * - 5xx: the server or the dev proxy is temporarily unavailable. Vite's proxy
 *   answers 502 when the API process is down, which must not be mistaken for a
 *   permanent rejection.
 *
 * 4xx means the payload itself was refused, so retrying it forever would wedge
 * the queue. 401/403 are the exception — see `isUnauthenticatedError`.
 */
export function isTransientError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === undefined || status >= 500;
}
