import mysql from "mysql2/promise";
import pg from "pg";
import { env } from "./env.js";

let mysqlPool: mysql.Pool | null = null;
let pgPool: pg.Pool | null = null;

if (env.DB_PROVIDER === "mysql") {
  mysqlPool = mysql.createPool({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
} else if (env.DB_PROVIDER === "supabase") {
  pgPool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL && env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });
}

export { mysqlPool, pgPool };
export async function testConnection(): Promise<boolean> {
  if (env.DB_PROVIDER === "mysql" && mysqlPool) {
    try {
      const connection = await mysqlPool.getConnection();
      connection.release();
      console.log("MySQL connection test: SUCCESS");
      return true;
    } catch (err: any) {
      console.error("MySQL connection test: FAILED -", err.message);
      return false;
    }
  } else if (env.DB_PROVIDER === "supabase" && pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("Supabase connection test: SUCCESS");
      return true;
    } catch (err: any) {
      console.error("Supabase connection test: FAILED -", err.message);
      return false;
    }
  }
  return false;
}
