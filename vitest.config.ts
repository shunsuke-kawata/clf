import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig.json の "paths": { "@/*": ["./src/*"] } と同等の設定
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    // jsdom より高速な DOM 実装。Leaflet を含まない純粋ロジックテスト向け
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    // process.env に注入するダミー値（server.ts・auth.ts がモジュール評価時に読む変数）
    env: {
      APP_PASSWORD: "test-password",
      SESSION_SECRET: "test-session-secret-for-vitest-ok",
      SUPABASE_URL: "https://test.supabase.co",
      ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      NODE_ENV: "test",
    },
  },
});
