import { cookies } from "next/headers";
import type { Session } from "next-auth";
import { tenantRepository } from "@/lib/repositories/tenant-repository";
import type { TenantRecord } from "@/lib/repositories/tenant-repository";

const ACTIVE_TENANT_COOKIE = "active-tenant-id";

export type TenantContext = {
  tenantId: string | null;
  tenants: TenantRecord[];
};

/**
 * Mengambil konteks tenant aktif untuk user: daftar tenant yang boleh diakses
 * dan tenant yang sedang dipilih (dari cookie atau default tenant pertama).
 */
export async function getTenantContext(
  session: Session | null
): Promise<TenantContext> {
  if (!session?.user?.id) {
    return { tenantId: null, tenants: [] };
  }

  const tenants = await tenantRepository.findAccessibleByUser(session.user.id);
  if (tenants.length === 0) {
    return { tenantId: null, tenants: [] };
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const allowedIds = new Set(tenants.map((t) => t.id));
  const tenantId =
    activeId && allowedIds.has(activeId) ? activeId : tenants[0]!.id;

  return { tenantId, tenants };
}

export function getActiveTenantCookieName(): string {
  return ACTIVE_TENANT_COOKIE;
}
