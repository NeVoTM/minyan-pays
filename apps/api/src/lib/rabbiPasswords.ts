import { prisma } from "./prisma.js";

/** Rabbi & shamosh login passwords are 8 alphanumeric characters and unique across both tables (per spec). */
const PASSWORD_RE = /^[A-Za-z0-9]{8}$/;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function isValidRabbiPassword(s: string): boolean {
  return PASSWORD_RE.test(s);
}

/** Cryptographic-grade 8-char alphanumeric (avoids easily-confused chars like 0/O/1/l/I). */
export function generateRabbiPassword(): string {
  const buf = new Uint32Array(8);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i += 1) buf[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += ALPHABET[(buf[i] ?? 0) % ALPHABET.length];
  }
  return out;
}

/** Throws when `password` is already in use by a rabbi or shamosh anywhere (excluding the optional self-row). */
export async function assertRabbiPasswordUnique(
  password: string,
  opts: { excludeRabbiId?: string; excludeShamoshId?: string }
): Promise<void> {
  const r = await prisma.rabbi.findFirst({
    where: {
      passwordPlain: password,
      ...(opts.excludeRabbiId ? { NOT: { id: opts.excludeRabbiId } } : {}),
    },
    select: { id: true },
  });
  if (r) {
    throw new Error("That password is already in use. Choose a different password.");
  }
  const s = await prisma.shamosh.findFirst({
    where: {
      passwordPlain: password,
      ...(opts.excludeShamoshId ? { NOT: { id: opts.excludeShamoshId } } : {}),
    },
    select: { id: true },
  });
  if (s) {
    throw new Error("That password is already in use. Choose a different password.");
  }
}

/** Generate a unique 8-char alphanumeric (retries on collision). */
export async function generateUniqueRabbiPassword(maxAttempts = 12): Promise<string> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const cand = generateRabbiPassword();
    try {
      await assertRabbiPasswordUnique(cand, {});
      return cand;
    } catch {
      continue;
    }
  }
  throw new Error("Could not generate a unique password. Try again.");
}
