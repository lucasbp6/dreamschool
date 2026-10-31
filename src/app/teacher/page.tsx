import Link from "next/link";
import {
  BookOpen,
  Brain,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Hammer,
  MessageCircleHeart,
  Sparkles,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { now } from "@/lib/clock";
import { dayKey } from "@/lib/game";
import { getActingUser } from "@/lib/session";
import { teacherSchedule } from "@/lib/schedule-data";
import { EventList } from "@/components/shared/EventList";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Tabs } from "@/components/shared/Tabs";
import { WorldScene } from "@/components/shared/WorldScene";
import { Badge, Card, CardTitle, PageHeader, pluralize } from "@/components/shared/ui";
import { StudentRow } from "./StudentRow";
import { BuildingPicker } from "./BuildingPicker";
import { ParentNoteComposer } from "./ParentNoteComposer";
import { FeedbackSummaryPanel } from "./FeedbackSummaryPanel";
import { AttendanceSheet } from "./AttendanceSheet";
import { GradeBook } from "./GradeBook";

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const teacher = await getActingUser("TEACHER");
  const { turma } = await searchParams;

  // Um professor pode ter várias turmas: são as turmas em que ele dá alguma matéria.
  const assignments = await db.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: { classroom: true, subject: true, slots: { select: { weekday: true } } },
    orderBy: [{ classroom: { name: "asc" } }, { subject: { name: "asc" } }],
  });
  const classes = [...new Map(assignments.map((a) => [a.classroomId, a.classroom])).values()];
  const selectedId = classes.find((c) => c.id === turma)?.id ?? classes[0]?.id;
  const mine = assignments.filter((a) => a.classroomId === selectedId);
  const mineIds = mine.map((a) => a.id);
  const today = dayKey(now());

  const [classroom, schedule, attendance, assessments] = await Promise.all([
    selectedId
      ? db.classroom.findUnique({
          where: { id: selectedId },
          include: {
            students: { include: { pet: true }, orderBy: { name: "asc" } },
            events: { include: { student: true }, orderBy: { createdAt: "desc" }, take: 10 },
            feedbacks: { where: { teacherId: teacher.id } },
            summaries: { where: { teacherId: teacher.id }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        })
      : null,
    teacherSchedule(teacher.id),
    db.attendance.findMany({ where: { classSubjectId: { in: mineIds } } }),
    db.assessment.findMany({
      where: { classSubjectId: { in: mineIds } },
      orderBy: { date: "asc" },
      include: { grades: { select: { studentId: true, score: true } } },
    }),
  ]);

  if (!classroom) {
    return (
      <PageHeader
        title={`Olá, ${teacher.name}!`}
        subtitle="Você ainda não tem turmas. O gestor atribui matérias aos professores em Cadastros."
      />
    );
  }

  const students = classroom.students.map((s) => ({ id: s.id, name: s.name }));
  const subjects = mine.map((a) => ({ id: a.id, name: a.subject.name, weekdays: a.slots.map((s) => s.weekday) }));
  const avgStars = classroom.feedbacks.length
    ? classroom.feedbacks.reduce((s, f) => s + f.stars, 0) / classroom.feedbacks.length
    : null;

  return (
    <div>
      <PageHeader
        title={`Olá, ${teacher.name}!`}
        subtitle={`${pluralize(classes.length, "turma", "turmas")} · ${pluralize(assignments.length, "matéria", "matérias")}`}
      />

      <nav aria-label="Minhas turmas" className="mb-4 flex flex-wrap items-center gap-2">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/teacher?turma=${c.id}`}
            aria-current={c.id === classroom.id ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              c.id === classroom.id ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink hover:border-brand"
            }`}
          >
            {c.name}
          </Link>
        ))}
        <span className="ml-1 flex flex-wrap items-center gap-1 text-sm">
          <BookOpen size={16} className="text-muted" aria-hidden />
          {mine.map((a) => (
            <Badge key={a.id} tone="sky">
              {a.subject.name}
            </Badge>
          ))}
        </span>
      </nav>

      <Tabs
        label="Áreas do professor"
        tabs={[
          {
            id: "turma",
            label: "Turma",
            icon: <Users size={16} aria-hidden />,
            content: (
              <div className="space-y-5">
                <WorldScene
                  classroom={classroom}
                  parade={classroom.students.filter((s) => s.pet).map((s) => ({ ...s.pet!, id: s.id, ownerName: s.name }))}
                />
                <div className="grid gap-5 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardTitle
                      icon={<Sparkles size={20} className="text-brand" aria-hidden />}
                      aside={<span className="text-sm text-muted">{pluralize(students.length, "aluno", "alunos")}</span>}
                    >
                      Pontos da {classroom.name}
                    </CardTitle>
                    <p className="mb-3 text-sm text-muted">
                      Ação positiva: +10 XP para o pet e +10 tijolinhos para a turma. Ponto de Atenção: sem perda de progresso — o
                      pet ganha uma Missão de Cuidado e a turma um Reparo.
                    </p>
                    <ul className="space-y-3">
                      {classroom.students.map((s) =>
                        s.pet ? (
                          <StudentRow
                            key={s.id}
                            student={{ id: s.id, name: s.name }}
                            pet={{
                              petType: s.pet.petType,
                              petName: s.pet.petName,
                              xp: s.pet.xp,
                              mood: s.pet.mood,
                              recoveryMission: s.pet.recoveryMission,
                            }}
                          />
                        ) : null,
                      )}
                    </ul>
                  </Card>
                  <div className="space-y-5">
                    <Card>
                      <CardTitle icon={<Hammer size={20} className="text-sky" aria-hidden />}>Tema da construção</CardTitle>
                      <BuildingPicker classroomId={classroom.id} current={classroom.buildingType} />
                    </Card>
                    <Card>
                      <CardTitle>Últimos registros</CardTitle>
                      <EventList events={classroom.events} showStudent />
                    </Card>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "chamada",
            label: "Chamada",
            icon: <ClipboardCheck size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<ClipboardCheck size={20} className="text-brand" aria-hidden />}>
                  Chamada da {classroom.name}
                </CardTitle>
                <AttendanceSheet key={classroom.id} subjects={subjects} students={students} records={attendance} today={today} />
              </Card>
            ),
          },
          {
            id: "notas",
            label: "Notas",
            icon: <GraduationCap size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<GraduationCap size={20} className="text-brand" aria-hidden />}>
                  Notas da {classroom.name}
                </CardTitle>
                <GradeBook key={classroom.id} subjects={subjects} students={students} assessments={assessments} today={today} />
              </Card>
            ),
          },
          {
            id: "grade",
            label: "Grade",
            icon: <CalendarDays size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>
                  Minha grade horária (todas as turmas)
                </CardTitle>
                <ScheduleGrid slots={schedule} />
              </Card>
            ),
          },
          {
            id: "recados",
            label: "Recados",
            icon: <MessageCircleHeart size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<MessageCircleHeart size={20} className="text-brand" aria-hidden />}>
                  Recado para a família
                </CardTitle>
                <ParentNoteComposer key={classroom.id} students={students} />
              </Card>
            ),
          },
          {
            id: "avaliacoes",
            label: "Avaliações",
            icon: <Brain size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<Brain size={20} className="text-brand" aria-hidden />}>
                  Como os alunos da {classroom.name} avaliam suas aulas
                </CardTitle>
                <FeedbackSummaryPanel
                  key={classroom.id}
                  classroomId={classroom.id}
                  teacherId={teacher.id}
                  count={classroom.feedbacks.length}
                  avgStars={avgStars}
                  latest={
                    classroom.summaries[0]
                      ? { text: classroom.summaries[0].text, createdAt: classroom.summaries[0].createdAt.toISOString() }
                      : null
                  }
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
