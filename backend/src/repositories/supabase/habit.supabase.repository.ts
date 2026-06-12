import { supabaseClient } from "../../config/database.js";
import { Habit } from "../../types/index.js";
import { IHabitRepository } from "../interfaces/habit.repository.interface.js";

export class HabitSupabaseRepository implements IHabitRepository {
  async findById(id: string): Promise<Habit | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("habits")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error finding habit by ID in Supabase:", error.message);
      return null;
    }
    return data as Habit | null;
  }

  async create(habit: Habit): Promise<Habit> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("habits")
      .insert({
        id: habit.id,
        user_id: habit.user_id,
        title: habit.title,
        description: habit.description,
        icon_emoji: habit.icon_emoji,
        frequency: habit.frequency,
        is_shared: habit.is_shared,
        is_active: habit.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating habit in Supabase:", error.message);
      throw error;
    }
    return data as Habit;
  }

  async update(habit: Habit): Promise<Habit> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("habits")
      .update({
        title: habit.title,
        description: habit.description,
        icon_emoji: habit.icon_emoji,
        frequency: habit.frequency,
        is_shared: habit.is_shared,
        is_active: habit.is_active,
      })
      .eq("id", habit.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating habit in Supabase:", error.message);
      throw error;
    }
    return data as Habit;
  }

  async delete(id: string): Promise<boolean> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { error } = await supabaseClient
      .from("habits")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting habit in Supabase:", error.message);
      return false;
    }
    return true;
  }

  async findByUserId(userId: string): Promise<Habit[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error finding habits by user ID in Supabase:", error.message);
      return [];
    }
    return data as Habit[];
  }

  async findShared(userId: string, partnerId: string | null): Promise<Habit[]> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const ids = partnerId ? [userId, partnerId] : [userId];
    const { data, error } = await supabaseClient
      .from("habits")
      .select("*")
      .eq("is_shared", true)
      .in("user_id", ids)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error finding shared habits in Supabase:", error.message);
      return [];
    }
    return data as Habit[];
  }
}
