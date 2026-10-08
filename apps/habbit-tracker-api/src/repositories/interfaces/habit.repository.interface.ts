import { Habit } from "../../types/index.js";

export interface IHabitRepository {
  findById(id: string): Promise<Habit | null>;
  create(habit: Habit): Promise<Habit>;
  update(habit: Habit): Promise<Habit>;
  delete(id: string): Promise<boolean>;
  findByUserId(userId: string): Promise<Habit[]>;
  findShared(userId: string, partnerId: string | null): Promise<Habit[]>;
}
