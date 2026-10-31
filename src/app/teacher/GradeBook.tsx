"use client";

import { useState, useTransition } from "react";
import { FilePlus2, Save } from "lucide-react";
import { createAssessment, deleteAssessment, saveGrades } from "@/lib/teacher-actions";
import { gradeAverage } from "@/lib/game";
import { RemoveButton } from "@/components/shared/ActionForm";

type Assessment = {
  id: string;
  classSubjectId: string;
  title: string;
  date: string;
  maxScore: number;
  grades: { studentId: string; score: number }[];
};

type Props = {
  subjects: { id: string; name: string }[];
  students: { id: string; name: string }[];
  assessments: Assessment[];
  today: string;
};

const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const control = "rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink";

export function GradeBook({ subjects, students, assessments, today }: Props) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const list = assessments.filter((a) => a.classSubjectId === subjectId);
  const selected = list.find((a) => a.id === selectedId) ?? list[0];

  const create = (fd: FormData) =>
    startTransition(async () => {
      const r = await createAssessment(
        subjectId,
        String(fd.get("title") ?? ""),
        String(fd.get("date") ?? ""),
        Number(fd.get("maxScore") ?? 10),
      );
      setResult(r);
      if (r.ok && r.id) setSelectedId(r.id);
    });

  if (subjects.length === 0) return <p className="text-sm text-muted">Você não tem matérias nesta turma.</p>;

  return (
    <div className="grid gap-5 text-sm lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 font-bold text-muted">
            Matéria
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setSelectedId(null);
                setResult(null);
              }}
              className={control}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <p className="text-muted">Nenhuma avaliação nesta matéria. Crie a primeira ao lado.</p>
        ) : (
          <div role="tablist" aria-label="Avaliações" className="flex flex-wrap gap-2">
            {list.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={a.id === selected?.id}
                onClick={() => {
                  setSelectedId(a.id);
                  setResult(null);
                }}
                className={`rounded-full border px-3 py-1.5 font-bold transition ${
                  a.id === selected?.id ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink hover:border-brand"
                }`}
              >
                {a.title} · {a.date.split("-").reverse().slice(0, 2).join("/")}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <ScoreEditor
            key={selected.id}
            assessment={selected}
            students={students}
            onResult={setResult}
          />
        )}
        <p role="status" className={`font-bold ${result?.ok ? "text-success" : "text-attention"}`}>
          {result?.message}
        </p>
      </div>

      <div className="space-y-4">
        <form
          className="space-y-3 rounded-2xl border border-line bg-surface-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            create(new FormData(e.currentTarget));
            e.currentTarget.reset();
          }}
        >
          <h3 className="flex items-center gap-1.5 font-extrabold text-ink">
            <FilePlus2 size={16} aria-hidden /> Nova avaliação
          </h3>
          <label className="flex flex-col gap-1 font-bold text-muted">
            Nome
            <input name="title" required placeholder="Ex.: Prova 2" className={control} />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 font-bold text-muted">
              Data
              <input name="date" type="date" defaultValue={today} required className={control} />
            </label>
            <label className="flex w-24 flex-col gap-1 font-bold text-muted">
              Vale
              <input name="maxScore" type="number" min={1} max={100} step={0.5} defaultValue={10} required className={control} />
            </label>
          </div>
          <button type="submit" disabled={pending} className="rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50">
            Criar avaliação
          </button>
        </form>

        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <h3 className="mb-2 font-extrabold text-ink">Médias na matéria</h3>
          <ul className="space-y-1">
            {students.map((s) => {
              const avg = gradeAverage(
                list.flatMap((a) => a.grades.filter((g) => g.studentId === s.id).map((g) => ({ score: g.score, maxScore: a.maxScore }))),
              );
              return (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="truncate text-ink">{s.name}</span>
                  <span className={`font-extrabold tabular-nums ${avg === null ? "text-muted" : avg >= 6 ? "text-success" : "text-attention"}`}>
                    {avg !== null ? num(avg) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ScoreEditor({
  assessment,
  students,
  onResult,
}: {
  assessment: Assessment;
  students: { id: string; name: string }[];
  onResult: (r: { ok: boolean; message: string }) => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      students.map((s) => {
        const g = assessment.grades.find((x) => x.studentId === s.id);
        return [s.id, g ? String(g.score) : ""];
      }),
    ),
  );
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const r = await saveGrades(
        assessment.id,
        students.map((s) => {
          const raw = scores[s.id].replace(",", ".").trim();
          return { studentId: s.id, score: raw === "" ? null : Number(raw) };
        }),
      );
      onResult(r);
    });

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface-2">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <label htmlFor={`score-${s.id}`} className="font-bold text-ink">
              {s.name}
            </label>
            <span className="flex items-center gap-1 text-muted">
              <input
                id={`score-${s.id}`}
                inputMode="decimal"
                value={scores[s.id]}
                onChange={(e) => setScores((x) => ({ ...x, [s.id]: e.target.value }))}
                placeholder="—"
                className="w-20 rounded-xl border border-line bg-surface px-2 py-1 text-right font-extrabold text-ink tabular-nums"
              />
              / {num(assessment.maxScore)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
        >
          <Save size={16} aria-hidden /> {pending ? "Salvando…" : `Salvar notas de ${assessment.title}`}
        </button>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          Excluir avaliação
          <RemoveButton action={deleteAssessment.bind(null, assessment.id)} label={`Excluir ${assessment.title}`} />
        </span>
      </div>
    </div>
  );
}
