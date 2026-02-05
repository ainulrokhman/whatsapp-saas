"use client";

import type { Session } from "next-auth";
import type { TenantRecord } from "@/lib/repositories/tenant-repository";
import { UserMenu } from "@/components/auth/UserMenu";
import { Breadcrumb } from "./Breadcrumb";
import { TenantSwitcher } from "./TenantSwitcher";

export function Header({
  session,
  tenantId,
  tenants,
}: {
  session: Session | null;
  tenantId: string | null;
  tenants: TenantRecord[];
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-header-border bg-header-bg px-4 backdrop-blur supports-backdrop-filter:bg-header-bg/95">
      <div className="flex items-center gap-4">
        <Breadcrumb />
        {tenants.length > 1 && (
          <TenantSwitcher
            tenantId={tenantId}
            tenants={tenants}
          />
        )}
      </div>
      <UserMenu session={session} />
    </header>
  );
}
