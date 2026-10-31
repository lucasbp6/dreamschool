"use server";

// Cadastros do gestor (turmas, professores, alunos, matérias) e edição da grade horária.
// Cada action recebe o FormData de um formulário e devolve uma mensagem para a tela (useActionState).
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getActingUser } from "./session";
import { BUILDING_TYPES, PET_TYPES } from "./game";
import { validateSlot, type ExistingSlot } from "./schedule";

export type FormState = { ok: boolean; message: string } | null;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function done(message: string): FormState {
  revalidatePath("/", "layout");
  return { ok: true, message };
}

const fail = (message: string): FormState => ({ ok: false, message });

const slotInclude = { classSubject: { include: { classroom: true, teacher: true, subject: true } } } as const;

type SlotWithDetails = {
  weekday: number;
  startTime: string;
  endTime: string;
  classSubject: {
    classroomId: string;
    teacherId: string;
    classroom: { name: string };
    teacher: { name: string };
    subject: { name: string };
  };
};

function toExisting(s: SlotWithDetails): ExistingSlot {
  return {
    weekday: s.weekday,
    startTime: s.startTime,
    endTime: s.endTime,
    classroomId: s.classSubject.classroomId,
    classroomName: s.classSubject.classroom.name,
    teacherId: s.classSubject.teacherId,
    teacherName: s.classSubject.teacher.name,
    subjectName: s.classSubject.subject.name,
  };
}

async function schoolId() {
  return (await getActingUser("MANAGER")).schoolId;
}

export async function createClassroom(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const buildingType = text(fd, "buildingType");
  if (!name) return fail("Informe o nome da turma.");
  if (!(BUILDING_TYPES as readonly string[]).includes(buildingType)) return fail("Escolha o tema da construção.");
  const sid = await schoolId();
  if (await db.classroom.findFirst({ where: { schoolId: sid, name } })) return fail(`Já existe a turma ${name}.`);
  await db.classroom.create({ data: { name, buildingType, schoolId: sid } });
  return done(`Turma ${name} cadastrada!`);
}

export async function createTeacher(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  if (!name) return fail("Informe o nome do professor.");
  await db.user.create({ data: { name, role: "TEACHER", schoolId: await schoolId() } });
  return done(`${name} cadastrado(a)! Agora atribua matérias nas turmas.`);
}

export async function createStudent(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const classroomId = text(fd, "classroomId");
  const petType = text(fd, "petType");
  const petName = text(fd, "petName");
  const parentName = text(fd, "parentName");
  if (!name) return fail("Informe o nome do aluno.");
  if (!classroomId) return fail("Escolha a turma.");
  if (!(PET_TYPES as readonly string[]).includes(petType)) return fail("Escolha o tipo de pet.");
  if (!petName) return fail("Dê um nome ao pet.");

  const sid = await schoolId();
  let parentId: string | undefined;
  if (parentName) {
    const parent =
      (await db.user.findFirst({ where: { schoolId: sid, role: "PARENT", name: parentName } })) ??
      (await db.user.create({ data: { name: parentName, role: "PARENT", schoolId: sid } }));
    parentId = parent.id;
  }

  await db.user.create({
    data: {
      name,
      role: "STUDENT",
      schoolId: sid,
      classroomId,
      parentId,
      pet: { create: { petType, petName } },
    },
  });
  return done(`${name} entrou na turma com ${petName}! 🎉`);
}

/** Atribui uma matéria a uma turma com o professor responsável (cria a matéria no catálogo se for nova). */
export async function assignSubject(_: FormState, fd: FormData): Promise<FormState> {
  const classroomId = text(fd, "classroomId");
  const subjectName = text(fd, "subjectName");
  const teacherId = text(fd, "teacherId");
  if (!subjectName) return fail("Informe a matéria.");
  if (!teacherId) return fail("Escolha o professor.");

  const sid = await schoolId();
  const subject = await db.subject.upsert({
    where: { schoolId_name: { schoolId: sid, name: subjectName } },
    update: {},
    create: { name: subjectName, schoolId: sid },
  });
  const existing = await db.classSubject.findUnique({
    where: { classroomId_subjectId: { classroomId, subjectId: subject.id } },
  });
  if (existing) {
    if (existing.teacherId === teacherId) return fail(`${subject.name} já está com esse professor.`);
    const [ownSlots, teacherSlots] = await Promise.all([
      db.scheduleSlot.findMany({ where: { classSubjectId: existing.id } }),
      db.scheduleSlot.findMany({
        where: { classSubject: { teacherId } },
        include: slotInclude,
      }),
    ]);
    const others = teacherSlots.map(toExisting);
    for (const slot of ownSlots) {
      const error = validateSlot({ ...slot, classroomId: "", teacherId }, others);
      if (error) return fail(`Não dá para trocar: ${error}`);
    }
    await db.classSubject.update({ where: { id: existing.id }, data: { teacherId } });
    return done(`Professor de ${subject.name} atualizado.`);
  }
  await db.classSubject.create({ data: { classroomId, subjectId: subject.id, teacherId } });
  return done(`${subject.name} adicionada à turma.`);
}

export async function removeClassSubject(classSubjectId: string) {
  await db.classSubject.delete({ where: { id: classSubjectId } });
  revalidatePath("/", "layout");
}

export async function addScheduleSlot(_: FormState, fd: FormData): Promise<FormState> {
  const classSubjectId = text(fd, "classSubjectId");
  const weekday = Number(text(fd, "weekday"));
  const startTime = text(fd, "startTime");
  const endTime = text(fd, "endTime");
  if (!classSubjectId) return fail("Escolha a matéria.");

  const cs = await db.classSubject.findUnique({ where: { id: classSubjectId } });
  if (!cs) return fail("Matéria não encontrada.");

  // Aulas que podem conflitar: as da mesma turma e as do mesmo professor em qualquer turma.
  const related = await db.scheduleSlot.findMany({
    where: {
      weekday,
      classSubject: { OR: [{ classroomId: cs.classroomId }, { teacherId: cs.teacherId }] },
    },
    include: slotInclude,
  });
  const error = validateSlot(
    { weekday, startTime, endTime, classroomId: cs.classroomId, teacherId: cs.teacherId },
    related.map(toExisting),
  );
  if (error) return fail(error);

  await db.scheduleSlot.create({ data: { classSubjectId, weekday, startTime, endTime } });
  return done("Aula adicionada à grade.");
}

export async function removeScheduleSlot(slotId: string) {
  await db.scheduleSlot.delete({ where: { id: slotId } });
  revalidatePath("/", "layout");
}
