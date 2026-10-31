"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateFeedbackSummary } from "@/lib/actions";
import { Stat } from "@/components/shared/ui";
import { useElapsed } from "@/components/shared/useElapsed";

type Props = {
  classroomId: string;
  teacherId: string;
  count: number;
  avgStars: number | null;
  latest: { text: string; createdAt: string } | null;
};

export function FeedbackSummaryPanel({ classroomId, teacherId, count, avgStars, latest }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const elapsed = useElapsed(pending);

  const generate = () =>
    startTransition(async () => {
      const res = await generateFeedbackSummary(classroomId, teacherId);
      setMessage(
        res.ok
          ? res.usedAi
            ? null
            : "A IA demorou demais ou está indisponível, então salvamos um resumo simples. Tente de novo em instantes."
          : res.message,
      );
    });

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Avaliações" value={count} />
        <Stat
          label="Média"
          value={avgStars !== null ? `${avgStars.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ★` : "—"}
          hint="de 3 estrelas"
        />
      </div>
      <button
        onClick={generate}
        disabled={pending || count === 0}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
      >
        <Sparkles size={16} aria-hidden /> {pending ? `Gerando resumo… ${elapsed}s` : "Gerar resumo com IA"}
      </button>
      {message && <p className="text-attention">{message}</p>}
      {latest && (
        <div className="rounded-2xl border border-line bg-surface-2 p-3">
          <div className="mb-1 text-xs font-bold text-muted">
            Resumo de {new Date(latest.createdAt).toLocaleString("pt-BR")}
          </div>
          <p className="whitespace-pre-line text-ink">{latest.text}</p>
        </div>
      )}
    </div>
  );
}
