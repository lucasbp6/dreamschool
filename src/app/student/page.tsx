import { CalendarDays, Hammer, History, Star, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { classroomSchedule } from "@/lib/schedule-data";
import { MOOD_INFO, PET_INFO, petLevel, type Mood, type PetType } from "@/lib/game";
import { PetAvatar } from "@/components/shared/PetAvatar";
import { BuildingView } from "@/components/shared/BuildingView";
import { EventList } from "@/components/shared/EventList";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Badge, Card, CardTitle, PageHeader, ProgressBar } from "@/components/shared/ui";
import { LessonFeedbackForm } from "./LessonFeedbackForm";

export default async function StudentPage() {
  const acting = await getActingUser("STUDENT");
  const student = await db.user.findUniqueOrThrow({
    where: { id: acting.id },
    include: {
      pet: true,
      classroom: { include: { students: { include: { pet: true }, orderBy: { name: "asc" } } } },
      events: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  const { pet, classroom } = student;
  if (!pet || !classroom) return <PageHeader title={`Olá, ${student.name}!`} subtitle="Seu pet ainda está chegando." />;

  const schedule = await classroomSchedule(classroom.id);
  const lvl = petLevel(pet.xp);
  const mood = MOOD_INFO[pet.mood as Mood] ?? MOOD_INFO.NEUTRAL;
  const species = PET_INFO[pet.petType as PetType]?.label ?? "Pet";

  return (
    <div>
      <PageHeader title={`Olá, ${student.name}! 👋`} subtitle={`Turma ${classroom.name}`} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="flex flex-col items-center gap-6 sm:flex-row">
            <PetAvatar petType={pet.petType} xp={pet.xp} mood={pet.mood} size="lg" />
            <div className="w-full flex-1">
              <div className="text-sm font-semibold text-muted">{species}</div>
              <h2 className="text-3xl font-extrabold text-ink">{pet.petName}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>
                  Nível {lvl.level} · {lvl.name}
                </Badge>
                <Badge tone={pet.mood === "TIRED" ? "attention" : "success"}>
                  {mood.emoji} {mood.label}
                </Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={lvl.progress} label="XP do pet" />
                <div className="mt-1 text-sm text-muted tabular-nums">
                  {pet.xp} XP
                  {lvl.needed !== null
                    ? ` · faltam ${lvl.needed - lvl.current} XP para o próximo nível`
                    : " · nível máximo, você é um Guardião!"}
                </div>
              </div>
            </div>
          </Card>

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
                {pet.petName} está {mood.label.toLowerCase()}. Continue participando para ganhar XP e tijolinhos para a
                turma.
              </p>
            </Card>
          )}

          <Card>
            <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>Minha grade horária</CardTitle>
            <ScheduleGrid slots={schedule} />
          </Card>

          <Card>
            <CardTitle icon={<Users size={20} className="text-brand" aria-hidden />}>Pets da turma</CardTitle>
            <ul className="flex flex-wrap gap-4">
              {classroom.students.map((s) =>
                s.pet ? (
                  <li key={s.id} className="flex w-20 flex-col items-center text-center text-xs">
                    <PetAvatar petType={s.pet.petType} xp={s.pet.xp} mood={s.pet.mood} size="sm" />
                    <span className="mt-2 font-bold text-ink">{s.pet.petName}</span>
                    <span className="text-muted">{s.name}</span>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>

          <Card>
            <CardTitle icon={<History size={20} className="text-brand" aria-hidden />}>Minha jornada</CardTitle>
            <EventList events={student.events} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle icon={<Hammer size={20} className="text-sky" aria-hidden />}>Nossa construção</CardTitle>
            <BuildingView {...classroom} />
          </Card>
          <Card>
            <CardTitle icon={<Star size={20} className="text-brand" aria-hidden />}>Como foi a aula?</CardTitle>
            <LessonFeedbackForm studentId={student.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
