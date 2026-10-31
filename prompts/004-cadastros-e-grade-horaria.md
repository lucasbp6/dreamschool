# 004 — Cadastros do gestor e grade horária

**Data:** 2026-10-31

## Prompt
> faça com que o gestor possa cadastrar turma, professor e aluno, em que um aluno pode ter mais de uma matéria, o professor mais de uma turma  e o gestor possa criar uma grade de horarios para cada turma. acrescente para todos a sua respectiva grade horaria

## O que foi feito
- **Modelo de dados** (migração `grade_horaria`): novos `Subject` (catálogo de matérias), `ClassSubject` (matéria da turma + professor) e `ScheduleSlot` (aula: dia, início, fim). Removido o professor único da turma (`Classroom.teacherId`): agora um professor tem várias turmas via matérias.
- **Regras da grade** em `src/lib/schedule.ts`: valida dia/horário e bloqueia sobreposição na mesma turma e professor em duas turmas ao mesmo tempo. 5 testes novos (13 no total).
- **Gestor** (`src/lib/manager-actions.ts`, `/manager/cadastros`, `/manager/grade`): cadastro de turma, professor e aluno (com pet e responsável), atribuição de matérias por turma, montagem e remoção de aulas da grade. Trocar o professor de uma matéria também checa conflitos na agenda dele.
- **Grade para todos** com o componente `ScheduleGrid` (destaca o dia de hoje e dá uma cor fixa a cada matéria): Aluno, Pais (grade da turma), Professor (grade de todas as turmas) e Gestor.
- **Professor**: seletor das suas turmas e as matérias que dá em cada uma.
- Seed: 3 professores (nova Prof.ª Júlia), 6 matérias e grades completas sem conflitos nas duas turmas.
- Docs: `AGENTS.md` (seção 1.E) e `README.md` (roteiro de demo).
- Verificação: testes, tipos, lint e build sem erros; testado no navegador (cadastros, atribuição de matérias, conflito bloqueado na grade, grades de Professor, Aluno e Pais). Banco de demo resetado ao final.
- Obs.: `prisma migrate dev` não roda em terminal não interativo; a migração foi gerada com `prisma migrate diff` e aplicada com `prisma migrate deploy`.
