// Dados de demonstração: a demo já começa com turmas, pets em níveis diferentes e histórico.
import { PrismaClient } from "@prisma/client";
import { now } from "../src/lib/clock";
import { dayKey } from "../src/lib/game";
import { validateSlot, type ExistingSlot } from "../src/lib/schedule";
import { isSchoolDay } from "../src/lib/calendar";
import { CALENDAR } from "./calendar-2026";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = now();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await prisma.grade.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.feedbackSummary.deleteMany();
  await prisma.lessonFeedback.deleteMany();
  await prisma.parentNote.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
  await prisma.calendarDay.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({
    data: { name: "Escola dos Sonhos", termStart: CALENDAR.termStart, termEnd: CALENDAR.termEnd },
  });
  await prisma.calendarDay.createMany({ data: CALENDAR.days.map((d) => ({ ...d, schoolId: school.id })) });
  const user = (name: string, role: string, extra: Record<string, string> = {}) =>
    prisma.user.create({ data: { name, role, schoolId: school.id, ...extra } });

  await user("Ana Paula Moreira", "MANAGER");
  const profMarina = await user("Prof.ª Marina", "TEACHER");
  const profCarlos = await user("Prof. Carlos", "TEACHER");
  const profJulia = await user("Prof.ª Júlia", "TEACHER");
  const maeJoao = await user("Cláudia Almeida", "PARENT");
  const paiLia = await user("Roberto Fernandes", "PARENT");

  const castle = await prisma.classroom.create({
    data: {
      name: "4º Ano A",
      buildingType: "CASTLE",
      bricks: 135,
      maintenanceNeeded: 5,
      streak: 4,
      schoolId: school.id,
    },
  });
  const space = await prisma.classroom.create({
    data: {
      name: "5º Ano B",
      buildingType: "SPACE_BASE",
      bricks: 60,
      streak: 2,
      schoolId: school.id,
    },
  });

  const students = [
    { name: "João Pedro Almeida", room: castle, parent: maeJoao, pet: ["DRAGON", "Faísca", 60, "TIRED", "Entregar a próxima tarefa"] },
    { name: "Lia Fernandes Costa", room: castle, parent: paiLia, pet: ["OWL", "Sábia", 160, "HAPPY", null] },
    { name: "Pedro Henrique Souza", room: castle, parent: null, pet: ["BEAR", "Bolinha", 30, "NEUTRAL", null] },
    { name: "Sofia Ribeiro Lima", room: space, parent: null, pet: ["CAT", "Luna", 90, "HAPPY", null] },
    { name: "Miguel Santos Oliveira", room: space, parent: null, pet: ["FOX", "Cometa", 20, "NEUTRAL", null] },
    { name: "Helena Martins Rocha", room: space, parent: null, pet: ["BUNNY", "Pipoca", 45, "HAPPY", null] },
  ] as const;

  for (const s of students) {
    const [petType, petName, xp, mood, recoveryMission] = s.pet;
    const student = await prisma.user.create({
      data: {
        name: s.name,
        role: "STUDENT",
        schoolId: school.id,
        classroomId: s.room.id,
        parentId: s.parent?.id,
        pet: { create: { petType, petName, xp, mood, recoveryMission } },
      },
    });

    const positives = [
      ["Tarefa concluída", 6],
      ["Colaboração", 4],
      ["Bom comportamento", 2],
    ] as const;
    for (const [category, ago] of positives) {
      await prisma.event.create({
        data: {
          type: "POSITIVE",
          category,
          xpDelta: 10,
          bricksDelta: 10,
          createdAt: daysAgo(ago),
          studentId: student.id,
          classroomId: s.room.id,
        },
      });
    }

    if (s.name.startsWith("João")) {
      await prisma.event.create({
        data: {
          type: "ATTENTION",
          category: "Tarefa não entregue",
          note: "Entregar a próxima tarefa",
          createdAt: daysAgo(1),
          studentId: student.id,
          classroomId: s.room.id,
        },
      });
      await prisma.parentNote.create({
        data: {
          studentId: student.id,
          rawText: "João ajudou os colegas no trabalho em grupo.",
          humanizedText:
            "Olá, Cláudia! Hoje o João se destacou ajudando os colegas no trabalho em grupo. Que tal conversar com ele sobre como foi essa experiência? Ele merece o reconhecimento! 💛",
          createdAt: daysAgo(3),
        },
      });
    }
  }

  await seedSchedule(school.id, [
    {
      room: castle,
      // Professor responsável por cada matéria nesta turma.
      subjects: { Matemática: profMarina, Ciências: profMarina, Português: profCarlos, Artes: profJulia, "Educação Física": profJulia },
      // Por horário (linha), a matéria de cada dia de segunda a sexta.
      grid: [
        ["Matemática", "Ciências", "Matemática", "Ciências", "Matemática"],
        ["Português", "Português", "Português", "Português", "Português"],
        ["Artes", "Educação Física", "Artes", "Educação Física", "Artes"],
        ["Ciências", "Matemática", "Ciências", "Matemática", "Ciências"],
      ],
    },
    {
      room: space,
      subjects: { Português: profCarlos, História: profCarlos, Matemática: profMarina, Ciências: profJulia, Artes: profJulia, "Educação Física": profJulia },
      grid: [
        ["Português", "História", "Português", "História", "Português"],
        ["Ciências", "Artes", "Educação Física", "Ciências", "Artes"],
        ["Matemática", "Matemática", "Matemática", "Matemática", "Matemática"],
        ["Educação Física", "Ciências", "Artes", "Educação Física", "Ciências"],
      ],
    },
  ]);

  await seedAcademics([castle.id, space.id], ["Lia Fernandes Costa", "Sofia Ribeiro Lima"]);

  console.log("Seed concluído: 2 turmas com grade, chamadas, notas e avaliações; 3 professores, 6 alunos, pais e gestor.");
}

