# 003 — Desenvolvedor único e registro de prompts

**Data:** 2026-10-31

## Prompt
> vai ser só voce fazendo mesmo, não teremos mais dev 1 e 2. e eu vou precisar salvar os prompts em prompts/

(Esclarecimento: salvar os prompts do desenvolvimento.)

## O que foi feito
- `AGENTS.md`/`CONVENTIONS.md`: removida a divisão DEV 1/DEV 2; adicionada a regra de registro de prompts.
- Criada a pasta `prompts/` com este registro e o índice.
- Implementação do MVP conforme o plano aprovado:
  - Setup: Next.js 15 + TypeScript + Tailwind 4 + Lucide, Prisma 6 + SQLite, SDK `openai` (Featherless), Vitest.
  - `prisma/schema.prisma` + migração `init` + `prisma/seed.ts` (2 turmas, 6 alunos com pets, pais, professores, gestor).
  - `src/lib/game.ts`: regras puras (níveis do pet e da construção, ação positiva, Ponto de Atenção, manutenção paga antes dos tijolinhos, missão de recuperação com bônus de +5 XP, sequência que pausa com reparo pendente e dá +5 tijolinhos no 1º ponto do dia). 8 testes em `game.test.ts`.
  - `src/lib/actions.ts` (server actions), `src/lib/session.ts` (modo demo por cookie), `src/lib/ai.ts` (humanizador e resumo, com fallback sem chave).
  - Componentes compartilhados: `RoleSwitcher`, `AccessibilityBar` (alto contraste, fonte para dislexia, tamanho da fonte), `PetAvatar`, `BuildingView`, `EventList`, `ui`.
  - Telas: `/student`, `/teacher`, `/parent`, `/manager` e página inicial.
  - `README.md` com instruções e roteiro de demonstração.
- Verificação: testes, `tsc`, lint e build sem erros; fluxo testado no navegador (ação positiva, Ponto de Atenção, superação, humanizador, alto contraste, telas de Pais e Gestor).
