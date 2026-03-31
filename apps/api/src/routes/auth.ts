import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { normalizePhone } from "../lib/phone.js";
import { signAdminToken, signMemberToken } from "../middleware/auth.js";

export const authRouter = Router();

const adminLogin = z.object({
  password: z.string().min(1),
});

const memberLogin = z.object({
  phone: z.string().min(7),
  pin: z.string().min(4).max(12),
});

authRouter.post("/admin", (req, res) => {
  const parsed = adminLogin.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
    return;
  }
  if (parsed.data.password.trim() !== expected) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ token: signAdminToken() });
});

authRouter.post("/member", async (req, res) => {
  const parsed = memberLogin.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const phone = normalizePhone(parsed.data.phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.status(401).json({ error: "Unknown phone or PIN" });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!ok) {
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
  res.json({ token: signMemberToken(user.id) });
});
