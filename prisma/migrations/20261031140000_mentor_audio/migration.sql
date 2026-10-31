-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MentorMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "usedAi" BOOLEAN NOT NULL DEFAULT true,
    "viaAudio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "MentorMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MentorSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MentorMessage" ("content", "createdAt", "id", "role", "sessionId", "usedAi") SELECT "content", "createdAt", "id", "role", "sessionId", "usedAi" FROM "MentorMessage";
DROP TABLE "MentorMessage";
ALTER TABLE "new_MentorMessage" RENAME TO "MentorMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

