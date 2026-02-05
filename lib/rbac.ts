import type { Session } from "next-auth";
import { prisma } from "@/lib/db";

export type PermissionName =
  | "device:create"
  | "device:read"
  | "device:update"
  | "device:delete"
  | "message:send"
  | "broadcast:send"
  | "broadcast:read"
  | "contact:create"
  | "contact:read"
  | "contact:update"
  | "contact:delete"
  | "user:manage"
  | "tenant:settings"
  | "tenant:read";

/**
 * Mengambil daftar permission names untuk user (dari semua role-nya).
 * Untuk super_admin (UserRole.tenantId null) mengembalikan semua permission.
 * Untuk tenant scope: hanya role yang tenantId-nya cocok atau null (global) yang dihitung.
 */
export async function getPermissionsForUser(
  userId: string,
  tenantId?: string | null
): Promise<PermissionName[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(tenantId != null
        ? { OR: [{ tenantId: null }, { tenantId }] }
        : {}),
    },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const permissionNames = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) {
      permissionNames.add(rp.permission.name);
    }
  }

  // super_admin punya semua permission
  const roleNames = userRoles.map((ur) => ur.role.name);
  if (roleNames.includes("super_admin")) {
    const allPerms = await prisma.permission.findMany({
      select: { name: true },
    });
    allPerms.forEach((p) => permissionNames.add(p.name));
  }

  return Array.from(permissionNames) as PermissionName[];
}

export function hasPermission(
  userPermissions: PermissionName[],
  required: PermissionName
): boolean {
  return userPermissions.includes(required);
}

/**
 * Memastikan user punya permission. Untuk dipanggil di Server Action atau API route.
 * Mengembalikan { ok: true } atau { ok: false, status: 403, message }.
 */
export async function requirePermission(
  session: Session | null,
  permission: PermissionName,
  tenantId?: string | null
): Promise<
  | { ok: true; userId: string; permissions: PermissionName[] }
  | { ok: false; status: 403; message: string }
> {
  if (!session?.user?.id) {
    return { ok: false, status: 403, message: "Unauthorized" };
  }
  const permissions = await getPermissionsForUser(session.user.id, tenantId ?? undefined);
  if (!hasPermission(permissions, permission)) {
    return { ok: false, status: 403, message: "Forbidden: permission denied" };
  }
  return { ok: true, userId: session.user.id, permissions };
}

/**
 * Helper untuk Server Component / layout: ambil permissions user dari session.
 */
export async function getSessionPermissions(
  session: Session | null,
  tenantId?: string | null
): Promise<PermissionName[]> {
  if (!session?.user?.id) return [];
  return getPermissionsForUser(session.user.id, tenantId ?? undefined);
}

/**
 * Mengembalikan tenantIds yang boleh diakses user (untuk filter query).
 * super_admin: null = semua tenant. Bukan super_admin: array tenantId.
 */
export async function getAccessibleTenantIds(userId: string): Promise<string[] | null> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  const isSuperAdmin = userRoles.some((ur) => ur.role.name === "super_admin");
  if (isSuperAdmin) return null; // null = no filter, akses semua
  const ids = userRoles
    .map((ur) => ur.tenantId)
    .filter((id): id is string => id != null);
  return [...new Set(ids)];
}
