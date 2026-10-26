import { env } from "../config/env.js";
import { IGroceryRepository } from "./interfaces/grocery.repository.interface.js";
import { GroceryMySQLRepository } from "./mysql/grocery.mysql.repository.js";
import { GrocerySupabaseRepository } from "./supabase/grocery.supabase.repository.js";
import { UserReadRepository } from "./user-read.repository.js";

/**
 * Grocery owns `grocery_items` and only reads `users` (for `partner_id`),
 * mirroring how `@repo/finance-tracker-api` reads the shared session tables.
 */
class GroceryRepositoryFactory {
  private groceryRepo!: IGroceryRepository;
  private userRepo = new UserReadRepository();

  constructor() {
    this.init();
  }

  private init() {
    if (env.DB_PROVIDER === "mysql") {
      this.groceryRepo = new GroceryMySQLRepository();
    } else {
      this.groceryRepo = new GrocerySupabaseRepository();
    }
  }

  getGroceryRepository(): IGroceryRepository {
    return this.groceryRepo;
  }

  getUserRepository(): UserReadRepository {
    return this.userRepo;
  }
}

export const repositories = new GroceryRepositoryFactory();
export const groceryRepo = repositories.getGroceryRepository();
export const userRepo = repositories.getUserRepository();
