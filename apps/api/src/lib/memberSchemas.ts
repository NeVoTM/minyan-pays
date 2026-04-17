import { z } from "zod";

const optionalText = z.preprocess((v) => {
  if (v == null || v === "") return null;
  const t = String(v).trim();
  return t || null;
}, z.union([z.null(), z.string().max(500)]));

const optionalEmail = z.preprocess((v) => {
  if (v == null || v === "") return null;
  const t = String(v).trim();
  return t || null;
}, z.union([z.null(), z.string().max(200).email()]));

const optionalAddressLine = z.preprocess((v) => {
  if (v == null || v === "") return null;
  const t = String(v).trim();
  return t || null;
}, z.union([z.null(), z.string().max(100)]));

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
  addressLine1: optionalAddressLine.optional(),
  addressLine2: optionalAddressLine.optional(),
  city: z.string().max(80).optional().nullable(),
  stateRegion: z.string().max(32).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  email: optionalEmail.optional(),
  spousePhone: optionalText.optional(),
  spouseEmail: optionalEmail.optional(),
  paypalAccount: optionalText.optional(),
  achRoutingNumber: optionalText.optional(),
  achAccountNumber: optionalText.optional(),
});

/** Public registration: attendance code optional — server assigns if omitted. */
export const registerMemberSchema = memberFieldsSchema
  .omit({ attendanceCode: true })
  .extend({
    attendanceCode: z.preprocess(
      (v) => (v == null || v === "" ? undefined : String(v).trim()),
      z.union([z.undefined(), z.string().min(4).max(32)])
    ),
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
  addressLine1: optionalAddressLine.optional(),
  addressLine2: optionalAddressLine.optional(),
  city: z.string().max(80).optional().nullable(),
  stateRegion: z.string().max(32).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  email: optionalEmail.optional(),
  spousePhone: optionalText.optional(),
  spouseEmail: optionalEmail.optional(),
  paypalAccount: optionalText.optional(),
  achRoutingNumber: optionalText.optional(),
  achAccountNumber: optionalText.optional(),
  isApproved: z.boolean().optional(),
});

/** Member self-service: no PIN, attendance code, or approval flag. */
export const memberSelfUpdateSchema = memberUpdateSchema.omit({
  pin: true,
  attendanceCode: true,
  isApproved: true,
});
