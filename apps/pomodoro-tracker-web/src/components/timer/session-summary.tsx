import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Timer } from "lucide-react";
import { pomodoroService } from "../../services/pomodoro.service";

export function SessionSummary() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pomodoro-stats"],
    queryFn: () => pomodoroService.getStats(),
    staleTime: 60_000,
  });

  const cards = [
    {
      label: "Sesi hari ini",
      value: isLoading ? "…" : String(data?.today.sessions ?? 0),
      icon: Timer,
      tone: "text-rose-600",
    },
    {
      label: "Menit fokus",
      value: isLoading ? "…" : String(data?.today.minutes ?? 0),
      icon: Clock,
      tone: "text-amber-600",
    },
    {
      label: "Streak",
      value: isLoading ? "…" : `${data?.streakDays ?? 0} hari`,
      icon: Flame,
      tone: "text-orange-600",
    },
  ];

  if (isError) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-color bg-card-surface p-4 text-center">
        <p className="text-xs font-bold text-text-secondary">
          Ringkasan hari ini belum bisa dimuat. Timer tetap bisa dipakai.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex flex-col gap-1 rounded-2xl border-2 border-border-color bg-card-surface p-3 shadow-[0_2px_0_0_var(--border-color)]"
          >
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-text-secondary">
              <Icon className={`h-3 w-3 ${card.tone}`} />
              {card.label}
            </span>
            <span className="text-xl font-black tabular-nums text-text-primary">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
