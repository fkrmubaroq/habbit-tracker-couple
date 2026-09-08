import { env } from "../config/env.js";
import { IGamificationRepository } from "./interfaces/gamification.repository.interface.js";
import { IGroceryRepository } from "./interfaces/grocery.repository.interface.js";
import { IHabitLogRepository } from "./interfaces/habit-log.repository.interface.js";
import { IHabitRepository } from "./interfaces/habit.repository.interface.js";
import { IUserRepository } from "./interfaces/user.repository.interface.js";

import { GamificationMySQLRepository } from "./mysql/gamification.mysql.repository.js";
import { GroceryMySQLRepository } from "./mysql/grocery.mysql.repository.js";
import { HabitLogMySQLRepository } from "./mysql/habit-log.mysql.repository.js";
import { HabitMySQLRepository } from "./mysql/habit.mysql.repository.js";
import { UserMySQLRepository } from "./mysql/user.mysql.repository.js";

import { GamificationSupabaseRepository } from "./supabase/gamification.supabase.repository.js";
import { GrocerySupabaseRepository } from "./supabase/grocery.supabase.repository.js";
import { HabitLogSupabaseRepository } from "./supabase/habit-log.supabase.repository.js";
import { HabitSupabaseRepository } from "./supabase/habit.supabase.repository.js";
import { UserSupabaseRepository } from "./supabase/user.supabase.repository.js";

class RepositoryFactory {
  private userRepo!: IUserRepository;
  private habitRepo!: IHabitRepository;
  private logRepo!: IHabitLogRepository;
  private gamificationRepo!: IGamificationRepository;
  private groceryRepo!: IGroceryRepository;

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
      this.groceryRepo = new GroceryMySQLRepository();
    } else if (env.DB_PROVIDER === "supabase" || env.DB_PROVIDER === "neondb") {
      this.userRepo = new UserSupabaseRepository();
      this.habitRepo = new HabitSupabaseRepository();
      this.logRepo = new HabitLogSupabaseRepository();
      this.gamificationRepo = new GamificationSupabaseRepository();
      this.groceryRepo = new GrocerySupabaseRepository();
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

  getGroceryRepository(): IGroceryRepository {
    return this.groceryRepo;
  }
}

export const repositories = new RepositoryFactory();
export const userRepo = repositories.getUserRepository();
export const habitRepo = repositories.getHabitRepository();
export const habitLogRepo = repositories.getHabitLogRepository();
export const gamificationRepo = repositories.getGamificationRepository();
export const groceryRepo = repositories.getGroceryRepository();
