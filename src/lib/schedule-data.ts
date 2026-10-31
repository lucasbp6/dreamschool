// Consultas da grade horária, já no formato do componente ScheduleGrid.
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type GridSlot = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  subject: string;
  /** Linha secundária: o professor (na grade da turma) ou a turma (na grade do professor). */
  detail: string;
};

async function load(where: Prisma.ScheduleSlotWhereInput, detail: "teacher" | "classroom") {
  const slots = await db.scheduleSlot.findMany({
    where,
    include: { classSubject: { include: { subject: true, teacher: true, classroom: true } } },
  });
  return slots.map<GridSlot>((s) => ({
    id: s.id,
    weekday: s.weekday,
    startTime: s.startTime,
    endTime: s.endTime,
    subject: s.classSubject.subject.name,
    detail: detail === "teacher" ? s.classSubject.teacher.name : s.classSubject.classroom.name,
  }));
}

/** Grade da turma (aluno, pais e gestor): cada aula mostra o professor. */
export function classroomSchedule(classroomId: string) {
  return load({ classSubject: { classroomId } }, "teacher");
}

/** Grade do professor em todas as suas turmas: cada aula mostra a turma. */
export function teacherSchedule(teacherId: string) {
  return load({ classSubject: { teacherId } }, "classroom");
}
