"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Contact,
  Eye,
  ImagePlus,
  KeyRound,
  Nfc,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { activateDeviceAction } from "@/features/activations/actions";

type ValidationResult = {
  ok: boolean;
  reason?: "invalid" | "unavailable" | "activated" | null;
  publicCode: string;
  state?: "UNACTIVATED" | "ACTIVE" | "SUSPENDED" | "DISABLED" | "INVALID";
  publicProfileUrl?: string;
  managementUrl?: string;
};

const steps = [
  "Escanear HelPlis",
  "Responsable",
  "Foto y persona",
  "Contacto prioritario",
  "Contacto secundario",
  "Informacion critica",
  "Privacidad",
  "Vista previa",
  "Activacion completada",
];

const profileTypes = [
  ["CHILD", "Nino o nina"],
  ["SENIOR", "Adulto mayor"],
  ["DEPENDENT_PERSON", "Persona que requiere asistencia"],
  ["MEDICAL_PROFILE", "Persona con dificultad para comunicarse"],
  ["PERSON", "Persona"],
] as const;

const relationshipOptions = [
  ["MOTHER", "Mama"],
  ["FATHER", "Papa"],
  ["FAMILY", "Familiar"],
  ["RESPONSIBLE", "Responsable"],
] as const;

const defaultHelpMessage =
  "Esta persona usa una pulsera HelPlis. Por favor contacta a su responsable y acompanala en un lugar seguro.";

