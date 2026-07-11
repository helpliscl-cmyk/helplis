import Link from "next/link";
import { LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { loginAction } from "@/features/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
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
            <CardTitle>Iniciar sesion</CardTitle>
            <CardDescription>Accede para gestionar perfiles, dispositivos, contactos y privacidad.</CardDescription>
          </CardHeader>
          {params.error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Credenciales invalidas o usuario no activo.
            </p>
          ) : null}
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <Field label="Correo">
              <Input name="email" type="email" autoComplete="email" required defaultValue="admin@demo.helplis.cl" />
            </Field>
            <Field label="Contraseña">
              <Input name="password" type="password" autoComplete="current-password" required defaultValue="HelPlisDemo123!" />
            </Field>
            <Button type="submit">
              <LogIn aria-hidden className="h-4 w-4" />
              Entrar
            </Button>
          </form>
          <div className="mt-5 grid gap-2 text-sm text-[var(--brand-muted)]">
            <Link className="underline" href="/register">
              Crear cuenta
            </Link>
            <Link className="underline" href="/forgot-password">
              Recuperar contraseña
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
