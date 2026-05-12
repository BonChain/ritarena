import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    preserveSymlinks: true,
  },
  server: { port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
