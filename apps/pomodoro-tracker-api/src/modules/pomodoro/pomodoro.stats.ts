import type {
  PomodoroDayBucket,
  PomodoroHourBucket,
  PomodoroLabelBucket,
  PomodoroMonthBucket,
  PomodoroStats,
} from "@repo/types";

/** Minimal row shape the aggregation needs — no dependency on the DB layer. */
export interface StatsSourceRow {
  label: string | null;
  actual_minutes: number;
  /** ISO 8601 UTC instant. */
  started_at: string;
}

interface ZonedParts {
  date: string;
  hour: number;
  month: string;
}

/**
 * Converts an instant to calendar parts in `timeZone`.
 *
 * Uses `Intl` instead of a fixed offset so DST-observing zones stay correct,
 * and so no MySQL/Postgres timezone tables are required.
 */
function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = Number(get("hour"));

  return {
    date: `${year}-${month}-${day}`,
    hour: Number.isFinite(hour) ? hour : 0,
    month: `${year}-${month}`,
  };
}

function emptyDay(date: string): PomodoroDayBucket {
  return { date, sessions: 0, minutes: 0 };
}

/**
 * Calendar year of an instant in `timeZone`.
 *
 * The app's day/year boundaries are fixed to `APP_TIMEZONE`, so deriving "this
 * year" from the server's local clock would disagree with the `today` bucket
 * around New Year (e.g. 00:30 WIB on Jan 1 is still Dec 31 in UTC).
 */
export function calendarYearIn(now: Date, timeZone: string): number {
  return Number(zonedParts(now, timeZone).date.slice(0, 4));
}

/** Shifts a `YYYY-MM-DD` string by whole days without timezone math. */
function shiftDay(date: string, deltaDays: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return shifted.toISOString().slice(0, 10);
}

function monthRange(monthsBack: number, today: Date, timeZone: string): string[] {
  const { month } = zonedParts(today, timeZone);
  const [year, monthNumber] = month.split("-").map(Number);
  const months: string[] = [];

  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(year, monthNumber - 1 - offset, 1));
    months.push(cursor.toISOString().slice(0, 7));
  }

  return months;
}

/**
 * Builds the `/stats` payload from raw session rows.
 *
 * Kept pure (no DB, no clock injection beyond `now`) so the aggregation rules —
 * timezone bucketing, week boundaries, streak semantics — can be reasoned about
 * and verified in isolation.
 *
 * `heatmapYear` selects which calendar year the yearly heatmap covers. The
 * caller owns that choice because `/stats?year=` is user-controlled: everything
 * else in the payload (today/week/streak/last7Days/monthly) is relative to
 * "now", but the heatmap must follow the requested year or the year picker in
 * the UI would silently render a different year's data. Defaults to the current
 * year in `timeZone` when omitted.
 */
export function aggregateSessions(
  rows: StatsSourceRow[],
  timeZone: string,
  now: Date = new Date(),
  heatmapYear: number = calendarYearIn(now, timeZone)
): PomodoroStats {
  const dayMap = new Map<string, PomodoroDayBucket>();
  const labelMap = new Map<string, PomodoroLabelBucket>();
  const hourMap = new Map<number, PomodoroHourBucket>();
  const monthMap = new Map<string, PomodoroMonthBucket>();

  const todayParts = zonedParts(now, timeZone);
  const todayDate = todayParts.date;

  for (const row of rows) {
    const instant = new Date(row.started_at);
    if (Number.isNaN(instant.getTime())) continue;

    const { date, hour, month } = zonedParts(instant, timeZone);
    const minutes = Number(row.actual_minutes) || 0;

    const day = dayMap.get(date) ?? emptyDay(date);
    day.sessions += 1;
    day.minutes += minutes;
    dayMap.set(date, day);

    const label = row.label?.trim() || "Tanpa label";
    const labelBucket = labelMap.get(label) ?? { label, sessions: 0, minutes: 0 };
    labelBucket.sessions += 1;
    labelBucket.minutes += minutes;
    labelMap.set(label, labelBucket);

    const hourBucket = hourMap.get(hour) ?? { hour, sessions: 0, minutes: 0 };
    hourBucket.sessions += 1;
    hourBucket.minutes += minutes;
    hourMap.set(hour, hourBucket);

    const monthBucket = monthMap.get(month) ?? { month, sessions: 0, minutes: 0 };
    monthBucket.sessions += 1;
    monthBucket.minutes += minutes;
    monthMap.set(month, monthBucket);
  }

  const today = dayMap.get(todayDate) ?? emptyDay(todayDate);

  // Week = Monday–Sunday containing "today", matching how the app labels it.
  const todayWeekday = new Date(`${todayDate}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const mondayOffset = todayWeekday === 0 ? 6 : todayWeekday - 1;
  let weekSessions = 0;
  let weekMinutes = 0;
  for (let offset = 0; offset <= mondayOffset; offset += 1) {
    const bucket = dayMap.get(shiftDay(todayDate, -offset));
    if (!bucket) continue;
    weekSessions += bucket.sessions;
    weekMinutes += bucket.minutes;
  }

  // Streak: consecutive days with at least one session. If today is still
  // empty, count from yesterday — an unfinished day should not break a streak.
  let streakDays = 0;
  let cursor = dayMap.has(todayDate) ? todayDate : shiftDay(todayDate, -1);
  while (dayMap.has(cursor)) {
    streakDays += 1;
    cursor = shiftDay(cursor, -1);
  }

  const last7Days: PomodoroDayBucket[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = shiftDay(todayDate, -offset);
    last7Days.push(dayMap.get(date) ?? emptyDay(date));
  }

  const heatmapYearKey = String(heatmapYear);
  const heatmap: Array<{ date: string; minutes: number; sessions: number }> = [];
  for (const [date, bucket] of dayMap) {
    if (date.slice(0, 4) !== heatmapYearKey) continue;
    heatmap.push({ date, minutes: bucket.minutes, sessions: bucket.sessions });
  }
  heatmap.sort((a, b) => a.date.localeCompare(b.date));

  const hourOfDay: PomodoroHourBucket[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    hourOfDay.push(hourMap.get(hour) ?? { hour, sessions: 0, minutes: 0 });
  }

  const monthly: PomodoroMonthBucket[] = monthRange(12, now, timeZone).map(
    (month) => monthMap.get(month) ?? { month, sessions: 0, minutes: 0 }
  );

  const labels = [...labelMap.values()].sort(
    (a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label)
  );

  return {
    timezone: timeZone,
    today: { sessions: today.sessions, minutes: today.minutes },
    week: { sessions: weekSessions, minutes: weekMinutes },
    streakDays,
    last7Days,
    labels,
    heatmap,
    hourOfDay,
    monthly,
  };
}
