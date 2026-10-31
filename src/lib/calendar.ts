// Calendário letivo: quais datas têm aula. Um dia é letivo quando está dentro do período letivo,
// não é feriado nem recesso e cai num dia da semana que tem aula na grade da turma.
// Funções puras, usadas no servidor e no navegador. Datas sempre no formato YYYY-MM-DD.

export const DAY_KINDS = {
  HOLIDAY: { label: "Feriado", school: false },
  RECESS: { label: "Recesso", school: false },
  EVENT: { label: "Evento", school: true },
} as const;
export type DayKind = keyof typeof DAY_KINDS;

export type SpecialDay = { date: string; kind: string; label: string };
export type CalendarData = { termStart: string | null; termEnd: string | null; days: SpecialDay[] };

export type DayStatus =
  | { school: true; special?: SpecialDay }
  | { school: false; reason: "OUT_OF_TERM" | "NO_LESSONS" | "HOLIDAY" | "RECESS"; special?: SpecialDay };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** 0 = domingo … 6 = sábado (igual a Date.getDay e à grade horária, onde 1 = segunda). */
export function weekdayOf(key: string) {
  return fromKey(key).getDay();
}

export function dayStatus(date: string, cal: CalendarData, lessonWeekdays: Iterable<number>): DayStatus {
  const special = cal.days.find((d) => d.date === date);
  if ((cal.termStart && date < cal.termStart) || (cal.termEnd && date > cal.termEnd))
    return { school: false, reason: "OUT_OF_TERM", special };
  if (special?.kind === "HOLIDAY" || special?.kind === "RECESS") return { school: false, reason: special.kind, special };
  if (!new Set(lessonWeekdays).has(weekdayOf(date))) return { school: false, reason: "NO_LESSONS", special };
  return { school: true, special };
}

export function isSchoolDay(date: string, cal: CalendarData, lessonWeekdays: Iterable<number>) {
  return dayStatus(date, cal, lessonWeekdays).school;
}

/** Último dia letivo antes de `today` (procura até ~4 meses para trás, cobrindo as férias). */
export function previousSchoolDay(today: string, cal: CalendarData, lessonWeekdays: Iterable<number>) {
  const weekdays = [...lessonWeekdays];
  if (weekdays.length === 0) return null;
  for (let back = 1; back <= 120; back++) {
    const date = addDays(today, -back);
    if (isSchoolDay(date, cal, weekdays)) return date;
  }
  return null;
}

/** Dias letivos entre duas datas (inclusive). */
export function schoolDaysBetween(from: string, to: string, cal: CalendarData, lessonWeekdays: Iterable<number>) {
  const weekdays = [...lessonWeekdays];
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (isSchoolDay(d, cal, weekdays)) out.push(d);
  return out;
}

/** Semanas do mês (segunda a domingo); dias de fora do mês vêm como null. */
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month - 1, 1);
  const days = new Date(year, month, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // segunda = 0
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** Hoje, se for dia letivo; senão o próximo dia letivo (procura até ~4 meses à frente, cobrindo as férias). */
export function currentOrNextSchoolDay(today: string, cal: CalendarData, lessonWeekdays: Iterable<number>) {
  const weekdays = [...lessonWeekdays];
  if (weekdays.length === 0) return null;
  for (let ahead = 0; ahead <= 120; ahead++) {
    const date = addDays(today, ahead);
    if (isSchoolDay(date, cal, weekdays)) return date;
  }
  return null;
}
