// vite.config.ts
import tailwindcss from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@tailwindcss+vite@4.3.3_vit_69ce7e1040bcbc4f457baec4ab887943/node_modules/@tailwindcss/vite/dist/index.mjs";
import { TanStackRouterVite } from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@tanstack+router-plugin@1.1_c9803123c9249e7da2676259ae473e15/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import react from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/@vitejs+plugin-react@4.7.0__34cfca8f5ae947da41fed25e9e17e8e4/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig, loadEnv } from "file:///C:/Users/Fikri/Desktop/PERSONAL/projects/habbit-tracker-couple/node_modules/.pnpm/vite@5.4.21_@types+node@20._df590ac338bc4f94b9559d231eb4b08c/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      TanStackRouterVite(),
      tailwindcss()
    ],
    server: {
      port: 5175,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL_API || "http://localhost:1907",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxGaWtyaVxcXFxEZXNrdG9wXFxcXFBFUlNPTkFMXFxcXHByb2plY3RzXFxcXGhhYmJpdC10cmFja2VyLWNvdXBsZVxcXFxhcHBzXFxcXGZpbmFuY2UtdHJhY2tlci13ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEZpa3JpXFxcXERlc2t0b3BcXFxcUEVSU09OQUxcXFxccHJvamVjdHNcXFxcaGFiYml0LXRyYWNrZXItY291cGxlXFxcXGFwcHNcXFxcZmluYW5jZS10cmFja2VyLXdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRmlrcmkvRGVza3RvcC9QRVJTT05BTC9wcm9qZWN0cy9oYWJiaXQtdHJhY2tlci1jb3VwbGUvYXBwcy9maW5hbmNlLXRyYWNrZXItd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xyXG5pbXBvcnQgeyBUYW5TdGFja1JvdXRlclZpdGUgfSBmcm9tIFwiQHRhbnN0YWNrL3JvdXRlci1wbHVnaW4vdml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCBcIlwiKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgVGFuU3RhY2tSb3V0ZXJWaXRlKCksXHJcbiAgICAgIHRhaWx3aW5kY3NzKCksXHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDUxNzUsXHJcbiAgICAgIGhvc3Q6IHRydWUsXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQkFTRV9VUkxfQVBJIHx8IFwiaHR0cDovL2xvY2FsaG9zdDoxOTA3XCIsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXljLE9BQU8saUJBQWlCO0FBQ2plLFNBQVMsMEJBQTBCO0FBQ25DLE9BQU8sV0FBVztBQUNsQixTQUFTLGNBQWMsZUFBZTtBQUV0QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sbUJBQW1CO0FBQUEsTUFDbkIsWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVEsSUFBSSxxQkFBcUI7QUFBQSxVQUNqQyxjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
