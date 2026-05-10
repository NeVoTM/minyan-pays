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
  signShamoshToken,
} from "../middleware/auth.js";
import { getBootstrapAdminPlaintext } from "../lib/bootstrapAdminPassword.js";
import {
  getOrganizationBySlug,
  normalizeOrgSlug,
} from "../lib/organizationService.js";
import { getGlobalAdminPasswordHash } from "../lib/settings.js";

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
  if (!submitted) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const orgSelect = { id: true, slug: true, adminPasswordHash: true } as const;
  let org: { id: string; slug: string; adminPasswordHash: string | null } | null =
    null;
  const rawSlug = parsed.data.organizationSlug?.trim();
  if (rawSlug) {
    const slug = normalizeOrgSlug(rawSlug);
    if (!slug) {
      res.status(400).json({ error: "Invalid organization slug." });
      return;
    }
    org = await prisma.organization.findUnique({
      where: { slug },
      select: orgSelect,
    });
    if (!org) {
      res.status(404).json({ error: "Unknown organization." });
      return;
    }
  } else {
    org = await prisma.organization.findFirst({
      orderBy: { slug: "asc" },
      select: orgSelect,
    });
    if (!org) {
      res.status(404).json({ error: "No organization configured." });
      return;
    }
  }

  let adminMustChangePassword = false;
  let authenticated = false;

  // Per-organization admin password (highest priority).
  if (org.adminPasswordHash) {
    if (await bcrypt.compare(submitted, org.adminPasswordHash)) {
      authenticated = true;
    }
  }

  // Global admin password — works on every org. Lets one master credential
  // open any location's admin panel without per-org rotation.
  if (!authenticated) {
    const globalHash = await getGlobalAdminPasswordHash();
    if (globalHash && (await bcrypt.compare(submitted, globalHash))) {
      authenticated = true;
    }
  }

  // Bootstrap fallback — only when this org has no per-org hash. Forces
  // mustChangePassword so the admin sets a real per-org password right after.
  if (!authenticated && !org.adminPasswordHash) {
    const bootstrap = getBootstrapAdminPlaintext();
    if (timingSafeEqualString(submitted, bootstrap)) {
      authenticated = true;
      adminMustChangePassword = true;
    }
  }

  if (!authenticated) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({
    token: signAdminToken(org.id, { adminMustChangePassword }),
    organizationSlug: org.slug,
    mustChangePassword: adminMustChangePassword,
  });
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

  let rabbiOk = false;
  if (org.rabbiPasswordHash) {
    rabbiOk = await bcrypt.compare(password, org.rabbiPasswordHash);
  } else {
    const fallback = process.env.RABBI_PASSWORD?.trim();
    if (fallback) {
      rabbiOk = timingSafeEqualString(password, fallback);
    }
  }
  if (rabbiOk) {
    res.json({ token: signRabbiToken(org.id), rabbiKind: "RABBI" });
    return;
  }

  // Not the location's rabbi password — try the shamoshim at this location.
  const shamoshim = await prisma.shamosh.findMany({
    where: { organizationId: org.id },
    select: { id: true, rabbiId: true, passwordHash: true },
  });
  let matched: { id: string; rabbiId: string } | null = null;
  for (const s of shamoshim) {
    // Walk every shamosh; bcrypt.compare is constant-time so timing leaks are limited.
    if (await bcrypt.compare(password, s.passwordHash)) {
      if (matched) {
        // Two shamoshim at this location share the same password — refuse to pick.
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      matched = { id: s.id, rabbiId: s.rabbiId };
    }
  }
  if (matched) {
    res.json({
      token: signShamoshToken(org.id, matched.id, matched.rabbiId),
      rabbiKind: "SHAMOSH",
    });
    return;
  }

  res.status(401).json({ error: "Invalid password" });
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
