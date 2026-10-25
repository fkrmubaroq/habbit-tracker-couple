import * as React from "react";
import type { PomodoroCreateSessionInput } from "@repo/types";
import { isTransientError, isUnauthenticatedError } from "../services/api-errors";
import { belongsTo } from "../services/device-state";
import {
  enqueueSession,
  flushPendingSessions,
  readQueue,
  type PendingSession,
} from "../services/pending-queue";
import { pomodoroService } from "../services/pomodoro.service";

/**
 * React binding for the offline queue.
 *
 * The queue itself — storage, ownership, and the delivery loop — lives in
 * `services/pending-queue.ts` so it can be tested without a browser. This hook
 * only keeps a copy in component state, reports connectivity, and serialises
 * flushes.
 */

export type SubmitResult = "sent" | "queued" | "deferred" | "rejected";

export function useOfflineQueue(userId: string | null | undefined) {
  const [queue, setQueue] = React.useState<PendingSession[]>(() => readQueue());
  const [isOnline, setIsOnline] = React.useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [isFlushing, setIsFlushing] = React.useState(false);
  const flushingRef = React.useRef(false);

  const flush = React.useCallback(async () => {
    if (!userId) return; // Nothing can be attributed without an account.
    if (flushingRef.current) return;

    flushingRef.current = true;
    setIsFlushing(true);

    try {
      await flushPendingSessions(userId, {
        send: (input) => pomodoroService.createSession(input),
        onQueueChange: setQueue,
      });
    } finally {
      flushingRef.current = false;
      setIsFlushing(false);
    }
  }, [userId]);

  /** Send now; fall back to the queue whenever retrying later could succeed. */
  const submit = React.useCallback(
    async (input: PomodoroCreateSessionInput): Promise<SubmitResult> => {
      if (!userId) return "deferred";

      try {
        await pomodoroService.createSession(input);
        return "sent";
      } catch (error) {
        if (isUnauthenticatedError(error)) {
          // Keep the finished session for after the re-login instead of losing
          // the focus time the user already did.
          setQueue(enqueueSession(userId, input));
          return "deferred";
        }
        if (isTransientError(error)) {
          setQueue(enqueueSession(userId, input));
          return "queued";
        }
        return "rejected";
      }
    },
    [userId]
  );

  // Flush on mount and whenever connectivity comes back.
  React.useEffect(() => {
    // Re-read so an account switch does not keep showing the previous user's
    // pending count.
    setQueue(readQueue());
    void flush();

    const handleOnline = () => {
      setIsOnline(true);
      void flush();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  // Only this account's sessions are reported to this account's UI.
  const mine = queue.filter((entry) => belongsTo(entry.user_id, userId));

  return {
    pendingCount: mine.length,
    pending: mine.map((entry) => entry.input),
    isOnline,
    isFlushing,
    submit,
    flush,
  };
}
