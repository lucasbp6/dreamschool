"use client";

import { useState, useTransition } from "react";
import { Send, Wand2 } from "lucide-react";
import { previewParentNote, saveParentNote } from "@/lib/actions";
import { useElapsed } from "@/components/shared/useElapsed";

export function ParentNoteComposer({ students }: { students: { id: string; name: string }[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState("");
  const [usedAi, setUsedAi] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const elapsed = useElapsed(pending);

  const humanize = () =>
    startTransition(async () => {
      setStatus(null);
      const res = await previewParentNote(studentId, raw);
      setDraft(res.text);
      setUsedAi(res.usedAi);
    });

  const save = () =>
    startTransition(async () => {
      await saveParentNote(studentId, raw, draft);
      setRaw("");
      setDraft("");
      setUsedAi(null);
      setStatus("Recado enviado para a família! 💌");
    });

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col gap-1 font-bold text-muted">
          Aluno
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-60 flex-1 flex-col gap-1 font-bold text-muted">
          Nota rápida
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='Ex.: "conversou muito e não fez o dever"'
            className="rounded-xl border border-line bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>
      <button
        onClick={humanize}
        disabled={pending || !raw.trim() || !studentId}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
      >
        <Wand2 size={16} aria-hidden /> {pending && !draft ? `Humanizando… ${elapsed}s` : "Humanizar com IA"}
      </button>

      {draft && (
        <div className="space-y-2 rounded-2xl border border-line bg-surface-2 p-3">
          <label className="block font-bold text-muted" htmlFor="parent-note-draft">
            Prévia para a família {usedAi === false && <span className="font-normal">(texto modelo — a IA demorou ou está indisponível)</span>}
          </label>
          <textarea
            id="parent-note-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-line bg-surface p-3 text-ink"
          />
          <button
            onClick={save}
            disabled={pending || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 font-bold text-on-brand disabled:opacity-50"
          >
            <Send size={16} aria-hidden /> Enviar para a família
          </button>
        </div>
      )}
      <p aria-live="polite" className="font-bold text-success">
        {status}
      </p>
    </div>
  );
}
