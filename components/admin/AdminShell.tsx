"use client";

import type { Session } from "next-auth";
import type { TenantRecord } from "@/lib/repositories/tenant-repository";
import type { PermissionName } from "@/lib/rbac";
import { PermissionsProvider } from "@/components/providers/PermissionsProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminShell({
  session,
  tenantId,
  tenants,
  permissions,
  children,
}: {
  session: Session | null;
  tenantId: string | null;
  tenants: TenantRecord[];
  permissions: PermissionName[];
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider permissions={permissions}>
      <div className="min-h-screen bg-background">
        <Sidebar permissions={permissions} />
        <div className="md:pl-64">
          <Header
            session={session}
            tenantId={tenantId}
            tenants={tenants}
          />
          <main
            className="p-4 md:p-6"
            style={{ padding: "var(--content-padding, 1.5rem)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
