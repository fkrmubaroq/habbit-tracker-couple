import { RowDataPacket } from "mysql2";
import { mysqlPool } from "../../config/database.js";
import { HabitLog, Habit } from "../../types/index.js";
import { IHabitLogRepository } from "../interfaces/habit-log.repository.interface.js";

export class HabitLogMySQLRepository implements IHabitLogRepository {
  async findByHabitAndDate(habitId: string, completedDate: string): Promise<HabitLog | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND completed_date = ?",
      [habitId, completedDate]
    );
    if (rows.length === 0) return null;
    const log = rows[0] as HabitLog;
    log.is_completed = Boolean(log.is_completed);
    return log;
  }

  async create(log: HabitLog): Promise<HabitLog> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      "INSERT INTO habit_logs (id, habit_id, user_id, completed_date, is_completed, notes) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed), notes = VALUES(notes)",
      [
        log.id,
        log.habit_id,
        log.user_id,
        log.completed_date,
        log.is_completed,
        log.notes,
      ]
    );
    return log;
  }

  async delete(habitId: string, completedDate: string): Promise<boolean> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [result] = await mysqlPool.execute<any>(
      "DELETE FROM habit_logs WHERE habit_id = ? AND completed_date = ?",
      [habitId, completedDate]
    );
    return result.affectedRows > 0;
  }

  async findLogsForUser(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM habit_logs WHERE user_id = ? AND completed_date BETWEEN ? AND ? ORDER BY completed_date ASC",
      [userId, startDate, endDate]
    );
    return rows.map((row) => {
      const log = row as HabitLog;
      log.is_completed = Boolean(log.is_completed);
      return log;
    });
  }

  async findLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND completed_date BETWEEN ? AND ? ORDER BY completed_date ASC",
      [habitId, startDate, endDate]
    );
    return rows.map((row) => {
      const log = row as HabitLog;
      log.is_completed = Boolean(log.is_completed);
      return log;
    });
  }

  async getCompletionRate(userId: string, startDate: string, endDate: string): Promise<number> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");

    // Get count of completed logs
    const [logRows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM habit_logs WHERE user_id = ? AND completed_date BETWEEN ? AND ?",
      [userId, startDate, endDate]
    );
    const completedCount = logRows[0].count;

    // Get all habits that the user tracks (owned + shared)
    const [habitRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT DISTINCT h.* FROM habits h 
       WHERE (h.user_id = ? OR h.is_shared = 1) 
       AND h.is_active = 1`,
      [userId]
    );

    if (habitRows.length === 0) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let totalExpected = 0;
    for (const row of habitRows) {
      const habit = row as Habit;
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
