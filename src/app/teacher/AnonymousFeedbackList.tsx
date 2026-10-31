"use client";

import { useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";

/** Avaliação já anonimizada no servidor: sem aluno, sem id e sem horário de envio. */
export type AnonymousFeedback = { stars: number; comment: string | null; lessonDate: string; subject: string };

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(`${d}T12:00:00`));

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} size={16} className={i <= n ? "fill-brand text-brand" : "text-line"} aria-hidden />
      ))}
    </span>
  );
}

/** Avaliações individuais anônimas das aulas do professor, com filtro por matéria. */
export function AnonymousFeedbackList({ items }: { items: AnonymousFeedback[] }) {
  const subjects = [...new Set(items.map((i) => i.subject))].sort();
  const [subject, setSubject] = useState("");
  const [onlyComments, setOnlyComments] = useState(false);
  const shown = items.filter((i) => (!subject || i.subject === subject) && (!onlyComments || i.comment));
  const byDate = new Map<string, AnonymousFeedback[]>();
  for (const i of shown) byDate.set(i.lessonDate, [...(byDate.get(i.lessonDate) ?? []), i]);
  const dist = [3, 2, 1].map((n) => ({ n, count: shown.filter((i) => i.stars === n).length }));

  if (items.length === 0) return <p className="text-sm text-muted">Ainda não há avaliações das suas aulas nesta turma.</p>;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        Os alunos não são identificados e as avaliações aparecem sem ordem de envio.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-bold text-muted">
          Matéria
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink"
          >
            <option value="">Todas</option>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 py-2 font-bold text-ink">
          <input type="checkbox" checked={onlyComments} onChange={(e) => setOnlyComments(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          Só com comentário
        </label>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Distribuição das estrelas">
        {dist.map(({ n, count }) => (
          <li key={n} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-bold text-ink">
            <Stars n={n} /> <span className="tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      {shown.length === 0 ? (
        <p className="text-muted">Nenhuma avaliação com esse filtro.</p>
      ) : (
        <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-1">
          {[...byDate].map(([date, list]) => (
            <section key={date} aria-label={`Aulas de ${fmtDate(date)}`}>
              <h4 className="mb-2 text-xs font-extrabold tracking-wide text-muted uppercase">{fmtDate(date)}</h4>
              <ul className="space-y-2">
                {list.map((f, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-surface-2 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Stars n={f.stars} />
                      <span className="rounded-full bg-sky-soft px-2 py-0.5 text-xs font-bold text-sky">{f.subject}</span>
                    </div>
                    {f.comment ? (
                      <p className="mt-2 flex gap-1.5 break-words text-ink">
                        <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                        {f.comment}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted">Sem comentário</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
