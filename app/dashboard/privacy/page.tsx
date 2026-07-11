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
        <p className="mt-1 text-sm text-neutral-600">Así verá tu perfil quien escanee tu pulsera o tag.</p>
      </header>
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="grid gap-4">
            <div>
              <h2 className="font-semibold">{profile.displayName}</h2>
              <p className="text-sm text-neutral-600">{profile.type}</p>
            </div>
            <form action={updatePrivacyAction} className="grid gap-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField name="isPublic" label="Ficha pública visible" defaultChecked={profile.isPublic} />
                <CheckboxField name="showPhoto" label="Mostrar foto" defaultChecked={profile.showPhoto} />
                <CheckboxField name="showMedicalInfo" label="Mostrar información médica" defaultChecked={profile.showMedicalInfo} />
                <CheckboxField name="showContactNames" label="Mostrar nombres de contactos" defaultChecked={profile.showContactNames} />
                <CheckboxField name="showPhoneNumbers" label="Mostrar teléfonos" defaultChecked={profile.showPhoneNumbers} />
                <CheckboxField name="showAge" label="Mostrar edad aproximada" defaultChecked={profile.showAge} />
                <CheckboxField name="showLocationButton" label="Permitir botón de ubicación" defaultChecked={profile.showLocationButton} />
                <CheckboxField name="showWhatsAppButton" label="Permitir WhatsApp" defaultChecked={profile.showWhatsAppButton} />
                <CheckboxField name="showCallButton" label="Permitir llamada" defaultChecked={profile.showCallButton} />
                <CheckboxField name="showMessageButton" label="Permitir mensaje" defaultChecked={profile.showMessageButton} />
              </div>
              <Button type="submit">Guardar privacidad</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
