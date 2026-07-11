import { headers } from "next/headers";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, HeartPulse, Info, ShieldCheck } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { resolvePublicProfile } from "@/server/services/public-profile";
import { PublicActions } from "./public-actions";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  const headerStore = await headers();
  const result = await resolvePublicProfile({
    publicCode,
    method: headerStore.get("x-helplis-scan-method") === "NFC" ? "NFC" : "QR",
    ip: headerStore.get("x-forwarded-for"),
    userAgent: headerStore.get("user-agent"),
    referrer: headerStore.get("referer"),
  });

  if (result.status === "INVALID_CODE") {
    return (
      <PublicState title="Código no válido" description="No encontramos una ficha pública para este código." />
    );
  }

  if (result.status === "NOT_ACTIVATED") {
    return (
      <PublicState
        title="Esta pulsera todavía no ha sido activada."
        description="El código público no basta para apropiarse de un dispositivo. Para activarlo se requiere el código secreto incluido en el empaque."
        actionHref={`/activate/${result.publicCode}`}
        actionLabel="Iniciar activación"
      />
    );
  }

  if (result.status === "UNAVAILABLE") {
    return (
      <PublicState
        title="Ficha no disponible"
        description={`El dispositivo está en estado ${result.deviceStatus}. Contacta soporte si necesitas ayuda.`}
        actionHref="/support"
        actionLabel="Contactar soporte"
      />
    );
  }

  const statusCopy =
    result.status === "LOST"
      ? "Este elemento fue marcado como perdido."
      : result.status === "FOUND"
        ? "Este elemento fue marcado como encontrado."
        : "Ficha activa.";

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-5">
      <div className="mx-auto grid max-w-xl gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Volver
        </Link>
        <Card className="grid gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone={statusTone(result.deviceStatus)}>{statusCopy}</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-950">{result.profile.displayName}</h1>
              <p className="mt-1 text-sm text-neutral-600">{result.profile.type} · {result.productType}</p>
            </div>
            <div className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700">
              {result.publicCode}
            </div>
          </div>

          {result.profile.lostMessage || result.status === "LOST" ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <strong>Modo perdido:</strong> {result.profile.lostMessage ?? "Contacta al responsable registrado."}
            </div>
          ) : null}

          <InfoBlock icon={<Info aria-hidden className="h-4 w-4" />} title="Información autorizada">
            {result.profile.description ? <p>{result.profile.description}</p> : null}
            {result.profile.objectDescription ? <p>{result.profile.objectDescription}</p> : null}
            {result.profile.species ? (
              <p>
                {result.profile.species}
                {result.profile.breed ? ` · ${result.profile.breed}` : ""}
                {result.profile.color ? ` · ${result.profile.color}` : ""}
              </p>
            ) : null}
            {result.profile.age ? <p>Edad aproximada: {result.profile.age}</p> : null}
            {result.profile.specialInstructions ? <p>{result.profile.specialInstructions}</p> : null}
          </InfoBlock>

          {result.profile.medicalNotes || result.profile.allergies || result.profile.medications || result.profile.bloodType ? (
            <InfoBlock icon={<HeartPulse aria-hidden className="h-4 w-4" />} title="Información médica autorizada">
              {result.profile.medicalNotes ? <p>{result.profile.medicalNotes}</p> : null}
              {result.profile.allergies ? <p>Alergias: {result.profile.allergies}</p> : null}
              {result.profile.medications ? <p>Medicamentos: {result.profile.medications}</p> : null}
              {result.profile.bloodType ? <p>Grupo sanguíneo: {result.profile.bloodType}</p> : null}
            </InfoBlock>
          ) : null}

          {result.contacts.length ? (
            <InfoBlock title="Contactos visibles">
              <div className="grid gap-2">
                {result.contacts.map((contact) => (
                  <div key={contact.id} className="rounded-md border border-neutral-200 p-3 text-sm">
                    <div className="font-medium">{contact.name ?? "Contacto autorizado"}</div>
                    {contact.relationship ? <div className="text-neutral-600">{contact.relationship}</div> : null}
                    {contact.phone ? <div className="text-neutral-600">{contact.phone}</div> : null}
                  </div>
                ))}
              </div>
            </InfoBlock>
          ) : null}

          <PublicActions
            scanId={result.scanId}
            publicCode={result.publicCode}
            contacts={result.contacts}
            showLocationButton={result.profile.showLocationButton}
          />

          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
            <ShieldCheck aria-hidden className="mr-1 inline h-3.5 w-3.5" />
            Tu ubicación solo se enviará si aceptas compartirla. HelPlis no revela la ubicación del propietario ni datos no autorizados.
          </div>
        </Card>
      </div>
    </main>
  );
}

function PublicState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <Card className="max-w-md">
        <AlertTriangle aria-hidden className="mb-4 h-8 w-8 text-neutral-700" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
        <div className="mt-5 grid gap-3">
          {actionHref && actionLabel ? <ButtonLink href={actionHref}>{actionLabel}</ButtonLink> : null}
          <ButtonLink href="/support" variant="secondary">
            Soporte
          </ButtonLink>
          <p className="text-xs text-neutral-500">
            {OFFICIAL_CONTACT.email} · {OFFICIAL_CONTACT.phoneDisplay}
          </p>
        </div>
      </Card>
    </main>
  );
}

function InfoBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-neutral-200 p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">
        {icon}
        {title}
      </h2>
      <div className="grid gap-1 text-sm leading-6 text-neutral-700">{children}</div>
    </section>
  );
}
