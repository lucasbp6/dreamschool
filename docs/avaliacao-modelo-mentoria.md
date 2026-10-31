# Avaliação: Qwen2.5 7B × 32B na mentoria "Ensinar o pet"

**Data:** 2026-10-31 · **Provedor:** Featherless · **Script:** `scripts/eval/mentor-eval.mts`

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
