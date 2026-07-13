import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export async function POST() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
