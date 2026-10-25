import { cn } from "../../lib/utils";
import type { TimerMode } from "../../services/timer-storage";

const MODES: Array<{ id: TimerMode; label: string }> = [
  { id: "focus", label: "Fokus" },
  { id: "short_break", label: "Break" },
  { id: "long_break", label: "Long Break" },
];

export interface ModeTabsProps {
  mode: TimerMode;
  /** Switching mode discards the current run, so it is blocked while one is live. */
  disabled?: boolean;
  onChange: (mode: TimerMode) => void;
}

export function ModeTabs({ mode, disabled = false, onChange }: ModeTabsProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-2xl border-2 border-border-color bg-card-surface p-1 shadow-xs"
      role="tablist"
      aria-label="Mode timer"
    >
      {MODES.map((item) => {
        const isActive = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              isActive
                ? "bg-text-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
