import Link from "next/link";
import { BookOpen, Brain, CalendarDays, Hammer, MessageCircleHeart, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { teacherSchedule } from "@/lib/schedule-data";
import { BuildingView } from "@/components/shared/BuildingView";
import { EventList } from "@/components/shared/EventList";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Badge, Card, CardTitle, PageHeader, pluralize } from "@/components/shared/ui";
import { StudentRow } from "./StudentRow";
import { BuildingPicker } from "./BuildingPicker";
import { ParentNoteComposer } from "./ParentNoteComposer";
import { FeedbackSummaryPanel } from "./FeedbackSummaryPanel";

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const teacher = await getActingUser("TEACHER");
  const { turma } = await searchParams;

  // Um professor pode ter várias turmas: são as turmas em que ele dá alguma matéria.
  const assignments = await db.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: { classroom: true, subject: true },
    orderBy: [{ classroom: { name: "asc" } }, { subject: { name: "asc" } }],
  });
  const classes = [...new Map(assignments.map((a) => [a.classroomId, a.classroom])).values()];
  const selectedId = classes.find((c) => c.id === turma)?.id ?? classes[0]?.id;
  const mySubjects = assignments.filter((a) => a.classroomId === selectedId).map((a) => a.subject.name);
  const schedule = await teacherSchedule(teacher.id);

  const classroom = selectedId
    ? await db.classroom.findUnique({
        where: { id: selectedId },
        include: {
          students: { include: { pet: true }, orderBy: { name: "asc" } },
          events: { include: { student: true }, orderBy: { createdAt: "desc" }, take: 8 },
          feedbacks: { orderBy: { createdAt: "desc" } },
          summaries: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
    : null;

  if (!classroom) {
    return (
      <PageHeader
        title={`Olá, ${teacher.name}!`}
        subtitle="Você ainda não tem turmas. O gestor atribui matérias aos professores em Cadastros."
      />
    );
  }

  const avgStars = classroom.feedbacks.length
    ? classroom.feedbacks.reduce((s, f) => s + f.stars, 0) / classroom.feedbacks.length
    : null;

  return (
    <div>
      <PageHeader
        title={`Olá, ${teacher.name}!`}
        subtitle={`${pluralize(classes.length, "turma", "turmas")} · ${pluralize(assignments.length, "matéria", "matérias")}`}
      />

      <nav aria-label="Minhas turmas" className="mb-5 flex flex-wrap gap-2">
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
      </nav>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle
              icon={<Users size={20} className="text-brand" aria-hidden />}
              aside={<span className="text-sm text-muted">{pluralize(classroom.students.length, "aluno", "alunos")}</span>}
            >
              {classroom.name}
            </CardTitle>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <BookOpen size={16} className="text-muted" aria-hidden />
              <span className="text-muted">Suas matérias nesta turma:</span>
              {mySubjects.map((name) => (
                <Badge key={name} tone="sky">
                  {name}
                </Badge>
              ))}
            </div>
            <p className="mb-3 text-sm text-muted">
              Ação positiva: +10 XP para o pet e +10 🧱 para a turma. Ponto de Atenção: sem perda de progresso — o pet
              ganha uma Missão de Cuidado e a turma um Reparo.
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

          <Card>
            <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>Minha grade horária</CardTitle>
            <ScheduleGrid slots={schedule} />
          </Card>

          <Card>
            <CardTitle icon={<MessageCircleHeart size={20} className="text-brand" aria-hidden />}>
              Recado para a família
            </CardTitle>
            <ParentNoteComposer key={classroom.id} students={classroom.students.map((s) => ({ id: s.id, name: s.name }))} />
          </Card>

          <Card>
            <CardTitle icon={<Brain size={20} className="text-brand" aria-hidden />}>Avaliações da aula</CardTitle>
            <FeedbackSummaryPanel
              key={classroom.id}
              classroomId={classroom.id}
              count={classroom.feedbacks.length}
              avgStars={avgStars}
              latest={
                classroom.summaries[0]
                  ? { text: classroom.summaries[0].text, createdAt: classroom.summaries[0].createdAt.toISOString() }
                  : null
              }
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle icon={<Hammer size={20} className="text-sky" aria-hidden />}>Construção da turma</CardTitle>
            <BuildingView {...classroom} />
            <div className="mt-4">
              <BuildingPicker classroomId={classroom.id} current={classroom.buildingType} />
            </div>
          </Card>
          <Card>
            <CardTitle>Últimos registros</CardTitle>
            <EventList events={classroom.events} showStudent />
          </Card>
        </div>
      </div>
    </div>
  );
}
