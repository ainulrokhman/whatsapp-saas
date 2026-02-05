"use server";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveTenantCookieName } from "@/lib/tenant";
import { tenantRepository } from "@/lib/repositories/tenant-repository";

export type SetActiveTenantResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Mengganti tenant aktif user. Hanya boleh ke tenant yang boleh diakses user.
 */
export async function setActiveTenant(
  tenantId: string
): Promise<SetActiveTenantResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const tenants = await tenantRepository.findAccessibleByUser(session.user.id);
  const allowed = tenants.some((t) => t.id === tenantId);
  if (!allowed) {
    return { ok: false, error: "Forbidden: tenant not accessible" };
  }

  const cookieStore = await cookies();
  cookieStore.set(getActiveTenantCookieName(), tenantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return { ok: true };
}
