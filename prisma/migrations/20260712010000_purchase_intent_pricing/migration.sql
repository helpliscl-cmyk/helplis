ALTER TABLE "PurchaseIntent" ADD COLUMN "region" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PurchaseIntent" ADD COLUMN "packId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PurchaseIntent" ADD COLUMN "unitPrice" INTEGER NOT NULL DEFAULT 18000;
ALTER TABLE "PurchaseIntent" ADD COLUMN "totalPrice" INTEGER NOT NULL DEFAULT 18000;
ALTER TABLE "PurchaseIntent" ADD COLUMN "shippingPending" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PurchaseIntent" ADD COLUMN "origin" TEXT;

CREATE INDEX "PurchaseIntent_packId_idx" ON "PurchaseIntent"("packId");
