import * as React from "react";
import { cn } from "../../lib/utils";

export interface HeatmapDay {
  date: string;
  minutes: number;
  sessions: number;
}

export interface YearHeatmapProps {
  year: number;
  days: HeatmapDay[];
}

const LEVEL_CLASS = [
  "bg-highlight border-border-color/50",
  "bg-rose-200 border-rose-300",
  "bg-rose-300 border-rose-400",
  "bg-rose-400 border-rose-500",
  "bg-rose-600 border-rose-700",
];

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAY_LABELS = ["Sen", "", "Rab", "", "Jum", "", "Min"];

/** Minutes → one of 5 intensity buckets. */
function levelFor(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function toUtcDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatReadable(dateKey: string): string {
  const date = toUtcDate(dateKey);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function YearHeatmap({ year, days }: YearHeatmapProps) {
  const minutesByDate = React.useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  // Columns are ISO weeks (Monday first), rows are weekdays — GitHub's shape.
  const { weeks, monthMarkers } = React.useMemo(() => {
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const dec31 = new Date(Date.UTC(year, 11, 31));

    // 0 = Monday … 6 = Sunday
    const jan1Weekday = (jan1.getUTCDay() + 6) % 7;
    const gridStart = new Date(jan1);
    gridStart.setUTCDate(jan1.getUTCDate() - jan1Weekday);

    const columns: Array<Array<{ dateKey: string; inYear: boolean }>> = [];
    const markers: Array<{ index: number; label: string }> = [];
    const cursor = new Date(gridStart);
    let weekIndex = 0;

    while (cursor.getTime() <= dec31.getTime() || cursor.getUTCDay() !== 1) {
      const week: Array<{ dateKey: string; inYear: boolean }> = [];

      for (let day = 0; day < 7; day += 1) {
        const current = new Date(cursor);
        current.setUTCDate(cursor.getUTCDate() + day);
        const inYear = current.getUTCFullYear() === year;
        week.push({ dateKey: formatDateKey(current), inYear });

        // Month label sits on the column containing the 1st of that month.
        if (inYear && current.getUTCDate() === 1) {
          markers.push({ index: weekIndex, label: MONTH_LABELS[current.getUTCMonth()] });
        }
      }

      columns.push(week);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      weekIndex += 1;

      if (columns.length > 54) break;
    }

    return { weeks: columns, monthMarkers: markers };
  }, [year]);

  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-bold text-text-secondary">
          {totalMinutes > 0
            ? `${totalMinutes} menit fokus di ${year}`
            : `Belum ada sesi fokus di ${year}`}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-text-secondary">Sedikit</span>
          {LEVEL_CLASS.map((cls, index) => (
            <span key={index} className={cn("h-2.5 w-2.5 rounded-[3px] border", cls)} />
          ))}
          <span className="text-[10px] font-bold text-text-secondary">Banyak</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 pl-8">
            {weeks.map((_, index) => {
              const marker = monthMarkers.find((item) => item.index === index);
              return (
                <div key={index} className="w-2.5 text-[9px] font-bold text-text-secondary">
                  {marker ? marker.label : ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1">
            {/* Weekday labels */}
            <div className="flex flex-col gap-1 pr-1">
              {DAY_LABELS.map((label, index) => (
                <div
                  key={index}
                  className="h-2.5 w-6 text-[9px] font-bold leading-2.5 text-text-secondary"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day) => {
                  if (!day.inYear) {
                    return <div key={day.dateKey} className="h-2.5 w-2.5" />;
                  }
                  const entry = minutesByDate.get(day.dateKey);
                  const minutes = entry?.minutes ?? 0;
                  const sessions = entry?.sessions ?? 0;
                  return (
                    <div
                      key={day.dateKey}
                      className={cn(
                        "h-2.5 w-2.5 rounded-[3px] border",
                        LEVEL_CLASS[levelFor(minutes)]
                      )}
                      title={`${formatReadable(day.dateKey)} — ${minutes} menit (${sessions} sesi)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
