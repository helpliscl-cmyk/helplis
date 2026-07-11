import { KeyRound } from "lucide-react";
import { activateDeviceAction } from "@/features/activations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";

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

export function ActivationForm({ publicCode, error }: { publicCode?: string; error?: string }) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Activar dispositivo</CardTitle>
        <CardDescription>
          El publicCode visible debe combinarse con el código secreto del empaque. El código secreto no se guarda en texto plano.
        </CardDescription>
      </CardHeader>
      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No fue posible activar. Revisa el código secreto, el estado del dispositivo o las credenciales.
        </p>
      ) : null}
      <form action={activateDeviceAction} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código público">
            <Input name="publicCode" required defaultValue={publicCode} placeholder="HLP009" />
          </Field>
          <Field label="Código secreto">
            <Input name="activationCode" required placeholder="ACT-HLP009" />
          </Field>
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
              {profileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4">
          <Field label="Nombre visible o alias">
            <Input name="displayName" required placeholder="Alias o nombre visible" />
          </Field>
          <Field label="Instrucciones importantes">
            <Textarea name="specialInstructions" placeholder="Texto visible para quien escanee." />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contacto principal">
            <Input name="contactName" required placeholder="Nombre contacto" />
          </Field>
          <Field label="Teléfono contacto">
            <Input name="contactPhone" type="tel" required placeholder="+569..." />
          </Field>
        </div>
        <div className="grid gap-3">
          <h2 className="text-sm font-semibold text-neutral-950">Privacidad inicial</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField name="showMedicalInfo" label="Mostrar información médica si se agrega después" />
            <CheckboxField name="showContactNames" label="Mostrar nombres de contactos" defaultChecked />
            <CheckboxField name="showPhoneNumbers" label="Mostrar teléfonos" defaultChecked />
            <CheckboxField name="showLocationButton" label="Permitir ubicación compartida" defaultChecked />
            <CheckboxField name="showWhatsAppButton" label="Permitir WhatsApp" defaultChecked />
            <CheckboxField name="showCallButton" label="Permitir llamada" defaultChecked />
          </div>
        </div>
        <Button type="submit" className="w-full">
          <KeyRound aria-hidden className="h-4 w-4" />
          Confirmar activación
        </Button>
      </form>
    </Card>
  );
}
