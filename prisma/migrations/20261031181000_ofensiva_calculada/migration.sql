-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petType" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "recoveryMission" TEXT,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "Pet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("id", "mood", "petName", "petType", "recoveryMission", "studentId", "xp") SELECT "id", "mood", "petName", "petType", "recoveryMission", "studentId", "xp" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE UNIQUE INDEX "Pet_studentId_key" ON "Pet"("studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

