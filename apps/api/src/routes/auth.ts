import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { timingSafeEqualString } from "../lib/timingSafeString.js";
import { normalizePhone } from "../lib/phone.js";
import {
  signAdminToken,
  signMemberToken,
  signRabbiToken,
} from "../middleware/auth.js";
import {
  getOrganizationBySlug,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const authRouter = Router();

const adminLoginBody = z.object({
  organizationSlug: z.string().optional(),
  password: z.string().min(1),
});

const rabbiLoginBody = z.object({
  organizationSlug: z.string().min(1),
  password: z.string().min(1),
});

const memberLogin = z.object({
  phone: z.string().min(7),
  organizationSlug: z.string().min(1),
  pin: z.string().min(4).max(12),
});

authRouter.post("/admin", async (req, res) => {
  const parsed = adminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const submitted = parsed.data.password.trim();
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!submitted || !expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!timingSafeEqualString(submitted, expected)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  let org = null;
  const rawSlug = parsed.data.organizationSlug?.trim();
  if (rawSlug) {
    const slug = normalizeOrgSlug(rawSlug);
    if (!slug) {
      res.status(400).json({ error: "Invalid organization slug." });
      return;
    }
    org = await getOrganizationBySlug(slug);
    if (!org) {
      res.status(404).json({ error: "Unknown organization." });
      return;
    }
  } else {
    org = await prisma.organization.findFirst({ orderBy: { slug: "asc" } });
    if (!org) {
      res.status(404).json({ error: "No organization configured." });
      return;
    }
  }
  res.json({ token: signAdminToken(org.id), organizationSlug: org.slug });
});

authRouter.post("/rabbi", async (req, res) => {
  const parsed = rabbiLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const slug = normalizeOrgSlug(parsed.data.organizationSlug);
  if (!slug) {
    res.status(400).json({ error: "Invalid organization slug." });
    return;
  }
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      rabbiPasswordHash: true,
    },
  });
  if (!org) {
    res.status(404).json({ error: "Unknown organization." });
    return;
  }

  const password = parsed.data.password.trim();
  let ok = false;
  if (org.rabbiPasswordHash) {
    ok = await bcrypt.compare(password, org.rabbiPasswordHash);
  } else {
    const fallback = process.env.RABBI_PASSWORD?.trim();
    if (fallback) {
      ok = timingSafeEqualString(password, fallback);
    }
  }
  if (!ok) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ token: signRabbiToken(org.id) });
});

authRouter.post("/member", async (req, res) => {
  const parsed = memberLogin.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const slug = normalizeOrgSlug(parsed.data.organizationSlug);
  if (!slug) {
    res.status(400).json({ error: "Invalid organization slug." });
    return;
  }
  const org = await getOrganizationBySlug(slug);
  if (!org) {
    res.status(404).json({ error: "Unknown organization." });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);
  const user = await prisma.user.findFirst({
    where: { phone, organizationId: org.id, isApproved: true },
  });
  if (!user) {
    res.status(401).json({ error: "Invalid phone or PIN." });
    return;
  }
  const pinMatch = await bcrypt.compare(parsed.data.pin.trim(), user.pinHash);
  if (!pinMatch) {
    res.status(401).json({ error: "Invalid PIN" });
    return;
  }
  res.json({ token: signMemberToken(user.id, org.id) });
});
