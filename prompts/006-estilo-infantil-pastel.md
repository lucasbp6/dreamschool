# 006 — Estilo infantil pastel a partir das imagens de referência

**Data:** 2026-10-31

## Prompt
> acrescentei nessa pasta, 4 imagens jpeg, use-as como inspiração para poder alterar as imagens que estamos usando, com foco em deixar de uma forma com estilo infantil, com cores menso saturadas, e deixando todos com mesmo estilo

(Decisão: o tema Vila Sustentável foi trocado pelo Observatório, que tem arte nas referências.)

## O que foi feito
- **Construções com a arte de referência:** as 12 fases (4 temas × 3 fases) foram recortadas de `construcoes1.jpeg` e `contrucoes2.jpeg` em PNG com fundo transparente (`public/art/buildings/`). O recorte remove o fundo creme por preenchimento a partir das bordas e também manchas de creme presas dentro do desenho, e apaga os rótulos "Fase N". Script reprodutível em `scripts/art/cutout.ps1` + `scripts/art/jobs.json` (System.Drawing do Windows, sem dependências).
- **Tema Vila Sustentável trocado por Observatório** (decisão do usuário). Nomes das fases ajustados à arte: Casa na Árvore (Primeiras Tábuas → Cabana de Madeira → Mansão na Copa), Castelo (Primeira Muralha → Forte de Pedra → Castelo Real), Estação Espacial (Plataforma de Lançamento → Foguete em Montagem → Foguete Estelar), Observatório (Fundação → Cúpula em Obras → Observatório Estelar).
- **Pets redesenhados em SVG** (`PetArt.tsx`) no estilo de `rostos.jpeg`: gato roxo com laço e patinho, coruja azul com brotinho, ursinho rosa com nota musical (novo tipo `BEAR`), coelho, raposa, cachorro e dragão no mesmo traço. Expressão por humor (feliz, tranquilo, cansado com "z"); marca de nível com estrelinha/coroinha.
- **Paleta pastel** (creme, lavanda, verde/âmbar/azul dessaturados), com contraste de texto ≥ 4,5:1 conferido.
- **Cenário** (`WorldScene`) com céu creme-lavanda, nuvens e brilhos em SVG (`Decor.tsx`) e banco de nuvens no lugar da grama.
- **Tela inicial** com a ilustração da escola (`telainicial.jpeg`) e vitrine das 4 construções; logo do topo com o círculo de livros.
- Emojis usados como ilustração foram removidos (construções, pets, humores, tijolinhos, logo).
- Verificação: tipos, lint, 24 testes e build ok; revisão visual no navegador (prévia dos 7 pets × 3 humores, telas de Aluno, Professor, Gestor e alto contraste).
