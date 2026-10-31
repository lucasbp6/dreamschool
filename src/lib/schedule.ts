// Regras da grade horária: dias, horários "HH:MM" e detecção de conflitos.
// Funções puras, sem acesso ao banco.

export const WEEKDAYS = [
  { n: 1, label: "Segunda", short: "Seg" },
  { n: 2, label: "Terça", short: "Ter" },
  { n: 3, label: "Quarta", short: "Qua" },
  { n: 4, label: "Quinta", short: "Qui" },
  { n: 5, label: "Sexta", short: "Sex" },
  { n: 6, label: "Sábado", short: "Sáb" },
] as const;

export function weekdayLabel(n: number) {
  return WEEKDAYS.find((d) => d.n === n)?.label ?? "?";
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(t: string) {
  return TIME_RE.test(t);
}

export function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export type SlotTime = { weekday: number; startTime: string; endTime: string };

export function overlaps(a: SlotTime, b: SlotTime) {
  return (
    a.weekday === b.weekday &&
    toMinutes(a.startTime) < toMinutes(b.endTime) &&
    toMinutes(b.startTime) < toMinutes(a.endTime)
  );
}

export type ExistingSlot = SlotTime & {
  classroomId: string;
  classroomName: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
};

/** Valida uma nova aula. Devolve a mensagem de erro, ou null se a aula pode entrar na grade. */
export function validateSlot(
  slot: SlotTime & { classroomId: string; teacherId: string },
  existing: ExistingSlot[],
): string | null {
  if (!WEEKDAYS.some((d) => d.n === slot.weekday)) return "Escolha um dia da semana.";
  if (!isValidTime(slot.startTime) || !isValidTime(slot.endTime)) return "Use horários no formato HH:MM.";
  if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) return "O fim da aula precisa ser depois do início.";

  for (const e of existing) {
    if (!overlaps(slot, e)) continue;
    const when = `${weekdayLabel(e.weekday)} das ${e.startTime} às ${e.endTime}`;
    if (e.classroomId === slot.classroomId) return `A turma já tem ${e.subjectName} na ${when}.`;
    if (e.teacherId === slot.teacherId) return `${e.teacherName} já dá ${e.subjectName} na ${e.classroomName} na ${when}.`;
  }
  return null;
}
