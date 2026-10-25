/**
 * Pomodoro domain types.
 *
 * Sessions are strictly personal: every field here is scoped to one `user_id`.
 * There is intentionally no "partner" shape — the app never reads another
 * user's sessions (see docs/prd/todo/pomodoro-app/PRD.md).
 */

export interface PomodoroSession {
  id: string;
  user_id: string;
  label: string | null;
  planned_minutes: number;
  actual_minutes: number;
  /** ISO 8601 UTC instant. */
  started_at: string;
  /** ISO 8601 UTC instant. */
  ended_at: string;
  created_at?: string;
}

export interface PomodoroSettings {
  user_id: string;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  long_break_interval: number;
  auto_start_break: boolean;
  updated_at?: string;
}

export type PomodoroSettingsUpdate = Partial<
  Omit<PomodoroSettings, "user_id" | "updated_at">
>;

export interface PomodoroCreateSessionInput {
  /** Client-generated UUID — the basis of retry idempotency. */
  id: string;
  label?: string | null;
  planned_minutes: number;
  actual_minutes: number;
  started_at: string;
  ended_at: string;
}

export interface PomodoroDayBucket {
  /** `YYYY-MM-DD` in the configured APP_TIMEZONE. */
  date: string;
  sessions: number;
  minutes: number;
}

export interface PomodoroLabelBucket {
  label: string;
  sessions: number;
  minutes: number;
}

export interface PomodoroHourBucket {
  hour: number;
  sessions: number;
  minutes: number;
}

export interface PomodoroMonthBucket {
  /** `YYYY-MM`. */
  month: string;
  sessions: number;
  minutes: number;
}

export interface PomodoroStats {
  timezone: string;
  today: { sessions: number; minutes: number };
  week: { sessions: number; minutes: number };
  streakDays: number;
  last7Days: PomodoroDayBucket[];
  labels: PomodoroLabelBucket[];
  heatmap: Array<{ date: string; minutes: number; sessions: number }>;
  hourOfDay: PomodoroHourBucket[];
  monthly: PomodoroMonthBucket[];
}

/** Local-only preferences — device properties, never synced to the server. */
export interface PomodoroLocalPreferences {
  soundMuted: boolean;
  notificationsEnabled: boolean;
  lastPresetId: string;
}
