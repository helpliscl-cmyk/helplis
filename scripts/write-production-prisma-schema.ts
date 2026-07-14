import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const productionSchemaPath = join(process.cwd(), "prisma", "schema.production.prisma");

const source = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
const schema = source.replace(
  /provider\s*=\s*"sqlite"\s*\n\s*url\s*=\s*env\("DATABASE_URL"\)/,
  'provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
);

writeFileSync(productionSchemaPath, schema);
