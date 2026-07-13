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
                <CheckboxField name="showAlias" label="Mostrar alias" defaultChecked={profile.showAlias} />
                <CheckboxField name="showFullName" label="Mostrar nombre completo" defaultChecked={profile.showFullName} />
                <CheckboxField name="showApproximateAge" label="Mostrar edad aproximada granular" defaultChecked={profile.showApproximateAge || profile.showAge} />
                <CheckboxField name="showBloodType" label="Mostrar grupo sanguineo" defaultChecked={profile.showBloodType} />
                <CheckboxField name="showAllergies" label="Mostrar alergias" defaultChecked={profile.showAllergies} />
                <CheckboxField name="showMedicalConditions" label="Mostrar condiciones" defaultChecked={profile.showMedicalConditions} />
                <CheckboxField name="showMedications" label="Mostrar medicamentos" defaultChecked={profile.showMedications} />
                <CheckboxField name="showMedicalInstructions" label="Mostrar instrucciones medicas" defaultChecked={profile.showMedicalInstructions} />
                <CheckboxField name="showCommunicationNotes" label="Mostrar comunicacion" defaultChecked={profile.showCommunicationNotes} />
                <CheckboxField name="showMobilityNotes" label="Mostrar movilidad" defaultChecked={profile.showMobilityNotes} />
                <CheckboxField name="showSensoryNotes" label="Mostrar sensorial" defaultChecked={profile.showSensoryNotes} />
                <CheckboxField name="showGeneralArea" label="Mostrar comuna/sector" defaultChecked={profile.showGeneralArea} />
                <CheckboxField name="showExactAddress" label="Mostrar direccion exacta" defaultChecked={profile.showExactAddress} />
                <CheckboxField name="allowCall" label="Permitir llamada segura" defaultChecked={profile.allowCall && profile.showCallButton} />
                <CheckboxField name="allowWhatsApp" label="Permitir WhatsApp seguro" defaultChecked={profile.allowWhatsApp && profile.showWhatsAppButton} />
                <CheckboxField name="allowMessage" label="Permitir mensaje seguro" defaultChecked={profile.allowMessage && profile.showMessageButton} />
                <CheckboxField name="allowLocationSharing" label="Permitir ubicacion voluntaria" defaultChecked={profile.allowLocationSharing && profile.showLocationButton} />
                <CheckboxField name="allowFoundReport" label="Permitir reporte encontrado" defaultChecked={profile.allowFoundReport} />
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
