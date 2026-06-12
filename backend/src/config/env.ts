import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DB_PROVIDER: z.enum(["mysql", "supabase"]),
  JWT_SECRET: z.string().default("habitpasutri-default-secret-key-12345"),
  
  // MySQL
  MYSQL_HOST: z.string().optional(),
  MYSQL_USER: z.string().optional(),
  MYSQL_PASSWORD: z.string().optional(),
  MYSQL_DATABASE: z.string().optional(),
  MYSQL_PORT: z.coerce.number().default(3306),

  // Supabase (SDK client)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_KEY: z.string().optional(),

  // Postgres URL (For raw migrations and seeders when DB_PROVIDER is supabase)
  DATABASE_URL: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.DB_PROVIDER === "mysql") {
    if (!data.MYSQL_HOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MYSQL_HOST"],
        message: "MYSQL_HOST is required when DB_PROVIDER is mysql",
      });
    }
    if (!data.MYSQL_USER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MYSQL_USER"],
        message: "MYSQL_USER is required when DB_PROVIDER is mysql",
      });
    }
    if (!data.MYSQL_DATABASE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MYSQL_DATABASE"],
        message: "MYSQL_DATABASE is required when DB_PROVIDER is mysql",
      });
    }
  } else if (data.DB_PROVIDER === "supabase") {
    if (!data.SUPABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SUPABASE_URL"],
        message: "SUPABASE_URL is required when DB_PROVIDER is supabase",
      });
    }
    if (!data.SUPABASE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SUPABASE_KEY"],
        message: "SUPABASE_KEY is required when DB_PROVIDER is supabase",
      });
    }
    if (!data.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL (Direct Postgres connection string) is required when DB_PROVIDER is supabase for schema migrations & seeders",
      });
    }
  }
});

export const env = envSchema.parse(process.env);
