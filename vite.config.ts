import { defineConfig } from "vite";

export default defineConfig({
  base: "/Solar-System-Simulation/",
  resolve: {
    dedupe: ["three"]
  },
  server: {
    host: "127.0.0.1"
  }
});