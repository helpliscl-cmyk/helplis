import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/field";
import { updatePrivacyAction } from "@/features/profiles/actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

export default async function DashboardPrivacyPage() {
  const user = await requireUser();
  const profiles = await prisma.profile.findMany({
    where: { ownerId: user.id },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Privacidad</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Decide que acciones e informacion simple vera quien escanee tu pulsera.
        </p>
      </header>
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="grid gap-4">
            <div>
              <h2 className="font-semibold">{profile.displayName}</h2>
              <p className="text-sm text-neutral-600">Telefonos protegidos: llamada y WhatsApp se resuelven por boton seguro.</p>
            </div>
            <form action={updatePrivacyAction} className="grid gap-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField name="isPublic" label="Ficha publica visible" defaultChecked={profile.isPublic} />
                <CheckboxField name="showPhoto" label="Mostrar foto" defaultChecked={profile.showPhoto} />
                <CheckboxField name="showDisplayName" label="Mostrar nombre visible" defaultChecked={profile.showDisplayName} />
                <CheckboxField name="allowCall" label="Permitir llamada" defaultChecked={profile.allowCall && profile.showCallButton} />
                <CheckboxField
                  name="allowWhatsApp"
                  label="Permitir WhatsApp"
                  defaultChecked={profile.allowWhatsApp && profile.showWhatsAppButton}
                />
                <CheckboxField
                  name="allowLocationSharing"
                  label="Permitir compartir ubicacion"
                  defaultChecked={profile.allowLocationSharing && profile.showLocationButton}
                />
                <CheckboxField name="allowFoundReport" label="Permitir reportar encontrado" defaultChecked={profile.allowFoundReport} />
                {profile.criticalInformation ? (
                  <CheckboxField
                    name="showCriticalInformation"
                    label="Mostrar informacion critica"
                    defaultChecked={profile.showCriticalInformation}
                  />
                ) : null}
              </div>
              <Button type="submit">Guardar privacidad</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
