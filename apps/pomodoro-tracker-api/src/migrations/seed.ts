import { v4 as uuidv4 } from "uuid";
import { executeQuery, testConnection } from "../config/database.js";
import { env } from "../config/env.js";

/**
 * Development-only seed for pomodoro.
 *
 * `users` belongs to `@repo/habbit-tracker-api` — this seeder never creates or
 * deletes users. It only backfills sample finished focus sessions for the first
 * existing user so `/stats` (7-day bars, label donut, yearly heatmap, hourly
 * histogram, monthly trend) has something to render on a fresh dev database.
 *
 * Idempotent: skips entirely when the user already has any session. Never
 * deletes rows.
 */
const SAMPLE_LABELS = ["Coding", "Belajar", "Menulis", "Meeting", "Review"];

function naiveUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.warn("Could not connect to database. Skipping seed.");
      process.exit(0);
    }

    if (env.NODE_ENV === "production") {
      console.warn("Refusing to seed sample pomodoro sessions in production. Skipping seed.");
      process.exit(0);
    }

    const users = await executeQuery<{ id: string }>(
      `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`
    );

    if (users.length === 0) {
      console.warn("No users found. Run the habit API seed first, then re-run this seed.");
      process.exit(0);
    }

    const owner = users[0];
    const existing = await executeQuery<{ total: number | string }>(
      `SELECT COUNT(*) as total FROM pomodoro_sessions WHERE user_id = ?`,
      [owner.id]
    );
    const total = Number(existing[0]?.total ?? 0);

    if (total > 0) {
      console.log(`pomodoro_sessions already has ${total} row(s) for this user. Skipping sample seed.`);
      process.exit(0);
    }

    // 60 sessions spread over the last ~10 months: enough to fill the yearly
    // heatmap, the 12-month trend, and every hour-of-day bucket.
    const now = new Date();
    const rows: Array<{
      id: string;
      label: string;
      planned: number;
      actual: number;
      started: Date;
      ended: Date;
    }> = [];

    for (let i = 0; i < 60; i += 1) {
      const daysAgo = i * 4;
      const hour = 7 + ((i * 3) % 13); // 07:00 – 19:00
      const started = new Date(now);
      started.setDate(started.getDate() - daysAgo);
      started.setHours(hour, (i * 7) % 60, 0, 0);
      const minutes = [25, 25, 25, 50, 90][i % 5];
      const ended = new Date(started.getTime() + minutes * 60_000);

      rows.push({
        id: uuidv4(),
        label: SAMPLE_LABELS[i % SAMPLE_LABELS.length],
        planned: minutes,
        actual: minutes,
        started,
        ended,
      });
    }

    for (const row of rows) {
      await executeQuery(
        `INSERT INTO pomodoro_sessions
         (id, user_id, label, planned_minutes, actual_minutes, started_at, ended_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          owner.id,
          row.label,
          row.planned,
          row.actual,
          naiveUtc(row.started),
          naiveUtc(row.ended),
          naiveUtc(now),
        ]
      );
    }

    console.log(`+ Seeded ${rows.length} sample pomodoro sessions.`);
    console.log("Pomodoro sample seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed runner failed:", error);
    process.exit(1);
  }
}

main();