export function ActivationForm({ publicCode: initialPublicCode, error }: { publicCode?: string; error?: string }) {
  const [step, setStep] = useState(initialPublicCode ? 1 : 0);
  const [publicCode, setPublicCode] = useState(initialPublicCode ?? "");
  const [manualCode, setManualCode] = useState(initialPublicCode ?? "");
  const [activatedPublicCode, setActivatedPublicCode] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(
    initialPublicCode ? `Pulsera identificada: ${initialPublicCode}` : null,
  );
  const [isScanning, setIsScanning] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [helpMessage, setHelpMessage] = useState(defaultHelpMessage);
  const [criticalEnabled, setCriticalEnabled] = useState(false);
  const [criticalInformation, setCriticalInformation] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [showCriticalInformation, setShowCriticalInformation] = useState(false);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showDisplayName, setShowDisplayName] = useState(true);
  const [allowCall, setAllowCall] = useState(true);
  const [allowWhatsApp, setAllowWhatsApp] = useState(true);
  const [allowLocationSharing, setAllowLocationSharing] = useState(true);
  const [allowFoundReport, setAllowFoundReport] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const phoneWarning =
    primaryPhone.length === 8 && secondaryPhone.length === 8 && primaryPhone === secondaryPhone
      ? "Ambos contactos usan el mismo numero. Puedes continuar, pero recomendamos tener dos alternativas."
      : null;

  async function validateAndContinue(rawCode: string) {
    const code = extractPublicCode(rawCode);
    if (!code) {
      setScanStatus("No pude encontrar un codigo HelPlis valido.");
      return;
    }

    setScanStatus("Validando pulsera...");
    const response = await fetch("/api/activation/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicCode: code }),
    });
    const payload = (await response.json().catch(() => null)) as ValidationResult | null;
    if (!response.ok || !payload?.ok) {
      if (payload?.state === "ACTIVE" && payload.publicCode) {
        stopCamera();
        setActivatedPublicCode(payload.publicCode);
        setPublicCode("");
        setManualCode(payload.publicCode);
        setScanStatus("Esta HelPlis ya está activada.");
        return;
      }
      setActivatedPublicCode(null);
      if (payload?.state === "SUSPENDED") {
        setScanStatus("Esta HelPlis no se encuentra disponible temporalmente.");
        return;
      }
      if (payload?.state === "DISABLED") {
        setScanStatus("Esta HelPlis no se encuentra disponible.");
        return;
      }
      setScanStatus("No pudimos identificar esta HelPlis.");
      return;
    }

    stopCamera();
    setActivatedPublicCode(null);
    setPublicCode(payload.publicCode);
    setManualCode(payload.publicCode);
    setScanStatus(`Pulsera identificada: ${payload.publicCode}`);
    setStep(1);
  }

  async function startQrScanner() {
    setScanStatus("Solicitando permiso de camara...");
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanStatus("Este navegador no permite abrir la camara. Usa ingreso manual.");
      return;
    }

    const detectorApi = window as Window & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
      };
    };
    if (!detectorApi.BarcodeDetector) {
      setScanStatus("El lector QR del navegador no esta disponible. Usa ingreso manual.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setIsScanning(true);
      setScanStatus("Apunta la camara al QR de la pulsera.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new detectorApi.BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const codes = await detector.detect(videoRef.current).catch(() => []);
        const rawValue = codes[0]?.rawValue;
        if (rawValue) {
          await validateAndContinue(rawValue);
          return;
        }
        window.setTimeout(scan, 450);
      };
      void scan();
    } catch {
      setIsScanning(false);
      setScanStatus("No se pudo usar la camara. Puedes ingresar el codigo manualmente.");
      stopCamera();
    }
  }

  async function readNfc() {
    const nfcApi = window as Window & {
      NDEFReader?: new () => {
        scan: () => Promise<void>;
        onreading: ((event: { message: { records: Array<{ data?: DataView; recordType?: string }> } }) => void) | null;
      };
    };
    if (!nfcApi.NDEFReader) {
      setScanStatus("Web NFC no esta disponible en este navegador. Usa QR o ingreso manual.");
      return;
    }
    try {
      const reader = new nfcApi.NDEFReader();
      reader.onreading = (event) => {
        const text = event.message.records
          .map((record) => {
            if (!record.data) return "";
            return new TextDecoder().decode(record.data);
          })
          .join(" ");
        void validateAndContinue(text);
      };
      await reader.scan();
      setScanStatus("Acerca el telefono al NFC de la pulsera.");
    } catch {
      setScanStatus("No se pudo leer NFC. Usa QR o ingreso manual.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoStatus("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5_000_000) {
      setPhotoStatus("La foto debe pesar menos de 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setPhotoDataUrl(value);
      setPhotoStatus("Foto lista para subir. Puedes reemplazarla o eliminarla.");
    };
    reader.readAsDataURL(file);
  }

  function nextStep() {
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function previousStep() {
    setStep((value) => Math.max(value - 1, 0));
  }

  return (
    <Card className="w-full max-w-4xl p-5">
      <CardHeader>
        <CardTitle>Activa tu HelPlis</CardTitle>
        <CardDescription>
          Escanea el codigo QR de tu pulsera o acerca el telefono al NFC para identificarla.
        </CardDescription>
      </CardHeader>

      <Progress current={step} />

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          No fue posible activar. Revisa la pulsera, el codigo secreto o las credenciales.
        </p>
      ) : null}

      <form action={activateDeviceAction} className="grid gap-6">
        <input type="hidden" name="publicCode" value={publicCode} />
        <input type="hidden" name="photoDataUrl" value={photoDataUrl} />

        <section className={step === 0 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<QrCode aria-hidden className="h-4 w-4" />} title="Paso 1: Escanear HelPlis" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Button type="button" onClick={startQrScanner}>
                <Camera aria-hidden className="h-4 w-4" />
                Escanear codigo QR
              </Button>
              <Button type="button" variant="secondary" onClick={readNfc}>
                <Nfc aria-hidden className="h-4 w-4" />
                Leer NFC
              </Button>
              <Button type="button" variant="ghost" onClick={() => setScanStatus("Ingresa el codigo impreso en la pulsera.")}>
                Ingresar codigo manualmente
              </Button>
            </div>
            {isScanning ? (
              <div className="overflow-hidden rounded-md border border-[var(--brand-border)] bg-black">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
              </div>
            ) : null}
            <div className="grid gap-3 rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-4 sm:grid-cols-[1fr_auto]">
              <Field label="No puedo escanear">
                <Input
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value.toUpperCase())}
                  placeholder="HLP009 o URL HelPlis"
                />
              </Field>
              <Button type="button" variant="secondary" className="self-end" onClick={() => validateAndContinue(manualCode)}>
                Validar pulsera
              </Button>
            </div>
            {scanStatus ? <Status>{scanStatus}</Status> : null}
            {activatedPublicCode ? <AlreadyActivatedActions publicCode={activatedPublicCode} /> : null}
        </section>

        <section className={step === 1 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<KeyRound aria-hidden className="h-4 w-4" />} title="Paso 2: Datos del responsable" />
            <Status>Pulsera identificada: {publicCode}</Status>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Codigo secreto">
                <Input name="activationCode" required placeholder="ACT-HLP009" />
              </Field>
              <Field label="Nombre completo">
                <Input name="ownerName" autoComplete="name" required />
              </Field>
              <PhoneInput label="Telefono" name="ownerPhoneLocal" required />
              <Field label="Correo">
                <Input name="email" type="email" autoComplete="email" required />
              </Field>
              <Field label="Contrasena">
                <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
            </div>
            <CheckboxField name="termsAccepted" label="Acepto los terminos de uso y la politica de privacidad." />
            <CheckboxField
              name="administrationConsent"
              label="Confirmo que estoy autorizado para administrar el perfil de esta persona."
            />
        </section>

        <section className={step === 2 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<ImagePlus aria-hidden className="h-4 w-4" />} title="Paso 3: Foto y datos de la persona" />
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="grid gap-3">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-md border border-[var(--brand-border)] bg-[#f8fbfe]">
                  {photoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid gap-2 p-4 text-center text-sm text-[var(--brand-muted)]">
                      <ImagePlus aria-hidden className="mx-auto h-8 w-8 text-[var(--brand-accent)]" />
                      Foto recomendada
                    </div>
                  )}
                </div>
                <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={handlePhoto} />
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
                <Button type="button" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
                  <Camera aria-hidden className="h-4 w-4" />
                  Tomar foto
                </Button>
                <Button type="button" variant="secondary" onClick={() => galleryInputRef.current?.click()}>
                  <ImagePlus aria-hidden className="h-4 w-4" />
                  Elegir desde galeria
                </Button>
                {photoDataUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPhotoDataUrl("");
                      setPhotoStatus("Continuaras sin foto.");
                    }}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                    Eliminar foto
                  </Button>
                ) : null}
                {!photoDataUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPhotoStatus("Continuaras sin foto.");
                      nextStep();
                    }}
                  >
                    Continuar sin foto
                  </Button>
                ) : null}
                {photoStatus ? <p className="text-xs text-[var(--brand-muted)]">{photoStatus}</p> : null}
              </div>
              <div className="grid gap-4">
                <p className="text-sm leading-6 text-[var(--brand-muted)]">
                  Esta foto puede ayudar a reconocer a la persona cuando alguien escanee su HelPlis.
                </p>
                <Field label="Tipo de apoyo">
                  <Select name="profileType" defaultValue="CHILD" required>
                    {profileTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nombre visible">
                  <Input name="displayName" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </Field>
                <Field label="Edad opcional">
                  <Input name="approximateAge" type="number" min="0" max="130" placeholder="Opcional" />
                </Field>
                <Field label="Mensaje de ayuda">
                  <Textarea name="helpMessage" maxLength={500} value={helpMessage} onChange={(event) => setHelpMessage(event.target.value)} />
                </Field>
              </div>
            </div>
        </section>

        <div className={step === 3 ? "block" : "hidden"}>
          <ContactStep
            title="Paso 4: Contacto prioritario"
            name="contact"
            defaultRelationship="MOTHER"
            phone={primaryPhone}
            setPhone={setPrimaryPhone}
            required
          />
        </div>

        <div className={step === 4 ? "block" : "hidden"}>
          <ContactStep
            title="Paso 5: Contacto secundario"
            name="contact2"
            defaultRelationship="FATHER"
            phone={secondaryPhone}
            setPhone={setSecondaryPhone}
            required
          />
        </div>

        <section className={step === 5 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<Sparkles aria-hidden className="h-4 w-4" />} title="Paso 6: Informacion critica opcional" />
            <label className="flex items-start gap-3 rounded-md border border-[var(--brand-border)] bg-white p-3 text-sm text-[var(--brand-text)]">
              <input
                type="checkbox"
                checked={criticalEnabled}
                onChange={(event) => setCriticalEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary-dark)] focus:ring-[var(--brand-primary-light)]"
              />
              <span>Agregar informacion critica</span>
            </label>
            {criticalEnabled ? (
              <Field label="Hay algo importante que una persona deba saber para ayudar?">
                <Textarea
                  name="criticalInformation"
                  maxLength={700}
                  value={criticalInformation}
                  onChange={(event) => setCriticalInformation(event.target.value)}
                  placeholder="Ej.: tiene dificultad para comunicarse, es alergico a la penicilina, puede desorientarse o necesita permanecer acompanado."
                />
              </Field>
            ) : null}
        </section>

        <section className={step === 6 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<ShieldCheck aria-hidden className="h-4 w-4" />} title="Paso 7: Privacidad" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle name="showPhoto" label="Mostrar foto" checked={showPhoto} onChange={setShowPhoto} />
              <Toggle name="showDisplayName" label="Mostrar nombre visible" checked={showDisplayName} onChange={setShowDisplayName} />
              <Toggle name="allowCall" label="Permitir llamada" checked={allowCall} onChange={setAllowCall} />
              <Toggle name="allowWhatsApp" label="Permitir WhatsApp" checked={allowWhatsApp} onChange={setAllowWhatsApp} />
              <Toggle
                name="allowLocationSharing"
                label="Permitir compartir ubicacion"
                checked={allowLocationSharing}
                onChange={setAllowLocationSharing}
              />
              <Toggle name="allowFoundReport" label="Permitir reportar encontrado" checked={allowFoundReport} onChange={setAllowFoundReport} />
              {criticalInformation ? (
                <Toggle
                  name="showCriticalInformation"
                  label="Mostrar informacion critica"
                  checked={showCriticalInformation}
                  onChange={setShowCriticalInformation}
                />
              ) : null}
            </div>
        </section>

        <section className={step === 7 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<Eye aria-hidden className="h-4 w-4" />} title="Paso 8: Vista previa" />
            <div className="grid gap-4 rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--brand-primary)] text-2xl font-semibold text-white">
                  {photoDataUrl && showPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (displayName || "H").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm text-[var(--brand-muted)]">Ficha publica</p>
                  <h3 className="text-2xl font-semibold">{showDisplayName ? displayName || "Nombre visible" : "Persona HelPlis"}</h3>
                </div>
              </div>
              <p className="leading-7 text-[var(--brand-muted)]">{helpMessage}</p>
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[var(--brand-primary-dark)]">
                {allowCall ? <span>Llamar contacto prioritario</span> : null}
                {allowWhatsApp ? <span>WhatsApp contacto prioritario</span> : null}
                {allowLocationSharing ? <span>Compartir ubicacion</span> : null}
                {allowFoundReport ? <span>Reportar encontrado</span> : null}
              </div>
              {criticalInformation && showCriticalInformation ? (
                <div className="rounded-md border border-[#b9ece8] bg-white p-3">
                  <h4 className="font-semibold">Informacion importante</h4>
                  <p className="mt-1 text-sm leading-6 text-[var(--brand-muted)]">{criticalInformation}</p>
                </div>
              ) : null}
              {phoneWarning ? <Status>{phoneWarning}</Status> : null}
            </div>
        </section>

        <section className={step === 8 ? "grid gap-4" : "hidden"}>
            <SectionTitle icon={<CheckCircle2 aria-hidden className="h-4 w-4" />} title="Paso 9: Activacion completada" />
            <p className="text-sm leading-6 text-[var(--brand-muted)]">
              Revisa la vista previa y confirma. Despues podras ajustar privacidad desde tu dashboard.
            </p>
            <ActivationSubmitButton />
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--brand-border)] pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="secondary" onClick={previousStep} disabled={step === 0}>
            <ChevronLeft aria-hidden className="h-4 w-4" />
            Volver
          </Button>
          {step < 8 ? (
            <Button type="button" onClick={nextStep} disabled={step === 0 && !publicCode}>
              Continuar
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function ActivationSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" variant="accent" disabled={pending}>
      <KeyRound aria-hidden className="h-4 w-4" />
      {pending ? "Subiendo foto y activando..." : "Confirmar activacion"}
    </Button>
  );
}