const PERIODS = [
  ["07:30", "08:20"],
  ["08:20", "09:10"],
  ["09:30", "10:20"],
  ["10:20", "11:10"],
];

type ScheduleSeed = {
  room: { id: string; name: string };
  subjects: Record<string, { id: string; name: string }>;
  grid: string[][];
};

async function seedSchedule(schoolId: string, plans: ScheduleSeed[]) {
  const names = [...new Set(plans.flatMap((p) => Object.keys(p.subjects)))];
  const subjects = new Map<string, string>();
  for (const name of names) {
    const s = await prisma.subject.create({ data: { name, schoolId } });
    subjects.set(name, s.id);
  }

  const placed: ExistingSlot[] = [];
  for (const { room, subjects: teachers, grid } of plans) {
    const classSubjects = new Map<string, string>();
    for (const [name, teacher] of Object.entries(teachers)) {
      const cs = await prisma.classSubject.create({
        data: { classroomId: room.id, subjectId: subjects.get(name)!, teacherId: teacher.id },
      });
      classSubjects.set(name, cs.id);
    }
    for (const [period, row] of grid.entries()) {
      for (const [day, name] of row.entries()) {
        const [startTime, endTime] = PERIODS[period];
        const teacher = teachers[name];
        const slot = { weekday: day + 1, startTime, endTime };
        const conflict = validateSlot({ ...slot, classroomId: room.id, teacherId: teacher.id }, placed);
        if (conflict) throw new Error(`Seed com conflito: ${conflict}`);
        placed.push({ ...slot, classroomId: room.id, classroomName: room.name, teacherId: teacher.id, teacherName: teacher.name, subjectName: name });
        await prisma.scheduleSlot.create({ data: { ...slot, classSubjectId: classSubjects.get(name)! } });
      }
    }
  }
}

const COMMENTS = ["Adorei a atividade em grupo!", "A explicação foi rápida demais.", "Gostei dos exemplos.", null, null];

/**
 * Chamadas e avaliações das últimas duas semanas, notas de duas avaliações por matéria e
 * alunos com ofensiva (os de `streakers` avaliam todas as aulas de todos os dias letivos).
 */
async function seedAcademics(classroomIds: string[], streakers: string[]) {
  for (const classroomId of classroomIds) {
    const classSubjects = await prisma.classSubject.findMany({ where: { classroomId }, include: { slots: true } });
    const lessonDays = [...new Set(classSubjects.flatMap((cs) => cs.slots.map((s) => s.weekday)))];
    const students = await prisma.user.findMany({ where: { classroomId }, orderBy: { name: "asc" }, include: { pet: true } });

    for (let back = 14; back >= 1; back--) {
      const date = daysAgo(back);
      const day = dayKey(date);
      // Só dias letivos têm chamada e avaliação (fim de semana, feriado e recesso ficam de fora).
      if (!isSchoolDay(day, CALENDAR, lessonDays)) continue;
      const todays = classSubjects.filter((cs) => cs.slots.some((s) => s.weekday === date.getDay()));
      for (const [ci, cs] of todays.entries()) {
        for (const [si, st] of students.entries()) {
          const roll = (si * 7 + back * 3 + ci * 5) % 13;
          await prisma.attendance.create({
            data: { date: day, classSubjectId: cs.id, studentId: st.id, status: roll === 0 ? "ABSENT" : roll === 1 ? "LATE" : "PRESENT" },
          });
        }
      }
      // Avaliações das aulas do dia (uma por matéria). Quem está em `streakers` avalia todas as aulas.
      for (const [si, st] of students.entries()) {
        const always = streakers.includes(st.name);
        for (const [ci, cs] of todays.entries()) {
          if (!always && (si + back + ci) % 3 !== 0) continue;
          await prisma.lessonFeedback.create({
            data: {
              stars: 2 + ((si + ci + back) % 2),
              comment: COMMENTS[(si + ci + back) % COMMENTS.length],
              lessonDate: day,
              day,
              classSubjectId: cs.id,
              teacherId: cs.teacherId,
              studentId: st.id,
              classroomId,
            },
          });
        }
      }
    }

    for (const [ci, cs] of classSubjects.entries()) {
      const assessments = [
        { title: "Prova 1", date: dayKey(daysAgo(12)) },
        { title: "Trabalho em grupo", date: dayKey(daysAgo(5)) },
      ];
      for (const [ai, a] of assessments.entries()) {
        const created = await prisma.assessment.create({ data: { ...a, maxScore: 10, classSubjectId: cs.id } });
        for (const [si, st] of students.entries()) {
          await prisma.grade.create({
            data: { assessmentId: created.id, studentId: st.id, score: 5 + ((si * 3 + ci * 2 + ai * 5) % 10) * 0.5 },
          });
        }
      }
    }

  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
