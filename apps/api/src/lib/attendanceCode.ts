import type { PrismaClient } from "@prisma/client";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Random unique attendance code (6 chars), excluding ambiguous characters. */
export async function generateUniqueAttendanceCode(
  prisma: PrismaClient
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
    }
    const exists = await prisma.user.findFirst({
      where: { attendanceCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Could not allocate a unique attendance code");
}
