import { supabaseClient } from "../../config/database.js";
import { User } from "../../types/index.js";
import { IUserRepository } from "../interfaces/user.repository.interface.js";

export class UserSupabaseRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("USERS")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error finding user by ID in Supabase:", error.message);
      return null;
    }
    return data as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("USERS")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error finding user by username in Supabase:", error.message);
      return null;
    }
    return data as User | null;
  }

  async findByRole(role: "husband" | "wife"): Promise<User | null> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("USERS")
      .select("*")
      .eq("role", role)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error finding user by role in Supabase:", error.message);
      return null;
    }
    return data as User | null;
  }

  async create(user: User): Promise<User> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("USERS")
      .insert({
        id: user.id,
        username: user.username,
        password_hash: user.password_hash,
        name: user.name,
        avatar_emoji: user.avatar_emoji,
        avatar_image: user.avatar_image,
        role: user.role,
        partner_id: user.partner_id,
        theme_preferences: user.theme_preferences,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user in Supabase:", error.message);
      throw error;
    }
    return data as User;
  }

  async update(user: User): Promise<User> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { data, error } = await supabaseClient
      .from("USERS")
      .update({
        name: user.name,
        avatar_emoji: user.avatar_emoji,
        avatar_image: user.avatar_image,
        password_hash: user.password_hash,
        partner_id: user.partner_id,
        theme_preferences: user.theme_preferences,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user in Supabase:", error.message);
      throw error;
    }
    return data as User;
  }

  async count(): Promise<number> {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    const { count, error } = await supabaseClient
      .from("USERS")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Error counting users in Supabase:", error.message);
      return 0;
    }
    return count || 0;
  }
}
