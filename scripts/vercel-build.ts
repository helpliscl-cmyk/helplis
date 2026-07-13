import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const buildDatabaseUrl = "file:./vercel-demo.db";
const runtimeDatabaseUrl = process.env.DATABASE_URL ?? "file:/tmp/helplis.db";
const npmExec = process.platform === "win32" ? "npm.cmd" : "npm";
const npxExec = process.platform === "win32" ? "npx.cmd" : "npx";

function run(label: string, command: string, args: string[], envDatabaseUrl: string) {
  const result = spawnSync(command, args, {
    env: { ...process.env, DATABASE_URL: envDatabaseUrl },
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    const reason = result.error ? `: ${result.error.message}` : "";
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}${reason}`);
  }
}

rmSync(join(process.cwd(), "prisma", "vercel-demo.db"), { force: true });
rmSync(join(process.cwd(), "prisma", "vercel-demo.db-journal"), { force: true });

run("Database migrate", npmExec, ["run", "db:migrate"], buildDatabaseUrl);
run("Prisma seed", npxExec, ["prisma", "db", "seed"], buildDatabaseUrl);
run("Next build", npxExec, ["next", "build"], runtimeDatabaseUrl);
