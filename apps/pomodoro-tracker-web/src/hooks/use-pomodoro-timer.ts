import * as React from "react";
import type { PomodoroCreateSessionInput } from "@repo/types";
import {
  createIdleTimer,
  loadTimer,
  newSessionId,
  saveTimer,
  type StoredTimerState,
  type TimerMode,
} from "../services/timer-storage";

export interface TimerSettings {
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  long_break_interval: number;
  auto_start_break: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_interval: 4,
  auto_start_break: true,
};

const TICK_MS = 250;

export function durationForMode(mode: TimerMode, settings: TimerSettings): number {
  if (mode === "short_break") return settings.short_break_minutes;
  if (mode === "long_break") return settings.long_break_minutes;
  return settings.focus_minutes;
}

function elapsedMs(state: StoredTimerState, now: number): number {
  const plannedMs = state.plannedMinutes * 60_000;

  if (state.status === "idle") return 0;
  if (state.status === "completed") return plannedMs;

  const startedAt = state.startedAt ?? now;
  const reference = state.status === "paused" ? (state.pausedAt ?? now) : now;
  const raw = reference - startedAt - state.pausedAccumMs;

  return Math.min(plannedMs, Math.max(0, raw));
}

export interface UsePomodoroTimerOptions {
  settings: TimerSettings;
  /**
   * Owner of the persisted run. A timer belongs to the person who started it, so
   * a run stored by another account on this device is ignored rather than
   * resumed (and never persisted without an owner).
   */
  userId?: string | null;
  /**
   * False while the server-backed durations are still loading. Completion is
   * held until then: the break length and auto-start flag must come from the
   * user's saved settings, not from the local fallback defaults.
   */
  settingsReady?: boolean;
  /** Called exactly once per finished focus session. */
  onFocusComplete: (session: PomodoroCreateSessionInput) => void;
  /** Called whenever any run (focus or break) reaches zero. */
  onComplete?: (mode: TimerMode) => void;
}

/**
 * Timestamp-based pomodoro state machine.
 *
 * The interval below only exists to re-render the countdown; it is never the
 * source of truth. Remaining time is derived from `startedAt`, `plannedMinutes`
 * and accumulated pause time, which is why closing the tab, refreshing, or
 * locking the phone cannot drift the timer.
 */
