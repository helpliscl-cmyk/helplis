"use client";

import { FormEvent, useState } from "react";
import { Copy, LocateFixed, MapPinCheck, MessageCircle, Phone, Siren, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";

type Contact = {
  name: string | null;
  phone: string | null;
  whatsappEnabled: boolean;
  callEnabled: boolean;
};

type FoundLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

async function record(scanId: string, action: string) {
  await fetch("/api/public/contact-action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scanId, action }),
  }).catch(() => undefined);
}

export function PublicActions({
  scanId,
  contacts,
  showLocationButton,
  allowFoundReport,
}: {
  scanId: string;
  contacts: Contact[];
  showLocationButton: boolean;
  allowFoundReport: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [showFoundForm, setShowFoundForm] = useState(false);
  const [foundLocation, setFoundLocation] = useState<FoundLocation | null>(null);
  const hasCallable = contacts.some((contact) => contact.callEnabled);
  const hasWhatsapp = contacts.some((contact) => contact.whatsappEnabled);

  async function shareLocation() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("Sin conexion. Intenta compartir la ubicacion cuando recuperes internet.");
      return;
    }
    setStatus("Tu ubicacion solo se enviara si aceptas compartirla.");
    if (!navigator.geolocation) {
      await sendLocationPreference("UNAVAILABLE");
      setStatus("Este navegador no permite compartir ubicacion.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch("/api/public/location", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scanId,
            permissionStatus: "GRANTED",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        });
        setStatus(response.ok ? "Ubicacion compartida con el responsable." : "No se pudo compartir la ubicacion.");
      },
      async () => {
        await sendLocationPreference("DENIED");
        setStatus("No se compartio la ubicacion. Puedes usar los contactos igualmente.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function sendLocationPreference(permissionStatus: "DENIED" | "UNAVAILABLE") {
    await fetch("/api/public/location", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanId, permissionStatus }),
    }).catch(() => undefined);
  }

  async function addFoundLocation() {
    setStatus("Tu ubicacion se agregara al aviso solo si aceptas el permiso del navegador.");
    if (!navigator.geolocation) {
      setStatus("Este navegador no permite agregar ubicacion.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFoundLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus("Ubicacion agregada al aviso encontrado.");
      },
      () => setStatus("No se agrego ubicacion al aviso encontrado."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(window.location.href);
    await record(scanId, "LINK_COPIED");
    setStatus("Enlace copiado.");
  }

  async function openContact(action: "CALL_CLICKED" | "WHATSAPP_CLICKED") {
    setStatus("Preparando contacto seguro...");
    const response = await fetch("/api/public/contact-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanId, action }),
    });
    if (!response.ok) {
      setStatus("No se pudo abrir el contacto. Intenta con otra accion.");
      return;
    }

    const payload = (await response.json()) as { href?: string };
    if (!payload.href) {
      setStatus("No hay contacto disponible para esta accion.");
      return;
    }

    setStatus(null);
    if (action === "WHATSAPP_CLICKED") {
      const opened = window.open(payload.href, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(payload.href);
      return;
    }
    window.location.assign(payload.href);
  }

  async function submitFoundReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/public/found-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scanId,
        reporterName: form.get("reporterName") || undefined,
        reporterPhone: form.get("reporterPhone") || undefined,
        message: form.get("message") || undefined,
        latitude: foundLocation?.latitude,
        longitude: foundLocation?.longitude,
        accuracy: foundLocation?.accuracy,
        consentedLocation: Boolean(foundLocation),
      }),
    });
    setStatus(response.ok ? "Aviso enviado al responsable." : "No se pudo enviar el aviso.");
    if (response.ok) setShowFoundForm(false);
  }

  async function reportEmergency() {
    await record(scanId, "EMERGENCY_REPORTED");
    setStatus(
      "HelPlis no reemplaza servicios oficiales ni garantiza respuesta inmediata. Si hay riesgo inmediato, contacta emergencias.",
    );
  }

  return (
    <div className="grid gap-3">
      {hasCallable ? (
        <Button type="button" onClick={() => void openContact("CALL_CLICKED")}>
          <Phone aria-hidden className="h-4 w-4" />
          Llamar
        </Button>
      ) : null}
      {hasWhatsapp ? (
        <Button type="button" variant="secondary" onClick={() => void openContact("WHATSAPP_CLICKED")}>
          <MessageCircle aria-hidden className="h-4 w-4" />
          Abrir WhatsApp
        </Button>
      ) : null}
      {showLocationButton ? (
        <Button type="button" variant="accent" onClick={shareLocation}>
          <LocateFixed aria-hidden className="h-4 w-4" />
          Compartir mi ubicacion con el responsable
        </Button>
      ) : null}
      {allowFoundReport ? (
        <Button type="button" variant="secondary" onClick={() => setShowFoundForm((value) => !value)}>
          {showFoundForm ? <X aria-hidden className="h-4 w-4" /> : <MapPinCheck aria-hidden className="h-4 w-4" />}
          Reportar encontrado
        </Button>
      ) : null}
      {showFoundForm ? (
        <form onSubmit={submitFoundReport} className="grid gap-3 rounded-md border border-[var(--brand-border)] bg-[#f8fbfe] p-3">
          <Input name="reporterName" placeholder="Tu nombre (opcional)" />
          <Input name="reporterPhone" type="tel" placeholder="Tu telefono (opcional)" />
          <Textarea name="message" placeholder="Mensaje para el responsable (opcional)" />
          <Button type="button" variant="secondary" onClick={addFoundLocation}>
            <LocateFixed aria-hidden className="h-4 w-4" />
            {foundLocation ? "Ubicacion agregada" : "Agregar mi ubicacion"}
          </Button>
          <Button type="submit" variant="accent">
            Enviar aviso
          </Button>
        </form>
      ) : null}
      <Button type="button" variant="secondary" onClick={copyLink}>
        <Copy aria-hidden className="h-4 w-4" />
        Copiar enlace
      </Button>
      <Button type="button" variant="danger" onClick={reportEmergency}>
        <Siren aria-hidden className="h-4 w-4" />
        Informar emergencia
      </Button>
      {status ? (
        <p aria-live="polite" className="rounded-md border border-[var(--brand-border)] bg-white p-3 text-sm text-[var(--brand-muted)]">
          {status}
        </p>
      ) : null}
    </div>
  );
}
