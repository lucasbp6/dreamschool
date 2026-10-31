// Conversa do "Ensinar o pet", em streaming (texto puro):
// - { open: true }: o pet abre a aula (só se ainda não houver mensagens);
// - { text, viaAudio }: o aluno explica e o pet responde.
// A resposta do pet é salva ao final. Sem IA disponível, o pet usa uma fala pronta.
import { db } from "@/lib/db";
import { MENTOR_FALLBACK_MODEL, MENTOR_MODEL, MENTOR_TIMEOUT_MS, streamCompletion } from "@/lib/ai";
import {
  MENTOR_MAX_CHARS,
  createSpeechFilter,
  fallbackOpener,
  fallbackReply,
  openerMessages,
  petReplyMessages,
  tidySpeech,
} from "@/lib/mentor";
import { loadOwnSession } from "@/lib/mentor-data";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = (await request.json().catch(() => null)) as { text?: unknown; viaAudio?: unknown; open?: unknown } | null;
  const opening = body?.open === true;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MENTOR_MAX_CHARS) : "";
  if (!opening && !text) return new Response("Escreva ou fale sua explicação.", { status: 400 });

  const loaded = await loadOwnSession(sessionId);
  if (!loaded) return new Response("Aula não encontrada.", { status: 404 });
  if (loaded.session.endedAt) return new Response("Esta aula já terminou.", { status: 409 });
  if (opening && loaded.history.length > 0) return new Response("A aula já começou.", { status: 409 });

  let messages;
  let fallback: string;
  let label: string;
  if (opening) {
    messages = openerMessages(loaded.ctx);
    fallback = fallbackOpener(loaded.ctx, Math.floor(Math.random() * 3));
    label = "abertura do pet";
  } else {
    await db.mentorMessage.create({ data: { sessionId, role: "STUDENT", content: text, viaAudio: body?.viaAudio === true } });
    const history = [...loaded.history, { role: "STUDENT" as const, content: text }];
    messages = petReplyMessages(loaded.ctx, history);
    fallback = fallbackReply(loaded.ctx, history.filter((m) => m.role === "STUDENT").length);
    label = "resposta do pet";
  }

  const stream = await streamCompletion(label, messages, {
    temperature: opening ? 0.9 : 0.7,
    maxTokens: 200,
    model: MENTOR_MODEL,
    fallbackModel: MENTOR_FALLBACK_MODEL,
    timeoutMs: MENTOR_TIMEOUT_MS,
  });
  const filter = createSpeechFilter();
  const encoder = new TextEncoder();

  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      if (stream) {
        for await (const raw of stream) {
          const piece = filter(raw);
          if (!piece) continue;
          reply += piece;
          controller.enqueue(encoder.encode(piece));
        }
      }
      const usedAi = reply.trim().length > 0;
      if (!usedAi) {
        reply = fallback;
        controller.enqueue(encoder.encode(reply));
      }
      await db.mentorMessage.create({ data: { sessionId, role: "PET", content: tidySpeech(reply), usedAi } });
      controller.close();
    },
  });

  return new Response(body$, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
