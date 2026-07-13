const demoDomain = "@demo.helplis.cl";

export function isDemoEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith(demoDomain));
}

export function isSqliteDatabaseUrl(databaseUrl = process.env.DATABASE_URL ?? "") {
  return databaseUrl.startsWith("file:") || databaseUrl.includes("vercel-demo.db") || databaseUrl.includes("helplis.db");
}

export function isPostgresDatabaseUrl(databaseUrl = process.env.DATABASE_URL ?? "") {
  return databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
}

export function isProductionDeployment() {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_TARGET_ENV === "production";
}

export function isHelplisProductionDomain() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const vercelUrl = process.env.VERCEL_URL ?? "";
  return appUrl === "https://helplis.cl" || vercelUrl === "helplis.cl";
}

export function productionRequiresPersistentDatabase() {
  return isProductionDeployment() || isHelplisProductionDomain();
}

export function isDemoModeAllowed() {
  return process.env.ALLOW_DEMO_MODE === "true" && !productionRequiresPersistentDatabase();
}

export function assertRuntimeDatabaseSafety() {
  if (!productionRequiresPersistentDatabase()) return;

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (isSqliteDatabaseUrl(databaseUrl)) {
    throw new Error("Unsafe production database: SQLite/demo database is forbidden on helplis.cl.");
  }
  if (!isPostgresDatabaseUrl(databaseUrl)) {
    throw new Error("Unsafe production database: DATABASE_URL must point to PostgreSQL.");
  }
}

export function assertProductionWriteSafety(actor?: { email?: string | null }) {
  assertRuntimeDatabaseSafety();
  if (productionRequiresPersistentDatabase() && isDemoEmail(actor?.email)) {
    throw new Error("Production write blocked for demo user.");
  }
  if (process.env.NODE_ENV === "test") {
    throw new Error("Production write blocked in test environment.");
  }
}
