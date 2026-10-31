"use client";

import { useState, useTransition } from "react";
import { CheckCheck, Save } from "lucide-react";
import { saveAttendance } from "@/lib/teacher-actions";
import { ATTENDANCE_STATUS, attendanceRate, type AttendanceStatus } from "@/lib/game";
import { Badge } from "@/components/shared/ui";

type Props = {
  subjects: { id: string; name: string; weekdays: number[] }[];
  students: { id: string; name: string }[];
  records: { classSubjectId: string; studentId: string; date: string; status: string }[];
  today: string;
};

const STATUS_TONES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-success text-on-brand border-success",
  LATE: "bg-sky text-on-brand border-sky",
  ABSENT: "bg-attention text-on-brand border-attention",
};

export function AttendanceSheet({ subjects, students, records, today }: Props) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [edits, setEdits] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const key = `${subjectId}|${date}`;
  const saved = records.filter((r) => r.classSubjectId === subjectId && r.date === date);
  const marks: Record<string, AttendanceStatus> = Object.fromEntries(
    students.map((s) => [
      s.id,
      edits[key]?.[s.id] ?? (saved.find((r) => r.studentId === s.id)?.status as AttendanceStatus) ?? "PRESENT",
    ]),
  );
  const subject = subjects.find((s) => s.id === subjectId);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const hasLesson = subject?.weekdays.includes(weekday);

  const mark = (studentId: string, status: AttendanceStatus) => {
    setResult(null);
    setEdits((e) => ({ ...e, [key]: { ...marks, ...e[key], [studentId]: status } }));
  };

  const save = () =>
    startTransition(async () => {
      const r = await saveAttendance(
        subjectId,
        date,
        students.map((s) => ({ studentId: s.id, status: marks[s.id] })),
      );
      setResult(r);
    });

  if (subjects.length === 0) return <p className="text-sm text-muted">Você não tem matérias nesta turma.</p>;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-bold text-muted">
          Matéria
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-bold text-muted">
          Data
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink"
          />
        </label>
        <button
          type="button"
          onClick={() => setEdits((e) => ({ ...e, [key]: Object.fromEntries(students.map((s) => [s.id, "PRESENT"])) }))}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 font-bold text-ink hover:bg-brand-soft"
        >
          <CheckCheck size={16} aria-hidden /> Todos presentes
        </button>
        {saved.length > 0 ? <Badge tone="success">Chamada já lançada — editando</Badge> : <Badge tone="sky">Nova chamada</Badge>}
        {!hasLesson && <Badge tone="attention">Não há aula de {subject?.name} neste dia na grade</Badge>}
      </div>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface-2">
        {students.map((s) => {
          const history = records.filter((r) => r.classSubjectId === subjectId && r.studentId === s.id).map((r) => r.status);
          const rate = attendanceRate(history);
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div>
                <div className="font-bold text-ink">{s.name}</div>
                <div className="text-xs text-muted">
                  Frequência em {subject?.name}: {rate !== null ? `${Math.round(rate * 100)}%` : "—"}
                </div>
              </div>
              <div role="radiogroup" aria-label={`Presença de ${s.name}`} className="flex gap-1">
                {(Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]).map((st) => {
                  const on = marks[s.id] === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => mark(s.id, st)}
                      className={`rounded-full border px-3 py-1 text-xs font-extrabold transition ${
                        on ? STATUS_TONES[st] : "border-line bg-surface text-muted hover:border-brand"
                      }`}
                    >
                      {ATTENDANCE_STATUS[st].label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || students.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
        >
          <Save size={16} aria-hidden /> {pending ? "Salvando…" : "Salvar chamada"}
        </button>
        <p role="status" className={`font-bold ${result?.ok ? "text-success" : "text-attention"}`}>
          {result?.message}
        </p>
      </div>
    </div>
  );
}
