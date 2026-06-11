import { HabitLog } from "../../types/index.js";

export interface IHabitLogRepository {
  findByHabitAndDate(habitId: string, completedDate: string): Promise<HabitLog | null>;
  create(log: HabitLog): Promise<HabitLog>;
  delete(habitId: string, completedDate: string): Promise<boolean>;
  findLogsForUser(userId: string, startDate: string, endDate: string): Promise<HabitLog[]>;
  findLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]>;
  getCompletionRate(userId: string, startDate: string, endDate: string): Promise<number>;
}
