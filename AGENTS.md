# CONVENTIONS.md - Dreams School (Escola dos Sonhos)

## 1. Visão Geral e Regras de Negócio
Plataforma web gamificada para o ensino básico conectando Alunos, Professores, Pais e Gestores.

### A. Construção Coletiva da Turma (Customizável)
- Cada turma escolhe seu **Tema de Construção** (`buildingType`):
  1. `TREEHOUSE` (Casa na Árvore): Primeiras Tábuas -> Cabana de Madeira -> Mansão na Copa.
  2. `CASTLE` (Castelo): Primeira Muralha -> Forte de Pedra -> Castelo Real.
  3. `SPACE_BASE` (Estação Espacial): Plataforma de Lançamento -> Foguete em Montagem -> Foguete Estelar.
  4. `OBSERVATORY` (Observatório): Fundação -> Cúpula em Obras -> Observatório Estelar.
- **Ranking das turmas:** a pontuação de cada turma são os tijolinhos — **Geral** (acumulados) e **Esta semana** (ganhos nos últimos 7 dias). Empates dividem a posição. Pódio com a arte da construção de cada turma e lista completa; a turma de quem está vendo fica destacada com quantos tijolinhos faltam para subir (`src/lib/ranking.ts`). Aparece na aba **Ranking** do aluno, na aba Turma do professor, em Pet e turma dos pais e na visão geral do gestor.
- **Progresso por Tijolinhos (`bricks`):** Os tijolinhos acumulados nunca diminuem.
  - Nível 1: 0–99 tijolinhos | Nível 2: 100–299 tijolinhos | Nível 3: 300+ tijolinhos.

### B. Evolução Individual (Pet do Aluno)
- Cada aluno possui um **Pet** (`petType`, `petName`, `xp`, `mood`). Espécies: `CAT`, `OWL`, `BEAR`, `BUNNY`, `FOX`, `DOG`, `DRAGON`.
- O XP do Pet nunca diminui.
  - Nível 1: 0–49 XP (Filhote) | Nível 2: 50–149 XP (Jovem) | Nível 3: 150+ XP (Guardião).

### C. Sistema de Pontuação Positiva e Consequências Pedagógicas (Sem Perda de Progresso)
- **Ações Positivas (Tarefa concluída / Colaboração / Bom comportamento):**
  - Aluno ganha `+10 XP` e o Pet fica no estado `HAPPY` (Radiante).
  - Turma ganha `+10 Tijolinhos` para a construção escolhida.
  - Se a construção estiver em manutenção (`maintenanceNeeded > 0`), os tijolinhos limpam a manutenção primeiro antes de somar no nível.
- **Pontos de Atenção / Ocorrências (Interrupção de aula / Tarefa não entregue):**
  - **Zero perda de XP ou Tijolinhos já ganhos.**
  - **Impacto Individual:** O Pet muda o humor para `TIRED` (Precisando de Cuidado/Energia) e ganha uma "Missão de Recuperação" (ex: entregar a próxima tarefa restaura o humor e dá um bônus de superação).
  - **Impacto Coletivo:** A construção da turma recebe `maintenanceNeeded` (+5 pontos de reparo/arrumação necessários, como "Arrumar o jardim do Castelo" ou "Consertar antena da Base") e pausa o bônus de sequência (Streak) da turma até ser reparada em equipe.
  - **Histórico:** Registra tanto conquistas quanto pontos de atenção + superações.

### D. IA Integrada (Featherless API)
- **Humanizador para os Pais:** O professor escreve uma nota curta/rápida (ex: "João conversou muito e não fez o dever") e a IA reescreve de forma empática, construtiva e pedagógica para os pais.
- **Resumo para o Professor:** Os alunos avaliam a aula (1 a 3 estrelas + comentário opcional) e a IA gera um resumo executivo para o professor ajustar sua didática.

### E. Cadastros e Grade Horária
- **Gestor** cadastra turmas (nome + tema da construção), professores e alunos (turma, pet e responsável opcional — reaproveita um responsável existente pelo nome ou cria um novo).
- **Matérias da turma (`ClassSubject`):** cada turma tem várias matérias, cada uma com um professor. Os alunos cursam todas as matérias da sua turma. Um professor pode dar aula em várias turmas (as turmas dele são as turmas onde tem matéria).
- **Grade horária (`ScheduleSlot`):** o gestor monta a semana de cada turma (dia, início e fim em `HH:MM`). São bloqueadas aulas sobrepostas na mesma turma e professor em duas turmas no mesmo horário (regras em `src/lib/schedule.ts`).
- **Todos veem sua grade:** aluno e pais veem a grade da turma; o professor vê a grade consolidada de todas as suas turmas; o gestor edita a de cada turma.

