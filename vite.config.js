import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    proxy: {
      // In local dev, Vite proxies /api calls to the Vercel dev server (port 3000)
      // Run: vercel dev (instead of npm run dev) to get both frontend + API routes
      // OR run: npx vercel dev — it handles everything on one port automatically
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
