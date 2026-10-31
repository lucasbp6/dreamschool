"use server";

// Server actions: aplicam as regras de src/lib/game.ts no banco e revalidam as telas.
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { humanizeNote, summarizeFeedback } from "./ai";
import { SESSION_COOKIE } from "./session";
import { now } from "./clock";
import { feedbackDay } from "./feedback-data";
import {
  ATTENTION_CATEGORIES,
  BUILDING_TYPES,
  POSITIVE_CATEGORIES,
  POSITIVE_XP,
  RECOVERY_BONUS_XP,
  ROLE_PATHS,
  applyAttention,
  applyPositive,
  FEEDBACK_STREAK_XP,
  dayKey,
  type AttentionCategory,
  type Mood,
  type PositiveCategory,
  type Role,
} from "./game";

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function loadStudent(studentId: string) {
  const student = await db.user.findUniqueOrThrow({
    where: { id: studentId },
    include: { pet: true, classroom: true },
  });
  if (!student.pet || !student.classroom) throw new Error("Aluno sem pet ou turma");
  return { student, pet: student.pet, classroom: student.classroom };
}

export async function switchUser(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  (await cookies()).set(SESSION_COOKIE, user.id, { path: "/", sameSite: "lax" });
  redirect(ROLE_PATHS[user.role as Role]);
}

export async function givePositive(studentId: string, category: PositiveCategory) {
  const { pet, classroom } = await loadStudent(studentId);
  const r = applyPositive(
    { xp: pet.xp, mood: pet.mood as Mood, recoveryMission: pet.recoveryMission },
    classroom,
    dayKey(now()),
  );

  await db.$transaction([
    db.pet.update({ where: { id: pet.id }, data: r.pet }),
    db.classroom.update({ where: { id: classroom.id }, data: r.classroom }),
    db.event.create({
      data: {
        type: "POSITIVE",
        category: POSITIVE_CATEGORIES[category],
        note: r.maintenanceRepaired ? `Ajudou a reparar a construção (${r.maintenanceRepaired} pontos)` : null,
        xpDelta: POSITIVE_XP,
        bricksDelta: r.bricksGained,
        studentId,
        classroomId: classroom.id,
      },
    }),
    ...(r.recovered
      ? [
          db.event.create({
            data: {
              type: "RECOVERY",
              category: "Missão de Cuidado concluída",
              note: pet.recoveryMission,
              xpDelta: RECOVERY_BONUS_XP,
              studentId,
              classroomId: classroom.id,
            },
          }),
        ]
      : []),
  ]);
  revalidateAll();
}

export async function giveAttention(studentId: string, category: AttentionCategory) {
  const { pet, classroom } = await loadStudent(studentId);
  const r = applyAttention({ xp: pet.xp, mood: pet.mood as Mood, recoveryMission: pet.recoveryMission }, classroom, category);

  await db.$transaction([
    db.pet.update({ where: { id: pet.id }, data: r.pet }),
    db.classroom.update({ where: { id: classroom.id }, data: { maintenanceNeeded: r.classroom.maintenanceNeeded } }),
    db.event.create({
      data: {
        type: "ATTENTION",
        category: ATTENTION_CATEGORIES[category].label,
        note: r.mission,
        studentId,
        classroomId: classroom.id,
      },
    }),
  ]);
  revalidateAll();
}

export async function setBuildingType(classroomId: string, buildingType: string) {
  if (!(BUILDING_TYPES as readonly string[]).includes(buildingType)) throw new Error("Tema inválido");
  await db.classroom.update({ where: { id: classroomId }, data: { buildingType } });
  revalidateAll();
}

export async function previewParentNote(studentId: string, rawText: string) {
  const student = await db.user.findUniqueOrThrow({ where: { id: studentId }, include: { parent: true } });
  return humanizeNote(rawText, student.name, student.parent?.name ?? "família");
}

export async function saveParentNote(studentId: string, rawText: string, humanizedText: string) {
  if (!humanizedText.trim()) throw new Error("Nota vazia");
  await db.parentNote.create({ data: { studentId, rawText, humanizedText: humanizedText.trim() } });
  revalidateAll();
}

