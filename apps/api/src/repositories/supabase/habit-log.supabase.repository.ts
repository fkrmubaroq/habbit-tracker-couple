import { pgPool } from "../../config/database.js";
import { HabitLog, Habit } from "../../types/index.js";
import { IHabitLogRepository } from "../interfaces/habit-log.repository.interface.js";

export class HabitLogSupabaseRepository implements IHabitLogRepository {
  async findByHabitAndDate(habitId: string, completedDate: string): Promise<HabitLog | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM habit_logs WHERE habit_id = $1 AND completed_date = $2",
      [habitId, completedDate]
    );
    return (rows[0] as HabitLog) || null;
  }

  async create(log: HabitLog): Promise<HabitLog> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `INSERT INTO habit_logs (id, habit_id, user_id, completed_date, is_completed, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (habit_id, user_id, completed_date) 
       DO UPDATE SET is_completed = EXCLUDED.is_completed, notes = EXCLUDED.notes 
       RETURNING *`,
      [
        log.id,
        log.habit_id,
        log.user_id,
        log.completed_date,
        log.is_completed,
        log.notes,
      ]
    );
    return rows[0] as HabitLog;
  }

  async delete(habitId: string, completedDate: string): Promise<boolean> {
    if (!pgPool) throw new Error("pgPool not initialized");
    await pgPool.query(
      "DELETE FROM habit_logs WHERE habit_id = $1 AND completed_date = $2",
      [habitId, completedDate]
    );
    return true;
  }

  async findLogsForUser(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM habit_logs WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3 ORDER BY completed_date ASC",
      [userId, startDate, endDate]
    );
    return rows as HabitLog[];
  }

  async findLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM habit_logs WHERE habit_id = $1 AND completed_date >= $2 AND completed_date <= $3 ORDER BY completed_date ASC",
      [habitId, startDate, endDate]
    );
    return rows as HabitLog[];
  }

  async getCompletionRate(userId: string, startDate: string, endDate: string): Promise<number> {
    if (!pgPool) throw new Error("pgPool not initialized");

    // Get count of completed logs
    const logRes = await pgPool.query(
      "SELECT COUNT(*) FROM habit_logs WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3",
      [userId, startDate, endDate]
    );
    const completedCount = parseInt(logRes.rows[0].count, 10) || 0;

    // Get all habits that the user tracks (owned + shared)
    const habitRes = await pgPool.query(
      "SELECT * FROM habits WHERE (user_id = $1 OR is_shared = true) AND is_active = true",
      [userId]
    );
    const habits = habitRes.rows as Habit[];

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
    return completedCount / totalExpected;
  }
}
