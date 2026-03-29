import { Router, type Request } from "express";
import { prisma } from "../lib/prisma.js";
import { getMemberBalanceDetail } from "../lib/earnings.js";
import {
  authMiddleware,
  requireMember,
  type JwtPayload,
} from "../middleware/auth.js";

export const memberRouter = Router();
memberRouter.use(authMiddleware);
memberRouter.use(requireMember);

memberRouter.get("/profile", async (req: Request, res) => {
  const auth = (req as Request & { auth: JwtPayload }).auth;
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      name: true,
      phone: true,
      isMarried: true,
      zellePhone: true,
      wifeZellePhone: true,
      bonusRecipient: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

memberRouter.get("/balance", async (req: Request, res) => {
  const auth = (req as Request & { auth: JwtPayload }).auth;
  const detail = await getMemberBalanceDetail(auth.sub);
  res.json(detail);
});
