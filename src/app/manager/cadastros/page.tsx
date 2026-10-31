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
import { Tabs } from "@/components/shared/Tabs";

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

  const studentCount = classrooms.reduce((n, c) => n + c.students.length, 0);
  const subjectCount = classrooms.reduce((n, c) => n + c.classSubjects.length, 0);
  const count = (n: number) => <span className="rounded-full bg-surface-2 px-1.5 text-xs text-ink tabular-nums">{n}</span>;
  const scrollList = "max-h-[30rem] overflow-y-auto pr-1";

  return (
    <div className="space-y-5">
      <PageHeader title="Cadastros" subtitle="Cadastre a escola em quatro passos — cada um na sua aba." />

      <ol className="flex flex-wrap gap-2 text-xs font-bold text-muted" aria-label="Passo a passo">
        <li className="rounded-full bg-surface px-3 py-1 ring-1 ring-line">1. Turmas</li>
        <li className="rounded-full bg-surface px-3 py-1 ring-1 ring-line">2. Professores</li>
        <li className="rounded-full bg-surface px-3 py-1 ring-1 ring-line">3. Matérias de cada turma (com o professor)</li>
        <li className="rounded-full bg-surface px-3 py-1 ring-1 ring-line">4. Alunos e responsáveis</li>
      </ol>

      <datalist id="subjects">
        {subjects.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
      <datalist id="parents">
        {parents.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>

      <Tabs
        label="Cadastros"
        tabs={[
          {
            id: "turmas",
            label: "Turmas",
            icon: <School size={16} aria-hidden />,
            badge: count(classrooms.length),
            content: (
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
                <Card className="lg:col-span-2">
                  <CardTitle icon={<School size={20} className="text-brand" aria-hidden />}>Turmas cadastradas</CardTitle>
                  {classrooms.length === 0 ? (
                    <p className="text-sm text-muted">Nenhuma turma ainda. Comece por aqui.</p>
                  ) : (
                    <ul tabIndex={0} aria-label="Turmas cadastradas" className={`${scrollList} divide-y divide-line text-sm`}>
                      {classrooms.map((c) => {
                        const teacherNames = [...new Set(c.classSubjects.map((cs) => cs.teacher.name))];
                        return (
                          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <span>
                              <strong className="text-ink">{c.name}</strong>
                              <span className="text-muted"> · {BUILDING_INFO[c.buildingType as keyof typeof BUILDING_INFO]?.label}</span>
                              <span className="block text-xs text-muted">
                                {teacherNames.length ? teacherNames.join(", ") : "Sem professores — atribua matérias na aba Matérias"}
                              </span>
                            </span>
                            <span className="flex gap-1">
                              <Badge tone="brand">{pluralize(c.students.length, "aluno", "alunos")}</Badge>
                              <Badge tone="sky">{pluralize(c.classSubjects.length, "matéria", "matérias")}</Badge>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            ),
          },
          {
            id: "professores",
            label: "Professores",
            icon: <UserPlus size={16} aria-hidden />,
            badge: count(teachers.length),
            content: (
              <div className="grid gap-5 lg:grid-cols-3">
                <Card>
                  <CardTitle icon={<UserPlus size={20} className="text-brand" aria-hidden />}>Novo professor</CardTitle>
                  <ActionForm action={createTeacher} submitLabel="Cadastrar professor">
                    <Field label="Nome">
                      <TextInput name="name" placeholder="Ex.: Prof. Rafael" required />
                    </Field>
                    <p className="text-xs text-muted">
                      Depois, na aba <strong>Matérias</strong>, atribua as matérias que ele dá — um professor pode ter
                      várias turmas.
                    </p>
                  </ActionForm>
                </Card>
                <Card className="lg:col-span-2">
                  <CardTitle icon={<Users size={20} className="text-brand" aria-hidden />}>Professores cadastrados</CardTitle>
                  {teachers.length === 0 ? (
                    <p className="text-sm text-muted">Nenhum professor ainda.</p>
                  ) : (
                    <ul tabIndex={0} aria-label="Professores cadastrados" className={`${scrollList} divide-y divide-line text-sm`}>
                      {teachers.map((t) => {
                        const byClass = new Map<string, string[]>();
                        for (const a of t.teaching)
                          byClass.set(a.classroom.name, [...(byClass.get(a.classroom.name) ?? []), a.subject.name]);
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
                  )}
                </Card>
              </div>
            ),
          },
          {
            id: "materias",
            label: "Matérias",
            icon: <BookOpen size={16} aria-hidden />,
            badge: count(subjectCount),
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Cada matéria da turma tem um professor. Os alunos da turma cursam todas as matérias dela. Depois,
                  monte os horários em <strong>Grade horária</strong>.
                </p>
                {classrooms.length === 0 ? (
                  <p className="text-sm text-muted">Cadastre uma turma primeiro.</p>
                ) : (
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
                )}
              </div>
            ),
          },
          {
            id: "alunos",
            label: "Alunos",
            icon: <GraduationCap size={16} aria-hidden />,
            badge: count(studentCount),
            content: (
              <div className="grid gap-5 lg:grid-cols-3">
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
                    </ActionForm>
                  )}
                </Card>
                <Card className="lg:col-span-2">
                  <CardTitle icon={<Users size={20} className="text-brand" aria-hidden />}>Alunos por turma</CardTitle>
                  <div tabIndex={0} aria-label="Alunos por turma" className={`${scrollList} space-y-4 text-sm`}>
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
            ),
          },
        ]}
      />
    </div>
  );
}
