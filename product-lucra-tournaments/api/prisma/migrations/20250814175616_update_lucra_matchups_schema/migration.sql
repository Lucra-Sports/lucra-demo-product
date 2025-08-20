CREATE TABLE "lucra_matchups" (
    "matchup_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "number_id" INTEGER,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    PRIMARY KEY ("matchup_id", "user_id"),
    CONSTRAINT "lucra_matchups_number_id_fkey" FOREIGN KEY ("number_id") REFERENCES "numbers" ("id") ON DELETE
    SET NULL ON UPDATE CASCADE
);