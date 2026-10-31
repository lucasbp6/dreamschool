// Leitura do calendário letivo e dos dias da semana com aula (grade), para as telas e as regras.
import { db } from "./db";
import type { CalendarData } from "./calendar";

export async function loadCalendar(schoolId: string): Promise<CalendarData> {
  const [school, days] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { termStart: true, termEnd: true } }),
    db.calendarDay.findMany({ where: { schoolId }, orderBy: { date: "asc" }, select: { date: true, kind: true, label: true } }),
  ]);
  return { termStart: school?.termStart ?? null, termEnd: school?.termEnd ?? null, days };
}

/** Dias da semana com aula na grade de uma turma. */
export async function classLessonWeekdays(classroomId: string) {
  const slots = await db.scheduleSlot.findMany({
    where: { classSubject: { classroomId } },
    select: { weekday: true },
    distinct: ["weekday"],
  });
  return slots.map((s) => s.weekday).sort();
}

/** Dias da semana com aula em alguma turma da escola (calendário geral e do gestor). */
export async function schoolLessonWeekdays(schoolId: string) {
  const slots = await db.scheduleSlot.findMany({
    where: { classSubject: { classroom: { schoolId } } },
    select: { weekday: true },
    distinct: ["weekday"],
  });
  return slots.map((s) => s.weekday).sort();
}
