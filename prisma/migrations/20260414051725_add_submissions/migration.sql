/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `FormSubmission` table. All the data in the column will be lost.
  - Added the required column `shop` to the `FormSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FormConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormSubmission" ("createdAt", "data", "formId", "id") SELECT "createdAt", "data", "formId", "id" FROM "FormSubmission";
DROP TABLE "FormSubmission";
ALTER TABLE "new_FormSubmission" RENAME TO "FormSubmission";
CREATE INDEX "FormSubmission_formId_idx" ON "FormSubmission"("formId");
CREATE INDEX "FormSubmission_shop_idx" ON "FormSubmission"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
