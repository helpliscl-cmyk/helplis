import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createProfileAction, deleteProfilePhotoAction, updateProfilePhotoAction } from "@/features/profiles/actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

const profileTypes = [
  ["CHILD", "Nino o nina"],
  ["SENIOR", "Adulto mayor"],
  ["DEPENDENT_PERSON", "Persona que requiere asistencia"],
  ["MEDICAL_PROFILE", "Persona con dificultad para comunicarse"],
  ["PERSON", "Persona"],
] as const;

export default async function DashboardProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; photo?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const profiles = await prisma.profile.findMany({
    where: { ownerId: user.id, deletedAt: null },
    include: { _count: { select: { contacts: true, devices: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Perfiles</h1>
        <p className="mt-1 text-sm text-neutral-600">Crea y revisa perfiles de personas.</p>
      </header>
      {query.photo ? (
        <p className="rounded-md border border-[#b9ece8] bg-[#f8fbfe] p-3 text-sm text-[var(--brand-primary-dark)]">
          Foto actualizada. La ficha publica respeta la configuracion de privacidad.
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No se pudo procesar la foto. Usa JPG, PNG o WebP de maximo 5 MB.
        </p>
      ) : null}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear perfil</h2>
        <form action={createProfileAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select name="type">
                {profileTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre visible">
              <Input name="displayName" required />
            </Field>
          </div>
          <Field label="Mensaje de ayuda">
            <Textarea name="helpMessage" placeholder="Texto breve para orientar a quien escanee." />
          </Field>
          <Field label="Informacion critica opcional">
            <Textarea
              name="criticalInformation"
              placeholder="Ej.: puede desorientarse, tiene dificultad para comunicarse o necesita permanecer acompanado."
            />
          </Field>
          <Button type="submit">Guardar perfil</Button>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{profile.displayName}</h2>
                <p className="text-sm text-neutral-600">{profile.criticalInformation ? "Con informacion critica" : "Sin informacion critica"}</p>
              </div>
              <Badge>{profile.type}</Badge>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              {profile._count.devices} dispositivos - {profile._count.contacts} contactos
            </p>
            <div className="mt-4 grid gap-3 border-t border-[var(--brand-border)] pt-4">
              <div className="text-xs text-neutral-600">
                {profile.photoStoragePath
                  ? `Foto privada: ${profile.photoWidth ?? "-"}x${profile.photoHeight ?? "-"} px, ${profile.photoSizeBytes ?? 0} bytes`
                  : "Sin foto almacenada."}
              </div>
              <form action={updateProfilePhotoAction} className="grid gap-3">
                <input type="hidden" name="profileId" value={profile.id} />
                <Field label={profile.photoStoragePath ? "Reemplazar foto" : "Subir foto"}>
                  <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
                </Field>
                <Button type="submit" variant="secondary">
                  {profile.photoStoragePath ? "Reemplazar" : "Subir"}
                </Button>
              </form>
              {profile.photoStoragePath ? (
                <form action={deleteProfilePhotoAction}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <Button type="submit" variant="ghost">
                    Eliminar foto
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
