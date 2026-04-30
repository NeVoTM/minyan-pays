import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

/** Placeholder hash when no PIN is provided (auth checks disabled). */
export async function pinHashFromOptionalPin(
  pin: string | undefined | null
): Promise<string> {
  const p = pin?.trim();
  if (p && p.length >= 4) return bcrypt.hash(p, 10);
  return bcrypt.hash(randomBytes(24).toString("hex"), 10);
}
