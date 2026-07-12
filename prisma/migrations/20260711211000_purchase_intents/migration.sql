-- CreateTable
CREATE TABLE "PurchaseIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "commune" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "primaryUse" TEXT NOT NULL,
    "contactAccepted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PurchaseIntent_status_idx" ON "PurchaseIntent"("status");

-- CreateIndex
CREATE INDEX "PurchaseIntent_primaryUse_idx" ON "PurchaseIntent"("primaryUse");

-- CreateIndex
CREATE INDEX "PurchaseIntent_createdAt_idx" ON "PurchaseIntent"("createdAt");
