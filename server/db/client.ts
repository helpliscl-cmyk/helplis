import { PrismaClient } from "@prisma/client";
import { assertRuntimeDatabaseSafety } from "@/lib/runtime/production-safety";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

assertRuntimeDatabaseSafety();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
