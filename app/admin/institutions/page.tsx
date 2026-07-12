import { InstitutionLeadStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/field";
import { updateInstitutionLeadStatusAction } from "@/features/institutions/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminInstitutionsPage() {
  const leads = await prisma.institutionLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Instituciones</h1>
        <p className="mt-1 text-sm text-neutral-600">Solicitudes, pilotos y seguimiento institucional.</p>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Institucion</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Interes</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Actualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="px-4 py-3 font-medium">{lead.institutionName}<br /><span className="text-xs text-neutral-500">{lead.type}</span></td>
                  <td className="px-4 py-3">{lead.contactName}<br /><span className="text-xs text-neutral-500">{lead.phone} · {lead.email}</span></td>
                  <td className="px-4 py-3">{lead.region} · {lead.comuna}</td>
                  <td className="px-4 py-3">{lead.estimatedQuantity}</td>
                  <td className="px-4 py-3">{lead.interest}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(lead.status)}>{lead.status}</Badge></td>
                  <td className="px-4 py-3">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <form action={updateInstitutionLeadStatusAction} className="grid min-w-56 gap-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <Field label="Estado">
                        <Select name="status" defaultValue={lead.status}>
                          {Object.values(InstitutionLeadStatus).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Nota">
                        <Textarea name="notes" defaultValue={lead.notes ?? ""} className="min-h-20" />
                      </Field>
                      <Button type="submit" variant="secondary">Guardar</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!leads.length ? <p className="p-4 text-sm text-neutral-600">No hay solicitudes institucionales.</p> : null}
      </Card>
    </div>
  );
}
