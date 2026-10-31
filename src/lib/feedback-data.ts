// Situação das avaliações do aluno: aulas que ainda podem ser avaliadas (hoje e ontem), ofensiva e
// dias letivos completos. As regras de prazo e de ofensiva ficam em feedback-rules.ts.
import { db } from "./db";
import { now } from "./clock";
import { dayKey } from "./game";
import { addDays, dayStatus, isSchoolDay, weekdayOf } from "./calendar";
import { loadCalendar } from "./calendar-data";
import {
  FEEDBACK_WINDOW_DAYS,
  canEvaluate,
  completedDays,
  computeFeedbackStreak,
  type LessonsOn,
  type RatedOn,
} from "./feedback-rules";

export type FeedbackLesson = {
  classSubjectId: string;
  subject: string;
  teacherName: string;
  /** Horários de início da matéria nesse dia (ex.: ["07:30", "10:20"]). */
  times: string[];
  rated: boolean;
};

export type FeedbackDayGroup = { date: string; label: string; lessons: FeedbackLesson[] };

const NO_SCHOOL_REASON = {
  OUT_OF_TERM: "fora do período letivo",
  NO_LESSONS: "não tem aula na sua grade",
  HOLIDAY: "feriado",
  RECESS: "recesso",
} as const;

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });

export async function feedbackDay(studentId: string) {
  const student = await db.user.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      pet: true,
      classroom: { include: { classSubjects: { include: { teacher: true, subject: true, slots: true } } } },
    },
  });
  const today = dayKey(now());
  const classSubjects = student.classroom?.classSubjects ?? [];
  const lessonDays = [...new Set(classSubjects.flatMap((cs) => cs.slots.map((s) => s.weekday)))];
  const calendar = await loadCalendar(student.schoolId);
  const status = dayStatus(today, calendar, lessonDays);

  const lessonsOn: LessonsOn = (date) =>
    isSchoolDay(date, calendar, lessonDays)
      ? classSubjects.filter((cs) => cs.slots.some((s) => s.weekday === weekdayOf(date))).map((cs) => cs.id)
      : [];

  const feedbacks = await db.lessonFeedback.findMany({
    where: { studentId },
    select: { classSubjectId: true, lessonDate: true },
  });
  const ratedMap = new Map<string, Set<string>>();
  for (const f of feedbacks) {
    if (!ratedMap.has(f.lessonDate)) ratedMap.set(f.lessonDate, new Set());
    ratedMap.get(f.lessonDate)!.add(f.classSubjectId);
  }
  const ratedOn: RatedOn = (date) => ratedMap.get(date) ?? new Set();

  // Aulas que ainda podem ser avaliadas: hoje e até FEEDBACK_WINDOW_DAYS dias atrás.
  const days: FeedbackDayGroup[] = [];
  for (let back = 0; back <= FEEDBACK_WINDOW_DAYS; back++) {
    const date = addDays(today, -back);
    if (!canEvaluate(date, today)) continue;
    const ids = new Set(lessonsOn(date));
    if (ids.size === 0) continue;
    const lessons = classSubjects
      .filter((cs) => ids.has(cs.id))
      .map<FeedbackLesson>((cs) => ({
        classSubjectId: cs.id,
        subject: cs.subject.name,
        teacherName: cs.teacher.name,
        times: cs.slots
          .filter((s) => s.weekday === weekdayOf(date))
          .map((s) => s.startTime)
          .sort(),
        rated: ratedOn(date).has(cs.id),
      }))
      .sort((a, b) => a.times[0].localeCompare(b.times[0]));
    const when = weekdayFmt.format(new Date(`${date}T12:00:00`));
    days.push({ date, label: `${back === 0 ? "Hoje" : "Ontem"} (${when})`, lessons });
  }

  const from = calendar.termStart ?? addDays(today, -200);
  return {
    student,
    today,
    calendar,
    lessonDays,
    schoolDay: status.school,
    /** Por que hoje não é dia letivo (ex.: "feriado: Finados"), ou null em dia letivo. */
    noSchoolReason: status.school
      ? null
      : `${NO_SCHOOL_REASON[status.reason]}${status.special ? `: ${status.special.label}` : ""}`,
    days,
    pending: days.reduce((n, d) => n + d.lessons.filter((l) => !l.rated).length, 0),
    streak: computeFeedbackStreak(today, lessonsOn, ratedOn),
    completedDays: completedDays(from, today, lessonsOn, ratedOn),
  };
}
