ALTER TABLE "Device" ADD COLUMN "internalSequence" INTEGER;
ALTER TABLE "Device" ADD COLUMN "qrContent" TEXT;
ALTER TABLE "Device" ADD COLUMN "nfcContent" TEXT;
ALTER TABLE "Device" ADD COLUMN "inventoryLocationId" TEXT;
ALTER TABLE "Device" ADD COLUMN "productionStatus" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Device" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Device" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'IN_PRODUCTION';
ALTER TABLE "Device" ADD COLUMN "reservedAt" DATETIME;
ALTER TABLE "Device" ADD COLUMN "soldAt" DATETIME;
ALTER TABLE "Device" ADD COLUMN "packedAt" DATETIME;
ALTER TABLE "Device" ADD COLUMN "shippedAt" DATETIME;
ALTER TABLE "Device" ADD COLUMN "deliveredAt" DATETIME;

ALTER TABLE "Batch" ADD COLUMN "supplierContact" TEXT;
ALTER TABLE "Batch" ADD COLUMN "supplierQuoteReference" TEXT;
ALTER TABLE "Batch" ADD COLUMN "productModel" TEXT;
ALTER TABLE "Batch" ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'WRISTBAND';
ALTER TABLE "Batch" ADD COLUMN "color" TEXT;
ALTER TABLE "Batch" ADD COLUMN "chipType" TEXT;
ALTER TABLE "Batch" ADD COLUMN "domain" TEXT NOT NULL DEFAULT 'https://helplis.cl';
ALTER TABLE "Batch" ADD COLUMN "productionMode" TEXT NOT NULL DEFAULT 'DEMO';
ALTER TABLE "Batch" ADD COLUMN "sentToSupplierAt" DATETIME;
ALTER TABLE "Batch" ADD COLUMN "productionStartedAt" DATETIME;
ALTER TABLE "Batch" ADD COLUMN "productionCompletedAt" DATETIME;
ALTER TABLE "Batch" ADD COLUMN "verifiedAt" DATETIME;
ALTER TABLE "Batch" ADD COLUMN "createdBy" TEXT;

CREATE TABLE "ProductionFile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "batchId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatedBy" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'GENERATED',
  "metadata" TEXT,
  CONSTRAINT "ProductionFile_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SupplierUidImport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "batchId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0,
  "duplicateRows" INTEGER NOT NULL DEFAULT 0,
  "importedRows" INTEGER NOT NULL DEFAULT 0,
  "errorReportPath" TEXT,
  "mapping" TEXT,
  "preview" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "createdBy" TEXT,
  CONSTRAINT "SupplierUidImport_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PhysicalVerification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deviceId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "qrExpected" TEXT NOT NULL,
  "qrObserved" TEXT,
  "nfcExpected" TEXT NOT NULL,
  "nfcObserved" TEXT,
  "nfcUidExpected" TEXT,
  "nfcUidObserved" TEXT,
  "qrStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "nfcStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "uidStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "physicalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "overallStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "photoUrl" TEXT,
  "verifiedBy" TEXT,
  "verifiedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PhysicalVerification_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PhysicalVerification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InventoryLocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "warehouse" TEXT,
  "shelf" TEXT,
  "box" TEXT,
  "position" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "leadId" TEXT,
  "userId" TEXT,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "region" TEXT NOT NULL,
  "comuna" TEXT NOT NULL,
  "address" TEXT,
  "addressNotes" TEXT,
  "pack" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "shippingCost" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "fulfillmentStatus" TEXT NOT NULL DEFAULT 'NEW',
  "source" TEXT,
  "notes" TEXT,
  "trackingNumber" TEXT,
  "carrier" TEXT,
  "paidAt" DATETIME,
  "packedAt" DATETIME,
  "shippedAt" DATETIME,
  "deliveredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "PurchaseIntent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "deviceId" TEXT,
  "productType" TEXT NOT NULL DEFAULT 'WRISTBAND',
  "unitPrice" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'MANUAL',
  "method" TEXT NOT NULL DEFAULT 'TRANSFER',
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CLP',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "externalReference" TEXT,
  "proofUrl" TEXT,
  "reportedAt" DATETIME,
  "approvedAt" DATETIME,
  "rejectedAt" DATETIME,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'MANUAL',
  "carrier" TEXT,
  "service" TEXT,
  "trackingNumber" TEXT,
  "cost" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "shippedAt" DATETIME,
  "estimatedDeliveryAt" DATETIME,
  "deliveredAt" DATETIME,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InstitutionLead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT,
  "institutionName" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "comuna" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactRole" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "estimatedQuantity" INTEGER NOT NULL,
  "estimatedDate" DATETIME,
  "interest" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "landingSlug" TEXT,
  "institutionalCode" TEXT,
  "discountPercentage" REAL NOT NULL DEFAULT 0,
  "commissionPercentage" REAL NOT NULL DEFAULT 0,
  "metrics" TEXT,
  "documents" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "InstitutionLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "orderId" TEXT,
  "deviceId" TEXT,
  "batchId" TEXT,
  "organizationId" TEXT,
  "category" TEXT NOT NULL DEFAULT 'OTHER',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "assignedTo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "resolvedAt" DATETIME,
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_leadId_key" ON "Order"("leadId");

