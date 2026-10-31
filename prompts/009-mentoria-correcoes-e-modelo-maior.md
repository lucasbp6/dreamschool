# 009 — Correções no "Ensinar o pet" e avaliação de um modelo melhor

**Data:** 2026-10-31

## Prompt
> coisas a corrigir na implementação do estudo personalizado com o pet, ao escolher um tema e apertar em iniciar, eu preciso recarregar a pagina pra aparecer a mensagem da IA. a mensagem inicial é vaga, podia variar ou ter ambos, uma pergunta sobre algo especifico ou pedir pra falar algo que sabe ou tem dificuldades. ao usar o audio, o modo que o botão fica, é anti intuitivo, e a primeiro texto enviado não está sendo apagado pra escrever o segundo. avalie o uso de um modelo melhor

## O que foi feito
### Correções no "Ensinar o pet"
- **Precisava recarregar para ver a aula:** a tela dependia da revalidação da página após "Começar a aula". Agora a ação devolve a sessão e a tela abre a conversa na hora; a fala de abertura do pet é gerada em seguida, em streaming (rota `/api/mentor/[sessionId]` com `{ open: true }`, uma vez só).
- **Mensagem inicial vaga:** trocada por uma abertura gerada pela IA com uma pergunta específica sobre o tema e um convite para contar o que já sabe ou o que acha difícil (ex.: "por que a baleia não é um peixe, se vive na água?"). Sem IA, há 3 aberturas prontas que variam.
- **Botão de áudio anti-intuitivo:** agora é "🎤 Falar" com texto; ouvindo, vira "■ Parar" com barrinhas de som, a caixa de texto fica destacada e aparece "Ouvindo… toque em Parar quando terminar". Enviar também funciona durante a escuta.
- **Texto da primeira fala voltava na caixa:** ao enviar, a escuta era só "parada" e o navegador ainda entregava o resultado final, reescrevendo a caixa. Agora ela é cancelada (`cancel()`) e resultados atrasados são ignorados. Testado com um simulador que imita esse atraso do Chrome.
- **Extra:** um resumo antigo do usuário terminava em "mud!!!!!!…" (o modelo degenerou) e estourava a largura da tela. O filtro de fala corta repetições anormais no streaming e na exibição e as falas quebram linha; os dados do usuário não foram alterados.

### Avaliação de um modelo melhor
- Disponíveis no plano: DeepSeek-V3-0324, Qwen2.5-72B, Qwen3-32B, Mistral-Small 24B. Llama 3.3 70B e Gemma 3 exigem conectar o HuggingFace; Qwen3-235B estava sem capacidade.
- 12 situações (3 novas e mais difíceis). Resultado: **DeepSeek-V3 0 erros de conteúdo**; Qwen 32B aceitou "cidadões" (2 de 2 vezes); Qwen3-32B ensinou "cidadões"; Qwen 72B gerou "!!!!!!…" em 2 de 12. Na confirmação, DeepSeek-V3 foi também o mais rápido (mediana 1,6 s; 1ª palavra ~0,5 s).
- **Decisão:** mentoria no DeepSeek-V3 com reserva automática no Qwen 32B; filtro remove ações entre asteriscos/emojis que o DeepSeek às vezes escreve. Prompt com "fiquei com uma dúvida…" (neutro em gênero).
- Relatório completo atualizado em `docs/avaliacao-modelo-mentoria.md`; script aceita a lista de modelos como argumento.
- No app: abertura em 2,0 s e resposta em 2,3 s com o DeepSeek-V3. A sessão de teste foi removida do banco.
- 2 testes novos (32 no total).
