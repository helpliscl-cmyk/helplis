import Link from "next/link";
import { Building2, ClipboardCheck, UsersRound } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InstitutionsLandingPage() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo className="h-10" />
          <Link href="/" className="text-sm font-medium text-[var(--brand-muted)] underline">
            Volver
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-[var(--brand-text)]">HelPlis para instituciones</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
              Pilotos y compras coordinadas para colegios, fundaciones, municipalidades y comunidades que necesitan identificar y contactar responsables de personas que requieren asistencia.
            </p>
            <div className="mt-6">
              <ButtonLink href="/instituciones/solicitar">Solicitar contacto</ButtonLink>
            </div>
          </div>
          <Card className="grid gap-4">
            {[
              [Building2, "Levantamiento", "Registramos institucion, comuna, cantidad estimada y fechas."],
              [ClipboardCheck, "Piloto controlado", "Preparamos lotes, codigos, activacion y soporte operativo."],
              [UsersRound, "Seguimiento", "Dejamos listos landing, campana, codigo y metricas sin publicar descuentos definitivos."],
            ].map(([Icon, title, text]) => (
              <div key={String(title)} className="flex gap-3">
                <Icon aria-hidden className="mt-1 h-5 w-5 text-[var(--brand-primary-dark)]" />
                <div>
                  <h2 className="font-semibold">{title as string}</h2>
                  <p className="text-sm leading-6 text-[var(--brand-muted)]">{text as string}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </main>
  );
}
