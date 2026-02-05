import { prisma } from "@/lib/db";
import { getAccessibleTenantIds } from "@/lib/rbac";

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
};

export class TenantRepository {
  async findById(id: string): Promise<TenantRecord | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    return tenant;
  }

  /**
   * Mengembalikan daftar tenant yang boleh diakses user.
   * Super_admin: semua tenant. Lainnya: hanya tenant dari UserRole.
   */
  async findAccessibleByUser(userId: string): Promise<TenantRecord[]> {
    const ids = await getAccessibleTenantIds(userId);
    if (ids === null) {
      return prisma.tenant.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      });
    }
    if (ids.length === 0) return [];
    return prisma.tenant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  }
}

export const tenantRepository = new TenantRepository();
