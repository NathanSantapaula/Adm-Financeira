# Design

Sistema visual v4 do AVEN Financial Planning. Fonte da verdade dos valores: `assets/css/app.css` (tokens no topo, camada "v4" no fim). Produto e público em `PRODUCT.md`.

## Ideia

Painel e página de produto em vidro. A tipografia é a fonte do sistema (SF Pro no Apple, Inter de reserva), em pesos firmes; vidro e gradientes da marca dão profundidade nos três temas. Vidro e gradiente são compromisso de marca: elevar, nunca remover.

## Tipografia

- Uma família só: `--font` (fonte do sistema, com Inter carregada do Google Fonts como reserva). O Nathan prefere esta fonte; não trocar por serifa.
- Títulos e números de destaque em 700 com espaçamento negativo (-0.02 a -0.045em) e `tabular-nums`.
- Página inicial: títulos `.hp-h1` e `.hp-h2` com `clamp()`, no máximo duas linhas em qualquer largura.

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

Página de produto centrada (classes `hp-`, em `landing.js`): herói com título em gradiente e prévia do painel numa janela de vidro sobre luz da marca; três recursos alternando texto e prévia; simulador de aporte num painel aurora (usa `E.rebalance`); perfis; seção escura do assessor com o que ele vê por plano; planos em cartões (Assessoria com borda em gradiente); perguntas; chamada final que leva o nome para o cadastro. Sem fotos. Grades com `auto-fit` e contêiner de até 1180px, sem colunas fixas: vale de 320px a telas largas. Seções escuras (`.hp-dark`) redefinem os tokens localmente.

## Movimento

Curvas `--ease-out` e `--ease-drawer`; interface abaixo de 300 ms; títulos da página inicial sobem de trás da linha uma vez; seções entram em sequência curta ao aparecer. Tudo respeita `prefers-reduced-motion` (fica a cor e a opacidade, sai o deslocamento). Detalhes em `plans/animacoes.md`.
