// Dados de apresentação da Escola dos Sonhos.
// Tudo é relativo ao "hoje" da aplicação (respeita DEMO_TODAY): rode o seed com o mesmo DEMO_TODAY da apresentação.
//
// Roteiro sugerido (ver README):
// - Lia Fernandes Costa (4º Ano A): ofensiva longa, aulas de hoje avaliadas pela metade (complete ao vivo),
//   3 páginas no caderno com a Sábia (com correções), pet Guardião.
// - João Pedro Almeida (4º Ano A): pet precisando de cuidado, com Missão de Cuidado; a mãe (Cláudia) conversa com a professora.
// - Sofia Ribeiro Lima (5º Ano B): aula com o pet em andamento (histórico da conversa).
// - 4º Ano A com Reparo da Turma pendente; 5º Ano B no nível máximo e líder geral; 3º Ano C líder da semana.
import { PrismaClient, type Prisma } from "@prisma/client";
import { now } from "../src/lib/clock";
import { dayKey } from "../src/lib/game";
import { addDays, isSchoolDay, weekdayOf } from "../src/lib/calendar";
import { validateSlot, type ExistingSlot } from "../src/lib/schedule";
import { CALENDAR } from "./calendar-2026";

const prisma = new PrismaClient();

const WEEKDAYS = [1, 2, 3, 4, 5];
const TODAY = dayKey(now());
const TODAY_IS_SCHOOL = isSchoolDay(TODAY, CALENDAR, WEEKDAYS);

/** Últimos n dias letivos antes de hoje (do mais recente para o mais antigo). */
function pastSchoolDays(n: number) {
  const out: string[] = [];
  for (let d = addDays(TODAY, -1); out.length < n; d = addDays(d, -1)) if (isSchoolDay(d, CALENDAR, WEEKDAYS)) out.push(d);
  return out;
}
const SCHOOL_DAYS = pastSchoolDays(14);
/** Data e hora locais (para createdAt). */
function at(date: string, hh: number, mm = 0) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
/** Dias corridos antes de hoje. */
const ago = (n: number) => addDays(TODAY, -n);
/** n-ésimo dia letivo anterior (1 = último dia letivo antes de hoje). */
const schoolDay = (n: number) => SCHOOL_DAYS[n - 1];

// ---------- Professores, matérias e grade ----------
// Grade em "quadrado latino": no período p, a turma c tem aula com o professor (p + c) % 4 — nunca há conflito.
// Cada professor dá duas matérias em todas as turmas, alternando pelo dia da semana.
const TEACHERS = [
  { name: "Prof.ª Marina Lopes", subjects: ["Matemática", "Ciências"] },
  { name: "Prof. Carlos Mendes", subjects: ["Português", "História"] },
  { name: "Prof.ª Júlia Andrade", subjects: ["Artes", "Educação Física"] },
  { name: "Prof. Rafael Souza", subjects: ["Geografia", "Inglês"] },
];
const PERIODS = [
  ["07:30", "08:20"],
  ["08:20", "09:10"],
  ["09:30", "10:20"],
  ["10:20", "11:10"],
];
const subjectFor = (classIdx: number, period: number, weekday: number) => {
  const teacher = (period + classIdx) % TEACHERS.length;
  return { teacher, subject: TEACHERS[teacher].subjects[(weekday + period) % 2] };
};

