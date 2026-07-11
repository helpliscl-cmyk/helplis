import { Contact, Eye, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { activateDeviceAction } from "@/features/activations/actions";

const profileTypes = [
  ["PERSON", "Persona"],
  ["CHILD", "Niño o niña"],
  ["SENIOR", "Adulto mayor"],
  ["DEPENDENT_PERSON", "Persona dependiente"],
  ["MEDICAL_PROFILE", "Perfil con información médica"],
  ["PET", "Mascota"],
  ["LUGGAGE", "Equipaje"],
  ["OBJECT", "Objeto"],
  ["ASSET", "Activo"],
  ["EMPLOYEE", "Colaborador"],
  ["OTHER", "Otro"],
];

const progress = [
  ["Código", "Público + secreto"],
  ["Cuenta", "Responsable"],
  ["Perfil", "Datos visibles"],
  ["Privacidad", "Permisos iniciales"],
];

export function ActivationForm({ publicCode, error }: { publicCode?: string; error?: string }) {
  return (
    <Card className="w-full max-w-3xl p-5">
      <CardHeader>
        <CardTitle>Activar dispositivo</CardTitle>
        <CardDescription>
          Usa el código público visible y el código secreto del empaque. La ficha queda lista con privacidad configurable desde el inicio.
        </CardDescription>
      </CardHeader>

      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        {progress.map(([title, text], index) => (
          <div key={title} className="rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-text)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e6fbf9] text-xs text-[var(--brand-primary-dark)]">
                {index + 1}
              </span>
              {title}
            </div>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">{text}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No fue posible activar. Revisa el código secreto, el estado del dispositivo o las credenciales.
        </p>
      ) : null}

      <form action={activateDeviceAction} className="grid gap-6">
        <section className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
            <KeyRound aria-hidden className="h-4 w-4" />
            Código de activación
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código público">
              <Input name="publicCode" required defaultValue={publicCode} placeholder="HLP009" />
            </Field>
            <Field label="Código secreto">
              <Input name="activationCode" required placeholder="ACT-HLP009" />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
            <UserRound aria-hidden className="h-4 w-4" />
            Responsable
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre responsable">
              <Input name="ownerName" required placeholder="Responsable demo" />
            </Field>
            <Field label="Correo">
              <Input name="email" type="email" required placeholder="persona@example.test" />
            </Field>
            <Field label="Contraseña">
              <Input name="password" type="password" required placeholder="Mínimo 8 caracteres" />
            </Field>
            <Field label="Tipo de perfil">
              <Select name="profileType" defaultValue="PERSON">
                {profileTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
            <Eye aria-hidden className="h-4 w-4" />
            Información visible
          </div>
          <Field label="Nombre visible o alias">
            <Input name="displayName" required placeholder="Alias o nombre visible" />
          </Field>
          <Field label="Instrucciones importantes">
            <Textarea name="specialInstructions" placeholder="Indicaciones breves para quien escanee." />
          </Field>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
            <Contact aria-hidden className="h-4 w-4" />
            Contacto inicial
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contacto principal">
              <Input name="contactName" required placeholder="Nombre contacto" />
            </Field>
            <Field label="Teléfono contacto">
              <Input name="contactPhone" type="tel" required placeholder="+569..." />
            </Field>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
            <ShieldCheck aria-hidden className="h-4 w-4" />
            Privacidad inicial
          </div>
          <p className="text-sm leading-6 text-[var(--brand-muted)]">
            Puedes ajustar estos permisos después desde el panel. La ubicación solo se envía si quien escanea acepta compartirla.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField name="showMedicalInfo" label="Mostrar información médica si se agrega después" />
            <CheckboxField name="showContactNames" label="Mostrar nombres de contactos" defaultChecked />
            <CheckboxField name="showPhoneNumbers" label="Mostrar teléfonos" defaultChecked />
            <CheckboxField name="showLocationButton" label="Permitir ubicación compartida" defaultChecked />
            <CheckboxField name="showWhatsAppButton" label="Permitir WhatsApp" defaultChecked />
            <CheckboxField name="showCallButton" label="Permitir llamada" defaultChecked />
          </div>
        </section>

        <Button type="submit" className="w-full" variant="accent">
          <KeyRound aria-hidden className="h-4 w-4" />
          Confirmar activación
        </Button>
      </form>
    </Card>
  );
}
