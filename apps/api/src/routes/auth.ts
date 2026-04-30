import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { normalizePhone } from "../lib/phone.js";
import {
  signAdminToken,
  signMemberToken,
  signRabbiToken,
} from "../middleware/auth.js";
import {
  getEnvAdminPassword,
  normalizeAdminPasswordInput,
} from "../lib/envAdminPassword.js";
import {
  getOrganizationBySlug,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const authRouter = Router();

const adminLogin = z.object({
  password: z.string().min(1),
  organizationSlug: z.string().min(1),
});

const memberLogin = z.object({
  phone: z.string().min(7),
  pin: z.string().min(4).max(12),
  organizationSlug: z.string().min(1),
});

authRouter.post("/admin", async (req, res) => {
  const parsed = adminLogin.safeParse(req.body);
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

  const password = normalizeAdminPasswordInput(parsed.data.password);
  const expected = getEnvAdminPassword();
  if (!expected) {
    res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
    return;
  }
  if (password !== expected) {
    res.status(401).json({
      error:
        "Invalid password. The treasurer password is one value for the whole app (ADMIN_PASSWORD). On Render, open the Node API service (the one that runs the server — not the static site) → Environment → set or edit ADMIN_PASSWORD to exactly match what you type → Save, then wait until that service restarts.",
    });
    return;
  }
  res.json({ token: signAdminToken(org.id) });
});

/** Rabbi menu login (per location). Requires location rabbi setup. */
authRouter.post("/rabbi", async (req, res) => {
  const parsed = adminLogin.safeParse(req.body);
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

  const password = parsed.data.password.trim();
  if (!org.rabbiPasswordHash) {
    res.status(403).json({
      error: "Rabbi is not setup for this location yet. Ask admin to configure Rabbi setup.",
    });
    return;
  }
  const ok = await bcrypt.compare(password, org.rabbiPasswordHash);

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
    where: { phone, organizationId: org.id },
  });
  if (!user) {
    res.status(401).json({ error: "Unknown phone or PIN" });
    return;
  }
  const pinOk = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!pinOk) {
    res.status(401).json({ error: "Unknown phone or PIN" });
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
