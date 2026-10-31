"use server";

// Chamada e notas lançadas pelo professor nas matérias que ele dá.
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getActingUser } from "./session";
import { ATTENDANCE_STATUS } from "./game";

export type SaveResult = { ok: boolean; message: string };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Garante que a matéria é do professor ativo e devolve os alunos da turma. */
async function ownClassSubject(classSubjectId: string) {
  const teacher = await getActingUser("TEACHER");
  const cs = await db.classSubject.findUnique({
    where: { id: classSubjectId },
    include: { subject: true, classroom: { include: { students: { select: { id: true } } } } },
  });
  if (!cs || cs.teacherId !== teacher.id) return null;
  return { cs, studentIds: new Set(cs.classroom.students.map((s) => s.id)) };
}

export async function saveAttendance(
  classSubjectId: string,
  date: string,
  entries: { studentId: string; status: string }[],
): Promise<SaveResult> {
  if (!DAY_RE.test(date)) return { ok: false, message: "Escolha uma data válida." };
  const own = await ownClassSubject(classSubjectId);
  if (!own) return { ok: false, message: "Essa matéria não é sua." };
  const valid = entries.filter((e) => own.studentIds.has(e.studentId) && e.status in ATTENDANCE_STATUS);

  await db.$transaction(
    valid.map((e) =>
      db.attendance.upsert({
        where: { classSubjectId_studentId_date: { classSubjectId, studentId: e.studentId, date } },
        update: { status: e.status },
        create: { classSubjectId, studentId: e.studentId, date, status: e.status },
      }),
    ),
  );
  revalidatePath("/", "layout");
  const absent = valid.filter((e) => e.status === "ABSENT").length;
  return { ok: true, message: `Chamada de ${own.cs.subject.name} salva: ${valid.length - absent} presentes, ${absent} faltas.` };
}

export async function createAssessment(
  classSubjectId: string,
  title: string,
  date: string,
  maxScore: number,
): Promise<SaveResult & { id?: string }> {
  const own = await ownClassSubject(classSubjectId);
  if (!own) return { ok: false, message: "Essa matéria não é sua." };
  if (!title.trim()) return { ok: false, message: "Dê um nome para a avaliação (ex.: Prova 1)." };
  if (!DAY_RE.test(date)) return { ok: false, message: "Escolha uma data válida." };
  if (!(maxScore > 0 && maxScore <= 100)) return { ok: false, message: "A nota máxima deve ser entre 0 e 100." };
  const a = await db.assessment.create({ data: { classSubjectId, title: title.trim(), date, maxScore } });
  revalidatePath("/", "layout");
  return { ok: true, message: `Avaliação "${a.title}" criada. Agora lance as notas.`, id: a.id };
}

export async function deleteAssessment(assessmentId: string) {
  const a = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!a || !(await ownClassSubject(a.classSubjectId))) return;
  await db.assessment.delete({ where: { id: assessmentId } });
  revalidatePath("/", "layout");
}

/** Salva as notas de uma avaliação; nota vazia (null) apaga o lançamento do aluno. */
export async function saveGrades(
  assessmentId: string,
  entries: { studentId: string; score: number | null }[],
): Promise<SaveResult> {
  const a = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!a) return { ok: false, message: "Avaliação não encontrada." };
  const own = await ownClassSubject(a.classSubjectId);
  if (!own) return { ok: false, message: "Essa matéria não é sua." };

  const mine = entries.filter((e) => own.studentIds.has(e.studentId));
  const invalid = mine.find((e) => e.score !== null && !(e.score >= 0 && e.score <= a.maxScore));
  if (invalid) return { ok: false, message: `As notas devem ficar entre 0 e ${a.maxScore}.` };

  await db.$transaction(
    mine.map((e) =>
      e.score === null
        ? db.grade.deleteMany({ where: { assessmentId, studentId: e.studentId } })
        : db.grade.upsert({
            where: { assessmentId_studentId: { assessmentId, studentId: e.studentId } },
            update: { score: e.score },
            create: { assessmentId, studentId: e.studentId, score: e.score },
          }),
    ),
  );
  revalidatePath("/", "layout");
  return { ok: true, message: `Notas de "${a.title}" salvas.` };
}
