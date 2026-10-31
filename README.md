# Escola dos Sonhos (Dreams School)

Plataforma gamificada para o ensino básico que conecta **Alunos, Professores, Pais e Gestores**.
Cada aluno cuida de um **pet** que evolui com XP, e cada turma constrói junta a sua **construção coletiva**
(Casa na Árvore, Castelo, Estação Espacial ou Observatório) com tijolinhos. Ninguém perde progresso:
um deslize vira um **Ponto de Atenção** com uma Missão de Cuidado para o pet e um Reparo para a turma.

As regras completas estão em [`AGENTS.md`](AGENTS.md). Os prompts usados no desenvolvimento ficam em [`prompts/`](prompts/README.md).

## Como rodar

Requisitos: Node.js 20+.

```bash
npm install
# crie um .env com DATABASE_URL="file:./dev.db" (e, opcionalmente, FEATHERLESS_API_KEY, FEATHERLESS_MODEL, FEATHERLESS_MENTOR_MODEL, FEATHERLESS_MENTOR_FALLBACK_MODEL e DEMO_TODAY)
npm run db:setup              # cria o banco SQLite e carrega os dados de demonstração
npm run dev                   # http://localhost:3000
```

Para testar um build de produção sem disputar a pasta `.next` com o `npm run dev`: `NEXT_DIST_DIR=.next-test npm run build` e `NEXT_DIST_DIR=.next-test npx next start -p 3100`.

Para voltar aos dados iniciais da demo: `npm run db:reset` (**apaga tudo** o que foi criado no banco e recarrega o seed).

O seed é de **apresentação** e as datas são relativas ao "hoje" da aplicação: rode-o com o mesmo `DEMO_TODAY` que vai usar na apresentação (ex.: deixe `DEMO_TODAY="2026-11-03"` no `.env` e rode `npm run db:reset`). Ele cria 4 turmas, 4 professores, 17 alunos, 4 responsáveis e a gestora, com duas semanas de histórico (conquistas, pontos de atenção, chamadas, notas, avaliações das aulas), aulas com o pet, recados e conversas.

Sem `FEATHERLESS_API_KEY`, o humanizador de recados e o resumo das avaliações usam um texto modelo, então a demo funciona offline.

A ofensiva de avaliações depende das aulas do dia. Para apresentar num fim de semana, defina um dia letivo no `.env`, por exemplo `DEMO_TODAY="2026-11-03"` (uma terça-feira; 02/11 é feriado de Finados no calendário), e reinicie o servidor.

## Roteiro de demonstração

### Estados prontos no seed

| Quem | O que mostrar |
| --- | --- |
| **Lia Fernandes Costa** (aluna, 4º Ano A) | Pet Guardião (Sábia), ofensiva longa e só **metade das aulas de hoje avaliadas** — avalie o resto ao vivo e veja a ofensiva subir. **Caderno de estudos** com 3 páginas (Fotossíntese e Frações com correções do pet, Ciclo da água) e anotações dela. |
| **João Pedro Almeida** (aluno, 4º Ano A) | Pet **precisando de cuidado** com Missão de Cuidado ativa, faltas na chamada, notas mais baixas, página do caderno "Tabuada do 7" (o pet corrigiu 7 × 8). |
| **Sofia Ribeiro Lima** (aluna, 5º Ano B) | **Aula com o pet em andamento** ("Sistema solar"): ao abrir *Ensinar o pet* aparece o histórico da conversa, com o pet tirando a dúvida "o Sol gira em volta da Terra". |
| **Beatriz, Miguel, Valentina** | Ofensivas curtas (3, 2 e 5 dias); Miguel tem a página "Classificação dos animais". |
| **Pedro Henrique Souza** | Histórico com ponto de atenção **superado** (Missão de Cuidado concluída). |
| **Prof.ª Marina Lopes** | 4º Ano A com **Reparo da Turma** pendente; resumo com IA das avaliações já gerado; mensagem **não lida** da Cláudia. |
| **Prof. Carlos Mendes** | Conversa nova da Patrícia (mãe da Sofia) esperando resposta. |
| **Cláudia Almeida** (mãe do João) | Recados humanizados e conversa com a Prof.ª Marina. |
| **Roberto Fernandes** (pai da Lia) | Resposta **não lida** da gestora sobre a reunião de pais. |
| **Marcos Oliveira** | Dois filhos em turmas diferentes (Miguel e Ana Clara): seletor de filhos. |
| **Ana Paula Moreira** (gestora) | Ranking: 5º Ano B (Base Espacial no nível máximo) lidera o geral e o 3º Ano C lidera a semana. |

### Passo a passo

