import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const npxExec = process.platform === "win32" ? "npx.cmd" : "npx";
const productionSchemaPath = join(process.cwd(), "prisma", "schema.production.prisma");

function isPostgresUrl(value?: string) {
  return Boolean(value?.startsWith("postgres://") || value?.startsWith("postgresql://"));
}

function assertProductionEnvironment() {
  if (process.env.VERCEL_ENV !== "production") return;

  if (!isPostgresUrl(process.env.DATABASE_URL)) {
    throw new Error("Production DATABASE_URL must be a PostgreSQL/Supabase URL. SQLite is forbidden.");
  }
  if (!isPostgresUrl(process.env.DIRECT_URL)) {
    throw new Error("Production DIRECT_URL must be a PostgreSQL/Supabase direct URL.");
  }
  if (process.env.ALLOW_DEMO_MODE === "true") {
    throw new Error("ALLOW_DEMO_MODE cannot be enabled in production.");
  }
}

function writeProductionPrismaSchema() {
  const source = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
  const schema = source.replace(
    /provider\s*=\s*"sqlite"\s*\n\s*url\s*=\s*env\("DATABASE_URL"\)/,
    'provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
  );
  writeFileSync(productionSchemaPath, schema);
}

function run(label: string, command: string, args: string[]) {
  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    const reason = result.error ? `: ${result.error.message}` : "";
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}${reason}`);
  }
}

assertProductionEnvironment();
writeProductionPrismaSchema();

run("Prisma generate", npxExec, ["prisma", "generate", "--schema", productionSchemaPath]);
if (process.env.PRISMA_APPLY_ON_BUILD === "true") {
  run("Prisma db push", npxExec, ["prisma", "db", "push", "--schema", productionSchemaPath, "--skip-generate"]);
} else {
  console.log("Skipping Prisma db push during build. Apply production schema changes separately before deploying.");
}
run("Next build", npxExec, ["next", "build"]);
