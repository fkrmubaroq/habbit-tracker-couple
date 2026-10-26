import type {
  PomodoroCreateSessionInput,
  PomodoroSession,
  PomodoroSettings,
  PomodoroSettingsUpdate,
  PomodoroStats,
} from "@repo/types";
import { api } from "./api";
import { isTransientError } from "./api-errors";
import { DEVICE_STATE_KEYS, readOwned, writeOwned } from "./device-state";

/**
 * Cached copy of the server settings.
 *
 * The timer must keep the user's real durations while offline — falling back to
 * 25/5/15 would record a session with the wrong `planned_minutes`. Only used
 * when the request fails without a response (i.e. the network is down).
 *
 * The cache is stamped with its owner: on a shared device the previous account's
 * durations must not become this account's `planned_minutes`.
 */
const SETTINGS_CACHE_KEY = DEVICE_STATE_KEYS.settingsCache;

function readCachedSettings(userId: string | null | undefined): PomodoroSettings | null {
  return readOwned(SETTINGS_CACHE_KEY, userId, (parsed) =>
    typeof parsed.focus_minutes === "number" ? (parsed as unknown as PomodoroSettings) : null
  );
}

function writeCachedSettings(settings: PomodoroSettings): void {
  writeOwned(SETTINGS_CACHE_KEY, settings.user_id, settings as unknown as Record<string, unknown>);
}


/**
 * Server-backed pomodoro data.
 *
 * Everything here is scoped to the logged-in user by the API — there is no
 * partner/global read path to opt into.
 */
export const pomodoroService = {
  async getSettings(userId: string | null | undefined): Promise<PomodoroSettings> {
    try {
      const response = await api.get<{ settings: PomodoroSettings }>("/pomodoro/settings");
      writeCachedSettings(response.data.settings);
      return response.data.settings;
    } catch (error) {
      if (isTransientError(error)) {
        const cached = readCachedSettings(userId);
        if (cached) return cached;
      }
      throw error;
    }
  },

  async updateSettings(patch: PomodoroSettingsUpdate): Promise<PomodoroSettings> {
    const response = await api.put<{ settings: PomodoroSettings }>("/pomodoro/settings", patch);
    writeCachedSettings(response.data.settings);
    return response.data.settings;
  },

  async createSession(input: PomodoroCreateSessionInput): Promise<PomodoroSession> {
    const response = await api.post<{ session: PomodoroSession }>("/pomodoro/sessions", input);
    return response.data.session;
  },

  async listSessions(options: { limit?: number; from?: string; to?: string } = {}): Promise<
    PomodoroSession[]
  > {
    const response = await api.get<{ sessions: PomodoroSession[] }>("/pomodoro/sessions", {
      params: options,
    });
    return response.data.sessions ?? [];
  },

  async getStats(year?: number): Promise<PomodoroStats> {
    const response = await api.get<PomodoroStats>("/pomodoro/stats", {
      params: year ? { year } : undefined,
    });
    return response.data;
  },
};
