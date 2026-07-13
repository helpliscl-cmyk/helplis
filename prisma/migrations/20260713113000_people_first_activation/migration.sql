ALTER TABLE "Profile" ADD COLUMN "criticalInformation" TEXT;
ALTER TABLE "Profile" ADD COLUMN "showDisplayName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "showCriticalInformation" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "EmergencyContact" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "EmergencyContact" ADD COLUMN "relationshipCode" TEXT;

UPDATE "EmergencyContact"
SET "type" = CASE WHEN "priority" = 1 THEN 'PRIMARY' ELSE 'SECONDARY' END
WHERE "type" IS NULL OR "type" = 'PRIMARY';

CREATE INDEX "EmergencyContact_type_idx" ON "EmergencyContact"("type");
