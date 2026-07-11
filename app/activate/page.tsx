import { BrandLogo } from "@/components/brand/brand-logo";
import { ActivationForm } from "./activation-form";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="flex justify-center">
          <BrandLogo priority className="h-12" />
        </div>
        <ActivationForm error={params.error} />
      </div>
    </main>
  );
}
