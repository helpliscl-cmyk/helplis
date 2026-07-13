ALTER TABLE "Profile" ADD COLUMN "headline" TEXT;
ALTER TABLE "Profile" ADD COLUMN "helpMessage" TEXT;
ALTER TABLE "Profile" ADD COLUMN "statusMessage" TEXT;
ALTER TABLE "Profile" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "approximateAge" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "genderOptional" TEXT;
ALTER TABLE "Profile" ADD COLUMN "communicationNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "mobilityNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "sensoryNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "cognitiveNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "medicalConditions" TEXT;
ALTER TABLE "Profile" ADD COLUMN "medicalInstructions" TEXT;
ALTER TABLE "Profile" ADD COLUMN "emergencyInstructions" TEXT;
ALTER TABLE "Profile" ADD COLUMN "organDonorOptional" BOOLEAN;
ALTER TABLE "Profile" ADD COLUMN "healthProviderOptional" TEXT;
ALTER TABLE "Profile" ADD COLUMN "country" TEXT;
ALTER TABLE "Profile" ADD COLUMN "region" TEXT;
ALTER TABLE "Profile" ADD COLUMN "commune" TEXT;
ALTER TABLE "Profile" ADD COLUMN "generalArea" TEXT;
ALTER TABLE "Profile" ADD COLUMN "exactAddress" TEXT;
ALTER TABLE "Profile" ADD COLUMN "petName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "sex" TEXT;
ALTER TABLE "Profile" ADD COLUMN "sterilizedOptional" BOOLEAN;
ALTER TABLE "Profile" ADD COLUMN "veterinaryNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "microchipNumberOptional" TEXT;
ALTER TABLE "Profile" ADD COLUMN "petBehaviorNotes" TEXT;
ALTER TABLE "Profile" ADD COLUMN "objectName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "objectCategory" TEXT;
ALTER TABLE "Profile" ADD COLUMN "brand" TEXT;
ALTER TABLE "Profile" ADD COLUMN "model" TEXT;
ALTER TABLE "Profile" ADD COLUMN "returnInstructions" TEXT;
ALTER TABLE "Profile" ADD COLUMN "showFullName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showAlias" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "showApproximateAge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showBloodType" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showAllergies" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showMedicalConditions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showMedications" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showMedicalInstructions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showCommunicationNotes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showMobilityNotes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showSensoryNotes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showGeneralArea" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showExactAddress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "allowCall" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "allowWhatsApp" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "allowMessage" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "allowLocationSharing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "allowFoundReport" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "EmergencyContact" ADD COLUMN "availabilityNotes" TEXT;

UPDATE "Profile"
SET "showPhoneNumbers" = false
WHERE "showPhoneNumbers" = true;

CREATE TABLE "LocationShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deviceId" TEXT NOT NULL,
  "profileId" TEXT,
  "scanEventId" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "accuracy" REAL,
  "consented" BOOLEAN NOT NULL DEFAULT false,
  "permissionStatus" TEXT NOT NULL DEFAULT 'GRANTED',
  "result" TEXT NOT NULL DEFAULT 'RECORDED',
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocationShare_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LocationShare_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LocationShare_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "ScanEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "FoundReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deviceId" TEXT NOT NULL,
  "profileId" TEXT,
  "scanEventId" TEXT,
  "reporterName" TEXT,
  "reporterPhone" TEXT,
  "message" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "accuracy" REAL,
  "consentedLocation" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoundReport_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FoundReport_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "FoundReport_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "ScanEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "LocationShare_deviceId_idx" ON "LocationShare"("deviceId");
CREATE INDEX "LocationShare_profileId_idx" ON "LocationShare"("profileId");
CREATE INDEX "LocationShare_scanEventId_idx" ON "LocationShare"("scanEventId");
CREATE INDEX "LocationShare_createdAt_idx" ON "LocationShare"("createdAt");
CREATE INDEX "LocationShare_permissionStatus_idx" ON "LocationShare"("permissionStatus");

CREATE INDEX "FoundReport_deviceId_idx" ON "FoundReport"("deviceId");
CREATE INDEX "FoundReport_profileId_idx" ON "FoundReport"("profileId");
CREATE INDEX "FoundReport_scanEventId_idx" ON "FoundReport"("scanEventId");
CREATE INDEX "FoundReport_createdAt_idx" ON "FoundReport"("createdAt");
CREATE INDEX "FoundReport_status_idx" ON "FoundReport"("status");
