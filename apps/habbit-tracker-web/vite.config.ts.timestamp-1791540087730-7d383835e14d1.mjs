// vite.config.ts
import tailwindcss from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@tailwindcss+vite@4.3.3_vit_69ce7e1040bcbc4f457baec4ab887943/node_modules/@tailwindcss/vite/dist/index.mjs";
import { TanStackRouterVite } from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@tanstack+router-plugin@1.1_c9803123c9249e7da2676259ae473e15/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import react from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@vitejs+plugin-react@4.7.0__34cfca8f5ae947da41fed25e9e17e8e4/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig, loadEnv } from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/vite@5.4.21_@types+node@20._df590ac338bc4f94b9559d231eb4b08c/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/vite-plugin-pwa@0.20.5_supp_6bd8097c95149227df0e113c76eed48e/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      TanStackRouterVite(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon/favicon.ico", "robots.txt", "favicon/apple-touch-icon.png"],
        manifest: {
          name: "Habbit Pasutri",
          short_name: "Pasutri",
          description: "Cute & Gamified Habit Tracker for Couples",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "favicon/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "favicon/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL_API || "http://localhost:5000",
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxGaWtyaVxcXFxEZXNrdG9wXFxcXFBFUlNPTkFMXFxcXHByb2plY3RzXFxcXGhhYmJpdC10cmFja2VyLWNvdXBsZVxcXFxhcHBzXFxcXGhhYmJpdC10cmFja2VyLXdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRmlrcmlcXFxcRGVza3RvcFxcXFxQRVJTT05BTFxcXFxwcm9qZWN0c1xcXFxoYWJiaXQtdHJhY2tlci1jb3VwbGVcXFxcYXBwc1xcXFxoYWJiaXQtdHJhY2tlci13ZWJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0Zpa3JpL0Rlc2t0b3AvUEVSU09OQUwvcHJvamVjdHMvaGFiYml0LXRyYWNrZXItY291cGxlL2FwcHMvaGFiYml0LXRyYWNrZXItd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xyXG5pbXBvcnQgeyBUYW5TdGFja1JvdXRlclZpdGUgfSBmcm9tIFwiQHRhbnN0YWNrL3JvdXRlci1wbHVnaW4vdml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIFRhblN0YWNrUm91dGVyVml0ZSgpLFxyXG4gICAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgICBWaXRlUFdBKHtcclxuICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24vZmF2aWNvbi5pY28nLCAncm9ib3RzLnR4dCcsICdmYXZpY29uL2FwcGxlLXRvdWNoLWljb24ucG5nJ10sXHJcbiAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG5hbWU6IFwiSGFiYml0IFBhc3V0cmlcIixcclxuICAgICAgICAgIHNob3J0X25hbWU6IFwiUGFzdXRyaVwiLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3V0ZSAmIEdhbWlmaWVkIEhhYml0IFRyYWNrZXIgZm9yIENvdXBsZXNcIixcclxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnIzBmMTcyYScsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzBmMTcyYScsXHJcbiAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXHJcbiAgICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcclxuICAgICAgICAgIHNjb3BlOiAnLycsXHJcbiAgICAgICAgICBzdGFydF91cmw6ICcvJyxcclxuICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6ICdmYXZpY29uL3dlYi1hcHAtbWFuaWZlc3QtMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogJ2Zhdmljb24vd2ViLWFwcC1tYW5pZmVzdC01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgXSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA1MTczLFxyXG4gICAgICBob3N0OiB0cnVlLFxyXG4gICAgICBwcm94eToge1xyXG4gICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9CQVNFX1VSTF9BUEkgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzYyxPQUFPLGlCQUFpQjtBQUM5ZCxTQUFTLDBCQUEwQjtBQUNuQyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsU0FBUyxlQUFlO0FBR3hCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixtQkFBbUI7QUFBQSxNQUNuQixZQUFZO0FBQUEsTUFDWixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxlQUFlLENBQUMsdUJBQXVCLGNBQWMsOEJBQThCO0FBQUEsUUFDbkYsVUFBVTtBQUFBLFVBQ1IsTUFBTTtBQUFBLFVBQ04sWUFBWTtBQUFBLFVBQ1osYUFBYTtBQUFBLFVBQ2IsYUFBYTtBQUFBLFVBQ2Isa0JBQWtCO0FBQUEsVUFDbEIsU0FBUztBQUFBLFVBQ1QsYUFBYTtBQUFBLFVBQ2IsT0FBTztBQUFBLFVBQ1AsV0FBVztBQUFBLFVBQ1gsT0FBTztBQUFBLFlBQ0w7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxVQUNqQyxjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
