// IA integrada via Featherless (API compatível com OpenAI).
// Sem FEATHERLESS_API_KEY ou em caso de erro, devolve um texto de fallback para a demo não quebrar.
import OpenAI from "openai";

const MODEL = "Qwen/Qwen2.5-7B-Instruct";

function client() {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  return apiKey ? new OpenAI({ apiKey, baseURL: "https://api.featherless.ai/v1" }) : null;
}

async function complete(system: string, user: string): Promise<string | null> {
  const ai = client();
  if (!ai) return null;
  try {
    const res = await ai.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      max_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[ai] falha na Featherless:", err);
    return null;
  }
}

export type AiResult = { text: string; usedAi: boolean };

/** Reescreve uma nota rápida do professor de forma empática e construtiva para os pais. */
export async function humanizeNote(rawText: string, studentName: string, parentName: string): Promise<AiResult> {
  const text = await complete(
    "Você é um(a) orientador(a) pedagógico(a) de uma escola de ensino básico. Reescreva a nota do professor " +
      "para os responsáveis do aluno em português do Brasil: tom acolhedor, empático e construtivo, sem julgamentos, " +
      "sem as palavras 'punição' ou 'castigo'. Comece valorizando algo positivo, descreva o ponto com clareza e " +
      "termine com uma sugestão prática de como a família pode apoiar em casa. Máximo de 4 frases. Responda só com a mensagem.",
    `Responsável: ${parentName}\nAluno(a): ${studentName}\nNota do professor: ${rawText}`,
  );
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
  const comments = feedbacks.filter((f) => f.comment).map((f) => `- (${f.stars}★) ${f.comment}`);

  const text = await complete(
    "Você é um(a) coordenador(a) pedagógico(a). A partir das avaliações dos alunos (1 a 3 estrelas e comentários), " +
      "escreva em português do Brasil um resumo executivo curto para o professor: 1) pontos fortes, 2) pontos a ajustar, " +
      "3) duas sugestões práticas de didática. Use tópicos curtos. Não identifique alunos.",
    `Turma: ${className}\nTotal de avaliações: ${feedbacks.length}\nMédia: ${avg.toFixed(1)} de 3\nComentários:\n${
      comments.join("\n") || "(nenhum comentário)"
    }`,
  );
  if (text) return { text, usedAi: true };
  return {
    usedAi: false,
    text:
      `Resumo de ${feedbacks.length} avaliação(ões) — média ${avg.toFixed(1)} de 3 estrelas.\n` +
      (comments.length ? `Comentários recebidos:\n${comments.join("\n")}\n` : "Nenhum comentário escrito.\n") +
      `(Configure FEATHERLESS_API_KEY para gerar a análise com IA.)`,
  };
}
