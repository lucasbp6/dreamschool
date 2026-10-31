# 016 — Seed pronto para apresentação

**Data:** 2026-10-31

## Prompt
> agora eu preciso que voce altere a seed, e a deixe pronta pra uma apresentação, preciso que seja possível mostrar os estados, histórico de conversas, sessão de explicações com o pet, e as funcionalidades que forma o core da ideia implementada

## O que foi feito
- `prisma/seed.ts` reescrito como seed de apresentação, com datas relativas ao "hoje" da aplicação (respeita `DEMO_TODAY`; usa os dias letivos do calendário).
- 4 turmas com construções em níveis diferentes (4º Ano A com Reparo da Turma pendente; 5º Ano B no nível máximo, líder geral; 3º Ano C líder da semana; 2º Ano D começando).
- 4 professores (Marina, Carlos, Júlia, Rafael) com 2 matérias cada em todas as turmas; grade em "quadrado latino" validada com `validateSlot` (sem conflitos).
- 17 alunos com nomes completos, todos os tipos de pet, níveis e humores variados (João e Manuela precisando de cuidado com Missão de Cuidado; Pedro com missão superada).
- Avaliações das aulas por matéria nas últimas 2 semanas: Lia, Sofia e Davi com ofensiva longa; Beatriz, Miguel e Valentina com ofensivas curtas; Lia com metade das aulas de hoje avaliadas para completar ao vivo. Resumo com IA da Prof.ª Marina já gerado.
- Chamadas (faltas do João, atrasos da Manuela), notas (Prova 1, Trabalho em grupo, Quiz de frações), recados humanizados.
- Aulas com o pet: 3 páginas no caderno da Lia (com correções e anotações dela), João (Tabuada do 7), Miguel (Classificação dos animais) e uma aula em andamento da Sofia (histórico da conversa).
- 4 conversas entre famílias, professores e gestão, com estados de lido/não lido diferentes; Marcos tem dois filhos (seletor de filhos).
- Testado em banco temporário (com e sem `DEMO_TODAY`), conferindo ranking, ofensivas e não lidas; tsc, lint, 40 testes e build isolado ok; páginas dos perfis respondendo 200.
- README: tabela "Estados prontos no seed" e aviso de que `npm run db:reset` apaga os dados atuais.
