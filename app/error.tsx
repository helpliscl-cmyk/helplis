"use client";

import { RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="brand-gradient grid min-h-screen place-items-center px-4 py-8">
      <Card className="grid max-w-md gap-4 p-5 text-center">
        <div className="flex justify-center">
          <BrandLogo className="h-11" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Algo no respondió como esperábamos</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            Puedes reintentar o contactar soporte si estabas activando una pulsera o revisando una ficha pública.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={reset}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Reintentar
          </Button>
          <ButtonLink href="/support" variant="secondary">
            Soporte
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
