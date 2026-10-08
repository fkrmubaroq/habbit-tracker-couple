import { pgPool } from "../../config/database.js";
import { Habit } from "../../types/index.js";
import { IHabitRepository } from "../interfaces/habit.repository.interface.js";

export class HabitSupabaseRepository implements IHabitRepository {
  async findById(id: string): Promise<Habit | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM habits WHERE id = $1", [id]);
    return (rows[0] as Habit) || null;
  }

  async create(habit: Habit): Promise<Habit> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `INSERT INTO habits (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        habit.id,
        habit.user_id,
        habit.title,
        habit.description,
        habit.icon_emoji,
        habit.frequency,
        habit.is_shared,
        habit.is_active,
      ]
    );
    return rows[0] as Habit;
  }

  async update(habit: Habit): Promise<Habit> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `UPDATE habits 
       SET title = $1, description = $2, icon_emoji = $3, frequency = $4, is_shared = $5, is_active = $6 
       WHERE id = $7 RETURNING *`,
      [
        habit.title,
        habit.description,
        habit.icon_emoji,
        habit.frequency,
        habit.is_shared,
        habit.is_active,
        habit.id,
      ]
    );
    return rows[0] as Habit;
  }

  async delete(id: string): Promise<boolean> {
    if (!pgPool) throw new Error("pgPool not initialized");
    await pgPool.query("DELETE FROM habits WHERE id = $1", [id]);
    return true;
  }

  async findByUserId(userId: string): Promise<Habit[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows as Habit[];
  }

  async findShared(userId: string, partnerId: string | null): Promise<Habit[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    let rows: any[];
    if (partnerId) {
      const result = await pgPool.query(
        "SELECT * FROM habits WHERE is_shared = true AND user_id IN ($1, $2) ORDER BY created_at DESC",
        [userId, partnerId]
      );
      rows = result.rows;
    } else {
      const result = await pgPool.query(
        "SELECT * FROM habits WHERE is_shared = true AND user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      rows = result.rows;
    }
    return rows as Habit[];
  }
}
