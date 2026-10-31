// Situação das avaliações do aluno no dia: quais professores ele pode avaliar, quais deram aula hoje
// (esses contam para o bônus), se hoje é dia letivo (só então a ofensiva muda) e quais já foram avaliados.
import { db } from "./db";
import { now } from "./clock";
import { currentFeedbackStreak, dayKey } from "./game";
import { dayStatus, previousSchoolDay } from "./calendar";
import { loadCalendar } from "./calendar-data";

export type FeedbackTeacher = {
  id: string;
  name: string;
  subjects: string[];
  hasLessonToday: boolean;
  ratedToday: boolean;
};

const NO_SCHOOL_REASON = {
  OUT_OF_TERM: "fora do período letivo",
  NO_LESSONS: "não tem aula na sua grade",
  HOLIDAY: "feriado",
  RECESS: "recesso",
} as const;

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
  const lessonDays = [...new Set(classSubjects.flatMap((cs) => cs.slots.map((s) => s.weekday)))];
  const calendar = await loadCalendar(student.schoolId);
  const status = dayStatus(today, calendar, lessonDays);

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
    // Feriado e recesso: ninguém "deu aula hoje", mesmo que a grade tenha aula nesse dia da semana.
    if (status.school && cs.slots.some((s) => s.weekday === weekday)) t.hasLessonToday = true;
    byTeacher.set(cs.teacherId, t);
  }
  const teachers = [...byTeacher.values()].sort(
    (a, b) => Number(b.hasLessonToday) - Number(a.hasLessonToday) || a.name.localeCompare(b.name),
  );

  const required = teachers.filter((t) => t.hasLessonToday);
  const previous = previousSchoolDay(today, calendar, lessonDays);
  const pet = student.pet;

  return {
    student,
    today,
    calendar,
    lessonDays,
    schoolDay: status.school,
    /** Por que hoje não conta para a ofensiva (ex.: "feriado: Finados"), ou null em dia letivo. */
    noSchoolReason: status.school
      ? null
      : `${NO_SCHOOL_REASON[status.reason]}${status.special ? `: ${status.special.label}` : ""}`,
    previousSchoolDay: previous,
    teachers,
    required: required.length,
    ratedRequired: required.filter((t) => t.ratedToday).length,
    streak: pet ? currentFeedbackStreak(pet, today, previous) : 0,
    streakCountedToday: pet?.lastFeedbackDay === today,
    bonusToday: pet?.feedbackBonusDay === today,
  };
}
