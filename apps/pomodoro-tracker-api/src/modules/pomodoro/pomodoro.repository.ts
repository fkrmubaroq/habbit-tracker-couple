import type {
  PomodoroCreateSessionInput,
  PomodoroSession,
  PomodoroSettings,
  PomodoroSettingsUpdate,
  PomodoroStats,
} from "@repo/types";
import { executeQuery } from "../../config/database.js";
import { env } from "../../config/env.js";
import { aggregateSessions, calendarYearIn } from "./pomodoro.stats.js";

/**
 * Pomodoro repository.
 *
 * Every single statement below is filtered by `user_id`. Sessions are personal:
 * there is no couple-wide read path, by design (see the PRD's design decision 2).
 */

export const DEFAULT_SETTINGS = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_interval: 4,
  auto_start_break: true,
} as const;

interface DbSessionRow {
  id: string;
  user_id: string;
  label: string | null;
  planned_minutes: number | string;
  actual_minutes: number | string;
  started_at: Date | string;
  ended_at: Date | string;
  created_at?: Date | string;
}

interface DbSettingsRow {
  user_id: string;
  focus_minutes: number | string;
  short_break_minutes: number | string;
  long_break_minutes: number | string;
  long_break_interval: number | string;
  auto_start_break: boolean | number | string;
  updated_at?: Date | string;
}

interface DbStatsRow {
  label: string | null;
  actual_minutes: number | string;
  started_at: Date | string;
}

/** MySQL stores naive UTC DATETIME, Postgres a real timestamptz instant. */
function toDbTimestamp(date: Date): string {
  return env.DB_PROVIDER === "mysql"
    ? date.toISOString().slice(0, 19).replace("T", " ")
    : date.toISOString();
}

/** Normalizes whatever the driver returns into an ISO 8601 UTC string. */
function fromDbTimestamp(value: Date | string | undefined | null): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();

  // mysql2 runs with `dateStrings: true`, so DATETIME arrives as a naive
  // "YYYY-MM-DD HH:MM:SS" string that is already UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(`${value.replace(" ", "T")}Z`).toISOString();
  }

  return new Date(value).toISOString();
}

function mapSession(row: DbSessionRow): PomodoroSession {
  return {
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    planned_minutes: Number(row.planned_minutes),
    actual_minutes: Number(row.actual_minutes),
    started_at: fromDbTimestamp(row.started_at),
    ended_at: fromDbTimestamp(row.ended_at),
    created_at: row.created_at ? fromDbTimestamp(row.created_at) : undefined,
  };
}

function mapSettings(row: DbSettingsRow): PomodoroSettings {
  return {
    user_id: row.user_id,
    focus_minutes: Number(row.focus_minutes),
    short_break_minutes: Number(row.short_break_minutes),
    long_break_minutes: Number(row.long_break_minutes),
    long_break_interval: Number(row.long_break_interval),
    auto_start_break:
      typeof row.auto_start_break === "string"
        ? row.auto_start_break === "true" || row.auto_start_break === "1"
        : Boolean(row.auto_start_break),
    updated_at: row.updated_at ? fromDbTimestamp(row.updated_at) : undefined,
  };
}

const SETTINGS_COLUMNS = `user_id, focus_minutes, short_break_minutes, long_break_minutes, long_break_interval, auto_start_break, updated_at`;

/**
 * Materializes the default settings row for a user.
 *
 * Called from a read path (`GET /settings`), so it must tolerate concurrent
 * first visits: two tabs — or the timer page and the settings page — can both
 * see no row and both try to insert. `ON DUPLICATE KEY UPDATE` / `ON CONFLICT
 * DO NOTHING` makes the loser a no-op instead of a duplicate-key 500.
 */
async function ensureSettingsRow(userId: string): Promise<void> {
  const values = [
    userId,
    DEFAULT_SETTINGS.focus_minutes,
    DEFAULT_SETTINGS.short_break_minutes,
    DEFAULT_SETTINGS.long_break_minutes,
    DEFAULT_SETTINGS.long_break_interval,
    DEFAULT_SETTINGS.auto_start_break,
    toDbTimestamp(new Date()),
  ];

  const sql =
    env.DB_PROVIDER === "mysql"
      ? `INSERT INTO pomodoro_settings
           (user_id, focus_minutes, short_break_minutes, long_break_minutes, long_break_interval, auto_start_break, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = user_id`
      : `INSERT INTO pomodoro_settings
           (user_id, focus_minutes, short_break_minutes, long_break_minutes, long_break_interval, auto_start_break, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO NOTHING`;

  await executeQuery(sql, values);
}

