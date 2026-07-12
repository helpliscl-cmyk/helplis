import Link from "next/link";
import { UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { registerAction } from "@/features/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="brand-gradient grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-md gap-5">
        <div className="flex justify-center">
          <BrandLogo priority className="h-12" />
        </div>
        <Card className="w-full p-5">
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Comienza con los datos del responsable. Luego podrás activar una pulsera o tag.</CardDescription>
          </CardHeader>
          {params.error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              No se pudo crear la cuenta. Revisa los datos o usa otro correo.
            </p>
          ) : null}
          <form action={registerAction} className="grid gap-4">
            <Field label="Nombre">
              <Input name="name" autoComplete="name" required />
            </Field>
            <Field label="Correo">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Teléfono">
              <Input name="phone" type="tel" autoComplete="tel" />
            </Field>
            <Field label="Contraseña" hint="Mínimo 10 caracteres.">
              <Input name="password" type="password" autoComplete="new-password" required />
            </Field>
            <Button type="submit">
              <UserPlus aria-hidden className="h-4 w-4" />
              Crear cuenta
            </Button>
          </form>
          <p className="mt-5 text-sm text-[var(--brand-muted)]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
