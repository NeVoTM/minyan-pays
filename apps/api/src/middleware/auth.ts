import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "MEMBER";
};

export function signAdminToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign({ sub: "admin", role: "ADMIN" }, secret, { expiresIn: "12h" });
}

export function signMemberToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign({ sub: userId, role: "MEMBER" }, secret, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.verify(token, secret) as JwtPayload;
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
  if (!a || a.role !== "ADMIN") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

export function requireMember(req: Request, res: Response, next: NextFunction) {
  const a = (req as Request & { auth?: JwtPayload }).auth;
  if (!a || a.role !== "MEMBER") {
    res.status(403).json({ error: "Member only" });
    return;
  }
  next();
}
