import app from "./app.js";
import { testConnection } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
  await testConnection();

  const server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🍅 Pomodoro Tracker API running on port ${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`💾 DB Provider: ${env.DB_PROVIDER}`);
    console.log(`🕐 Aggregation timezone: ${env.APP_TIMEZONE}`);
    console.log(`===============================================`);
  });

  const shutdown = () => {
    console.log("Shutting down Pomodoro Tracker API server...");
    server.close(() => {
      console.log("Pomodoro API Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error("Failed to start Pomodoro Tracker API server:", err);
  process.exit(1);
});
