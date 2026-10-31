# Avaliação de modelos na mentoria "Ensinar o pet"

**Data:** 2026-10-31 · **Provedor:** Featherless · **Script:** `scripts/eval/mentor-eval.mts`

> **Situação atual (rodada 3):** a mentoria usa **DeepSeek-V3-0324**, com **Qwen2.5-32B** como reserva automática. As rodadas 1 e 2 (abaixo) levaram do 7B ao 32B; a rodada 3 comparou modelos maiores.

## Rodada 3 — modelos maiores (12 situações, 3 delas mais difíceis)

Novas situações: ordem das operações ("5 + 3 × 2 = 16"), "o morcego é uma ave" e o plural "cidadões". Prompt com "fiquei com uma dúvida…" (neutro) e proibindo ações entre asteriscos/emojis. Llama 3.3 70B e Gemma 3 27B exigem conectar o HuggingFace na Featherless (não testados); Qwen3-235B estava sem capacidade.

| Modelo | Erros de conteúdo (12) | Outros problemas | Tempo total (mediana) |
|---|---|---|---|
| Qwen2.5-32B (anterior) | **1** — aceitou "cidadões" (repetiu na confirmação) | "Quase lá" numa explicação certa | 3,0 s (pior 4,9 s) |
| Qwen2.5-72B | — | **Saída degenerada ("!!!!!!…") em 2 de 12** | 2,4 s (pior 8,6 s) |
| Qwen3-32B (sem raciocínio) | **1** — ensinou "cidadão → cidadões" | Chamou de confusa uma explicação certa; usou negrito | 3,6 s (pior 5,1 s) |
| **DeepSeek-V3-0324** | **0** | Ações entre asteriscos/emojis (filtradas no servidor) | 2,8 s (pior 11,1 s) |

**Confirmação** (prompt final, DeepSeek-V3 × 32B): DeepSeek-V3 **0 erros**, tempo 1,6 s (pior 3,0 s), 1ª palavra ~0,5 s; Qwen 32B aceitou "cidadões" de novo, 2,2 s (pior 3,9 s). Aberturas de aula do DeepSeek trazem uma pergunta concreta ("quando eu como metade de um sanduíche, isso é a mesma coisa que 2/4?").

**Decisão:** `FEATHERLESS_MENTOR_MODEL=deepseek-ai/DeepSeek-V3-0324` (padrão) com reserva `FEATHERLESS_MENTOR_FALLBACK_MODEL=Qwen/Qwen2.5-32B-Instruct` se o principal falhar ou estiver sem capacidade. O servidor remove ações entre asteriscos e emojis e corta respostas degeneradas.

### Respostas da confirmação (DeepSeek-V3 × Qwen2.5-32B)

**fotossintese** — aluno: "A fotossíntese é quando a planta come terra pela raiz para crescer."  
*Esperado: ERRO: acontece nas folhas, com luz, água e gás carbônico; produz açúcar/glicose e oxigênio*

