// Dados de demonstração: a demo já começa com turmas, pets em níveis diferentes e histórico.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
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
      teacherId: profMarina.id,
    },
  });
  const space = await prisma.classroom.create({
    data: {
      name: "5º Ano B",
      buildingType: "SPACE_BASE",
      bricks: 60,
      streak: 2,
      schoolId: school.id,
      teacherId: profCarlos.id,
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

  const castleStudents = await prisma.user.findMany({ where: { classroomId: castle.id } });
  const comments = ["Adorei o jogo de frações!", "A explicação foi rápida demais.", null];
  for (const [i, st] of castleStudents.entries()) {
    await prisma.lessonFeedback.create({
      data: { stars: [3, 2, 3][i] ?? 3, comment: comments[i], studentId: st.id, classroomId: castle.id },
    });
  }

  console.log("Seed concluído: escola, 2 turmas, 6 alunos, pais, professores e gestor.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
