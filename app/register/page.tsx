import Link from "next/link";
import { registerAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Cuenta local provisional. Supabase Auth se conectará en una fase posterior.</CardDescription>
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
          <Button type="submit">Crear cuenta</Button>
        </form>
        <p className="mt-5 text-sm text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}
