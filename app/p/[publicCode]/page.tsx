import type { ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  HeartPulse,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-logo";
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
    return <PublicState title="Codigo no valido" description="No encontramos una ficha publica para este codigo." />;
  }

  if (result.status === "NOT_ACTIVATED") {
    return (
      <PublicState
        title="Esta pulsera todavia no ha sido activada."
        description="El codigo publico no basta para apropiarse de un dispositivo. Para activarlo se requiere el codigo secreto incluido en el empaque."
        actionHref={`/activate/${result.publicCode}`}
        actionLabel="Activar esta HelPlis"
      />
    );
  }

  if (result.status === "UNAVAILABLE") {
    const isSuspended = result.activationState === "SUSPENDED";
    return (
      <PublicState
        title={
          isSuspended
            ? "Esta HelPlis no se encuentra disponible temporalmente."
            : "Esta HelPlis no se encuentra disponible."
        }
        description="No podemos mostrar informacion personal de esta HelPlis."
        actionHref={isSuspended ? "/support" : undefined}
        actionLabel={isSuspended ? "Contactar soporte" : undefined}
      />
    );
  }

  const statusCopy =
    result.status === "LOST"
      ? "Modo perdido"
      : result.status === "FOUND"
        ? "Marcado como encontrado"
        : "Ficha activa";
  const urgentItems = buildUrgentItems(result.profile);
  const additionalItems = buildAdditionalItems(result.profile);

  return (
    <main className="min-h-screen bg-[var(--brand-background)] px-4 py-5 text-[var(--brand-text)]">
      <div className="mx-auto grid max-w-2xl gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-muted)]">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Volver
        </Link>

        <article className="overflow-hidden rounded-md border border-[var(--brand-border)] bg-white shadow-sm">
          <header className="grid gap-5 bg-[#f8fbfe] p-5">
            <div className="flex items-start justify-between gap-3">
              <Badge tone={statusTone(result.deviceStatus)}>{statusCopy}</Badge>
              <div className="rounded-md border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
                {result.publicCode}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ProfilePhoto name={result.profile.displayName} src={result.profile.photoUrl} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--brand-muted)]">{result.profile.typeLabel}</p>
                <h1 className="text-3xl font-semibold leading-tight">{result.profile.displayName}</h1>
                {result.profile.headline ? (
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">{result.profile.headline}</p>
                ) : null}
              </div>
            </div>

            <div className={result.status === "LOST" ? "rounded-md border border-amber-200 bg-amber-50 p-4" : ""}>
              <p className="text-base leading-7">
                {result.status === "LOST" && result.profile.lostMessage
                  ? result.profile.lostMessage
                  : result.profile.helpMessage}
              </p>
              {result.profile.statusMessage ? (
                <p className="mt-2 text-sm text-[var(--brand-muted)]">{result.profile.statusMessage}</p>
              ) : null}
            </div>
          </header>

          <div className="grid gap-5 p-5">
            <PublicActions
              scanId={result.scanId}
              publicCode={result.publicCode}
              contacts={result.contacts}
              showLocationButton={result.profile.showLocationButton}
              allowFoundReport={result.profile.allowFoundReport}
            />

            {result.profile.criticalInformation ? (
              <PublicSection icon={<HeartPulse aria-hidden className="h-4 w-4" />} title="Informacion importante">
                <p className="rounded-md border border-[#b9ece8] bg-[#f8fbfe] p-3 text-sm leading-6 text-[var(--brand-muted)]">
                  {result.profile.criticalInformation}
                </p>
              </PublicSection>
            ) : null}

            {!result.profile.criticalInformation && urgentItems.length ? (
              <PublicSection icon={<HeartPulse aria-hidden className="h-4 w-4" />} title="Informacion importante">
                <InfoList items={urgentItems} />
              </PublicSection>
            ) : null}

            {result.contacts.length ? (
              <PublicSection icon={<UserRound aria-hidden className="h-4 w-4" />} title="Contactos">
                <div className="grid gap-3">
                  {result.contacts.map((contact) => (
                    <div key={contact.id} className="border-t border-[var(--brand-border)] pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{contact.name ?? `Contacto ${contact.priority}`}</p>
                          {contact.relationship ? (
                            <p className="text-sm text-[var(--brand-muted)]">{contact.relationship}</p>
                          ) : null}
                        </div>
                        <Badge>#{contact.priority}</Badge>
                      </div>
                      {contact.availabilityNotes ? (
                        <p className="mt-2 text-sm text-[var(--brand-muted)]">{contact.availabilityNotes}</p>
                      ) : null}
                      {contact.phone ? <p className="mt-2 text-sm text-[var(--brand-muted)]">{contact.phone}</p> : null}
                    </div>
                  ))}
                </div>
              </PublicSection>
            ) : null}

            {additionalItems.length ? (
              <PublicSection icon={<MapPin aria-hidden className="h-4 w-4" />} title="Informacion adicional">
                <InfoList items={additionalItems} />
              </PublicSection>
            ) : null}

            <section className="grid gap-3 rounded-md bg-[#f8fbfe] p-4 text-xs leading-5 text-[var(--brand-muted)]">
              <p>
                <ShieldCheck aria-hidden className="mr-1 inline h-3.5 w-3.5 text-[var(--brand-accent)]" />
                Solo se muestra informacion autorizada por el responsable de este HelPlis.
              </p>
              <p>La ubicacion del responsable nunca se muestra. Tu ubicacion solo se envia si decides compartirla.</p>
              <div className="flex items-center gap-2">
                <BrandMark className="h-7" />
                <span>HelPlis - Conecta. Informa. Reencuentra.</span>
              </div>
            </section>
          </div>
        </article>
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
    <main className="brand-gradient grid min-h-screen place-items-center px-4 py-8">
      <Card className="grid max-w-md gap-4 p-5">
        <BrandMark className="h-12" />
        <AlertTriangle aria-hidden className="h-8 w-8 text-[var(--brand-warning)]" />
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">{description}</p>
        </div>
        <div className="grid gap-3">
          {actionHref && actionLabel ? <ButtonLink href={actionHref}>{actionLabel}</ButtonLink> : null}
          <ButtonLink href="/support" variant="secondary">
            Soporte
          </ButtonLink>
          <p className="text-xs text-[var(--brand-muted)]">
            {OFFICIAL_CONTACT.email} - {OFFICIAL_CONTACT.phoneDisplay}
          </p>
        </div>
      </Card>
    </main>
  );
}

