# 008 — Explicação por áudio e avaliação do modelo de 32B na mentoria

**Data:** 2026-10-31

## Prompt
> acrescente a opção dessa explicação ser por audio (mantenha a opção de usar texto) e avalie o uso desse modelo mas com 32B de parametros para essa mentoria de estudo

## O que foi feito
### Avaliação do Qwen2.5-32B na mentoria
- 32B disponível no plano. Primeira chamada com o modelo "frio": 7B 1,8 s, 32B 17,5 s.
- Avaliação com os prompts reais do app em 8–9 situações (erros típicos de criança e explicações corretas), duas rodadas, os dois modelos. Relatório completo com todas as respostas em `docs/avaliacao-modelo-mentoria.md`; script em `scripts/eval/mentor-eval.mts`.
- Resultado: o 32B não cometeu erro de conteúdo em 17 respostas e seguiu melhor o papel de aprendiz; o 7B ensinou uma regra errada de frações, associou as estações à translação e tratou explicação correta como incompleta. Tempo aquecido: mediana 1,7 s (7B) × 3,2 s (32B).
- Prompt reforçado: sempre dizer a informação correta de forma explícita (o 32B dava só pistas), não inventar que falta algo e ignorar erros de transcrição.
- **Decisão:** mentoria no 32B (`FEATHERLESS_MENTOR_MODEL`, padrão `Qwen/Qwen2.5-32B-Instruct`), com aquecimento ao começar a aula e limite de 30 s; resumo e humanizador seguem no 7B.

### Explicação por áudio
- Botão de microfone na conversa (Web Speech API do navegador, pt-BR): o texto aparece enquanto o aluno fala; ele revisa e envia. A opção de escrever continua. Navegador sem suporte (Firefox) mostra só a opção de texto com uma dica.
- Mensagens faladas ficam marcadas (`MentorMessage.viaAudio`, migração `mentor_audio`) e aparecem com um ícone de microfone.
- Testado no navegador com um simulador de reconhecimento de voz (o navegador automatizado não tem microfone): transcrição ao vivo, envio marcado como falado e correção explícita do 32B ("um meio (1/2) é maior que um quarto (1/4)"). Aquecimento do 32B: 2,8 s; resposta: 3,4 s. A sessão de teste foi removida do banco.
