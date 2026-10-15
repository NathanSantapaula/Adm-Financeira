# Auditoria de animações

Commit auditado: `c0c04f9`. Stack: CSS puro com tokens (`--ease`, `--ease-spring`, `--dur-1/2/3` em `assets/css/app.css`), WAAPI/rAF pontuais em `ui.js` (contagem de números) e `widgets.js` (FLIP do modo organizar). Personalidade: painel financeiro, deve ser rápido e sóbrio. Frequência: cliques que chamam `render()` (navegação, ano, chips, edição) acontecem dezenas de vezes por sessão; painel lateral e modais, algumas vezes; página inicial e diagnóstico, raramente.

Curvas de referência usadas nos ajustes:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* entradas e saídas de UI */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* painéis e folhas, estilo iOS */
```

| # | Gravidade | Categoria | Local | Problema | Correção | Status |
|---|---|---|---|---|---|---|
| 1 | ALTA | Propósito e frequência | `app.css:578` | `#view > * { animation: rise .55s }` roda a cada `render()`, porque `render()` troca o `innerHTML` de `#view`. Abrir o seletor de ano, trocar chip ou editar um valor faz a página inteira "subir" de novo. | Animar só quando a tela muda: `render()` põe `#view.tela-nova` quando a chave da tela muda; `rise` com 6px e 320ms em `--ease-out`. | feito |
| 2 | ALTA | Propósito e frequência | `app.css:587` | `.bar i, .macc-bar i, .hb-t i, .meter i { animation: grow .55s }` refaz o crescimento das barras a cada `render()`. | Restringir a `.entrando` (classe que `contarNumeros` já põe só na primeira pintura da tela). | feito |
| 3 | ALTA | Acessibilidade (toque) | `app.css:583, 573, 644, 667, 757, 840, 864` | `:hover` que movem (`translateY(-1px/-2px)`, `scale(1.01/1.06)`) sem `@media (hover: hover)`: no celular ficam presos depois do toque. Em `.btn`, o `translateY` do hover é trocado pelo `scale(.97)` do `:active`, e o botão "pula". | Tirar o deslocamento do hover de `.btn` (fica só a cor) e mover os demais para `@media (hover: hover) and (pointer: fine)`. | feito |
| 4 | MÉDIA | Duração | `app.css:568, 617, 620` | Painel lateral (`drin`, 550ms, começa com opacidade .3 a 40px) e accordion dos meses (550ms) passam de 300ms em ações frequentes. | Painel: `translateX(100%)` → 0 em 380ms `--ease-drawer`. Accordion: 300ms. | feito |
| 5 | MÉDIA | Easing | `app.css:570` | Aviso (toast) usa `--ease-spring` (ultrapassa o alvo) num painel sóbrio, e o mesmo na saída. | 240ms `--ease-out`; saída mais rápida (180ms). | feito |
| 6 | MÉDIA | Interrupção / física | `app.css:1203, 1212` | `.wg-saindo` usa `transition` de `transform`, mas a `animation` de balanço continua ativa e vence: o widget removido só some, sem encolher. | `animation: none` em `.wg-saindo`, escala final .92. | feito |
| 7 | MÉDIA | Origem | `app.css:916`, `app.css:172` | Central de notificações entra com `pop` a partir do centro; seletor de ano e folha "Mais" aparecem sem transição. São ancorados no botão. | Entrada de 180ms `--ease-out` com `transform-origin` no canto do gatilho (topo direito; folha do celular: base). | feito |
| 8 | MÉDIA | Folha no celular | `app.css:1260` | Janela do simulador no celular sobe só 40px em 550ms. | `translateY(100%)` → 0 em 420ms `--ease-drawer`. | feito |
| 9 | MÉDIA | Acessibilidade | `app.css:519` | Movimento reduzido zera **todas** as transições, inclusive cor e opacidade que ajudam a entender o estado. | Manter só opacidade e cores (`transition-property`) e cortar animações. | feito |
| 10 | BAIXA | Desempenho | `app.css:876` | `fp-desliza` anima `left` (layout). | Animar `opacity` + `scale` do marcador. | feito |
| 11 | BAIXA | Coesão | `app.css:517, 1213`, `widgets.js:253` | Curvas digitadas à mão (`.2,.7,.2,1`, `.2,.8,.2,1`) quase iguais a `--ease`. | Usar os tokens. | feito |

Mantidos de propósito: balanço do modo organizar (é o código visual de "editando", como no iPhone), contagem dos números (uma vez por tela e ano), animação de troca de tema (rara), `.reveal` de 800ms na página inicial (marketing).

Oportunidades não implementadas: animação de saída dos `<dialog>` (exige `transition-behavior: allow-discrete` e `overlay`, sem suporte no Safari; ficou de fora para não ter comportamento diferente por navegador).
