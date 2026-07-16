import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/field";
import { confirmHelpetsSamplePreviewBatchAction } from "@/features/production/actions";
import {
  buildHelpetsSamplePreview,
  encodeHelpetsSampleUnits,
  getConfirmedHelpetsSampleBatch,
  HELPETS_SAMPLE_BATCH_REFERENCE,
  type HelpetsSamplePreviewUnit,
} from "@/server/operations/helpets-sample";

const confirmationMessages: Record<string, string> = {
  preview: "No se recibio el payload de preview. Vuelve a cargar la pagina antes de confirmar.",
  "confirm-required": "Debes marcar la confirmacion irreversible antes de crear el lote Helpets real.",
  BATCH_REFERENCE_ALREADY_EXISTS: "El lote SAMPLE-HELPETS-001 ya existe. No se creo otro lote.",
  PUBLIC_CODE_COLLISION: "Uno o mas publicCode del preview ya existen. No se creo el lote.",
  INVALID_PREVIEW: "El preview ya no es valido. Vuelve a cargar la pagina y revisa los codigos antes de confirmar.",
  PREVIEW_EXPIRED: "El preview expiro. Vuelve a cargar la pagina y revisa los codigos antes de confirmar.",
  DATABASE_CONSTRAINT_ERROR: "La base rechazo la confirmacion por una restriccion de datos.",
  DATABASE_CONNECTION_ERROR: "No se pudo completar la confirmacion por conexion con la base de datos.",
  MIGRATION_MISMATCH: "La base de datos no coincide con el schema esperado.",
  UNAUTHORIZED: "Tu usuario no esta autorizado para confirmar este lote.",
  UNKNOWN_CONFIRMATION_ERROR: "No se pudo confirmar el lote por un error inesperado.",
};

function confirmationMessage(error?: string) {
  if (!error) return null;
  return confirmationMessages[error] ?? confirmationMessages.UNKNOWN_CONFIRMATION_ERROR;
}

function artifactQuery(units: HelpetsSamplePreviewUnit[]) {
  return `units=${encodeURIComponent(encodeHelpetsSampleUnits(units))}`;
}

