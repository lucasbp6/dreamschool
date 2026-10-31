"use server";

// Começar e terminar uma aula do "Ensinar o pet". As respostas do pet durante a aula vêm da rota
// /api/mentor/[sessionId], em streaming.
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { MENTOR_FALLBACK_MODEL, MENTOR_MODEL, MENTOR_TIMEOUT_MS, complete, warmUp } from "./ai";
import { now } from "./clock";
import { dayKey, firstName } from "./game";
import { getActingUser } from "./session";
import {
  MENTOR_MIN_EXPLANATIONS,
  MENTOR_XP,
  createSpeechFilter,
  earnsMentorXp,
  fallbackRecap,
  notebookMessages,
  parseNotebookNotes,
  recapMessages,
  tidySpeech,
} from "./mentor";
import { loadOwnSession } from "./mentor-data";

export type MentorStart =
  | { ok: true; session: { id: string; subjectName: string; topic: string } }
  | { ok: false; message: string };

/**
 * Cria a aula e já a devolve para a tela abrir na hora (sem depender de revalidar a página).
 * A fala de abertura do pet é gerada em seguida, em streaming, pela rota /api/mentor/[sessionId].
 */
export async function startMentorSession(subjectName: string, topic: string): Promise<MentorStart> {
  const student = await getActingUser("STUDENT");
  const pet = await db.pet.findUnique({ where: { studentId: student.id } });
  const cleanTopic = topic.trim().slice(0, 80);
  if (!pet) return { ok: false, message: "Você ainda não tem um pet." };
  if (!subjectName.trim()) return { ok: false, message: "Escolha a matéria." };
  if (cleanTopic.length < 3) return { ok: false, message: "Conte qual é o tema da aula (ex.: Frações)." };

  warmUp(MENTOR_MODEL);

  // Uma aula aberta por vez: as anteriores sem fim são encerradas.
  await db.mentorSession.updateMany({ where: { studentId: student.id, endedAt: null }, data: { endedAt: now() } });

  const session = await db.mentorSession.create({
    data: { studentId: student.id, subjectName: subjectName.trim(), topic: cleanTopic, day: dayKey(now()) },
  });
  revalidatePath("/student");
  return { ok: true, session: { id: session.id, subjectName: session.subjectName, topic: session.topic } };
}

export type MentorEnd = { ok: boolean; message: string; recap?: string; xp?: number };

export async function endMentorSession(sessionId: string): Promise<MentorEnd> {
  const loaded = await loadOwnSession(sessionId);
  if (!loaded) return { ok: false, message: "Aula não encontrada." };
  const { session, pet, ctx, history } = loaded;
  if (session.endedAt) return { ok: true, message: "Esta aula já terminou.", recap: session.recap ?? undefined };

  const explanations = history.filter((m) => m.role === "STUDENT").length;
  // O resumo do pet e a página do caderno são gerados ao mesmo tempo.
  const ai = { model: MENTOR_MODEL, fallbackModel: MENTOR_FALLBACK_MODEL, timeoutMs: MENTOR_TIMEOUT_MS };
  const [aiRecap, aiNotes] =
    explanations > 0
      ? await Promise.all([
          complete("recap do pet", recapMessages(ctx, history), { temperature: 0.5, maxTokens: 220, ...ai }),
          complete("página do caderno", notebookMessages(ctx, history), { temperature: 0.3, maxTokens: 400, ...ai }),
        ])
      : [null, null];
  const recap = aiRecap
    ? tidySpeech(createSpeechFilter()(aiRecap))
    : explanations > 0
      ? fallbackRecap(ctx)
      : `Tudo bem, ${firstName(ctx.studentName)}! Quando quiser, é só me ensinar sobre ${ctx.topic}.`;

  const today = dayKey(now());
  const rewardedToday = await db.mentorSession.count({ where: { studentId: session.studentId, day: today, rewarded: true } });
  const xp = earnsMentorXp(explanations, rewardedToday > 0) ? MENTOR_XP : 0;

  const student = await db.user.findUniqueOrThrow({ where: { id: session.studentId } });
  await db.$transaction([
    db.mentorSession.update({
      where: { id: session.id },
      data: {
        endedAt: now(),
        recap,
        rewarded: xp > 0,
        notes: explanations > 0 ? JSON.stringify(parseNotebookNotes(aiNotes, recap)) : null,
      },
    }),
    ...(xp > 0 && student.classroomId
      ? [
          db.pet.update({ where: { id: pet.id }, data: { xp: { increment: xp } } }),
          db.event.create({
            data: {
              type: "MENTOR",
              category: "Aula para o pet",
              note: `Ensinou ${pet.petName} sobre ${session.topic} (${session.subjectName})`,
              xpDelta: xp,
              studentId: student.id,
              classroomId: student.classroomId,
            },
          }),
        ]
      : []),
  ]);
  revalidatePath("/", "layout");
  return {
    ok: true,
    recap,
    xp,
    message:
      xp > 0
        ? `Mentor do dia! ${pet.petName} ganhou +${xp} XP com a sua aula.`
        : explanations < MENTOR_MIN_EXPLANATIONS
          ? `Aula encerrada. Para ganhar XP, explique pelo menos ${MENTOR_MIN_EXPLANATIONS} vezes antes de terminar.`
          : "Aula encerrada. O XP de mentor já foi ganho hoje — volte amanhã!",
  };
}

/** Anotação do próprio aluno numa página do caderno. */
export async function saveStudentNote(sessionId: string, text: string): Promise<{ ok: boolean; message: string }> {
  const loaded = await loadOwnSession(sessionId);
  if (!loaded) return { ok: false, message: "Página não encontrada." };
  await db.mentorSession.update({ where: { id: sessionId }, data: { studentNote: text.trim().slice(0, 600) || null } });
  revalidatePath("/student");
  return { ok: true, message: "Anotação guardada no caderno!" };
}
