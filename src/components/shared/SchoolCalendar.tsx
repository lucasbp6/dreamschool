"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { dayStatus, monthWeeks, schoolDaysBetween, type CalendarData } from "@/lib/calendar";

const WEEK_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
/** "novembro de 2026" → "Novembro de 2026" (o CSS capitalize deixaria "De" maiúsculo). */
const monthName = (d: Date) => {
  const s = monthFmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const longDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const REASON_TEXT = {
  OUT_OF_TERM: "fora do período letivo",
  NO_LESSONS: "sem aula",
  HOLIDAY: "feriado",
  RECESS: "recesso",
} as const;

type Props = {
  calendar: CalendarData;
  /** Dias da semana com aula (1 = segunda … 6 = sábado). */
  lessonWeekdays: number[];
  today: string;
  /** Datas marcadas com uma chama (ex.: dias em que o aluno avaliou os professores). */
  streakDays?: string[];
  streakLabel?: string;
};

/** Calendário mensal com os dias letivos, feriados, recessos e eventos da escola. */
export function SchoolCalendar({ calendar, lessonWeekdays, today, streakDays = [], streakLabel = "Avaliou os professores" }: Props) {
  const [ym, setYm] = useState(today.slice(0, 7));
  const [year, month] = ym.split("-").map(Number);
  const weeks = monthWeeks(year, month);
  const streak = new Set(streakDays);

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthStart = `${ym}-01`;
  const monthEnd = `${ym}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const monthSchoolDays = schoolDaysBetween(monthStart, monthEnd, calendar, lessonWeekdays).length;
  const remaining = calendar.termEnd && today <= calendar.termEnd
    ? schoolDaysBetween(today, calendar.termEnd, calendar, lessonWeekdays).length
    : null;
  const specials = calendar.days.filter((d) => d.date >= monthStart && d.date <= monthEnd);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Mês anterior"
          className="rounded-full border border-line bg-surface p-2 text-ink hover:bg-brand-soft"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <h3 className="text-lg font-extrabold text-ink" aria-live="polite">
          {monthName(new Date(year, month - 1, 1))}
        </h3>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Próximo mês"
          className="rounded-full border border-line bg-surface p-2 text-ink hover:bg-brand-soft"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] table-fixed border-separate border-spacing-1 text-sm">
          <caption className="sr-only">Calendário letivo de {monthName(new Date(year, month - 1, 1))}</caption>
          <thead>
            <tr>
              {WEEK_HEADERS.map((h) => (
                <th key={h} scope="col" className="pb-1 text-xs font-extrabold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((date, di) => {
                  if (!date) return <td key={di} />;
                  const st = dayStatus(date, calendar, lessonWeekdays);
                  const kind = st.special?.kind;
                  const tone = st.school
                    ? kind === "EVENT"
                      ? "bg-sky-soft text-ink"
                      : "bg-brand-soft text-ink"
                    : st.reason === "HOLIDAY"
                      ? "bg-attention-soft text-attention"
                      : st.reason === "RECESS"
                        ? "bg-surface-2 text-muted"
                        : "bg-transparent text-muted";
                  const isToday = date === today;
                  const label = [
                    longDay.format(new Date(date + "T12:00:00")),
                    st.school ? "dia letivo" : REASON_TEXT[st.reason],
                    st.special?.label,
                    streak.has(date) ? streakLabel : null,
                    isToday ? "hoje" : null,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <td key={di} className="align-top">
                      <div
                        aria-label={label}
                        title={label}
                        className={`flex h-16 flex-col rounded-xl p-1.5 ${tone} ${isToday ? "ring-2 ring-brand" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-sm tabular-nums ${st.school ? "font-extrabold" : "font-semibold"}`} aria-hidden>
                            {Number(date.slice(8))}
                          </span>
                          {streak.has(date) && <Flame size={14} className="text-attention" aria-hidden />}
                        </div>
                        {st.special && (
                          <span className="mt-auto truncate text-[0.65rem] leading-tight font-bold" aria-hidden>
                            {st.special.label}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legenda">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-soft ring-1 ring-line" aria-hidden /> Dia letivo</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-soft ring-1 ring-line" aria-hidden /> Evento (dia letivo)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-attention-soft ring-1 ring-line" aria-hidden /> Feriado</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-surface-2 ring-1 ring-line" aria-hidden /> Recesso</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-brand" aria-hidden /> Hoje</li>
        {streakDays.length > 0 && (
          <li className="flex items-center gap-1.5"><Flame size={12} className="text-attention" aria-hidden /> {streakLabel}</li>
        )}
      </ul>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-brand-soft px-3 py-1 font-bold text-brand">{monthSchoolDays} dias letivos neste mês</span>
        {remaining !== null && (
          <span className="rounded-full bg-surface-2 px-3 py-1 font-bold text-ink">
            Faltam {remaining} dias letivos até o fim do período
          </span>
        )}
      </div>

      {specials.length > 0 && (
        <ul className="space-y-1 text-sm">
          {specials.map((d) => (
            <li key={d.date} className="flex flex-wrap gap-2">
              <span className="font-bold text-ink tabular-nums">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
              <span className="text-muted">{d.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
