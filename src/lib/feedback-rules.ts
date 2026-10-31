// Regras da avaliação de aulas e da ofensiva (funções puras).
// - Cada aula (matéria numa data) pode ser avaliada no dia da aula ou no dia seguinte.
// - Um dia letivo está "completo" quando todas as aulas dele foram avaliadas.
// - A ofensiva é o número de dias letivos completos seguidos. Dias sem aula não contam nem quebram;
//   um dia ainda dentro do prazo de avaliação também não quebra (o aluno ainda pode completá-lo).
import { addDays } from "./calendar";

/** Dias depois da aula em que ainda dá para avaliá-la. */
export const FEEDBACK_WINDOW_DAYS = 1;

export function canEvaluate(lessonDate: string, today: string) {
  return lessonDate <= today && today <= addDays(lessonDate, FEEDBACK_WINDOW_DAYS);
}

/** Matérias (ids) com aula numa data; lista vazia quando não é dia letivo. */
export type LessonsOn = (date: string) => string[];
/** Matérias já avaliadas pelo aluno para as aulas de uma data. */
export type RatedOn = (date: string) => Set<string>;

export function isDayComplete(date: string, lessonsOn: LessonsOn, ratedOn: RatedOn) {
  const lessons = lessonsOn(date);
  if (lessons.length === 0) return false;
  const rated = ratedOn(date);
  return lessons.every((id) => rated.has(id));
}

export function computeFeedbackStreak(today: string, lessonsOn: LessonsOn, ratedOn: RatedOn, maxBack = 200) {
  let streak = 0;
  for (let back = 0; back <= maxBack; back++) {
    const date = addDays(today, -back);
    if (lessonsOn(date).length === 0) continue; // sem aula: não altera a ofensiva
    if (isDayComplete(date, lessonsOn, ratedOn)) streak++;
    else if (canEvaluate(date, today)) continue; // ainda dá para completar
    else break;
  }
  return streak;
}

/** Dias letivos completos num intervalo (para marcar no calendário). */
export function completedDays(from: string, to: string, lessonsOn: LessonsOn, ratedOn: RatedOn) {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (isDayComplete(d, lessonsOn, ratedOn)) out.push(d);
  return out;
}
