/*
  Warnings:

  - You are about to drop the `RFQ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RFQItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "RFQ_createdById_idx";

-- DropIndex
DROP INDEX "RFQ_rfqNumber_key";

-- DropIndex
DROP INDEX "RFQItem_rfqId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RFQ";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RFQItem";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Rfq" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfqNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "budget" REAL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Rfq_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RfqItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfqId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Approval" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfqId" INTEGER NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "managerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Approval_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Approval_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Approval_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Approval" ("createdAt", "id", "managerId", "quotationId", "remarks", "rfqId", "status", "updatedAt") SELECT "createdAt", "id", "managerId", "quotationId", "remarks", "rfqId", "status", "updatedAt" FROM "Approval";
DROP TABLE "Approval";
ALTER TABLE "new_Approval" RENAME TO "Approval";
CREATE INDEX "Approval_rfqId_idx" ON "Approval"("rfqId");
CREATE INDEX "Approval_quotationId_idx" ON "Approval"("quotationId");
CREATE INDEX "Approval_managerId_idx" ON "Approval"("managerId");
CREATE TABLE "new_Quotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quotationNumber" TEXT NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "deliveryTimeline" INTEGER NOT NULL,
    "taxRate" REAL NOT NULL DEFAULT 18.0,
    "taxAmount" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "grandTotal" REAL NOT NULL,
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Quotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quotation" ("attachmentUrl", "createdAt", "deletedAt", "deliveryTimeline", "grandTotal", "id", "notes", "quotationNumber", "rfqId", "status", "subtotal", "taxAmount", "taxRate", "updatedAt", "vendorId") SELECT "attachmentUrl", "createdAt", "deletedAt", "deliveryTimeline", "grandTotal", "id", "notes", "quotationNumber", "rfqId", "status", "subtotal", "taxAmount", "taxRate", "updatedAt", "vendorId" FROM "Quotation";
DROP TABLE "Quotation";
ALTER TABLE "new_Quotation" RENAME TO "Quotation";
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");
CREATE INDEX "Quotation_rfqId_idx" ON "Quotation"("rfqId");
CREATE INDEX "Quotation_vendorId_idx" ON "Quotation"("vendorId");
CREATE TABLE "new_VendorInvitation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VendorInvitation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorInvitation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VendorInvitation" ("createdAt", "emailSent", "id", "rfqId", "status", "updatedAt", "vendorId") SELECT "createdAt", "emailSent", "id", "rfqId", "status", "updatedAt", "vendorId" FROM "VendorInvitation";
DROP TABLE "VendorInvitation";
ALTER TABLE "new_VendorInvitation" RENAME TO "VendorInvitation";
CREATE INDEX "VendorInvitation_rfqId_idx" ON "VendorInvitation"("rfqId");
CREATE INDEX "VendorInvitation_vendorId_idx" ON "VendorInvitation"("vendorId");
CREATE UNIQUE INDEX "VendorInvitation_rfqId_vendorId_key" ON "VendorInvitation"("rfqId", "vendorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_rfqNumber_key" ON "Rfq"("rfqNumber");

-- CreateIndex
CREATE INDEX "Rfq_createdById_idx" ON "Rfq"("createdById");

-- CreateIndex
CREATE INDEX "RfqItem_rfqId_idx" ON "RfqItem"("rfqId");
