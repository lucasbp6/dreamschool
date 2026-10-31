import { BarChart3, School } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { loadClassRanking } from "@/lib/ranking-data";
import { ClassRanking } from "@/components/shared/ClassRanking";
import { BuildingView } from "@/components/shared/BuildingView";
import { Card, CardTitle, PageHeader, Stat, pluralize } from "@/components/shared/ui";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function ManagerPage() {
  const manager = await getActingUser("MANAGER");
  const since = new Date(Date.now() - WEEK_MS);
  const classrooms = await db.classroom.findMany({
    where: { schoolId: manager.schoolId },
    orderBy: { name: "asc" },
    include: {
      classSubjects: { include: { teacher: true } },
      students: { include: { pet: true } },
      events: { select: { type: true, createdAt: true } },
      feedbacks: { select: { stars: true } },
    },
  });

  const ranking = await loadClassRanking(manager.schoolId);
  const allEvents = classrooms.flatMap((c) => c.events);
  const count = (type: string) => allEvents.filter((e) => e.type === type).length;
  const attention = count("ATTENTION");
  const recovery = count("RECOVERY");
  const students = classrooms.reduce((s, c) => s + c.students.length, 0);

  const rows = classrooms.map((c) => {
    const weekPositive = c.events.filter(
      (e) => (e.type === "POSITIVE" || e.type === "RECOVERY") && e.createdAt >= since,
    ).length;
    const avg = c.feedbacks.length ? c.feedbacks.reduce((s, f) => s + f.stars, 0) / c.feedbacks.length : null;
    const teachers = [...new Set(c.classSubjects.map((cs) => cs.teacher.name))].sort();
    return { c, weekPositive, perStudent: c.students.length ? weekPositive / c.students.length : 0, avg, teachers };
  });
  const maxPerStudent = Math.max(...rows.map((r) => r.perStudent), 1);

  return (
    <div>
      <PageHeader title={`Olá, ${manager.name}!`} subtitle="Visão geral do engajamento da escola." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Alunos" value={students} hint={`${classrooms.length} turmas`} />
        <Stat label="Conquistas" value={count("POSITIVE")} hint="ações positivas registradas" />
        <Stat label="Pontos de Atenção" value={attention} hint="viram Missões de Cuidado" />
        <Stat
          label="Superações"
          value={recovery}
          hint={attention ? `${Math.round((recovery / attention) * 100)}% das missões concluídas` : "—"}
        />
      </div>

      <div className="mt-5">
        <ClassRanking overall={ranking.overall} weekly={ranking.weekly} />
      </div>

      <Card className="mt-5">
        <CardTitle icon={<BarChart3 size={20} className="text-brand" aria-hidden />}>
          Engajamento por aluno nos últimos 7 dias
        </CardTitle>
        <p className="mb-3 text-sm text-muted">Conquistas e superações por aluno, em cada turma.</p>
        <ul className="space-y-3">
          {rows.map(({ c, weekPositive, perStudent }) => (
            <li
              key={c.id}
              className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-sm"
              title={`${c.name}: ${weekPositive} conquistas para ${pluralize(c.students.length, "aluno", "alunos")}`}
            >
              <span className="truncate font-bold text-ink">{c.name}</span>
              <div className="h-6 rounded-r bg-surface-2">
                <div
                  className="h-full rounded-r bg-brand"
                  style={{ width: `${(perStudent / maxPerStudent) * 100}%` }}
                  aria-hidden
                />
              </div>
              <span className="text-right font-bold text-ink tabular-nums">{perStudent.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {rows.map(({ c, avg, teachers }) => (
          <Card key={c.id}>
            <CardTitle
              icon={<School size={20} className="text-sky" aria-hidden />}
              aside={<span className="text-right text-sm text-muted">{teachers.join(", ") || "Sem professores"}</span>}
            >
              {c.name}
            </CardTitle>
            <BuildingView {...c} compact />
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-surface-2 p-2">
                <dt className="text-xs text-muted">Alunos</dt>
                <dd className="font-extrabold tabular-nums">{c.students.length}</dd>
              </div>
              <div className="rounded-xl bg-surface-2 p-2">
                <dt className="text-xs text-muted">Pets precisando de cuidado</dt>
                <dd className="font-extrabold tabular-nums">
                  {c.students.filter((s) => s.pet?.mood === "TIRED").length}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-2 p-2">
                <dt className="text-xs text-muted">Avaliação das aulas</dt>
                <dd className="font-extrabold tabular-nums">{avg !== null ? `${avg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ★` : "—"}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
