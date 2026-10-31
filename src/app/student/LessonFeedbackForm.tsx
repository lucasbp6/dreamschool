"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Flame, Star } from "lucide-react";
import { submitLessonFeedback } from "@/lib/actions";
import { FEEDBACK_STREAK_XP } from "@/lib/game";
import type { FeedbackDayGroup } from "@/lib/feedback-data";
import { Card, CardTitle } from "@/components/shared/ui";

const LABELS = ["", "Pode melhorar", "Foi legal", "Amei!"];

type Props = {
  studentId: string;
  petName: string;
  /** Aulas que ainda podem ser avaliadas, agrupadas por dia (hoje e ontem). */
  days: FeedbackDayGroup[];
  streak: number;
  /** Motivo de hoje não ser dia letivo (ex.: "feriado: Finados"), ou null. */
  noSchoolReason: string | null;
};

export function LessonFeedbackForm({ studentId, petName, days, streak, noSchoolReason }: Props) {
  const [selected, setSelected] = useState<{ date: string; classSubjectId: string } | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const lesson =
    selected &&
    days.find((d) => d.date === selected.date)?.lessons.find((l) => l.classSubjectId === selected.classSubjectId);

  const submit = () =>
    startTransition(async () => {
      if (!selected) return;
      const r = await submitLessonFeedback(studentId, selected.classSubjectId, selected.date, stars, comment);
      setResult(r);
      if (r.ok) {
        setSelected(null);
        setStars(0);
        setComment("");
      }
    });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="bg-brand-soft lg:col-span-1">
        <CardTitle icon={<Flame size={22} className="text-attention" aria-hidden />}>Ofensiva de avaliações</CardTitle>
        <div className="flex items-baseline gap-2">
          <span className={`text-6xl font-extrabold tabular-nums ${streak > 0 ? "text-attention" : "text-muted"}`}>{streak}</span>
          <span className="font-bold text-ink">{streak === 1 ? "dia seguido" : "dias seguidos"}</span>
        </div>
        <p className="mt-3 text-sm text-ink">
          A ofensiva sobe quando você avalia <strong>todas as aulas de um dia</strong>. Cada aula pode ser avaliada no
          dia dela ou no dia seguinte. Dia completo vale +{FEEDBACK_STREAK_XP} XP para {petName}.
        </p>
        {days.map((d) => {
          const done = d.lessons.filter((l) => l.rated).length;
          const complete = done === d.lessons.length;
          return (
            <div key={d.date} className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-ink">{d.label}</span>
                <span className={`font-bold tabular-nums ${complete ? "text-success" : "text-ink"}`}>
                  {complete ? "Completo ✓" : `${done} de ${d.lessons.length}`}
                </span>
              </div>
              <div className="mt-1 flex gap-1.5" aria-hidden>
                {d.lessons.map((l) => (
                  <span
                    key={l.classSubjectId}
                    className={`h-3 flex-1 rounded-full ${l.rated ? "bg-attention" : "border border-line bg-surface"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {noSchoolReason && (
          <p className="mt-4 text-sm text-muted">
            Hoje não é dia letivo ({noSchoolReason}), então a ofensiva fica guardadinha até o próximo dia de aula.
          </p>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle icon={<Star size={20} className="text-brand" aria-hidden />}>Qual aula você quer avaliar?</CardTitle>
        {days.length === 0 ? (
          <p className="text-sm text-muted">Não há aulas de hoje nem de ontem para avaliar. Volte no próximo dia de aula!</p>
        ) : (
          <div className="space-y-4">
            {days.map((d) => (
              <section key={d.date} aria-label={d.label}>
                <h3 className="mb-2 text-sm font-extrabold text-ink">{d.label}</h3>
                <div role="radiogroup" aria-label={`Aulas de ${d.label}`} className="grid gap-2 sm:grid-cols-2">
                  {d.lessons.map((l) => {
                    const active = selected?.date === d.date && selected.classSubjectId === l.classSubjectId;
                    return (
                      <button
                        key={l.classSubjectId}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={l.rated || pending}
                        onClick={() => {
                          setSelected({ date: d.date, classSubjectId: l.classSubjectId });
                          setResult(null);
                        }}
                        className={`rounded-2xl border-2 p-3 text-left transition disabled:cursor-not-allowed ${
                          active ? "border-brand bg-brand-soft" : "border-line bg-surface-2 hover:border-brand"
                        } ${l.rated ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-ink">{l.subject}</span>
                          {l.rated ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                              <CheckCircle2 size={14} aria-hidden /> Avaliada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted tabular-nums">
                              <Clock size={12} aria-hidden /> {l.times.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted">{l.teacherName}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {lesson && (
          <form
            className="mt-4 space-y-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <p className="font-bold text-ink">
              Como foi a aula de {lesson.subject} com {lesson.teacherName}?
            </p>
            <div role="radiogroup" aria-label="Estrelas" className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  type="button"
                  key={n}
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={`${n} estrela(s): ${LABELS[n]}`}
                  onClick={() => setStars(n)}
                  className="rounded-full p-1 transition hover:scale-110"
                >
                  <Star size={40} className={n <= stars ? "fill-brand text-brand" : "text-line"} aria-hidden />
                </button>
              ))}
            </div>
            {stars > 0 && <p className="font-bold text-ink">{LABELS[stars]}</p>}
            <label className="block font-bold text-muted">
              Quer contar mais? (opcional — o professor lê o comentário, mas não sabe quem escreveu)
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-line bg-surface p-2 font-normal text-ink"
              />
            </label>
            <button
              type="submit"
              disabled={pending || stars === 0}
              className="rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Enviar avaliação"}
            </button>
          </form>
        )}

        <p role="status" className={`mt-3 font-bold ${result?.ok ? "text-success" : "text-attention"}`}>
          {result?.message}
        </p>
      </Card>
    </div>
  );
}
