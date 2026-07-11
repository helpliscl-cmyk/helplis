import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createProfileAction } from "@/features/profiles/actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

const profileTypes = [
  "PERSON",
  "CHILD",
  "SENIOR",
  "DEPENDENT_PERSON",
  "MEDICAL_PROFILE",
  "PET",
  "LUGGAGE",
  "OBJECT",
  "ASSET",
  "EMPLOYEE",
  "OTHER",
];

export default async function DashboardProfilesPage() {
  const user = await requireUser();
  const profiles = await prisma.profile.findMany({
    where: { ownerId: user.id, deletedAt: null },
    include: { _count: { select: { contacts: true, devices: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Perfiles</h1>
        <p className="mt-1 text-sm text-neutral-600">Crea y revisa perfiles configurables.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear perfil</h2>
        <form action={createProfileAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select name="type">
                {profileTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre visible">
              <Input name="displayName" required />
            </Field>
          </div>
          <Field label="Alias">
            <Input name="alias" />
          </Field>
          <Field label="Instrucciones">
            <Textarea name="specialInstructions" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Notas médicas">
              <Textarea name="medicalNotes" />
            </Field>
            <Field label="Alergias">
              <Textarea name="allergies" />
            </Field>
            <Field label="Medicamentos">
              <Textarea name="medications" />
            </Field>
          </div>
          <Button type="submit">Guardar perfil</Button>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{profile.displayName}</h2>
                <p className="text-sm text-neutral-600">{profile.alias ?? "Sin alias"}</p>
              </div>
              <Badge>{profile.type}</Badge>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              {profile._count.devices} dispositivos · {profile._count.contacts} contactos
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
