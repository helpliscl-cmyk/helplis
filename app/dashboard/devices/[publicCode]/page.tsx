import Link from "next/link";
import { ArrowLeft, Repeat2, ShieldCheck } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { reassignDeviceProfileAction } from "@/features/profiles/actions";
import { formatDate } from "@/lib/formatting/format";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { auditForbiddenDeviceManagementAttempt, getDeviceWithManagePermission } from "@/server/services/device-access";
import { getDeviceActivationState, scanStatusMessage } from "@/server/services/device-rules";

const profileTypes = [
  ["CHILD", "Nino o nina"],
  ["SENIOR", "Adulto mayor"],
  ["DEPENDENT_PERSON", "Persona que requiere asistencia"],
  ["MEDICAL_PROFILE", "Persona con dificultad para comunicarse"],
  ["PERSON", "Persona"],
] as const;

export default async function DashboardDeviceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ error?: string; reassigned?: string }>;
}) {
  const user = await requireUser();
  const [{ publicCode }, query] = await Promise.all([params, searchParams]);
  const device = await getDeviceWithManagePermission(user, publicCode);

  if (!device) {
    await auditForbiddenDeviceManagementAttempt(user, publicCode);
    return (
      <div className="grid gap-5">
        <Link href="/dashboard/devices" className="inline-flex items-center gap-2 text-sm text-neutral-600 underline">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Volver a dispositivos
        </Link>
        <Card className="grid gap-3 p-5">
          <CardHeader>
            <CardTitle>No tienes permisos para administrar esta HelPlis.</CardTitle>
            <CardDescription>No mostramos datos del propietario ni del responsable.</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/support">Contactar soporte</ButtonLink>
            <ButtonLink href="/dashboard/devices" variant="secondary">
              Mis dispositivos
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const profileOwnerId = device.ownerId ?? user.id;
  const assignableProfiles = await prisma.profile.findMany({
    where: {
      ownerId: profileOwnerId,
      deletedAt: null,
      ...(device.profileId ? { id: { not: device.profileId } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  const latestReassignment = await prisma.auditLog.findFirst({
    where: { entityType: "Device", entityId: device.id, action: "DEVICE_PROFILE_REASSIGNED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const activationState = getDeviceActivationState(device.status, { reassigned: Boolean(latestReassignment) });
  const canReassign = activationState === "ACTIVE" || activationState === "REASSIGNED";

  return (
    <div className="grid gap-5">
      <Link href="/dashboard/devices" className="inline-flex items-center gap-2 text-sm text-neutral-600 underline">
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Volver a dispositivos
      </Link>

      {query.reassigned ? (
        <p className="rounded-md border border-[#b9ece8] bg-[#f8fbfe] p-3 text-sm text-[var(--brand-primary-dark)]">
          Reasignacion guardada con auditoria. El QR, NFC y publicCode se conservaron.
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No fue posible completar la accion. Revisa permisos, estado, perfil y confirmacion.
        </p>
      ) : null}

      <Card className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-sm font-medium uppercase text-[var(--brand-muted)]">Administrar HelPlis</h1>
            <h2 className="mt-1 text-2xl font-semibold">{device.profile?.displayName ?? "Sin perfil vinculado"}</h2>
            <p className="mt-1 text-sm text-neutral-600">{device.publicCode}</p>
          </div>
          <Badge tone={statusTone(device.status)}>{scanStatusMessage(device.status)}</Badge>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Estado minimo</dt>
            <dd>{activationState}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Activacion</dt>
            <dd>{formatDate(device.activatedAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">UID NFC</dt>
            <dd>{device.nfcUid ?? "Sin UID"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Escaneos conservados</dt>
            <dd>{device._count.scanEvents}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Public code</dt>
            <dd>{device.publicCode}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">QR</dt>
            <dd>No cambia</dd>
          </div>
          <div>
            <dt className="text-neutral-500">NFC</dt>
            <dd>No cambia</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/p/${device.publicCode}`}>Ver perfil de ayuda</ButtonLink>
          <ButtonLink href="/dashboard/privacy" variant="secondary">
            Privacidad
          </ButtonLink>
        </div>
      </Card>

      <Card className="grid gap-4 p-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat2 aria-hidden className="h-5 w-5 text-[var(--brand-primary-dark)]" />
            Asignar a otra persona
          </CardTitle>
          <CardDescription>
            Esta accion cambia la persona vinculada a la ficha publica, conserva historial y no modifica publicCode, QR ni UID NFC.
          </CardDescription>
        </CardHeader>
        <p className="rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-3 text-sm text-[var(--brand-muted)]">
          Esta accion reemplazara la persona asociada a esta HelPlis. El historial se conservara.
        </p>

        {!canReassign ? (
          <p className="rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-3 text-sm text-[var(--brand-muted)]">
            Solo se puede reasignar una HelPlis en estado ACTIVE.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <form action={reassignDeviceProfileAction} className="grid gap-4 rounded-md border border-[var(--brand-border)] p-4">
              <input type="hidden" name="deviceId" value={device.id} />
              <input type="hidden" name="assignmentMode" value="existing" />
              <h2 className="font-semibold">Seleccionar perfil existente</h2>
              {assignableProfiles.length ? (
                <Field label="Perfil">
                  <Select name="profileId" required>
                    {assignableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <p className="text-sm leading-6 text-[var(--brand-muted)]">No tienes otro perfil disponible para seleccionar.</p>
              )}
              <CheckboxField
                name="confirmReassign"
                label="Confirmo que quiero reasignar esta HelPlis y desvincular el perfil anterior de la ficha publica."
              />
              <Field label="Motivo opcional">
                <Textarea name="reassignmentReason" maxLength={300} placeholder="Ej.: cambio de usuario responsable del uso diario." />
              </Field>
              <Button type="submit" disabled={!assignableProfiles.length}>
                <ShieldCheck aria-hidden className="h-4 w-4" />
                Asignar a perfil existente
              </Button>
            </form>

            <form action={reassignDeviceProfileAction} className="grid gap-4 rounded-md border border-[var(--brand-border)] p-4">
              <input type="hidden" name="deviceId" value={device.id} />
              <input type="hidden" name="assignmentMode" value="new" />
              <h2 className="font-semibold">Crear nuevo perfil</h2>
              <Field label="Tipo de apoyo">
                <Select name="type" defaultValue="PERSON" required>
                  {profileTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nombre visible">
                <Input name="displayName" required />
              </Field>
              <Field label="Mensaje de ayuda">
                <Textarea name="helpMessage" maxLength={500} placeholder="Opcional" />
              </Field>
              <Field label="Informacion critica">
                <Textarea name="criticalInformation" maxLength={700} placeholder="Opcional y oculta por defecto" />
              </Field>
              <CheckboxField
                name="confirmReassign"
                label="Confirmo que quiero reasignar esta HelPlis y desvincular el perfil anterior de la ficha publica."
              />
              <Field label="Motivo opcional">
                <Textarea name="reassignmentReason" maxLength={300} placeholder="Ej.: nueva persona que usara esta pulsera." />
              </Field>
              <Button type="submit">
                <ShieldCheck aria-hidden className="h-4 w-4" />
                Crear perfil y asignar
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
