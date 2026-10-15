# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas físicas, clientes e potenciais clientes da assessoria de investimentos de Nathan Santapaula (XP Inc.). Querem organizar o orçamento do mês, acompanhar o patrimônio e saber onde investir o próximo aporte, com acompanhamento do assessor. Usam o site no computador e muito no celular (inclusive instalado na tela inicial).

## Product Purpose

AVEN Financial Planning reúne diagnóstico (patrimônio, perfil de investidor e objetivos), orçamento mês a mês, conta corrente com importação de extratos, investimentos, proventos e carteira com rebalanceamento por aporte. Sucesso: o cliente sabe todo mês quanto sobrou, onde investir e se está no caminho do objetivo; e o visitante da página inicial faz o diagnóstico gratuito.

## Positioning

Planejamento financeiro ligado a um assessor real: o mesmo sistema que o cliente usa é o que o Nathan lê para montar a carteira recomendada (no plano Assessoria). O rebalanceamento mostra onde aplicar cada aporte sem vender nada.

## Operating Context

- Página inicial pública leva ao cadastro e a um diagnóstico guiado (patrimônio, sete perguntas de perfil, objetivos).
- Três planos: Organização (grátis), Investidor e Assessoria (identificador `completo`). Cobrança manual: pagamento pelo link do assessor e liberação na aba Clientes.
- Importação de extratos CSV/OFX e relatórios da B3; nada é gravado sem prévia.
- Site estático (HTML, CSS e JS puros, sem build) no GitHub Pages, com Supabase.

## Capabilities and Constraints

- Regras do `CLAUDE.md` valem sempre: olho oculto em todo valor em reais, textos de orientação pela `voz()`, três temas (claro, Dark OLED, Midnight) por tokens CSS, sem rolagem lateral em 390 px, `prefers-reduced-motion` respeitado.
- Sem promessa de rentabilidade e sem jargão sem explicação nos textos para o cliente.
- Sem novas bibliotecas ou frameworks sem consulta.

## Brand Commitments

- Nome vindo de `CFG.marca`/`CFG.submarca` ("AVEN", "Financial Planning"); logo desenhado em SVG em `ui.js`, com a seta azul `#0A84FF` (única cor fixa permitida fora dos tokens).
- Assessoria vinculada à XP Inc.; textos legais e de compliance precisam de revisão jurídica.
- Vidro (backdrop blur) e gradientes fazem parte da identidade, nos três temas. Redesigns elevam a qualidade deles; não os removem (pedido do Nathan, 2026-10-14).
- Sem fotos no site por enquanto (pedido do Nathan): a página inicial usa fragmentos da própria interface, tipografia e campos de cor.

## Evidence on Hand

- Nenhuma foto própria (do assessor, de clientes ou de escritório) até agora.
- Depoimentos só existem se configurados em `CFG.depoimentos`; não inventar depoimentos, números de clientes, rentabilidade ou imprensa.
- A interface real do sistema pode ser mostrada (desenhada em HTML com dados ilustrativos, marcados como tal).

## Product Principles

1. Clareza antes de enfeite: o número que importa aparece primeiro e grande.
2. O cliente confere antes de gravar; nada acontece sem ele ver.
3. Privacidade visível: o cliente sabe o que o assessor enxerga em cada plano.
4. Orientação sem promessa: ilustrações e projeções são sempre marcadas como hipotéticas.