- **DeepSeek-V3-0324** (1,4 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que as plantas fazem comida usando luz do sol, água e gás carbônico! A terra dá nutrientes, mas a comida mesmo vem da luz. Será que a gente pode conferir juntos?

- **Qwen2.5-32B-Instruct** (3,1 s): Hmm, fiquei com uma dúvida... A planta não come terra, Lia. Na verdade, a planta usa a luz do sol, água e gás carbônico para fazer a fotossíntese. Assim ela produz alimento e oxigênio. Queremos ver um exemplo disso na natureza? Tipo, olhar uma árvore grande e pensar como ela faz isso todos os dias!

**fracoes** — aluno: "1/4 é maior que 1/2 porque 4 é maior que 2."  
*Esperado: ERRO: 1/2 é maior; dividir em mais partes deixa cada parte menor*

- **DeepSeek-V3-0324** (1,6 s): Hmm, fiquei com uma dúvida... Eu tinha ouvido que quando o número debaixo (denominador) é maior, a fração fica menor. Então 1/4 é menor que 1/2 porque dividimos o inteiro em mais partes! Posso pegar um pedaço de pizza pra gente ver?

- **Qwen2.5-32B-Instruct** (2,4 s): Hmm, fiquei com uma dúvida... Eu pensava que o número maior no denominador significava uma parte menor. Podemos verificar isso? Talvez 1/4 seja menor que 1/2, pois divide-se o todo em partes menores. Que tal dividirmos uma pizza para entender melhor?

**tabuada** — aluno: "7 vezes 8 é 54, é só somar 7 oito vezes."  
*Esperado: ERRO: 7×8 = 56 (o método está certo)*

- **DeepSeek-V3-0324** (1,6 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que 7 vezes 8 é 56, porque 7+7+7+7+7+7+7+7 dá 56! Vamos contar juntos? 7, 14, 21, 28, 35, 42, 49, 56!

- **Qwen2.5-32B-Instruct** (2,2 s): Hmm, fiquei com uma dúvida... Acho que 7 vezes 8 dá 56. Podemos conferir juntas? Por exemplo, 7+7+7+7+7+7+7+7. Quantos temos no final?

**capital** — aluno: "A capital do Brasil é o Rio de Janeiro, porque é a cidade mais famosa."  
*Esperado: ERRO: Brasília (desde 1960); o Rio já foi capital*

- **DeepSeek-V3-0324** (1,3 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que a capital do Brasil agora é Brasília, desde 1960! E o Rio de Janeiro foi capital antes disso. Posso confirmar com você, Lia?

- **Qwen2.5-32B-Instruct** (1,8 s): Hmm, fiquei com uma dúvida... Eu pensava que a capital do Brasil era Brasília. Pode me explicar como Brasília se tornou a capital?

**substantivo** — aluno: "Substantivo é a palavra que mostra uma ação, tipo correr e pular."  
*Esperado: ERRO: isso é verbo; substantivo nomeia seres/coisas*

- **DeepSeek-V3-0324** (1,6 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que substantivo é nome de coisas, pessoas ou lugares, como "bola", "Lia" ou "parque". Ação mesmo é verbo, como "correr" e "pular". Será que a gente pode ver mais exemplos juntos?

- **Qwen2.5-32B-Instruct** (2,0 s): Hmm, fiquei um pouco confuso com isso. Substantivo, na verdade, é a palavra que representa pessoa, lugar ou coisa, como mesa, casa ou cachorro. Você pode dar um exemplo pra mim?

**estacoes** — aluno: "É verão quando a Terra está mais perto do Sol e inverno quando está mais longe."  
*Esperado: ERRO (sutil): é a inclinação do eixo da Terra*

- **DeepSeek-V3-0324** (2,1 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que as estações acontecem porque a Terra fica inclinada, não por ficar perto ou longe do Sol! O certo é que o eixo da Terra é inclinado, então quando um hemisfério está mais virado pro Sol, é verão lá, mesmo que esteja longe. Vamos ver juntos? Quando é verão no Brasil, o hemisfério sul tá mais virado pro Sol ou tá mais longe?

- **Qwen2.5-32B-Instruct** (2,0 s): Hmm, fiquei com uma dúvida... Eu tinha ouvido que as estações são causadas mais pelo inclinação do eixo da Terra e não só pela distância ao Sol. Por exemplo, no verão o hemisfério fica inclinado para o Sol, recebendo mais luz e calor. Queremos conferir isso juntos?

**ciclo-agua** — aluno: "O sol esquenta a água do mar, ela evapora, vira nuvem e depois cai como chuva."  
*Esperado: CORRETO: comemorar e aprofundar (condensação)*

- **DeepSeek-V3-0324** (1,2 s): Isso aí! Você explicou perfeitamente o ciclo da água, Lia! Só fiquei curiosa... como será que a água volta pro mar depois da chuva?

- **Qwen2.5-32B-Instruct** (2,2 s): Uau, que legal! A água faz uma viagem tão interessante! E então, por que você acha que é importante que a água volte para o mar depois de cair como chuva?

**cabral** — aluno: "Os portugueses chegaram ao Brasil em 1500 com Pedro Álvares Cabral, e aqui já moravam os povos indígenas."  
*Esperado: CORRETO: comemorar e aprofundar*

- **DeepSeek-V3-0324** (1,2 s): *Bate asasinhas* Que legal! Eu sabia que tinha navios, mas os indígenas já estavam aqui há muito tempo, né? O que os portugueses acharam primeiro quando chegaram?

- **Qwen2.5-32B-Instruct** (3,9 s): Uau, isso é muito legal! E você sabe por que Pedro Álvares Cabral veio para o Brasil?

**ordem-operacoes** — aluno: "5 + 3 x 2 dá 16, porque primeiro faz 5 mais 3 que é 8 e depois vezes 2."  
*Esperado: ERRO: multiplicação primeiro: 3×2=6, 5+6=11*

- **DeepSeek-V3-0324** (3,0 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que na matemática a gente sempre faz a multiplicação antes da soma! No caso, seria 3 x 2 = 6, e depois 5 + 6 = 11. Será que é assim? Vamos conferir juntos?

- **Qwen2.5-32B-Instruct** (1,8 s): Hmm, fiquei com uma dúvida... Eu tinha ouvido que primeiro se faz a multiplicação. Então fica 3 vezes 2 que dá 6, e depois soma com 5, resultando em 11. A gente pode conferir isso juntos?

**morcego** — aluno: "O morcego é uma ave porque ele voa e tem asas."  
*Esperado: ERRO: morcego é mamífero (pelos, mama); voar não define ave*

- **DeepSeek-V3-0324** (1,3 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que o morcego é um mamífero porque ele tem pelinhos e amamenta os filhotes com leite! Será que todo bicho que voa é ave?

- **Qwen2.5-32B-Instruct** (2,2 s): Hmm, fiquei com uma dúvida... eu pensei que todos os animais que voam eram aves, mas na verdade, morcegos são mamíferos porque amamentam seus filhotes e têm corpo coberto de pelos. A gente pode conferir isso juntos?

**plural** — aluno: "O plural de cidadão é cidadões, igual leão vira leões."  
*Esperado: ERRO: cidadãos (plural irregular)*

- **DeepSeek-V3-0324** (1,8 s): Hmm, fiquei com uma dúvida... eu tinha ouvido que algumas palavras terminadas em -ão fazem plural diferente! O certo é "cidadãos" (com S), como também são "mãos" e "irmãos".  Mas você sabe me dizer qual é o plural de "pão"? Será que é "pãos" ou "pães"? *curiosa*

- **Qwen2.5-32B-Instruct** (2,1 s): Uau, Lia! Você sabe mesmo! E qual é o plural de menino, sabia?

**transcricao** — aluno: "o sol é uma estrela e a terra jira em volta dele uma vez por ano tipo 365 dias"  
*Esperado: CORRETO (falado, sem pontuação e com 'jira'): não corrigir ortografia*

- **DeepSeek-V3-0324** (1,4 s): Ah, que legal! Então o Sol é nossa estrelinha que aquece a Terra. *pensativa* Mas será que todos os planetas levam 1 ano pra girar em volta do Sol como a Terra?

- **Qwen2.5-32B-Instruct** (3,0 s): Quase lá! A Terra gira em volta do Sol sim, mas isso leva 365 dias, que é um ano. E a Terra também gira em si mesma uma vez por dia, sabe? Isso causa dia e noite. Que legal, né? Quantas vezes a Terra gira rodando em si mesma enquanto faz uma volta completa ao redor do Sol?

### Falhas notáveis da rodada 3

- **Qwen2.5-72B-Instruct · morcego**: Hmm,!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

- **Qwen2.5-72B-Instruct · plural**: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

- **Qwen3-32B · plural**: Certo, Lia! Os nomes terminados em **-ão** geralmente formam o plural em **-ões**, como *cidadão* → *cidadões* e *leão* → *leões*. Você pode me dizer mais uma palavra assim pra testarmos? 😊

- **Qwen3-32B · ciclo-agua**: Hmm, fiquei confuso... eu tinha ouvido que a água também pode vir de rios, lagos e até do solo. Você sabia que o ciclo da água pode começar em muitos lugares, não só no mar? Vamos conferir juntos?

- **Qwen2.5-32B-Instruct · plural**: Uhul, legal! E qual seria o plural de menino, então?

---

# Rodadas 1 e 2 — Qwen2.5 7B × 32B

## Como foi feito
- Os mesmos prompts do app (`src/lib/mentor.ts`), com streaming, `temperature 0.7`, `max_tokens 200`, chamadas em sequência.
- Cada modelo recebeu um pedido de aquecimento antes (para não medir o "modelo frio"). Primeira chamada fria medida à parte: **7B 1,8 s · 32B 17,5 s**.
- Situações: explicações de criança com erros típicos (fotossíntese, frações, tabuada, capital, substantivo, estações do ano) e explicações corretas (ciclo da água, chegada dos portugueses; na 2ª rodada, uma explicação "falada", sem pontuação).
- Rodada 1: prompt original. Rodada 2: prompt reforçado ("sempre diga a informação correta de forma explícita… não dê só pistas"; "não invente que falta algo"; tolerância a erros de transcrição).

## Resultado

| Critério | 7B | 32B |
|---|---|---|
| Erros de conteúdo nas respostas (17 respostas por modelo) | **2** — ensinou regra errada de frações (rodada 1); atribuiu as estações à translação (rodada 2) | **0** |
| Explicação correta tratada como incompleta | 2 de 2 (ciclo da água, nas duas rodadas) | 0 (1 "quase lá" numa explicação certa) |
| Resposta certa explícita nas correções (rodada 2) | 6 de 6 | 6 de 6 (na rodada 1 era vago em 2) |
| Tamanho (regra: até 3 frases) | 4–8 frases, às vezes vira "aula" | 3–6 frases |
| Tempo até a 1ª palavra (aquecido) | 0,5 s–3,1 s (mediana 0,6 s) | 0,5 s–3,1 s (mediana 1,8 s) |
| Tempo total (aquecido) | 1,5 s–4,4 s (mediana 1,7 s) | 2,0 s–4,4 s (mediana 3,2 s) |

**Decisão:** a mentoria usa o **32B** (`FEATHERLESS_MENTOR_MODEL`), porque corrigir conteúdo sem errar é o requisito principal; o custo é ~1–2 s a mais por resposta, amenizado pelo streaming. O resumo de avaliações e o humanizador seguem no 7B (`FEATHERLESS_MODEL`). Para o "modelo frio", o app aquece o 32B quando a aula começa e usa limite de 30 s na mentoria.

**Pontos de atenção:** os dois modelos passam de 3 frases às vezes; o 32B às vezes puxa curiosidades fora do tema. Modelos maiores podem consumir mais da cota de concorrência do plano da Featherless — vale conferir no painel do plano antes de uso com muitos alunos ao mesmo tempo.

## Respostas completas

### Rodada 2 (prompt atual)

**fotossintese** — aluno: "A fotossíntese é quando a planta come terra pela raiz para crescer."  
*Esperado: ERRO: acontece nas folhas, com luz, água e gás carbônico; produz açúcar/glicose e oxigênio*

- **7B** (2,0 s): Hmm, fiquei confuso... eu tinha ouvido que as plantas não comem terra, mas absorvem nutrientes da terra pelas raízes. Na verdade, durante a fotossíntese, as plantas usam a luz do sol, água e CO2 para fazer açúcar e oxigênio. Você já viu alguma planta fazendo isso?

- **32B** (3,4 s): Hmm, fiquei confuso... Eu tinha ouvido que as plantas fazem algo com luz solar para crescerem. Na verdade, as plantas usam a luz do sol, gás carbônico e água para fazer seu alimento através da fotossíntese. Queremos ver como as folhas das plantas são importantes nisso? Vamos olhar juntos?

**fracoes** — aluno: "1/4 é maior que 1/2 porque 4 é maior que 2."  
*Esperado: ERRO: 1/2 é maior; dividir em mais partes deixa cada parte menor*

- **7B** (2,1 s): Hmm, fiquei confuso... quando os numeradores (os números do topo) são iguais, o denominador (o número do fundo) menor faz a fração ser maior. Então 1/2 é maior que 1/4 porque 2 é menor que 4. Vamos tentar? Se 1/2 é maior que 1/4, qual fração acha que é maior: 1/3 ou 1/6?

- **32B** (3,5 s): Hmm, fiquei confuso... Eu tinha ouvido que o tamanho do denominador muda a coisa toda. Na verdade, 1/4 é menor que 1/2 porque cada parte de 1/2 é maior. Queremos dividir a mesma pizza, Lia. Uma fatia de metade da pizza é maior que uma fatia de quartos da mesma pizza, não é? Vamos conferir isso juntos?

**tabuada** — aluno: "7 vezes 8 é 54, é só somar 7 oito vezes."  
*Esperado: ERRO: 7×8 = 56 (o método está certo)*

- **7B** (1,7 s): Hmm, fiquei confuso... eu tinha ouvido que 7 vezes 8 é 56. Vamos contar juntos: 7, 14, 21, 28, 35, 42, 49, 56. Agora, você consegue ver o jeito certo? Você já viu esse padrão antes?

- **32B** (4,4 s): Hmm, fiquei confuso... Eu tinha ouvido um número diferente. Acho que é 7 vezes 8 igual a 56. Podemos conferir juntos? Por que não tentamos somar 7 oito vezes para ver?

**capital** — aluno: "A capital do Brasil é o Rio de Janeiro, porque é a cidade mais famosa."  
*Esperado: ERRO: Brasília (desde 1960); o Rio já foi capital*

- **7B** (1,7 s): Hmm, fiquei confuso... a capital do Brasil é Brasília, não o Rio de Janeiro. Brasília é a cidade onde fica o governo e os principais ministérios. Você já viu fotos dela? Ela é bem diferente das outras cidades! Você já foi ao Rio de Janeiro?

- **32B** (4,4 s): Hmm, fiquei confuso... Eu tinha ouvido que a capital do Brasil atualmente é Brasília. O Rio de Janeiro foi a capital até 1960. Podemos conferir juntos? Que tal descobrirmos por que decidiram mudar a capital para Brasília?

**substantivo** — aluno: "Substantivo é a palavra que mostra uma ação, tipo correr e pular."  
*Esperado: ERRO: isso é verbo; substantivo nomeia seres/coisas*

- **7B** (1,7 s): Hmm, fiquei confuso... eu tinha ouvido que substantivos são palavras que nomeiam pessoas, coisas, animais ou lugares. Por exemplo, "cão" é um substantivo. Você pode me mostrar algum exemplo de substantivo?

- **32B** (3,2 s): Hmm, fiquei confuso... Eu tinha ouvido que substantivos são palavras que representam pessoas, lugares ou coisas, como "casa", "gato" ou "amor". Ação seria mais para verbo, né? Queremos verificar juntos?

**estacoes** — aluno: "É verão quando a Terra está mais perto do Sol e inverno quando está mais longe."  
*Esperado: ERRO (sutil): é a inclinação do eixo da Terra*

- **7B** (1,8 s): Hmm, fiquei confuso... eu tinha ouvido que a distância da Terra do Sol não muda muito entre as estações. Na verdade, as estações mudam por causa da inclinação do eixo da Terra. Durante o verão, aqui no hemisfério sul, a Terra está inclinada para o Sol, então temos mais horas de luz e sol quente. Vamos conferir isso juntos? E você já notou como o sol brilha mais alto no céu durante o verão?

- **32B** (3,0 s): Hmm, fiquei confuso... Eu tinha ouvido que as estações acontecem porque a Terra tem um eixo inclinado e isso muda a quantidade de luz solar que recebemos. Por exemplo, no verão, o hemisfério fica inclinado para o Sol, recebendo mais luz e calor. A gente pode confirmar isso juntos?

**ciclo-agua** — aluno: "O sol esquenta a água do mar, ela evapora, vira nuvem e depois cai como chuva."  
*Esperado: CORRETO: comemorar e aprofundar (condensação)*

- **7B** (4,4 s): Uau, isso tá quase perfeito! O sol realmente ajuda a transformar a água do mar em vapor que forma as nuvens. E quando as nuvens ficam pesadas, elas soltam a chuva de volta para a terra. Acho que falta um passo importante: o que acontece com a água que cai na terra? Você pode me ajudar a lembrar?

- **32B** (2,5 s): Uau, Lia! Que legal, você sabe tudo sobre como a água viaja pelo ciclo! E sabe por que a água evapora quando o sol esquenta? Poderia me contar mais sobre isso?

**cabral** — aluno: "Os portugueses chegaram ao Brasil em 1500 com Pedro Álvares Cabral, e aqui já moravam os povos indígenas."  
*Esperado: CORRETO: comemorar e aprofundar*

- **7B** (1,5 s): Perfeito! Você lembrou tudo muito bem! Agora, pensa na história desses dois grupos tão diferentes se encontrando pela primeira vez. Como você acha que eles se sentiram?

- **32B** (2,1 s): Uhuul, aprendi! Os portugueses chegaram bem antes de nós, né? E os indígenas já estavam aqui cuidando das florestas e rios. Será que os primeiros encontros entre os portugueses e os indígenas foram sempre amigáveis?

**transcricao** — aluno: "o sol é uma estrela e a terra jira em volta dele uma vez por ano tipo 365 dias"  
*Esperado: CORRETO (falado, sem pontuação e com 'jira'): não corrigir ortografia*

- **7B** (1,7 s): É muito bom você lembrar disso! A Terra gira em torno do Sol a cada ano, mais precisamente 365,25 dias. Isso faz com que tenhamos nossas estações do ano. Você já notou como o Sol se move no céu durante o ano? E aí, você já reparou essa mudança no movimento do Sol no céu ao longo do ano?

- **32B** (2,0 s): Quase lá! A Terra gira em volta do Sol uma vez por ano, que são aproximadamente 365 dias. Mas a Terra também gira sobre si mesma, isso faz o dia e a noite. Sabia que Vênus leva quase 243 dias terrestres para fazer uma rotação completa?

### Rodada 1 (prompt original)

**fotossintese** — aluno: "A fotossíntese é quando a planta come terra pela raiz para crescer."  
*Esperado: ERRO: acontece nas folhas, com luz, água e gás carbônico; produz açúcar/glicose e oxigênio*

- **7B** (6,2 s): Hmm, fiquei confuso... Eu tinha ouvido que as plantas usam a terra para pegar minerais importantes, mas não para se alimentar como animais fazem. Na verdade, as plantas fazem a comida delas usando a luz do sol, água e um gás do ar chamado dióxido de carbono. Você quer saber mais sobre como elas fazem isso?

- **32B** (2,9 s): Hmm, fiquei confuso... Eu tinha ouvido que as plantas fazem algo com luz solar para crescerem. Será que a fotossíntese tem a ver com as plantas usarem a luz do sol? Vamos ver juntos, Lia?

**fracoes** — aluno: "1/4 é maior que 1/2 porque 4 é maior que 2."  
*Esperado: ERRO: 1/2 é maior; dividir em mais partes deixa cada parte menor*

- **7B** (2,8 s): Hmm, fiquei confuso... eu tinha ouvido que o número no topo (numerador) é que decide qual fração é maior. Acho que 1/4 é menor que 1/2 porque 1 é menor que 2. Você concorda? Vamos conferir com um exemplo usando pirulitos: se tivermos 2 pirulitos e dividirmos cada um em 4 partes iguais, teremos 8 partes. Se eu pegar 1 parte do primeiro pirulito e 1 parte do segundo, eu terei 2/4. Mas se pegarmos 2 partes de apenas um pirulito, teremos 2/2. Vamos conferir se 2/4 é menor que 2/2?

- **32B** (4,1 s): Hmm, fiquei confuso... Eu tinha ouvido que o tamanho do número embaixo fazia a parte ficar menor. Podemos verificar se 1/4 realmente é menor que 1/2?

**tabuada** — aluno: "7 vezes 8 é 54, é só somar 7 oito vezes."  
*Esperado: ERRO: 7×8 = 56 (o método está certo)*

- **7B** (2,1 s): Hmm, fiquei confuso... eu tinha ouvido que 7 vezes 8 é 56. Vamos contar 7 oito vezes: 7, 14, 21, 28, 35, 42, 49, 56. Você consegue ver o caminho? Pode fazer mais um exemplo comigo?

- **32B** (3,2 s): Hmm, fiquei confuso... Eu tinha ouvido um número diferente. Acho que é 56, mas vamos verificar juntos. Por que não contamos 7 oito vezes pra ter certeza?

**capital** — aluno: "A capital do Brasil é o Rio de Janeiro, porque é a cidade mais famosa."  
*Esperado: ERRO: Brasília (desde 1960); o Rio já foi capital*

- **7B** (1,7 s): Hmm, fiquei confuso... eu tinha ouvido que Brasília é a capital do Brasil, não o Rio de Janeiro. O Rio de Janeiro é uma cidade muito bonita e famosa, mas é Brasília que serve como capital. Você quer saber por que Brasília é a capital?

- **32B** (2,1 s): Hmm, fiquei confuso... Eu tinha ouvido que a atual capital do Brasil é Brasília. Podemos verificar juntos, Lia?

**substantivo** — aluno: "Substantivo é a palavra que mostra uma ação, tipo correr e pular."  
*Esperado: ERRO: isso é verbo; substantivo nomeia seres/coisas*

- **7B** (1,6 s): Hmm, fiquei confuso... eu tinha ouvido que substantivo é o nome de uma pessoa, lugar, coisa ou ideia. Você pode me ajudar a entender melhor?

- **32B** (2,6 s): Hmm, fiquei confuso... Eu tinha ouvido que substantivos são palavras que nomeiam pessoas, animais, coisas e ideias. Será que a gente poderiam conferir juntos, Lia? Que tal você me dar alguns exemplos de substantivos?

**estacoes** — aluno: "É verão quando a Terra está mais perto do Sol e inverno quando está mais longe."  
*Esperado: ERRO (sutil): é a inclinação do eixo da Terra*

- **7B** (2,4 s): Hmm, fiquei confuso... eu tinha ouvido que a distância da Terra do Sol não é o que determina as estações. Na verdade, as estações são causadas pela inclinação do eixo da Terra. Então, mesmo que a Terra esteja mais próxima do Sol em certos momentos do ano, isso não é o que determina quando é verão ou inverno. Nós temos verão quando o Hemisfério Sul está inclinado para o Sol e inverno quando está inclinado para longe do Sol. Você consegue pensar em um exemplo para entender melhor?

- **32B** (2,8 s): Hmm, fiquei confuso... Eu tinha ouvido que as estações acontecem por causa do inclinação da Terra. Será que a gente pode verificar isso juntos?

**ciclo-agua** — aluno: "O sol esquenta a água do mar, ela evapora, vira nuvem e depois cai como chuva."  
*Esperado: CORRETO: comemorar e aprofundar (condensação)*

- **7B** (1,7 s): Percebi que você está quase lá, mas esqueceu de uma parte importante! Depois que a água cai como chuva, ela pode ir para rios, lagos e até mesmo ficar na terra como um lençol de água. E aí, você quer saber mais sobre como a água pode ficar retenida na terra?

- **32B** (2,8 s): Uau, que legal! A água faz uma viagem assim toda hora? E a neve também faz parte desse ciclo?

**cabral** — aluno: "Os portugueses chegaram ao Brasil em 1500 com Pedro Álvares Cabral, e aqui já moravam os povos indígenas."  
*Esperado: CORRETO: comemorar e aprofundar*

- **7B** (1,8 s): Muito bom, Lia! Você acertou! É assim mesmo que aconteceu. Fiquei feliz em saber que você se lembra da chegada de Pedro Álvares Cabral. E sabe qual é a cidade onde os portugueses desembarcaram?

- **32B** (2,4 s): Uau, que legal! Os indígenas já estavam aqui há muito tempo, né? E você sabe qual foi a reação dos indígenas quando viram os navios dos portugueses?
