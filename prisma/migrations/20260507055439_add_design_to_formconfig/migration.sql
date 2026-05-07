-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "design" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FormConfig" ("createdAt", "fields", "formName", "id", "isActive", "settings", "shopDomain", "slug", "updatedAt") SELECT "createdAt", "fields", "formName", "id", "isActive", "settings", "shopDomain", "slug", "updatedAt" FROM "FormConfig";
DROP TABLE "FormConfig";
ALTER TABLE "new_FormConfig" RENAME TO "FormConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
