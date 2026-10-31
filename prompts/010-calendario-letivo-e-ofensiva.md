# 010 — Calendário letivo e ofensiva imediata

**Data:** 2026-10-31

## Prompt
> acrescente um calendario com os dias letivos, e lembre-se de que a ofensiva não se altera em dias em que não há aulas. Quando um aluno avaliar seus professores já aumente a sua ofensiva de avaliação

## O que foi feito
- **Calendário letivo:** período letivo da escola (`School.termStart`/`termEnd`) e dias especiais (`CalendarDay`: feriado, recesso ou evento). Dia letivo = dentro do período, sem feriado/recesso e com aula na grade naquele dia da semana (`src/lib/calendar.ts`, com testes).
  - **Gestor → Calendário letivo** (`/manager/calendario`): define o período, marca um dia ou um intervalo (ex.: recesso de julho) e remove; dias seguidos com o mesmo nome aparecem agrupados.
  - Aba **Calendário** para Aluno, Pais e Professor (`SchoolCalendar`): mês a mês, com dias letivos, feriados, recessos, eventos, hoje, a contagem de dias letivos do mês e quantos faltam no período. Para aluno e pais, os dias da ofensiva aparecem com uma chama.
  - Ano de 2026 em `prisma/calendar-2026.ts` (feriados nacionais, Carnaval, recesso de julho, Dia do Professor, Feira de Ciências) usado pelo seed; também acrescentado à escola do banco do usuário, que não tinha calendário (nada foi apagado).
- **Ofensiva só muda em dia letivo:** o "dia anterior" agora é o dia letivo anterior pelo calendário (pula fim de semana, feriado e recesso). Em dia sem aula, o aluno pode avaliar, mas a ofensiva não sobe nem quebra, e a tela explica o motivo (ex.: "feriado: Finados").
- **Ofensiva sobe na hora:** a primeira avaliação de cada dia letivo já aumenta a ofensiva. O bônus de +3 XP continua para quem avalia todos os professores do dia (novo campo `Pet.feedbackBonusDay`).
- Migração `calendario_letivo`. Testes: 35 (novos para calendário e para a nova regra da ofensiva).
- Testado no navegador: em 02/11 (Finados) a ofensiva da Lia ficou em 10 mesmo avaliando; em 03/11 subiu para 11 na primeira avaliação. Os dados do teste foram desfeitos.
- `NEXT_DIST_DIR` em `next.config.ts`: o build de teste vai para `.next-test` e não disputa a pasta `.next` com o `npm run dev` do usuário (que tinha sobrescrito o build de teste).
