import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select } from "@/components/ui/field";
import { createContactAction } from "@/features/profiles/actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

export default async function DashboardContactsPage() {
  const user = await requireUser();
  const profiles = await prisma.profile.findMany({
    where: { ownerId: user.id },
    include: { contacts: { orderBy: { priority: "asc" } } },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Contactos</h1>
        <p className="mt-1 text-sm text-neutral-600">Contactos visibles según privacidad del perfil.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Agregar contacto</h2>
        <form action={createContactAction} className="grid gap-4">
          <Field label="Perfil">
            <Select name="profileId" required>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.displayName}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input name="name" required />
            </Field>
            <Field label="Relación">
              <Input name="relationship" />
            </Field>
            <Field label="Teléfono">
              <Input name="phone" type="tel" required />
            </Field>
            <Field label="Correo">
              <Input name="email" type="email" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <CheckboxField name="callEnabled" label="Permitir llamada" defaultChecked />
            <CheckboxField name="whatsappEnabled" label="Permitir WhatsApp" defaultChecked />
            <CheckboxField name="messageEnabled" label="Permitir mensaje" defaultChecked />
          </div>
          <Button type="submit">Agregar contacto</Button>
        </form>
      </Card>
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <h2 className="font-semibold">{profile.displayName}</h2>
            <div className="mt-3 grid gap-2">
              {profile.contacts.map((contact) => (
                <div key={contact.id} className="rounded-md border border-neutral-200 p-3 text-sm">
                  <strong>{contact.name}</strong>
                  <div className="text-neutral-600">{contact.relationship ?? "Contacto"}</div>
                  <div className="text-neutral-600">{contact.phone}</div>
                </div>
              ))}
              {!profile.contacts.length ? <p className="text-sm text-neutral-500">Sin contactos.</p> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
