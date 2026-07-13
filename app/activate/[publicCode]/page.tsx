import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validateActivationPublicCode } from "@/server/services/activation";
import { ActivationForm } from "../activation-form";

export default async function ActivatePublicCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ publicCode }, query] = await Promise.all([params, searchParams]);
  const normalizedCode = publicCode.toUpperCase();
  const validation = await validateActivationPublicCode(normalizedCode);

  if (validation.state === "INVALID") {
    return (
      <ActivationStatePage>
        <Card className="mx-auto grid max-w-xl gap-4 p-5">
          <CardHeader>
            <CardTitle>No pudimos identificar esta HelPlis.</CardTitle>
            <CardDescription>Revisa el QR, acerca nuevamente el NFC o ingresa el codigo manualmente.</CardDescription>
          </CardHeader>
          <ButtonLink href="/activate" variant="secondary">
            Reintentar escaneo
          </ButtonLink>
        </Card>
      </ActivationStatePage>
    );
  }

  if (validation.state === "ACTIVE" && validation.publicCode) {
    const publicProfileUrl =
      "publicProfileUrl" in validation && validation.publicProfileUrl
        ? validation.publicProfileUrl
        : `/p/${validation.publicCode}`;
    const managementUrl =
      "managementUrl" in validation && validation.managementUrl
        ? validation.managementUrl
        : `/dashboard/devices/${validation.publicCode}`;
    return (
      <ActivationStatePage>
        <Card className="mx-auto grid max-w-xl gap-4 p-5">
          <CardHeader>
            <CardTitle>Esta HelPlis ya está activada.</CardTitle>
            <CardDescription>
              Para proteger el perfil, no se puede reactivar, sobrescribir ni cambiar el responsable desde este flujo publico.
            </CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={publicProfileUrl}>Ver perfil de ayuda</ButtonLink>
            <ButtonLink href={managementUrl} variant="secondary">
              Administrar HelPlis
            </ButtonLink>
          </div>
        </Card>
      </ActivationStatePage>
    );
  }

  if ((validation.state === "SUSPENDED" || validation.state === "DISABLED") && validation.publicCode) {
    const isSuspended = validation.state === "SUSPENDED";
    return (
      <ActivationStatePage>
        <Card className="mx-auto grid max-w-xl gap-4 p-5">
          <CardHeader>
            <CardTitle>
              {isSuspended
                ? "Esta HelPlis no se encuentra disponible temporalmente."
                : "Esta HelPlis no se encuentra disponible."}
            </CardTitle>
            <CardDescription>No mostramos informacion personal cuando el dispositivo no esta disponible.</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {isSuspended ? <ButtonLink href="/support">Contactar soporte</ButtonLink> : null}
            <ButtonLink href="/" variant="secondary">
              Volver al inicio
            </ButtonLink>
          </div>
        </Card>
      </ActivationStatePage>
    );
  }

  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="flex justify-center">
          <BrandLogo priority className="h-12" />
        </div>
        <ActivationForm publicCode={normalizedCode} error={query.error} />
      </div>
    </main>
  );
}

function ActivationStatePage({ children }: { children: ReactNode }) {
  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="flex justify-center">
          <BrandLogo priority className="h-12" />
        </div>
        {children}
      </div>
    </main>
  );
}
