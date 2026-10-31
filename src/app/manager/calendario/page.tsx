import { CalendarCheck, CalendarDays, CalendarPlus, ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { now } from "@/lib/clock";
import { dayKey } from "@/lib/game";
import { DAY_KINDS, addDays } from "@/lib/calendar";
import { loadCalendar, schoolLessonWeekdays } from "@/lib/calendar-data";
import { getActingUser } from "@/lib/session";
import { addCalendarDays, removeCalendarDays, saveTerm } from "@/lib/manager-actions";
import { ActionForm, RemoveButton } from "@/components/shared/ActionForm";
import { Field, Select, TextInput } from "@/components/shared/fields";
import { SchoolCalendar } from "@/components/shared/SchoolCalendar";
import { Badge, Card, CardTitle, PageHeader } from "@/components/shared/ui";

const fmt = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

export default async function CalendarioPage() {
  const manager = await getActingUser("MANAGER");
  const [calendar, weekdays, rows] = await Promise.all([
    loadCalendar(manager.schoolId),
    schoolLessonWeekdays(manager.schoolId),
    db.calendarDay.findMany({ where: { schoolId: manager.schoolId }, orderBy: { date: "asc" } }),
  ]);
  const today = dayKey(now());

  // Dias seguidos com o mesmo tipo e nome viram um item só (ex.: "Recesso de julho, 13/07 a 24/07").
  const groups: { ids: string[]; kind: string; label: string; start: string; end: string }[] = [];
  for (const r of rows) {
    const last = groups.at(-1);
    if (last && last.kind === r.kind && last.label === r.label && addDays(last.end, 1) === r.date) {
      last.ids.push(r.id);
      last.end = r.date;
    } else groups.push({ ids: [r.id], kind: r.kind, label: r.label, start: r.date, end: r.date });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendário letivo"
        subtitle="Defina o período letivo e marque feriados, recessos e eventos. A ofensiva dos alunos só muda em dias letivos."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>Calendário da escola</CardTitle>
          <SchoolCalendar calendar={calendar} lessonWeekdays={weekdays} today={today} />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle icon={<CalendarCheck size={20} className="text-brand" aria-hidden />}>Período letivo</CardTitle>
            <ActionForm action={saveTerm} submitLabel="Salvar período" resetOnSuccess={false}>
              <div className="flex gap-2">
                <Field label="Início">
                  <TextInput name="termStart" type="date" defaultValue={calendar.termStart ?? ""} required />
                </Field>
                <Field label="Fim">
                  <TextInput name="termEnd" type="date" defaultValue={calendar.termEnd ?? ""} required />
                </Field>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <CardTitle icon={<CalendarPlus size={20} className="text-brand" aria-hidden />}>Marcar dia ou período</CardTitle>
            <ActionForm action={addCalendarDays} submitLabel="Marcar no calendário">
              <Field label="Tipo">
                <Select name="kind" defaultValue="HOLIDAY">
                  {Object.entries(DAY_KINDS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                      {v.school ? " (é dia letivo)" : " (sem aula)"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nome">
                <TextInput name="label" placeholder="Ex.: Finados, Recesso de julho" required />
              </Field>
              <div className="flex gap-2">
                <Field label="De">
                  <TextInput name="start" type="date" required />
                </Field>
                <Field label="Até (opcional)">
                  <TextInput name="end" type="date" />
                </Field>
              </div>
            </ActionForm>
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle icon={<ListChecks size={20} className="text-brand" aria-hidden />}>Dias marcados</CardTitle>
        {groups.length === 0 ? (
          <p className="text-sm text-muted">Nenhum feriado, recesso ou evento marcado.</p>
        ) : (
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.ids[0]} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
                <span className="min-w-0">
                  <Badge tone={g.kind === "HOLIDAY" ? "attention" : g.kind === "EVENT" ? "sky" : "brand"}>
                    {DAY_KINDS[g.kind as keyof typeof DAY_KINDS]?.label ?? g.kind}
                  </Badge>{" "}
                  <strong className="text-ink">{g.label}</strong>
                  <span className="block text-xs text-muted tabular-nums">
                    {g.start === g.end ? fmt(g.start) : `${fmt(g.start)} a ${fmt(g.end)} (${g.ids.length} dias)`}
                  </span>
                </span>
                <RemoveButton action={removeCalendarDays.bind(null, g.ids)} label={`Remover ${g.label}`} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
