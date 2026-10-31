-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "feedbackBonusDay" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN "termEnd" TEXT;
ALTER TABLE "School" ADD COLUMN "termStart" TEXT;

-- CreateTable
CREATE TABLE "CalendarDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "CalendarDay_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarDay_schoolId_date_key" ON "CalendarDay"("schoolId", "date");

