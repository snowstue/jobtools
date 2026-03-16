import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
