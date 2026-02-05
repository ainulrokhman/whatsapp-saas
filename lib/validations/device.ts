import { z } from "zod";

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
});

export const deviceIdSchema = z.object({
  deviceId: z.string().min(1, "Device ID wajib").cuid(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type DeviceIdParam = z.infer<typeof deviceIdSchema>;
