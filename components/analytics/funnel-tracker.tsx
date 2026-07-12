"use client";

import { useEffect } from "react";

type FunnelTrackerProps = {
  pageEvent?: string | FunnelEventInput;
  pageEvents?: Array<string | FunnelEventInput>;
};

type FunnelEventInput = {
  eventName: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

function getSessionId() {
  const key = "helplis_session_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, id);
  return id;
}

function sendEvent(eventName: string, target?: string, metadata?: Record<string, unknown>) {
  const payload = JSON.stringify({
    eventName,
    path: window.location.pathname,
    target,
    metadata: {
      page: window.location.pathname,
      sessionId: getSessionId(),
      ...metadata,
    },
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

function normalizeEvent(input: string | FunnelEventInput): FunnelEventInput {
  if (typeof input === "string") return { eventName: input };
  return input;
}

function readMetadata(target: Element) {
  const metadata: Record<string, unknown> = {};
  const pack = target.getAttribute("data-funnel-pack");
  const quantity = target.getAttribute("data-funnel-quantity");
  const price = target.getAttribute("data-funnel-price");
  const origin = target.getAttribute("data-funnel-origin");

  if (pack) metadata.pack = pack;
  if (quantity) metadata.quantity = Number(quantity);
  if (price) metadata.price = Number(price);
  if (origin) metadata.origin = origin;

  return metadata;
}

export function FunnelTracker({ pageEvent, pageEvents = [] }: FunnelTrackerProps) {
  useEffect(() => {
    const initialEvents = [...(pageEvent ? [pageEvent] : []), ...pageEvents].map(normalizeEvent);
    for (const event of initialEvents) {
      sendEvent(event.eventName, event.target, event.metadata);
    }

    const viewed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const eventName = entry.target.getAttribute("data-funnel-view");
          if (!eventName || viewed.has(eventName)) continue;
          viewed.add(eventName);
          sendEvent(eventName, entry.target.id || undefined, readMetadata(entry.target));
        }
      },
      { threshold: 0.45 },
    );

    document.querySelectorAll("[data-funnel-view]").forEach((element) => observer.observe(element));

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest("[data-funnel-event]");
      const multiTarget = (event.target as Element | null)?.closest("[data-funnel-events]");
      const eventTarget = multiTarget ?? target;
      if (!eventTarget) return;

      const eventNames = [
        ...(eventTarget.getAttribute("data-funnel-events") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        eventTarget.getAttribute("data-funnel-event") ?? "",
      ].filter(Boolean);

      const uniqueEventNames = [...new Set(eventNames)];
      const metadata = readMetadata(eventTarget);
      for (const eventName of uniqueEventNames) {
        sendEvent(eventName, eventTarget.getAttribute("href") ?? eventTarget.textContent?.trim() ?? undefined, metadata);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick);
    };
  }, [pageEvent, pageEvents]);

  return null;
}
