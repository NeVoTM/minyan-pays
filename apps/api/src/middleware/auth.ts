import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "MEMBER" | "RABBI";
  organizationId: string;
};

export function signAdminToken(organizationId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    { sub: "admin", role: "ADMIN", organizationId },
    secret,
    { expiresIn: "12h" }
  );
}

export function signRabbiToken(organizationId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    { sub: "rabbi", role: "RABBI", organizationId },
    secret,
    { expiresIn: "12h" }
  );
}

export function signMemberToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(
    { sub: userId, role: "MEMBER", organizationId },
    secret,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const p = jwt.verify(token, secret) as JwtPayload;
  if (!p.organizationId) {
    throw new Error("Invalid token: missing organization");
  }
  return p;
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
