import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminMimeTasksPage() {
  const now = new Date();
  const [upcoming, overdue, unreviewed, emailReview, contacts, scrapeErrors] = await Promise.all([
    prisma.organization.findMany({
      where: { establishmentId: { not: null }, nextActionAt: { gte: now } },
      include: { establishment: true },
      orderBy: { nextActionAt: "asc" },
      take: 20,
    }),
    prisma.organization.findMany({
      where: { establishmentId: { not: null }, nextActionAt: { lt: now } },
      include: { establishment: true },
      orderBy: { nextActionAt: "asc" },
      take: 20,
    }),
    prisma.organization.findMany({
      where: { establishmentId: { not: null }, commercialStatus: "SIN_REVISAR" },
      include: { establishment: true },
      orderBy: { priority: "desc" },
      take: 20,
    }),
    prisma.contact.findMany({
      where: { emailStatus: { in: ["INVALID_FORMAT", "UNKNOWN", "SHARED"] } },
      include: { establishment: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.contact.findMany({
      where: { email: { not: null } },
      select: { email: true, establishment: { select: { id: true, rbd: true, name: true } } },
      take: 500,
    }),
    prisma.scrapeAttempt.findMany({
      where: { status: { in: ["FAILED", "BLOCKED", "NOT_FOUND"] } },
      orderBy: { finishedAt: "desc" },
      take: 20,
    }),
  ]);

  const duplicateEmails = [...contacts.reduce((map, contact) => {
    if (!contact.email) return map;
    const list = map.get(contact.email) ?? [];
    list.push(contact);
    map.set(contact.email, list);
    return map;
  }, new Map<string, typeof contacts>()).entries()].filter(([, list]) => list.length > 1);

  const sections = [
    { title: "Próximos seguimientos", items: upcoming, empty: "Sin seguimientos programados." },
    { title: "Contactos atrasados", items: overdue, empty: "Sin atrasos." },
    { title: "Registros sin revisar", items: unreviewed, empty: "Sin registros pendientes." },
  ];

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cola de tareas MIME</h1>
          <p className="mt-1 text-sm text-neutral-600">Trabajo operativo sin automatizar campañas masivas.</p>
        </div>
        <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/pipeline">
          Pipeline
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="font-semibold">{section.title}</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {section.items.map((organization) => (
                <Link key={organization.id} className="rounded-md border border-[var(--brand-border)] p-2 hover:bg-[#edf8fb]" href={`/admin/mime/establishments/${organization.establishmentId}`}>
                  <strong>{organization.name}</strong>
                  <p className="text-neutral-600">Score {organization.prospectScore} · {formatDate(organization.nextActionAt)}</p>
                </Link>
              ))}
              {!section.items.length ? <p className="text-neutral-600">{section.empty}</p> : null}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Correos por validar</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {emailReview.map((contact) => (
              <Link key={contact.id} className="rounded-md border border-[var(--brand-border)] p-2 hover:bg-[#edf8fb]" href={`/admin/mime/establishments/${contact.establishmentId}`}>
                <Badge tone={statusTone(contact.emailStatus)}>{contact.emailStatus}</Badge>
                <p className="mt-1">{contact.email ?? "Sin correo"} · {contact.establishment?.name ?? "Sin establecimiento"}</p>
              </Link>
            ))}
            {!emailReview.length ? <p className="text-sm text-neutral-600">Sin correos pendientes.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Duplicados potenciales</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {duplicateEmails.slice(0, 20).map(([email, list]) => (
              <div key={email} className="rounded-md border border-[var(--brand-border)] p-2">
                <strong>{email}</strong>
                <p className="text-neutral-600">{list.length} establecimientos comparten el correo.</p>
              </div>
            ))}
            {!duplicateEmails.length ? <p className="text-sm text-neutral-600">Sin duplicados visibles.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Errores de scraping</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {scrapeErrors.map((attempt) => (
              <div key={attempt.id} className="rounded-md border border-[var(--brand-border)] p-2">
                <Badge tone={statusTone(attempt.status)}>{attempt.status}</Badge>
                <p className="mt-1 text-neutral-600">
                  RBD {attempt.rbd} · HTTP {attempt.httpStatus ?? "sin código"} · {attempt.errorType ?? "sin tipo"}
                </p>
              </div>
            ))}
            {!scrapeErrors.length ? <p className="text-sm text-neutral-600">Sin errores registrados.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
