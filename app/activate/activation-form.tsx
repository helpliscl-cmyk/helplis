"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Contact, Eye, KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { activateDeviceAction } from "@/features/activations/actions";

const profileTypes = [
  ["PERSON", "Persona"],
  ["CHILD", "Nino o nina"],
  ["SENIOR", "Adulto mayor"],
  ["DEPENDENT_PERSON", "Persona con apoyo"],
  ["MEDICAL_PROFILE", "Perfil medico"],
  ["PET", "Mascota"],
  ["LUGGAGE", "Equipaje"],
  ["OBJECT", "Objeto"],
  ["ASSET", "Activo"],
  ["OTHER", "Otro"],
];

const helpTemplates: Record<string, string> = {
  PERSON:
    "Este HelPlis contiene informacion autorizada para contactar a mi red de apoyo si necesito ayuda.",
  CHILD:
    "Estoy con una pulsera HelPlis. Por favor contacta a mi adulto responsable y acompaname en un lugar seguro.",
  SENIOR: "Puedo necesitar orientacion. Por favor hablame con calma y contacta a mi responsable.",
  DEPENDENT_PERSON:
    "Puedo requerir apoyo para comunicarme o desplazarme. Revisa las indicaciones autorizadas y contacta a mi red.",
  MEDICAL_PROFILE:
    "Revisa la informacion autorizada y contacta al responsable antes de tomar decisiones no urgentes.",
  PET: "Soy una mascota con identificacion HelPlis. Por favor avisa a mi tutor antes de trasladarme.",
  LUGGAGE:
    "Este objeto tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  OBJECT:
    "Este objeto tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  ASSET:
    "Este activo tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  OTHER:
    "Este HelPlis contiene informacion autorizada para ayudar a contactar a su responsable.",
};

const progress = [
  ["1", "Codigo"],
  ["2", "Perfil"],
  ["3", "Contactos"],
  ["4", "Privacidad"],
  ["5", "Preview"],
];

