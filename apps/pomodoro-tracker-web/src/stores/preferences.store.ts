import { create } from "zustand";
import type { PomodoroLocalPreferences } from "@repo/types";

/**
 * Device-local preferences.
 *
 * Deliberately NOT synced to the server: whether *this* device plays a sound or
 * shows OS notifications is a property of the device, not of the account. The
 * synced durations live in `pomodoro_settings` (see `pomodoro.service.ts`).
 */
const STORAGE_KEY = "pomodoro-preferences";

const DEFAULTS: PomodoroLocalPreferences = {
  soundMuted: false,
  notificationsEnabled: false,
  lastPresetId: "classic",
};

function readStored(): PomodoroLocalPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PomodoroLocalPreferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface PreferencesState extends PomodoroLocalPreferences {
  setSoundMuted: (muted: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLastPresetId: (presetId: string) => void;
}

function persist(state: PomodoroLocalPreferences) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        soundMuted: state.soundMuted,
        notificationsEnabled: state.notificationsEnabled,
        lastPresetId: state.lastPresetId,
      })
    );
  } catch {
    // Private mode / quota — preferences simply stay in memory.
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...readStored(),
  setSoundMuted: (soundMuted) => {
    set({ soundMuted });
    persist(get());
  },
  setNotificationsEnabled: (notificationsEnabled) => {
    set({ notificationsEnabled });
    persist(get());
  },
  setLastPresetId: (lastPresetId) => {
    set({ lastPresetId });
    persist(get());
  },
}));
