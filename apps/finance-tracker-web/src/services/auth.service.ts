import { api } from "./api";
import { getLoginUrl } from "./session-url";

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
