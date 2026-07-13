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

function hasTable(dbPath: string, tableName: string, DatabaseSync: DatabaseSyncConstructor | null) {
  if (!existsSync(dbPath)) return false;

  if (DatabaseSync) {
    const db = new DatabaseSync(dbPath);
    try {
      const tables = db
        .prepare(`select name from sqlite_master where type = 'table' and name = '${tableName.replace(/'/g, "''")}'`)
        .all();
      return tables.some((table) => table.name === tableName);
    } finally {
      db.close();
    }
  }

  const probe = spawnSync("sqlite3", [dbPath, ".tables"], { encoding: "utf8" });
  return probe.stdout.split(/\s+/).includes(tableName);
}

function hasColumn(dbPath: string, tableName: string, columnName: string, DatabaseSync: DatabaseSyncConstructor | null) {
  if (!existsSync(dbPath)) return false;

  if (DatabaseSync) {
    const db = new DatabaseSync(dbPath);
    try {
      const columns = db.prepare(`pragma table_info('${tableName.replace(/'/g, "''")}')`).all();
      return columns.some((column) => column.name === columnName);
    } finally {
      db.close();
    }
  }

  const probe = spawnSync("sqlite3", [dbPath, `pragma table_info('${tableName.replace(/'/g, "''")}');`], {
    encoding: "utf8",
  });
  return probe.stdout.includes(`|${columnName}|`);
}

mkdirSync(dirname(dbPath), { recursive: true });

const DatabaseSync = loadDatabaseSync();

const migrationsDir = resolve("prisma", "migrations");
const migrationDirs = readdirSync(migrationsDir)
  .filter((entry) => existsSync(join(migrationsDir, entry, "migration.sql")))
  .sort();

function applyMigration(migration: string) {
  const sql = readFileSync(join(migrationsDir, migration, "migration.sql"), "utf8");

  if (DatabaseSync) {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec(sql);
    } finally {
      db.close();
    }
  } else {
    const result = spawnSync("sqlite3", [dbPath], {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || `No se pudo aplicar ${migration}`);
    }
  }

  console.log(`Aplicada migracion ${migration}`);
}

if (hasCoreTables(dbPath, DatabaseSync)) {
  const incrementalMigrations = [
    {
      migration: "20260713173000_mime_scraper_crm",
      markerTable: "Establishment",
    },
    {
      migration: "20260713190000_mime_current_url_metadata",
      markerTable: "ScrapeAttempt",
      markerColumn: "finalUrl",
    },
  ];
  let applied = 0;

  for (const item of incrementalMigrations) {
    const needsMigration = item.markerColumn
      ? !hasColumn(dbPath, item.markerTable, item.markerColumn, DatabaseSync)
      : !hasTable(dbPath, item.markerTable, DatabaseSync);
    if (migrationDirs.includes(item.migration) && needsMigration) {
      applyMigration(item.migration);
      applied += 1;
    }
  }

  if (!applied) console.log(`Base SQLite ya inicializada en ${dbPath}`);
  process.exit(0);
}

if (DatabaseSync) {
  for (const migration of migrationDirs) applyMigration(migration);
} else {
  for (const migration of migrationDirs) applyMigration(migration);
}

console.log(`Base SQLite lista en ${dbPath}`);
