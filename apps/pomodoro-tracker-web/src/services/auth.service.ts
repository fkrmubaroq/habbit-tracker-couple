import { api } from "./api";
import { clearDeviceState } from "./device-state";
import { getLoginUrl, HABIT_APP_URL } from "./session-url";

export { getLoginUrl };

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  avatar_emoji: string | null;
  avatar_image: string | null;
  role: "husband" | "wife";
  partner_id: string | null;
  theme_preferences: { theme?: string } | null;
}

export async function getMe(): Promise<SessionUser> {
  const response = await api.get<{ user: SessionUser }>("/auth/me");
  return response.data.user;
}

export async function logout(userId?: string | null): Promise<void> {
  await api.post("/auth/logout");
  // Drop everything the next person on this device would otherwise inherit:
  // the cached identity, the cached durations, and this account's timer slot
  // (with its free-text label). A partner's run keeps its own slot. Queued
  // sessions are owner-stamped and stay put — see `clearDeviceState`.
  clearDeviceState(userId);
}

/** Full-page hand-off: the session lives in the habit app, so land on its login screen. */
export function redirectAfterLogout(): void {
  window.location.href = `${HABIT_APP_URL}/login`;
}
