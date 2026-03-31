import { z } from "zod";

export const memberFieldsSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(10),
  pin: z.string().min(4).max(12),
  attendanceCode: z.string().min(4).max(32),
  isMarried: z.boolean().optional(),
  zellePhone: z.string().optional().nullable(),
  wifeZellePhone: z.string().optional().nullable(),
  bonusRecipient: z.enum(["SELF", "WIFE"]).optional(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateRegion: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

export const memberUpdateSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(10).optional(),
  pin: z.string().min(4).max(12).optional(),
  attendanceCode: z.string().min(4).max(32).optional(),
  isMarried: z.boolean().optional(),
  zellePhone: z.string().optional().nullable(),
  wifeZellePhone: z.string().optional().nullable(),
  bonusRecipient: z.enum(["SELF", "WIFE"]).optional(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateRegion: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  isApproved: z.boolean().optional(),
});
