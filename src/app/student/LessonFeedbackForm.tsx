"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Flame, Star } from "lucide-react";
import { submitLessonFeedback } from "@/lib/actions";
import { FEEDBACK_STREAK_XP } from "@/lib/game";
import type { FeedbackTeacher } from "@/lib/feedback-data";
import { Card, CardTitle } from "@/components/shared/ui";

const LABELS = ["", "Pode melhorar", "Foi legal", "Amei!"];

type Props = {
  studentId: string;
  petName: string;
  teachers: FeedbackTeacher[];
  streak: number;
  required: number;
  ratedRequired: number;
  /** A ofensiva já subiu hoje (o aluno avaliou alguém neste dia letivo). */
  streakCountedToday: boolean;
  bonusToday: boolean;
  /** Motivo de hoje não ser dia letivo (ex.: "feriado: Finados"), ou null. */
  noSchoolReason: string | null;
};

export function LessonFeedbackForm({
  studentId,
  petName,
  teachers,
  streak,
  required,
  ratedRequired,
  streakCountedToday,
  bonusToday,
  noSchoolReason,
}: Props) {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const selected = teachers.find((t) => t.id === teacherId);

  const submit = () =>
    startTransition(async () => {
      if (!teacherId) return;
      const r = await submitLessonFeedback(studentId, teacherId, stars, comment);
      setResult(r);
      if (r.ok) {
        setTeacherId(null);
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
        {required > 0 ? (
          <>
            <p className="mt-3 text-sm font-bold text-ink">
              {streakCountedToday
                ? "Hoje já conta para a sua ofensiva!"
                : "Avalie um professor de hoje para a ofensiva subir."}
            </p>
            <p className="mt-2 text-sm text-ink">
              Hoje: <strong>{ratedRequired} de {required}</strong> professores avaliados.
            </p>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {Array.from({ length: required }, (_, i) => (
                <span key={i} className={`h-3 flex-1 rounded-full ${i < ratedRequired ? "bg-attention" : "border border-line bg-surface"}`} />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              {bonusToday
                ? `Dia completo! ${petName} ganhou +${FEEDBACK_STREAK_XP} XP. Volte no próximo dia de aula para manter a ofensiva.`
                : `Avaliando todos os professores que deram aula hoje, ${petName} ganha +${FEEDBACK_STREAK_XP} XP de bônus.`}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Hoje não é dia letivo{noSchoolReason ? ` (${noSchoolReason})` : ""}, então a ofensiva fica guardadinha até o
            próximo dia de aula. Você ainda pode avaliar, mas a ofensiva não muda.
          </p>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle icon={<Star size={20} className="text-brand" aria-hidden />}>Quem você quer avaliar?</CardTitle>
        {teachers.length === 0 ? (
          <p className="text-sm text-muted">Sua turma ainda não tem professores cadastrados.</p>
        ) : (
          <div role="radiogroup" aria-label="Professor" className="grid gap-2 sm:grid-cols-2">
            {teachers.map((t) => {
              const active = t.id === teacherId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={t.ratedToday || pending}
                  onClick={() => {
                    setTeacherId(t.id);
                    setResult(null);
                  }}
                  className={`rounded-2xl border-2 p-3 text-left transition disabled:cursor-not-allowed ${
                    active ? "border-brand bg-brand-soft" : "border-line bg-surface-2 hover:border-brand"
                  } ${t.ratedToday ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-ink">{t.name}</span>
                    {t.ratedToday ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                        <CheckCircle2 size={14} aria-hidden /> Avaliado hoje
                      </span>
                    ) : (
                      t.hasLessonToday && (
                        <span className="rounded-full bg-attention-soft px-2 text-xs font-bold text-attention">Aula hoje</span>
                      )
                    )}
                  </div>
                  <div className="text-sm text-muted">{t.subjects.join(", ")}</div>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <form
            className="mt-4 space-y-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <p className="font-bold text-ink">Como foi a aula de {selected.name}?</p>
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
              Quer contar mais? (opcional)
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
