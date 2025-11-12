import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This will expose the server to the network
  },
  resolve: {
    alias: {
      // 2. This alias tells Vite that '@' means './src'
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
