import { supabaseClient } from "../../config/database.js";
import { HabitLog, Habit } from "../../types/index.js";
import { IHabitLogRepository } from "../interfaces/habit-log.repository.interface.js";

export class HabitLogSupabaseRepository implements IHabitLogRepository {
  async findByHabitAndDate(habitId: string, completedDate: string): Promise<HabitLog | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("HABIT_LOGS")
      .select("*")
      .eq("habit_id", habitId)
      .eq("completed_date", completedDate)
      .maybeSingle();

    if (error) {
      console.error("Error finding habit log in Supabase:", error.message);
      return null;
    }
    return data as HabitLog | null;
  }

  async create(log: HabitLog): Promise<HabitLog> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("HABIT_LOGS")
      .upsert({
        id: log.id,
        habit_id: log.habit_id,
        user_id: log.user_id,
        completed_date: log.completed_date,
        is_completed: log.is_completed,
        notes: log.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating habit log in Supabase:", error.message);
      throw error;
    }
    return data as HabitLog;
  }

  async delete(habitId: string, completedDate: string): Promise<boolean> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { error } = await supabaseClient
      .from("HABIT_LOGS")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_date", completedDate);

    if (error) {
      console.error("Error deleting habit log in Supabase:", error.message);
      return false;
    }
    return true;
  }

  async findLogsForUser(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("HABIT_LOGS")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_date", startDate)
      .lte("completed_date", endDate)
      .order("completed_date", { ascending: true });

    if (error) {
      console.error("Error finding logs for user in Supabase:", error.message);
      return [];
    }
    return data as HabitLog[];
  }

  async findLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("HABIT_LOGS")
      .select("*")
      .eq("habit_id", habitId)
      .gte("completed_date", startDate)
      .lte("completed_date", endDate)
      .order("completed_date", { ascending: true });

    if (error) {
      console.error("Error finding logs for habit in Supabase:", error.message);
      return [];
    }
    return data as HabitLog[];
  }

  async getCompletionRate(userId: string, startDate: string, endDate: string): Promise<number> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");

    // Get count of completed logs
    const { count: completedCount, error: logError } = await supabaseClient
      .from("HABIT_LOGS")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completed_date", startDate)
      .lte("completed_date", endDate);

    if (logError) {
      console.error("Error getting log count in Supabase:", logError.message);
      return 0;
    }

    // Get all habits that the user tracks (owned + shared)
    const { data: habits, error: habitsError } = await supabaseClient
      .from("HABITS")
      .select("*")
      .or(`user_id.eq.${userId},is_shared.eq.true`)
      .eq("is_active", true);

    if (habitsError) {
      console.error("Error getting habits in Supabase:", habitsError.message);
      return 0;
    }

    if (!habits || habits.length === 0) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let totalExpected = 0;
    for (const habit of habits) {
      if (habit.frequency === "daily") {
        totalExpected += diffDays;
      } else if (habit.frequency === "weekly") {
        totalExpected += Math.max(1, Math.ceil(diffDays / 7));
      } else if (habit.frequency === "monthly") {
        totalExpected += Math.max(1, Math.ceil(diffDays / 30));
      }
    }

    if (totalExpected === 0) return 0;
    return (completedCount || 0) / totalExpected;
  }
}
