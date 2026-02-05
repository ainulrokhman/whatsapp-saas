import { z } from "zod";

export const sendMessageSchema = z.object({
  deviceId: z.string().min(1).cuid(),
  to: z.string().min(10, "Nomor minimal 10 digit"),
  message: z.string().min(1, "Pesan wajib diisi").max(4096),
});

export const broadcastSchema = z.object({
  deviceId: z.string().min(1).cuid(),
  message: z.string().min(1, "Pesan wajib diisi").max(4096),
  contactIds: z.array(z.string().cuid()).optional(),
  tag: z.string().max(50).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
