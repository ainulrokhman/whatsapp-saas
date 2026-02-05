"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";
import { contactRepository } from "@/lib/repositories/contact-repository";
import {
  createContactSchema,
  updateContactSchema,
  contactIdSchema,
} from "@/lib/validations/contact";

async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { tenantId } = await getTenantContext(session);
  return tenantId;
}

export type ListContactsResult = {
  ok: true;
  contacts: Awaited<ReturnType<typeof contactRepository.findByTenant>>;
};
export type CreateContactResult = { ok: true; contactId: string } | { ok: false; error: string };
export type UpdateContactResult = { ok: true } | { ok: false; error: string };
export type DeleteContactResult = { ok: true } | { ok: false; error: string };

export async function listContacts(): Promise<
  ListContactsResult | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "contact:read");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };
  const contacts = await contactRepository.findByTenant(tenantId);
  return { ok: true, contacts };
}

export async function createContact(formData: FormData): Promise<CreateContactResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "contact:create");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = createContactSchema.safeParse({
    phone: formData.get("phone"),
    name: formData.get("name") || undefined,
    tag: formData.get("tag") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  try {
    const contact = await contactRepository.create({
      tenantId,
      phone: parsed.data.phone,
      name: parsed.data.name ?? null,
      tag: parsed.data.tag ?? null,
    });
    return { ok: true, contactId: contact.id };
  } catch (e) {
    return { ok: false, error: "Nomor sudah terdaftar untuk tenant ini" };
  }
}

export async function updateContact(
  contactId: string,
  formData: FormData
): Promise<UpdateContactResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "contact:update");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const idParsed = contactIdSchema.safeParse({ contactId });
  if (!idParsed.success) return { ok: false, error: "ID kontak tidak valid" };

  const parsed = updateContactSchema.safeParse({
    phone: formData.get("phone") || undefined,
    name: formData.get("name") !== null ? formData.get("name") : undefined,
    tag: formData.get("tag") !== null ? formData.get("tag") : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const contact = await contactRepository.findById(idParsed.data.contactId, tenantId);
  if (!contact) return { ok: false, error: "Kontak tidak ditemukan" };

  const data: { phone?: string; name?: string | null; tag?: string | null } = {};
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
  if (parsed.data.name !== undefined) data.name = parsed.data.name ?? null;
  if (parsed.data.tag !== undefined) data.tag = parsed.data.tag ?? null;

  try {
    await contactRepository.update(idParsed.data.contactId, tenantId, data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Gagal memperbarui (mungkin nomor duplikat)" };
  }
}

export async function deleteContact(contactId: string): Promise<DeleteContactResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "contact:delete");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = contactIdSchema.safeParse({ contactId });
  if (!parsed.success) return { ok: false, error: "ID kontak tidak valid" };

  const contact = await contactRepository.findById(parsed.data.contactId, tenantId);
  if (!contact) return { ok: false, error: "Kontak tidak ditemukan" };

  await contactRepository.delete(parsed.data.contactId, tenantId);
  return { ok: true };
}
