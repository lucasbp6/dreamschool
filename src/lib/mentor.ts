// "Ensinar o pet": o aluno é o mentor e explica um tema da aula; o pet é um aprendiz curioso que faz
// perguntas e, quando a explicação tem um erro, levanta a dúvida com gentileza e traz a informação certa.
// Funções puras (sem banco nem IA): montam os prompts e aplicam as regras da recompensa.
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { PET_INFO, firstName, type PetType } from "./game";

export const MENTOR_XP = 5;
/** Explicações do aluno necessárias para a aula valer XP. */
export const MENTOR_MIN_EXPLANATIONS = 3;
export const MENTOR_MAX_CHARS = 600;
/** Mensagens mais recentes enviadas ao modelo (mantém o prompt pequeno e a resposta rápida). */
export const MENTOR_HISTORY = 12;

export type MentorContext = {
  petName: string;
  petType: string;
  studentName: string;
  subjectName: string;
  topic: string;
};

export type MentorTurn = { role: "STUDENT" | "PET"; content: string };

function persona(ctx: MentorContext) {
  const species = PET_INFO[ctx.petType as PetType]?.label.toLowerCase() ?? "pet";
  const mentor = firstName(ctx.studentName);
  return (
    `Você é ${ctx.petName}, um(a) ${species} de estimação que adora aprender. ${mentor} é seu(sua) mentor(a): ` +
    `uma criança do ensino fundamental que vai te ensinar sobre "${ctx.topic}" (${ctx.subjectName}). ` +
    `Fale em português do Brasil, com palavras simples para uma criança de 8 a 11 anos, em tom carinhoso e animado.\n\n` +
    `Regras:\n` +
    `- Você é o aprendiz, não o professor. Responda em no máximo 3 frases curtas.\n` +
    `- Se a explicação estiver correta, comemore de forma breve e faça UMA pergunta curiosa que ajude ${mentor} a ` +
    `aprofundar ou dar um exemplo.\n` +
    `- Se houver um erro, NÃO diga que está errado de forma dura. Mostre a dúvida com gentileza ` +
    `("Hmm, fiquei confuso... eu tinha ouvido que..."), e SEMPRE diga a informação correta de forma clara e completa ` +
    `em uma frase (com o número, o nome ou a regra certa, e um exemplo simples se ajudar). Não dê só pistas. ` +
    `Depois peça para ${mentor} conferir com você.\n` +
    `- Se a explicação estiver certa, não invente que falta algo.\n` +
    `- As explicações podem ter sido faladas e transcritas automaticamente: ignore erros de digitação, pontuação ou ` +
    `palavras trocadas pela transcrição e corrija só erros de conteúdo.\n` +
    `- Nunca invente fatos. Se não tiver certeza, diga que vocês podem perguntar ao professor.\n` +
    `- Fique no tema da aula. Se a conversa fugir do tema ou tiver algo inadequado ou dados pessoais, volte ` +
    `gentilmente para "${ctx.topic}".\n` +
    `- Não fale que é uma inteligência artificial e não use listas nem markdown.`
  );
}

export function greeting(ctx: MentorContext) {
  return `Oba, ${firstName(ctx.studentName)}! Hoje você vai me ensinar sobre ${ctx.topic}? Estou prontinho para aprender! Por onde a gente começa?`;
}

/** Mensagens para o modelo responder como o pet, usando só o histórico mais recente. */
export function petReplyMessages(ctx: MentorContext, history: MentorTurn[]): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: persona(ctx) },
    ...history.slice(-MENTOR_HISTORY).map<ChatCompletionMessageParam>((m) => ({
      role: m.role === "STUDENT" ? "user" : "assistant",
      content: m.content,
    })),
  ];
}

/** Mensagens para o pet fechar a aula: o que aprendeu e o que vale revisar, corrigindo o que ficou errado. */
export function recapMessages(ctx: MentorContext, history: MentorTurn[]): ChatCompletionMessageParam[] {
  const transcript = history
    .slice(-20)
    .map((m) => `${m.role === "STUDENT" ? firstName(ctx.studentName) : ctx.petName}: ${m.content}`)
    .join("\n");
  return [
    { role: "system", content: persona(ctx) },
    {
      role: "user",
      content:
        `A aula terminou. Conversa:\n${transcript}\n\n` +
        `Agora, como ${ctx.petName}, agradeça ${firstName(ctx.studentName)} e conte em até 3 frases curtas o que você ` +
        `aprendeu sobre "${ctx.topic}". Se algo da conversa ficou errado, diga a versão correta com carinho. ` +
        `Termine com uma dica curtinha do que vale revisar.`,
    },
  ];
}

/** Resposta usada quando a IA não está disponível (sem chave, erro ou demora). */
export function fallbackReply(ctx: MentorContext, explanations: number) {
  const lines = [
    `Que legal! Eu não sabia disso sobre ${ctx.topic}. Você pode me dar um exemplo?`,
    "Hmm, deixa eu ver se entendi... Você pode explicar de outro jeito?",
    `Uau! E por que isso acontece? Me conta mais, ${firstName(ctx.studentName)}!`,
  ];
  return lines[explanations % lines.length];
}

export function fallbackRecap(ctx: MentorContext) {
  return `Obrigado pela aula sobre ${ctx.topic}, ${firstName(ctx.studentName)}! Aprendi muita coisa com você. Que tal revisar seu caderno e contar ao professor o que me ensinou?`;
}

/** A aula vale XP uma vez por dia, quando o aluno explicou o suficiente. */
export function earnsMentorXp(explanations: number, alreadyRewardedToday: boolean) {
  return explanations >= MENTOR_MIN_EXPLANATIONS && !alreadyRewardedToday;
}
