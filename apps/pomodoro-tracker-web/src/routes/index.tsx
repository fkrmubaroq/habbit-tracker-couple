import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { CloudOff, Loader2, UploadCloud } from "lucide-react";
import type { PomodoroCreateSessionInput } from "@repo/types";
import { LabelInput } from "../components/timer/label-input";
import { ModeTabs } from "../components/timer/mode-tabs";
import { PresetChips, type Preset } from "../components/timer/preset-chips";
import { SessionSummary } from "../components/timer/session-summary";
import { TimerControls } from "../components/timer/timer-controls";
import { TimerDial } from "../components/timer/timer-dial";
import { useOfflineQueue } from "../hooks/use-offline-queue";
import {
  DEFAULT_TIMER_SETTINGS,
  usePomodoroTimer,
  type TimerSettings,
} from "../hooks/use-pomodoro-timer";
import { useSession } from "../hooks/use-session";
import { useTimerAlerts } from "../hooks/use-timer-alerts";
import { pomodoroService } from "../services/pomodoro.service";
import type { TimerMode } from "../services/timer-storage";
import { useToastStore } from "../stores/toast.store";

export const Route = createFileRoute("/")({
  component: PomodoroTimerPage,
});

function PomodoroTimerPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { data: user } = useSession();
  const userId = user?.id;
  const { submit, pendingCount, isOnline } = useOfflineQueue(userId);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["pomodoro-settings", userId],
    queryFn: () => pomodoroService.getSettings(userId),
    staleTime: 5 * 60_000,
  });

  const timerSettings: TimerSettings = settings
    ? {
        focus_minutes: settings.focus_minutes,
        short_break_minutes: settings.short_break_minutes,
        long_break_minutes: settings.long_break_minutes,
        long_break_interval: settings.long_break_interval,
        auto_start_break: settings.auto_start_break,
      }
    : DEFAULT_TIMER_SETTINGS;

  const handleFocusComplete = React.useCallback(
    (session: PomodoroCreateSessionInput) => {
      void submit(session).then((result) => {
        if (result === "sent") {
          showToast("Sesi fokus tersimpan 🍅", "success");
        } else if (result === "queued") {
          // Offline is not an error: the session is safe in the queue.
          showToast("Offline — sesi disimpan & dikirim otomatis nanti", "success", 4500);
        } else if (result === "deferred") {
          // Signed out mid-session: kept in the queue, sent after the next login.
          showToast("Sesi disimpan — login lagi untuk mengirimnya", "success", 4500);
        } else {
          showToast("Sesi fokus gagal disimpan", "error");
        }
        queryClient.invalidateQueries({ queryKey: ["pomodoro-stats"] });
      });
    },
    [queryClient, showToast, submit]
  );

  /**
   * Completion side effects (chime/notification/confetti) are routed through a
   * ref: the timer hook must not re-create its state machine when the alerts
   * object changes identity.
   */
  const completionHandlerRef = React.useRef<(mode: TimerMode) => void>(() => {});

  const timer = usePomodoroTimer({
    settings: timerSettings,
    userId,
    settingsReady: !isLoadingSettings,
    onFocusComplete: handleFocusComplete,
    onComplete: (mode) => completionHandlerRef.current(mode),
  });

  const alerts = useTimerAlerts({
    mode: timer.mode,
    status: timer.status,
    remainingMs: timer.remainingMs,
  });

  completionHandlerRef.current = (mode) => {
    alerts.alertSessionComplete(mode);
    if (mode === "focus") {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 } });
    }
  };

  const presetMutation = useMutation({
    mutationFn: (preset: Preset) =>
      pomodoroService.updateSettings({
        focus_minutes: preset.focus,
        short_break_minutes: preset.shortBreak,
        long_break_minutes: preset.longBreak,
      }),
    onSuccess: (_data, preset) => {
      queryClient.invalidateQueries({ queryKey: ["pomodoro-settings"] });
      // Drop any per-session override so the new defaults take effect.
      timer.selectMode("focus");
      showToast(`Preset ${preset.label} dipakai sebagai default`, "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const isLocked = timer.status === "running" || timer.status === "paused";

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="h-13 w-13 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
            🍅
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Pomodoro
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                Pribadi
              </span>
              {isLoadingSettings ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-text-secondary" />
              ) : null}
            </div>
            <p className="text-xs font-bold text-text-secondary mt-0.5">
              Timer tetap akurat walau tab ditutup — sisa waktu dihitung dari jam mulai.
            </p>
          </div>
        </div>

        {/* Connectivity / queue indicator */}
        {!isOnline || pendingCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-border-color/60 pt-3">
            {!isOnline ? (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800">
                <CloudOff className="h-3.5 w-3.5" />
                Offline
              </span>
            ) : null}
            {pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-800">
                <UploadCloud className="h-3.5 w-3.5" />
                {pendingCount} sesi menunggu dikirim
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Timer Card */}
      <div className="flex flex-col items-center gap-5 bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-7 shadow-[0_4px_0_0_var(--border-color)]">
        <ModeTabs mode={timer.mode} disabled={isLocked} onChange={timer.selectMode} />

        <TimerDial
          remainingMs={timer.remainingMs}
          plannedMs={timer.plannedMs}
          progress={timer.progress}
          mode={timer.mode}
          status={timer.status}
          label={timer.label}
        />

        <PresetChips
          focusMinutes={timer.mode === "focus" ? timer.plannedMinutes : timerSettings.focus_minutes}
          disabled={isLocked || presetMutation.isPending}
          onSelect={(preset) => presetMutation.mutate(preset)}
          onCustom={(minutes) => timer.setPlannedMinutes(minutes)}
        />

        <div className="w-full max-w-sm">
          <LabelInput
            value={timer.label}
            disabled={timer.mode !== "focus"}
            onChange={timer.setLabel}
          />
        </div>

        <TimerControls
          status={timer.status}
          mode={timer.mode}
          onStart={() => {
            alerts.primeAudio();
            timer.start();
          }}
          onPause={timer.pause}
          onResume={() => {
            alerts.primeAudio();
            timer.resume();
          }}
          onReset={timer.reset}
          onSkip={timer.skip}
        />
      </div>

      {/* Today summary */}
      <SessionSummary />

      {/* Cycle hint */}
      <div className="rounded-2xl border-2 border-border-color bg-card-surface p-4">
        <p className="text-[11px] font-bold leading-relaxed text-text-secondary">
          Siklus: {timer.focusCompletedTotal} sesi fokus selesai
          {timerSettings.long_break_interval > 0
            ? ` · long break tiap ${timerSettings.long_break_interval} sesi`
            : ""}
          {" · "}
          {timerSettings.auto_start_break
            ? "break mulai otomatis"
            : "break menunggu tombol Mulai"}
          .
        </p>
      </div>
    </div>
  );
}
