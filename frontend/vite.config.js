import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Em produção (Vercel), VITE_API_URL aponta para o backend no Railway.
  // Em desenvolvimento local, usa o proxy para localhost:3001.
  const backendUrl = env.VITE_API_URL || "http://localhost:3001";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Em desenvolvimento: redireciona /api/* para o backend local
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    define: {
      // Expõe a URL da API para o código do frontend em produção
      __API_URL__: JSON.stringify(backendUrl),
    },
  };
});
