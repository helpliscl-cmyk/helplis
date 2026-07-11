import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://helplis.cl"),
  AUTH_SECRET: z.string().min(32).default("local-development-secret-change-before-production"),
  ADMIN_EMAIL: z.string().email().default("Admin@helplis.cl"),
  ADMIN_PHONE: z.string().default("+56988455230"),
  EMAIL_PROVIDER: z.string().default("local"),
  EMAIL_FROM: z.string().default("Admin@helplis.cl"),
  SMS_PROVIDER: z.string().default("local"),
  WHATSAPP_PROVIDER: z.string().default("local"),
  STORAGE_PROVIDER: z.string().default("local"),
  SENTRY_DSN: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
