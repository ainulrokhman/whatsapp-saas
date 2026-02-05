import type { Contact } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ContactCreateInput = {
  tenantId: string;
  phone: string;
  name?: string | null;
  tag?: string | null;
};

export type ContactUpdateInput = {
  phone?: string;
  name?: string | null;
  tag?: string | null;
};

export class ContactRepository {
  async findByTenant(tenantId: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByTag(tenantId: string, tag: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { tenantId, tag },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { id, tenantId },
    });
  }

  async create(data: ContactCreateInput): Promise<Contact> {
    return prisma.contact.create({
      data: {
        tenantId: data.tenantId,
        phone: data.phone,
        name: data.name ?? null,
        tag: data.tag ?? null,
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: ContactUpdateInput
  ): Promise<Contact> {
    return prisma.contact.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Contact> {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error("Contact not found");
    await prisma.contact.delete({ where: { id } });
    return existing;
  }
}

export const contactRepository = new ContactRepository();
