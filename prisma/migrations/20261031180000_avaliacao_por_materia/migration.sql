-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LessonFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "lessonDate" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    CONSTRAINT "LessonFeedback_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonFeedback_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Avaliações antigas (por professor e dia) viram avaliações por matéria: a data da aula é o dia em que
-- avaliou, e a matéria é a do mesmo professor na turma (de preferência com aula naquele dia da semana).
-- Só se perdem avaliações de professores que não dão mais aula na turma.
INSERT INTO "new_LessonFeedback" ("id", "stars", "comment", "lessonDate", "day", "classSubjectId", "createdAt", "studentId", "teacherId", "classroomId")
SELECT * FROM (
  SELECT lf."id", lf."stars", lf."comment", lf."day", lf."day",
    (SELECT cs."id" FROM "ClassSubject" cs
      LEFT JOIN "ScheduleSlot" sl
        ON sl."classSubjectId" = cs."id" AND sl."weekday" = CAST(strftime('%w', lf."day") AS INTEGER)
      WHERE cs."teacherId" = lf."teacherId" AND cs."classroomId" = lf."classroomId"
      ORDER BY (sl."id" IS NULL), cs."id"
      LIMIT 1) AS "classSubjectId",
    lf."createdAt", lf."studentId", lf."teacherId", lf."classroomId"
  FROM "LessonFeedback" lf
) WHERE "classSubjectId" IS NOT NULL;
DROP TABLE "LessonFeedback";
ALTER TABLE "new_LessonFeedback" RENAME TO "LessonFeedback";
CREATE UNIQUE INDEX "LessonFeedback_studentId_classSubjectId_lessonDate_key" ON "LessonFeedback"("studentId", "classSubjectId", "lessonDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