// ---------- Turmas e alunos ----------
type PetSeed = [type: string, name: string, xp: number, mood: string, mission: string | null];
/** streaker: avalia todas as aulas (ofensiva longa); streakDays: ofensiva curta (avaliou tudo nos últimos n dias). */
type StudentSeed = { name: string; pet: PetSeed; parent?: string; streaker?: boolean; streakDays?: number };
const CLASSES: { name: string; buildingType: string; bricks: number; maintenanceNeeded: number; streak: number; students: StudentSeed[] }[] = [
  {
    name: "4º Ano A",
    buildingType: "CASTLE",
    bricks: 185,
    maintenanceNeeded: 5,
    streak: 4,
    students: [
      { name: "Lia Fernandes Costa", pet: ["OWL", "Sábia", 182, "HAPPY", null], parent: "Roberto Fernandes", streaker: true },
      { name: "João Pedro Almeida", pet: ["DRAGON", "Faísca", 64, "TIRED", "Entregar a próxima tarefa"], parent: "Cláudia Almeida" },
      { name: "Pedro Henrique Souza", pet: ["BEAR", "Bolinha", 41, "NEUTRAL", null] },
      { name: "Beatriz Souza Lima", pet: ["CAT", "Pipoca", 96, "HAPPY", null], streakDays: 3 },
      { name: "Gabriel Nunes Rocha", pet: ["FOX", "Ruivo", 22, "NEUTRAL", null] },
    ],
  },
  {
    name: "5º Ano B",
    buildingType: "SPACE_BASE",
    bricks: 325,
    maintenanceNeeded: 0,
    streak: 6,
    students: [
      { name: "Sofia Ribeiro Lima", pet: ["CAT", "Luna", 158, "HAPPY", null], parent: "Patrícia Ribeiro", streaker: true },
      { name: "Miguel Santos Oliveira", pet: ["FOX", "Cometa", 74, "HAPPY", null], parent: "Marcos Oliveira", streakDays: 2 },
      { name: "Helena Martins Rocha", pet: ["BUNNY", "Algodão", 48, "NEUTRAL", null] },
      { name: "Davi Carvalho Lopes", pet: ["DOG", "Pingo", 121, "HAPPY", null], streaker: true },
      { name: "Manuela Dias Pereira", pet: ["OWL", "Estrela", 33, "TIRED", "Participar com respeito na próxima atividade"] },
    ],
  },
  {
    name: "3º Ano C",
    buildingType: "TREEHOUSE",
    bricks: 92,
    maintenanceNeeded: 0,
    streak: 3,
    students: [
      { name: "Arthur Gomes Silva", pet: ["DRAGON", "Brasa", 55, "HAPPY", null] },
      { name: "Valentina Costa Reis", pet: ["BUNNY", "Nuvem", 63, "HAPPY", null], streakDays: 5 },
      { name: "Theo Martins Araújo", pet: ["BEAR", "Mel", 18, "NEUTRAL", null] },
      { name: "Alice Ferreira Lima", pet: ["DOG", "Biscoito", 70, "HAPPY", null] },
    ],
  },
  {
    name: "2º Ano D",
    buildingType: "OBSERVATORY",
    bricks: 40,
    maintenanceNeeded: 0,
    streak: 1,
    students: [
      { name: "Ana Clara Oliveira", pet: ["CAT", "Mia", 26, "HAPPY", null], parent: "Marcos Oliveira" },
      { name: "Lucas Pereira Melo", pet: ["FOX", "Faro", 12, "NEUTRAL", null] },
      { name: "Laura Batista Nunes", pet: ["OWL", "Pena", 40, "HAPPY", null] },
    ],
  },
];

const COMMENTS = [
  "Adorei a atividade em grupo!",
  "Gostei muito dos exemplos.",
  "A explicação foi um pouco rápida.",
  "Queria mais tempo para fazer os exercícios.",
  "A aula foi muito divertida!",
  "Não entendi a última parte.",
  null,
  null,
  null,
];
// Comentários da Prof.ª Marina no 4º Ano A (base do resumo com IA já gerado).
const MARINA_COMMENTS = [
  "Frações ficaram um pouco confusas.",
  "O jogo de frações com pizza foi o melhor!",
  "Poderia explicar a tabuada mais devagar.",
  "Amei o experimento das plantas!",
];

