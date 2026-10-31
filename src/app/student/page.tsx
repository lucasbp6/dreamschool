import { CalendarDays, Flame, GraduationCap, History, Sparkles, Star, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { classroomSchedule } from "@/lib/schedule-data";
import { feedbackDay } from "@/lib/feedback-data";
import { firstName } from "@/lib/game";
import { EventList } from "@/components/shared/EventList";
import { ReportCard } from "@/components/shared/ReportCard";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Tabs } from "@/components/shared/Tabs";
import { WorldScene } from "@/components/shared/WorldScene";
import { Card, CardTitle, PageHeader } from "@/components/shared/ui";
import { LessonFeedbackForm } from "./LessonFeedbackForm";

export default async function StudentPage() {
  const acting = await getActingUser("STUDENT");
  const student = await db.user.findUniqueOrThrow({
    where: { id: acting.id },
    include: {
      pet: true,
      classroom: { include: { students: { include: { pet: true }, orderBy: { name: "asc" } } } },
      events: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
  const { pet, classroom } = student;
  if (!pet || !classroom) {
    return <PageHeader title={`Olá, ${firstName(student.name)}!`} subtitle="Seu pet ainda está chegando." />;
  }

  const [schedule, feedback] = await Promise.all([classroomSchedule(classroom.id), feedbackDay(student.id)]);
  const pending = feedback.required - feedback.ratedRequired;

  return (
    <div>
      <PageHeader title={`Olá, ${firstName(student.name)}! 👋`} subtitle={`${student.name} · Turma ${classroom.name}`} />
      <Tabs
        label="Áreas do aluno"
        tabs={[
          {
            id: "mundo",
            label: "Meu mundo",
            icon: <Sparkles size={16} aria-hidden />,
            content: (
              <div className="space-y-5">
                <WorldScene
                  pet={pet}
                  ownerName={student.name}
                  classroom={classroom}
                  parade={classroom.students
                    .filter((s) => s.pet && s.id !== student.id)
                    .map((s) => ({ ...s.pet!, id: s.id, ownerName: s.name }))}
                />
                {pet.recoveryMission ? (
                  <Card className="border-attention bg-attention-soft">
                    <CardTitle icon={<Target size={20} className="text-attention" aria-hidden />}>Missão de Cuidado</CardTitle>
                    <p className="text-ink">
                      {pet.petName} está precisando de energia. Sua missão: <strong>{pet.recoveryMission}</strong>.
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Ao concluir, {pet.petName} volta a ficar radiante e você ganha um bônus de superação! ✨
                    </p>
                  </Card>
                ) : (
                  <Card className="border-success bg-success-soft">
                    <CardTitle icon={<Target size={20} className="text-success" aria-hidden />}>Tudo em dia!</CardTitle>
                    <p className="text-ink">
                      Continue participando para ganhar XP e tijolinhos para a turma. Avaliar seus professores todo dia
                      mantém sua ofensiva acesa 🔥
                    </p>
                  </Card>
                )}
              </div>
            ),
          },
          {
            id: "avaliar",
            label: "Avaliar aulas",
            icon: <Star size={16} aria-hidden />,
            badge:
              pending > 0 ? (
                <span className="rounded-full bg-attention px-1.5 text-xs text-on-brand" aria-label={`${pending} pendentes`}>
                  {pending}
                </span>
              ) : feedback.streak > 0 ? (
                <span className="inline-flex items-center text-xs" aria-label={`ofensiva de ${feedback.streak} dias`}>
                  <Flame size={14} aria-hidden />
                  {feedback.streak}
                </span>
              ) : undefined,
            content: (
              <LessonFeedbackForm
                studentId={student.id}
                petName={pet.petName}
                teachers={feedback.teachers}
                streak={feedback.streak}
                required={feedback.required}
                ratedRequired={feedback.ratedRequired}
                completedToday={feedback.completedToday}
              />
            ),
          },
          {
            id: "boletim",
            label: "Boletim",
            icon: <GraduationCap size={16} aria-hidden />,
            content: <ReportCard studentId={student.id} classroomId={classroom.id} />,
          },
          {
            id: "grade",
            label: "Grade",
            icon: <CalendarDays size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>Minha grade horária</CardTitle>
                <ScheduleGrid slots={schedule} />
              </Card>
            ),
          },
          {
            id: "jornada",
            label: "Jornada",
            icon: <History size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<History size={20} className="text-brand" aria-hidden />}>Minha jornada</CardTitle>
                <EventList events={student.events} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
