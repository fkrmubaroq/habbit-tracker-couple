import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      TanStackRouterVite(),
      tailwindcss(),
    ],
    server: {
      port: 4040,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL_API || "http://localhost:5050",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
