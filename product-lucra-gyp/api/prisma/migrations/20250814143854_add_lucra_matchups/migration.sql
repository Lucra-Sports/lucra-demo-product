-- CreateTable
CREATE TABLE "lucra_matchups" (
    "matchup_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("matchup_id", "group_id", "user_id"),
    CONSTRAINT "lucra_matchups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);