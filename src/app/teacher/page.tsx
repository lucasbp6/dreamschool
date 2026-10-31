import { Brain, Hammer, MessageCircleHeart, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { BuildingView } from "@/components/shared/BuildingView";
import { EventList } from "@/components/shared/EventList";
import { Card, CardTitle, PageHeader } from "@/components/shared/ui";
import { StudentRow } from "./StudentRow";
import { BuildingPicker } from "./BuildingPicker";
import { ParentNoteComposer } from "./ParentNoteComposer";
import { FeedbackSummaryPanel } from "./FeedbackSummaryPanel";

export default async function TeacherPage() {
  const teacher = await getActingUser("TEACHER");
  const classroom = await db.classroom.findUnique({
    where: { teacherId: teacher.id },
    include: {
      students: { include: { pet: true }, orderBy: { name: "asc" } },
      events: { include: { student: true }, orderBy: { createdAt: "desc" }, take: 8 },
      feedbacks: { orderBy: { createdAt: "desc" } },
      summaries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!classroom) {
    return <PageHeader title={`Olá, ${teacher.name}!`} subtitle="Você ainda não tem uma turma." />;
  }

  const avgStars = classroom.feedbacks.length
    ? classroom.feedbacks.reduce((s, f) => s + f.stars, 0) / classroom.feedbacks.length
    : null;

  return (
    <div>
      <PageHeader
        title={`Olá, ${teacher.name}!`}
        subtitle={`Turma ${classroom.name} · ${classroom.students.length} alunos`}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle icon={<Users size={20} className="text-brand" aria-hidden />}>Minha turma</CardTitle>
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
            <CardTitle icon={<MessageCircleHeart size={20} className="text-brand" aria-hidden />}>
              Recado para a família
            </CardTitle>
            <ParentNoteComposer students={classroom.students.map((s) => ({ id: s.id, name: s.name }))} />
          </Card>

          <Card>
            <CardTitle icon={<Brain size={20} className="text-brand" aria-hidden />}>Avaliações da aula</CardTitle>
            <FeedbackSummaryPanel
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
