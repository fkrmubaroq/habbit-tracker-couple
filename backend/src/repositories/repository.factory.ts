import { env } from "../config/env.js";
import { IGamificationRepository } from "./interfaces/gamification.repository.interface.js";
import { IHabitLogRepository } from "./interfaces/habit-log.repository.interface.js";
import { IHabitRepository } from "./interfaces/habit.repository.interface.js";
import { IUserRepository } from "./interfaces/user.repository.interface.js";

import { GamificationMySQLRepository } from "./mysql/gamification.mysql.repository.js";
import { HabitLogMySQLRepository } from "./mysql/habit-log.mysql.repository.js";
import { HabitMySQLRepository } from "./mysql/habit.mysql.repository.js";
import { UserMySQLRepository } from "./mysql/user.mysql.repository.js";

import { GamificationSupabaseRepository } from "./supabase/gamification.supabase.repository.js";
import { HabitLogSupabaseRepository } from "./supabase/habit-log.supabase.repository.js";
import { HabitSupabaseRepository } from "./supabase/habit.supabase.repository.js";
import { UserSupabaseRepository } from "./supabase/user.supabase.repository.js";

class RepositoryFactory {
  private userRepo!: IUserRepository;
  private habitRepo!: IHabitRepository;
  private logRepo!: IHabitLogRepository;
  private gamificationRepo!: IGamificationRepository;

  constructor() {
    this.init();
  }

  private init() {
    console.log("env", env)
    if (env.DB_PROVIDER === "mysql") {
      this.userRepo = new UserMySQLRepository();
      this.habitRepo = new HabitMySQLRepository();
      this.logRepo = new HabitLogMySQLRepository();
      this.gamificationRepo = new GamificationMySQLRepository();
    } else {
      this.userRepo = new UserSupabaseRepository();
      this.habitRepo = new HabitSupabaseRepository();
      this.logRepo = new HabitLogSupabaseRepository();
      this.gamificationRepo = new GamificationSupabaseRepository();
    }
  }

  getUserRepository(): IUserRepository {
    return this.userRepo;
  }

  getHabitRepository(): IHabitRepository {
    return this.habitRepo;
  }

  getHabitLogRepository(): IHabitLogRepository {
    return this.logRepo;
  }

  getGamificationRepository(): IGamificationRepository {
    return this.gamificationRepo;
  }
}

export const repositories = new RepositoryFactory();
export const userRepo = repositories.getUserRepository();
export const habitRepo = repositories.getHabitRepository();
export const habitLogRepo = repositories.getHabitLogRepository();
export const gamificationRepo = repositories.getGamificationRepository();