export type FeedbackResult = { ok: boolean; message: string };

/**
 * Avaliação de uma aula (matéria numa data), feita no dia da aula ou no dia seguinte.
 * A ofensiva só sobe quando todas as aulas daquele dia foram avaliadas; aí o pet também ganha o bônus.
 */
export async function submitLessonFeedback(
  studentId: string,
  classSubjectId: string,
  lessonDate: string,
  stars: number,
  comment: string,
): Promise<FeedbackResult> {
  const before = await feedbackDay(studentId);
  const { student } = before;
  const group = before.days.find((d) => d.date === lessonDate);
  const lesson = group?.lessons.find((l) => l.classSubjectId === classSubjectId);
  if (!student.classroomId || !group || !lesson)
    return { ok: false, message: "Essa aula não pode mais ser avaliada: o prazo é o dia da aula e o dia seguinte." };
  if (lesson.rated) return { ok: false, message: `Você já avaliou a aula de ${lesson.subject} desse dia.` };

  const cs = await db.classSubject.findUniqueOrThrow({ where: { id: classSubjectId } });
  await db.lessonFeedback.create({
    data: {
      stars: Math.min(3, Math.max(1, Math.round(stars))),
      comment: comment.trim() || null,
      lessonDate,
      day: before.today,
      classSubjectId,
      teacherId: cs.teacherId,
      studentId,
      classroomId: student.classroomId,
    },
  });

  const remaining = group.lessons.filter((l) => !l.rated && l.classSubjectId !== classSubjectId).length;
  const which = lessonDate === before.today ? "de hoje" : "de ontem";
  const pet = student.pet;
  let message = `Obrigado! Sua avaliação de ${lesson.subject} foi enviada.`;

  if (remaining > 0) {
    message += ` Falta${remaining > 1 ? "m" : ""} ${remaining} aula${remaining > 1 ? "s" : ""} ${which} para a ofensiva subir.`;
  } else if (pet) {
    // Dia completo: acontece uma vez só por dia (cada aula só pode ser avaliada uma vez).
    await db.$transaction([
      db.pet.update({ where: { id: pet.id }, data: { xp: { increment: FEEDBACK_STREAK_XP } } }),
      db.event.create({
        data: {
          type: "STREAK",
          category: "Ofensiva de avaliações",
          note: `Avaliou todas as aulas ${which}`,
          xpDelta: FEEDBACK_STREAK_XP,
          studentId,
          classroomId: student.classroomId,
        },
      }),
    ]);
    const after = await feedbackDay(studentId);
    message = `🔥 Você avaliou todas as aulas ${which}! Ofensiva: ${after.streak} dia(s) seguidos. +${FEEDBACK_STREAK_XP} XP para ${pet.petName}.`;
  }
  revalidateAll();
  return { ok: true, message };
}

/** Resumo com IA das avaliações que um professor recebeu numa turma. */
export async function generateFeedbackSummary(classroomId: string, teacherId: string) {
  const [classroom, feedbacks] = await Promise.all([
    db.classroom.findUniqueOrThrow({ where: { id: classroomId } }),
    db.lessonFeedback.findMany({
      where: { classroomId, teacherId },
      orderBy: { lessonDate: "desc" },
      take: 50,
      select: { stars: true, comment: true, classSubject: { select: { subject: { select: { name: true } } } } },
    }),
  ]);
  if (feedbacks.length === 0) return { ok: false as const, message: "Ainda não há avaliações para você nesta turma." };
  // A matéria vai junto do comentário, para o resumo separar o que é de cada aula.
  const { text, usedAi } = await summarizeFeedback(
    classroom.name,
    feedbacks.map((f) => ({ stars: f.stars, comment: f.comment && `[${f.classSubject.subject.name}] ${f.comment}` })),
  );
  await db.feedbackSummary.create({ data: { classroomId, teacherId, text, feedbackCount: feedbacks.length } });
  revalidateAll();
  return { ok: true as const, usedAi };
}
