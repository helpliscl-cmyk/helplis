"use client";

import { useState } from "react";
import { Copy, LocateFixed, MapPinCheck, MessageCircle, Phone, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

type Contact = {
  name: string | null;
  phone: string | null;
  whatsappEnabled: boolean;
  callEnabled: boolean;
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
  publicCode,
  contacts,
  showLocationButton,
}: {
  scanId: string;
  publicCode: string;
  contacts: Contact[];
  showLocationButton: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const firstCallable = contacts.find((contact) => contact.phone && contact.callEnabled);
  const firstWhatsapp = contacts.find((contact) => contact.phone && contact.whatsappEnabled);

  async function shareLocation() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("Sin conexión. Intenta compartir la ubicación cuando recuperes internet.");
      return;
    }
    setStatus("Tu ubicación solo se enviará si aceptas compartirla.");
    if (!navigator.geolocation) {
      setStatus("Este navegador no permite compartir ubicación.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch("/api/public/location", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scanId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        });
        setStatus(response.ok ? "Ubicación compartida con el responsable." : "No se pudo compartir la ubicación.");
      },
      () => setStatus("No se compartió la ubicación."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(window.location.href);
    await record(scanId, "LINK_COPIED");
    setStatus("Enlace copiado.");
  }

  async function markFound() {
    await record(scanId, "FOUND_REPORTED");
    setStatus("Aviso registrado. El responsable verá este evento localmente.");
  }

  async function reportEmergency() {
    await record(scanId, "EMERGENCY_REPORTED");
    setStatus("Emergencia registrada localmente. Si hay riesgo inmediato, contacta servicios de emergencia.");
  }

  return (
    <div className="grid gap-3">
      {firstCallable?.phone ? (
        <a
          href={`tel:${firstCallable.phone}`}
          onClick={() => void record(scanId, "CALL_CLICKED")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--brand-primary-dark)] bg-[var(--brand-primary-dark)] px-4 py-2 text-sm font-medium text-white"
        >
          <Phone aria-hidden className="h-4 w-4" />
          Llamar
        </a>
      ) : null}
      {firstWhatsapp?.phone ? (
        <a
          href={`https://wa.me/${firstWhatsapp.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hola, escaneé el código ${publicCode} en HelPlis.`,
          )}`}
          onClick={() => void record(scanId, "WHATSAPP_CLICKED")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-text)]"
        >
          <MessageCircle aria-hidden className="h-4 w-4" />
          Abrir WhatsApp
        </a>
      ) : null}
      {showLocationButton ? (
        <Button type="button" variant="accent" onClick={shareLocation}>
          <LocateFixed aria-hidden className="h-4 w-4" />
          Compartir mi ubicación con el responsable
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={markFound}>
        <MapPinCheck aria-hidden className="h-4 w-4" />
        Reportar encontrado
      </Button>
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
