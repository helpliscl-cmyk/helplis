import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ href = "/", compact = false, className, priority }: BrandLogoProps) {
  const image = compact ? (
    <Image
      src="/brand/optimized/helplis-icon.webp"
      alt="HelPlis"
      width={779}
      height={1015}
      priority={priority}
      className={cn("h-10 w-auto", className)}
    />
  ) : (
    <Image
      src="/brand/optimized/helplis-logo-horizontal.webp"
      alt="HelPlis"
      width={1559}
      height={561}
      priority={priority}
      className={cn("h-10 w-auto", className)}
    />
  );

  return (
    <Link href={href} aria-label="HelPlis inicio" className="inline-flex items-center">
      {image}
    </Link>
  );
}

export function BrandMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/optimized/helplis-icon.webp"
      alt=""
      width={779}
      height={1015}
      priority={priority}
      className={cn("h-12 w-auto", className)}
    />
  );
}
