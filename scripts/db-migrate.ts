import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => { all: () => Array<{ name?: string }> };
  close: () => void;
};

type DatabaseSyncConstructor = new (path: string) => SqliteDatabase;

const nodeRequire = createRequire(import.meta.url);
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const relativeOrAbsolutePath = databaseUrl.replace(/^file:/, "");
const dbPath = relativeOrAbsolutePath.startsWith(".")
  ? resolve("prisma", relativeOrAbsolutePath)
  : relativeOrAbsolutePath;

function loadDatabaseSync(): DatabaseSyncConstructor | null {
  try {
    return (nodeRequire("node:sqlite") as { DatabaseSync?: DatabaseSyncConstructor }).DatabaseSync ?? null;
  } catch {
    return null;
  }
}

function hasCoreTables(dbPath: string, DatabaseSync: DatabaseSyncConstructor | null) {
  if (!existsSync(dbPath)) return false;

  if (DatabaseSync) {
    const db = new DatabaseSync(dbPath);
    try {
      const tables = db.prepare("select name from sqlite_master where type = 'table' and name in ('User', 'Device')").all();
      return tables.some((table) => table.name === "User") && tables.some((table) => table.name === "Device");
    } finally {
      db.close();
    }
  }

  const probe = spawnSync("sqlite3", [dbPath, ".tables"], { encoding: "utf8" });
  return probe.stdout.includes("User") && probe.stdout.includes("Device");
}

mkdirSync(dirname(dbPath), { recursive: true });

const DatabaseSync = loadDatabaseSync();

if (hasCoreTables(dbPath, DatabaseSync)) {
  console.log(`Base SQLite ya inicializada en ${dbPath}`);
  process.exit(0);
}

const migrationsDir = resolve("prisma", "migrations");
const migrationDirs = readdirSync(migrationsDir)
  .filter((entry) => existsSync(join(migrationsDir, entry, "migration.sql")))
  .sort();

if (DatabaseSync) {
  const db = new DatabaseSync(dbPath);
  try {
    for (const migration of migrationDirs) {
      const sql = readFileSync(join(migrationsDir, migration, "migration.sql"), "utf8");
      db.exec(sql);
      console.log(`Aplicada migracion ${migration}`);
    }
  } finally {
    db.close();
  }
} else {
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
    console.log(`Aplicada migracion ${migration}`);
  }
}

console.log(`Base SQLite lista en ${dbPath}`);
