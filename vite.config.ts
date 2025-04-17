import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/classify": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/classify/, ""),
      },
      "/unihair": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/classify/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
