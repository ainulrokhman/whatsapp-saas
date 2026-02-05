"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";
import { deviceRepository } from "@/lib/repositories/device-repository";
import { sessionManager } from "@/lib/whatsapp/session-manager";
import { createDeviceSchema, deviceIdSchema } from "@/lib/validations/device";

export type ListDevicesResult = { ok: true; devices: Awaited<ReturnType<typeof deviceRepository.findByTenant>> };
export type CreateDeviceResult = { ok: true; deviceId: string } | { ok: false; error: string };
export type DeviceStatusResult = { ok: true; status: string; qr: string | null; phoneNumber: string | null } | { ok: false; error: string };
export type UpdateDeviceResult = { ok: true } | { ok: false; error: string };
export type DeleteDeviceResult = { ok: true } | { ok: false; error: string };

async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { tenantId } = await getTenantContext(session);
  return tenantId;
}

export async function listDevices(): Promise<ListDevicesResult | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:read");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };
  const devices = await deviceRepository.findByTenant(tenantId);
  return { ok: true, devices };
}

export async function createDevice(formData: FormData): Promise<CreateDeviceResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:create");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = createDeviceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const device = await deviceRepository.create({
    tenantId,
    name: parsed.data.name,
  });
  const authStatePath = sessionManager.getAuthStatePathForDevice(device.id);
  await deviceRepository.update(device.id, tenantId, { authStatePath });

  sessionManager.startSession(device.id, undefined, (status, phoneNumber) => {
    void deviceRepository.update(device.id, tenantId, {
      status,
      phoneNumber: phoneNumber ?? undefined,
      lastActiveAt: status === "connected" ? new Date() : undefined,
    });
  });

  return { ok: true, deviceId: device.id };
}

export async function startDeviceSession(deviceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:read");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = deviceIdSchema.safeParse({ deviceId });
  if (!parsed.success) return { ok: false, error: "Device ID tidak valid" };

  const device = await deviceRepository.findById(parsed.data.deviceId, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };

  if (sessionManager.hasSession(parsed.data.deviceId)) return { ok: true };

  sessionManager.startSession(parsed.data.deviceId, undefined, (status, phoneNumber) => {
    void deviceRepository.update(parsed.data.deviceId, tenantId, {
      status,
      phoneNumber: phoneNumber ?? undefined,
      lastActiveAt: status === "connected" ? new Date() : undefined,
    });
  });
  return { ok: true };
}

export async function getDeviceStatus(deviceId: string): Promise<DeviceStatusResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:read");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = deviceIdSchema.safeParse({ deviceId });
  if (!parsed.success) return { ok: false, error: "Device ID tidak valid" };

  const device = await deviceRepository.findById(parsed.data.deviceId, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };

  const state = sessionManager.getState(parsed.data.deviceId);
  if (!state) {
    return {
      ok: true,
      status: device.status,
      qr: null,
      phoneNumber: device.phoneNumber ?? null,
    };
  }
  return {
    ok: true,
    status: state.status,
    qr: state.qr,
    phoneNumber: state.phoneNumber ?? device.phoneNumber ?? null,
  };
}

export async function updateDevice(deviceId: string, formData: FormData): Promise<UpdateDeviceResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:update");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = deviceIdSchema.safeParse({ deviceId });
  if (!parsed.success) return { ok: false, error: "Device ID tidak valid" };

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return { ok: false, error: "Nama wajib diisi" };

  const device = await deviceRepository.findById(parsed.data.deviceId, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };

  await deviceRepository.update(parsed.data.deviceId, tenantId, { name: name.trim() });
  return { ok: true };
}

export async function deleteDevice(deviceId: string): Promise<DeleteDeviceResult> {
  const session = await getServerSession(authOptions);
  const check = await requirePermission(session, "device:delete");
  if (!check.ok) return { ok: false, error: check.message };
  const tenantId = await getTenantId();
  if (!tenantId) return { ok: false, error: "Tenant tidak ditemukan" };

  const parsed = deviceIdSchema.safeParse({ deviceId });
  if (!parsed.success) return { ok: false, error: "Device ID tidak valid" };

  const device = await deviceRepository.findById(parsed.data.deviceId, tenantId);
  if (!device) return { ok: false, error: "Device tidak ditemukan" };

  await sessionManager.stopSession(parsed.data.deviceId);
  await deviceRepository.delete(parsed.data.deviceId, tenantId);
  return { ok: true };
}
