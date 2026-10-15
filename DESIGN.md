# Design

Sistema visual v4 do AVEN Financial Planning. Fonte da verdade dos valores: `assets/css/app.css` (tokens no topo, camada "v4" no fim). Produto e público em `PRODUCT.md`.

## Ideia

Um relatório financeiro editado, feito de vidro. A tipografia é a fonte do sistema (SF Pro no Apple, Inter de reserva), em pesos firmes; vidro e gradientes da marca dão profundidade nos três temas. Vidro e gradiente são compromisso de marca: elevar, nunca remover.

## Tipografia

- Uma família só: `--font` (fonte do sistema, com Inter carregada do Google Fonts como reserva). O Nathan prefere esta fonte; não trocar por serifa.
- Títulos e números de destaque em 700 com espaçamento negativo (-0.02 a -0.045em) e `tabular-nums`.
- Página inicial: cinco tamanhos (`--lp-s`, `--lp-b`, `--lp-l`, `--lp-h`, `--lp-d`); títulos com no máximo duas linhas em qualquer largura.

## Cor

- Temas por tokens: `light` (Claro), `oled` (Dark OLED), `midnight` (Midnight Blue). Nada de cor fixa fora dos tokens, exceto a seta azul do logo (`AVEN_AZUL`) e as cores de marca em `:root` (`--f-*`, `--g-*`), iguais nos três temas.
- Gradientes da marca: `--g-marca` (ciano, azul, índigo), `--g-noite` (azul-marinho), `--g-aurora` (campo escuro com luzes).
- `--accent-fill` é o azul de preenchimento de botão com texto branco legível em cada tema; `--accent` é o azul de texto e destaque.

## Vidro

Quatro camadas, sempre nesta ordem:

1. `--sheen`: brilho no topo (gradiente branco que some em ~40%).
2. Fundo translúcido (`--glass` ou `--glass-strong`) com `backdrop-filter: blur(var(--blur)) saturate(var(--sat))` nas barras, menus, janelas e cartões principais.
3. `--rim`: borda em gradiente, como luz batendo na quina. Técnica: `border: 1px solid transparent; background: var(--sheen) padding-box, linear-gradient(var(--glass), var(--glass)) padding-box, var(--rim) border-box`.
4. Sombra em camadas (`--shadow` em repouso, `--shadow-lg` no que flutua).

Cartões do painel usam vidro sem desfoque (translúcido sobre o fundo de ambiente) para não pesar na rolagem; o desfoque fica nas barras, menus, janelas e no cartão principal.

## Componentes

- Botão principal: gradiente do `--accent-fill` com brilho no topo, luz interna e sombra colorida (`--glow`). Demais botões em vidro com `--rim`. Formato pílula.
- Barras de dados (`.bar`, `.kbar`, `.macc-bar`): gradiente da cor do estado.
- Cantos: 12, 16, 20 e 28 px (`--r-*`); pílula para botões e chips.

## Página inicial

Composição de relatório: um eixo a 42% da largura (títulos no eixo, textos pendurados nele). Herói com mosaico de campos em gradiente e fragmentos do próprio painel em vidro claro (valores ilustrativos, marcados como tal). Sem fotos por enquanto. Seções: um lançamento em três momentos (o do meio funciona), barra de etapas, simulador de aporte (usa `E.rebalance`), assessor e o que ele vê por plano, tabela de planos, perguntas em faixas, primeiro passo do cadastro já aberto e rodapé com o e-mail como título.

## Movimento

Curvas `--ease-out` e `--ease-drawer`; interface abaixo de 300 ms; títulos da página inicial sobem de trás da linha uma vez; seções entram em sequência curta ao aparecer. Tudo respeita `prefers-reduced-motion` (fica a cor e a opacidade, sai o deslocamento). Detalhes em `plans/animacoes.md`.