### F. Vida Escolar: Chamada, Notas, Boletim e Ofensiva de Avaliações
- **Chamada:** o professor lança presença por matéria e dia (`Presente`, `Atraso`, `Falta`). Atraso conta como presença na frequência.
- **Notas:** o professor cria avaliações por matéria (nome, data, nota máxima) e lança as notas; a média é normalizada para 0–10.
- **Boletim:** aluno e pais veem média e frequência de cada matéria. Média abaixo de 6 e frequência abaixo de 75% aparecem em âmbar (nunca vermelho).
- **Avaliação das aulas (por matéria):** o aluno avalia cada aula — uma matéria numa data — com 1 a 3 estrelas + comentário opcional, uma vez por aula. Prazo: **no dia da aula ou no dia seguinte** (`FEEDBACK_WINDOW_DAYS` em `src/lib/feedback-rules.ts`). O professor vê o **resumo com IA** e as **avaliações individuais anônimas** (estrelas, comentário, matéria e data da aula; sem aluno, sem id e sem horário de envio, em ordem embaralhada).
- **Ofensiva de avaliações:** conta os **dias letivos completos seguidos** — um dia fica completo quando **todas as aulas dele** foram avaliadas, e só então a ofensiva sobe e o pet ganha `+3 XP` (não gera tijolinhos). **Dias sem aula não alteram a ofensiva** (fim de semana, feriado, recesso, fora do período letivo), e um dia ainda dentro do prazo de avaliação não a quebra. Ela é calculada a partir das avaliações (`computeFeedbackStreak`), não guardada no pet.
- **Nomes completos:** alunos são cadastrados com nome e sobrenome; as saudações usam o primeiro nome.
- **Navegação por abas** nas telas de Aluno, Professor e Pais; pet e construção ficam em destaque num cenário lúdico.
- `DEMO_TODAY=YYYY-MM-DD` no `.env` fixa o "hoje" da aplicação (útil para apresentar a ofensiva num fim de semana; escolha um dia letivo, ex.: `2026-11-03`).

### I. Calendário Letivo
- A escola tem um **período letivo** (`School.termStart`/`termEnd`) e **dias especiais** (`CalendarDay`): `HOLIDAY` (feriado) e `RECESS` (recesso) não têm aula; `EVENT` (evento) é dia letivo.
- **Dia letivo** = dentro do período, não é feriado/recesso e cai num dia da semana com aula na grade da turma (regras em `src/lib/calendar.ts`).
- O **gestor** edita em Gestor → Calendário letivo (período, marcar um dia ou um intervalo, remover). Aluno, pais e professor têm a aba **Calendário**; para aluno e pais, os dias da ofensiva aparecem com uma chama.
- O ano de 2026 (feriados nacionais, Carnaval, recesso de julho, Dia do Professor) fica em `prisma/calendar-2026.ts`, usado pelo seed.
- O seed (`prisma/seed.ts`) é o roteiro da apresentação: datas relativas ao "hoje" da aplicação (respeita `DEMO_TODAY`), só em dias letivos. Ao criar uma feature nova, acrescente dados que a mostrem no seed e na tabela "Estados prontos no seed" do README.

### G. Ensinar o Pet (Aluno Mentor com IA)
- Na aba **Ensinar o pet**, o aluno escolhe a matéria e um tema da aula e explica com as próprias palavras. A aula abre na hora com uma fala do pet gerada pela IA: uma pergunta específica sobre o tema e um convite para o aluno contar o que já sabe ou o que acha difícil. O pet é um **aprendiz curioso**: responde em até 3 frases simples, comemora acertos com uma pergunta que aprofunda o tema e, quando há um erro, mostra a dúvida com gentileza, diz a informação correta e pede para o aluno conferir. Nunca inventa fatos e volta ao tema se a conversa fugir dele.
- Ao **terminar a aula**, o pet conta o que aprendeu (corrigindo o que ficou errado) e dá uma dica de revisão. Com pelo menos **3 explicações**, a aula vale **+5 XP** para o pet, uma vez por dia (evento "Mentoria").
- **Caderno de estudos com o pet:** cada aula terminada vira uma página do caderno "{Aluno} & {Pet}" (capa no topo da aba e caderno completo abaixo): "O que aprendemos juntos", "Cuidado! A gente tinha confundido" (erros da conversa e o jeito certo), "Pergunta para revisar", o recadinho do pet e "Minha anotação" (escrita pelo aluno). Índice por matéria e botão "Revisar com o pet" (nova aula no mesmo tema). A página é gerada pela IA junto com o resumo, só com fatos corretos (`notebookMessages`/`parseNotebookNotes` em `src/lib/mentor.ts`); papel pautado e letra de mão (Patrick Hand; no modo dislexia volta à fonte legível).
- As conversas ficam salvas (`MentorSession`, `MentorMessage`); as respostas do pet chegam em streaming pela rota `/api/mentor/[sessionId]`. Prompts e regras em `src/lib/mentor.ts`.
- **Explicação por voz ou texto:** o botão "Falar" (vira "Parar" enquanto ouve) usa o ditado do navegador (Web Speech API, pt-BR; Chrome, Edge e Safari). O texto aparece enquanto o aluno fala e ele pode revisar antes de enviar; mensagens faladas ficam marcadas (`viaAudio`) e o pet ignora erros de transcrição. No Chrome/Edge o áudio é transcrito por um serviço online do navegador.
- **Modelo:** a mentoria usa `deepseek-ai/DeepSeek-V3-0324` (`FEATHERLESS_MENTOR_MODEL`), com reserva automática `Qwen/Qwen2.5-32B-Instruct` (`FEATHERLESS_MENTOR_FALLBACK_MODEL`), escolhidos na avaliação de `docs/avaliacao-modelo-mentoria.md`; o restante segue no 7B. O modelo é aquecido quando a aula começa e tem limite de 30 s. A fala do pet passa por um filtro que remove ações entre asteriscos e emojis e corta respostas degeneradas ("!!!!!!…").

