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
    `("Hmm, fiquei com uma dúvida... eu tinha ouvido que..."), e SEMPRE diga a informação correta de forma clara e completa ` +
    `em uma frase (com o número, o nome ou a regra certa, e um exemplo simples se ajudar). Não dê só pistas. ` +
    `Depois peça para ${mentor} conferir com você.\n` +
    `- Se a explicação estiver certa, não invente que falta algo.\n` +
    `- As explicações podem ter sido faladas e transcritas automaticamente: ignore erros de digitação, pontuação ou ` +
    `palavras trocadas pela transcrição e corrija só erros de conteúdo.\n` +
    `- Nunca invente fatos. Se não tiver certeza, diga que vocês podem perguntar ao professor.\n` +
    `- Fique no tema da aula. Se a conversa fugir do tema ou tiver algo inadequado ou dados pessoais, volte ` +
    `gentilmente para "${ctx.topic}".\n` +
    `- Não fale que é uma inteligência artificial. Escreva só a sua fala: sem ações entre asteriscos, sem ` +
    `observações entre parênteses, sem emojis, listas ou markdown.`
  );
}

/** Mensagens para o pet abrir a aula: uma pergunta específica sobre o tema e um convite para o aluno contar o que sabe ou o que acha difícil. */
export function openerMessages(ctx: MentorContext): ChatCompletionMessageParam[] {
  const mentor = firstName(ctx.studentName);
  return [
    { role: "system", content: persona(ctx) },
    {
      role: "user",
      content:
        `Comece a aula agora, falando com ${mentor}. Em até 3 frases curtas: cumprimente ${mentor} pelo nome, ` +
        `faça UMA pergunta curiosa e específica sobre "${ctx.topic}" (um conceito, um exemplo ou uma situação do ` +
        `dia a dia que se aprende no ensino fundamental) e convide ${mentor} a contar o que já sabe ou qual parte ` +
        `acha mais difícil. Não comece com "Oba". Responda só com a sua fala.`,
    },
  ];
}

/** Aberturas prontas (sem IA), variando entre perguntar algo, pedir o que sabe e pedir o que é difícil. */
export function fallbackOpener(ctx: MentorContext, variant: number) {
  const mentor = firstName(ctx.studentName);
  const lines = [
    `Oi, ${mentor}! Fiquei curioso com ${ctx.topic}: qual é a coisa mais importante que eu preciso saber? E tem alguma parte que você acha difícil?`,
    `Que bom te ver, ${mentor}! Me conta o que você já sabe sobre ${ctx.topic}? Se alguma parte te deixa com dúvida, me fala que a gente descobre junto!`,
    `${mentor}, hoje a aula é sobre ${ctx.topic}! Você consegue me dar um exemplo disso no dia a dia? E qual parte você acha mais difícil de explicar?`,
  ];
  return lines[Math.abs(variant) % lines.length];
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

/** Mais repetições seguidas do mesmo caractere do que isso indicam que o modelo "degenerou" ("!!!!!!…"). */
const MAX_REPEAT = 4;

/**
 * Filtro aplicado à fala do pet enquanto ela chega em streaming: remove ações entre asteriscos
 * ("*bate as asinhas*") e emojis, que alguns modelos insistem em escrever apesar do prompt, e
 * para de repassar o texto se o modelo degenerar em repetições ("mud!!!!!!!!…").
 */
export function createSpeechFilter() {
  let insideAsterisks = false;
  let last = "";
  let run = 0;
  let broken = false;
  return (chunk: string) => {
    let out = "";
    for (const ch of chunk.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")) {
      if (broken) break;
      if (ch === "*") {
        insideAsterisks = !insideAsterisks;
        continue;
      }
      if (insideAsterisks) continue;
      run = ch === last && ch.trim() ? run + 1 : 1;
      last = ch;
      if (run > MAX_REPEAT) {
        broken = true;
        break;
      }
      out += ch;
    }
    return out;
  };
}

/** Acabamento do texto: corta repetições degeneradas, espaços repetidos e espaço antes de pontuação. */
export function tidySpeech(text: string) {
  return text
    .replace(new RegExp(`(\\S)\\1{${MAX_REPEAT},}[\\s\\S]*$`, "u"), "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?…])/g, "$1")
    .trim();
}

// ---------- Caderno do pet ----------
// Cada aula terminada vira uma página do caderno de estudos do aluno com o pet.

export type NotebookNotes = { learned: string[]; careful: string[]; review: string };

/** Mensagens para escrever a página do caderno: só fatos corretos, corrigindo o que a conversa errou. */
export function notebookMessages(ctx: MentorContext, history: MentorTurn[]): ChatCompletionMessageParam[] {
  const mentor = firstName(ctx.studentName);
  const transcript = history
    .slice(-20)
    .map((m) => `${m.role === "STUDENT" ? mentor : ctx.petName}: ${m.content}`)
    .join("\n");
  return [
    {
      role: "system",
      content:
        `Você escreve a página do caderno de estudos de ${mentor} e do pet ${ctx.petName} sobre "${ctx.topic}" ` +
        `(${ctx.subjectName}), para uma criança de 8 a 11 anos revisar. Use só informações corretas: se a conversa ` +
        `tiver algo errado, escreva a versão certa. Frases curtas e simples, em português do Brasil, sem emojis. ` +
        `Responda SOMENTE com JSON no formato {"aprendemos": ["..."], "cuidado": ["..."], "revisar": "..."}: ` +
        `"aprendemos" com 2 a 4 fatos principais do tema; "cuidado" com até 2 frases sobre confusões que ` +
        `apareceram na conversa e o jeito certo (lista vazia se não houve); "revisar" com uma pergunta curta ` +
        `para testar o que aprenderam.`,
    },
    { role: "user", content: `Conversa da aula:\n${transcript}` },
  ];
}

const clip = (s: unknown, max: number) => (typeof s === "string" ? tidySpeech(createSpeechFilter()(s)).slice(0, max) : "");

/** Lê o JSON da página (tolerante a texto em volta); sem JSON válido, monta a página a partir do resumo do pet. */
export function parseNotebookNotes(raw: string | null, recapFallback: string): NotebookNotes {
  try {
    const json = raw?.match(/\{[\s\S]*\}/)?.[0];
    if (json) {
      const data = JSON.parse(json) as { aprendemos?: unknown; cuidado?: unknown; revisar?: unknown };
      const list = (v: unknown, n: number) =>
        (Array.isArray(v) ? v : []).map((x) => clip(x, 220)).filter(Boolean).slice(0, n);
      const learned = list(data.aprendemos, 4);
      if (learned.length) return { learned, careful: list(data.cuidado, 2), review: clip(data.revisar, 200) };
    }
  } catch {}
  const sentences = recapFallback.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 3);
  return { learned: sentences.slice(0, 3), careful: [], review: "" };
}
