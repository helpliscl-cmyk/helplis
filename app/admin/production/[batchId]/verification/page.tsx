import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Textarea } from "@/components/ui/field";
import { recordPhysicalVerificationAction } from "@/features/production/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function PhysicalVerificationPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      devices: { select: { verificationStatus: true, inventoryStatus: true, nfcUid: true } },
      physicalVerifications: {
        include: { device: { select: { publicCode: true, publicUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!batch) notFound();

  const stats = {
    total: batch.quantity,
    correct: batch.devices.filter((device) => device.verificationStatus === "FULLY_VERIFIED").length,
    pending: batch.devices.filter((device) => device.verificationStatus === "PENDING").length,
    qrMismatch: batch.devices.filter((device) => device.verificationStatus === "QR_MISMATCH").length,
    nfcMismatch: batch.devices.filter((device) => device.verificationStatus === "NFC_MISMATCH").length,
    uidMismatch: batch.devices.filter((device) => device.verificationStatus === "UID_MISMATCH").length,
    damaged: batch.devices.filter((device) => device.verificationStatus === "DAMAGED").length,
    rejected: batch.devices.filter((device) => device.verificationStatus === "REJECTED").length,
    available: batch.devices.filter((device) => device.inventoryStatus === "AVAILABLE").length,
  };

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/production/${batch.id}`}>
            Volver al lote
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Verificacion fisica</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {batch.internalReference} · optimizado para revisar una unidad y continuar con la siguiente.
          </p>
        </div>
        <Link
          className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm"
          href={`/api/admin/production/${batch.id}/verification-report`}
        >
          Exportar reporte
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Correctas", stats.correct],
          ["Pendientes", stats.pending],
          ["QR mismatch", stats.qrMismatch],
          ["NFC mismatch", stats.nfcMismatch],
          ["UID mismatch", stats.uidMismatch],
          ["Danadas", stats.damaged],
          ["Rechazadas", stats.rejected],
          ["Disponibles", stats.available],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs uppercase text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Registrar unidad</h2>
        <form action={recordPhysicalVerificationAction} className="grid gap-4">
          <input type="hidden" name="batchId" value={batch.id} />
          <Field label="Public code">
            <Input name="publicCode" required autoComplete="off" placeholder="Ej: HLPABC123" />
          </Field>
          <Field label="QR observado">
            <Input name="qrObserved" inputMode="url" placeholder="https://helplis.cl/p/..." />
          </Field>
          <Field label="NFC observado">
            <Input name="nfcObserved" inputMode="url" placeholder="https://helplis.cl/p/..." />
          </Field>
          <Field label="UID NFC observado">
            <Input name="nfcUidObserved" autoComplete="off" placeholder="04AABBCCDD..." />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField name="damaged" label="La unidad tiene dano fisico." />
            <CheckboxField name="missing" label="La unidad falta o no se recibio." />
          </div>
          <Field label="Foto o evidencia opcional">
            <Input name="photoUrl" placeholder="URL interna o referencia de archivo" />
          </Field>
          <Field label="Notas">
            <Textarea name="notes" placeholder="Detalle del mismatch, dano o correccion solicitada." />
          </Field>
          <Button type="submit">Guardar y continuar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Ultimas verificaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[960px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Public code</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">QR</th>
                <th className="px-4 py-3">NFC</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Fisico</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batch.physicalVerifications.map((verification) => (
                <tr key={verification.id}>
                  <td className="px-4 py-3 font-medium">{verification.device.publicCode}</td>
                  <td className="px-4 py-3">{verification.device.publicUrl}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(verification.qrStatus)}>{verification.qrStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(verification.nfcStatus)}>{verification.nfcStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(verification.uidStatus)}>{verification.uidStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(verification.physicalStatus)}>{verification.physicalStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(verification.overallStatus)}>{verification.overallStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(verification.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!batch.physicalVerifications.length ? (
          <p className="p-4 text-sm text-neutral-600">Todavia no hay verificaciones registradas.</p>
        ) : null}
      </Card>
    </div>
  );
}
