import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/field";
import { confirmSamplePreviewBatchAction } from "@/features/production/actions";
import {
  buildSampleBatchPreview,
  encodeSampleUnits,
} from "@/server/operations/sample-batch-preview";

export default async function SampleProductionPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const preview = await buildSampleBatchPreview().catch((error: unknown) => ({
    error: error instanceof Error ? error.message : "No se pudo generar la preview SAMPLE.",
  }));

  if ("error" in preview) {
    return (
      <div className="grid gap-5">
        <header>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
            Volver a produccion
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE real</h1>
        </header>
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-red-700" />
            <div className="grid gap-2">
              <p className="text-sm font-medium text-red-900">No se pudieron generar candidatos SAMPLE.</p>
              <p className="text-sm text-red-800">{preview.error}</p>
            </div>
          </div>
        </Card>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/production/sample-preview?regen=1" variant="secondary">
            <RefreshCcw aria-hidden className="h-4 w-4" />
            Reintentar
          </ButtonLink>
          <ButtonLink href="/admin/production" variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </div>
    );
  }

  const encodedUnits = encodeSampleUnits(preview.units);
  const exportQuery = `units=${encodeURIComponent(encodedUnits)}`;
  const hasCandidates = preview.units.length > 0;

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
          Volver a produccion
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE real</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Previsualiza cinco identificadores fisicos permanentes antes de confirmar el lote.
        </p>
      </header>

      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {query.error === "confirm-required"
            ? "Debes marcar la confirmacion irreversible antes de crear el lote real."
            : "No se pudo confirmar el lote. Revisa si ya existe `SAMPLE-HELPLIS-001` o regenera candidatos."}
        </p>
      ) : null}

      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-amber-700" />
          <p className="text-sm font-medium text-amber-900">
            Estos codigos pasaran a ser identificadores fisicos permanentes si se envian al proveedor. No podran
            eliminarse ni reutilizarse.
          </p>
        </div>
      </Card>

      <Card className="grid gap-4">
        <CardHeader>
          <CardTitle>{preview.internalReference}</CardTitle>
          <CardDescription>
            Cantidad: {preview.quantity} · Dominio: {preview.domain} · productionMode: {preview.productionMode} · Estado inicial: UNACTIVATED
          </CardDescription>
        </CardHeader>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-neutral-500">Candidatos</p>
            <p className="font-medium">{preview.units.length}</p>
          </div>
          <div>
            <p className="text-neutral-500">Formato exportacion</p>
            <p className="font-medium">{preview.exportFormat}</p>
          </div>
          <div>
            <p className="text-neutral-500">QR/NFC</p>
            <p className="font-medium">Misma URL permanente</p>
          </div>
          <div>
            <p className="text-neutral-500">ActivationCode</p>
            <p className="font-medium">Interno, no proveedor</p>
          </div>
          <div>
            <p className="text-neutral-500">UID NFC</p>
            <p className="font-medium">Pendiente retorno Emilia</p>
          </div>
        </div>
      </Card>

      {hasCandidates ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[1220px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Wristband Reference</th>
                  <th className="px-4 py-3">Public Code</th>
                  <th className="px-4 py-3">Public URL</th>
                  <th className="px-4 py-3">QR Content</th>
                  <th className="px-4 py-3">NFC Content</th>
                  <th className="px-4 py-3">Estado inicial</th>
                  <th className="px-4 py-3">QR Filename</th>
                  <th className="px-4 py-3">Batch Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.units.map((unit) => (
                  <tr key={unit.publicCode}>
                    <td className="px-4 py-3">{unit.wristbandReference}</td>
                    <td className="px-4 py-3 font-medium">{unit.publicCode}</td>
                    <td className="px-4 py-3">{unit.publicUrl}</td>
                    <td className="px-4 py-3">{unit.qrContent}</td>
                    <td className="px-4 py-3">{unit.nfcContent}</td>
                    <td className="px-4 py-3">{unit.initialState}</td>
                    <td className="px-4 py-3">{unit.qrFilename}</td>
                    <td className="px-4 py-3">{unit.batchReference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-amber-700" />
            <div className="grid gap-2">
              <p className="text-sm font-medium text-amber-900">No hay candidatos SAMPLE para mostrar.</p>
              <p className="text-sm text-amber-800">Vuelve a generar la preview antes de confirmar el lote.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/production/sample-preview?regen=1" variant="secondary">
          <RefreshCcw aria-hidden className="h-4 w-4" />
          Regenerar candidatos
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/manufacturer.xlsx?${exportQuery}`} variant="secondary">
          Revisar Excel
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/production-data.csv?${exportQuery}`} variant="secondary">
          Revisar CSV
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/qr-png.zip?${exportQuery}`} variant="secondary">
          Revisar QR PNG
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/qr-svg.zip?${exportQuery}`} variant="secondary">
          Revisar QR SVG
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/instructions-en.txt?${exportQuery}`} variant="secondary">
          Instructions EN
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/checksums-sha256.txt?${exportQuery}`} variant="secondary">
          Checksums SHA-256
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/supplier-return.csv?${exportQuery}`} variant="secondary">
          Plantilla retorno
        </ButtonLink>
        <ButtonLink href={`/api/admin/production/sample-preview/supplier-package.zip?${exportQuery}`} variant="secondary">
          ZIP proveedor
        </ButtonLink>
        <ButtonLink href="/admin/production" variant="ghost">
          Cancelar
        </ButtonLink>
        <form action={confirmSamplePreviewBatchAction} className="grid max-w-xl gap-2">
          <input type="hidden" name="encodedUnits" value={encodedUnits} />
          <CheckboxField
            name="confirmIrreversible"
            label="Confirmo que estos 5 codigos seran identificadores fisicos permanentes y no se reutilizaran."
          />
          <Button type="submit" variant="danger">
            Confirmar lote real
          </Button>
        </form>
      </div>
    </div>
  );
}
