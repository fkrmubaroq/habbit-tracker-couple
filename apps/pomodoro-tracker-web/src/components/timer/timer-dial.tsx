import { cn } from "../../lib/utils";
import type { TimerMode, TimerStatus } from "../../services/timer-storage";

const MODE_STROKE: Record<TimerMode, string> = {
  focus: "stroke-rose-500",
  short_break: "stroke-emerald-500",
  long_break: "stroke-sky-500",
};

const MODE_TEXT: Record<TimerMode, string> = {
  focus: "text-rose-600",
  short_break: "text-emerald-600",
  long_break: "text-sky-600",
};

const MODE_LABEL: Record<TimerMode, string> = {
  focus: "Fokus",
  short_break: "Break",
  long_break: "Long Break",
};

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface TimerDialProps {
  remainingMs: number;
  plannedMs: number;
  progress: number;
  mode: TimerMode;
  status: TimerStatus;
  label?: string;
}

const SIZE = 288;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerDial({
  remainingMs,
  plannedMs,
  progress,
  mode,
  status,
  label,
}: TimerDialProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = CIRCUMFERENCE * clamped;
  const isPaused = status === "paused";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="max-w-full h-auto -rotate-90"
        role="img"
        aria-label={`Sisa waktu ${formatClock(remainingMs)} untuk mode ${MODE_LABEL[mode]}`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border-color/60"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={cn(
            MODE_STROKE[mode],
            "transition-[stroke-dashoffset] duration-300 ease-linear",
            isPaused && "opacity-60"
          )}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-8 text-center">
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.18em]",
            MODE_TEXT[mode]
          )}
        >
          {MODE_LABEL[mode]}
          {isPaused ? " · Jeda" : ""}
        </span>
        <span
          className={cn(
            "font-black tabular-nums leading-none text-text-primary",
            "text-5xl sm:text-6xl",
            isPaused && "opacity-70"
          )}
        >
          {formatClock(remainingMs)}
        </span>
        <span className="text-[11px] font-bold text-text-secondary">
          {Math.round(plannedMs / 60_000)} menit
        </span>
        {label ? (
          <span className="mt-1 max-w-[10rem] truncate rounded-full bg-highlight px-2.5 py-0.5 text-[11px] font-extrabold text-text-primary border border-border-color">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
