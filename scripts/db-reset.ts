import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = databaseUrl.replace(/^file:/, "").startsWith(".")
  ? resolve("prisma", databaseUrl.replace(/^file:/, ""))
  : databaseUrl.replace(/^file:/, "");

if (existsSync(dbPath)) {
  rmSync(dbPath);
  console.log(`Eliminada base local ${dbPath}`);
}

for (const command of [
  ["npm", ["run", "db:migrate"]],
  ["npm", ["run", "db:seed"]],
] as const) {
  const result = spawnSync(command[0], command[1], { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
