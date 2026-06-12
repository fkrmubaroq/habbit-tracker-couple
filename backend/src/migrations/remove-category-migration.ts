import mysql from "mysql2/promise";
import pg from "pg";
import { env } from "../config/env.js";

async function runMySQLMigration() {
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
  });

  try {
    console.log("Checking if 'category' column exists in MySQL...");
    const [columns]: any[] = await connection.query("SHOW COLUMNS FROM habits LIKE 'category'");
    if (columns.length > 0) {
      console.log("Removing 'category' column from MySQL habits table...");
      await connection.query("ALTER TABLE habits DROP COLUMN category");
      console.log("MySQL migration completed successfully.");
    } else {
      console.log("'category' column already removed from MySQL.");
    }
  } catch (error: any) {
    console.error("MySQL migration failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runSupabaseMigration() {
  if (!env.DATABASE_URL) {
    console.log("DATABASE_URL not set, skipping PG/Supabase migration.");
    return;
  }
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    console.log("Checking if 'category' column exists in PG/Supabase...");
    const res = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='habits' AND column_name='category'"
    );
    if (res.rows.length > 0) {
      console.log("Removing 'category' column from PG/Supabase habits table...");
      await client.query("ALTER TABLE habits DROP COLUMN category");
      console.log("PG/Supabase migration completed successfully.");
    } else {
      console.log("'category' column already removed from PG/Supabase.");
    }
  } catch (error: any) {
    console.error("PG/Supabase migration failed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    if (env.DB_PROVIDER === "mysql") {
      await runMySQLMigration();
    } else if (env.DB_PROVIDER === "supabase") {
      await runSupabaseMigration();
    } else {
      console.error("Unsupported DB_PROVIDER:", env.DB_PROVIDER);
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
