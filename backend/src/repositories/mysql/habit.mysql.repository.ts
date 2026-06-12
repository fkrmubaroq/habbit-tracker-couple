import { RowDataPacket, ResultSetHeader } from "mysql2";
import { mysqlPool } from "../../config/database.js";
import { Habit } from "../../types/index.js";
import { IHabitRepository } from "../interfaces/habit.repository.interface.js";

export class HabitMySQLRepository implements IHabitRepository {
  async findById(id: string): Promise<Habit | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM habits WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const habit = rows[0] as Habit;
    // Map boolean from number
    habit.is_shared = Boolean(habit.is_shared);
    habit.is_active = Boolean(habit.is_active);
    return habit;
  }

  async create(habit: Habit): Promise<Habit> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      "INSERT INTO habits (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
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
    return habit;
  }

  async update(habit: Habit): Promise<Habit> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      "UPDATE habits SET title = ?, description = ?, icon_emoji = ?, frequency = ?, is_shared = ?, is_active = ? WHERE id = ?",
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
    return habit;
  }

  async delete(id: string): Promise<boolean> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [result] = await mysqlPool.execute<ResultSetHeader>(
      "DELETE FROM habits WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  async findByUserId(userId: string): Promise<Habit[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows.map((row) => {
      const habit = row as Habit;
      habit.is_shared = Boolean(habit.is_shared);
      habit.is_active = Boolean(habit.is_active);
      return habit;
    });
  }

  async findShared(userId: string, partnerId: string | null): Promise<Habit[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    // Shared habits can be owned by user OR owned by partner with is_shared = true
    const ids = partnerId ? [userId, partnerId] : [userId];
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT * FROM habits WHERE is_shared = 1 AND user_id IN (${placeholders}) ORDER BY created_at DESC`,
      ids
    );
    return rows.map((row) => {
      const habit = row as Habit;
      habit.is_shared = Boolean(habit.is_shared);
      habit.is_active = Boolean(habit.is_active);
      return habit;
    });
  }
}
