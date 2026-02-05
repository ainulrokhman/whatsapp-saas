import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <UserMenu session={session} />
      </header>
      <p className="text-gray-600">Selamat datang, {session.user?.name ?? session.user?.email}.</p>
    </div>
  );
}
