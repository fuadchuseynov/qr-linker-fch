import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "steercode-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: [
      "steercode.dev",
      "steercode.app",
      ".e2b.dev", 
      ".e2b-foxtrot.dev"
    ]
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: [
      "steercode.dev",
      "steercode.app",
      ".e2b.dev", 
      ".e2b-foxtrot.dev"
    ]
  },
  plugins: [
    react(),
    mode === 'development'&& componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
  },
}));
