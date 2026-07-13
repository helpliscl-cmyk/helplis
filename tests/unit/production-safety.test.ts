import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProductionWriteSafety,
  isDemoEmail,
  isSqliteDatabaseUrl,
  productionRequiresPersistentDatabase,
} from "@/lib/runtime/production-safety";

describe("production safety guards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects demo users and sqlite URLs", () => {
    expect(isDemoEmail("admin@demo.helplis.cl")).toBe(true);
    expect(isDemoEmail("admin@helplis.cl")).toBe(false);
    expect(isSqliteDatabaseUrl("file:/tmp/helplis.db")).toBe(true);
    expect(isSqliteDatabaseUrl("postgresql://postgres:secret@example.supabase.co/postgres")).toBe(false);
  });

  it("requires persistent database on production deployments", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "file:/tmp/helplis.db");

    expect(productionRequiresPersistentDatabase()).toBe(true);
    expect(() => assertProductionWriteSafety({ email: "admin@helplis.cl" })).toThrow(/SQLite/);
  });

  it("blocks demo users on production PostgreSQL", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:secret@example.supabase.co/postgres");

    expect(() => assertProductionWriteSafety({ email: "admin@demo.helplis.cl" })).toThrow(/demo user/);
  });
});
