# CONVENTIONS.md - Dreams School (Escola dos Sonhos)

## 1. Visão Geral e Regras de Negócio
Plataforma web gamificada para o ensino básico conectando Alunos, Professores, Pais e Gestores.

### A. Construção Coletiva da Turma (Customizável)
- Cada turma escolhe seu **Tema de Construção** (`buildingType`):
  1. `TREEHOUSE` (Casa na Árvore): Primeiras Tábuas -> Cabana de Madeira -> Mansão na Copa.
  2. `CASTLE` (Castelo): Primeira Muralha -> Forte de Pedra -> Castelo Real.
  3. `SPACE_BASE` (Estação Espacial): Plataforma de Lançamento -> Foguete em Montagem -> Foguete Estelar.
  4. `OBSERVATORY` (Observatório): Fundação -> Cúpula em Obras -> Observatório Estelar.
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
- **Avaliação de professores:** o aluno escolhe o professor específico e dá 1 a 3 estrelas + comentário opcional — uma avaliação por professor por dia. O resumo com IA é por professor e turma.
- **Ofensiva de avaliações:** avaliar **todos os professores que deram aula no dia** (pela grade) fecha o dia: `+3 XP` só para o pet (não gera tijolinhos). Dias sem aula (fim de semana) não quebram a ofensiva; pular um dia letivo a recomeça em 1, sem perder XP.
- **Nomes completos:** alunos são cadastrados com nome e sobrenome; as saudações usam o primeiro nome.
- **Navegação por abas** nas telas de Aluno, Professor e Pais; pet e construção ficam em destaque num cenário lúdico.
- `DEMO_TODAY=YYYY-MM-DD` no `.env` fixa o "hoje" da aplicação (útil para apresentar a ofensiva num fim de semana).

### G. Ensinar o Pet (Aluno Mentor com IA)
- Na aba **Ensinar o pet**, o aluno escolhe a matéria e um tema da aula e explica com as próprias palavras. O pet é um **aprendiz curioso**: responde em até 3 frases simples, comemora acertos com uma pergunta que aprofunda o tema e, quando há um erro, mostra a dúvida com gentileza, diz a informação correta e pede para o aluno conferir. Nunca inventa fatos e volta ao tema se a conversa fugir dele.
- Ao **terminar a aula**, o pet conta o que aprendeu (corrigindo o que ficou errado) e dá uma dica de revisão. Com pelo menos **3 explicações**, a aula vale **+5 XP** para o pet, uma vez por dia (evento "Mentoria").
- As conversas ficam salvas (`MentorSession`, `MentorMessage`); as respostas do pet chegam em streaming pela rota `/api/mentor/[sessionId]`. Prompts e regras em `src/lib/mentor.ts`.

### H. Chamadas de IA
- Toda chamada à Featherless tem limite de **15 s** (1 nova tentativa); se estourar ou falhar, a tela usa um texto alternativo e avisa. O tempo de cada chamada aparece no log do servidor (`[ai] ...`). O modelo pode ser trocado com `FEATHERLESS_MODEL`.

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