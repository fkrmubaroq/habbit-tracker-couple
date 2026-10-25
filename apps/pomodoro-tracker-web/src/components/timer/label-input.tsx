import { Tag } from "lucide-react";

export interface LabelInputProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 80;

export function LabelInput({ value, disabled = false, onChange }: LabelInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="pomodoro-label"
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-secondary"
      >
        <Tag className="h-3.5 w-3.5" />
        Label sesi
      </label>
      <input
        id="pomodoro-label"
        type="text"
        value={value}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Misal: Coding, Belajar, Menulis…"
        className="h-11 w-full rounded-xl border-2 border-border-color bg-card-surface px-3.5 text-sm font-bold text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none disabled:opacity-60"
      />
      <span className="self-end text-[10px] font-bold text-text-secondary">
        {value.length}/{MAX_LENGTH}
      </span>
    </div>
  );
}
