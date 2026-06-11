export interface User {
  id: string;
  username: string;
  name: string;
  avatar_emoji: string;
  avatar_image: string | null;
  role: "husband" | "wife";
  partner_id: string | null;
  theme_preferences: {
    theme: string;
    [key: string]: any;
  } | null;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon_emoji: string;
  frequency: "daily" | "weekly" | "monthly";
  is_shared: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
  is_completed: boolean;
  notes: string | null;
  created_at?: string;
}

export interface Streak {
  id: string;
  user_id: string;
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "personal" | "couple";
  requirement_value: number;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_emoji: string;
  role: "husband" | "wife";
  completed_count: number;
  streak_count: number;
}
