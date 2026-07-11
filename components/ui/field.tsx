import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--brand-text)]">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-[var(--brand-muted)]">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 rounded-md border border-[var(--brand-border)] bg-white px-3 py-2 text-base text-[var(--brand-text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-primary-light)] focus:ring-2 focus:ring-[var(--brand-primary-light)]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 rounded-md border border-[var(--brand-border)] bg-white px-3 py-2 text-base text-[var(--brand-text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-primary-light)] focus:ring-2 focus:ring-[var(--brand-primary-light)]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 rounded-md border border-[var(--brand-border)] bg-white px-3 py-2 text-base text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-primary-light)] focus:ring-2 focus:ring-[var(--brand-primary-light)]/20",
        className,
      )}
      {...props}
    />
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-[var(--brand-border)] bg-white p-3 text-sm text-[var(--brand-text)]">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary-dark)] focus:ring-[var(--brand-primary-light)]"
      />
      <span>{label}</span>
    </label>
  );
}
