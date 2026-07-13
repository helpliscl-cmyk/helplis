import { Card } from "@/components/ui/card";

export default function SampleProductionPreviewLoading() {
  return (
    <div className="grid gap-5">
      <header>
        <div className="h-4 w-36 rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-64 rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-neutral-200" />
      </header>
      <Card className="grid gap-3">
        <p className="text-sm font-medium text-neutral-700">Generando preview SAMPLE...</p>
        <div className="h-32 rounded-md bg-neutral-100" />
      </Card>
    </div>
  );
}
