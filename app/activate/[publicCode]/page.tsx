import { BrandLogo } from "@/components/brand/brand-logo";
import { ActivationForm } from "../activation-form";

export default async function ActivatePublicCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ publicCode }, query] = await Promise.all([params, searchParams]);
  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="flex justify-center">
          <BrandLogo priority className="h-12" />
        </div>
        <ActivationForm publicCode={publicCode.toUpperCase()} error={query.error} />
      </div>
    </main>
  );
}
