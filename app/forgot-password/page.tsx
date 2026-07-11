import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperación simulada</CardTitle>
          <CardDescription>
            Este MVP registra el flujo visual; el envío real se conectará con un proveedor externo.
          </CardDescription>
        </CardHeader>
        <form className="grid gap-4">
          <Field label="Correo">
            <Input name="email" type="email" required />
          </Field>
          <Button type="submit" disabled>
            Envío real pendiente
          </Button>
        </form>
        <Link href="/login" className="mt-5 inline-block text-sm text-neutral-600 underline">
          Volver al login
        </Link>
      </Card>
    </main>
  );
}
