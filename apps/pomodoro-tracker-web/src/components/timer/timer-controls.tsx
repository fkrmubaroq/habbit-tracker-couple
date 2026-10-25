import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "../ui/button";
import type { TimerMode, TimerStatus } from "../../services/timer-storage";

export interface TimerControlsProps {
  status: TimerStatus;
  mode: TimerMode;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({
  status,
  mode,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: TimerControlsProps) {
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdle = status === "idle";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2.5">
        {isRunning ? (
          <Button
            variant="3d"
            size="lg"
            onClick={onPause}
            className="min-w-[9.5rem] font-black flex items-center gap-2"
          >
            <Pause className="h-5 w-5" />
            <span>Jeda</span>
          </Button>
        ) : (
          <Button
            variant="3d"
            size="lg"
            onClick={isPaused ? onResume : onStart}
            className="min-w-[9.5rem] font-black flex items-center gap-2"
          >
            <Play className="h-5 w-5" />
            <span>{isPaused ? "Lanjut" : mode === "focus" ? "Mulai Fokus" : "Mulai Break"}</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          disabled={isIdle}
          title="Reset sesi (tidak dicatat)"
          aria-label="Reset sesi"
          className="h-12 w-12"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSkip}
          title={mode === "focus" ? "Lewati fokus ke break" : "Lewati break ke fokus"}
          aria-label="Lewati sesi"
          className="h-12 w-12"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-center text-[11px] font-semibold text-text-secondary">
        Reset & lewati tidak dicatat. Hanya sesi fokus yang selesai masuk statistik.
      </p>
    </div>
  );
}
