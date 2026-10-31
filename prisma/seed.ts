// Dados de demonstração: a demo já começa com turmas, pets em níveis diferentes e histórico.
import { PrismaClient } from "@prisma/client";
import { validateSlot, type ExistingSlot } from "../src/lib/schedule";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
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
  await prisma.school.deleteMany();

  const school = await prisma.school.create({ data: { name: "Escola dos Sonhos" } });
  const user = (name: string, role: string, extra: Record<string, string> = {}) =>
    prisma.user.create({ data: { name, role, schoolId: school.id, ...extra } });

  await user("Ana Gestora", "MANAGER");
  const profMarina = await user("Prof.ª Marina", "TEACHER");
  const profCarlos = await user("Prof. Carlos", "TEACHER");
  const profJulia = await user("Prof.ª Júlia", "TEACHER");
  const maeJoao = await user("Cláudia (mãe do João)", "PARENT");
  const paiLia = await user("Roberto (pai da Lia)", "PARENT");

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
    { name: "João", room: castle, parent: maeJoao, pet: ["DRAGON", "Faísca", 60, "TIRED", "Entregar a próxima tarefa"] },
    { name: "Lia", room: castle, parent: paiLia, pet: ["OWL", "Sábia", 160, "HAPPY", null] },
    { name: "Pedro", room: castle, parent: null, pet: ["DOG", "Bolinha", 30, "NEUTRAL", null] },
    { name: "Sofia", room: space, parent: null, pet: ["CAT", "Luna", 90, "HAPPY", null] },
    { name: "Miguel", room: space, parent: null, pet: ["FOX", "Cometa", 20, "NEUTRAL", null] },
    { name: "Helena", room: space, parent: null, pet: ["BUNNY", "Pipoca", 45, "HAPPY", null] },
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

    if (s.name === "João") {
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

  const castleStudents = await prisma.user.findMany({ where: { classroomId: castle.id } });
  const comments = ["Adorei o jogo de frações!", "A explicação foi rápida demais.", null];
  for (const [i, st] of castleStudents.entries()) {
    await prisma.lessonFeedback.create({
      data: { stars: [3, 2, 3][i] ?? 3, comment: comments[i], studentId: st.id, classroomId: castle.id },
    });
  }

  console.log("Seed concluído: escola, 2 turmas com grade horária, 3 professores, 6 alunos, pais e gestor.");
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