function HelpetsUnitsTable({ units }: { units: HelpetsSamplePreviewUnit[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-[1320px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Tag Reference</th>
              <th className="px-4 py-3">Public Code</th>
              <th className="px-4 py-3">Public URL</th>
              <th className="px-4 py-3">QR Content</th>
              <th className="px-4 py-3">NFC Content</th>
              <th className="px-4 py-3">Product Line</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Inventario</th>
              <th className="px-4 py-3">Batch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {units.map((unit) => (
              <tr key={unit.publicCode}>
                <td className="px-4 py-3">{unit.tagReference}</td>
                <td className="px-4 py-3 font-medium">{unit.publicCode}</td>
                <td className="px-4 py-3">{unit.publicUrl}</td>
                <td className="px-4 py-3">{unit.qrContent}</td>
                <td className="px-4 py-3">{unit.nfcContent}</td>
                <td className="px-4 py-3">{unit.productLine}</td>
                <td className="px-4 py-3">{unit.profileType}</td>
                <td className="px-4 py-3">{unit.deviceType}</td>
                <td className="px-4 py-3">{unit.initialState}</td>
                <td className="px-4 py-3">{unit.inventoryInitialState}</td>
                <td className="px-4 py-3">{unit.batchReference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HelpetsArtifactLinks({ units }: { units: HelpetsSamplePreviewUnit[] }) {
  const exportQuery = artifactQuery(units);
  return (
    <>
      <ButtonLink
        prefetch={false}
        href={`/api/admin/production/helpets-sample-preview/simple-package.zip?${exportQuery}`}
        variant="secondary"
      >
        Descargar preview
      </ButtonLink>
      <ButtonLink
        prefetch={false}
        href={`/api/admin/production/helpets-sample-preview/01-helpets-5-urls.xlsx?${exportQuery}`}
        variant="secondary"
      >
        Excel 5 URLs
      </ButtonLink>
      <ButtonLink
        prefetch={false}
        href={`/api/admin/production/helpets-sample-preview/02-helpets-5-urls.csv?${exportQuery}`}
        variant="secondary"
      >
        CSV 5 URLs
      </ButtonLink>
      <ButtonLink
        prefetch={false}
        href={`/api/admin/production/helpets-sample-preview/internal-package.zip?${exportQuery}`}
        variant="secondary"
      >
        ZIP interno
      </ButtonLink>
      <ButtonLink
        prefetch={false}
        href={`/api/admin/production/helpets-sample-preview/09-message-to-leanne.txt?${exportQuery}`}
        variant="secondary"
      >
        Mensaje Leanne
      </ButtonLink>
    </>
  );
}

export default async function HelpetsSamplePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; rid?: string }>;
}) {
  const query = await searchParams;
  const errorMessage = confirmationMessage(query.error);
  const confirmedBatch = await getConfirmedHelpetsSampleBatch();

  if (confirmedBatch) {
    return (
      <div className="grid gap-5">
        <header>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
            Volver a produccion
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE Helpets</h1>
          <p className="mt-1 text-sm text-neutral-600">
            El lote Helpets SAMPLE ya fue confirmado. Estos son los cinco dispositivos persistidos.
          </p>
        </header>

        {errorMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {errorMessage}
            {query.rid ? <span className="block text-xs text-amber-800">Codigo diagnostico: {query.rid}</span> : null}
          </p>
        ) : null}

        <Card className="border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div className="grid gap-1">
              <p className="text-sm font-medium text-emerald-900">{HELPETS_SAMPLE_BATCH_REFERENCE} ya esta confirmado.</p>
              <p className="text-sm text-emerald-800">No se debe volver a confirmar ni regenerar este lote.</p>
            </div>
          </div>
        </Card>

        <HelpetsUnitsTable units={confirmedBatch.units} />

        <div className="flex flex-wrap gap-2">
          <HelpetsArtifactLinks units={confirmedBatch.units} />
          <ButtonLink href={`/admin/production/${confirmedBatch.id}`}>Ver lote confirmado</ButtonLink>
          <ButtonLink href="/admin/production" variant="ghost">
            Volver a produccion
          </ButtonLink>
        </div>
      </div>
    );
  }

  const preview = await buildHelpetsSamplePreview().catch((error: unknown) => ({
    error: error instanceof Error ? error.message : "No se pudo generar la preview Helpets.",
  }));

  if ("error" in preview) {
    return (
      <div className="grid gap-5">
        <header>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
            Volver a produccion
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE Helpets</h1>
        </header>
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-red-700" />
            <div className="grid gap-2">
              <p className="text-sm font-medium text-red-900">No se pudieron generar candidatos Helpets.</p>
              <p className="text-sm text-red-800">{preview.error}</p>
            </div>
          </div>
        </Card>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/production/helpets-sample-preview?regen=1" variant="secondary">
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

  const encodedUnits = encodeHelpetsSampleUnits(preview.units);
  const hasCandidates = preview.units.length > 0;

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
          Volver a produccion
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE Helpets</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Previsualiza cinco placas PET_TAG permanentes antes de confirmar el lote real.
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
          {query.rid ? <span className="block text-xs text-red-700">Codigo diagnostico: {query.rid}</span> : null}
        </p>
      ) : null}

      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-amber-700" />
          <p className="text-sm font-medium text-amber-900">
            Estos codigos seran identificadores fisicos permanentes si se confirman. No se deben mezclar con
            SAMPLE-HELPLIS-001 ni enviar a Leanne sin aprobacion manual.
          </p>
        </div>
      </Card>

      <Card className="grid gap-4">
        <CardHeader>
          <CardTitle>{preview.internalReference}</CardTitle>
          <CardDescription>
            Cantidad: {preview.quantity} - Linea: {preview.productLine} - Tipo: {preview.deviceType} - Perfil:{" "}
            {preview.profileType} - Estado inicial: UNACTIVATED
          </CardDescription>
        </CardHeader>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-neutral-500">Candidatos</p>
            <p className="font-medium">{preview.units.length}</p>
          </div>
          <div>
            <p className="text-neutral-500">Dominio</p>
            <p className="font-medium">{preview.domain}</p>
          </div>
          <div>
            <p className="text-neutral-500">QR/NFC</p>
            <p className="font-medium">Misma URL permanente</p>
          </div>
          <div>
            <p className="text-neutral-500">Credencial interna</p>
            <p className="font-medium">No incluida</p>
          </div>
          <div>
            <p className="text-neutral-500">UID NFC</p>
            <p className="font-medium">Captura fisica posterior</p>
          </div>
        </div>
      </Card>

      {hasCandidates ? (
        <HelpetsUnitsTable units={preview.units} />
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-amber-700" />
            <div className="grid gap-2">
              <p className="text-sm font-medium text-amber-900">No hay candidatos Helpets para mostrar.</p>
              <p className="text-sm text-amber-800">Vuelve a generar la preview antes de confirmar el lote.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/production/helpets-sample-preview?regen=1" variant="secondary">
          <RefreshCcw aria-hidden className="h-4 w-4" />
          Regenerar candidatos
        </ButtonLink>
        <HelpetsArtifactLinks units={preview.units} />
        <ButtonLink href="/admin/production" variant="ghost">
          Cancelar
        </ButtonLink>
        <form action={confirmHelpetsSamplePreviewBatchAction} className="grid max-w-xl gap-2">
          <input type="hidden" name="encodedUnits" value={encodedUnits} />
          <CheckboxField
            name="confirmIrreversible"
            label="Confirmo que estos 5 codigos Helpets seran identificadores fisicos permanentes y no se reutilizaran."
          />
          <Button type="submit" variant="danger">
            Confirmar lote Helpets
          </Button>
        </form>
      </div>
    </div>
  );
}
