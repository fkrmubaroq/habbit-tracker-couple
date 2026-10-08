import { Streak, Badge, LeaderboardEntry } from "../../types/index.js";

export interface IGamificationRepository {
  findStreak(userId: string, habitId: string): Promise<Streak | null>;
  upsertStreak(streak: Streak): Promise<Streak>;
  findUserStreaks(userId: string): Promise<Streak[]>;
  findAllBadges(): Promise<Badge[]>;
  findBadgeById(badgeId: string): Promise<Badge | null>;
  findEarnedBadges(userId: string): Promise<Badge[]>;
  awardBadge(userId: string, badgeId: string): Promise<boolean>;
  getLeaderboard(userId: string, partnerId: string | null, startDate: string, endDate: string): Promise<LeaderboardEntry[]>;
}
