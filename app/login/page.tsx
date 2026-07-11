import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Autenticación local provisional para desarrollo.</CardDescription>
        </CardHeader>
        {params.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Credenciales inválidas o usuario no activo.
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
          <Button type="submit">Entrar</Button>
        </form>
        <div className="mt-5 grid gap-2 text-sm text-neutral-600">
          <Link className="underline" href="/register">
            Crear cuenta
          </Link>
          <Link className="underline" href="/forgot-password">
            Recuperar contraseña
          </Link>
        </div>
      </Card>
    </main>
  );
}
