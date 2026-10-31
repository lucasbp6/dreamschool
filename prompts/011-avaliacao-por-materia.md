# 011 — Avaliação por matéria, prazo de um dia e avaliações anônimas

**Data:** 2026-10-31

## Prompt
> altere o sistema de , para que as avaliações sejam por matéria, e possa ser avaliada em no maximo um dia após a data da aula. a ofensiva deve subir somente quando terminar de avaliar todos os professores do dia. também é importante que além do resumo, seja possivel ver as avaliações individuais de forma anonimizada.

(Entendido como o sistema de avaliação das aulas.)

## O que foi feito
- **Avaliação por matéria:** cada avaliação é de uma aula (matéria numa data), uma vez por aula; o professor fica gravado pela matéria. O aluno vê as aulas de hoje e de ontem agrupadas, com matéria, professor e horário.
- **Prazo de um dia:** dá para avaliar no dia da aula ou no dia seguinte (dia de calendário; ex.: a aula de sexta vale até sábado). Configurável em `FEEDBACK_WINDOW_DAYS`.
- **Ofensiva só ao completar o dia:** um dia letivo fica completo quando todas as aulas dele foram avaliadas; só então a ofensiva sobe e o pet ganha +3 XP. A ofensiva agora é **calculada** a partir das avaliações (`src/lib/feedback-rules.ts`, com testes), o que funciona mesmo quando o aluno completa o dia anterior depois; dias sem aula não alteram e um dia ainda no prazo não quebra. Os campos de ofensiva do pet foram removidos.
- **Avaliações individuais anônimas para o professor:** na aba Avaliações, além do resumo com IA (que agora indica a matéria de cada comentário), uma lista com estrelas, comentário, matéria e data da aula, filtro por matéria e "só com comentário", e a distribuição das estrelas. Do servidor não saem aluno, id (o cuid carrega o horário) nem horário de envio; a ordem dentro de cada dia é embaralhada de forma estável.
- **Migrações:** `avaliacao_por_materia` converte as avaliações antigas (por professor e dia) preservando todas as 106 do banco do usuário — a data da aula vira o dia da avaliação e a matéria é a do mesmo professor na turma com aula naquele dia da semana; `ofensiva_calculada` remove os campos de ofensiva do pet. A primeira versão da migração falhou no SQLite (referência a `lf.day` dentro de `ORDER BY` aninhado); foi marcada como desfeita, corrigida com `LEFT JOIN` e reaplicada, sem perda (havia backup do banco).
- **Efeito no banco do usuário:** como as avaliações antigas eram por professor, os dias antigos não ficam completos pela regra nova e as ofensivas atuais zeraram; o seed recria a demo com ofensivas.
- Testado no navegador (03/11): com 3 de 4 aulas avaliadas a ofensiva ficou em 0 ("Falta 1 aula de hoje…"); na 4ª subiu e deu +3 XP; o professor viu as avaliações anônimas. Dados do teste desfeitos.
