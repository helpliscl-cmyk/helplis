import { Card } from "@/components/ui/card";

export default function AdminErrorsPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Errores</h1>
      <Card>
        <p className="text-sm leading-6 text-neutral-600">
          El MVP registra errores de importación, intentos de activación fallidos y eventos locales. Un proveedor externo
          como Sentry puede conectarse usando `SENTRY_DSN` cuando el proyecto pase a producción.
        </p>
      </Card>
    </div>
  );
}
