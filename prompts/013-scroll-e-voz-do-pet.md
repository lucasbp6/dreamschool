# 013 — Rolagem na chamada e nos recados; voz do pet

**Data:** 2026-10-31

## Prompt
> aplique scroll em professor: chamada, pais:recados. também implemente voz no pet, ou seja, além do texto, também haverá a voz do pet respondendo

## O que foi feito
- **Rolagem:** lista da **Chamada** (professor) e **Recados** (pais) com altura máxima e barra de rolagem, com foco pelo teclado.
- **Voz do pet** (`usePetVoice`): síntese de voz do navegador em pt-BR (prefere vozes mais naturais, como "Google português do Brasil"), com timbre por espécie (tom e velocidade). O pet fala a abertura e cada resposta **frase por frase enquanto o texto chega** (também evita o corte de falas longas do Chrome) e lê o resumo ao terminar a aula. Botão "Voz ligada/desligada" no topo da conversa (preferência guardada no navegador) com indicador de que está falando; botão "ouvir de novo" em cada fala (funciona mesmo com a voz desligada). A voz para quando o aluno envia ou começa a falar no microfone, para o ditado não captar o pet.
- Testes novos para a divisão em frases e a limpeza do texto falado (37 no total).
- Testado no navegador com a fala trocada por um registro silencioso: abertura e resposta faladas em frases com a voz "Google português do Brasil" e o timbre da raposa; voz desligada não fala; "ouvir de novo" fala. Aula de teste removida.
