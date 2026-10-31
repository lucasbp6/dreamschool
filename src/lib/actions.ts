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
  completeFeedbackDay,
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

/** Avaliação de um professor específico. Completar todos os professores do dia avança a ofensiva (+XP só no pet). */
export async function submitLessonFeedback(
  studentId: string,
  teacherId: string,
  stars: number,
  comment: string,
): Promise<FeedbackResult> {
  const before = await feedbackDay(studentId);
  const { student, today } = before;
  const teacher = before.teachers.find((t) => t.id === teacherId);
  if (!student.classroomId || !teacher) return { ok: false, message: "Escolha um professor da sua turma." };
  if (teacher.ratedToday) return { ok: false, message: `Você já avaliou ${teacher.name} hoje. Volte amanhã! 💜` };

  await db.lessonFeedback.create({
    data: {
      stars: Math.min(3, Math.max(1, Math.round(stars))),
      comment: comment.trim() || null,
      day: today,
      studentId,
      teacherId,
      classroomId: student.classroomId,
    },
  });

  let message = `Obrigado! Sua avaliação para ${teacher.name} foi enviada. 💜`;
  const pet = student.pet;
  const nowComplete =
    teacher.hasLessonToday && before.required > 0 && before.ratedRequired + 1 === before.required;
  if (pet && nowComplete) {
    const r = completeFeedbackDay(pet, today, before.previousSchoolDay);
    if (r.xpBonus > 0) {
      await db.$transaction([
        db.pet.update({
          where: { id: pet.id },
          data: { feedbackStreak: r.feedbackStreak, lastFeedbackDay: r.lastFeedbackDay, xp: { increment: r.xpBonus } },
        }),
        db.event.create({
          data: {
            type: "STREAK",
            category: "Ofensiva de avaliações",
            note: `${r.feedbackStreak} dia(s) seguidos avaliando todos os professores`,
            xpDelta: r.xpBonus,
            studentId,
            classroomId: student.classroomId,
          },
        }),
      ]);
      message = `🔥 Ofensiva de ${r.feedbackStreak} dia(s)! Você avaliou todos os professores de hoje: +${r.xpBonus} XP para ${pet.petName}.`;
    }
  }
  revalidateAll();
  return { ok: true, message };
}

/** Resumo com IA das avaliações que um professor recebeu numa turma. */
export async function generateFeedbackSummary(classroomId: string, teacherId: string) {
  const [classroom, feedbacks] = await Promise.all([
    db.classroom.findUniqueOrThrow({ where: { id: classroomId } }),
    db.lessonFeedback.findMany({ where: { classroomId, teacherId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  if (feedbacks.length === 0) return { ok: false as const, message: "Ainda não há avaliações para você nesta turma." };
  const { text, usedAi } = await summarizeFeedback(classroom.name, feedbacks);
  await db.feedbackSummary.create({ data: { classroomId, teacherId, text, feedbackCount: feedbacks.length } });
  revalidateAll();
  return { ok: true as const, usedAi };
}
