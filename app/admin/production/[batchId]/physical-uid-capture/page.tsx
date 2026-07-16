import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductType } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { captureHelpetsPhysicalUidAction } from "@/features/production/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

const errorMessages: Record<string, string> = {
  missing: "Selecciona una placa e ingresa el UID NFC leido fisicamente.",
  BATCH_NOT_FOUND: "El lote no existe o no es un lote Helpets PET_TAG.",
  DEVICE_NOT_FOUND: "El dispositivo no pertenece a este lote.",
  INVALID_UID: "El UID debe ser hexadecimal y tener entre 6 y 32 caracteres.",
  UID_ALREADY_ASSIGNED: "Ese UID NFC ya esta asociado a otro dispositivo.",
  unknown: "No se pudo registrar el UID fisico.",
};

function tagReference(sequence: number | null, index: number) {
  return `P-${String(sequence ?? index + 1).padStart(3, "0")}`;
}

export default async function HelpetsPhysicalUidCapturePage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ error?: string; captured?: string }>;
}) {
  const { batchId } = await params;
  const query = await searchParams;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      devices: {
        orderBy: { internalSequence: "asc" },
        select: {
          id: true,
          internalSequence: true,
          publicCode: true,
          publicUrl: true,
          nfcUid: true,
          verificationStatus: true,
          inventoryStatus: true,
        },
      },
      physicalVerifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { device: { select: { publicCode: true } } },
      },
    },
  });

  if (!batch) notFound();

  if (batch.productType !== ProductType.PET_TAG) {
    return (
      <div className="grid gap-5">
        <header>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/production/${batch.id}`}>
            Volver al lote
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Captura UID fisica</h1>
        </header>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">Esta vista esta habilitada solo para lotes Helpets PET_TAG.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/production/${batch.id}`}>
          Volver al lote
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Captura UID fisica Helpets</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Registra el UID NFC real despues de recibir cada placa. Esto no cambia el publicCode, QR ni URL.
        </p>
      </header>

      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessages[query.error] ?? errorMessages.unknown}
        </p>
      ) : null}

      {query.captured ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          UID registrado para {query.captured}.
        </p>
      ) : null}

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">{batch.internalReference}</h2>
          <p className="text-sm text-neutral-600">
            {batch.devices.length}/{batch.quantity} placas cargadas en el lote.
          </p>
        </div>
        <form action={captureHelpetsPhysicalUidAction} className="grid gap-4">
          <input type="hidden" name="batchId" value={batch.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tag Reference">
              <Select name="publicCode" required>
                {batch.devices.map((device, index) => (
                  <option key={device.id} value={device.publicCode}>
                    {tagReference(device.internalSequence, index)} - {device.publicCode}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="NFC UID leido">
              <Input name="nfcUid" placeholder="04A1B2C3D4E5F6" autoComplete="off" required />
            </Field>
          </div>
          <Button type="submit">Registrar UID fisico</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Placas del lote</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Public Code</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">UID NFC</th>
                <th className="px-4 py-3">Verificacion</th>
                <th className="px-4 py-3">Inventario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batch.devices.map((device, index) => (
                <tr key={device.id}>
                  <td className="px-4 py-3">{tagReference(device.internalSequence, index)}</td>
                  <td className="px-4 py-3 font-medium">{device.publicCode}</td>
                  <td className="px-4 py-3">{device.publicUrl}</td>
                  <td className="px-4 py-3">{device.nfcUid ?? "Pendiente"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.verificationStatus)}>{device.verificationStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.inventoryStatus)}>{device.inventoryStatus}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Ultimas capturas</h2>
        </div>
        {batch.physicalVerifications.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Public Code</th>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {batch.physicalVerifications.map((verification) => (
                  <tr key={verification.id}>
                    <td className="px-4 py-3 font-medium">{verification.device.publicCode}</td>
                    <td className="px-4 py-3">{verification.nfcUidObserved ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(verification.overallStatus)}>{verification.overallStatus}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(verification.verifiedAt ?? verification.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-sm text-neutral-600">Todavia no hay UID fisicos registrados.</p>
        )}
      </Card>
    </div>
  );
}
