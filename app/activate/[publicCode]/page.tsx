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
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <ActivationForm publicCode={publicCode.toUpperCase()} error={query.error} />
    </main>
  );
}
