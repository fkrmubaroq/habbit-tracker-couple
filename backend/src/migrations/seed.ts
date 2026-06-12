import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import pg from "pg";
import { env } from "../config/env.js";

interface Executor {
  query(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
}

class MySQLExecutor implements Executor {
  private connection: mysql.Connection | null = null;

  async init() {
    this.connection = await mysql.createConnection({
      host: env.MYSQL_HOST,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      port: env.MYSQL_PORT,
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.connection) throw new Error("MySQL Connection not initialized");
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

class PGExecutor implements Executor {
  private client: pg.Client | null = null;

  async init() {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required for Supabase seeding");
    this.client = new pg.Client({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });
    await this.client.connect();
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.client) throw new Error("PG Client not initialized");
    // Translate '?' placeholders to '$1, $2, ...'
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await this.client.query(pgSql, params);
    return res.rows;
  }

  async close() {
    if (this.client) {
      await this.client.end();
    }
  }
}

async function main() {
  console.log(`Starting database seeding using DB_PROVIDER: ${env.DB_PROVIDER}...`);
  
  let db: Executor;
  if (env.DB_PROVIDER === "mysql") {
    const mysqlExec = new MySQLExecutor();
    await mysqlExec.init();
    db = mysqlExec;
  } else if (env.DB_PROVIDER === "supabase") {
    const pgExec = new PGExecutor();
    await pgExec.init();
    db = pgExec;
  } else {
    console.error("Unsupported DB_PROVIDER:", env.DB_PROVIDER);
    process.exit(1);
  }

  try {
    // 1. Clean data (idempotent seeder)
    console.log("Cleaning existing database tables...");
    await db.query("DELETE FROM USER_BADGES");
    await db.query("DELETE FROM BADGES");
    await db.query("DELETE FROM STREAKS");
    await db.query("DELETE FROM HABIT_LOGS");
    await db.query("DELETE FROM HABITS");
    await db.query("UPDATE USERS SET partner_id = NULL");
    await db.query("DELETE FROM USERS");

    console.log("Seeding initial data...");

    // Hash password for users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const romeoId = uuidv4();
    const julietId = uuidv4();

    // 2. Insert Users
    console.log("Inserting couple profiles (Romeo & Juliet)...");
    await db.query(
      "INSERT INTO USERS (id, username, password_hash, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        romeoId,
        "romeo",
        hashedPassword,
        "Romeo",
        "🦖",
        null,
        "husband",
        null,
        JSON.stringify({ theme: "Duo" }),
      ]
    );

    await db.query(
      "INSERT INTO USERS (id, username, password_hash, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        julietId,
        "juliet",
        hashedPassword,
        "Juliet",
        "🦄",
        null,
        "wife",
        null,
        JSON.stringify({ theme: "Sakura" }),
      ]
    );

    // Link partners
    await db.query("UPDATE USERS SET partner_id = ? WHERE id = ?", [julietId, romeoId]);
    await db.query("UPDATE USERS SET partner_id = ? WHERE id = ?", [romeoId, julietId]);

    // 3. Insert Badges
    console.log("Inserting gamification badges...");
    const badge7DayId = uuidv4();
    const badge30DayId = uuidv4();
    const badge100TogetherId = uuidv4();
    const badgeFirstMonthId = uuidv4();

    await db.query(
      "INSERT INTO BADGES (id, name, description, icon, type, requirement_value) VALUES (?, ?, ?, ?, ?, ?)",
      [badge7DayId, "7 Day Streak", "Maintain a habit streak for 7 days in a row!", "flame", "personal", 7]
    );
    await db.query(
      "INSERT INTO BADGES (id, name, description, icon, type, requirement_value) VALUES (?, ?, ?, ?, ?, ?)",
      [badge30DayId, "30 Day Consistency", "Maintain a habit streak for 30 days in a row!", "trophy", "personal", 30]
    );
    await db.query(
      "INSERT INTO BADGES (id, name, description, icon, type, requirement_value) VALUES (?, ?, ?, ?, ?, ?)",
      [badge100TogetherId, "100 Together", "Complete 100 habits together!", "heart-handshake", "couple", 100]
    );
    await db.query(
      "INSERT INTO BADGES (id, name, description, icon, type, requirement_value) VALUES (?, ?, ?, ?, ?, ?)",
      [badgeFirstMonthId, "First Month", "Complete habits together for 30 days!", "calendar-heart", "couple", 30]
    );

    // 4. Insert Habits
    console.log("Inserting personal and shared habits...");
    const gymHabitId = uuidv4();
    const bookHabitId = uuidv4();
    const financeHabitId = uuidv4();
    
    const yogaHabitId = uuidv4();
    const waterHabitId = uuidv4();
    const mealPrepHabitId = uuidv4();

    const walkHabitId = uuidv4(); // Shared daily habit
    const dateNightHabitId = uuidv4(); // Shared weekly habit

    // Romeo habits
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [gymHabitId, romeoId, "Gym Workout", "Push/Pull/Legs training at the gym", "🏋️‍♂️", "daily", false, true]
    );
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [bookHabitId, romeoId, "Read 10 Pages", "Read self-improvement or novel", "📖", "daily", false, true]
    );
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [financeHabitId, romeoId, "Financial Review", "Review weekly budget and expenses", "📊", "weekly", false, true]
    );

    // Juliet habits
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [yogaHabitId, julietId, "Yoga & Stretching", "Morning flexibility routines", "🧘‍♀️", "daily", false, true]
    );
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [waterHabitId, julietId, "Drink 2L Water", "Keep hydrated throughout the day", "💧", "daily", false, true]
    );
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [mealPrepHabitId, julietId, "Weekly Meal Prep", "Plan healthy lunches for the week", "🍱", "weekly", false, true]
    );

    // Shared habits
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [walkHabitId, romeoId, "Evening Walk Together", "Walk around the park to chat and unwind", "🚶‍♂️🚶‍♀️", "daily", true, true]
    );
    await db.query(
      "INSERT INTO HABITS (id, user_id, title, description, icon_emoji, frequency, is_shared, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [dateNightHabitId, julietId, "Weekly Date Night", "Dinner or movies together, no phones allowed", "🌹", "weekly", true, true]
    );

    // 5. Seeding Habit Logs for the last 365 days
    console.log("Generating completion logs for the last 365 days...");
    const dates: string[] = [];
    for (let i = 365; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    const loggedDates = new Set<string>();

    const logCompletions = async (
      habitId: string,
      userId: string,
      prob: number,
      isWeekly: boolean = false
    ): Promise<{ currentStreak: number; longestStreak: number; lastCompletedDate: string | null }> => {
      let currentStreak = 0;
      let longestStreak = 0;
      let lastCompletedDate: string | null = null;
      let tempStreak = 0;

      for (let index = 0; index < dates.length; index++) {
        const dateStr = dates[index];
        const key = `${habitId}_${dateStr}`;
        
        let completed = false;
        if (isWeekly) {
          // Weekly habits are completed once a week, let's say every 7 days
          completed = index % 7 === 3;
        } else {
          // Daily habits completed with some probability
          completed = Math.random() < prob;
        }

        if (completed || loggedDates.has(key)) {
          if (!loggedDates.has(key)) {
            await db.query(
              "INSERT INTO HABIT_LOGS (id, habit_id, user_id, completed_date, is_completed, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                uuidv4(),
                habitId,
                userId,
                dateStr,
                true,
                `Successfully completed!`,
                `${dateStr} 20:00:00`,
              ]
            );
            loggedDates.add(key);
          }
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          lastCompletedDate = dateStr;
        } else {
          // If it's a daily habit, streak resets on missed day
          if (!isWeekly) {
            tempStreak = 0;
          }
        }
      }
      currentStreak = tempStreak;
      return { currentStreak, longestStreak, lastCompletedDate };
    };

    // Log completions & calculate streaks
    const gymStreaks = await logCompletions(gymHabitId, romeoId, 0.85);
    const bookStreaks = await logCompletions(bookHabitId, romeoId, 0.90);
    const financeStreaks = await logCompletions(financeHabitId, romeoId, 1.0, true);

    const yogaStreaks = await logCompletions(yogaHabitId, julietId, 0.80);
    const waterStreaks = await logCompletions(waterHabitId, julietId, 0.95);
    const mealPrepStreaks = await logCompletions(mealPrepHabitId, julietId, 1.0, true);

    // Shared habits logs (both users log completions)
    // Romeo logs walk
    const romeoWalkStreaks = await logCompletions(walkHabitId, romeoId, 0.85);
    // Juliet logs walk
    const julietWalkStreaks = await logCompletions(walkHabitId, julietId, 0.90);
    // Juliet logs date night
    const julietDateStreaks = await logCompletions(dateNightHabitId, julietId, 1.0, true);
    // Romeo logs date night
    const romeoDateStreaks = await logCompletions(dateNightHabitId, romeoId, 1.0, true);

    // 6. Insert Streaks records
    console.log("Populating streaks table...");
    const insertStreak = async (userId: string, habitId: string, streakInfo: any) => {
      await db.query(
        "INSERT INTO STREAKS (id, user_id, habit_id, current_streak, longest_streak, last_completed_date) VALUES (?, ?, ?, ?, ?, ?)",
        [
          uuidv4(),
          userId,
          habitId,
          streakInfo.currentStreak,
          streakInfo.longestStreak,
          streakInfo.lastCompletedDate,
        ]
      );
    };

    await insertStreak(romeoId, gymHabitId, gymStreaks);
    await insertStreak(romeoId, bookHabitId, bookStreaks);
    await insertStreak(romeoId, financeHabitId, financeStreaks);

    await insertStreak(julietId, yogaHabitId, yogaStreaks);
    await insertStreak(julietId, waterHabitId, waterStreaks);
    await insertStreak(julietId, mealPrepHabitId, mealPrepStreaks);

    await insertStreak(romeoId, walkHabitId, romeoWalkStreaks);
    await insertStreak(julietId, walkHabitId, julietWalkStreaks);

    await insertStreak(romeoId, dateNightHabitId, romeoDateStreaks);
    await insertStreak(julietId, dateNightHabitId, julietDateStreaks);

    // 7. Insert earned badges in USER_BADGES
    console.log("Awarding initial user badges...");
    // Award Romeo 7 Day Streak badge
    await db.query(
      "INSERT INTO USER_BADGES (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [uuidv4(), romeoId, badge7DayId]
    );
    // Award Juliet 7 Day Streak badge
    await db.query(
      "INSERT INTO USER_BADGES (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [uuidv4(), julietId, badge7DayId]
    );

    console.log("Database seeding finished successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
