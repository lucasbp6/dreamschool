// Mensagem do aluno-mentor para o pet. Salva a explicação e devolve a resposta do pet em streaming
// (texto puro), salvando-a ao final. Sem IA disponível, responde com uma fala pronta.
import { db } from "@/lib/db";
import { streamCompletion } from "@/lib/ai";
import { MENTOR_MAX_CHARS, fallbackReply, petReplyMessages } from "@/lib/mentor";
import { loadOwnSession } from "@/lib/mentor-data";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MENTOR_MAX_CHARS) : "";
  if (!text) return new Response("Escreva sua explicação.", { status: 400 });

  const loaded = await loadOwnSession(sessionId);
  if (!loaded) return new Response("Aula não encontrada.", { status: 404 });
  if (loaded.session.endedAt) return new Response("Esta aula já terminou.", { status: 409 });

  await db.mentorMessage.create({ data: { sessionId, role: "STUDENT", content: text } });
  const history = [...loaded.history, { role: "STUDENT" as const, content: text }];
  const explanations = history.filter((m) => m.role === "STUDENT").length;

  const stream = await streamCompletion("resposta do pet", petReplyMessages(loaded.ctx, history), {
    temperature: 0.7,
    maxTokens: 200,
  });
  const encoder = new TextEncoder();

  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      if (stream) {
        for await (const piece of stream) {
          reply += piece;
          controller.enqueue(encoder.encode(piece));
        }
      }
      const usedAi = reply.trim().length > 0;
      if (!usedAi) {
        reply = fallbackReply(loaded.ctx, explanations);
        controller.enqueue(encoder.encode(reply));
      }
      await db.mentorMessage.create({ data: { sessionId, role: "PET", content: reply.trim(), usedAi } });
      controller.close();
    },
  });

  return new Response(body$, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
