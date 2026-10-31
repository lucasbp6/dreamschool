"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GraduationCap, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { endMentorSession, startMentorSession, type MentorEnd } from "@/lib/mentor-actions";
import { MENTOR_MAX_CHARS, MENTOR_MIN_EXPLANATIONS, MENTOR_XP } from "@/lib/mentor";
import { PetArt } from "@/components/shared/PetArt";
import { Card, CardTitle } from "@/components/shared/ui";
import { useSpeechToText } from "@/components/shared/useSpeechToText";

type Message = { id: string; role: "STUDENT" | "PET"; content: string; viaAudio?: boolean };
type Session = { id: string; subjectName: string; topic: string; messages: Message[] };
type Past = { id: string; subjectName: string; topic: string; recap: string | null; createdAt: string };

type Props = {
  subjects: string[];
  pet: { petType: string; petName: string; mood: string };
  active: Session | null;
  past: Past[];
};

const control = "rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink";
const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function MentorChat({ subjects, pet, active, past }: Props) {
  const [ended, setEnded] = useState<(MentorEnd & { topic: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const start = (fd: FormData) =>
    startTransition(async () => {
      setError(null);
      setEnded(null);
      const r = await startMentorSession(String(fd.get("subject") ?? ""), String(fd.get("topic") ?? ""));
      if (!r.ok) setError(r.message);
    });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {active ? (
          <ChatRoom key={active.id} session={active} pet={pet} onEnded={(r) => setEnded({ ...r, topic: active.topic })} />
        ) : (
          <Card>
            <CardTitle icon={<GraduationCap size={20} className="text-brand" aria-hidden />}>
              Hoje você é o professor de {pet.petName}!
            </CardTitle>
            <p className="mb-4 text-sm text-muted">
              Escolha um tema da aula e explique com as suas palavras, escrevendo ou falando no microfone.{" "}
              {pet.petName} vai fazer perguntas e, se algo ficar confuso, vocês descobrem juntos o jeito certo. Explique pelo menos {MENTOR_MIN_EXPLANATIONS} vezes
              para ganhar +{MENTOR_XP} XP (uma vez por dia).
            </p>
            <form
              className="flex flex-wrap items-end gap-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                start(new FormData(e.currentTarget));
              }}
            >
              <label className="flex flex-col gap-1 font-bold text-muted">
                Matéria
                <select name="subject" className={control} required>
                  {subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-56 flex-1 flex-col gap-1 font-bold text-muted">
                Tema
                <input name="topic" required minLength={3} maxLength={80} placeholder="Ex.: Frações, Fotossíntese…" className={control} />
              </label>
              <button
                type="submit"
                disabled={pending || subjects.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
              >
                <Sparkles size={16} aria-hidden /> {pending ? "Preparando…" : "Começar a aula"}
              </button>
            </form>
            {error && <p className="mt-2 font-bold text-attention">{error}</p>}
          </Card>
        )}

        {ended?.recap && (
          <Card className="border-brand bg-brand-soft">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 shrink-0 rounded-full bg-surface p-1">
                <PetArt petType={pet.petType} mood="HAPPY" className="h-full w-full" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink">O que {pet.petName} aprendeu sobre {ended.topic}</h3>
                <p className="mt-1 text-ink">{ended.recap}</p>
                <p className={`mt-2 text-sm font-bold ${ended.xp ? "text-success" : "text-muted"}`}>{ended.message}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card>
        <CardTitle>Aulas anteriores</CardTitle>
        {past.length === 0 ? (
          <p className="text-sm text-muted">Você ainda não deu nenhuma aula para {pet.petName}.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {past.map((p) => (
              <li key={p.id} className="rounded-2xl border border-line bg-surface-2 p-3">
                <div className="font-extrabold text-ink">{p.topic}</div>
                <div className="text-xs text-muted">
                  {p.subjectName} · {fmt.format(new Date(p.createdAt))}
                </div>
                {p.recap && <p className="mt-1 text-ink">{p.recap}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ChatRoom({
  session,
  pet,
  onEnded,
}: {
  session: Session;
  pet: Props["pet"];
  onEnded: (r: MentorEnd) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viaAudio, setViaAudio] = useState(false);
  const [ending, startEnding] = useTransition();
  const speech = useSpeechToText((t) => {
    setText(t);
    setViaAudio(true);
  });
  const bottom = useRef<HTMLDivElement>(null);
  const explanations = messages.filter((m) => m.role === "STUDENT").length;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || streaming) return;
    speech.stop();
    const spoken = viaAudio;
    setViaAudio(false);
    setText("");
    setError(null);
    setStreaming(true);
    const petId = `pet-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: `me-${Date.now()}`, role: "STUDENT", content, viaAudio: spoken },
      { id: petId, role: "PET", content: "" },
    ]);
    try {
      const res = await fetch(`/api/mentor/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, viaAudio: spoken }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((msg) => (msg.id === petId ? { ...msg, content: msg.content + piece } : msg)));
      }
    } catch (e) {
      setMessages((m) => m.filter((msg) => msg.id !== petId));
      setError(e instanceof Error && e.message ? e.message : "Não consegui falar com o pet agora. Tente de novo.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardTitle
        icon={<GraduationCap size={20} className="text-brand" aria-hidden />}
        aside={
          <span className="text-xs font-bold text-muted tabular-nums">
            {Math.min(explanations, MENTOR_MIN_EXPLANATIONS)}/{MENTOR_MIN_EXPLANATIONS} explicações
          </span>
        }
      >
        Ensinando {session.topic}
        <span className="text-sm font-semibold text-muted"> · {session.subjectName}</span>
      </CardTitle>

      <div role="log" aria-live="polite" aria-label={`Conversa com ${pet.petName}`} className="max-h-[28rem] space-y-3 overflow-y-auto rounded-2xl bg-surface-2 p-3">
        {messages.map((m) =>
          m.role === "PET" ? (
            <div key={m.id} className="flex items-end gap-2">
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface p-0.5 ring-2 ring-line">
                <PetArt petType={pet.petType} mood={pet.mood === "TIRED" ? "NEUTRAL" : "HAPPY"} className="h-full w-full" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-2 text-ink">
                <span className="sr-only">{pet.petName}: </span>
                {m.content || <span className="text-muted">{pet.petName} está pensando…</span>}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-on-brand">
                <span className="sr-only">Você{m.viaAudio ? " (falado)" : ""}: </span>
                {m.viaAudio && <Mic size={14} className="mr-1 inline align-[-2px] opacity-80" aria-hidden />}
                {m.content}
              </div>
            </div>
          ),
        )}
        <div ref={bottom} />
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Sua explicação para {pet.petName}</span>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!e.target.value) setViaAudio(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={MENTOR_MAX_CHARS}
            placeholder={
              speech.listening ? "Pode falar, estou ouvindo…" : `Escreva ou fale sua explicação para ${pet.petName}…`
            }
            className="w-full resize-none rounded-xl border border-line bg-surface p-2 text-ink"
          />
        </label>
        {speech.supported && (
          <button
            type="button"
            onClick={() => (speech.listening ? speech.stop() : speech.start(text))}
            disabled={streaming}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? "Parar de ouvir" : "Falar a explicação"}
            title={speech.listening ? "Parar de ouvir" : "Falar a explicação"}
            className={`rounded-full p-3 transition disabled:opacity-50 ${
              speech.listening ? "animate-pulse bg-attention text-on-brand" : "border border-line bg-surface text-brand hover:bg-brand-soft"
            }`}
          >
            {speech.listening ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
          </button>
        )}
        <button
          type="submit"
          disabled={streaming || !text.trim()}
          aria-label="Enviar"
          className="rounded-full bg-brand p-3 text-on-brand disabled:opacity-50"
        >
          <Send size={18} aria-hidden />
        </button>
      </form>
      {speech.listening && (
        <p role="status" className="mt-2 text-sm font-bold text-attention">
          Ouvindo… quando terminar, toque no microfone, confira o texto e envie.
        </p>
      )}
      {!speech.supported && (
        <p className="mt-2 text-xs text-muted">Para falar em vez de escrever, use o Chrome, o Edge ou o Safari.</p>
      )}
      {(error || speech.error) && <p className="mt-2 text-sm font-bold text-attention">{error ?? speech.error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          {explanations >= MENTOR_MIN_EXPLANATIONS
            ? `Ótima aula! Termine quando quiser para ${pet.petName} contar o que aprendeu.`
            : `Explique mais ${MENTOR_MIN_EXPLANATIONS - explanations} vez(es) para valer +${MENTOR_XP} XP.`}
        </span>
        <button
          type="button"
          disabled={streaming || ending}
          onClick={() =>
            startEnding(async () => {
              const r = await endMentorSession(session.id);
              onEnded(r);
            })
          }
          className="rounded-full border border-line bg-surface px-4 py-2 font-bold text-ink hover:bg-brand-soft disabled:opacity-50"
        >
          {ending ? `${pet.petName} está resumindo…` : "Terminar a aula"}
        </button>
      </div>
    </Card>
  );
}