function ProfilePhoto({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-20 w-20 shrink-0 rounded-full border border-[var(--brand-border)] object-cover" />
    );
  }

  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)] text-2xl font-semibold text-white">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function PublicSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--brand-border)] pt-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1">
          <dt className="font-medium text-[var(--brand-text)]">{item.label}</dt>
          <dd className="leading-6 text-[var(--brand-muted)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function buildUrgentItems(profile: {
  criticalInformation: string | null;
  bloodType: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  medications: string | null;
  medicalInstructions: string | null;
  emergencyInstructions: string | null;
  communicationNotes: string | null;
  mobilityNotes: string | null;
  sensoryNotes: string | null;
}) {
  return [
    { label: "Grupo sanguineo", value: profile.bloodType },
    { label: "Alergias", value: profile.allergies },
    { label: "Condiciones", value: profile.medicalConditions },
    { label: "Medicamentos", value: profile.medications },
    { label: "Instrucciones medicas", value: profile.medicalInstructions },
    { label: "Emergencia", value: profile.emergencyInstructions },
    { label: "Comunicacion", value: profile.communicationNotes },
    { label: "Movilidad", value: profile.mobilityNotes },
    { label: "Sensorial", value: profile.sensoryNotes },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function buildAdditionalItems(profile: {
  age: number | null;
  commune: string | null;
  generalArea: string | null;
  exactAddress: string | null;
  description: string | null;
}) {
  return [
    { label: "Edad aproximada", value: profile.age ? `${profile.age} anos` : null },
    { label: "Comuna", value: profile.commune },
    { label: "Sector", value: profile.generalArea },
    { label: "Direccion autorizada", value: profile.exactAddress },
    { label: "Descripcion", value: profile.description },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}
