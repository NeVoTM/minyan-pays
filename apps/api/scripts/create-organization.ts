/**
 * Add another synagogue or study hall (after DB is migrated).
 *
 * Usage (from apps/api):
 *   npx tsx scripts/create-organization.ts <slug> "<name>" <SYNAGOGUE|STUDY_HALL> ["<synagogue display name>"]
 *
 * Example:
 *   npx tsx scripts/create-organization.ts beit-midrash-west "Beit Midrash West" STUDY_HALL "בית מדרש מערב"
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , slug, name, kindRaw, synagogueNameArg] = process.argv;
  if (!slug || !name || !kindRaw) {
    console.error(
      "Usage: npx tsx scripts/create-organization.ts <slug> \"<name>\" <SYNAGOGUE|STUDY_HALL> [\"<synagogue display>\"]"
    );
    process.exit(1);
  }
  const kind =
    kindRaw === "STUDY_HALL" || kindRaw === "SYNAGOGUE" ? kindRaw : null;
  if (!kind) {
    console.error("kind must be SYNAGOGUE or STUDY_HALL");
    process.exit(1);
  }
  const synagogueName = synagogueNameArg ?? name;

  const org = await prisma.organization.create({
    data: {
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      name,
      kind,
      synagogueName,
      defaultLocale: "he",
      timezone: "America/New_York",
      treasury: {
        create: { balanceCents: 0, systemLocked: false },
      },
    },
  });
  console.log("Created organization", org.slug, org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
