import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Which backend the dev server proxies to, once the real API is wired. Until
// then MSW handles requests in the browser and this proxy is dormant. Go
// through the proxy rather than an absolute VITE_API_URL so requests stay
// same-origin and the backend CORS allowlist never enters into it.
const BACKEND = process.env.VITE_BACKEND_ORIGIN || "http://localhost:3000";

export default defineConfig({
  server: {
    host: "::",
    port: 5175,
    hmr: { overlay: false },
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
      "/ws": { target: BACKEND.replace(/^http/, "ws"), ws: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
