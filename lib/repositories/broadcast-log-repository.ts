import type { BroadcastLog } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BroadcastLogCreateInput = {
  tenantId: string;
  deviceId: string | null;
  message: string;
  recipientCount: number;
};

export class BroadcastLogRepository {
  async create(data: BroadcastLogCreateInput): Promise<BroadcastLog> {
    return prisma.broadcastLog.create({
      data: {
        tenantId: data.tenantId,
        deviceId: data.deviceId,
        message: data.message,
        recipientCount: data.recipientCount,
        status: "pending",
      },
    });
  }

  async findById(id: string, tenantId: string): Promise<BroadcastLog | null> {
    return prisma.broadcastLog.findFirst({
      where: { id, tenantId },
    });
  }

  async findByTenant(tenantId: string, limit = 50): Promise<BroadcastLog[]> {
    return prisma.broadcastLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      status?: string;
      successCount?: number;
      failCount?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
    }
  ): Promise<BroadcastLog> {
    const existing = await prisma.broadcastLog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error("BroadcastLog not found");
    return prisma.broadcastLog.update({
      where: { id },
      data,
    });
  }
}

export const broadcastLogRepository = new BroadcastLogRepository();
