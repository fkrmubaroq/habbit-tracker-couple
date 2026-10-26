import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock, Flame, Loader2, Timer } from "lucide-react";
import type { PomodoroSession } from "@repo/types";
import { YearHeatmap } from "../components/stats/year-heatmap";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { pomodoroService } from "../services/pomodoro.service";

export const Route = createFileRoute("/stats")({
  component: PomodoroStatsPage,
});

const LABEL_COLORS = ["#F43F5E", "#FB7185", "#FDA4AF", "#FECDD3", "#FBCFE8", "#CBD5E1"];
const HISTORY_PAGE_SIZE = 20;

function shortDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" }).format(date);
}

function shortMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(date);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] font-semibold text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-color text-center">
      <span className="text-2xl">🌱</span>
      <p className="mt-1 max-w-xs text-[11px] font-bold text-text-secondary">{message}</p>
    </div>
  );
}

function PomodoroStatsPage() {
  const [year, setYear] = React.useState(() => new Date().getFullYear());
  const [historyLimit, setHistoryLimit] = React.useState(HISTORY_PAGE_SIZE);

  const statsQuery = useQuery({
    queryKey: ["pomodoro-stats", year],
    queryFn: () => pomodoroService.getStats(year),
    staleTime: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: ["pomodoro-sessions", historyLimit],
    queryFn: () => pomodoroService.listSessions({ limit: historyLimit }),
  });

  const stats = statsQuery.data;
  const sessions: PomodoroSession[] = historyQuery.data ?? [];

  const summaryCards = [
    {
      label: "Hari ini",
      value: stats ? `${stats.today.sessions} sesi` : "…",
      sub: stats ? `${stats.today.minutes} menit` : "",
      icon: Timer,
      tone: "text-rose-600",
    },
    {
      label: "Minggu ini",
      value: stats ? `${stats.week.sessions} sesi` : "…",
      sub: stats ? `${stats.week.minutes} menit` : "",
      icon: Clock,
      tone: "text-amber-600",
    },
    {
      label: "Streak",
      value: stats ? `${stats.streakDays} hari` : "…",
      sub: "hari beruntun",
      icon: Flame,
      tone: "text-orange-600",
    },
  ];

  const last7 = (stats?.last7Days ?? []).map((day) => ({
    ...day,
    label: shortDay(day.date),
  }));

  const labels = stats?.labels ?? [];
  const topLabels = labels.slice(0, 5);
  const restLabels = labels.slice(5);
  const donutData = [
    ...topLabels.map((entry) => ({ name: entry.label, value: entry.minutes })),
    ...(restLabels.length > 0
      ? [
          {
            name: "Lainnya",
            value: restLabels.reduce((sum, entry) => sum + entry.minutes, 0),
          },
        ]
      : []),
  ].filter((entry) => entry.value > 0);

  const hourly = stats?.hourOfDay ?? [];
  const topHours = new Set(
    [...hourly]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3)
      .filter((bucket) => bucket.minutes > 0)
      .map((bucket) => bucket.hour)
  );

  const monthly = (stats?.monthly ?? []).map((bucket) => ({
    ...bucket,
    label: shortMonth(bucket.month),
  }));

  const availableYears = React.useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const isLoading = statsQuery.isLoading;

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="relative overflow-hidden bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="h-13 w-13 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Statistik Fokus
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                Pribadi
              </span>
            </div>
            <p className="text-xs font-bold text-text-secondary mt-0.5">
              Semua angka di halaman ini hanya milik akunmu (zona waktu WIB).
            </p>
          </div>
        </div>
      </div>

      {statsQuery.isError ? (
        <div className="rounded-3xl border-3 border-dashed border-rose-300 bg-card-surface p-8 text-center">
          <span className="text-3xl">⚠️</span>
          <h2 className="mt-2 text-base font-black text-text-primary">Gagal memuat statistik</h2>
          <p className="mt-1 text-xs font-bold text-text-secondary">
            {(statsQuery.error as Error)?.message || "Periksa koneksi lalu coba lagi."}
          </p>
          <Button
            variant="3d"
            size="sm"
            className="mt-4 font-black"
            onClick={() => statsQuery.refetch()}
          >
            Coba Lagi
          </Button>
        </div>
      ) : null}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-2xl border-2 border-border-color bg-card-surface p-3.5 shadow-[0_2px_0_0_var(--border-color)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight border border-border-color">
                <Icon className={cn("h-5 w-5", card.tone)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  {card.label}
                </span>
                <span className="text-lg font-black tabular-nums text-text-primary">
                  {card.value}
                </span>
                <span className="text-[10px] font-bold text-text-secondary">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-day bars */}
      <SectionCard title="7 hari terakhir" description="Menit fokus per hari.">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : last7.every((day) => day.minutes === 0) ? (
          <ChartEmpty message="Belum ada sesi fokus dalam 7 hari terakhir." />
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} stroke="var(--text-secondary)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value} menit`, "Fokus"]}
                  contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                />
                <Bar dataKey="minutes" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      {/* Labels donut */}
      <SectionCard title="Distribusi label" description="5 label teratas berdasarkan menit fokus.">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : donutData.length === 0 ? (
          <ChartEmpty message="Belum ada label tercatat. Beri label saat memulai sesi fokus." />
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.name} fill={LABEL_COLORS[index % LABEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} menit`, name]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex w-full flex-col gap-1.5">
              {donutData.map((entry, index) => (
                <li key={entry.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: LABEL_COLORS[index % LABEL_COLORS.length] }}
                    />
                    <span className="truncate text-xs font-bold text-text-primary">
                      {entry.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-black tabular-nums text-text-secondary">
                    {entry.value} mnt
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* Year heatmap */}
      <SectionCard
        title="Heatmap tahunan"
        description="Satu kotak = satu hari. Makin pekat, makin banyak menit fokus."
        action={
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-8 rounded-xl border-2 border-border-color bg-card-surface px-2 text-xs font-black text-text-primary focus:border-primary focus:outline-none"
            aria-label="Pilih tahun heatmap"
          >
            {availableYears.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <YearHeatmap year={year} days={stats?.heatmap ?? []} />
        )}
      </SectionCard>

      {/* Hour of day */}
      <SectionCard
        title="Jam paling produktif"
        description="Total menit fokus per jam. Tiga jam teratas disorot."
      >
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : hourly.every((bucket) => bucket.minutes === 0) ? (
          <ChartEmpty message="Belum ada data jam. Selesaikan sesi fokus untuk mengisinya." />
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9 }}
                  interval={2}
                  stroke="var(--text-secondary)"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, _name, payload) => [
                    `${value} menit`,
                    `Jam ${String((payload as { payload?: { hour: number } })?.payload?.hour ?? "")}`,
                  ]}
                  contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {hourly.map((bucket) => (
                    <Cell
                      key={bucket.hour}
                      fill={topHours.has(bucket.hour) ? "#F43F5E" : "#FECDD3"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {!isLoading && hourly.some((bucket) => bucket.minutes > 0) ? (
          <p className="mt-2 text-[11px] font-bold text-text-secondary">
            Puncak: {[...topHours].sort((a, b) => a - b).map((hour) => `${String(hour).padStart(2, "0")}:00`).join(" · ")}
          </p>
        ) : null}
      </SectionCard>

      {/* Monthly trend */}
      <SectionCard title="Tren 12 bulan" description="Menit fokus per bulan.">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : monthly.every((bucket) => bucket.minutes === 0) ? (
          <ChartEmpty message="Belum ada data bulanan." />
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} stroke="var(--text-secondary)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value} menit`, "Fokus"]}
                  contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fill="url(#monthlyFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      {/* History */}
      <SectionCard
        title="Riwayat sesi"
        description="Hanya sesi fokus yang selesai. Reset & lewati tidak dicatat."
      >
        {historyQuery.isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : historyQuery.isError ? (
          <p className="text-xs font-bold text-text-secondary">
            Riwayat gagal dimuat. {(historyQuery.error as Error)?.message}
          </p>
        ) : sessions.length === 0 ? (
          <ChartEmpty message="Belum ada sesi tercatat. Mulai sesi fokus pertamamu di halaman Timer." />
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-color bg-highlight/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-black text-text-primary">
                    {session.label || "Tanpa label"}
                  </span>
                  <span className="text-[10px] font-bold text-text-secondary">
                    {formatDateTime(session.started_at)}
                  </span>
                </div>
                <span className="shrink-0 rounded-lg border border-border-color bg-card-surface px-2 py-0.5 text-[11px] font-black text-text-primary">
                  {session.actual_minutes} mnt
                </span>
              </div>
            ))}

            {sessions.length >= historyLimit ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 font-black"
                disabled={historyQuery.isFetching}
                onClick={() => setHistoryLimit((limit) => limit + HISTORY_PAGE_SIZE)}
              >
                {historyQuery.isFetching ? "Memuat…" : "Muat lebih banyak"}
              </Button>
            ) : (
              <p className="mt-1 text-center text-[10px] font-bold text-text-secondary">
                Semua riwayat sudah ditampilkan.
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-text-secondary">
        <BarChart3 className="h-3 w-3" />
        Data dihitung di server dengan zona waktu tetap (Asia/Jakarta).
      </div>
    </div>
  );
}
