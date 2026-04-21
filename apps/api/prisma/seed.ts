/**
 * Seed default organization (run after `prisma db push` on empty DB).
 * Usage: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.organization.findFirst();
  if (existing) {
    console.log("Organizations already exist; skipping seed.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      slug: "dovrey-evrit",
      name: "Dovrey Evrit",
      kind: "SYNAGOGUE",
      synagogueName: "Dovrey Evrit",
      rabbiBanner: null,
      defaultLocale: "he",
      timezone: "America/New_York",
      treasury: {
        create: {
          balanceCents: 0,
          systemLocked: false,
        },
      },
    },
  });

  console.log("Created default organization:", org.slug, org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
