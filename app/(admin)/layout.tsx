import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { getSessionPermissions } from "@/lib/rbac";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { tenantId, tenants } = await getTenantContext(session);
  if (tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">
          Anda tidak memiliki akses ke workspace. Hubungi admin.
        </p>
      </div>
    );
  }

  const permissions = await getSessionPermissions(session, tenantId);

  return (
    <AdminShell
      session={session}
      tenantId={tenantId}
      tenants={tenants}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
