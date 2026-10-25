import * as React from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Preset {
  id: string;
  label: string;
  focus: number;
  shortBreak: number;
  longBreak: number;
}

export const PRESETS: readonly Preset[] = [
  { id: "classic", label: "25 / 5 / 15", focus: 25, shortBreak: 5, longBreak: 15 },
  { id: "deep", label: "50 / 10 / 20", focus: 50, shortBreak: 10, longBreak: 20 },
  { id: "ultradian", label: "90 / 20 / 30", focus: 90, shortBreak: 20, longBreak: 30 },
];

export interface PresetChipsProps {
  /** Current session length, used to highlight a matching preset. */
  focusMinutes: number;
  disabled?: boolean;
  onSelect: (preset: Preset) => void;
  onCustom: (minutes: number) => void;
}

export function PresetChips({
  focusMinutes,
  disabled = false,
  onSelect,
  onCustom,
}: PresetChipsProps) {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customValue, setCustomValue] = React.useState(String(focusMinutes));

  const activePreset = PRESETS.find((preset) => preset.focus === focusMinutes);

  const submitCustom = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(customValue);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(180, Math.max(1, Math.round(parsed)));
    setCustomValue(String(clamped));
    onCustom(clamped);
    setShowCustom(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                isActive
                  ? "border-primary bg-highlight text-text-primary font-black shadow-xs"
                  : "border-border-color bg-card-surface text-text-secondary hover:text-text-primary"
              )}
            >
              {isActive ? <Check className="h-3 w-3 stroke-[3]" /> : null}
              <span>{preset.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setCustomValue(String(focusMinutes));
            setShowCustom((value) => !value);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-1.5 text-xs font-bold transition-all",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            !activePreset
              ? "border-primary bg-highlight text-text-primary"
              : "border-border-color text-text-secondary hover:text-text-primary"
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>{!activePreset ? `${focusMinutes} menit` : "Custom"}</span>
        </button>
      </div>

      {showCustom ? (
        <form
          onSubmit={submitCustom}
          className="flex items-center justify-center gap-2 pt-1"
        >
          <input
            type="number"
            min={1}
            max={180}
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            className="h-9 w-20 rounded-xl border-2 border-border-color bg-highlight px-3 text-center text-sm font-extrabold text-text-primary focus:border-primary focus:outline-none"
            aria-label="Durasi fokus dalam menit"
          />
          <span className="text-xs font-bold text-text-secondary">menit</span>
          <button
            type="submit"
            className="h-9 rounded-xl border-2 border-border-color bg-card-surface px-3 text-xs font-black text-text-primary hover:bg-highlight"
          >
            Pakai
          </button>
        </form>
      ) : null}

      <p className="text-center text-[11px] font-semibold text-text-secondary">
        Preset menyimpan durasi default. Angka custom hanya berlaku untuk sesi ini.
      </p>
    </div>
  );
}
