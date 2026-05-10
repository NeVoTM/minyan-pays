-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "primaryRabbiId" TEXT;

-- CreateIndex (unique: one rabbi may be primary for at most one location)
CREATE UNIQUE INDEX "Organization_primaryRabbiId_key" ON "Organization"("primaryRabbiId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_primaryRabbiId_fkey" FOREIGN KEY ("primaryRabbiId") REFERENCES "Rabbi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
