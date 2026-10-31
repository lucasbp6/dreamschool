import type { ReactNode } from "react";
import { WEEKDAYS, toMinutes } from "@/lib/schedule";
import type { GridSlot } from "@/lib/schedule-data";

// Cada matéria ganha sempre o mesmo tom suave, para a grade ser lida de relance.
const TINTS = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4", "bg-tint-5", "bg-tint-6"];

function tintFor(subject: string) {
  let h = 0;
  for (const ch of subject) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Grade semanal: linhas por horário, colunas por dia; destaca o dia de hoje. */
export function ScheduleGrid({
  slots,
  renderAction,
  emptyText = "Nenhuma aula na grade ainda.",
}: {
  slots: GridSlot[];
  /** Ação extra em cada aula (ex.: remover, na tela do gestor). */
  renderAction?: (slot: GridSlot) => ReactNode;
  emptyText?: string;
}) {
  if (slots.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;

  const days = WEEKDAYS.filter((d) => d.n <= 5 || slots.some((s) => s.weekday === d.n));
  const periods = [...new Map(slots.map((s) => [`${s.startTime}-${s.endTime}`, s])).values()]
    .map((s) => ({ key: `${s.startTime}-${s.endTime}`, startTime: s.startTime, endTime: s.endTime }))
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime) || toMinutes(a.endTime) - toMinutes(b.endTime));
  const today = new Date().getDay(); // 0 = domingo, 1 = segunda...

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">Grade horária semanal</caption>
        <thead>
          <tr>
            <th scope="col" className="w-24 text-left text-xs font-bold text-muted">
              Horário
            </th>
            {days.map((d) => (
              <th
                key={d.n}
                scope="col"
                className={`rounded-lg px-2 py-1 text-center text-xs font-extrabold ${
                  d.n === today ? "bg-brand text-on-brand" : "text-muted"
                }`}
              >
                {d.label}
                {d.n === today && <span className="sr-only"> (hoje)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.key}>
              <th scope="row" className="whitespace-nowrap text-left text-xs font-bold text-muted tabular-nums">
                {p.startTime}
                <br />
                {p.endTime}
              </th>
              {days.map((d) => {
                const cell = slots.filter(
                  (s) => s.weekday === d.n && s.startTime === p.startTime && s.endTime === p.endTime,
                );
                return (
                  <td
                    key={d.n}
                    className={`h-14 rounded-lg align-top ${d.n === today ? "bg-brand-soft" : "bg-surface-2"}`}
                  >
                    {cell.map((s) => (
                      <div key={s.id} className={`card flex h-full items-start justify-between gap-1 rounded-lg border border-line p-2 ${tintFor(s.subject)}`}>
                        <div className="min-w-0">
                          <div className="font-extrabold leading-tight text-ink">{s.subject}</div>
                          <div className="truncate text-xs text-muted">{s.detail}</div>
                        </div>
                        {renderAction?.(s)}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
