# 015 — Ranking entre as turmas

**Data:** 2026-10-31

## Prompt
> implemente um ranking entre as turmas, mostrando a posição e pontuação de cada turma

## O que foi feito
- **Pontuação:** os tijolinhos da construção coletiva — o placar natural da turma, que só cresce e vem das conquistas de todos os alunos. Dois recortes: **Geral** (acumulados) e **Esta semana** (tijolinhos ganhos nos últimos 7 dias, pelos eventos), para turmas novas ou que estão atrás também poderem aparecer no topo.
- **Posição:** empates dividem a posição (1º, 2º, 2º, 4º); cálculo de quanto falta para alcançar a turma de cima (`rankClassrooms` em `src/lib/ranking.ts`, com testes).
- **Componente `ClassRanking`:** pódio com a arte da construção de cada turma e medalhas em tons suaves, lista completa com barra e pontuação, seletor Geral/Esta semana e destaque da turma de quem está vendo ("A 5º Ano B está em 2º lugar — faltam 85 tijolinhos para subir de posição").
- **Onde aparece:** aba **Ranking** do aluno; aba Turma do professor (destacando a turma selecionada); Pet e turma dos pais (destacando a turma do filho); visão geral do gestor.
- 2 testes novos (40 no total). Conferido no navegador; o ranking só lê dados.
