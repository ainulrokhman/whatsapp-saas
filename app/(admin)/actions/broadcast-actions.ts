"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";
import { deviceRepository } from "@/lib/repositories/device-repository";
import { contactRepository } from "@/lib/repositories/contact-repository";
import { broadcastLogRepository } from "@/lib/repositories/broadcast-log-repository";
import { sessionManager } from "@/lib/whatsapp/session-manager";
import { sendMessageSchema, broadcastSchema } from "@/lib/validations/broadcast";

async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { tenantId } = await getTenantContext(session);
  return tenantId;
}

export type SendSingleResult = { ok: true } | { ok: false; error: string };
export type StartBroadcastResult = { ok: true; logId: string } | { ok: false; error: string };
export type ListBroadcastLogsResult = {
  ok: true;
  logs: Awaited<ReturnType<typeof broadcastLogRepository.findByTenant>>;
};

export async function sendSingleMessage(
  deviceId: string,
  to: string,
  message: string
): Promise<SendSingleResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "message:send");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = sendMessageSchema.safeParse({ deviceId, to, message });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const device = await deviceRepository.findById(parsed.data.deviceId, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };

  const jid = to.includes("@") ? to : `${to.replace(/^\+/, "")}@s.whatsapp.net`;
  const sent = await sessionManager.sendText(parsed.data.deviceId, jid, parsed.data.message);
  if (!sent) return { ok: false, error: "Gagal mengirim (pastikan device connected)" };
  return { ok: true };
}

export async function startBroadcast(formData: FormData): Promise<StartBroadcastResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "broadcast:send");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const contactIdsRaw = formData.get("contactIds");
  const contactIds = contactIdsRaw
    ? (typeof contactIdsRaw === "string" ? contactIdsRaw.split(",") : [])
    : undefined;
  const parsed = broadcastSchema.safeParse({
    deviceId: formData.get("deviceId"),
    message: formData.get("message"),
    contactIds: contactIds?.length ? contactIds : undefined,
    tag: formData.get("tag") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const device = await deviceRepository.findById(parsed.data.deviceId!, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };
  if (device.status !== "connected") {
    return { ok: false, error: "Device harus dalam status connected" };
  }

  let contacts: { id: string; phone: string }[];
  if (parsed.data.contactIds?.length) {
    const list = await Promise.all(
      parsed.data.contactIds.map((id) => contactRepository.findById(id, tenantId))
    );
    contacts = list.filter((c): c is NonNullable<typeof c> => c != null).map((c) => ({ id: c.id, phone: c.phone }));
  } else if (parsed.data.tag) {
    const list = await contactRepository.findByTag(tenantId, parsed.data.tag);
    contacts = list.map((c) => ({ id: c.id, phone: c.phone }));
  } else {
    return { ok: false, error: "Pilih kontak (contactIds) atau tag" };
  }

  if (contacts.length === 0) {
    return { ok: false, error: "Tidak ada kontak untuk dikirim" };
  }

  const log = await broadcastLogRepository.create({
    tenantId,
    deviceId: parsed.data.deviceId!,
    message: parsed.data.message,
    recipientCount: contacts.length,
  });

  setImmediate(async () => {
    try {
      await broadcastLogRepository.update(log.id, tenantId, {
        status: "running",
        startedAt: new Date(),
      });
      let success = 0;
      let fail = 0;
      const jid = (phone: string) =>
        phone.includes("@") ? phone : `${phone.replace(/^\+/, "")}@s.whatsapp.net`;
      for (const c of contacts) {
        const sent = await sessionManager.sendText(
          parsed.data.deviceId!,
          jid(c.phone),
          parsed.data.message
        );
        if (sent) success++;
        else fail++;
      }
      await broadcastLogRepository.update(log.id, tenantId, {
        status: "completed",
        successCount: success,
        failCount: fail,
        completedAt: new Date(),
      });
    } catch (e) {
      await broadcastLogRepository.update(log.id, tenantId, {
        status: "failed",
        completedAt: new Date(),
      });
    }
  });

  return { ok: true, logId: log.id };
}

export async function listBroadcastLogs(): Promise<
  ListBroadcastLogsResult | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "broadcast:read");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };
  const logs = await broadcastLogRepository.findByTenant(tenantId);
  return { ok: true, logs };
}
