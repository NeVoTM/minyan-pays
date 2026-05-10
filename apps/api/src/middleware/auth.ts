import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "MEMBER" | "RABBI";
  organizationId: string;
  /** Admin logged in with bootstrap password; must set a real password before other admin APIs. */
  adminMustChangePassword?: boolean;
  /** RABBI tokens only: "RABBI" = logged in with the org rabbi password, "SHAMOSH" = logged in with their own per-helper password. */
  rabbiKind?: "RABBI" | "SHAMOSH";
  /** Set when rabbiKind === "SHAMOSH"; identifies the Shamosh row. */
  shamoshId?: string;
  /** Set when rabbiKind === "SHAMOSH"; the parent rabbi this shamosh helps. Useful for filtering UI. */
  shamoshRabbiId?: string;
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

export function signRabbiToken(organizationId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    { sub: "rabbi", role: "RABBI", organizationId, rabbiKind: "RABBI" },
    secret,
    { expiresIn: "24h" }
  );
}

export function signShamoshToken(
  organizationId: string,
  shamoshId: string,
  rabbiId: string
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    {
      sub: `shamosh:${shamoshId}`,
      role: "RABBI",
      organizationId,
      rabbiKind: "SHAMOSH",
      shamoshId,
      shamoshRabbiId: rabbiId,
    },
    secret,
    { expiresIn: "24h" }
  );
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
  const p = jwt.verify(token, secret) as JwtPayload;
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
  if (p.role === "RABBI") {
    if (p.rabbiKind === "SHAMOSH") {
      out.rabbiKind = "SHAMOSH";
      if (typeof p.shamoshId === "string") out.shamoshId = p.shamoshId;
      if (typeof p.shamoshRabbiId === "string") out.shamoshRabbiId = p.shamoshRabbiId;
    } else {
      out.rabbiKind = "RABBI";
    }
  }
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

/** Rabbi dashboard (approvals, check-ins, payouts) — not full admin. Also accepts SHAMOSH tokens; downstream routes that should exclude shamoshim use requireRabbiNotShamosh. */
export function requireRabbi(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "RABBI" || !a.organizationId) {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  next();
}

/** Rabbi-only routes that a SHAMOSH token must not reach (member CRUD, payouts, banner, shamoshim CRUD, settings). */
export function requireRabbiNotShamosh(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "RABBI" || !a.organizationId) {
    res.status(403).json({ error: "Rabbi only" });
    return;
  }
  if (a.rabbiKind === "SHAMOSH") {
    res.status(403).json({ error: "Rabbi only (shamosh tokens cannot perform this action)" });
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
