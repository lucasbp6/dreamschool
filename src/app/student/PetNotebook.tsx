"use client";

import { useState, useTransition } from "react";
import { BookHeart, ChevronLeft, ChevronRight, Lightbulb, NotebookPen, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { saveStudentNote } from "@/lib/mentor-actions";
import type { NotebookNotes } from "@/lib/mentor";
import { PetArt } from "@/components/shared/PetArt";
import { Card } from "@/components/shared/ui";

export type NotebookPage = {
  id: string;
  subjectName: string;
  topic: string;
  createdAt: string;
  recap: string | null;
  notes: NotebookNotes | null;
  studentNote: string | null;
};

type Pet = { petType: string; petName: string; mood: string };

const TINTS = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4", "bg-tint-5", "bg-tint-6"];
function tintFor(subject: string) {
  let h = 0;
  for (const ch of subject) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" });

/** Capa do caderno: a dupla aluno + pet, com o pet como adesivo. */
export function NotebookCover({ studentFirstName, pet, pages }: { studentFirstName: string; pet: Pet; pages: NotebookPage[] }) {
  const subjects = new Set(pages.map((p) => p.subjectName));
  return (
    <a
      href="#caderno"
      className="card group relative block self-start overflow-hidden rounded-3xl border border-line bg-brand-soft p-5 pl-10 shadow-sm transition hover:-translate-y-0.5"
    >
      <span aria-hidden className="notebook-spiral absolute top-3 bottom-3 left-2 w-6" />
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 -rotate-6 rounded-2xl border-4 border-surface bg-surface p-1 shadow-md">
          <PetArt petType={pet.petType} mood="HAPPY" className="h-full w-full" />
        </div>
        <div>
          <div className="text-xs font-extrabold tracking-wide text-brand uppercase">Caderno de estudos</div>
          <div className="notebook-font text-xl leading-tight text-ink">
            {studentFirstName} &amp; {pet.petName}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink">
        {pages.length === 0
          ? `Ainda em branco. Cada aula que você der para ${pet.petName} vira uma página!`
          : `${pages.length} ${pages.length === 1 ? "página escrita" : "páginas escritas"} juntos em ${subjects.size} ${subjects.size === 1 ? "matéria" : "matérias"}.`}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand group-hover:underline">
        <BookHeart size={16} aria-hidden /> Abrir o caderno
      </span>
    </a>
  );
}

/** Caderno de estudos do aluno com o pet: uma página por aula, com índice por matéria. */
export function PetNotebook({
  studentFirstName,
  pet,
  pages,
  onReview,
}: {
  studentFirstName: string;
  pet: Pet;
  pages: NotebookPage[];
  onReview: (subjectName: string, topic: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(pages[0]?.id ?? null);
  // Página nova (aula que acabou de terminar) abre sozinha.
  const [knownFirst, setKnownFirst] = useState(pages[0]?.id);
  if (pages[0]?.id !== knownFirst) {
    setKnownFirst(pages[0]?.id);
    setOpenId(pages[0]?.id ?? null);
  }
  const index = pages.findIndex((p) => p.id === openId);
  const page = index >= 0 ? pages[index] : null;

  const bySubject = new Map<string, NotebookPage[]>();
  for (const p of pages) bySubject.set(p.subjectName, [...(bySubject.get(p.subjectName) ?? []), p]);

  return (
    <section id="caderno" aria-label={`Caderno de estudos de ${studentFirstName} e ${pet.petName}`} className="scroll-mt-28">
      <Card className="relative pl-10">
        <span aria-hidden className="notebook-spiral absolute top-4 bottom-4 left-2 w-6" />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="h-12 w-12 -rotate-6 rounded-xl border-4 border-surface bg-brand-soft p-0.5 shadow">
            <PetArt petType={pet.petType} mood="HAPPY" className="h-full w-full" />
          </div>
          <div>
            <h2 className="notebook-font text-2xl leading-tight text-ink">
              Caderno de {studentFirstName} &amp; {pet.petName}
            </h2>
            <p className="text-sm text-muted">Tudo o que vocês estudaram juntos, página por página.</p>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="notebook-paper notebook-hand rounded-2xl px-5 py-4 text-ink">
            <p>Oi, {studentFirstName}! Nosso caderno ainda está em branco.</p>
            <p>Me ensine um tema lá em cima e eu escrevo aqui tudo o que a gente aprender. — {pet.petName}</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-4">
            <nav aria-label="Índice do caderno" className="lg:col-span-1">
              <h3 className="mb-2 text-xs font-extrabold tracking-wide text-muted uppercase">Índice</h3>
              <div tabIndex={0} aria-label="Índice (com rolagem)" className="max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                {[...bySubject].map(([subject, list]) => (
                  <div key={subject}>
                    <div className={`rounded-t-xl px-3 py-1 text-xs font-extrabold text-ink ${tintFor(subject)}`}>{subject}</div>
                    <ul className="rounded-b-xl border border-t-0 border-line">
                      {list.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            aria-current={p.id === openId ? "page" : undefined}
                            onClick={() => setOpenId(p.id)}
                            className={`w-full px-3 py-1.5 text-left text-sm transition ${
                              p.id === openId ? "bg-brand-soft font-extrabold text-ink" : "text-ink hover:bg-surface-2"
                            }`}
                          >
                            {p.topic}
                            <span className="block text-xs font-normal text-muted">{fmt.format(new Date(p.createdAt))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            {page && (
              <div className="lg:col-span-3">
                <NotebookPageView
                  key={page.id}
                  page={page}
                  pet={pet}
                  studentFirstName={studentFirstName}
                  onReview={() => onReview(page.subjectName, page.topic)}
                />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    disabled={index >= pages.length - 1}
                    onClick={() => setOpenId(pages[index + 1].id)}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-bold text-ink hover:bg-brand-soft disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden /> Página anterior
                  </button>
                  <span className="text-muted tabular-nums">
                    Página {pages.length - index} de {pages.length}
                  </span>
                  <button
                    type="button"
                    disabled={index <= 0}
                    onClick={() => setOpenId(pages[index - 1].id)}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-bold text-ink hover:bg-brand-soft disabled:opacity-40"
                  >
                    Próxima página <ChevronRight size={16} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

function NotebookPageView({
  page,
  pet,
  studentFirstName,
  onReview,
}: {
  page: NotebookPage;
  pet: Pet;
  studentFirstName: string;
  onReview: () => void;
}) {
  const [note, setNote] = useState(page.studentNote ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const notes = page.notes;

  return (
    <article className="notebook-paper rounded-2xl px-5 py-3 text-ink shadow-inner" aria-label={`Página: ${page.topic}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 text-xs font-extrabold leading-6 text-ink ${tintFor(page.subjectName)}`}>
          {page.subjectName}
        </span>
        <span className="notebook-hand text-muted">{fmt.format(new Date(page.createdAt))}</span>
      </div>
      <h3 className="notebook-font text-3xl leading-[4rem] text-brand underline decoration-wavy decoration-2 underline-offset-8">
        {page.topic}
      </h3>

      <section className="notebook-hand">
        <h4 className="flex items-center gap-2 font-sans text-sm font-extrabold tracking-wide text-muted uppercase">
          <Sparkles size={16} className="text-brand" aria-hidden /> O que aprendemos juntos
        </h4>
        {notes && notes.learned.length > 0 ? (
          <ul className="list-none">
            {notes.learned.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-brand">★</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{page.recap ?? "Esta aula terminou antes de termos o que anotar."}</p>
        )}
      </section>

      {notes && notes.careful.length > 0 && (
        <section className="notebook-hand my-2 rounded-xl bg-attention-soft px-3">
          <h4 className="flex items-center gap-2 font-sans text-sm font-extrabold tracking-wide text-attention uppercase">
            <TriangleAlert size={16} aria-hidden /> Cuidado! A gente tinha confundido
          </h4>
          <ul>
            {notes.careful.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {notes?.review && (
        <section className="notebook-hand">
          <h4 className="flex items-center gap-2 font-sans text-sm font-extrabold tracking-wide text-muted uppercase">
            <Lightbulb size={16} className="text-brand" aria-hidden /> Pergunta para revisar
          </h4>
          <p>{notes.review}</p>
        </section>
      )}

      {page.recap && notes && (
        <div className="my-2 flex items-start gap-2">
          <div className="h-12 w-12 shrink-0 rotate-3 rounded-xl border-2 border-surface bg-brand-soft p-0.5 shadow">
            <PetArt petType={pet.petType} mood="HAPPY" className="h-full w-full" />
          </div>
          <p className="notebook-hand rounded-2xl rounded-tl-sm bg-brand-soft px-3 leading-8">
            <span className="sr-only">Recado de {pet.petName}: </span>
            {page.recap}
          </p>
        </div>
      )}

      <section className="mt-2">
        <label htmlFor={`nota-${page.id}`} className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-muted uppercase">
          <NotebookPen size={16} className="text-brand" aria-hidden /> Minha anotação
        </label>
        <textarea
          id={`nota-${page.id}`}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setStatus(null);
          }}
          maxLength={600}
          rows={3}
          placeholder={`${studentFirstName}, escreva aqui com as suas palavras o que você quer lembrar…`}
          className="notebook-hand w-full resize-y rounded-xl border border-dashed border-line bg-transparent px-2 text-ink placeholder:text-muted"
        />
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <button
            type="button"
            disabled={pending || note === (page.studentNote ?? "")}
            onClick={() =>
              startTransition(async () => {
                const r = await saveStudentNote(page.id, note);
                setStatus(r.message);
              })
            }
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-on-brand disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar anotação"}
          </button>
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-1 rounded-full border border-brand bg-surface px-4 py-1.5 text-sm font-bold text-brand hover:bg-brand-soft"
          >
            <RotateCcw size={14} aria-hidden /> Revisar com {pet.petName}
          </button>
          {status && (
            <span role="status" className="text-sm font-bold text-success">
              {status}
            </span>
          )}
        </div>
      </section>
    </article>
  );
}