async function selectSettings(userId: string): Promise<PomodoroSettings | null> {
  const rows = await executeQuery<DbSettingsRow>(
    `SELECT ${SETTINGS_COLUMNS} FROM pomodoro_settings WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  return rows.length > 0 ? mapSettings(rows[0]) : null;
}

async function getSettings(userId: string): Promise<PomodoroSettings> {
  const existing = await selectSettings(userId);
  if (existing) return existing;

  // First visit: materialize the defaults so the client always reads a row.
  await ensureSettingsRow(userId);

  // Re-read rather than returning the in-memory defaults: if a concurrent
  // request won the insert, this returns the row that actually exists.
  const created = await selectSettings(userId);
  return created ?? { user_id: userId, ...DEFAULT_SETTINGS };
}

async function updateSettings(
  userId: string,
  patch: PomodoroSettingsUpdate
): Promise<PomodoroSettings> {
  // Ensures the row exists before updating, and keeps the SQL identical for
  // both providers (no ON DUPLICATE KEY / ON CONFLICT branching).
  const current = await getSettings(userId);

  const next = {
    focus_minutes: patch.focus_minutes ?? current.focus_minutes,
    short_break_minutes: patch.short_break_minutes ?? current.short_break_minutes,
    long_break_minutes: patch.long_break_minutes ?? current.long_break_minutes,
    long_break_interval: patch.long_break_interval ?? current.long_break_interval,
    auto_start_break: patch.auto_start_break ?? current.auto_start_break,
  };

  await executeQuery(
    `UPDATE pomodoro_settings
        SET focus_minutes = ?, short_break_minutes = ?, long_break_minutes = ?,
            long_break_interval = ?, auto_start_break = ?, updated_at = ?
      WHERE user_id = ?`,
    [
      next.focus_minutes,
      next.short_break_minutes,
      next.long_break_minutes,
      next.long_break_interval,
      next.auto_start_break,
      toDbTimestamp(new Date()),
      userId,
    ]
  );

  return { user_id: userId, ...next };
}

/** True for the driver's "that unique key already exists" error. */
function isDuplicateKeyError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  // mysql2: ER_DUP_ENTRY · pg: 23505 unique_violation
  return code === "ER_DUP_ENTRY" || code === "23505";
}

async function findSession(userId: string, id: string): Promise<PomodoroSession | null> {
  const rows = await executeQuery<DbSessionRow>(
    `SELECT id, user_id, label, planned_minutes, actual_minutes, started_at, ended_at, created_at
       FROM pomodoro_sessions
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [id, userId]
  );

  return rows.length > 0 ? mapSession(rows[0]) : null;
}

/**
 * Idempotent insert. The client generates the UUID, so an offline queue that
 * retries the same payload must not create a duplicate session.
 *
 * Uniqueness is scoped per user (`PRIMARY KEY (user_id, id)`), so another
 * person owning the same UUID is not a conflict. The `SELECT` below is the fast
 * path; the insert is still wrapped because two concurrent requests for the
 * *same* user can both miss it — in that case the loser reads back the winner's
 * row and reports `created: false` instead of surfacing a 500.
 */
async function insertSession(
  userId: string,
  input: PomodoroCreateSessionInput
): Promise<{ session: PomodoroSession; created: boolean }> {
  const existing = await findSession(userId, input.id);
  if (existing) return { session: existing, created: false };

  const label = input.label?.trim() ? input.label.trim() : null;
  const createdAt = toDbTimestamp(new Date());

  try {
    await executeQuery(
      `INSERT INTO pomodoro_sessions
         (id, user_id, label, planned_minutes, actual_minutes, started_at, ended_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        userId,
        label,
        input.planned_minutes,
        input.actual_minutes,
        toDbTimestamp(new Date(input.started_at)),
        toDbTimestamp(new Date(input.ended_at)),
        createdAt,
      ]
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const raced = await findSession(userId, input.id);
    if (raced) return { session: raced, created: false };
    throw error;
  }

  return {
    session: {
      id: input.id,
      user_id: userId,
      label,
      planned_minutes: input.planned_minutes,
      actual_minutes: input.actual_minutes,
      started_at: new Date(input.started_at).toISOString(),
      ended_at: new Date(input.ended_at).toISOString(),
    },
    created: true,
  };
}

async function listSessions(
  userId: string,
  options: { from?: string; to?: string; limit?: number } = {}
): Promise<PomodoroSession[]> {
  const where: string[] = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options.from) {
    where.push("started_at >= ?");
    params.push(toDbTimestamp(new Date(options.from)));
  }
  if (options.to) {
    where.push("started_at <= ?");
    params.push(toDbTimestamp(new Date(options.to)));
  }

  params.push(options.limit ?? 50);

  const rows = await executeQuery<DbSessionRow>(
    `SELECT id, user_id, label, planned_minutes, actual_minutes, started_at, ended_at, created_at
       FROM pomodoro_sessions
      WHERE ${where.join(" AND ")}
      ORDER BY started_at DESC
      LIMIT ?`,
    params
  );

  return rows.map(mapSession);
}

async function aggregateStats(userId: string, requestedYear?: number): Promise<PomodoroStats> {
  const now = new Date();
  const year = requestedYear ?? calendarYearIn(now, env.APP_TIMEZONE);

  // The yearly heatmap needs Jan 1 of `year`; the 12-month trend may reach
  // further back than that. Two extra days absorb any UTC offset.
  const yearStart = Date.UTC(year, 0, 1);
  const monthlyStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1);
  const from = new Date(Math.min(yearStart, monthlyStart) - 2 * 24 * 60 * 60 * 1000);

  const rows = await executeQuery<DbStatsRow>(
    `SELECT label, actual_minutes, started_at
       FROM pomodoro_sessions
      WHERE user_id = ? AND started_at >= ?`,
    [userId, toDbTimestamp(from)]
  );

  return aggregateSessions(
    rows.map((row) => ({
      label: row.label,
      actual_minutes: Number(row.actual_minutes),
      started_at: fromDbTimestamp(row.started_at),
    })),
    env.APP_TIMEZONE,
    now,
    year
  );
}

export const pomodoroRepository = {
  getSettings,
  updateSettings,
  insertSession,
  listSessions,
  aggregateStats,
};