### H. Chamadas de IA
- Toda chamada à Featherless tem limite de **15 s** (30 s na mentoria; 1 nova tentativa); se estourar ou falhar, a tela usa um texto alternativo e avisa. O tempo de cada chamada aparece no log do servidor (`[ai] ...`). O modelo pode ser trocado com `FEATHERLESS_MODEL`.

### J. Mensagens, Lembrete dos Cadernos e Cadastros
- **Mensagens:** o responsável escreve para os professores dos filhos ou para a gestão (aba **Mensagens** dos Pais), opcionalmente sobre um filho; professor (aba **Mensagens**) e gestor (Gestor → Mensagens) respondem. Conversas e mensagens em `Conversation`/`ConversationMessage`; a conversa só conta como lida quando a pessoa a abre (o número de não lidas aparece na aba).
- **Lembrete dos cadernos:** na aba **Meu mundo**, o pet lembra o aluno de conferir os cadernos das aulas de hoje (ou do próximo dia letivo), com uma lista marcável guardada no navegador.
- **Cadastros do gestor em abas:** Turmas → Professores → Matérias → Alunos, cada uma com o formulário ao lado da lista.
- **Caixas longas têm rolagem** (ex.: Aulas anteriores, Últimos registros, Chamada, Recados dos pais, listas de cadastro, conversas), com foco pelo teclado.

## 2. Stack Tecnológica (MVP Hackathon)
- **Framework:** Next.js 14+ (App Router) com TypeScript + Tailwind CSS + Lucide Icons.
- **Banco de Dados:** SQLite local com Prisma ORM (`prisma/schema.prisma`).
- **Autenticação Simplificada (Demo Mode):** Seletor global no topo (`RoleSwitcher`) que alterna instantaneamente entre Aluno, Professor, Pais e Gestor.
- **Integração de IA no App:** SDK `openai` apontando para `https://api.featherless.ai/v1` usando `Qwen/Qwen2.5-7B-Instruct`.

## 3. Organização do Projeto
- Desenvolvimento feito por um único desenvolvedor (com Claude Code); não há divisão de pastas entre devs.
- **Registro de prompts:** todo prompt de desenvolvimento é salvo em `prompts/NNN-titulo.md` (data, prompt na íntegra, resumo do que foi feito) e indexado em `prompts/README.md`.

## 4. Padrões de Interface e Acessibilidade
- **Estilo visual infantil e pastel**, a partir das ilustrações de referência (`construcoes1.jpeg`, `contrucoes2.jpeg`, `rostos.jpeg`, `telainicial.jpeg`): fundo creme, lavanda e tons dessaturados, construções em ilhas de nuvem, enfeites de nuvens e brilhos. Não usar emojis como ilustração.
  - Construções: `public/art/buildings/<tema>-<nível>.png`, recortadas das referências com `scripts/art/cutout.ps1` (posições em `scripts/art/jobs.json`).
  - Pets: SVG em `src/components/shared/PetArt.tsx` (rosto plano, manchinhas claras nos olhos, acessório na cabeça; expressão muda com o humor).
- Barra de Acessibilidade fixa (Alto Contraste, Tamanho de Fonte, Fonte amigável para dislexia).
- Feedbacks visuais acolhedores: nunca usar cor vermelha agressiva ou palavras como "Punição/Castigo" na tela do aluno; usar termos como **"Missão de Cuidado"**, **"Reparo da Turma"** e **"Ponto de Atenção"** (na cor âmbar/laranja).