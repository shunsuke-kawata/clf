import { z } from "zod";

const serverEnvSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SUPABASE_URL: z.string().url(),
  ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const result = serverEnvSchema.safeParse(process.env);
if (!result.success) {
  throw new Error(
    `環境変数の検証に失敗しました:\n${result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`
  );
}

export const serverEnv = result.data;
