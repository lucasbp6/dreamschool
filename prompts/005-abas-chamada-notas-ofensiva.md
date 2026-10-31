# 005 — Abas, nomes completos, avaliação por professor, chamada, notas e ofensiva

**Data:** 2026-10-31

## Prompt
> acrescente para os alunos, professores e pais abas, para facilitar a visualização sem precisar de descer até o fundo da pagina. acrescente os alunos com nomes completos, para melhor identificação. corrija a parte do aluno avaliar o professor, de modo que ele possa escolher o professor especifico que esta sendo avaliado. deixe a tela dos pets e cosntruções com maior destaque, para deixar mais ludico. acrescente também a funcionalidade de chamada e nota para o professor lançar. junto com feedback, acrecente como se fosse uma ofensiva por avaliar todos os professores todos os dias, gerando algum bonus pequeno de xp apenas para o pet individual

## O que foi feito
- **Abas** (`Tabs`, acessível por teclado, aba ativa no `#hash`):
  - Aluno: Meu mundo · Avaliar aulas · Boletim · Grade · Jornada.
  - Professor: Turma · Chamada · Notas · Grade · Recados · Avaliações (a aba se mantém ao trocar de turma).
  - Pais: Pet e turma · Boletim · Grade · Recados · Histórico (com seletor quando há mais de um filho).
- **Nomes completos** dos alunos e responsáveis no seed; cadastro exige nome e sobrenome; saudações usam o primeiro nome.
- **Avaliação por professor:** o aluno escolhe o professor (cards com "Aula hoje" / "Avaliado hoje"); uma avaliação por professor por dia. Resumo com IA e médias agora são por professor.
- **Ofensiva de avaliações:** avaliar todos os professores com aula no dia dá +3 XP só para o pet; fim de semana não quebra; pular dia letivo recomeça em 1. Evento "Ofensiva" no histórico.
- **Cenário lúdico** (`WorldScene`): céu com nuvens animadas, sol, grama, pet grande com balão de fala por humor, construção grande com placar de tijolinhos e os pets da turma passeando no jardim.
- **Chamada** (`AttendanceSheet`) e **Notas** (`GradeBook`) para o professor; **Boletim** (`ReportCard`) para aluno e pais.
- Schema: `Attendance`, `Assessment`, `Grade`; `LessonFeedback` ganhou `teacherId` e `day`; `FeedbackSummary` ganhou `teacherId`; `Pet` ganhou `feedbackStreak` e `lastFeedbackDay`. Migração `chamada_notas_ofensiva`.
- `DEMO_TODAY` (`src/lib/clock.ts`) para simular um dia letivo na apresentação.
- 11 testes novos (24 no total) para ofensiva, dia letivo anterior, médias e frequência.
- Verificação: tipos, lint, testes e build ok; testado no navegador com `DEMO_TODAY=2026-11-02` (ofensiva 10 → 11 com +3 XP, chamada com falta, notas com validação de 0 a 10, boletim, abas de Pais).
