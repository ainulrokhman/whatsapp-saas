import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground">WhatsApp SaaS</h1>
      <p className="text-muted-foreground">
        Multi-tenant WhatsApp management. Masuk untuk mengakses dashboard.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-sidebar-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Masuk
      </Link>
    </div>
  );
}
