/*
 Warnings:
 
 - You are about to drop the column `number_id` on the `lucra_matchups` table. All the data in the column will be lost.
 
 */
-- Step 1: Create temporary table to store the relationship mappings
CREATE TEMP TABLE temp_number_matchup_relations AS
SELECT n.id as number_id,
    lm.matchup_id,
    ub.external_id as lucra_user_id
FROM numbers n
    JOIN lucra_matchups lm ON lm.number_id = n.id
    JOIN user_bindings ub on ub.type = "lucra"
    and n.user_id = ub.user_id;
-- Step 2: RedefineTables
PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;
-- Recreate lucra_matchups table without number_id column
CREATE TABLE "new_lucra_matchups" (
    "matchup_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    PRIMARY KEY ("matchup_id", "user_id")
);
-- Copy existing lucra_matchups data (excluding number_id)
INSERT INTO "new_lucra_matchups" (
        "matchup_id",
        "user_id",
        "completed_at",
        "created_at",
        "updated_at"
    )
SELECT "matchup_id",
    "user_id",
    "completed_at",
    "created_at",
    "updated_at"
FROM "lucra_matchups";
DROP TABLE "lucra_matchups";
ALTER TABLE "new_lucra_matchups"
    RENAME TO "lucra_matchups";
-- Create new numbers table with matchup_id and lucra_user_id columns
CREATE TABLE "new_numbers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "matchup_id" TEXT,
    "lucra_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "numbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "numbers_matchup_id_lucra_user_id_fkey" FOREIGN KEY ("matchup_id", "lucra_user_id") REFERENCES "lucra_matchups" ("matchup_id", "user_id") ON DELETE
    SET NULL ON UPDATE CASCADE
);
-- Copy existing numbers data
INSERT INTO "new_numbers" (
        "created_at",
        "id",
        "user_id",
        "value",
        "matchup_id",
        "lucra_user_id"
    )
SELECT n."created_at",
    n."id",
    n."user_id",
    n."value",
    t."matchup_id",
    t."lucra_user_id"
FROM "numbers" n
    LEFT JOIN "temp_number_matchup_relations" t on t.number_id = n.id;
DROP TABLE "numbers";
ALTER TABLE "new_numbers"
    RENAME TO "numbers";
PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;