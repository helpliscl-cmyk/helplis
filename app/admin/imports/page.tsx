import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { importCsvAction } from "@/features/admin/actions";
import { prisma } from "@/server/db/client";

export default async function AdminImportsPage() {
  const [batches, jobs] = await Promise.all([
    prisma.batch.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.importJob.findMany({
      include: { rows: { orderBy: { rowNumber: "asc" }, take: 10 }, batch: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const exampleCsv = [
    "HLPX01,https://helplis.cl/p/HLPX01,04:AA:BB:01,WRISTBAND",
    "HLPX02,https://helplis.cl/p/HLPX02,04:AA:BB:02,PET_TAG",
  ].join("\n");

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Importaciones</h1>
        <p className="mt-1 text-sm text-neutral-600">Valida dominio, duplicados, UID NFC y productType.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Importar CSV</h2>
        <form action={importCsvAction} className="grid gap-4">
          <Field label="Archivo / nombre lógico">
            <Input name="filename" defaultValue="manual-import.csv" />
          </Field>
          <Field label="Lote">
            <Select name="batchId">
              <option value="">Sin lote</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.internalReference}</option>
              ))}
            </Select>
          </Field>
          <Field label="CSV" hint="Formato: publicCode,publicUrl,nfcUid,productType">
            <Textarea name="csv" defaultValue={exampleCsv} />
          </Field>
          <Button type="submit">Validar e importar filas válidas</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{job.filename}</h2>
                <p className="text-sm text-neutral-600">
                  {job.validRows} válidas · {job.invalidRows} inválidas · {job.batch?.internalReference ?? "Sin lote"}
                </p>
              </div>
              <Badge tone={statusTone(job.status)}>{job.status}</Badge>
            </div>
            <div className="mt-3 grid gap-2">
              {job.rows.map((row) => (
                <div key={row.id} className="rounded-md border border-neutral-200 p-2 text-xs">
                  Fila {row.rowNumber}: {row.publicCode ?? "sin código"} · {row.isValid ? "válida" : row.errors}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
