import { ActivationForm } from "./activation-form";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-8">
      <ActivationForm error={params.error} />
    </main>
  );
}
