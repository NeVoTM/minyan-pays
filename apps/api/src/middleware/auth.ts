import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "MEMBER" | "RABBI";
  organizationId: string;
  /** Admin logged in with bootstrap password; must set a real password before other admin APIs. */
  adminMustChangePassword?: boolean;
  /** RABBI tokens: which entity logged in. "MAIN" = main rabbi (full panel), "ADDITIONAL" = approve-only rabbi, "SHAMOSH" = approve-only helper, "LEGACY" = pre-multi-rabbi org-level password. */
  rabbiKind?: "MAIN" | "ADDITIONAL" | "SHAMOSH" | "LEGACY";
  /** ID of the Rabbi row this token represents (when rabbiKind ∈ MAIN/ADDITIONAL). */
  rabbiId?: string;
  /** ID of the Shamosh row this token represents (when rabbiKind = SHAMOSH). For shamoshim, rabbiId is also set to the parent rabbi. */
  shamoshId?: string;
};

export function signAdminToken(
  organizationId: string,
  opts?: { adminMustChangePassword?: boolean }
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const payload: JwtPayload = {
    sub: "admin",
    role: "ADMIN",
    organizationId,
  };
  if (opts?.adminMustChangePassword) {
    payload.adminMustChangePassword = true;
  }
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

export function signRabbiToken(
  organizationId: string,
  opts?: {
    rabbiKind?: "MAIN" | "ADDITIONAL" | "SHAMOSH" | "LEGACY";
    rabbiId?: string;
    shamoshId?: string;
  }
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const payload: Record<string, unknown> = {
    sub: opts?.shamoshId ?? opts?.rabbiId ?? "rabbi",
    role: "RABBI",
    organizationId,
  };
  if (opts?.rabbiKind) payload.rabbiKind = opts.rabbiKind;
  if (opts?.rabbiId) payload.rabbiId = opts.rabbiId;
  if (opts?.shamoshId) payload.shamoshId = opts.shamoshId;
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

export function signMemberToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    { sub: userId, role: "MEMBER", organizationId },
    secret,
    { expiresIn: "24h" }
  );
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const p = jwt.verify(token, secret) as JwtPayload & {
    adminMustChangePassword?: boolean;
    rabbiKind?: JwtPayload["rabbiKind"];
    rabbiId?: string;
    shamoshId?: string;
  };
  if (!p.organizationId) {
    throw new Error("Invalid token: missing organization");
  }
  const out: JwtPayload = {
    sub: p.sub,
    role: p.role,
    organizationId: p.organizationId,
  };
  if (p.adminMustChangePassword === true) {
    out.adminMustChangePassword = true;
  }
  if (p.rabbiKind) out.rabbiKind = p.rabbiKind;
  if (p.rabbiId) out.rabbiId = p.rabbiId;
  if (p.shamoshId) out.shamoshId = p.shamoshId;
  return out;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    (req as Request & { auth: JwtPayload }).auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "ADMIN" || !a.organizationId) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

/** Rabbi dashboard (approvals, check-ins, payouts) — not full admin. */
export function requireRabbi(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "RABBI" || !a.organizationId) {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  next();
}

/** Main-rabbi-only endpoints (e.g. managing additional rabbis). LEGACY tokens (org-level password) also pass. */
export function requireMainRabbi(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "RABBI" || !a.organizationId) {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  if (a.rabbiKind === "ADDITIONAL" || a.rabbiKind === "SHAMOSH") {
    res.status(403).json({ error: "Main rabbi only" });
    return;
  }
  next();
}

/** Rabbi-not-shamosh endpoints (any rabbi may manage their own shamoshim, shamoshim may not). */
export function requireRabbiNotShamosh(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "RABBI" || !a.organizationId) {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  if (a.rabbiKind === "SHAMOSH") {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  next();
}

export function requireMember(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "MEMBER" || !a.organizationId) {
    res.status(403).json({ error: "Member only" });
    return;
  }
  next();
}

export async function requireApprovedMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "MEMBER" || !a.organizationId) {
    res.status(403).json({ error: "Member only" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: a.sub },
    select: { isApproved: true, organizationId: true },
  });
  if (!user) {
    res.status(403).json({ error: "Member only" });
    return;
  }
  if (user.organizationId !== a.organizationId) {
    res.status(403).json({ error: "Invalid session" });
    return;
  }
  if (!user.isApproved) {
    res.status(403).json({
      error:
        "Account pending rabbi approval. You will be able to sign in after approval.",
    });
    return;
  }
  next();
}
