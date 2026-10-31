import { BookOpen, GraduationCap, School, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getActingUser } from "@/lib/session";
import { BUILDING_INFO, BUILDING_TYPES, PET_INFO, PET_TYPES } from "@/lib/game";
import {
  assignSubject,
  createClassroom,
  createStudent,
  createTeacher,
  removeClassSubject,
} from "@/lib/manager-actions";
import { ActionForm, RemoveButton } from "@/components/shared/ActionForm";
import { Field, Select, TextInput } from "@/components/shared/fields";
import { Badge, Card, CardTitle, PageHeader, pluralize } from "@/components/shared/ui";

export default async function CadastrosPage() {
  const manager = await getActingUser("MANAGER");
  const schoolId = manager.schoolId;
  const [classrooms, teachers, parents, subjects] = await Promise.all([
    db.classroom.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: {
        classSubjects: { include: { subject: true, teacher: true }, orderBy: { subject: { name: "asc" } } },
        students: { include: { pet: true, parent: true }, orderBy: { name: "asc" } },
      },
    }),
    db.user.findMany({
      where: { schoolId, role: "TEACHER" },
      orderBy: { name: "asc" },
      include: { teaching: { include: { classroom: true, subject: true } } },
    }),
    db.user.findMany({ where: { schoolId, role: "PARENT" }, orderBy: { name: "asc" } }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Cadastros" subtitle="Turmas, professores, alunos e as matérias de cada turma." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardTitle icon={<School size={20} className="text-brand" aria-hidden />}>Nova turma</CardTitle>
          <ActionForm action={createClassroom} submitLabel="Cadastrar turma">
            <Field label="Nome">
              <TextInput name="name" placeholder="Ex.: 3º Ano C" required />
            </Field>
            <Field label="Tema da construção">
              <Select name="buildingType" defaultValue="TREEHOUSE">
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {BUILDING_INFO[t].label}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </Card>

        <Card>
          <CardTitle icon={<UserPlus size={20} className="text-brand" aria-hidden />}>Novo professor</CardTitle>
          <ActionForm action={createTeacher} submitLabel="Cadastrar professor">
            <Field label="Nome">
              <TextInput name="name" placeholder="Ex.: Prof. Rafael" required />
            </Field>
            <p className="text-xs text-muted">
              Depois, em <strong>Turmas e matérias</strong>, atribua as matérias que ele dá — um professor pode ter
              várias turmas.
            </p>
          </ActionForm>
        </Card>

        <Card>
          <CardTitle icon={<GraduationCap size={20} className="text-brand" aria-hidden />}>Novo aluno</CardTitle>
          {classrooms.length === 0 ? (
            <p className="text-sm text-muted">Cadastre uma turma primeiro.</p>
          ) : (
            <ActionForm action={createStudent} submitLabel="Cadastrar aluno">
              <Field label="Nome completo">
                <TextInput name="name" placeholder="Ex.: Beatriz Souza Lima" required />
              </Field>
              <Field label="Turma">
                <Select name="classroomId" required>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2">
                <Field label="Pet">
                  <Select name="petType" defaultValue="CAT">
                    {PET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PET_INFO[t].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nome do pet">
                  <TextInput name="petName" required />
                </Field>
              </div>
              <Field label="Responsável (opcional)">
                <TextInput name="parentName" list="parents" placeholder="Nome completo (existente ou novo)" />
              </Field>
              <datalist id="parents">
                {parents.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </ActionForm>
          )}
        </Card>
      </div>

      <section aria-labelledby="turmas-materias">
        <h2 id="turmas-materias" className="mb-1 flex items-center gap-2 text-xl font-extrabold">
          <BookOpen size={20} className="text-brand" aria-hidden /> Turmas e matérias
        </h2>
        <p className="mb-3 text-sm text-muted">
          Cada matéria da turma tem um professor. Os alunos da turma cursam todas as matérias dela.
        </p>
        <datalist id="subjects">
          {subjects.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        <div className="grid gap-5 md:grid-cols-2">
          {classrooms.map((c) => (
            <Card key={c.id}>
              <CardTitle aside={<span className="text-sm text-muted">{pluralize(c.students.length, "aluno", "alunos")}</span>}>
                {c.name}
              </CardTitle>
              {c.classSubjects.length === 0 ? (
                <p className="mb-3 text-sm text-muted">Nenhuma matéria ainda.</p>
              ) : (
                <ul className="mb-4 divide-y divide-line text-sm">
                  {c.classSubjects.map((cs) => (
                    <li key={cs.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span>
                        <strong className="text-ink">{cs.subject.name}</strong>
                        <span className="text-muted"> · {cs.teacher.name}</span>
                      </span>
                      <RemoveButton
                        action={removeClassSubject.bind(null, cs.id)}
                        label={`Remover ${cs.subject.name} da ${c.name} (as aulas dela saem da grade)`}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {teachers.length === 0 ? (
                <p className="text-sm text-muted">Cadastre um professor para atribuir matérias.</p>
              ) : (
                <ActionForm action={assignSubject} submitLabel="Adicionar matéria" className="rounded-2xl bg-surface-2 p-3">
                  <input type="hidden" name="classroomId" value={c.id} />
                  <div className="flex flex-wrap gap-2">
                    <Field label="Matéria">
                      <TextInput name="subjectName" list="subjects" placeholder="Ex.: Geografia" required />
                    </Field>
                    <Field label="Professor">
                      <Select name="teacherId" required>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </ActionForm>
              )}
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle icon={<Users size={20} className="text-brand" aria-hidden />}>Professores</CardTitle>
          <ul className="divide-y divide-line text-sm">
            {teachers.map((t) => {
              const byClass = new Map<string, string[]>();
              for (const a of t.teaching) byClass.set(a.classroom.name, [...(byClass.get(a.classroom.name) ?? []), a.subject.name]);
              return (
                <li key={t.id} className="py-2">
                  <div className="font-bold text-ink">{t.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {byClass.size === 0 && <span className="text-muted">Sem turmas</span>}
                    {[...byClass].sort().map(([room, subs]) => (
                      <Badge key={room} tone="sky">
                        {room}: {subs.sort().join(", ")}
                      </Badge>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardTitle icon={<GraduationCap size={20} className="text-brand" aria-hidden />}>Alunos</CardTitle>
          <div className="space-y-4 text-sm">
            {classrooms.map((c) => (
              <div key={c.id}>
                <h3 className="mb-1 font-extrabold text-ink">{c.name}</h3>
                {c.students.length === 0 ? (
                  <p className="text-muted">Nenhum aluno.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {c.students.map((s) => (
                      <li key={s.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                        <span className="font-bold text-ink">
                          {s.name}
                          {s.pet && <span className="font-normal text-muted"> · {s.pet.petName}</span>}
                        </span>
                        <span className="text-muted">{s.parent?.name ?? "Sem responsável"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