export function ActivationForm({ publicCode, error }: { publicCode?: string; error?: string }) {
  const [profileType, setProfileType] = useState("PERSON");
  const [displayName, setDisplayName] = useState("");
  const [helpMessage, setHelpMessage] = useState(helpTemplates.PERSON);
  const [contactName, setContactName] = useState("");
  const isPersonProfile = ["PERSON", "CHILD", "SENIOR", "DEPENDENT_PERSON", "MEDICAL_PROFILE"].includes(profileType);
  const isPetProfile = profileType === "PET";
  const isObjectProfile = ["LUGGAGE", "OBJECT", "ASSET"].includes(profileType);
  const profileLabel = useMemo(
    () => profileTypes.find(([value]) => value === profileType)?.[1] ?? "Perfil",
    [profileType],
  );

  function updateType(value: string) {
    setProfileType(value);
    setHelpMessage(helpTemplates[value] ?? helpTemplates.OTHER);
  }

  return (
    <Card className="w-full max-w-4xl p-5">
      <CardHeader>
        <CardTitle>Activar dispositivo</CardTitle>
        <CardDescription>
          Completa la ficha publica con privacidad segura desde el inicio. La informacion medica es opcional.
        </CardDescription>
      </CardHeader>

      <div className="mb-6 grid gap-2 sm:grid-cols-5">
        {progress.map(([number, title]) => (
          <div key={title} className="rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-text)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e6fbf9] text-xs text-[var(--brand-primary-dark)]">
                {number}
              </span>
              {title}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No fue posible activar. Revisa el codigo secreto, el estado del dispositivo o las credenciales.
        </p>
      ) : null}

      <form action={activateDeviceAction} className="grid gap-6">
        <section className="grid gap-4">
          <SectionTitle icon={<KeyRound aria-hidden className="h-4 w-4" />} title="Codigo y responsable" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Codigo publico">
              <Input name="publicCode" required defaultValue={publicCode} placeholder="HLP009" />
            </Field>
            <Field label="Codigo secreto">
              <Input name="activationCode" required placeholder="ACT-HLP009" />
            </Field>
            <Field label="Nombre responsable">
              <Input name="ownerName" required placeholder="Responsable" />
            </Field>
            <Field label="Correo">
              <Input name="email" type="email" required placeholder="persona@example.test" />
            </Field>
            <Field label="Contrasena">
              <Input name="password" type="password" required placeholder="Minimo 8 caracteres" />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <SectionTitle icon={<UserRound aria-hidden className="h-4 w-4" />} title="Perfil publico" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de perfil">
              <Select name="profileType" value={profileType} onChange={(event) => updateType(event.target.value)}>
                {profileTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre visible">
              <Input
                name="displayName"
                required
                placeholder="Alias o nombre visible"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>
            <Field label="Alias opcional">
              <Input name="alias" placeholder="Ej: Mati, Luna, Maleta azul" />
            </Field>
            <Field label="Edad aproximada">
              <Input name="approximateAge" type="number" min="0" max="130" placeholder="Opcional" />
            </Field>
            <Field label="Comuna">
              <Input name="commune" placeholder="Opcional" />
            </Field>
            <Field label="Sector">
              <Input name="generalArea" placeholder="Opcional" />
            </Field>
          </div>
          <Field label="Mensaje de ayuda">
            <Textarea name="helpMessage" value={helpMessage} onChange={(event) => setHelpMessage(event.target.value)} />
          </Field>
          <Field label="Descripcion breve">
            <Textarea name="description" placeholder="Dato contextual autorizado para quien escanee." />
          </Field>
        </section>

        {isPersonProfile ? (
          <section className="grid gap-4">
            <SectionTitle icon={<Sparkles aria-hidden className="h-4 w-4" />} title="Informacion critica opcional" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Grupo sanguineo">
                <Input name="bloodType" placeholder="Ej: O+" />
              </Field>
              <Field label="Alergias">
                <Input name="allergies" placeholder="Opcional" />
              </Field>
              <Field label="Condiciones">
                <Input name="medicalConditions" placeholder="Opcional" />
              </Field>
              <Field label="Medicamentos">
                <Input name="medications" placeholder="Opcional" />
              </Field>
            </div>
            <Field label="Instrucciones medicas">
              <Textarea name="medicalInstructions" placeholder="Indicaciones breves autorizadas." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Comunicacion">
                <Textarea name="communicationNotes" />
              </Field>
              <Field label="Movilidad">
                <Textarea name="mobilityNotes" />
              </Field>
              <Field label="Sensorial">
                <Textarea name="sensoryNotes" />
              </Field>
            </div>
          </section>
        ) : null}

        {isPetProfile ? (
          <section className="grid gap-4">
            <SectionTitle icon={<Eye aria-hidden className="h-4 w-4" />} title="Datos de mascota" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre mascota">
                <Input name="petName" />
              </Field>
              <Field label="Especie">
                <Input name="species" placeholder="Perro, gato..." />
              </Field>
              <Field label="Raza">
                <Input name="breed" />
              </Field>
              <Field label="Color">
                <Input name="color" />
              </Field>
            </div>
            <Field label="Notas veterinarias">
              <Textarea name="veterinaryNotes" />
            </Field>
            <Field label="Comportamiento">
              <Textarea name="petBehaviorNotes" />
            </Field>
          </section>
        ) : null}

        {isObjectProfile ? (
          <section className="grid gap-4">
            <SectionTitle icon={<Eye aria-hidden className="h-4 w-4" />} title="Datos de objeto" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre objeto">
                <Input name="objectName" />
              </Field>
              <Field label="Categoria">
                <Input name="objectCategory" placeholder="Equipaje, llaves, activo..." />
              </Field>
              <Field label="Marca">
                <Input name="brand" />
              </Field>
              <Field label="Modelo">
                <Input name="model" />
              </Field>
              <Field label="Color">
                <Input name="color" />
              </Field>
            </div>
            <Field label="Instrucciones de devolucion">
              <Textarea name="returnInstructions" />
            </Field>
            <Field label="Recompensa opcional">
              <Input name="rewardMessage" />
            </Field>
          </section>
        ) : null}

        <section className="grid gap-4">
          <SectionTitle icon={<Contact aria-hidden className="h-4 w-4" />} title="Contactos" />
          <ContactFields index={1} required onNameChange={setContactName} />
          <ContactFields index={2} />
          <ContactFields index={3} />
        </section>

        <section className="grid gap-4">
          <SectionTitle icon={<ShieldCheck aria-hidden className="h-4 w-4" />} title="Privacidad inicial" />
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField name="showPhoto" label="Mostrar foto" defaultChecked />
            <CheckboxField name="showAlias" label="Mostrar alias" defaultChecked />
            <CheckboxField name="showFullName" label="Mostrar nombre completo" />
            <CheckboxField name="showContactNames" label="Mostrar nombres de contactos" defaultChecked />
            <CheckboxField name="showPhoneNumbers" label="Mostrar telefonos como texto" />
            <CheckboxField name="showApproximateAge" label="Mostrar edad aproximada" />
            <CheckboxField name="showBloodType" label="Mostrar grupo sanguineo" />
            <CheckboxField name="showAllergies" label="Mostrar alergias" />
            <CheckboxField name="showMedicalConditions" label="Mostrar condiciones" />
            <CheckboxField name="showMedications" label="Mostrar medicamentos" />
            <CheckboxField name="showMedicalInstructions" label="Mostrar instrucciones medicas" />
            <CheckboxField name="showCommunicationNotes" label="Mostrar comunicacion" />
            <CheckboxField name="showMobilityNotes" label="Mostrar movilidad" />
            <CheckboxField name="showSensoryNotes" label="Mostrar sensorial" />
            <CheckboxField name="showGeneralArea" label="Mostrar comuna/sector" />
            <CheckboxField name="showLocationButton" label="Permitir ubicacion voluntaria" defaultChecked />
            <CheckboxField name="showWhatsAppButton" label="Permitir WhatsApp" defaultChecked />
            <CheckboxField name="showCallButton" label="Permitir llamada" defaultChecked />
            <CheckboxField name="showMessageButton" label="Permitir mensaje" defaultChecked />
            <CheckboxField name="allowFoundReport" label="Permitir reporte encontrado" defaultChecked />
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-4">
          <SectionTitle icon={<Eye aria-hidden className="h-4 w-4" />} title="Asi vera la ficha quien escanee" />
          <div className="rounded-md bg-white p-4">
            <p className="text-xs font-medium text-[var(--brand-muted)]">{profileLabel}</p>
            <h3 className="mt-1 text-xl font-semibold">{displayName || "Nombre visible"}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">{helpMessage}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--brand-primary-dark)]">
              <span>Llamar</span>
              <span>WhatsApp</span>
              <span>Compartir ubicacion</span>
              <span>Reportar encontrado</span>
            </div>
            <p className="mt-4 text-xs text-[var(--brand-muted)]">
              Primer contacto: {contactName || "Contacto principal"}. Los telefonos no se muestran como texto salvo que lo autorices.
            </p>
          </div>
        </section>

        <Button type="submit" className="w-full" variant="accent">
          <KeyRound aria-hidden className="h-4 w-4" />
          Confirmar activacion
        </Button>
      </form>
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
      {icon}
      {title}
    </div>
  );
}

function ContactFields({
  index,
  required,
  onNameChange,
}: {
  index: 1 | 2 | 3;
  required?: boolean;
  onNameChange?: (value: string) => void;
}) {
  const suffix = index === 1 ? "" : String(index);
  return (
    <div className="grid gap-4 rounded-md border border-[var(--brand-border)] bg-white p-4 sm:grid-cols-2">
      <Field label={`Contacto ${index}`}>
        <Input
          name={`contact${suffix}Name`}
          required={required}
          placeholder="Nombre contacto"
          onChange={(event) => onNameChange?.(event.target.value)}
        />
      </Field>
      <Field label="Telefono">
        <Input name={`contact${suffix}Phone`} type="tel" required={required} placeholder="+569..." />
      </Field>
      <Field label="Relacion">
        <Input name={`contact${suffix}Relationship`} placeholder="Madre, tutor, responsable..." />
      </Field>
      <Field label="Disponibilidad">
        <Input name={`contact${suffix}AvailabilityNotes`} placeholder="Principal, horario escolar..." />
      </Field>
    </div>
  );
}
