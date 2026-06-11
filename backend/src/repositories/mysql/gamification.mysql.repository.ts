import { RowDataPacket } from "mysql2";
import { mysqlPool } from "../../config/database.js";
import { Streak, Badge, LeaderboardEntry } from "../../types/index.js";
import { IGamificationRepository } from "../interfaces/gamification.repository.interface.js";
import { v4 as uuidv4 } from "uuid";

export class GamificationMySQLRepository implements IGamificationRepository {
  async findStreak(userId: string, habitId: string): Promise<Streak | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM STREAKS WHERE user_id = ? AND habit_id = ?",
      [userId, habitId]
    );
    if (rows.length === 0) return null;
    return rows[0] as Streak;
  }

  async upsertStreak(streak: Streak): Promise<Streak> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const id = streak.id || uuidv4();
    await mysqlPool.execute(
      `INSERT INTO STREAKS (id, user_id, habit_id, current_streak, longest_streak, last_completed_date) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         current_streak = VALUES(current_streak), 
         longest_streak = VALUES(longest_streak), 
         last_completed_date = VALUES(last_completed_date)`,
      [
        id,
        streak.user_id,
        streak.habit_id,
        streak.current_streak,
        streak.longest_streak,
        streak.last_completed_date,
      ]
    );
    streak.id = id;
    return streak;
  }

  async findUserStreaks(userId: string): Promise<Streak[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM STREAKS WHERE user_id = ?",
      [userId]
    );
    return rows as Streak[];
  }

  async findAllBadges(): Promise<Badge[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM BADGES"
    );
    return rows as Badge[];
  }

  async findBadgeById(badgeId: string): Promise<Badge | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM BADGES WHERE id = ?",
      [badgeId]
    );
    if (rows.length === 0) return null;
    return rows[0] as Badge;
  }

  async findEarnedBadges(userId: string): Promise<Badge[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT b.* FROM BADGES b 
       INNER JOIN USER_BADGES ub ON b.id = ub.badge_id 
       WHERE ub.user_id = ? 
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
    return rows as Badge[];
  }

  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const id = uuidv4();
    try {
      await mysqlPool.execute(
        "INSERT INTO USER_BADGES (id, user_id, badge_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE earned_at = earned_at",
        [id, userId, badgeId]
      );
      return true;
    } catch (err) {
      console.error("Error awarding badge:", err);
      return false;
    }
  }

  async getLeaderboard(
    userId: string,
    partnerId: string | null,
    startDate: string,
    endDate: string
  ): Promise<LeaderboardEntry[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");

    const ids = partnerId ? [userId, partnerId] : [userId];
    const placeholders = ids.map(() => "?").join(",");

    const sql = `
      SELECT 
        u.id as user_id, 
        u.name, 
        u.avatar_emoji, 
        u.role,
        COALESCE(l.completed_count, 0) as completed_count,
        COALESCE(s.streak_count, 0) as streak_count
      FROM USERS u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as completed_count 
        FROM HABIT_LOGS 
        WHERE completed_date BETWEEN ? AND ?
        GROUP BY user_id
      ) l ON u.id = l.user_id
      LEFT JOIN (
        SELECT user_id, COALESCE(SUM(current_streak), 0) as streak_count 
        FROM STREAKS 
        GROUP BY user_id
      ) s ON u.id = s.user_id
      WHERE u.id IN (${placeholders})
      ORDER BY completed_count DESC, streak_count DESC
    `;

    // Params array is: startDate, endDate, followed by user ids
    const params = [startDate, endDate, ...ids];
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, params);
    
    return rows.map((row) => ({
      user_id: row.user_id,
      name: row.name,
      avatar_emoji: row.avatar_emoji,
      role: row.role,
      completed_count: Number(row.completed_count),
      streak_count: Number(row.streak_count),
    }));
  }
}
