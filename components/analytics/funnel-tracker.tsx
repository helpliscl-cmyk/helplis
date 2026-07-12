"use client";

import { useEffect } from "react";

type FunnelTrackerProps = {
  pageEvent?: string;
};

function sendEvent(eventName: string, target?: string) {
  const payload = JSON.stringify({
    eventName,
    path: window.location.pathname,
    target,
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

export function FunnelTracker({ pageEvent }: FunnelTrackerProps) {
  useEffect(() => {
    if (pageEvent) sendEvent(pageEvent);

    const viewed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const eventName = entry.target.getAttribute("data-funnel-view");
          if (!eventName || viewed.has(eventName)) continue;
          viewed.add(eventName);
          sendEvent(eventName, entry.target.id || undefined);
        }
      },
      { threshold: 0.45 },
    );

    document.querySelectorAll("[data-funnel-view]").forEach((element) => observer.observe(element));

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest("[data-funnel-event]");
      if (!target) return;
      const eventName = target.getAttribute("data-funnel-event");
      if (!eventName) return;
      sendEvent(eventName, target.getAttribute("href") ?? target.textContent?.trim() ?? undefined);
    };

    document.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick);
    };
  }, [pageEvent]);

  return null;
}
