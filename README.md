# Escola dos Sonhos (Dreams School)

Plataforma gamificada para o ensino básico que conecta **Alunos, Professores, Pais e Gestores**.
Cada aluno cuida de um **pet** que evolui com XP, e cada turma constrói junta a sua **construção coletiva**
(Casa na Árvore, Castelo, Estação Espacial ou Vila Sustentável) com tijolinhos. Ninguém perde progresso:
um deslize vira um **Ponto de Atenção** com uma Missão de Cuidado para o pet e um Reparo para a turma.

As regras completas estão em [`AGENTS.md`](AGENTS.md). Os prompts usados no desenvolvimento ficam em [`prompts/`](prompts/README.md).

## Como rodar

Requisitos: Node.js 20+.

```bash
npm install
# crie um .env com DATABASE_URL="file:./dev.db" (e, opcionalmente, FEATHERLESS_API_KEY e DEMO_TODAY)
npm run db:setup              # cria o banco SQLite e carrega os dados de demonstração
npm run dev                   # http://localhost:3000
```

Para voltar aos dados iniciais da demo: `npm run db:reset`.

Sem `FEATHERLESS_API_KEY`, o humanizador de recados e o resumo das avaliações usam um texto modelo, então a demo funciona offline.

A ofensiva de avaliações depende das aulas do dia. Para apresentar num fim de semana, defina um dia letivo no `.env`, por exemplo `DEMO_TODAY="2026-11-02"` (uma segunda-feira), e reinicie o servidor.

## Roteiro de demonstração

1. Em **Professor**, escolha "Prof.ª Marina" (4º Ano A) no seletor do topo. Dê uma ação positiva a um aluno e veja o XP e os tijolinhos subirem.
2. Registre um **Ponto de Atenção**: o pet fica "precisando de cuidado", ganha uma missão, e o castelo pede um reparo (a sequência pausa).
3. Dê uma nova ação positiva ao mesmo aluno: missão concluída, bônus de superação e o reparo é pago antes dos tijolinhos.
4. Escreva uma nota rápida em **Recado para a família** e clique em **Humanizar com IA**.
5. Troque para **Pais** e veja o recado e a jornada do filho.
6. Como **Aluno**, avalie a aula; volte ao Professor e gere o **resumo com IA**.
7. Como **Gestor**, veja o engajamento de todas as turmas.
8. Em **Gestor → Cadastros**, crie uma turma, um professor e um aluno, e atribua matérias à turma (um professor pode estar em várias turmas).
9. Em **Gestor → Grade horária**, monte a semana da nova turma. Tente colocar a Prof.ª Marina na segunda às 07:30: o conflito com o 4º Ano A é bloqueado.
10. Veja a grade em cada perfil: Aluno e Pais (grade da turma) e Professor (grade de todas as turmas dele).
11. Como **Aluno** (Lia Fernandes Costa), abra **Avaliar aulas**, escolha cada professor com aula hoje e avalie: ao completar todos, a ofensiva sobe e o pet ganha +3 XP.
12. Como **Professor**, use as abas **Chamada** (presença por matéria e dia) e **Notas** (crie uma avaliação e lance as notas). Veja o resultado no **Boletim** do Aluno e dos Pais.

A barra de **Acessibilidade** no topo oferece alto contraste, fonte para dislexia e ajuste do tamanho da letra.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Lucide · Prisma 6 + SQLite · OpenAI SDK apontando para a Featherless (`Qwen/Qwen2.5-7B-Instruct`).

| Pasta | Conteúdo |
|---|---|
| `src/lib/game.ts` | Regras puras de pontos, níveis, manutenção e sequência (testadas em `game.test.ts`) |
| `src/lib/actions.ts` | Server actions que aplicam as regras no banco |
| `src/lib/teacher-actions.ts` | Chamada e notas lançadas pelo professor |
| `src/lib/feedback-data.ts` | Professores a avaliar no dia e estado da ofensiva |
| `src/lib/clock.ts` | "Hoje" da aplicação (respeita `DEMO_TODAY`) |
| `src/lib/schedule.ts` | Regras da grade horária: horários e conflitos de turma/professor (testadas em `schedule.test.ts`) |
| `src/lib/manager-actions.ts` | Cadastros do gestor e edição da grade |
| `src/lib/ai.ts` | Humanizador para pais e resumo para o professor |
| `src/components/shared/` | RoleSwitcher, AccessibilityBar, Tabs, WorldScene (cenário do pet e da construção), ReportCard (boletim), ScheduleGrid, formulários, histórico e UI |
| `src/app/{student,teacher,parent,manager}` | Telas de cada perfil (`manager/cadastros` e `manager/grade` para o gestor) |
| `prisma/` | Schema, migração e seed |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes das regras do jogo |
| `npm run lint` | ESLint |
| `npm run db:setup` / `npm run db:reset` | Cria o banco / volta aos dados iniciais da demo |
