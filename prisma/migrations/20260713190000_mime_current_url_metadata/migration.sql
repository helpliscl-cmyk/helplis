ALTER TABLE "Establishment" ADD COLUMN "averageStudentsPerCourse" REAL;

ALTER TABLE "Contact" ADD COLUMN "contactType" TEXT;
ALTER TABLE "Contact" ADD COLUMN "label" TEXT;
ALTER TABLE "Contact" ADD COLUMN "section" TEXT;

ALTER TABLE "ScrapeAttempt" ADD COLUMN "requestedUrl" TEXT;
ALTER TABLE "ScrapeAttempt" ADD COLUMN "finalUrl" TEXT;
ALTER TABLE "ScrapeAttempt" ADD COLUMN "redirected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScrapeAttempt" ADD COLUMN "contentType" TEXT;
