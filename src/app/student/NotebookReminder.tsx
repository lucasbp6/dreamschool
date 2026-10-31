"use client";

import { useEffect, useState } from "react";
import { Check, NotebookPen } from "lucide-react";
import { PetArt } from "@/components/shared/PetArt";
import { Card } from "@/components/shared/ui";

type Props = {
  studentId: string;
  firstName: string;
  pet: { petType: string; petName: string; mood: string };
  /** Dia das aulas (hoje ou o próximo dia letivo) e como chamá-lo ("hoje", "amanhã", "na terça-feira"). */
  date: string;
  when: string;
  subjects: { name: string; time: string }[];
};

/** O pet lembra o aluno de conferir os cadernos das aulas do dia; a lista marcada fica no navegador. */
export function NotebookReminder({ studentId, firstName, pet, date, when, subjects }: Props) {
  const key = `ds-cadernos-${studentId}-${date}`;
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      setChecked([]);
    }
  }, [key]);

  const toggle = (name: string) => {
    const next = checked.includes(name) ? checked.filter((n) => n !== name) : [...checked, name];
    setChecked(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  const done = subjects.length > 0 && subjects.every((s) => checked.includes(s.name));
  const speech = done
    ? `Mochila pronta, ${firstName}! Todos os cadernos conferidos.`
    : `${firstName}, ${when} tem ${subjects.length} ${subjects.length === 1 ? "aula" : "aulas"}! Vamos conferir se os cadernos estão na mochila?`;

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-end gap-3 sm:w-64 sm:shrink-0 sm:flex-col sm:items-center">
          <div className="h-20 w-20 shrink-0 rounded-full bg-brand-soft p-1">
            <PetArt petType={pet.petType} mood={done ? "HAPPY" : pet.mood} className="h-full w-full" />
          </div>
          <p className="relative rounded-2xl bg-brand-soft px-3 py-2 text-sm font-bold text-ink sm:text-center">
            {speech}
          </p>
        </div>
        <div className="flex-1">
          <h3 className="mb-2 flex items-center gap-2 font-extrabold text-ink">
            <NotebookPen size={18} className="text-brand" aria-hidden /> Cadernos para {when}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {subjects.map((s) => {
              const on = checked.includes(s.name);
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(s.name)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left text-sm transition ${
                      on ? "border-success bg-success-soft" : "border-line bg-surface-2 hover:border-brand"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                        on ? "border-success bg-success text-on-brand" : "border-line bg-surface"
                      }`}
                    >
                      {on && <Check size={16} />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-ink">Caderno de {s.name}</span>
                      <span className="text-xs text-muted tabular-nums">aula às {s.time}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {checked.filter((n) => subjects.some((s) => s.name === n)).length} de {subjects.length} na mochila
          </p>
        </div>
      </div>
    </Card>
  );
}
