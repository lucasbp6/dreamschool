import { CalendarDays, CalendarRange, Flame, GraduationCap, History, MessagesSquare, Sparkles, Star, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { classroomSchedule } from "@/lib/schedule-data";
import { feedbackDay } from "@/lib/feedback-data";
import { firstName } from "@/lib/game";
import { addDays, currentOrNextSchoolDay, weekdayOf } from "@/lib/calendar";
import { SchoolCalendar } from "@/components/shared/SchoolCalendar";
import { EventList } from "@/components/shared/EventList";
import { ReportCard } from "@/components/shared/ReportCard";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Tabs } from "@/components/shared/Tabs";
import { WorldScene } from "@/components/shared/WorldScene";
import { Card, CardTitle, PageHeader } from "@/components/shared/ui";
import { LessonFeedbackForm } from "./LessonFeedbackForm";
import { MentorChat } from "./MentorChat";
import { NotebookReminder } from "./NotebookReminder";

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

  const [schedule, feedback, classSubjects, mentorSessions] = await Promise.all([
    classroomSchedule(classroom.id),
    feedbackDay(student.id),
    db.classSubject.findMany({ where: { classroomId: classroom.id }, include: { subject: true }, orderBy: { subject: { name: "asc" } } }),
    db.mentorSession.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
  ]);
  const activeMentor = mentorSessions.find((s) => !s.endedAt) ?? null;
  const pending = feedback.pending;

  // Lembrete dos cadernos: aulas de hoje ou, sem aula hoje, do próximo dia letivo.
  const lessonsDate = currentOrNextSchoolDay(feedback.today, feedback.calendar, feedback.lessonDays);
  const reminderSubjects = lessonsDate
    ? [
        ...schedule
          .filter((s) => s.weekday === weekdayOf(lessonsDate))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .reduce((m, s) => (m.has(s.subject) ? m : m.set(s.subject, s.startTime)), new Map<string, string>()),
      ].map(([name, time]) => ({ name, time }))
    : [];
  const reminderWhen = !lessonsDate
    ? ""
    : lessonsDate === feedback.today
      ? "hoje"
      : lessonsDate === addDays(feedback.today, 1)
        ? "amanhã"
        : `${[0, 6].includes(weekdayOf(lessonsDate)) ? "no" : "na"} ${new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date(`${lessonsDate}T12:00:00`))}`;

  return (
    <div>
      <PageHeader title={`Olá, ${firstName(student.name)}!`} subtitle={`${student.name} · Turma ${classroom.name}`} />
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
                {lessonsDate && reminderSubjects.length > 0 && (
                  <NotebookReminder
                    studentId={student.id}
                    firstName={firstName(student.name)}
                    pet={{ petType: pet.petType, petName: pet.petName, mood: pet.mood }}
                    date={lessonsDate}
                    when={reminderWhen}
                    subjects={reminderSubjects}
                  />
                )}
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
                      Continue participando para ganhar XP e tijolinhos para a turma. Avaliar todas as aulas de cada dia
                      mantém sua ofensiva acesa.
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
                days={feedback.days}
                streak={feedback.streak}
                noSchoolReason={feedback.noSchoolReason}
              />
            ),
          },
          {
            id: "ensinar",
            label: "Ensinar o pet",
            icon: <MessagesSquare size={16} aria-hidden />,
            content: (
              <MentorChat
                subjects={classSubjects.map((cs) => cs.subject.name)}
                pet={{ petType: pet.petType, petName: pet.petName, mood: pet.mood }}
                active={
                  activeMentor && {
                    id: activeMentor.id,
                    subjectName: activeMentor.subjectName,
                    topic: activeMentor.topic,
                    messages: activeMentor.messages.map((m) => ({
                      id: m.id,
                      role: m.role as "STUDENT" | "PET",
                      content: m.content,
                      viaAudio: m.viaAudio,
                    })),
                  }
                }
                past={mentorSessions
                  .filter((s) => s.endedAt)
                  .slice(0, 5)
                  .map((s) => ({
                    id: s.id,
                    subjectName: s.subjectName,
                    topic: s.topic,
                    recap: s.recap,
                    createdAt: s.createdAt.toISOString(),
                  }))}
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
            id: "calendario",
            label: "Calendário",
            icon: <CalendarRange size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<CalendarRange size={20} className="text-brand" aria-hidden />}>Calendário letivo</CardTitle>
                <SchoolCalendar
                  calendar={feedback.calendar}
                  lessonWeekdays={feedback.lessonDays}
                  today={feedback.today}
                  streakDays={feedback.completedDays}
                  streakLabel="Dia da ofensiva (avaliou todas as aulas)"
                 />
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
