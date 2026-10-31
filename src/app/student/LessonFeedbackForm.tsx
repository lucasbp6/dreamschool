"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitLessonFeedback } from "@/lib/actions";

const LABELS = ["", "Pode melhorar", "Foi legal", "Amei!"];

export function LessonFeedbackForm({ studentId }: { studentId: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-bold text-success">Obrigado! Sua opinião ajuda o professor. 💜</p>
        <button className="text-brand underline" onClick={() => setSent(false)}>
          Avaliar outra aula
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await submitLessonFeedback(studentId, stars, comment);
          setStars(0);
          setComment("");
          setSent(true);
        });
      }}
    >
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
            <Star size={36} className={n <= stars ? "fill-brand text-brand" : "text-line"} aria-hidden />
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
  );
}
