-- Drop existing table since we're changing the user_id meaning (from internal user ID to Lucra user ID)
DROP TABLE "lucra_matchups";

-- Recreate table with new structure
CREATE TABLE "lucra_matchups" (
    "matchup_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "number_id" INTEGER,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("matchup_id", "group_id", "user_id"),
    CONSTRAINT "lucra_matchups_number_id_fkey" FOREIGN KEY ("number_id") REFERENCES "numbers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);