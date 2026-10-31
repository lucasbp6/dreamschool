# 012 — Rolagem em caixas longas, mensagens dos pais, lembrete dos cadernos e cadastros em abas

**Data:** 2026-10-31

## Prompt
> acrescente a barra de scroll em caixas que ficam profundas em relação ao restante da pagina, aulas anteriores na aba ensinar pet, ultimo registros na aba turma, do professor (me solicite caso haja algum outro local). Permita que os pais possam enviar mensagem para gestor/professor. Coloque o pet do aluno lembrando de verificar os cadernos para as aulas daquele dia e transforme a aba de cadastro do gestor ser mais intuitiva (separe as abas de cadastro)

## O que foi feito
- **Rolagem:** "Aulas anteriores" (Ensinar o pet) e "Últimos registros" (aba Turma do professor) agora têm altura máxima com barra de rolagem; as áreas roláveis recebem foco pelo teclado. As novas listas (cadastros, conversas) também. Outros locais candidatos foram listados para o usuário escolher.
- **Mensagens dos pais:** novos modelos `Conversation` e `ConversationMessage` (migração `mensagens`). O responsável escolhe o destinatário — professores das turmas dos filhos (com as matérias) ou a gestão — e, opcionalmente, o filho; professor e gestor respondem. Aba **Mensagens** em Pais e Professor (com número de não lidas) e página Gestor → Mensagens. Toda ação confere se quem age participa da conversa.
  - Bug encontrado no teste e corrigido: o painel abria a primeira conversa sozinho e a marcava como lida mesmo com a aba escondida; agora só marca ao clicar.
- **Lembrete dos cadernos:** em **Meu mundo**, o pet lembra das aulas de hoje (ou do próximo dia letivo — `currentOrNextSchoolDay`, com teste), listando "Caderno de …" com horário; a lista marcável fica no navegador e o pet comemora quando está tudo na mochila.
- **Cadastros em abas:** Turmas → Professores → Matérias → Alunos, com passo a passo, contagem em cada aba e listas com rolagem.
- ESLint passa a ignorar `.next-test`.
- Testado no navegador: mãe enviou mensagem, professora viu "Mensagens 1", abriu e respondeu, a mãe viu a resposta como nova; lembrete dos cadernos e cadastros em abas conferidos. Conversa de teste removida.
