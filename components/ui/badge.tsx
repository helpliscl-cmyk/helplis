import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
  green: "border-green-200 bg-green-50 text-green-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): keyof typeof tones {
  if (["ACTIVE", "ACTIVATED", "COMPLETED", "RECEIVED", "FOUND", "SENT", "SIMULATED"].includes(status)) {
    return "green";
  }
  if (["PENDING", "AVAILABLE", "RESERVED", "DRAFT", "VALIDATED"].includes(status)) return "blue";
  if (["LOST", "SUSPENDED", "PARTIALLY_RECEIVED"].includes(status)) return "amber";
  if (["DEACTIVATED", "DAMAGED", "FAILED", "BLOCKED"].includes(status)) return "red";
  return "neutral";
}
