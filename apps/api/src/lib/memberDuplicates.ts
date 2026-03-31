import type { PrismaClient } from "@prisma/client";
import { zelleDigits } from "./phone.js";

function nameKey(firstName: string, lastName: string): string {
  return `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}`;
}

export type DuplicateCheckInput = {
  excludeUserId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  zellePhone?: string | null;
  wifeZellePhone?: string | null;
};

export async function assertNoMemberDuplicates(
  prisma: PrismaClient,
  data: DuplicateCheckInput
): Promise<void> {
  const phoneDup = await prisma.user.findFirst({
    where: {
      phone: data.phone,
      ...(data.excludeUserId ? { NOT: { id: data.excludeUserId } } : {}),
    },
  });
  if (phoneDup) {
    throw new DuplicateMemberError("This phone number is already registered.");
  }

  const z1 = zelleDigits(data.zellePhone);
  const z2 = zelleDigits(data.wifeZellePhone);
  if (z1 && z2 && z1 === z2) {
    throw new DuplicateMemberError(
      "Primary Zelle and spouse Zelle must be different numbers."
    );
  }

  const nk = nameKey(data.firstName, data.lastName);
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      ...(data.excludeUserId ? { NOT: { id: data.excludeUserId } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      zellePhone: true,
      wifeZellePhone: true,
    },
  });

  for (const m of members) {
    if (nameKey(m.firstName, m.lastName) === nk) {
      throw new DuplicateMemberError(
        "Another member already has this first and last name."
      );
    }
  }

  for (const z of [z1, z2]) {
    if (!z) continue;
    for (const m of members) {
      const mz1 = zelleDigits(m.zellePhone);
      const mz2 = zelleDigits(m.wifeZellePhone);
      if (z === mz1 || z === mz2) {
        throw new DuplicateMemberError(
          "This Zelle number is already used by another member."
        );
      }
    }
  }
}

export class DuplicateMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateMemberError";
  }
}
