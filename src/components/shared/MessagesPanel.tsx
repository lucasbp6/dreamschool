"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mail, MailPlus, Send } from "lucide-react";
import { markConversationRead, replyConversation, startConversation } from "@/lib/message-actions";
import type { ConversationView, Recipient } from "@/lib/messages-data";
import type { Role } from "@/lib/game";
import { Card, CardTitle } from "./ui";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const control = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink";

type Props = {
  role: Role;
  conversations: ConversationView[];
  /** Só para os pais: para quem podem escrever e sobre qual filho. */
  recipients?: Recipient[];
  students?: { id: string; name: string }[];
};

/** Caixa de mensagens entre responsáveis e professores/gestão. */
export function MessagesPanel({ role, conversations, recipients, students }: Props) {
  const canStart = role === "PARENT" && !!recipients;
  // Nenhuma conversa abre sozinha: as abas montam este painel mesmo escondido, e abrir marca como lida.
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(conversations.length === 0 && canStart);
  const open = conversations.find((c) => c.id === openId) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardTitle
          icon={<Mail size={20} className="text-brand" aria-hidden />}
          aside={
            canStart && (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-on-brand"
              >
                <MailPlus size={14} aria-hidden /> Nova mensagem
              </button>
            )
          }
        >
          Conversas
        </CardTitle>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted">
            {canStart ? "Nenhuma conversa ainda." : "Nenhuma mensagem dos responsáveis ainda."}
          </p>
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1" aria-label="Conversas">
            {conversations.map((c) => {
              const active = c.id === openId && !composing;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setOpenId(c.id);
                      setComposing(false);
                      // Só quem clicou e leu a conversa a marca como lida.
                      if (c.unread) markConversationRead(role, c.id);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left text-sm transition ${
                      active ? "border-brand bg-brand-soft" : "border-line bg-surface-2 hover:border-brand"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate ${c.unread ? "font-extrabold text-ink" : "font-bold text-ink"}`}>{c.subject}</span>
                      {c.unread && (
                        <span className="shrink-0 rounded-full bg-attention px-2 text-xs font-bold text-on-brand">nova</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {c.withName} · {c.withRole}
                      {c.studentName ? ` · sobre ${c.studentName}` : ""}
                    </div>
                    <div className="text-xs text-muted">{fmt.format(new Date(c.updatedAt))}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="lg:col-span-2">
        {composing && canStart ? (
          <NewConversation
            recipients={recipients!}
            students={students ?? []}
            onSent={(id) => {
              setOpenId(id);
              setComposing(false);
            }}
            onCancel={conversations.length ? () => setComposing(false) : undefined}
          />
        ) : open ? (
          <Thread key={open.id} role={role} conversation={open} />
        ) : (
          <Card>
            <p className="text-sm text-muted">
              {conversations.length ? "Escolha uma conversa na lista para ler e responder." : "Nenhuma conversa ainda."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Thread({ role, conversation }: { role: Role; conversation: ConversationView }) {
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [conversation.messages.length]);

  const send = () =>
    startTransition(async () => {
      const r = await replyConversation(role, conversation.id, body);
      setResult(r.ok ? null : r);
      if (r.ok) setBody("");
    });

  return (
    <Card>
      <h3 className="text-lg font-extrabold text-ink">{conversation.subject}</h3>
      <p className="mb-3 text-sm text-muted">
        Com {conversation.withName} ({conversation.withRole})
        {conversation.studentName ? ` · sobre ${conversation.studentName}` : ""}
      </p>
      <div role="log" aria-label="Mensagens" className="max-h-[26rem] space-y-3 overflow-y-auto rounded-2xl bg-surface-2 p-3">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : ""}`}>
            <div
              className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm ${
                m.mine ? "rounded-br-sm bg-brand text-on-brand" : "rounded-bl-sm border border-line bg-surface text-ink"
              }`}
            >
              <div className={`mb-0.5 text-xs font-bold ${m.mine ? "opacity-85" : "text-muted"}`}>
                {m.mine ? "Você" : m.authorName} · {fmt.format(new Date(m.createdAt))}
              </div>
              <p className="whitespace-pre-line">{m.body}</p>
            </div>
          </div>
        ))}
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
          <span className="sr-only">Responder</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Escreva sua resposta…" className={`${control} resize-none`} />
        </label>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-on-brand disabled:opacity-50"
        >
          <Send size={16} aria-hidden /> Enviar
        </button>
      </form>
      {result && <p className="mt-2 text-sm font-bold text-attention">{result.message}</p>}
    </Card>
  );
}

function NewConversation({
  recipients,
  students,
  onSent,
  onCancel,
}: {
  recipients: Recipient[];
  students: { id: string; name: string }[];
  onSent: (conversationId: string) => void;
  onCancel?: () => void;
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardTitle icon={<MailPlus size={20} className="text-brand" aria-hidden />}>Nova mensagem</CardTitle>
      {recipients.length === 0 ? (
        <p className="text-sm text-muted">Ainda não há professores ou gestão para receber mensagens.</p>
      ) : (
        <form
          className="space-y-3 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await startConversation(
                String(fd.get("recipientId") ?? ""),
                String(fd.get("studentId") ?? ""),
                String(fd.get("subject") ?? ""),
                String(fd.get("body") ?? ""),
              );
              setResult(r);
              if (r.ok && r.conversationId) onSent(r.conversationId);
            });
          }}
        >
          <label className="block font-bold text-muted">
            Para
            <select name="recipientId" required className={`mt-1 ${control} font-semibold`}>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {students.length > 0 && (
            <label className="block font-bold text-muted">
              Sobre
              <select name="studentId" defaultValue={students.length === 1 ? students[0].id : ""} className={`mt-1 ${control} font-semibold`}>
                <option value="">Assunto geral</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block font-bold text-muted">
            Assunto
            <input name="subject" required maxLength={120} placeholder="Ex.: Dúvida sobre a tarefa de Matemática" className={`mt-1 ${control}`} />
          </label>
          <label className="block font-bold text-muted">
            Mensagem
            <textarea name="body" required rows={5} maxLength={2000} className={`mt-1 ${control}`} />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
            >
              <Send size={16} aria-hidden /> {pending ? "Enviando…" : "Enviar mensagem"}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="rounded-full border border-line px-4 py-2 font-bold text-ink">
                Cancelar
              </button>
            )}
          </div>
          {result && !result.ok && <p className="font-bold text-attention">{result.message}</p>}
        </form>
      )}
    </Card>
  );
}
