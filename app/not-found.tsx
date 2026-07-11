import { AlertTriangle } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="brand-gradient grid min-h-screen place-items-center px-4 py-8">
      <Card className="grid max-w-md gap-4 p-5 text-center">
        <div className="flex justify-center">
          <BrandLogo className="h-11" />
        </div>
        <AlertTriangle aria-hidden className="mx-auto h-8 w-8 text-[var(--brand-warning)]" />
        <div>
          <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            Revisa el enlace o vuelve al inicio para activar una pulsera, abrir una ficha o contactar soporte.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ButtonLink href="/" variant="secondary">
            Inicio
          </ButtonLink>
          <ButtonLink href="/support">Soporte</ButtonLink>
        </div>
      </Card>
    </main>
  );
}
