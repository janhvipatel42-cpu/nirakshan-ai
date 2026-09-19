import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Proxies /api and /uploads to the FastAPI backend during local development
// so the frontend can simply call relative paths like fetch("/api/auth/login").
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
    },
  },
});
