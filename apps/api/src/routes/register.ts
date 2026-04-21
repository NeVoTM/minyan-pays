import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { normalizePhone } from "../lib/phone.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  assertNoMemberDuplicates,
  DuplicateMemberError,
} from "../lib/memberDuplicates.js";
import { Prisma } from "@prisma/client";
import { generateUniqueAttendanceCode } from "../lib/attendanceCode.js";
import { registerMemberSchema } from "../lib/memberSchemas.js";
import {
  getOrganizationBySlug,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const registerRouter = Router();

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

registerRouter.post("/", async (req, res) => {
  const parsed = registerMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const slug = normalizeOrgSlug(d.organizationSlug);
  if (!slug) {
    res.status(400).json({ error: "Invalid organization slug." });
    return;
  }
  const org = await getOrganizationBySlug(slug);
  if (!org) {
    res.status(404).json({ error: "Unknown organization." });
    return;
  }

  const phone = normalizePhone(d.phone);
  try {
    await assertNoMemberDuplicates(prisma, {
      organizationId: org.id,
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

  const requestedCode = d.attendanceCode?.trim();
  let attendanceCode: string;
  if (requestedCode && requestedCode.length >= 4) {
    const taken = await prisma.user.findFirst({
      where: { organizationId: org.id, attendanceCode: requestedCode },
      select: { id: true },
    });
    if (taken) {
      res.status(409).json({
        error:
          "That attendance code is already in use. Choose another or leave the field blank for an auto-assigned code.",
      });
      return;
    }
    attendanceCode = requestedCode;
  } else if (requestedCode && requestedCode.length > 0) {
    res.status(400).json({
      error:
        "Attendance code must be at least 4 characters, or leave blank for an auto-assigned code.",
    });
    return;
  } else {
    attendanceCode = await generateUniqueAttendanceCode(prisma, org.id);
  }

  const pinHash = await bcrypt.hash(d.pin, 10);
  try {
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        firstName: d.firstName.trim(),
        lastName: d.lastName.trim(),
        phone,
        pinHash,
        attendanceCode,
        isMarried: d.isMarried ?? false,
        zellePhone: trimOrNull(d.zellePhone ?? undefined),
        wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
        bonusRecipient: d.bonusRecipient ?? "WIFE",
        addressLine1: d.addressLine1.trim(),
        addressLine2: trimOrNull(d.addressLine2 ?? undefined),
        city: d.city.trim(),
        stateRegion: d.stateRegion.trim(),
        postalCode: d.postalCode.trim(),
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
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      res.status(409).json({
        error:
          "That attendance code is already in use. Choose another or leave blank for an auto-assigned code.",
      });
      return;
    }
    const msg = e instanceof Error ? e.message : "Registration failed";
    res.status(409).json({ error: msg });
  }
});
