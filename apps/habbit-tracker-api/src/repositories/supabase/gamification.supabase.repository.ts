import { pgPool } from "../../config/database.js";
import { Streak, Badge, LeaderboardEntry } from "../../types/index.js";
import { IGamificationRepository } from "../interfaces/gamification.repository.interface.js";
import { v4 as uuidv4 } from "uuid";

export class GamificationSupabaseRepository implements IGamificationRepository {
  async findStreak(userId: string, habitId: string): Promise<Streak | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM streaks WHERE user_id = $1 AND habit_id = $2",
      [userId, habitId]
    );
    return (rows[0] as Streak) || null;
  }

  async upsertStreak(streak: Streak): Promise<Streak> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const id = streak.id || uuidv4();
    const { rows } = await pgPool.query(
      `INSERT INTO streaks (id, user_id, habit_id, current_streak, longest_streak, last_completed_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, habit_id) 
       DO UPDATE SET 
         current_streak = EXCLUDED.current_streak, 
         longest_streak = EXCLUDED.longest_streak, 
         last_completed_date = EXCLUDED.last_completed_date 
       RETURNING *`,
      [
        id,
        streak.user_id,
        streak.habit_id,
        streak.current_streak,
        streak.longest_streak,
        streak.last_completed_date,
      ]
    );
    return rows[0] as Streak;
  }

  async findUserStreaks(userId: string): Promise<Streak[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      "SELECT * FROM streaks WHERE user_id = $1",
      [userId]
    );
    return rows as Streak[];
  }

  async findAllBadges(): Promise<Badge[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM badges");
    return rows as Badge[];
  }

  async findBadgeById(badgeId: string): Promise<Badge | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM badges WHERE id = $1", [badgeId]);
    return (rows[0] as Badge) || null;
  }

  async findEarnedBadges(userId: string): Promise<Badge[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `SELECT b.* 
       FROM user_badges ub 
       JOIN badges b ON ub.badge_id = b.id 
       WHERE ub.user_id = $1 
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
    return rows as Badge[];
  }

  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const id = uuidv4();
    await pgPool.query(
      `INSERT INTO user_badges (id, user_id, badge_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, badge_id) DO NOTHING`,
      [id, userId, badgeId]
    );
    return true;
  }

  async getLeaderboard(
    userId: string,
    partnerId: string | null,
    startDate: string,
    endDate: string
  ): Promise<LeaderboardEntry[]> {
    if (!pgPool) throw new Error("pgPool not initialized");

    let sql: string;
    let params: any[];

    if (partnerId) {
      sql = `
        SELECT 
          u.id as user_id, 
          u.name, 
          u.avatar_emoji, 
          u.role,
          COALESCE(hl.completed_count, 0)::int as completed_count,
          COALESCE(s.streak_count, 0)::int as streak_count
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as completed_count 
          FROM habit_logs 
          WHERE completed_date >= $2 AND completed_date <= $3 
          GROUP BY user_id
        ) hl ON u.id = hl.user_id
        LEFT JOIN (
          SELECT user_id, SUM(current_streak) as streak_count 
          FROM streaks 
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.id IN ($1, $4)
      `;
      params = [userId, startDate, endDate, partnerId];
    } else {
      sql = `
        SELECT 
          u.id as user_id, 
          u.name, 
          u.avatar_emoji, 
          u.role,
          COALESCE(hl.completed_count, 0)::int as completed_count,
          COALESCE(s.streak_count, 0)::int as streak_count
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as completed_count 
          FROM habit_logs 
          WHERE completed_date >= $2 AND completed_date <= $3 
          GROUP BY user_id
        ) hl ON u.id = hl.user_id
        LEFT JOIN (
          SELECT user_id, SUM(current_streak) as streak_count 
          FROM streaks 
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.id = $1
      `;
      params = [userId, startDate, endDate];
    }

    const { rows } = await pgPool.query(sql, params);
    
    // Sort entries: completed_count DESC, streak_count DESC
    return (rows as LeaderboardEntry[]).sort((a, b) => {
      if (b.completed_count !== a.completed_count) {
        return b.completed_count - a.completed_count;
      }
      return b.streak_count - a.streak_count;
    });
  }
}
