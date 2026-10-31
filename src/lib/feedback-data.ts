// Situação das avaliações do aluno no dia: quais professores ele pode avaliar, quais deram aula hoje
// (esses contam para a ofensiva) e quais já foram avaliados.
import { db } from "./db";
import { now } from "./clock";
import { currentFeedbackStreak, dayKey } from "./game";
import { previousSchoolDay } from "./schedule";

export type FeedbackTeacher = {
  id: string;
  name: string;
  subjects: string[];
  hasLessonToday: boolean;
  ratedToday: boolean;
};

export async function feedbackDay(studentId: string) {
  const student = await db.user.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      pet: true,
      classroom: { include: { classSubjects: { include: { teacher: true, subject: true, slots: true } } } },
    },
  });
  const today = dayKey(now());
  const weekday = now().getDay();
  const classSubjects = student.classroom?.classSubjects ?? [];

  const rated = new Set(
    (await db.lessonFeedback.findMany({ where: { studentId, day: today }, select: { teacherId: true } })).map(
      (f) => f.teacherId,
    ),
  );

  const byTeacher = new Map<string, FeedbackTeacher>();
  for (const cs of classSubjects) {
    const t = byTeacher.get(cs.teacherId) ?? {
      id: cs.teacherId,
      name: cs.teacher.name,
      subjects: [],
      hasLessonToday: false,
      ratedToday: rated.has(cs.teacherId),
    };
    t.subjects.push(cs.subject.name);
    if (cs.slots.some((s) => s.weekday === weekday)) t.hasLessonToday = true;
    byTeacher.set(cs.teacherId, t);
  }
  const teachers = [...byTeacher.values()].sort(
    (a, b) => Number(b.hasLessonToday) - Number(a.hasLessonToday) || a.name.localeCompare(b.name),
  );

  const required = teachers.filter((t) => t.hasLessonToday);
  const lessonDays = new Set(classSubjects.flatMap((cs) => cs.slots.map((s) => s.weekday)));
  const previous = previousSchoolDay(today, lessonDays);
  const pet = student.pet;

  return {
    student,
    today,
    previousSchoolDay: previous,
    teachers,
    required: required.length,
    ratedRequired: required.filter((t) => t.ratedToday).length,
    streak: pet ? currentFeedbackStreak(pet, today, previous) : 0,
    completedToday: pet?.lastFeedbackDay === today,
  };
}
