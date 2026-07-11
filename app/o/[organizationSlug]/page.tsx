import { notFound } from "next/navigation";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function OrganizationLandingPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    include: { campaigns: { where: { status: "ACTIVE" } } },
  });
  if (!organization) notFound();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <Link href="/" className="text-sm text-neutral-600 underline">Volver</Link>
        <section className="grid gap-5 py-8">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Programa institucional provisional</p>
          <h1 className="text-4xl font-semibold">{organization.name}</h1>
          <p className="max-w-3xl text-lg leading-8 text-neutral-700">
            {organization.landingDescription ?? "Acceso institucional a activación de dispositivos HelPlis."}
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/activate">Activar dispositivo</ButtonLink>
            <ButtonLink href="/support" variant="secondary">Contactar</ButtonLink>
          </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="font-semibold">Beneficio</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{organization.landingTitle ?? "Convenio institucional demo."}</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Descuento</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{formatPercent(organization.discountPercentage)}</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Código</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{organization.discountCode ?? "Pendiente"}</p>
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold">Preguntas frecuentes</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-700">
            <p><strong>¿Hay pagos implementados?</strong><br />No. El proceso de compra queda documentado para integración futura.</p>
            <p><strong>¿La institución ve todos los datos?</strong><br />No. El modelo contempla acceso por rol y políticas RLS futuras.</p>
            <p><strong>¿Qué campañas están activas?</strong><br />{organization.campaigns.map((campaign) => campaign.name).join(", ") || "Sin campañas activas."}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