1. Em **Professor**, escolha "Prof.ª Marina Lopes" (4º Ano A) no seletor do topo. Dê uma ação positiva a um aluno e veja o XP e os tijolinhos subirem.
2. Registre um **Ponto de Atenção**: o pet fica "precisando de cuidado", ganha uma missão, e o castelo pede um reparo (a sequência pausa).
3. Dê uma nova ação positiva ao mesmo aluno: missão concluída, bônus de superação e o reparo é pago antes dos tijolinhos.
4. Escreva uma nota rápida em **Recado para a família** e clique em **Humanizar com IA**.
5. Troque para **Pais** e veja o recado e a jornada do filho.
6. Como **Aluno**, avalie a aula; volte ao Professor e gere o **resumo com IA**.
7. Como **Gestor**, veja o engajamento de todas as turmas.
8. Veja o **Ranking das turmas** (aba Ranking do aluno, aba Turma do professor, Pet e turma dos pais e visão geral do gestor), no total ou só na semana.
9. Em **Gestor → Cadastros**, crie uma turma, um professor e um aluno, e atribua matérias à turma (um professor pode estar em várias turmas).
10. Em **Gestor → Grade horária**, monte a semana da nova turma. Tente colocar a Prof.ª Marina na segunda às 07:30: o conflito com o 4º Ano A é bloqueado.
11. Veja a grade em cada perfil: Aluno e Pais (grade da turma) e Professor (grade de todas as turmas dele).
12. Como **Aluno** (Lia Fernandes Costa), abra **Avaliar aulas**: aparecem as aulas de hoje e de ontem, por matéria. A ofensiva só sobe ao avaliar **todas** as aulas do dia (e o pet ganha +3 XP). Na aba **Calendário**, os dias completos aparecem com uma chama; feriados e recessos não alteram a ofensiva. Como **Professor**, a aba **Avaliações** mostra o resumo com IA e as avaliações individuais anônimas.
13. Como **Pais**, use a aba **Mensagens** para escrever a um professor ou à gestão; como **Professor** (aba Mensagens) ou **Gestor** (Mensagens), responda. Como **Aluno**, veja o pet lembrando dos cadernos do dia em **Meu mundo**.
14. Como **Professor**, use as abas **Chamada** (presença por matéria e dia) e **Notas** (crie uma avaliação e lance as notas). Veja o resultado no **Boletim** do Aluno e dos Pais.
15. Como **Aluno**, abra **Ensinar o pet**, escolha um tema (ex.: Fotossíntese) e explique escrevendo ou pelo **microfone** (Chrome/Edge) — de propósito, cometa um erro ("a planta come terra"). O pet tira a dúvida com gentileza e traz a informação correta. Depois de 3 explicações, termine a aula: o pet resume o que aprendeu, ganha +5 XP e a aula vira uma página do **caderno de estudos** do aluno com o pet (logo abaixo), onde o aluno também escreve a própria anotação.

Para trocar as ilustrações das construções, edite as imagens de referência e rode `powershell -ExecutionPolicy Bypass -File scripts/art/cutout.ps1` (Windows).

A barra de **Acessibilidade** no topo oferece alto contraste, fonte para dislexia e ajuste do tamanho da letra.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Lucide · Prisma 6 + SQLite · OpenAI SDK apontando para a Featherless (`Qwen/Qwen2.5-7B-Instruct`).

| Pasta | Conteúdo |
|---|---|
| `src/lib/game.ts` | Regras puras de pontos, níveis, manutenção e sequência (testadas em `game.test.ts`) |
| `src/lib/actions.ts` | Server actions que aplicam as regras no banco |
| `src/lib/feedback-rules.ts` | Prazo de avaliação e ofensiva por dias completos (testado em `feedback-rules.test.ts`) |
| `src/lib/calendar.ts` | Calendário letivo: dias letivos, feriados, recessos e dia letivo anterior (testado em `calendar.test.ts`) |
| `src/lib/teacher-actions.ts` | Chamada e notas lançadas pelo professor |
| `src/lib/feedback-data.ts` | Professores a avaliar no dia e estado da ofensiva |
| `src/lib/clock.ts` | "Hoje" da aplicação (respeita `DEMO_TODAY`) |
| `src/lib/schedule.ts` | Regras da grade horária: horários e conflitos de turma/professor (testadas em `schedule.test.ts`) |
| `src/lib/manager-actions.ts` | Cadastros do gestor e edição da grade |
| `src/lib/ai.ts` | Cliente da Featherless (limite de 15 s, streaming), humanizador para pais e resumo para o professor |
| `src/lib/mentor.ts` | Prompts e regras do "Ensinar o pet" (testados em `mentor.test.ts`) |
| `src/components/shared/` | RoleSwitcher, AccessibilityBar, Tabs, WorldScene (cenário do pet e da construção), PetArt (pets em SVG), Decor (nuvens e brilhos), ReportCard (boletim), ScheduleGrid, formulários, histórico e UI |
| `src/app/{student,teacher,parent,manager}` | Telas de cada perfil (`manager/cadastros` e `manager/grade` para o gestor) |
| `prisma/` | Schema, migração e seed |
| `public/art/` | Ilustrações das construções e da tela inicial (recortadas das referências) |
| `scripts/art/` | Script que recorta as referências JPEG em PNGs transparentes |
| `scripts/eval/` | Avaliação dos modelos na mentoria (resultado em `docs/avaliacao-modelo-mentoria.md`) |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes das regras do jogo |
| `npm run lint` | ESLint |
| `npm run db:setup` / `npm run db:reset` | Cria o banco / volta aos dados iniciais da demo |
