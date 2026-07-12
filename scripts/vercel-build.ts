import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const buildDatabaseUrl = "file:./vercel-demo.db";
const runtimeDatabaseUrl = process.env.DATABASE_URL ?? "file:/tmp/helplis.db";
const npmExec = process.platform === "win32" ? "npx.cmd" : "npx";

function run(label: string, args: string[], envDatabaseUrl: string) {
  const result = spawnSync(npmExec, args, {
    env: { ...process.env, DATABASE_URL: envDatabaseUrl },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
}

rmSync(join(process.cwd(), "prisma", "vercel-demo.db"), { force: true });
rmSync(join(process.cwd(), "prisma", "vercel-demo.db-journal"), { force: true });

run("Prisma generate", ["prisma", "generate"], buildDatabaseUrl);
run("Prisma db push", ["prisma", "db", "push", "--force-reset", "--skip-generate"], buildDatabaseUrl);
run("Prisma seed", ["prisma", "db", "seed"], buildDatabaseUrl);
run("Next build", ["next", "build"], runtimeDatabaseUrl);
