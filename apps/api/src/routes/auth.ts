import bcrypt from "bcryptjs";
import crypto from "node:crypto";
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
import {
  getGlobalAdminPasswordHash,
  setGlobalAdminPassword,
} from "../lib/settings.js";
import {
  adminNotifyEmail,
  emailConfigured,
  generate6DigitCode,
  sendEmail,
} from "../lib/email.js";

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

// --------------------------------------------------------------------------
// PUBLIC ADMIN PASSWORD RESET (forgot password on login screen)
//
// Sends a 6-digit code to ADMIN_NOTIFY_EMAIL (default elichalfinny@gmail.com),
// then lets the operator set a new global admin password without being logged in.
// --------------------------------------------------------------------------

const GLOBAL_ADMIN_PASSWORD_RE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+\-_=?$.,])[A-Za-z0-9!@#$%^&*+\-_=?$.,]{8,64}$/;

const GLOBAL_ADMIN_PASSWORD_RULE_MSG =
  "Global admin password must be 8-64 characters and include at least one letter, one digit, and one special character (!@#$%^&*+-_=?$.,).";

const RESET_CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESET_MAX_CODE_ATTEMPTS = 5;

function adminEchoCodeEnabled(): boolean {
  const v = process.env.ADMIN_PASSWORD_VERIFICATION_ECHO?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Email a 6-digit reset code to the configured admin notify address. */
authRouter.post("/admin/request-password-reset", async (_req, res) => {
  const echo = adminEchoCodeEnabled();
  if (!emailConfigured() && !echo) {
    res.status(503).json({
      error:
        "Email transport not configured. Ask your admin to set GMAIL_USER + GMAIL_APP_PASSWORD on Render (or set ADMIN_PASSWORD_VERIFICATION_ECHO=1 for dev).",
    });
    return;
  }

  const code = generate6DigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const email = adminNotifyEmail();

  // Placeholder password — the real one is supplied on confirm.
  const placeholderPlain = crypto.randomBytes(32).toString("hex");
  const placeholderHash = await bcrypt.hash(placeholderPlain, 10);

  await prisma.adminPasswordChangeRequest.updateMany({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date(0) },
  });

  const created = await prisma.adminPasswordChangeRequest.create({
    data: {
      email,
      codeHash,
      newPasswordHash: placeholderHash,
      newPasswordPlain: placeholderPlain,
      expiresAt: new Date(Date.now() + RESET_CODE_EXPIRY_MS),
    },
    select: { id: true, email: true, expiresAt: true },
  });

  let emailDelivered: { ok: boolean; error?: string } = { ok: false };
  if (emailConfigured()) {
    const subject = "MinyanPays — Admin password reset code";
    const text = `Your MinyanPays admin password reset code is ${code}.\nIt expires in 10 minutes.\n\nIf you did not request this reset, ignore this email.`;
    const html = `<p>Your MinyanPays admin password reset code is <b>${code}</b>.</p><p>It expires in 10 minutes.</p><p style="color:#666">If you did not request this reset, ignore this email.</p>`;
    const r = await sendEmail({ to: email, subject, text, html });
    emailDelivered = r.ok ? { ok: true } : { ok: false, error: r.error };
  }

  res.json({
    requestId: created.id,
    email: created.email,
    expiresAt: created.expiresAt,
    emailDelivered: emailDelivered.ok,
    emailError: emailDelivered.ok ? null : emailDelivered.error ?? null,
    devCode: echo ? code : undefined,
  });
});

/** Verify the reset code and apply a new global admin password. */
authRouter.post("/admin/confirm-password-reset", async (req, res) => {
  const schema = z.object({
    requestId: z.string().min(1),
    code: z.string().min(4).max(12),
    newPassword: z.string().regex(GLOBAL_ADMIN_PASSWORD_RE),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: GLOBAL_ADMIN_PASSWORD_RULE_MSG });
    return;
  }

  const reqRow = await prisma.adminPasswordChangeRequest.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!reqRow) {
    res.status(404).json({ error: "Unknown reset request." });
    return;
  }
  if (reqRow.consumedAt) {
    res.status(409).json({ error: "This reset request was already used." });
    return;
  }
  if (reqRow.expiresAt.getTime() <= Date.now()) {
    res.status(410).json({ error: "Reset code expired. Request a new one." });
    return;
  }
  if (reqRow.attempts >= RESET_MAX_CODE_ATTEMPTS) {
    res.status(429).json({ error: "Too many attempts. Request a new code." });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.code.trim(), reqRow.codeHash);
  if (!ok) {
    await prisma.adminPasswordChangeRequest.update({
      where: { id: reqRow.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(401).json({ error: "Invalid reset code." });
    return;
  }

  const newPasswordPlain = parsed.data.newPassword.trim();
  const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10);
  await setGlobalAdminPassword({ hash: newPasswordHash, plain: newPasswordPlain });
  await prisma.adminPasswordChangeRequest.update({
    where: { id: reqRow.id },
    data: { consumedAt: new Date() },
  });

  res.json({ ok: true });
});
