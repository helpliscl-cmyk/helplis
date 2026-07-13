ALTER TABLE "Organization" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "holderId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "commercialStatus" TEXT NOT NULL DEFAULT 'SIN_REVISAR';
ALTER TABLE "Organization" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "assignedTo" TEXT;
ALTER TABLE "Organization" ADD COLUMN "lastContactAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "nextActionAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "doNotContact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "prospectScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "prospectScoreBreakdown" TEXT;
ALTER TABLE "Organization" ADD COLUMN "prospectNotes" TEXT;

CREATE TABLE "Establishment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rbd" INTEGER NOT NULL,
  "name" TEXT,
  "status" TEXT,
  "region" TEXT,
  "province" TEXT,
  "commune" TEXT,
  "address" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "dependency" TEXT,
  "officialRecognition" TEXT,
  "educationLevels" TEXT,
  "totalEnrollment" INTEGER,
  "directorName" TEXT,
  "holderName" TEXT,
  "holderId" TEXT,
  "phone" TEXT,
  "contactEmail" TEXT,
  "website" TEXT,
  "mimeUrl" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MIME_MINEDUC',
  "sourceCheckedAt" DATETIME,
  "sourceChangedAt" DATETIME,
  "contentHash" TEXT,
  "extraData" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Establishment_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "Holder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Holder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "normalizedName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "type" TEXT,
  "website" TEXT,
  "primaryEmail" TEXT,
  "primaryPhone" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "establishmentId" TEXT,
  "holderId" TEXT,
  "name" TEXT,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT NOT NULL DEFAULT 'MIME_MINEDUC',
  "sourceUrl" TEXT,
  "verifiedAt" DATETIME,
  "emailStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "doNotContact" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Contact_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Contact_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "Holder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ScrapeJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "processedItems" INTEGER NOT NULL DEFAULT 0,
  "successfulItems" INTEGER NOT NULL DEFAULT 0,
  "failedItems" INTEGER NOT NULL DEFAULT 0,
  "skippedItems" INTEGER NOT NULL DEFAULT 0,
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "lastHeartbeatAt" DATETIME,
  "configuration" TEXT NOT NULL,
  "lockOwner" TEXT,
  "lockedAt" DATETIME,
  "pauseReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ScrapeAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "establishmentId" TEXT,
  "rbd" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "httpStatus" INTEGER,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "errorType" TEXT,
  "errorMessage" TEXT,
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "nextRetryAt" DATETIME,
  CONSTRAINT "ScrapeAttempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapeJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ScrapeAttempt_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'SIN_REVISAR',
  "estimatedValue" INTEGER,
  "probability" INTEGER,
  "productInterest" TEXT,
  "source" TEXT,
  "nextActionAt" DATETIME,
  "lostReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "contactId" TEXT,
  "opportunityId" TEXT,
  "type" TEXT NOT NULL,
  "direction" TEXT,
  "subject" TEXT,
  "body" TEXT,
  "occurredAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Activity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Suppression" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT,
  "domain" TEXT,
  "establishmentId" TEXT,
  "reason" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Suppression_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "EstablishmentChange" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "establishmentId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MIME_MINEDUC',
  "sourceUrl" TEXT,
  "changedFields" TEXT NOT NULL,
  "previousData" TEXT,
  "newData" TEXT,
  "contentHash" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstablishmentChange_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Organization_establishmentId_key" ON "Organization"("establishmentId");
CREATE INDEX "Organization_commercialStatus_idx" ON "Organization"("commercialStatus");
CREATE INDEX "Organization_holderId_idx" ON "Organization"("holderId");
CREATE INDEX "Organization_nextActionAt_idx" ON "Organization"("nextActionAt");

CREATE UNIQUE INDEX "Establishment_rbd_key" ON "Establishment"("rbd");
CREATE INDEX "Establishment_region_idx" ON "Establishment"("region");
CREATE INDEX "Establishment_commune_idx" ON "Establishment"("commune");
CREATE INDEX "Establishment_dependency_idx" ON "Establishment"("dependency");
CREATE INDEX "Establishment_status_idx" ON "Establishment"("status");
CREATE INDEX "Establishment_holderId_idx" ON "Establishment"("holderId");
CREATE INDEX "Establishment_sourceCheckedAt_idx" ON "Establishment"("sourceCheckedAt");

CREATE UNIQUE INDEX "Holder_normalizedName_key" ON "Holder"("normalizedName");
CREATE INDEX "Holder_type_idx" ON "Holder"("type");
CREATE INDEX "Holder_primaryEmail_idx" ON "Holder"("primaryEmail");

CREATE INDEX "Contact_establishmentId_idx" ON "Contact"("establishmentId");
CREATE INDEX "Contact_holderId_idx" ON "Contact"("holderId");
CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_doNotContact_idx" ON "Contact"("doNotContact");

CREATE INDEX "ScrapeJob_type_idx" ON "ScrapeJob"("type");
CREATE INDEX "ScrapeJob_status_idx" ON "ScrapeJob"("status");
CREATE INDEX "ScrapeJob_lastHeartbeatAt_idx" ON "ScrapeJob"("lastHeartbeatAt");

CREATE INDEX "ScrapeAttempt_jobId_idx" ON "ScrapeAttempt"("jobId");
CREATE INDEX "ScrapeAttempt_establishmentId_idx" ON "ScrapeAttempt"("establishmentId");
CREATE INDEX "ScrapeAttempt_rbd_idx" ON "ScrapeAttempt"("rbd");
CREATE INDEX "ScrapeAttempt_status_idx" ON "ScrapeAttempt"("status");
CREATE INDEX "ScrapeAttempt_nextRetryAt_idx" ON "ScrapeAttempt"("nextRetryAt");

CREATE INDEX "Opportunity_organizationId_idx" ON "Opportunity"("organizationId");
CREATE INDEX "Opportunity_stage_idx" ON "Opportunity"("stage");
CREATE INDEX "Opportunity_nextActionAt_idx" ON "Opportunity"("nextActionAt");

CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");
CREATE INDEX "Activity_contactId_idx" ON "Activity"("contactId");
CREATE INDEX "Activity_opportunityId_idx" ON "Activity"("opportunityId");
CREATE INDEX "Activity_occurredAt_idx" ON "Activity"("occurredAt");

CREATE INDEX "Suppression_email_idx" ON "Suppression"("email");
CREATE INDEX "Suppression_domain_idx" ON "Suppression"("domain");
CREATE INDEX "Suppression_establishmentId_idx" ON "Suppression"("establishmentId");

CREATE INDEX "EstablishmentChange_establishmentId_idx" ON "EstablishmentChange"("establishmentId");
CREATE INDEX "EstablishmentChange_createdAt_idx" ON "EstablishmentChange"("createdAt");
