import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

const productionRoot = path.resolve(process.cwd(), "data", "production");

function contentType(filename: string) {
  if (filename.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filename.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (filename.endsWith(".zip")) return "application/zip";
  if (filename.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const { fileId } = await params;
  const file = await prisma.productionFile.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const resolvedPath = path.resolve(file.storagePath);
  if (!resolvedPath.startsWith(productionRoot)) {
    return NextResponse.json({ error: "Ruta de archivo invalida" }, { status: 400 });
  }

  const data = await readFile(resolvedPath);
  await prisma.productionFile.update({ where: { id: file.id }, data: { status: "DOWNLOADED" } });

  return new NextResponse(data, {
    headers: {
      "content-type": contentType(file.filename),
      "content-disposition": `attachment; filename="${file.filename.replaceAll('"', "")}"`,
    },
  });
}
