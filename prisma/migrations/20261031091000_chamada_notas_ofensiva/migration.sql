-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "Attendance_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "maxScore" REAL NOT NULL DEFAULT 10,
    "classSubjectId" TEXT NOT NULL,
    CONSTRAINT "Assessment_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" REAL NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeedbackSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "feedbackCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    CONSTRAINT "FeedbackSummary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackSummary_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FeedbackSummary" ("classroomId", "createdAt", "feedbackCount", "id", "text") SELECT "classroomId", "createdAt", "feedbackCount", "id", "text" FROM "FeedbackSummary";
DROP TABLE "FeedbackSummary";
ALTER TABLE "new_FeedbackSummary" RENAME TO "FeedbackSummary";
CREATE TABLE "new_LessonFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "day" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    CONSTRAINT "LessonFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LessonFeedback" ("classroomId", "comment", "createdAt", "id", "stars", "studentId") SELECT "classroomId", "comment", "createdAt", "id", "stars", "studentId" FROM "LessonFeedback";
DROP TABLE "LessonFeedback";
ALTER TABLE "new_LessonFeedback" RENAME TO "LessonFeedback";
CREATE UNIQUE INDEX "LessonFeedback_studentId_teacherId_day_key" ON "LessonFeedback"("studentId", "teacherId", "day");
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petType" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "recoveryMission" TEXT,
    "feedbackStreak" INTEGER NOT NULL DEFAULT 0,
    "lastFeedbackDay" TEXT,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "Pet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("id", "mood", "petName", "petType", "recoveryMission", "studentId", "xp") SELECT "id", "mood", "petName", "petType", "recoveryMission", "studentId", "xp" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE UNIQUE INDEX "Pet_studentId_key" ON "Pet"("studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_classSubjectId_studentId_date_key" ON "Attendance"("classSubjectId", "studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON "Grade"("assessmentId", "studentId");

