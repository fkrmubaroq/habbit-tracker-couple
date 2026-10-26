import * as React from "react";
import type { TimerMode } from "../services/timer-storage";
import { usePreferencesStore } from "../stores/preferences.store";

const MODE_LABEL: Record<TimerMode, string> = {
  focus: "Fokus",
  short_break: "Break",
  long_break: "Long Break",
};

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Completion feedback: OS notification, a short chime, and a live countdown in
 * the tab title.
 *
 * Platform limit, documented in the PRD: browsers offer no reliable scheduling
 * API, so a notification cannot be *guaranteed* once the browser process is
 * gone. What is guaranteed is that the timer state stays correct, and the alert
 * fires as soon as the app is alive again.
 */
export function useTimerAlerts(options: {
  mode: TimerMode;
  status: "idle" | "running" | "paused" | "completed";
  remainingMs: number;
}) {
  const { mode, status, remainingMs } = options;
  const soundMuted = usePreferencesStore((s) => s.soundMuted);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const baseTitleRef = React.useRef<string>(
    typeof document === "undefined" ? "Pomodoro" : document.title
  );

  /** Must run inside a user gesture, otherwise browsers keep the context suspended. */
  const primeAudio = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new Ctor();
      }
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }
    } catch {
      // Audio is a nicety; never let it break the timer.
    }
  }, []);

  const playChime = React.useCallback(() => {
    if (soundMuted) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { frequency: 880, start: 0, duration: 0.16 },
        { frequency: 1174.66, start: 0.18, duration: 0.22 },
      ];

      for (const note of notes) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = note.frequency;
        gain.gain.setValueAtTime(0.0001, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.22, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + note.start);
        oscillator.stop(now + note.start + note.duration + 0.02);
      }
    } catch {
      // ignore
    }
  }, [soundMuted]);

  const requestPermission = React.useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationsEnabled(false);
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      return permission;
    } catch {
      setNotificationsEnabled(false);
      return "denied";
    }
  }, [setNotificationsEnabled]);

  const notify = React.useCallback(
    (title: string, body: string) => {
      if (!notificationsEnabled) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      try {
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}favicon/web-app-manifest-192x192.png`,
          tag: "pomodoro-session",
        });
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    },
    [notificationsEnabled]
  );

  /** Fired when a run hits zero — sound + notification for either mode. */
  const alertSessionComplete = React.useCallback(
    (completedMode: TimerMode) => {
      playChime();

      if (completedMode === "focus") {
        notify("Sesi fokus selesai 🍅", "Waktunya istirahat sebentar.");
      } else {
        notify("Break selesai ☕", "Siap lanjut sesi fokus berikutnya?");
      }
    },
    [notify, playChime]
  );

  // Live countdown in the tab title — visible from another tab without focus.
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (status === "running" || status === "paused") {
      const suffix = status === "paused" ? " (jeda)" : "";
      document.title = `${formatClock(remainingMs)} — ${MODE_LABEL[mode]}${suffix}`;
      return;
    }

    document.title = baseTitleRef.current;
  }, [mode, remainingMs, status]);

  React.useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.title = baseTitleRef.current;
      }
    };
  }, []);

  return {
    primeAudio,
    playChime,
    notify,
    alertSessionComplete,
    requestPermission,
  };
}
