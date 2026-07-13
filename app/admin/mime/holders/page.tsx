import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getEmailDomain } from "@/server/mime/normalization";
import { prisma } from "@/server/db/client";

export default async function AdminMimeHoldersPage() {
  const holders = await prisma.holder.findMany({
    include: {
      establishments: {
        select: { id: true, rbd: true, name: true, totalEnrollment: true, contactEmail: true, website: true },
        orderBy: { rbd: "asc" },
        take: 50,
      },
      contacts: { select: { email: true, phone: true, doNotContact: true } },
      _count: { select: { establishments: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sostenedores</h1>
          <p className="mt-1 text-sm text-neutral-600">Agrupación para evitar contactos repetidos y priorizar redes.</p>
        </div>
        <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime">
          Volver a MIME
        </Link>
      </header>

      <div className="grid gap-4">
        {holders.map((holder) => {
          const emails = [
            ...new Set([
              ...holder.contacts.flatMap((contact) => (contact.email ? [contact.email] : [])),
              ...holder.establishments.flatMap((establishment) => (establishment.contactEmail ? [establishment.contactEmail] : [])),
            ]),
          ];
          const domains = [...new Set(emails.flatMap((email) => (getEmailDomain(email) ? [getEmailDomain(email)!] : [])))];
          const enrollment = holder.establishments.reduce((total, establishment) => total + (establishment.totalEnrollment ?? 0), 0);
          return (
            <Card key={holder.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div>
                  <h2 className="font-semibold">{holder.originalName}</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {holder._count.establishments} establecimientos · matrícula visible {enrollment.toLocaleString("es-CL")}
                  </p>
                  <div className="mt-3 grid gap-1 text-sm">
                    {holder.establishments.slice(0, 8).map((establishment) => (
                      <Link key={establishment.id} className="text-[var(--brand-primary-dark)] underline" href={`/admin/mime/establishments/${establishment.id}`}>
                        RBD {establishment.rbd} · {establishment.name ?? "Sin nombre"}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-neutral-500">Correos compartidos</div>
                    <div className="mt-1">{emails.join(", ") || "Sin correos"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-neutral-500">Dominios</div>
                    <div className="mt-1">{domains.join(", ") || "Sin dominios"}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!holders.length ? <Card>No hay sostenedores creados todavía.</Card> : null}
      </div>
    </div>
  );
}
