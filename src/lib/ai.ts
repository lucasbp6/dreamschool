// IA integrada via Featherless (API compatível com OpenAI).
// Sem FEATHERLESS_API_KEY, em caso de erro ou de demora acima de AI_TIMEOUT_MS, as funções devolvem
// um texto de fallback para a demo não travar. O SDK, por padrão, esperaria até 10 minutos.
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MODEL = process.env.FEATHERLESS_MODEL || "Qwen/Qwen2.5-7B-Instruct";
/**
 * A mentoria ("Ensinar o pet") usa um modelo maior: na avaliação (prompts/008) o 32B não errou conteúdo
 * e seguiu melhor o papel de aprendiz; o 7B chegou a ensinar uma regra errada de frações.
 */
export const MENTOR_MODEL = process.env.FEATHERLESS_MENTOR_MODEL || "Qwen/Qwen2.5-32B-Instruct";
/** O 32B pode levar ~18 s quando está "frio"; a mentoria aquece o modelo ao começar a aula e espera mais. */
export const MENTOR_TIMEOUT_MS = 30_000;
const AI_TIMEOUT_MS = 15_000;

type CallOptions = { temperature?: number; maxTokens?: number; model?: string; timeoutMs?: number };

let cached: OpenAI | null | undefined;
function client() {
  if (cached !== undefined) return cached;
  const apiKey = process.env.FEATHERLESS_API_KEY;
  cached = apiKey
    ? new OpenAI({ apiKey, baseURL: "https://api.featherless.ai/v1", timeout: AI_TIMEOUT_MS, maxRetries: 1 })
    : null;
  return cached;
}

async function complete(
  label: string,
  messages: ChatCompletionMessageParam[],
  opts: CallOptions = {},
): Promise<string | null> {
  const ai = client();
  if (!ai) return null;
  const t0 = Date.now();
  try {
    const res = await ai.chat.completions.create(
      {
        model: opts.model ?? MODEL,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 400,
        messages,
      },
      { timeout: opts.timeoutMs ?? AI_TIMEOUT_MS },
    );
    console.info(`[ai] ${label}: ${Date.now() - t0} ms`);
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(`[ai] ${label} falhou após ${Date.now() - t0} ms:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Resposta em streaming: devolve os pedaços de texto conforme chegam, ou null se a IA não estiver disponível. */
export async function streamCompletion(
  label: string,
  messages: ChatCompletionMessageParam[],
  opts: CallOptions = {},
): Promise<AsyncIterable<string> | null> {
  const ai = client();
  if (!ai) return null;
  const t0 = Date.now();
  try {
    const stream = await ai.chat.completions.create(
      {
        model: opts.model ?? MODEL,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 250,
        messages,
        stream: true,
      },
      { timeout: opts.timeoutMs ?? AI_TIMEOUT_MS },
    );
    return (async function* () {
      try {
        for await (const chunk of stream) {
          const piece = chunk.choices[0]?.delta?.content;
          if (piece) yield piece;
        }
        console.info(`[ai] ${label} (stream): ${Date.now() - t0} ms`);
      } catch (err) {
        console.error(`[ai] ${label} (stream) interrompido após ${Date.now() - t0} ms:`, err instanceof Error ? err.message : err);
      }
    })();
  } catch (err) {
    console.error(`[ai] ${label} (stream) falhou após ${Date.now() - t0} ms:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Pedido mínimo, sem esperar a resposta, para o modelo sair do estado "frio" antes de ser usado. */
export function warmUp(model: string) {
  const ai = client();
  if (!ai) return;
  const t0 = Date.now();
  ai.chat.completions
    .create({ model, max_tokens: 1, messages: [{ role: "user", content: "oi" }] }, { timeout: MENTOR_TIMEOUT_MS, maxRetries: 0 })
    .then(() => console.info(`[ai] aquecimento ${model}: ${Date.now() - t0} ms`))
    .catch(() => {});
}

export type AiResult = { text: string; usedAi: boolean };

/** Reescreve uma nota rápida do professor de forma empática e construtiva para os pais. */
export async function humanizeNote(rawText: string, studentName: string, parentName: string): Promise<AiResult> {
  const text = await complete("humanizar recado", [
    {
      role: "system",
      content:
        "Você é um(a) orientador(a) pedagógico(a) de uma escola de ensino básico. Reescreva a nota do professor " +
        "para os responsáveis do aluno em português do Brasil: tom acolhedor, empático e construtivo, sem julgamentos, " +
        "sem as palavras 'punição' ou 'castigo'. Comece valorizando algo positivo, descreva o ponto com clareza e " +
        "termine com uma sugestão prática de como a família pode apoiar em casa. Máximo de 4 frases. Responda só com a mensagem.",
    },
    { role: "user", content: `Responsável: ${parentName}\nAluno(a): ${studentName}\nNota do professor: ${rawText}` },
  ]);
  if (text) return { text, usedAi: true };
  return {
    usedAi: false,
    text:
      `Olá! Gostaríamos de compartilhar como foi o dia de ${studentName}: ${rawText.trim().replace(/\.?$/, ".")} ` +
      `Estamos acompanhando de perto e confiamos muito no potencial de ${studentName}. ` +
      `Uma conversa tranquila em casa sobre o assunto pode ajudar bastante. Contamos com vocês! 💛`,
  };
}

export type FeedbackInput = { stars: number; comment: string | null };

/** Gera um resumo executivo das avaliações da aula para o professor. */
export async function summarizeFeedback(className: string, feedbacks: FeedbackInput[]): Promise<AiResult> {
  const avg = feedbacks.reduce((s, f) => s + f.stars, 0) / Math.max(feedbacks.length, 1);
  // Comentários repetidos viram uma linha só com a contagem: prompt menor, resposta mais rápida.
  const counts = new Map<string, number>();
  for (const f of feedbacks) if (f.comment) counts.set(`(${f.stars}★) ${f.comment}`, (counts.get(`(${f.stars}★) ${f.comment}`) ?? 0) + 1);
  const comments = [...counts].map(([c, n]) => `- ${c}${n > 1 ? ` (×${n})` : ""}`);

  const text = await complete(
    "resumo de avaliações",
    [
      {
        role: "system",
        content:
          "Você é um(a) coordenador(a) pedagógico(a). A partir das avaliações dos alunos (1 a 3 estrelas e comentários), " +
          "escreva em português do Brasil um resumo executivo curto para o professor: 1) pontos fortes, 2) pontos a ajustar, " +
          "3) duas sugestões práticas de didática. Use tópicos curtos. Não identifique alunos.",
      },
      {
        role: "user",
        content: `Turma: ${className}\nTotal de avaliações: ${feedbacks.length}\nMédia: ${avg.toFixed(1)} de 3\nComentários:\n${
          comments.join("\n") || "(nenhum comentário)"
        }`,
      },
    ],
    { maxTokens: 350 },
  );
  if (text) return { text, usedAi: true };
  return {
    usedAi: false,
    text:
      `Resumo de ${feedbacks.length} avaliação(ões) — média ${avg.toFixed(1)} de 3 estrelas.\n` +
      (comments.length ? `Comentários recebidos:\n${comments.join("\n")}\n` : "Nenhum comentário escrito.\n"),
  };
}

export { complete };
