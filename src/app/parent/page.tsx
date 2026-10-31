import Link from "next/link";
import { CalendarDays, CalendarRange, GraduationCap, History, Mail, MessagesSquare, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { classroomSchedule } from "@/lib/schedule-data";
import { feedbackDay } from "@/lib/feedback-data";
import { firstName } from "@/lib/game";
import { SchoolCalendar } from "@/components/shared/SchoolCalendar";
import { ClassRanking } from "@/components/shared/ClassRanking";
import { loadClassRanking } from "@/lib/ranking-data";
import { MessagesPanel } from "@/components/shared/MessagesPanel";
import { loadConversations, parentRecipients, unreadCount } from "@/lib/messages-data";
import { EventList } from "@/components/shared/EventList";
import { ReportCard } from "@/components/shared/ReportCard";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Tabs } from "@/components/shared/Tabs";
import { WorldScene } from "@/components/shared/WorldScene";
import { Card, CardTitle, PageHeader, Stat } from "@/components/shared/ui";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" });

export default async function ParentPage({ searchParams }: { searchParams: Promise<{ filho?: string }> }) {
  const parent = await getActingUser("PARENT");
  const { filho } = await searchParams;
  const children = await db.user.findMany({
    where: { parentId: parent.id },
    orderBy: { name: "asc" },
    include: {
      pet: true,
      classroom: true,
      events: { orderBy: { createdAt: "desc" }, take: 15 },
      parentNotes: { orderBy: { createdAt: "desc" } },
      _count: { select: { events: { where: { type: { in: ["POSITIVE", "RECOVERY", "STREAK", "MENTOR"] } } } } },
    },
  });
  const child = children.find((c) => c.id === filho) ?? children[0];

  if (!child) {
    return (
      <div>
        <PageHeader title={`Olá, ${firstName(parent.name)}!`} />
        <p className="text-muted">Nenhum aluno vinculado a este responsável.</p>
      </div>
    );
  }

  const [schedule, feedback, conversations, recipients, ranking] = await Promise.all([
    child.classroomId ? classroomSchedule(child.classroomId) : [],
    feedbackDay(child.id),
    loadConversations(parent.id, "PARENT"),
    parentRecipients(parent.id),
    loadClassRanking(parent.schoolId),
  ]);
  const unread = unreadCount(conversations);
  const pet = child.pet;

  return (
    <div>
      <PageHeader
        title={`Olá, ${firstName(parent.name)}!`}
        subtitle={`Acompanhe a jornada de ${child.name}${child.classroom ? ` · Turma ${child.classroom.name}` : ""}`}
      />

      {children.length > 1 && (
        <nav aria-label="Filhos" className="mb-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/parent?filho=${c.id}`}
              aria-current={c.id === child.id ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${
                c.id === child.id ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink hover:border-brand"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      <Tabs
        label={`Acompanhamento de ${child.name}`}
        tabs={[
          {
            id: "pet",
            label: "Pet e turma",
            icon: <Sparkles size={16} aria-hidden />,
            content: (
              <div className="space-y-5">
                {child.classroom && <WorldScene pet={pet ?? undefined} ownerName={child.name} classroom={child.classroom} />}
                {pet?.recoveryMission && (
                  <Card className="border-attention bg-attention-soft">
                    <p className="text-ink">
                      <strong className="text-attention">Missão de Cuidado:</strong> {pet.recoveryMission}. Um incentivo
                      em casa ajuda {firstName(child.name)} a concluir! 💛
                    </p>
                  </Card>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat label="XP total" value={pet?.xp ?? 0} />
                  <Stat label="Conquistas e superações" value={child._count.events} />
                  <Stat label="Ofensiva de avaliações" value={`🔥 ${feedback.streak}`} hint="dias seguidos avaliando todas as aulas" />
                </div>
                <ClassRanking overall={ranking.overall} weekly={ranking.weekly} highlightId={child.classroomId ?? undefined} />
              </div>
            ),
          },
          {
            id: "boletim",
            label: "Boletim",
            icon: <GraduationCap size={16} aria-hidden />,
            content: child.classroomId ? (
              <ReportCard studentId={child.id} classroomId={child.classroomId} />
            ) : (
              <p className="text-muted">Sem turma.</p>
            ),
          },
          {
            id: "grade",
            label: "Grade",
            icon: <CalendarDays size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>
                  Grade horária de {firstName(child.name)}
                </CardTitle>
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
                  streakLabel={`Dia da ofensiva de ${firstName(child.name)}`}
                 />
              </Card>
            ),
          },
          {
            id: "recados",
            label: "Recados",
            icon: <Mail size={16} aria-hidden />,
            badge: child.parentNotes.length ? (
              <span className="rounded-full bg-surface px-1.5 text-xs text-ink">{child.parentNotes.length}</span>
            ) : undefined,
            content: (
              <Card>
                <CardTitle icon={<Mail size={20} className="text-brand" aria-hidden />}>Recados da escola</CardTitle>
                {child.parentNotes.length === 0 ? (
                  <p className="text-sm text-muted">Nenhum recado ainda.</p>
                ) : (
                  <ul tabIndex={0} aria-label="Recados da escola (com rolagem)" className="max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                    {child.parentNotes.map((n) => (
                      <li key={n.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                        <div className="text-xs font-bold text-muted">{fmt.format(n.createdAt)}</div>
                        <p className="mt-1 whitespace-pre-line text-ink">{n.humanizedText}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ),
          },
          {
            id: "mensagens",
            label: "Mensagens",
            icon: <MessagesSquare size={16} aria-hidden />,
            badge: unread > 0 ? (
              <span className="rounded-full bg-attention px-1.5 text-xs text-on-brand" aria-label={`${unread} não lidas`}>
                {unread}
              </span>
            ) : undefined,
            content: (
              <MessagesPanel
                role="PARENT"
                conversations={conversations}
                recipients={recipients}
                students={children.map((c) => ({ id: c.id, name: c.name }))}
              />
            ),
          },
          {
            id: "historico",
            label: "Histórico",
            icon: <History size={16} aria-hidden />,
            content: (
              <Card>
                <CardTitle icon={<History size={20} className="text-brand" aria-hidden />}>Histórico</CardTitle>
                <EventList events={child.events} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
