import type { Device } from "@prisma/client";
import { prisma } from "@/lib/db";

export type DeviceCreateInput = {
  tenantId: string;
  name: string;
};

export type DeviceUpdateInput = {
  name?: string;
  status?: string;
  authStatePath?: string | null;
  phoneNumber?: string | null;
  lastActiveAt?: Date | null;
};

export class DeviceRepository {
  async findByTenant(tenantId: string): Promise<Device[]> {
    return prisma.device.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string): Promise<Device | null> {
    return prisma.device.findFirst({
      where: { id, tenantId },
    });
  }

  async create(data: DeviceCreateInput): Promise<Device> {
    return prisma.device.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        status: "disconnected",
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: DeviceUpdateInput
  ): Promise<Device> {
    return prisma.device.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Device> {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error("Device not found");
    await prisma.device.delete({ where: { id } });
    return existing;
  }
}

export const deviceRepository = new DeviceRepository();
