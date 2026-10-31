import { BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { attendanceRate, gradeAverage } from "@/lib/game";
import { ProgressBar, Stat } from "./ui";

const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmtDay = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

/** Boletim do aluno: notas e frequência de cada matéria da turma. */
export async function ReportCard({ studentId, classroomId }: { studentId: string; classroomId: string }) {
  const classSubjects = await db.classSubject.findMany({
    where: { classroomId },
    orderBy: { subject: { name: "asc" } },
    include: {
      subject: true,
      teacher: true,
      assessments: { orderBy: { date: "asc" }, include: { grades: { where: { studentId } } } },
      attendances: { where: { studentId }, select: { status: true } },
    },
  });

  const rows = classSubjects.map((cs) => {
    const graded = cs.assessments.flatMap((a) =>
      a.grades.map((g) => ({ title: a.title, date: a.date, score: g.score, maxScore: a.maxScore })),
    );
    const statuses = cs.attendances.map((a) => a.status);
    return {
      cs,
      graded,
      average: gradeAverage(graded),
      rate: attendanceRate(statuses),
      absences: statuses.filter((s) => s === "ABSENT").length,
    };
  });

  const allGrades = rows.flatMap((r) => r.graded);
  const allStatuses = classSubjects.flatMap((cs) => cs.attendances.map((a) => a.status));
  const overall = gradeAverage(allGrades);
  const overallRate = attendanceRate(allStatuses);

  if (classSubjects.length === 0) return <p className="text-sm text-muted">A turma ainda não tem matérias.</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Média geral" value={overall !== null ? num(overall) : "—"} hint="de 0 a 10" />
        <Stat label="Frequência" value={overallRate !== null ? pct(overallRate) : "—"} hint="atraso conta como presença" />
        <Stat label="Avaliações lançadas" value={allGrades.length} />
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map(({ cs, graded, average, rate, absences }) => (
          <li key={cs.id} className="card rounded-3xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-1.5 text-lg font-extrabold text-ink">
                  <BookOpen size={18} className="text-brand" aria-hidden /> {cs.subject.name}
                </h3>
                <div className="text-sm text-muted">{cs.teacher.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-muted">Média</div>
                <div
                  className={`text-3xl font-extrabold tabular-nums ${
                    average === null ? "text-muted" : average >= 6 ? "text-success" : "text-attention"
                  }`}
                >
                  {average !== null ? num(average) : "—"}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-bold text-muted">
                <span>Frequência</span>
                <span className="tabular-nums">
                  {rate !== null ? `${pct(rate)} · ${absences} falta(s)` : "sem chamadas ainda"}
                </span>
              </div>
              <ProgressBar value={rate ?? 0} label={`Frequência em ${cs.subject.name}`} tone={rate !== null && rate < 0.75 ? "attention" : "success"} />
            </div>

            {graded.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                {graded.map((g, i) => (
                  <li key={i} className="rounded-xl border border-line bg-surface-2 px-2.5 py-1">
                    <span className="font-bold text-ink">{g.title}</span>
                    <span className="text-muted"> · {fmtDay(g.date)} · </span>
                    <span className="font-extrabold text-ink tabular-nums">
                      {num(g.score)}/{num(g.maxScore)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted">Nenhuma nota lançada ainda.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
