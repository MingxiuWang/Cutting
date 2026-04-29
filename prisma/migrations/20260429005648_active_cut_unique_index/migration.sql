CREATE UNIQUE INDEX "Cut_active_unique"
  ON "Cut" ("userId")
  WHERE "endDate" IS NULL;
