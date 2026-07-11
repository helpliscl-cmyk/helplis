import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = databaseUrl.replace(/^file:/, "").startsWith(".")
  ? resolve("prisma", databaseUrl.replace(/^file:/, ""))
  : databaseUrl.replace(/^file:/, "");

mkdirSync(dirname(dbPath), { recursive: true });

if (existsSync(dbPath)) {
  const probe = spawnSync("sqlite3", [dbPath, ".tables"], { encoding: "utf8" });
  if (probe.stdout.includes("User") && probe.stdout.includes("Device")) {
    console.log(`Base SQLite ya inicializada en ${dbPath}`);
    process.exit(0);
  }
}

const migrationsDir = resolve("prisma", "migrations");
const migrationDirs = readdirSync(migrationsDir)
  .filter((entry) => existsSync(join(migrationsDir, entry, "migration.sql")))
  .sort();

for (const migration of migrationDirs) {
  const sql = readFileSync(join(migrationsDir, migration, "migration.sql"), "utf8");
  const result = spawnSync("sqlite3", [dbPath], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `No se pudo aplicar ${migration}`);
  }
  console.log(`Aplicada migración ${migration}`);
}

console.log(`Base SQLite lista en ${dbPath}`);
