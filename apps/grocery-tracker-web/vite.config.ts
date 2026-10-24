import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Production is served under the `/grocery/` path on the shared domain
    // (see scripts/nginx.conf), while dev keeps running at the root of 4042.
    base: mode === "production" ? "/grocery/" : "/",
    plugins: [
      react(),
      TanStackRouterVite(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon/favicon.ico", "robots.txt", "favicon/apple-touch-icon.png"],
        manifest: {
          name: "Grocery List Pasutri",
          short_name: "Grocery",
          description: "Daftar belanjaan bersama untuk pasutri",
          theme_color: "#10b981",
          background_color: "#0f172a",
          display: "standalone",
          orientation: "portrait",
          icons: [
            {
              src: "favicon/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "favicon/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    server: {
      port: 4042,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL_API || "http://localhost:5052",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
