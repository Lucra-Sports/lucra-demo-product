-- Add id column as primary key to lucra_matchups table and rename user_id to lucra_user_id
-- This migration preserves all existing data

PRAGMA foreign_keys = OFF;
PRAGMA defer_foreign_keys = ON;

-- Step 1: Create new table with id column as primary key and renamed columns
CREATE TABLE "new_lucra_matchups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lucra_matchup_id" TEXT NOT NULL,
    "lucra_user_id" TEXT NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- Step 2: Copy all existing data to new table (renaming columns)
INSERT INTO "new_lucra_matchups" (
    "lucra_matchup_id",
    "lucra_user_id", 
    "completed_at",
    "created_at",
    "updated_at"
)
SELECT 
    "matchup_id" as "lucra_matchup_id",
    "user_id" as "lucra_user_id",
    "completed_at", 
    "created_at",
    "updated_at"
FROM "lucra_matchups";

-- Step 3: Update numbers table foreign key to reference the new id column
-- First create new numbers table
CREATE TABLE "new_numbers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "lucra_matchup_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "numbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "numbers_lucra_matchup_id_fkey" FOREIGN KEY ("lucra_matchup_id") REFERENCES "lucra_matchups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Step 4: Copy numbers data with updated foreign key references
INSERT INTO "new_numbers" (
    "id",
    "user_id",
    "value", 
    "lucra_matchup_id",
    "created_at"
)
SELECT 
    n."id",
    n."user_id",
    n."value",
    nlm."id" as "lucra_matchup_id",
    n."created_at"
FROM "numbers" n
LEFT JOIN "new_lucra_matchups" nlm ON (
    n."matchup_id" = nlm."lucra_matchup_id" AND 
    n."lucra_user_id" = nlm."lucra_user_id"
);

-- Step 5: Replace old tables with new ones
DROP TABLE "numbers";
ALTER TABLE "new_numbers" RENAME TO "numbers";

DROP TABLE "lucra_matchups"; 
ALTER TABLE "new_lucra_matchups" RENAME TO "lucra_matchups";

PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;