CREATE INDEX "Device_productionStatus_idx" ON "Device"("productionStatus");
CREATE INDEX "Device_verificationStatus_idx" ON "Device"("verificationStatus");
CREATE INDEX "Device_inventoryStatus_idx" ON "Device"("inventoryStatus");
CREATE INDEX "Device_inventoryLocationId_idx" ON "Device"("inventoryLocationId");
CREATE INDEX "Batch_productionMode_idx" ON "Batch"("productionMode");
CREATE INDEX "Batch_productType_idx" ON "Batch"("productType");
CREATE INDEX "ProductionFile_batchId_idx" ON "ProductionFile"("batchId");
CREATE INDEX "ProductionFile_type_idx" ON "ProductionFile"("type");
CREATE INDEX "ProductionFile_status_idx" ON "ProductionFile"("status");
CREATE INDEX "ProductionFile_generatedAt_idx" ON "ProductionFile"("generatedAt");
CREATE INDEX "SupplierUidImport_batchId_idx" ON "SupplierUidImport"("batchId");
CREATE INDEX "SupplierUidImport_status_idx" ON "SupplierUidImport"("status");
CREATE INDEX "SupplierUidImport_createdAt_idx" ON "SupplierUidImport"("createdAt");
CREATE INDEX "PhysicalVerification_deviceId_idx" ON "PhysicalVerification"("deviceId");
CREATE INDEX "PhysicalVerification_batchId_idx" ON "PhysicalVerification"("batchId");
CREATE INDEX "PhysicalVerification_overallStatus_idx" ON "PhysicalVerification"("overallStatus");
CREATE INDEX "PhysicalVerification_verifiedAt_idx" ON "PhysicalVerification"("verifiedAt");
CREATE INDEX "InventoryLocation_name_idx" ON "InventoryLocation"("name");
CREATE INDEX "InventoryLocation_warehouse_idx" ON "InventoryLocation"("warehouse");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_deviceId_idx" ON "OrderItem"("deviceId");
CREATE INDEX "OrderItem_status_idx" ON "OrderItem"("status");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");
CREATE INDEX "InstitutionLead_status_idx" ON "InstitutionLead"("status");
CREATE INDEX "InstitutionLead_type_idx" ON "InstitutionLead"("type");
CREATE INDEX "InstitutionLead_createdAt_idx" ON "InstitutionLead"("createdAt");
CREATE INDEX "InstitutionLead_organizationId_idx" ON "InstitutionLead"("organizationId");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");
CREATE INDEX "SupportTicket_deviceId_idx" ON "SupportTicket"("deviceId");
CREATE INDEX "SupportTicket_batchId_idx" ON "SupportTicket"("batchId");
CREATE INDEX "SupportTicket_organizationId_idx" ON "SupportTicket"("organizationId");
