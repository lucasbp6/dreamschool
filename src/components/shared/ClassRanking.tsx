"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { RankedClass } from "@/lib/ranking-data";
import { Card, CardTitle } from "./ui";

// Medalhas em tons suaves (ouro, prata, bronze), no estilo pastel do app.
const MEDAL = ["#d9b864", "#b9b6c8", "#c99a6e"];

function Medal({ position }: { position: number }) {
  const color = MEDAL[position - 1];
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-ink ring-2 ring-surface"
      style={{ background: color ?? "var(--surface-2)" }}
    >
      {position}º
    </span>
  );
}

const MODES = {
  overall: { label: "Geral", unit: "tijolinhos no total", hint: "Todos os tijolinhos que cada turma já juntou." },
  weekly: { label: "Esta semana", unit: "tijolinhos na semana", hint: "Tijolinhos ganhos nos últimos 7 dias." },
} as const;

/** Ranking das turmas pelos tijolinhos da construção coletiva, com pódio e lista completa. */
export function ClassRanking({
  overall,
  weekly,
  highlightId,
}: {
  overall: RankedClass[];
  weekly: RankedClass[];
  /** Turma de quem está vendo (aluno, pais, professor), destacada na lista. */
  highlightId?: string;
}) {
  const [mode, setMode] = useState<keyof typeof MODES>("overall");
  const rows = mode === "overall" ? overall : weekly;
  const max = Math.max(...rows.map((r) => r.score), 1);
  const mine = rows.find((r) => r.id === highlightId);
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean) as RankedClass[];

  return (
    <Card>
      <CardTitle
        icon={<Trophy size={20} className="text-brand" aria-hidden />}
        aside={
          <div role="group" aria-label="Período do ranking" className="flex gap-1 rounded-full bg-surface-2 p-1 text-xs font-bold">
            {(Object.keys(MODES) as (keyof typeof MODES)[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 transition ${mode === m ? "bg-brand text-on-brand" : "text-ink hover:bg-brand-soft"}`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>
        }
      >
        Ranking das turmas
      </CardTitle>
      <p className="mb-4 text-sm text-muted">{MODES[mode].hint} Cada conquista de um aluno ajuda a turma toda!</p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma turma cadastrada.</p>
      ) : (
        <>
          {mine && (
            <p className="mb-4 rounded-2xl bg-brand-soft px-4 py-2 text-sm font-bold text-ink">
              {mine.position === 1
                ? `A ${mine.name} está em 1º lugar! Continuem assim!`
                : `A ${mine.name} está em ${mine.position}º lugar — faltam ${mine.gapToNext} tijolinhos para subir de posição.`}
            </p>
          )}

          {/* Pódio: 2º, 1º e 3º lugares */}
          <ol className="mb-5 flex items-end justify-center gap-3" aria-label="Pódio">
            {podium.map((r) => (
              <li key={r.id} className="flex w-32 flex-col items-center text-center sm:w-40">
                <Image src={r.art} alt={`${r.buildingLabel}: ${r.stageName}`} width={160} height={140} className="h-auto w-full" />
                <div
                  className={`flex w-full flex-col items-center gap-1 rounded-t-2xl px-2 pt-2 pb-3 ${
                    r.id === highlightId ? "bg-brand-soft ring-2 ring-brand" : "bg-surface-2"
                  } ${r.position === 1 ? "min-h-28" : r.position === 2 ? "min-h-20" : "min-h-14"}`}
                >
                  <Medal position={r.position} />
                  <span className="text-sm font-extrabold text-ink">{r.name}</span>
                  <span className="text-xs font-bold text-muted tabular-nums">{r.score} tijolinhos</span>
                </div>
              </li>
            ))}
          </ol>

          <ol tabIndex={0} aria-label="Classificação completa" className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {rows.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
                  r.id === highlightId ? "border-brand bg-brand-soft" : "border-line bg-surface-2"
                }`}
              >
                <Medal position={r.position} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-extrabold text-ink">
                      {r.name}
                      {r.id === highlightId && <span className="ml-2 rounded-full bg-brand px-2 text-xs text-on-brand">sua turma</span>}
                    </span>
                    <span className="text-sm font-extrabold text-ink tabular-nums">
                      {r.score} <span className="font-normal text-muted">{MODES[mode].unit}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(r.score / max) * 100}%` }} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {r.buildingLabel} · {r.stageName} · {r.students} {r.students === 1 ? "aluno" : "alunos"}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  );
}
