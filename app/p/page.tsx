import { redirect } from "next/navigation";

export default async function PublicCodeRedirect({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  redirect(code ? `/p/${code.trim().toUpperCase()}` : "/");
}
