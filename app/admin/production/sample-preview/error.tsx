"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SampleProductionPreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
          Volver a produccion
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Preview SAMPLE real</h1>
      </header>
      <Card className="border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-red-700" />
          <div className="grid gap-2">
            <p className="text-sm font-medium text-red-900">La preview SAMPLE no pudo cargarse.</p>
            <p className="text-sm text-red-800">{error.message || "Error inesperado al preparar candidatos."}</p>
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={reset}>
          <RefreshCcw aria-hidden className="h-4 w-4" />
          Reintentar
        </Button>
        <Link className="rounded-md border border-transparent px-4 py-2 text-sm text-[var(--brand-muted)] hover:bg-[#edf8fb]" href="/admin/production">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
