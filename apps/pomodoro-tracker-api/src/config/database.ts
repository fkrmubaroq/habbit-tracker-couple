import mysql from "mysql2/promise";
import pg from "pg";
import { Pool as NeonPool } from "@neondatabase/serverless";
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
    // Pomodoro stores session timestamps as naive UTC DATETIME. Letting mysql2
    // turn them into JS Dates would re-interpret them in the Node process
    // timezone, shifting every session by the server's UTC offset.
    dateStrings: true,
  });
} else if (env.DB_PROVIDER === "supabase") {
  pgPool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL && env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });
} else if (env.DB_PROVIDER === "neondb") {
  pgPool = new NeonPool({
    connectionString: env.DATABASE_URL,
  }) as any;
}

export { mysqlPool, pgPool };

/**
 * Universal query runner that translates '?' to '$1, $2' if postgres.
 */
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (env.DB_PROVIDER === "mysql") {
    if (!mysqlPool) throw new Error("MySQL connection pool is not initialized");
    const [rows] = await mysqlPool.execute<any>(sql, params);
    return rows as T[];
  } else {
    if (!pgPool) throw new Error("PostgreSQL connection pool is not initialized");
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await pgPool.query(pgSql, params);
    return result.rows as T[];
  }
}

export async function testConnection(): Promise<boolean> {
  if (env.DB_PROVIDER === "mysql" && mysqlPool) {
    try {
      const connection = await mysqlPool.getConnection();
      connection.release();
      console.log("Pomodoro API: MySQL connection test: SUCCESS");
      return true;
    } catch (err: any) {
      console.warn("Pomodoro API: MySQL connection test WARNING -", err.message);
      return false;
    }
  } else if ((env.DB_PROVIDER === "supabase" || env.DB_PROVIDER === "neondb") && pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log(`Pomodoro API: ${env.DB_PROVIDER === "neondb" ? "NeonDB" : "Supabase"} connection test: SUCCESS`);
      return true;
    } catch (err: any) {
      console.warn(`Pomodoro API: ${env.DB_PROVIDER === "neondb" ? "NeonDB" : "Supabase"} connection test WARNING -`, err.message);
      return false;
    }
  }
  return false;
}
