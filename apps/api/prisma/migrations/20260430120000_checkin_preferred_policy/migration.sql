-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "checkInOnlyPreferred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredForCheckIn" BOOLEAN NOT NULL DEFAULT false;

-- Align new-member default with product (admin-created members still set isApproved explicitly)
ALTER TABLE "User" ALTER COLUMN "isApproved" SET DEFAULT false;
