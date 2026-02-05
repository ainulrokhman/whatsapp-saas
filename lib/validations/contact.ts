import { z } from "zod";

const phoneRegex = /^\+?[0-9]{10,15}$/;

export const createContactSchema = z.object({
  phone: z.string().min(10, "Nomor minimal 10 digit").regex(phoneRegex, "Format nomor tidak valid"),
  name: z.string().max(100).optional(),
  tag: z.string().max(50).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactIdSchema = z.object({
  contactId: z.string().min(1).cuid(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactIdParam = z.infer<typeof contactIdSchema>;