export function usePomodoroTimer({
  settings,
  userId,
  settingsReady = true,
  onFocusComplete,
  onComplete,
}: UsePomodoroTimerOptions) {
  const [state, setState] = React.useState<StoredTimerState>(
    () => loadTimer(userId) ?? createIdleTimer("focus", settings.focus_minutes)
  );
  const [now, setNow] = React.useState(() => Date.now());

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  const onFocusCompleteRef = React.useRef(onFocusComplete);
  onFocusCompleteRef.current = onFocusComplete;

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  /** Guards against recording the same finished run twice (StrictMode, re-renders). */
  const completionKeyRef = React.useRef<string | null>(null);

  // Persist on every transition so a reload resumes the exact same run.
  React.useEffect(() => {
    saveTimer(userId, state);
  }, [state, userId]);

  // Keep an idle timer in sync with the server-backed defaults (until the user
  // picks a custom length for this session).
  React.useEffect(() => {
    if (!settingsReady) return;
    if (state.status !== "idle" || state.startedAt !== null) return;
    if (state.durationOverride) return;
    if (settings.focus_minutes <= 0) return;

    const target = durationForMode(state.mode, settings);
    if (state.plannedMinutes === target) return;

    setState((current) =>
      current.status === "idle" && !current.durationOverride && current.plannedMinutes !== target
        ? { ...current, plannedMinutes: target }
        : current
    );
  }, [
    settingsReady,
    settings.focus_minutes,
    settings.short_break_minutes,
    settings.long_break_minutes,
    state.status,
    state.startedAt,
    state.mode,
    state.plannedMinutes,
    state.durationOverride,
  ]);

  // Re-render while a run is in flight. Nothing else depends on the interval.
  React.useEffect(() => {
    if (state.status !== "running") return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(interval);
  }, [state.status]);

  const plannedMs = state.plannedMinutes * 60_000;
  const elapsed = elapsedMs(state, now);
  const remainingMs = Math.max(0, plannedMs - elapsed);

  // Completion: flip to `completed` and record a finished *focus* session.
  React.useEffect(() => {
    if (!settingsReady) return;
    if (state.status !== "running") return;
    if (remainingMs > 0) return;

    const key = `${state.sessionId ?? "none"}:${state.startedAt ?? 0}:${state.plannedMinutes}`;
    if (completionKeyRef.current === key) return;
    completionKeyRef.current = key;

    const current = stateRef.current;

    if (current.mode === "focus") {
      const startAt = current.startedAt ?? Date.now();
      const endAt = startAt + current.plannedMinutes * 60_000 + current.pausedAccumMs;

      onFocusCompleteRef.current({
        id: current.sessionId ?? newSessionId(),
        label: current.label.trim() ? current.label.trim() : null,
        planned_minutes: current.plannedMinutes,
        actual_minutes: Math.max(1, Math.floor(current.plannedMinutes)),
        started_at: new Date(startAt).toISOString(),
        ended_at: new Date(endAt).toISOString(),
      });
    }

    setState({ ...current, status: "completed", pausedAt: null });
    onCompleteRef.current?.(current.mode);
  }, [remainingMs, settingsReady, state.status]);

  // Advance from `completed` to whatever comes next.
  React.useEffect(() => {
    if (state.status !== "completed") return;

    const current = stateRef.current;
    const settingsNow = settingsRef.current;

    if (current.mode === "focus") {
      const completedTotal = current.focusCompletedTotal + 1;
      const interval = Math.max(1, settingsNow.long_break_interval);
      const isLongBreak = completedTotal % interval === 0;
      const nextMode: TimerMode = isLongBreak ? "long_break" : "short_break";
      const nextMinutes = isLongBreak
        ? settingsNow.long_break_minutes
        : settingsNow.short_break_minutes;

      if (settingsNow.auto_start_break) {
        // The break starts now, not at the (possibly long past) completion
        // instant — the user was not watching, so a fresh break is the honest
        // interpretation.
        setState({
          ...createIdleTimer(nextMode, nextMinutes, completedTotal),
          status: "running",
          startedAt: Date.now(),
          label: current.label,
        });
      } else {
        setState({
          ...createIdleTimer(nextMode, nextMinutes, completedTotal),
          label: current.label,
        });
      }
      return;
    }

    // A break finished: the next focus session always waits for an explicit Start.
    setState({
      ...createIdleTimer("focus", durationForMode("focus", settingsNow), current.focusCompletedTotal),
      label: current.label,
    });
  }, [state.status]);

  const start = React.useCallback(() => {
    setState((current) => {
      if (current.status === "running") return current;
      const sessionId =
        current.mode === "focus" ? (current.sessionId ?? newSessionId()) : current.sessionId;
      return {
        ...current,
        status: "running",
        startedAt: Date.now(),
        pausedAccumMs: 0,
        pausedAt: null,
        sessionId,
      };
    });
    setNow(Date.now());
  }, []);

  const pause = React.useCallback(() => {
    setState((current) =>
      current.status === "running"
        ? { ...current, status: "paused", pausedAt: Date.now() }
        : current
    );
  }, []);

  const resume = React.useCallback(() => {
    setState((current) => {
      if (current.status !== "paused") return current;
      const pausedFor = current.pausedAt ? Date.now() - current.pausedAt : 0;
      return {
        ...current,
        status: "running",
        pausedAccumMs: current.pausedAccumMs + Math.max(0, pausedFor),
        pausedAt: null,
      };
    });
    setNow(Date.now());
  }, []);

  /** Discards the current run. Nothing is recorded — only finished sessions count. */
  const reset = React.useCallback(() => {
    setState((current) => ({
      ...current,
      status: "idle",
      sessionId: null,
      startedAt: null,
      pausedAccumMs: 0,
      pausedAt: null,
    }));
    completionKeyRef.current = null;
  }, []);

  /** Jumps to the next mode without recording anything. */
  const skip = React.useCallback(() => {
    setState((current) => {
      const settingsNow = settingsRef.current;

      if (current.mode === "focus") {
        const nextMode: TimerMode = "short_break";
        return {
          ...createIdleTimer(
            nextMode,
            durationForMode(nextMode, settingsNow),
            current.focusCompletedTotal
          ),
          label: current.label,
        };
      }

      return {
        ...createIdleTimer("focus", durationForMode("focus", settingsNow), current.focusCompletedTotal),
        label: current.label,
      };
    });
    completionKeyRef.current = null;
  }, []);

  /** Switch mode by hand. Only meaningful while nothing is running. */
  const selectMode = React.useCallback((mode: TimerMode) => {
    setState((current) => {
      if (current.status === "running" || current.status === "paused") return current;
      return {
        ...createIdleTimer(
          mode,
          durationForMode(mode, settingsRef.current),
          current.focusCompletedTotal
        ),
        label: current.label,
      };
    });
    completionKeyRef.current = null;
  }, []);

  /** Per-session duration override; defaults still live in Settings. */
  const setPlannedMinutes = React.useCallback((minutes: number) => {
    const safe = Math.min(180, Math.max(1, Math.round(minutes)));
    setState((current) => {
      if (current.status === "running" || current.status === "paused") return current;
      return {
        ...current,
        status: "idle",
        plannedMinutes: safe,
        sessionId: null,
        startedAt: null,
        pausedAccumMs: 0,
        pausedAt: null,
        durationOverride: true,
      };
    });
    completionKeyRef.current = null;
  }, []);

  const setLabel = React.useCallback((label: string) => {
    setState((current) => ({ ...current, label: label.slice(0, 80) }));
  }, []);

  return {
    mode: state.mode,
    status: state.status,
    plannedMinutes: state.plannedMinutes,
    label: state.label,
    remainingMs,
    plannedMs,
    progress: plannedMs > 0 ? Math.min(1, elapsed / plannedMs) : 0,
    focusCompletedTotal: state.focusCompletedTotal,
    isRunning: state.status === "running",
    isPaused: state.status === "paused",
    start,
    pause,
    resume,
    reset,
    skip,
    selectMode,
    setPlannedMinutes,
    setLabel,
  };
}
