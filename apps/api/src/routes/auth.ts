import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
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

/**
 * INSECURE — password and PIN checks are disabled. Restore credential checks
 * before any production use.
 */
export const authRouter = Router();

const adminLoginBody = z.object({
  organizationSlug: z.string().min(1),
  password: z.string().optional(),
});

const memberLogin = z.object({
  phone: z.string().min(7),
  organizationSlug: z.string().min(1),
  pin: z.string().max(12).optional(),
});

authRouter.post("/admin", async (req, res) => {
  const parsed = adminLoginBody.safeParse(req.body);
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
  res.json({ token: signAdminToken(org.id) });
});

authRouter.post("/rabbi", async (req, res) => {
  const parsed = adminLoginBody.safeParse(req.body);
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
    where: { phone, organizationId: org.id },
  });
  if (!user) {
    res.status(401).json({ error: "Unknown phone number for this location." });
    return;
  }
  if (!user.isApproved) {
    res.status(403).json({
      error:
        "Account pending rabbi approval. You will receive access after the rabbi approves your registration.",
    });
    return;
  }
  res.json({ token: signMemberToken(user.id, org.id) });
});
