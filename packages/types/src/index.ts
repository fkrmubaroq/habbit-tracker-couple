export interface User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  avatar_emoji: string;
  avatar_image: string | null;
  role: "husband" | "wife";
  partner_id: string | null;
  theme_preferences: {
    theme: string;
    [key: string]: any;
  } | null;
  created_at?: Date | string;
  updated_at?: Date | string;
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
  created_at?: Date | string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
  is_completed: boolean;
  notes: string | null;
  created_at?: Date | string;
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

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: Date | string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_emoji: string;
  role: "husband" | "wife";
  completed_count: number;
  streak_count: number;
}

export interface GroceryItem {
  id: string;
  user_id: string;
  partner_id?: string | null;
  name: string;
  category: string;
  quantity: string;
  unit?: string | null;
  estimated_price?: number | null;
  is_urgent: boolean;
  is_completed: boolean;
  completed_by?: string | null;
  completed_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  creator_name?: string;
  creator_role?: "husband" | "wife";
  completer_name?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthSession {
  user: User;
  token?: string;
}
