import mysql from "mysql2/promise";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let mysqlPool: mysql.Pool | null = null;
let supabaseClient: SupabaseClient | null = null;

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
  supabaseClient = createClient(env.SUPABASE_URL!, env.SUPABASE_KEY!);
}

export { mysqlPool, supabaseClient };
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
  } else if (env.DB_PROVIDER === "supabase" && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("USERS").select("count", { count: "exact", head: true });
      if (error) throw error;
      console.log("Supabase connection test: SUCCESS");
      return true;
    } catch (err: any) {
      console.error("Supabase connection test: FAILED -", err.message);
      return false;
    }
  }
  return false;
}
