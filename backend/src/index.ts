import app from "./app.js";
import { env } from "./config/env.js";
import { testConnection } from "./config/database.js";

async function startServer() {
  console.log("Starting Habit Pasutri Habit Tracker backend server...");
  
  // Test database connection before listening
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn("WARNING: Database connection failed. Server will start but some features may throw errors.");
  }

  const port = env.PORT;
  app.listen(port, () => {
    console.log(`[Server]: Habit Pasutri Backend is running on port ${port} in ${env.NODE_ENV} mode.`);
  });
}

startServer().catch((error) => {
  console.error("Critical error during server startup:", error);
  process.exit(1);
});
