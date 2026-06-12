import { supabaseClient } from "../../config/database.js";
import { Streak, Badge, LeaderboardEntry } from "../../types/index.js";
import { IGamificationRepository } from "../interfaces/gamification.repository.interface.js";
import { v4 as uuidv4 } from "uuid";

export class GamificationSupabaseRepository implements IGamificationRepository {
  async findStreak(userId: string, habitId: string): Promise<Streak | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("habit_id", habitId)
      .maybeSingle();

    if (error) {
      console.error("Error finding streak in Supabase:", error.message);
      return null;
    }
    return data as Streak | null;
  }

  async upsertStreak(streak: Streak): Promise<Streak> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const id = streak.id || uuidv4();
    const { data, error } = await supabaseClient
      .from("streaks")
      .upsert({
        id,
        user_id: streak.user_id,
        habit_id: streak.habit_id,
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        last_completed_date: streak.last_completed_date,
      }, { onConflict: "user_id,habit_id" })
      .select()
      .single();

    if (error) {
      console.error("Error upserting streak in Supabase:", error.message);
      throw error;
    }
    return data as Streak;
  }

  async findUserStreaks(userId: string): Promise<Streak[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("streaks")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error finding user streaks in Supabase:", error.message);
      return [];
    }
    return data as Streak[];
  }

  async findAllBadges(): Promise<Badge[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("badges")
      .select("*");

    if (error) {
      console.error("Error finding badges in Supabase:", error.message);
      return [];
    }
    return data as Badge[];
  }

  async findBadgeById(badgeId: string): Promise<Badge | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("badges")
      .select("*")
      .eq("id", badgeId)
      .maybeSingle();

    if (error) {
      console.error("Error finding badge by ID in Supabase:", error.message);
      return null;
    }
    return data as Badge | null;
  }

  async findEarnedBadges(userId: string): Promise<Badge[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    
    // Perform inner join-like logic or fetch relation
    const { data, error } = await supabaseClient
      .from("user_badges")
      .select("earned_at, badges (*)")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error finding earned badges in Supabase:", error.message);
      return [];
    }

    return (data || [])
      .map((item: any) => item.badges)
      .filter((b): b is Badge => b !== null);
  }

  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const id = uuidv4();
    const { error } = await supabaseClient
      .from("user_badges")
      .upsert({
        id,
        user_id: userId,
        badge_id: badgeId,
      }, { onConflict: "user_id,badge_id" });

    if (error) {
      console.error("Error awarding badge in Supabase:", error.message);
      return false;
    }
    return true;
  }

  async getLeaderboard(
    userId: string,
    partnerId: string | null,
    startDate: string,
    endDate: string
  ): Promise<LeaderboardEntry[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");

    const ids = partnerId ? [userId, partnerId] : [userId];

    // Fetch user details
    const { data: users, error: userError } = await supabaseClient
      .from("users")
      .select("id, name, avatar_emoji, role")
      .in("id", ids);

    if (userError || !users) {
      console.error("Error getting users for leaderboard:", userError?.message);
      return [];
    }

    const entries: LeaderboardEntry[] = [];

    for (const user of users) {
      // Get completion count
      const { count: completedCount, error: logError } = await supabaseClient
        .from("habit_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_date", startDate)
        .lte("completed_date", endDate);

      // Get streaks count
      const { data: streaks, error: streakError } = await supabaseClient
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id);

      const completed = logError ? 0 : (completedCount || 0);
      const streakSum = streakError || !streaks 
        ? 0 
        : streaks.reduce((sum, item) => sum + (item.current_streak || 0), 0);

      entries.push({
        user_id: user.id,
        name: user.name,
        avatar_emoji: user.avatar_emoji,
        role: user.role,
        completed_count: completed,
        streak_count: streakSum,
      });
    }

    // Sort entries: completed_count DESC, streak_count DESC
    return entries.sort((a, b) => {
      if (b.completed_count !== a.completed_count) {
        return b.completed_count - a.completed_count;
      }
      return b.streak_count - a.streak_count;
    });
  }
}
