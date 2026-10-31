import { CalendarDays, Hammer, History, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { classroomSchedule } from "@/lib/schedule-data";
import { MOOD_INFO, PET_INFO, petLevel, type Mood, type PetType } from "@/lib/game";
import { PetAvatar } from "@/components/shared/PetAvatar";
import { BuildingView } from "@/components/shared/BuildingView";
import { EventList } from "@/components/shared/EventList";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Badge, Card, CardTitle, PageHeader, ProgressBar, Stat } from "@/components/shared/ui";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" });

export default async function ParentPage() {
  const parent = await getActingUser("PARENT");
  const children = await db.user.findMany({
    where: { parentId: parent.id },
    include: {
      pet: true,
      classroom: true,
      events: { orderBy: { createdAt: "desc" }, take: 8 },
      parentNotes: { orderBy: { createdAt: "desc" } },
      _count: { select: { events: { where: { type: { in: ["POSITIVE", "RECOVERY"] } } } } },
    },
  });

  const schedules = new Map(
    await Promise.all(
      children.map(async (c) => [c.id, c.classroomId ? await classroomSchedule(c.classroomId) : []] as const),
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeader title={`Olá, ${parent.name}!`} subtitle="Acompanhe a jornada na Escola dos Sonhos." />
      {children.length === 0 && <p className="text-muted">Nenhum aluno vinculado a este responsável.</p>}

      {children.map((child) => {
        const pet = child.pet;
        const lvl = pet ? petLevel(pet.xp) : null;
        const mood = pet ? (MOOD_INFO[pet.mood as Mood] ?? MOOD_INFO.NEUTRAL) : null;
        return (
          <div key={child.id} className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {pet && lvl && mood && (
                <Card className="flex flex-col items-center gap-6 sm:flex-row">
                  <PetAvatar petType={pet.petType} xp={pet.xp} mood={pet.mood} size="lg" />
                  <div className="w-full flex-1">
                    <div className="text-sm font-semibold text-muted">
                      {PET_INFO[pet.petType as PetType]?.label} de {child.name}
                    </div>
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
                    </div>
                    {pet.recoveryMission && (
                      <p className="mt-3 rounded-xl bg-attention-soft p-3 text-sm text-ink">
                        <strong className="text-attention">Missão de Cuidado:</strong> {pet.recoveryMission}. Um
                        incentivo em casa ajuda {child.name} a concluir! 💛
                      </p>
                    )}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Stat label="XP total" value={pet?.xp ?? 0} />
                <Stat label="Conquistas e superações" value={child._count.events} />
              </div>

              <Card>
                <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>
                  Grade horária de {child.name}
                </CardTitle>
                <ScheduleGrid slots={schedules.get(child.id) ?? []} />
              </Card>

              <Card>
                <CardTitle icon={<Mail size={20} className="text-brand" aria-hidden />}>Recados da escola</CardTitle>
                {child.parentNotes.length === 0 ? (
                  <p className="text-sm text-muted">Nenhum recado ainda.</p>
                ) : (
                  <ul className="space-y-3">
                    {child.parentNotes.map((n) => (
                      <li key={n.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                        <div className="text-xs font-bold text-muted">{fmt.format(n.createdAt)}</div>
                        <p className="mt-1 whitespace-pre-line text-ink">{n.humanizedText}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="space-y-5">
              {child.classroom && (
                <Card>
                  <CardTitle icon={<Hammer size={20} className="text-sky" aria-hidden />}>
                    Construção da {child.classroom.name}
                  </CardTitle>
                  <BuildingView {...child.classroom} compact />
                </Card>
              )}
              <Card>
                <CardTitle icon={<History size={20} className="text-brand" aria-hidden />}>Histórico</CardTitle>
                <EventList events={child.events} />
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
