import fs from "fs";
import path from "path";
import fileURLToPath from "url";
import mysql from "mysql2/promise";
import pg from "pg";
import { env } from "../config/env.js";

// Utility to get __dirname equivalent in ESM
const __filename = fileURLToPath.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMySQLMigrations() {
  console.log("Starting MySQL schema migration...");
  
  // Create temporary connection with multipleStatements enabled
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
    multipleStatements: true,
  });

  try {
    const migrationFile = path.join(__dirname, "mysql", "001-initial-schema.sql");
    const sql = fs.readFileSync(migrationFile, "utf8");
    
    console.log("Executing migration SQL...");
    await connection.query(sql);
    console.log("MySQL migration completed successfully.");
  } catch (error: any) {
    console.error("MySQL migration failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runSupabaseMigrations() {
  console.log("Starting Supabase/PostgreSQL schema migration...");
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL env variable is required for Supabase migrations.");
  }

  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    const migrationFile = path.join(__dirname, "supabase", "001-initial-schema.sql");
    const sql = fs.readFileSync(migrationFile, "utf8");

    console.log("Executing migration SQL...");
    await client.query(sql);
    console.log("Supabase/PostgreSQL migration completed successfully.");
  } catch (error: any) {
    console.error("Supabase/PostgreSQL migration failed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    if (env.DB_PROVIDER === "mysql") {
      await runMySQLMigrations();
    } else if (env.DB_PROVIDER === "supabase") {
      await runSupabaseMigrations();
    } else {
      console.error("Unsupported DB_PROVIDER:", env.DB_PROVIDER);
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration runner failed:", error);
    process.exit(1);
  }
}

main();
