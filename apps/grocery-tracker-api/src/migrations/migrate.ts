import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMySQLMigrations() {
  console.log("Starting Grocery MySQL schema migration...");

  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
    multipleStatements: true,
  });

  try {
    const migrationDir = path.join(__dirname, "mysql");
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} MySQL migration file(s): ${migrationFiles.join(", ")}`);

    for (const file of migrationFiles) {
      console.log(`Executing MySQL migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      await connection.query(sql);
      console.log(`✓ MySQL migration ${file} completed.`);
    }

    console.log("All Grocery MySQL migrations completed successfully.");
  } catch (error: any) {
    console.error("Grocery MySQL migration failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runPostgresMigrations() {
  console.log("Starting Grocery Postgres schema migration...");
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL env variable is required for Postgres migrations.");
  }

  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    const migrationDir = path.join(__dirname, "supabase");
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} Postgres migration file(s): ${migrationFiles.join(", ")}`);

    for (const file of migrationFiles) {
      console.log(`Executing Postgres migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      await client.query(sql);
      console.log(`✓ Postgres migration ${file} completed.`);
    }

    console.log("All Grocery Postgres migrations completed successfully.");
  } catch (error: any) {
    console.error("Grocery Postgres migration failed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    if (env.DB_PROVIDER === "mysql") {
      await runMySQLMigrations();
    } else if (env.DB_PROVIDER === "supabase" || env.DB_PROVIDER === "neondb") {
      await runPostgresMigrations();
    } else {
      console.error("Unsupported DB_PROVIDER:", env.DB_PROVIDER);
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Grocery migration runner failed:", error);
    process.exit(1);
  }
}

main();
