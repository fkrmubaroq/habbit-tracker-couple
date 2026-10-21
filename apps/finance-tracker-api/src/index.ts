import app from "./app.js";
import { testConnection } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
  await testConnection();

  const server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Finance Tracker API running on port ${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`💾 DB Provider: ${env.DB_PROVIDER}`);
    console.log(`===============================================`);
  });

  const shutdown = () => {
    console.log("Shutting down Finance Tracker API server...");
    server.close(() => {
      console.log("Finance API Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error("Failed to start Finance Tracker API server:", err);
  process.exit(1);
});
