import { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { updateSupportTicketAction } from "@/features/support/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminSupportPage() {
  const [tickets, messages, users] = await Promise.all([
    prisma.supportTicket.findMany({
      include: {
        order: { select: { orderNumber: true } },
        device: { select: { publicCode: true } },
        organization: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.supportMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN", "SUPPORT"] } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Soporte</h1>
        <p className="mt-1 text-sm text-neutral-600">Tickets vinculados a usuarios, pedidos, pulseras, lotes e instituciones.</p>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Vinculos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Actualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="mt-1 max-w-md text-neutral-600">{ticket.description}</p>
                  </td>
                  <td className="px-4 py-3">{ticket.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ticket.priority === "URGENT" ? "red" : ticket.priority === "HIGH" ? "amber" : "blue"}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p>{ticket.order?.orderNumber ?? "Sin pedido"}</p>
                    <p>{ticket.device?.publicCode ?? "Sin pulsera"}</p>
                    <p>{ticket.organization?.name ?? "Sin institucion"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(ticket.createdAt)}</td>
                  <td className="px-4 py-3">
                    <form action={updateSupportTicketAction} className="grid min-w-52 gap-2">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <Field label="Estado">
                        <Select name="status" defaultValue={ticket.status}>
                          {Object.values(SupportTicketStatus).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Prioridad">
                        <Select name="priority" defaultValue={ticket.priority}>
                          {Object.values(SupportTicketPriority).map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Asignado">
                        <Select name="assignedTo" defaultValue={ticket.assignee?.id ?? ""}>
                          <option value="">Sin asignar</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </Select>
                      </Field>
                      <Button type="submit" variant="secondary">Guardar</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!tickets.length ? <p className="p-4 text-sm text-neutral-600">No hay tickets.</p> : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Mensajes legacy</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {messages.map((message) => (
            <div key={message.id} className="p-4 text-sm">
              <p className="font-medium">{message.subject}</p>
              <p className="mt-1 text-neutral-600">{message.name} · {message.email} · {formatDate(message.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
