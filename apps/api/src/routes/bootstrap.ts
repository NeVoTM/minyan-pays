import { timingSafeEqual } from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * Emergency ops when you cannot run Prisma locally against production.
 * Set ADMIN_BOOTSTRAP_TOKEN in the API env (long random), redeploy, POST once with header
 * X-Admin-Bootstrap-Token, then remove the env var and redeploy again.
 */
export const bootstrapRouter = Router();

bootstrapRouter.post("/clear-stored-admin-password", async (_req, res) => {
  const secret = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();
  if (!secret) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const raw = _req.headers["x-admin-bootstrap-token"];
  const header = typeof raw === "string" ? raw.trim() : "";
  if (!header || header.length !== secret.length) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const a = Buffer.from(header, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const result = await prisma.organization.updateMany({
    data: { adminPasswordHash: null },
  });
  res.json({ ok: true, clearedOrganizationCount: result.count });
});
