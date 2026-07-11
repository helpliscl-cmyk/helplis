import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border-[var(--brand-primary-dark)] bg-[var(--brand-primary-dark)] text-white hover:bg-[#082b5d]",
  secondary: "border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:bg-[#edf8fb]",
  accent: "border-[var(--brand-primary-light)] bg-[var(--brand-primary-light)] text-[var(--brand-text)] hover:bg-[#19d0c5]",
  danger: "border-[var(--brand-danger)] bg-[var(--brand-danger)] text-white hover:bg-[#a93430]",
  ghost: "border-transparent bg-transparent text-[var(--brand-muted)] hover:bg-[#edf8fb]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:ring-offset-2",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
