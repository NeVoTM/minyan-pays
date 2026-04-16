import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { normalizePhone } from "../lib/phone.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  assertNoMemberDuplicates,
  DuplicateMemberError,
} from "../lib/memberDuplicates.js";
import { memberFieldsSchema } from "../lib/memberSchemas.js";

export const registerRouter = Router();

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

registerRouter.post("/", async (req, res) => {
  const parsed = memberFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  try {
    await assertNoMemberDuplicates(prisma, {
      firstName: d.firstName,
      lastName: d.lastName,
      phone,
      zellePhone: trimOrNull(d.zellePhone ?? undefined),
      wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
    });
  } catch (e: unknown) {
    if (e instanceof DuplicateMemberError) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw e;
  }

  const pinHash = await bcrypt.hash(d.pin, 10);
  try {
    const user = await prisma.user.create({
      data: {
        firstName: d.firstName.trim(),
        lastName: d.lastName.trim(),
        phone,
        pinHash,
        attendanceCode: d.attendanceCode.trim(),
        isMarried: d.isMarried ?? false,
        zellePhone: trimOrNull(d.zellePhone ?? undefined),
        wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
        bonusRecipient: d.bonusRecipient ?? "WIFE",
        addressLine1: trimOrNull(d.addressLine1 ?? undefined),
        addressLine2: trimOrNull(d.addressLine2 ?? undefined),
        city: trimOrNull(d.city ?? undefined),
        stateRegion: trimOrNull(d.stateRegion ?? undefined),
        postalCode: trimOrNull(d.postalCode ?? undefined),
        email: d.email ?? null,
        isApproved: false,
      },
    });
    res.status(201).json({
      message:
        "Registration received. The rabbi will approve your account before you can sign in or punch in.",
      id: user.id,
      displayName: fullName(user.firstName, user.lastName),
      attendanceCode: user.attendanceCode,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    res.status(409).json({ error: msg });
  }
});
