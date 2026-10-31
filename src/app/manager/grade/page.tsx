import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { WEEKDAYS } from "@/lib/schedule";
import { classroomSchedule } from "@/lib/schedule-data";
import { addScheduleSlot, removeScheduleSlot } from "@/lib/manager-actions";
import { ActionForm, RemoveButton } from "@/components/shared/ActionForm";
import { Field, Select, TextInput } from "@/components/shared/fields";
import { ScheduleGrid } from "@/components/shared/ScheduleGrid";
import { Card, CardTitle, PageHeader } from "@/components/shared/ui";

export default async function GradePage({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const manager = await getActingUser("MANAGER");
  const { turma } = await searchParams;
  const classrooms = await db.classroom.findMany({
    where: { schoolId: manager.schoolId },
    orderBy: { name: "asc" },
    include: { classSubjects: { include: { subject: true, teacher: true }, orderBy: { subject: { name: "asc" } } } },
  });
  const classroom = classrooms.find((c) => c.id === turma) ?? classrooms[0];

  if (!classroom) {
    return (
      <PageHeader
        title="Grade horária"
        subtitle={
          <>
            Nenhuma turma cadastrada. Comece em{" "}
            <Link href="/manager/cadastros" className="font-bold text-brand underline">
              Cadastros
            </Link>
            .
          </>
        }
      />
    );
  }

  const slots = await classroomSchedule(classroom.id);

  return (
    <div className="space-y-5">
      <PageHeader title="Grade horária" subtitle="Monte a semana de cada turma. Conflitos de turma e de professor são bloqueados." />

      <nav aria-label="Turmas" className="flex flex-wrap gap-2">
        {classrooms.map((c) => (
          <Link
            key={c.id}
            href={`/manager/grade?turma=${c.id}`}
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
        <Card className="lg:col-span-2">
          <CardTitle icon={<CalendarDays size={20} className="text-brand" aria-hidden />}>
            Grade da {classroom.name}
          </CardTitle>
          <ScheduleGrid
            slots={slots}
            renderAction={(slot) => (
              <RemoveButton
                action={removeScheduleSlot.bind(null, slot.id)}
                label={`Remover ${slot.subject} das ${slot.startTime}`}
              />
            )}
          />
        </Card>

        <Card>
          <CardTitle icon={<CalendarPlus size={20} className="text-brand" aria-hidden />}>Adicionar aula</CardTitle>
          {classroom.classSubjects.length === 0 ? (
            <p className="text-sm text-muted">
              Esta turma ainda não tem matérias. Adicione em{" "}
              <Link href="/manager/cadastros" className="font-bold text-brand underline">
                Cadastros
              </Link>
              .
            </p>
          ) : (
            <ActionForm key={classroom.id} action={addScheduleSlot} submitLabel="Adicionar à grade" resetOnSuccess={false}>
              <Field label="Matéria">
                <Select name="classSubjectId" required>
                  {classroom.classSubjects.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.subject.name} — {cs.teacher.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dia">
                <Select name="weekday" defaultValue="1">
                  {WEEKDAYS.map((d) => (
                    <option key={d.n} value={d.n}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2">
                <Field label="Início">
                  <TextInput name="startTime" type="time" defaultValue="07:30" required />
                </Field>
                <Field label="Fim">
                  <TextInput name="endTime" type="time" defaultValue="08:20" required />
                </Field>
              </div>
            </ActionForm>
          )}
        </Card>
      </div>
    </div>
  );
}
