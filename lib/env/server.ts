import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://helplis.cl"),
  AUTH_SECRET: z.string().min(32).default("local-development-secret-change-before-production"),
  ADMIN_EMAIL: z.string().email().default("admin@helplis.cl"),
  ADMIN_PHONE: z.string().default("+56988455230"),
  AUTH_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  ALLOW_DEMO_MODE: z.string().optional().default(""),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_JWT_SECRET: z.string().optional().default(""),
  SUPABASE_STORAGE_PROFILE_BUCKET: z.string().default("profile-photos"),
  EMAIL_PROVIDER: z.string().default("local"),
  EMAIL_FROM: z.string().default("admin@helplis.cl"),
  SMS_PROVIDER: z.string().default("local"),
  WHATSAPP_PROVIDER: z.string().default("local"),
  STORAGE_PROVIDER: z.string().default("local"),
  SENTRY_DSN: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
