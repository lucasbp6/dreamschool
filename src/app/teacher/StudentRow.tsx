"use client";

import { useState, useTransition } from "react";
import { HeartHandshake, ListChecks, Smile, Sunrise } from "lucide-react";
import { giveAttention, givePositive } from "@/lib/actions";
import { ATTENTION_CATEGORIES, petLevel, type AttentionCategory, type PositiveCategory } from "@/lib/game";
import { PetAvatar } from "@/components/shared/PetAvatar";
import { Badge, ProgressBar } from "@/components/shared/ui";

const POSITIVE_BUTTONS: { key: PositiveCategory; label: string; Icon: typeof Smile }[] = [
  { key: "TASK", label: "Tarefa", Icon: ListChecks },
  { key: "COLLAB", label: "Colaboração", Icon: HeartHandshake },
  { key: "BEHAVIOR", label: "Comportamento", Icon: Smile },
];

type Props = {
  student: { id: string; name: string };
  pet: { petType: string; petName: string; xp: number; mood: string; recoveryMission: string | null };
};

export function StudentRow({ student, pet }: Props) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [showAttention, setShowAttention] = useState(false);
  const lvl = petLevel(pet.xp);

  const run = (fn: () => Promise<void>, message: string) =>
    startTransition(async () => {
      await fn();
      setFlash(message);
      setShowAttention(false);
      setTimeout(() => setFlash(null), 2500);
    });

  return (
    <li className="rounded-2xl border border-line bg-surface-2 p-3" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-3">
        <PetAvatar petType={pet.petType} xp={pet.xp} mood={pet.mood} size="sm" />
        <div className="min-w-40 flex-1">
          <div className="font-extrabold text-ink">
            {student.name} <span className="font-semibold text-muted">· {pet.petName}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted tabular-nums">
            <span className="shrink-0">
              Nv {lvl.level} {lvl.name} · {pet.xp} XP
            </span>
            <ProgressBar value={lvl.progress} label={`XP de ${student.name}`} />
          </div>
          {pet.recoveryMission && (
            <div className="mt-1">
              <Badge tone="attention">Missão de Cuidado: {pet.recoveryMission}</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POSITIVE_BUTTONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              disabled={pending}
              onClick={() => run(() => givePositive(student.id, key), `Ponto positivo para ${pet.petName}! 🎉`)}
              className="inline-flex items-center gap-1 rounded-full bg-success-soft px-3 py-1.5 text-sm font-bold text-success hover:brightness-95 disabled:opacity-50"
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          ))}
          <button
            disabled={pending}
            aria-expanded={showAttention}
            onClick={() => setShowAttention((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-attention-soft px-3 py-1.5 text-sm font-bold text-attention hover:brightness-95 disabled:opacity-50"
          >
            <Sunrise size={14} aria-hidden /> Ponto de Atenção
          </button>
        </div>
      </div>

      {showAttention && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-attention-soft p-2 text-sm">
          <span className="font-semibold text-attention">Motivo:</span>
          {(Object.keys(ATTENTION_CATEGORIES) as AttentionCategory[]).map((key) => (
            <button
              key={key}
              disabled={pending}
              onClick={() =>
                run(() => giveAttention(student.id, key), `${pet.petName} ganhou uma Missão de Cuidado 💛`)
              }
              className="rounded-full border border-attention bg-surface px-3 py-1 font-bold text-attention disabled:opacity-50"
            >
              {ATTENTION_CATEGORIES[key].label}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" className="text-sm font-bold text-brand">
        {flash && <p className="mt-2">{flash}</p>}
      </div>
    </li>
  );
}
