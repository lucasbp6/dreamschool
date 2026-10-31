"use server";

// Começar e terminar uma aula do "Ensinar o pet". As respostas do pet durante a aula vêm da rota
// /api/mentor/[sessionId], em streaming.
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { MENTOR_MODEL, MENTOR_TIMEOUT_MS, complete, warmUp } from "./ai";
import { now } from "./clock";
import { dayKey, firstName } from "./game";
import { getActingUser } from "./session";
import { MENTOR_MIN_EXPLANATIONS, MENTOR_XP, earnsMentorXp, fallbackRecap, greeting, recapMessages } from "./mentor";
import { loadOwnSession } from "./mentor-data";

export type MentorStart = { ok: true; sessionId: string } | { ok: false; message: string };

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
  await db.mentorMessage.create({
    data: {
      sessionId: session.id,
      role: "PET",
      usedAi: false,
      content: greeting({
        petName: pet.petName,
        petType: pet.petType,
        studentName: student.name,
        subjectName: session.subjectName,
        topic: session.topic,
      }),
    },
  });
  revalidatePath("/student");
  return { ok: true, sessionId: session.id };
}

export type MentorEnd = { ok: boolean; message: string; recap?: string; xp?: number };

export async function endMentorSession(sessionId: string): Promise<MentorEnd> {
  const loaded = await loadOwnSession(sessionId);
  if (!loaded) return { ok: false, message: "Aula não encontrada." };
  const { session, pet, ctx, history } = loaded;
  if (session.endedAt) return { ok: true, message: "Esta aula já terminou.", recap: session.recap ?? undefined };

  const explanations = history.filter((m) => m.role === "STUDENT").length;
  const recap =
    explanations > 0
      ? ((await complete("recap do pet", recapMessages(ctx, history), {
          temperature: 0.5,
          maxTokens: 220,
          model: MENTOR_MODEL,
          timeoutMs: MENTOR_TIMEOUT_MS,
        })) ??
        fallbackRecap(ctx))
      : `Tudo bem, ${firstName(ctx.studentName)}! Quando quiser, é só me ensinar sobre ${ctx.topic}.`;

  const today = dayKey(now());
  const rewardedToday = await db.mentorSession.count({ where: { studentId: session.studentId, day: today, rewarded: true } });
  const xp = earnsMentorXp(explanations, rewardedToday > 0) ? MENTOR_XP : 0;

  const student = await db.user.findUniqueOrThrow({ where: { id: session.studentId } });
  await db.$transaction([
    db.mentorSession.update({ where: { id: session.id }, data: { endedAt: now(), recap, rewarded: xp > 0 } }),
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