async function main() {
  await prisma.conversationMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.mentorMessage.deleteMany();
  await prisma.mentorSession.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.lessonFeedback.deleteMany();
  await prisma.feedbackSummary.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.parentNote.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.updateMany({ data: { parentId: null, classroomId: null } });
  await prisma.user.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.calendarDay.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({
    data: { name: "Escola dos Sonhos", termStart: CALENDAR.termStart, termEnd: CALENDAR.termEnd },
  });
  await prisma.calendarDay.createMany({ data: CALENDAR.days.map((d) => ({ ...d, schoolId: school.id })) });

  const user = (name: string, role: string) => prisma.user.create({ data: { name, role, schoolId: school.id } });

  const manager = await user("Ana Paula Moreira", "MANAGER");
  const teachers = [];
  for (const t of TEACHERS) teachers.push(await user(t.name, "TEACHER"));
  const parents = new Map<string, { id: string }>();
  for (const name of ["Cláudia Almeida", "Roberto Fernandes", "Patrícia Ribeiro", "Marcos Oliveira"]) parents.set(name, await user(name, "PARENT"));

  const subjectIds = new Map<string, string>();
  for (const t of TEACHERS)
    for (const name of t.subjects) subjectIds.set(name, (await prisma.subject.create({ data: { name, schoolId: school.id } })).id);

  // ---------- Turmas, matérias da turma, grade e alunos ----------
  type Room = {
    id: string;
    name: string;
    idx: number;
    cs: Map<string, { id: string; teacherId: string }>;
    students: { id: string; name: string; petName: string; streaker: boolean; fullDays: number }[];
  };
  const rooms: Room[] = [];
  const placed: ExistingSlot[] = [];
  for (const [idx, c] of CLASSES.entries()) {
    const classroom = await prisma.classroom.create({
      data: {
        name: c.name,
        buildingType: c.buildingType,
        bricks: c.bricks,
        maintenanceNeeded: c.maintenanceNeeded,
        streak: c.streak,
        // Com reparo pendente a sequência está pausada desde alguns dias.
        lastStreakDay: c.maintenanceNeeded > 0 ? schoolDay(3) : schoolDay(1),
        schoolId: school.id,
      },
    });
    const cs = new Map<string, { id: string; teacherId: string }>();
    for (const [t, teacher] of TEACHERS.entries())
      for (const name of teacher.subjects) {
        const row = await prisma.classSubject.create({
          data: { classroomId: classroom.id, subjectId: subjectIds.get(name)!, teacherId: teachers[t].id },
        });
        cs.set(name, { id: row.id, teacherId: teachers[t].id });
      }
    for (const weekday of WEEKDAYS)
      for (const [p, [startTime, endTime]] of PERIODS.entries()) {
        const { teacher, subject } = subjectFor(idx, p, weekday);
        const slot = { weekday, startTime, endTime };
        const conflict = validateSlot({ ...slot, classroomId: classroom.id, teacherId: teachers[teacher].id }, placed);
        if (conflict) throw new Error(`Seed com conflito: ${conflict}`);
        placed.push({
          ...slot,
          classroomId: classroom.id,
          classroomName: c.name,
          teacherId: teachers[teacher].id,
          teacherName: TEACHERS[teacher].name,
          subjectName: subject,
        });
        await prisma.scheduleSlot.create({ data: { ...slot, classSubjectId: cs.get(subject)!.id } });
      }

    const students = [];
    for (const s of c.students) {
      const [petType, petName, xp, mood, recoveryMission] = s.pet;
      const created = await prisma.user.create({
        data: {
          name: s.name,
          role: "STUDENT",
          schoolId: school.id,
          classroomId: classroom.id,
          parentId: s.parent ? parents.get(s.parent)!.id : undefined,
          pet: { create: { petType, petName, xp, mood, recoveryMission } },
        },
      });
      students.push({ id: created.id, name: s.name, petName, streaker: !!s.streaker, fullDays: s.streaker ? SCHOOL_DAYS.length : (s.streakDays ?? 0) });
    }
    rooms.push({ id: classroom.id, name: c.name, idx, cs, students });
  }
  const findStudent = (name: string) => {
    for (const room of rooms) {
      const s = room.students.find((x) => x.name === name);
      if (s) return { ...s, room };
    }
    throw new Error(`Aluno não encontrado: ${name}`);
  };
  const lessonsOn = (room: Room, date: string) =>
    PERIODS.map((_, period) => {
      const { subject } = subjectFor(room.idx, period, weekdayOf(date));
      return { subject, period, ...room.cs.get(subject)! };
    });

  // ---------- Histórico: conquistas, pontos de atenção e superações ----------
  const events: Prisma.EventCreateManyInput[] = [];
  const CATS = ["Tarefa concluída", "Colaboração", "Bom comportamento"];
  for (const room of rooms) {
    // O 3º Ano C está mais ativo nesta semana: lidera o ranking semanal.
    const recentBoost = room.name === "3º Ano C" ? 3 : 1;
    for (const [si, st] of room.students.entries())
      for (let back = 1; back <= 14; back++)
        for (let k = 0; k < (back < 7 ? recentBoost : 1); k++) {
          if ((si + back + k) % 3 !== 0) continue;
          events.push({
            type: "POSITIVE",
            category: CATS[(si + back + k) % CATS.length],
            xpDelta: 10,
            bricksDelta: 10,
            createdAt: at(ago(back), 9 + k, 10 * si),
            studentId: st.id,
            classroomId: room.id,
          });
        }
  }
  const lia = findStudent("Lia Fernandes Costa");
  const joao = findStudent("João Pedro Almeida");
  const pedro = findStudent("Pedro Henrique Souza");
  const manuela = findStudent("Manuela Dias Pereira");
  events.push(
    { type: "ATTENTION", category: "Tarefa não entregue", note: "Entregar a próxima tarefa", createdAt: at(schoolDay(1), 10, 15), studentId: joao.id, classroomId: joao.room.id },
    { type: "ATTENTION", category: "Interrupção de aula", note: "Participar com respeito na próxima atividade", createdAt: at(schoolDay(2), 9, 40), studentId: manuela.id, classroomId: manuela.room.id },
    // Pedro teve um ponto de atenção e superou: mostra a Missão de Cuidado concluída no histórico.
    { type: "ATTENTION", category: "Tarefa não entregue", note: "Entregar a próxima tarefa", createdAt: at(schoolDay(6), 8, 30), studentId: pedro.id, classroomId: pedro.room.id },
    { type: "POSITIVE", category: "Tarefa concluída", note: "Ajudou a reparar a construção (5 tijolinhos)", xpDelta: 10, bricksDelta: 5, createdAt: at(schoolDay(4), 11, 0), studentId: pedro.id, classroomId: pedro.room.id },
    { type: "RECOVERY", category: "Missão de Cuidado concluída", note: "Entregar a próxima tarefa", xpDelta: 5, createdAt: at(schoolDay(4), 11, 1), studentId: pedro.id, classroomId: pedro.room.id },
  );

  // ---------- Avaliações das aulas (por matéria) ----------
  // Quem é "streaker" avalia todas as aulas de todos os dias → ofensiva longa; streakDays dá ofensivas curtas.
  // Hoje a Lia avaliou só metade das aulas: dá para completar ao vivo e ver a ofensiva subir.
  const marinaId = teachers[0].id;
  const feedbacks: Prisma.LessonFeedbackCreateManyInput[] = [];
  for (const room of rooms)
    for (const [back, date] of SCHOOL_DAYS.entries())
      for (const lesson of lessonsOn(room, date))
        for (const [si, st] of room.students.entries()) {
          if (back >= st.fullDays && (si + back + lesson.period) % 3 !== 0) continue;
          const pool = lesson.teacherId === marinaId && room.idx === 0 ? [...MARINA_COMMENTS, ...COMMENTS] : COMMENTS;
          const seed = si * 3 + back + lesson.period;
          feedbacks.push({
            stars: seed % 5 === 0 ? 2 : seed % 11 === 0 ? 1 : 3,
            comment: pool[seed % pool.length],
            lessonDate: date,
            day: date,
            classSubjectId: lesson.id,
            teacherId: lesson.teacherId,
            studentId: st.id,
            classroomId: room.id,
            createdAt: at(date, 15, si * 5 + lesson.period),
          });
        }
  if (TODAY_IS_SCHOOL)
    for (const lesson of lessonsOn(lia.room, TODAY).slice(0, 2))
      feedbacks.push({
        stars: 3,
        comment: lesson.subject === "Matemática" ? "Hoje entendi frações equivalentes!" : null,
        lessonDate: TODAY,
        day: TODAY,
        classSubjectId: lesson.id,
        teacherId: lesson.teacherId,
        studentId: lia.id,
        classroomId: lia.room.id,
        createdAt: at(TODAY, 7, 50 + lesson.period),
      });
  await prisma.lessonFeedback.createMany({ data: feedbacks });

  // Bônus da ofensiva (+3 XP) nos dias completos de quem avalia tudo.
  for (const room of rooms)
    for (const st of room.students)
      for (const date of SCHOOL_DAYS.slice(0, Math.min(st.fullDays, 6)))
        events.push({
          type: "STREAK",
          category: "Ofensiva de avaliações",
          note: "Avaliou todas as aulas do dia",
          xpDelta: 3,
          createdAt: at(date, 16, 0),
          studentId: st.id,
          classroomId: room.id,
        });

  // Resumo com IA já gerado para a Prof.ª Marina no 4º Ano A (a demo funciona mesmo sem internet).
  await prisma.feedbackSummary.create({
    data: {
      classroomId: rooms[0].id,
      teacherId: marinaId,
      feedbackCount: feedbacks.filter((f) => f.classroomId === rooms[0].id && f.teacherId === marinaId && f.lessonDate !== TODAY).length,
      createdAt: at(schoolDay(1), 17, 0),
      text:
        "1) Pontos fortes\n- Atividades práticas (o jogo de frações com pizza e o experimento das plantas) são as mais elogiadas.\n- A turma participa mais quando há trabalho em grupo.\n\n" +
        "2) Pontos a ajustar\n- Parte dos alunos achou a explicação de frações rápida.\n- Alguns pedem mais tempo para os exercícios e a tabuada mais devagar.\n\n" +
        "3) Sugestões\n- Retomar frações com material concreto antes de avançar para frações equivalentes.\n- Reservar 10 minutos finais para exercícios guiados, circulando pela sala.",
    },
  });

  // ---------- Chamadas e notas ----------
  const attendance: Prisma.AttendanceCreateManyInput[] = [];
  for (const room of rooms)
    for (const [back, date] of SCHOOL_DAYS.entries())
      for (const lesson of lessonsOn(room, date))
        for (const [si, st] of room.students.entries()) {
          const roll = (si * 7 + back * 3 + lesson.period * 5) % 23;
          let status = roll === 0 ? "ABSENT" : roll === 1 ? "LATE" : "PRESENT";
          if (st.id === joao.id && back % 5 === 1) status = "ABSENT"; // João faltou alguns dias
          if (st.id === manuela.id && back % 4 === 0 && lesson.period === 0) status = "LATE"; // Manuela chega atrasada
          attendance.push({ date, classSubjectId: lesson.id, studentId: st.id, status });
        }
  await prisma.attendance.createMany({ data: attendance });

  for (const room of rooms)
    for (const [subject, cs] of room.cs) {
      const tests = [
        { title: "Prova 1", date: schoolDay(12), maxScore: 10 },
        { title: "Trabalho em grupo", date: schoolDay(5), maxScore: 10 },
        ...(subject === "Matemática" ? [{ title: "Quiz de frações", date: schoolDay(2), maxScore: 5 }] : []),
      ];
      for (const [ti, t] of tests.entries()) {
        const a = await prisma.assessment.create({ data: { ...t, classSubjectId: cs.id } });
        await prisma.grade.createMany({
          data: room.students.map((st, si) => {
            const ability = st.streaker ? 0.92 : st.id === joao.id ? 0.58 : 0.66 + (si % 3) * 0.08;
            const wobble = (((si + ti + subject.length) % 5) - 2) * 0.05;
            const score = Math.round(Math.min(1, Math.max(0.3, ability + wobble)) * t.maxScore * 2) / 2;
            return { assessmentId: a.id, studentId: st.id, score };
          }),
        });
      }
    }

  // ---------- Recados humanizados para as famílias ----------
  await prisma.parentNote.createMany({
    data: [
      {
        studentId: joao.id,
        rawText: "João ajudou os colegas no trabalho em grupo.",
        humanizedText:
          "Olá, Cláudia! Hoje o João se destacou ajudando os colegas no trabalho em grupo. Que tal conversar com ele sobre como foi essa experiência? Ele merece o reconhecimento! 💛",
        createdAt: at(schoolDay(5), 17, 30),
      },
      {
        studentId: joao.id,
        rawText: "João não entregou a tarefa de matemática.",
        humanizedText:
          "Olá, Cláudia! O João tem participado das aulas com muita curiosidade. A tarefa de Matemática desta semana ainda não foi entregue — ele já tem uma Missão de Cuidado para isso. Um momento tranquilo em casa para organizar os cadernos pode ajudar bastante. Contamos com vocês! 💛",
        createdAt: at(schoolDay(1), 17, 45),
      },
      {
        studentId: lia.id,
        rawText: "Lia explicou frações para a turma.",
        humanizedText:
          "Olá, Roberto! A Lia explicou frações para a turma com muita clareza e paciência — foi inspirador para os colegas. Vale perguntar a ela qual exemplo usou! 💜",
        createdAt: at(schoolDay(3), 17, 20),
      },
    ],
  });

  // ---------- Aulas com o pet (caderno de estudos) ----------
  type Turn = [role: "STUDENT" | "PET", content: string, viaAudio?: boolean];
  const mentor = async (
    studentName: string,
    s: {
      subject: string;
      topic: string;
      date: string;
      turns: Turn[];
      recap?: string;
      notes?: { learned: string[]; careful: string[]; review: string };
      studentNote?: string;
      /** Aula ainda em andamento (sem recap): o histórico aparece ao abrir "Ensinar o pet". */
      open?: boolean;
    },
  ) => {
    const st = findStudent(studentName);
    const hour = s.open ? 7 : 18;
    const session = await prisma.mentorSession.create({
      data: {
        studentId: st.id,
        subjectName: s.subject,
        topic: s.topic,
        day: s.date,
        createdAt: at(s.date, hour, 0),
        endedAt: s.open ? null : at(s.date, hour, 20),
        recap: s.recap ?? null,
        notes: s.notes ? JSON.stringify(s.notes) : null,
        studentNote: s.studentNote ?? null,
        rewarded: !s.open,
      },
    });
    await prisma.mentorMessage.createMany({
      data: s.turns.map(([role, content, viaAudio], i) => ({
        sessionId: session.id,
        role,
        content,
        viaAudio: !!viaAudio,
        usedAi: role === "PET",
        createdAt: at(s.date, hour, 1 + i * 2),
      })),
    });
    if (!s.open)
      events.push({
        type: "MENTOR",
        category: "Aula para o pet",
        note: `Ensinou ${st.petName} sobre ${s.topic} (${s.subject})`,
        xpDelta: 5,
        createdAt: at(s.date, hour, 20),
        studentId: st.id,
        classroomId: st.room.id,
      });
  };

  await mentor("Lia Fernandes Costa", {
    subject: "Ciências",
    topic: "Fotossíntese",
    date: schoolDay(6),
    turns: [
      ["PET", "Oi, Lia! Fiquei pensando: como uma planta consegue crescer tanto se ela não come como a gente? Me conta o que você já sabe!"],
      ["STUDENT", "A fotossíntese é quando a planta come terra pela raiz para crescer."],
      ["PET", "Hmm, fiquei com uma dúvida... eu tinha ouvido que a planta não come terra: a raiz pega água e sais minerais, e o alimento é feito nas folhas, com a luz do sol. Você confere comigo?"],
      ["STUDENT", "É verdade! A folha usa a luz do sol, a água e o gás carbônico do ar para fazer açúcar, que é a comida dela.", true],
      ["PET", "Uau, então a folha é tipo uma cozinha! E o que sobra dessa receita sai para o ar?"],
      ["STUDENT", "Sai oxigênio, que a gente respira!"],
      ["PET", "Que demais! Então as plantas ajudam todo mundo a respirar. Obrigada por me ensinar, Lia!"],
    ],
    recap:
      "Obrigada, Lia! Aprendi que a planta faz o próprio alimento nas folhas, usando luz do sol, água e gás carbônico, e que ela solta oxigênio. Vale revisar: a raiz não come terra, ela busca água e sais minerais!",
    notes: {
      learned: [
        "A planta faz o próprio alimento nas folhas.",
        "Ela usa luz do sol, água e gás carbônico para fazer açúcar.",
        "Na fotossíntese, a planta solta oxigênio no ar.",
      ],
      careful: ["A planta não come terra: a raiz absorve água e sais minerais; o alimento é feito nas folhas."],
      review: "Que gás a planta solta no ar durante a fotossíntese?",
    },
    studentNote: "Folha = cozinha da planta! Luz + água + gás carbônico → açúcar + oxigênio.",
  });

  await mentor("Lia Fernandes Costa", {
    subject: "Matemática",
    topic: "Frações",
    date: schoolDay(3),
    turns: [
      ["PET", "Oi, Lia! Quando eu como metade de uma pizza, isso é a mesma coisa que 2/4? Me explica!"],
      ["STUDENT", "1/4 é maior que 1/2 porque 4 é maior que 2."],
      ["PET", "Hmm, fiquei com uma dúvida... eu tinha ouvido que quanto mais pedaços a gente divide, menor fica cada pedaço. Então 1/2 seria maior que 1/4? Confere comigo?"],
      ["STUDENT", "Verdade! Se eu dividir a pizza em 4, cada pedaço fica menor do que se dividir em 2."],
      ["PET", "Faz sentido! E metade de uma pizza é igual a 2 pedaços de 4?"],
      ["STUDENT", "Sim! 1/2 é igual a 2/4, são frações equivalentes."],
      ["PET", "Uhuul, aprendi uma palavra nova: equivalentes!"],
    ],
    recap:
      "Obrigada, Lia! Aprendi que 1/2 é maior que 1/4, porque dividindo em mais partes cada pedaço fica menor, e que 1/2 e 2/4 são frações equivalentes!",
    notes: {
      learned: [
        "O número de baixo (denominador) diz em quantas partes o inteiro foi dividido.",
        "Quanto mais partes, menor fica cada pedaço: 1/2 é maior que 1/4.",
        "1/2 e 2/4 representam a mesma quantidade: são frações equivalentes.",
      ],
      careful: ["1/4 não é maior que 1/2: o 4 embaixo quer dizer pedaços menores."],
      review: "Qual é maior: 1/3 ou 1/6? Por quê?",
    },
  });

  await mentor("Lia Fernandes Costa", {
    subject: "Ciências",
    topic: "Ciclo da água",
    date: schoolDay(1),
    turns: [
      ["PET", "Oi, Lia! Para onde vai a água da chuva depois que ela cai? Me conta o que você sabe!"],
      ["STUDENT", "O sol esquenta a água do mar, ela evapora e vira vapor. Lá em cima o vapor esfria e vira nuvem.", true],
      ["PET", "Que legal! E como a água volta para o chão?"],
      ["STUDENT", "Quando as gotinhas da nuvem ficam pesadas, cai a chuva. Depois a água vai para os rios e volta pro mar."],
      ["PET", "Então é um ciclo que nunca acaba! A água que eu bebo hoje já foi nuvem?"],
      ["STUDENT", "Isso! E a parte em que o vapor vira nuvem se chama condensação."],
    ],
    recap:
      "Obrigada, Lia! Aprendi que a água evapora com o calor do sol, forma nuvens na condensação, cai como chuva e volta para rios e mares. É um ciclo que nunca acaba!",
    notes: {
      learned: [
        "Evaporação: o calor do sol transforma a água em vapor.",
        "Condensação: o vapor esfria no alto e forma as nuvens.",
        "Precipitação: as gotas ficam pesadas e caem como chuva.",
        "A água volta para rios e mares e o ciclo recomeça.",
      ],
      careful: [],
      review: "Como se chama a etapa em que o vapor vira nuvem?",
    },
    studentNote: "Evaporação → condensação → chuva → rios e mar. Repete para sempre!",
  });

  await mentor("João Pedro Almeida", {
    subject: "Matemática",
    topic: "Tabuada do 7",
    date: schoolDay(2),
    turns: [
      ["PET", "Oi, João! Eu sempre me perco na tabuada do 7. Você me ajuda a descobrir quanto é 7 vezes 8?"],
      ["STUDENT", "7 vezes 8 é 54, é só somar 7 oito vezes."],
      ["PET", "Hmm, fiquei com uma dúvida... o jeito de somar está certinho, mas eu contei 7, 14, 21, 28, 35, 42, 49, 56. Será que é 56? Confere comigo?"],
      ["STUDENT", "Opa, é 56 mesmo! Eu errei na conta."],
      ["PET", "Acontece! E 7 vezes 9, quanto dá?"],
      ["STUDENT", "É só somar mais 7: 63!"],
    ],
    recap: "Obrigado, João! Aprendi que dá para achar a tabuada somando o mesmo número várias vezes: 7 × 8 = 56 e 7 × 9 = 63.",
    notes: {
      learned: ["Multiplicar é somar o mesmo número várias vezes.", "7 × 8 = 56.", "Para achar 7 × 9, é só somar mais 7: 63."],
      careful: ["7 × 8 não é 54: contando de 7 em 7, chega em 56."],
      review: "Quanto é 7 × 6?",
    },
  });

  await mentor("Miguel Santos Oliveira", {
    subject: "Ciências",
    topic: "Classificação dos animais",
    date: schoolDay(4),
    turns: [
      ["PET", "Oi, Miguel! Por que a baleia não é um peixe, se ela vive na água? Me conta!"],
      ["STUDENT", "O morcego é uma ave porque ele voa e tem asas."],
      ["PET", "Hmm, fiquei com uma dúvida... eu tinha ouvido que o morcego é mamífero: tem pelos e mama quando é filhote. Voar não faz um animal ser ave. Confere comigo?"],
      ["STUDENT", "Verdade, as aves têm penas e bico. E a baleia também é mamífero!"],
      ["PET", "Uau! Então a baleia mama, que nem a gente?"],
      ["STUDENT", "Sim, e ela respira pelo pulmão, não por guelras."],
    ],
    recap: "Obrigado, Miguel! Aprendi que morcegos e baleias são mamíferos, que as aves têm penas e bico, e que voar ou nadar não define o grupo de um animal.",
    notes: {
      learned: ["Mamíferos têm pelos e os filhotes mamam.", "Aves têm penas e bico.", "Baleias são mamíferos e respiram com pulmões."],
      careful: ["Morcego não é ave, é mamífero (mesmo voando)."],
      review: "Por que a baleia não é um peixe?",
    },
  });

  // Aula em andamento: ao abrir "Ensinar o pet" com a Sofia, aparece o histórico da conversa para continuar.
  await mentor("Sofia Ribeiro Lima", {
    subject: "Ciências",
    topic: "Sistema solar",
    date: TODAY,
    open: true,
    turns: [
      ["PET", "Oi, Sofia! Eu olho para o céu e fico curiosa: quem gira em volta de quem, a Terra ou o Sol? Me conta o que você sabe!"],
      ["STUDENT", "O Sol gira em volta da Terra, por isso ele nasce e se põe.", true],
      ["PET", "Hmm, fiquei com uma dúvida... eu tinha ouvido que é a Terra que gira em volta do Sol, e que o dia e a noite acontecem porque a Terra gira em torno dela mesma. Confere comigo?"],
    ],
  });

  await prisma.event.createMany({ data: events });

  // ---------- Conversas entre famílias, professores e gestão ----------
  const [marina, carlos, julia] = teachers;
  const convo = async (c: {
    parent: string;
    to: { id: string };
    student: string;
    subject: string;
    msgs: [from: "parent" | "school", body: string, when: Date][];
    /** Quem já leu tudo; o outro lado vê a última mensagem como não lida. */
    readBy: "both" | "parent" | "school";
  }) => {
    const parent = parents.get(c.parent)!;
    const last = c.msgs.at(-1)![2];
    const lastFrom = (who: "parent" | "school") => c.msgs.findLast((m) => m[0] === who)?.[2] ?? null;
    await prisma.conversation.create({
      data: {
        subject: c.subject,
        parentId: parent.id,
        recipientId: c.to.id,
        studentId: findStudent(c.student).id,
        createdAt: c.msgs[0][2],
        updatedAt: last,
        parentReadAt: c.readBy === "school" ? lastFrom("parent") : last,
        recipientReadAt: c.readBy === "parent" ? lastFrom("school") : last,
        messages: {
          create: c.msgs.map(([from, body, when]) => ({ body, createdAt: when, authorId: from === "parent" ? parent.id : c.to.id })),
        },
      },
    });
  };
  await convo({
    parent: "Cláudia Almeida",
    to: marina,
    student: "João Pedro Almeida",
    subject: "Tarefa de frações do João",
    msgs: [
      ["parent", "Olá, professora! O João ficou com dúvida na tarefa de frações e acabou não entregando. Podemos ajudar em casa?", at(schoolDay(2), 19, 10)],
      ["school", "Olá, Cláudia! Obrigada por avisar. Amanhã revisamos frações com material concreto. Em casa, dividir uma pizza ou um bolo em partes ajuda muito!", at(schoolDay(1), 12, 30)],
      ["parent", "Que ótima ideia! Vamos fazer isso no jantar. Obrigada! 💛", at(schoolDay(1), 20, 5)],
    ],
    readBy: "parent",
  });
  await convo({
    parent: "Roberto Fernandes",
    to: manager,
    student: "Lia Fernandes Costa",
    subject: "Reunião de pais e mestres",
    msgs: [
      ["parent", "Boa tarde! A reunião de pais deste bimestre já tem data?", at(schoolDay(4), 14, 0)],
      ["school", "Boa tarde, Roberto! Será na próxima sexta, às 18h, no pátio. A Lia vai apresentar o caderno de estudos com o pet dela!", at(schoolDay(1), 9, 15)],
    ],
    readBy: "school",
  });
  await convo({
    parent: "Patrícia Ribeiro",
    to: carlos,
    student: "Sofia Ribeiro Lima",
    subject: "Leitura em casa",
    msgs: [["parent", "Olá, professor! A Sofia está adorando os livros. Tem alguma sugestão de leitura para o fim de semana?", at(schoolDay(1), 21, 0)]],
    readBy: "parent",
  });
  await convo({
    parent: "Marcos Oliveira",
    to: julia,
    student: "Ana Clara Oliveira",
    subject: "Tênis para a Educação Física",
    msgs: [
      ["parent", "Olá, professora! A Ana Clara precisa usar um tênis específico na Educação Física?", at(schoolDay(5), 8, 0)],
      ["school", "Olá, Marcos! Qualquer tênis confortável serve. O importante é uma roupa leve. 😊", at(schoolDay(5), 13, 0)],
    ],
    readBy: "both",
  });

  console.log(
    `Seed de apresentação concluído (hoje = ${TODAY}${TODAY_IS_SCHOOL ? ", dia letivo" : " — SEM aula hoje: rode com DEMO_TODAY num dia letivo"}): ` +
      `${rooms.length} turmas, ${rooms.reduce((n, r) => n + r.students.length, 0)} alunos, ${teachers.length} professores, ` +
      `${feedbacks.length} avaliações de aula, ${attendance.length} registros de chamada, ${events.length} eventos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
