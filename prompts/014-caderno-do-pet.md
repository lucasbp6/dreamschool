# 014 — Remover a voz do pet e criar o caderno de estudos com o pet

**Data:** 2026-10-31

## Prompt
> remova a feature de ouvir a voz do pet, o audio ficou bem medonho. Implemente um caderno para o pet, na aba de ensinar o pet, passando uma ideia de estudar com o pet, criando uma identificação entre o aluno e o pet

## O que foi feito
- **Voz do pet removida:** `usePetVoice` e seus testes apagados; `MentorChat` voltou à versão sem voz; documentação ajustada. O ditado do aluno (microfone) continua.
- **Caderno de estudos com o pet** (aba Ensinar o pet):
  - Capa "Caderno de estudos — {Aluno} & {Pet}" com o pet como adesivo e a contagem de páginas/matérias (no lugar de "Aulas anteriores").
  - Caderno completo abaixo da aula: espiral, papel pautado, letra de mão (Patrick Hand; no modo dislexia volta à fonte legível), índice por matéria (divisórias coloridas, com rolagem) e navegação entre páginas.
  - Cada aula terminada vira uma página: "O que aprendemos juntos" (2–4 fatos), "Cuidado! A gente tinha confundido" (erros da conversa e o jeito certo), "Pergunta para revisar", recadinho do pet e "Minha anotação" (o aluno escreve e guarda). Botão "Revisar com o pet" começa uma nova aula no mesmo tema.
  - A página é gerada pela IA em paralelo com o resumo, pedindo só fatos corretos e corrigindo o que a conversa errou; leitura tolerante do JSON, com a página montada a partir do resumo se a IA falhar. Aulas antigas aparecem com o resumo.
  - Schema: `MentorSession.notes` e `studentNote` (migração `caderno_do_pet`).
- 3 testes novos (38 no total).
- Testado com a IA real: aula sobre classificação dos animais com o erro "o morcego é uma ave" gerou a página com 3 fatos corretos e "Morcego não é ave, é mamífero (apesar de voar)" em Cuidado; anotação guardada; revisão iniciada no mesmo tema. Dados de teste desfeitos.
