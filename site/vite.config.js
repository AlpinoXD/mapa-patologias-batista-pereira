import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // O Windows derruba o observador de arquivos com EBUSY sem polling.
  server: { port: 5180, watch: { usePolling: true, interval: 300 } },
});
