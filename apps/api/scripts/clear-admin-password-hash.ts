/**
 * Clears per-organization adminPasswordHash so admin login uses ADMIN_PASSWORD from the environment.
 *
 * Run from apps/api with DATABASE_URL set (e.g. production external URL from Render):
 *   npx tsx scripts/clear-admin-password-hash.ts
 *
 * Or: npm run db:clear-admin-hash --workspace apps/api
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.organization.updateMany({
    data: { adminPasswordHash: null },
  });
  console.log(
    `Cleared adminPasswordHash on ${result.count} organization(s). Admin login will use ADMIN_PASSWORD from the environment until a new password is set in the dashboard.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