export function AlreadyActivatedActions({ publicCode }: { publicCode: string }) {
  return (
    <div className="grid gap-3 rounded-md border border-[var(--brand-border)] bg-white p-4">
      <h2 className="text-lg font-semibold">Esta HelPlis ya está activada.</h2>
      <p className="text-sm leading-6 text-[var(--brand-muted)]">
        Para proteger el perfil, no se puede reactivar ni sobrescribir desde el flujo publico.
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/p/${publicCode}`}>Ver perfil de ayuda</ButtonLink>
        <ButtonLink href={`/dashboard/devices/${publicCode}`} variant="secondary">
          Administrar HelPlis
        </ButtonLink>
      </div>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
      {steps.map((title, index) => (
        <div
          key={title}
          className={[
            "min-h-16 rounded-md border p-2 text-xs",
            index <= current ? "border-[var(--brand-primary-light)] bg-[#eafffb]" : "border-[var(--brand-border)] bg-white",
          ].join(" ")}
        >
          <div className="font-semibold">{index + 1}</div>
          <div className="mt-1 leading-4">{title}</div>
        </div>
      ))}
    </div>
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

function Status({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="rounded-md border border-[var(--brand-border)] bg-white p-3 text-sm text-[var(--brand-muted)]">
      {children}
    </p>
  );
}

function PhoneInput({ label, name, required, value, onChange }: { label: string; name: string; required?: boolean; value?: string; onChange?: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex overflow-hidden rounded-md border border-[var(--brand-border)] bg-white focus-within:border-[var(--brand-primary-light)] focus-within:ring-2 focus-within:ring-[var(--brand-primary-light)]/20">
        <span className="grid min-h-11 place-items-center border-r border-[var(--brand-border)] bg-[#f8fbfe] px-3 text-base font-semibold text-[var(--brand-primary-dark)]">
          +569
        </span>
        <input
          name={name}
          value={value}
          onChange={(event) => onChange?.(event.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          pattern="[0-9]{8}"
          minLength={8}
          maxLength={8}
          required={required}
          placeholder="12345678"
          className="min-h-11 min-w-0 flex-1 px-3 py-2 text-base outline-none placeholder:text-slate-400"
        />
      </div>
    </Field>
  );
}

function ContactStep({
  title,
  name,
  defaultRelationship,
  phone,
  setPhone,
  required,
}: {
  title: string;
  name: "contact" | "contact2";
  defaultRelationship: "MOTHER" | "FATHER";
  phone: string;
  setPhone: (value: string) => void;
  required?: boolean;
}) {
  const suffix = name === "contact" ? "" : "2";
  return (
    <section className="grid gap-4">
      <SectionTitle icon={<Contact aria-hidden className="h-4 w-4" />} title={title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <Input name={`${name}Name`} required={required} placeholder="Nombre del contacto" />
        </Field>
        <PhoneInput label="Telefono" name={`${name}PhoneLocal`} required={required} value={phone} onChange={setPhone} />
        <Field label="Relacion">
          <Select name={`${name}RelationshipCode`} defaultValue={defaultRelationship} required={required}>
            {relationshipOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField name={`${name}CallEnabled`} label="Permitir llamada" defaultChecked />
        <CheckboxField name={`${name}WhatsappEnabled`} label="Permitir WhatsApp" defaultChecked />
      </div>
      <input type="hidden" name={`${name}Priority`} value={suffix || "1"} />
    </section>
  );
}

function Toggle({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-[var(--brand-border)] bg-white p-3 text-sm text-[var(--brand-text)]">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary-dark)] focus:ring-[var(--brand-primary-light)]"
      />
      <span>{label}</span>
    </label>
  );
}

function extractPublicCode(value: string) {
  const trimmed = value.trim();
  const fromPath = trimmed.match(/\/(?:p|activate)\/([A-Za-z0-9]{4,12})/);
  if (fromPath?.[1]) return fromPath[1].toUpperCase();
  const plain = trimmed.match(/\b([A-Za-z]{3}\d{3,9}|[A-Za-z0-9]{4,12})\b/);
  return plain?.[1]?.toUpperCase() ?? null;
}
