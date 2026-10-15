# CLAUDE.md: AVEN Financial Planning

Sistema web de planejamento financeiro de Nathan Santapaula (assessoria XP Inc.), distribuído aos clientes dele. Site **estático** (HTML, CSS e JS puros, sem build, sem módulos ES) publicado no GitHub Pages, com Supabase (login, Postgres com RLS, Storage e uma Edge Function opcional). Idioma da interface, dos textos e dos commits: **português do Brasil**.

## Comandos

- `npm install` instala só o `xlsx` (usado nos testes).
- `npm test` roda `tests/engine.test.js` e `tests/ingest.test.js` (Node puro, sem framework). Deve fechar com código 0 e nenhum `✗`. Rode antes de todo commit.
- `npx serve .` ou abrir `index.html` roda o site. Sem Supabase configurado ele entra em **modo demonstração** (dados no navegador, todos os recursos liberados).
- Depois de editar JS, `node --check assets/js/<arquivo>.js` pega erro de sintaxe rápido.
- Mudou CSS ou JS? Troque a versão `?v=` em **todas** as linhas de `assets/` do `index.html` (ex.: `?v=20261015a` vira `?v=20261016a`). Sem isso, o navegador do computador continua usando os arquivos antigos do cache e o cliente não vê a atualização.

## Arquitetura

Os scripts de `assets/js/` são carregados por `<script>` em **ordem fixa** (veja `index.html`) e compartilham o escopo global. Não existe `import`. Por isso:

- Um arquivo só pode chamar funções de arquivos carregados **antes** dele no momento da execução, ou depois que a página carregou (chamadas dentro de funções, cliques).
- Nomes de função e `const` de topo não podem se repetir entre arquivos. Antes de criar um nome, procure com `grep -n "nomeNovo" assets/js/*.js`.
- Arquivo novo: acrescente a tag em `index.html` na posição certa.

Ordem: `config, engine, ingest, store, charts, prefs, core, avatars, plans, ui, landing, auth, dashboard, objetivos, widgets, ledger, assets, ingest-ui, report, notif, info, admin, main`.

| Arquivo | Responsabilidade |
|---|---|
| `config.js` | Único arquivo de configuração do dono: contatos, preços, Supabase, `ingestao`, `recursos`. Valores reais de produção; **não sobrescrever**. |
| `engine.js` | Motor puro, sem DOM (roda no Node): cálculos, parcelas, orçamento, `PLANOS`/`RECURSOS`/`planoPermite`, rebalanceamento, backup, importação de planilha. |
| `ingest.js` | Puro, sem DOM: leitura de CSV/OFX, categorização, duplicidade, conciliação, payload e validação da IA. |
| `store.js` | Camada de dados: `Local` (navegador) ou `Cloud` (Supabase). Telas nunca chamam o Supabase direto. |
| `core.js` | Estado global `S`, sessão, salvamento, anos, hidratação e migração de dados. |
| `plans.js` | Permissões na interface: `temRecurso`, `gated`, `lockedHtml`, `iniciarCheckout`. |
| `prefs.js` | Temas (`auto`, `light`, `oled`, `midnight`) e catálogo de voz (`voz(chave, vars)`). |
| `assets.js` | Investimentos, Proventos e Carteira. Painéis de estudo usam `E.analiseInvest` (engine) e a planilha fica recolhida (`S.planilha`). |
| `avatars.js` | Foto de perfil (recorte e redução no aparelho, salva como data URL no perfil) e coleção de avatares em SVG por grupo de perfil. |
| `objetivos.js` | Múltiplos objetivos: catálogo com ícones, card multi-metas da Visão geral (`objCardHtml`, troca de foco sem `render()`), tela "Meus objetivos" no painel (`objetivosHtml`, edição por `data-objf`). Cálculo em `E.analiseObjetivos`/`E.sugerirDivisao`. |
| `widgets.js` | Visão geral personalizável: catálogo `WIDGETS` (id, nome, tamanhos, `disponivel`, `padrao`, `html`), layout em `S.profile.painel.itens` (`painelLayout`/`painelSalvar`), grade de 6 colunas (`widgetsHtml`) e a tela "Personalizar a Visão geral" no painel (ligar, largura, setas e arrastar). |
| `ledger.js` | Rendas (painel com `E.analiseRenda` e detalhe recolhível) e Gastos (período mês/ano, números, widgets de `E.analiseGastos` no mesmo sistema da Visão geral (`PAINEIS.gastos` em `widgets.js`, salvo em `S.profile.painelGastos`; mesma marcação `.wg-grid > .wg`, então "Organizar a tela" funciona igual; fora do modo organizar as larguras são encaixadas sem buracos por `gEncaixe` e a grade reage à largura do conteúdo por container query), lançamentos em seção recolhível com busca e filtros). |
| `ingest-ui.js` | Modal de importação de extratos. |
| `report.js` | Visão do consultor, carteira recomendada e relatório para impressão. |
| `notif.js` | Central de notificações: sino, lista, textos nas quatro vozes e estado lido/dispensado (`S.profile.notif`). As regras ficam em `E.notificacoes` (engine). Interações da central atualizam só o sino (`notifRefresh`), sem `render()`. |
| `info.js` | Botão "i": uma passada no DOM (`infoPass`, reaplicada por MutationObserver) move subtítulos de página, subtítulos de cartão, legendas `.cap`, ajuda das seções do painel e dicas dos campos para um ícone ao lado do título; balão `#infotip` no passar do mouse, foco ou toque. |
| `main.js` | Navegação, renderização e **todos os eventos** (`data-act`). |

Telas desenham HTML por template string e o `main.js` trata os cliques por `data-act="..."`. Para criar uma ação nova: ponha `data-act` no HTML e acrescente o `case` em `main.js`.

## Regras que não podem quebrar
- Olho oculto (`S.privado`): todo valor em reais exibido passa por `brl`, `brl0` ou `fmt` (que mascaram) e eixo de gráfico por `tickFmt`. Nunca mostrar dinheiro com `nf.format`/`toLocaleString` direto fora de campos de edição. Percentuais seguem visíveis.
- Simulador do objetivo e Histórico (`dashboard.js`): abrem numa janela sobre a tela (`<dialog id="wg-pop">`, funções `popAlternar`/`popSync`), nunca dentro da página. O botão "E se?" (`sim-toggle`), o link do card de objetivos (`sim-ir`) e "Histórico" (`hist-toggle`) só mudam o estado (`S.simAberto`, `S.hist.aberto`) e chamam `popAlternar`; a cada desenho da Visão geral, `popSync` atualiza o conteúdo da janela aberta. Estado dos controles só da sessão em `S.sim`; eventos `input` dos controles chamam `simInput` → `simAtualizar` (um quadro por vez), que troca textos e gráfico sem `render()`. Cálculo em `E.simularObjetivo` (testado).
- Patrimônio de partida de qualquer ano: sempre `E.ctxAno(plans, ano, patrimonioInicial, patrimonioAno)` (via `planCtx` ou `ctxDe`). Não somar aportes de anos anteriores à mão: o diagnóstico é ancorado no ano em que foi informado.
- Organizar na tela (`widgets.js`, `wgGestos`/`wgAcao`): modo `S.wgEdit`; durante o arraste `S.wgArrastando` bloqueia `render()` (via `isEditing`). A ordem é lida do DOM ao soltar (`wgGravarOrdem`) e salva sem redesenhar (`painelSalvar(lista, true)`). Os movimentos usam a propriedade CSS `translate` (FLIP), separada do `transform` do balanço.
- Desempenho: a aba Gastos monta as entradas do ano e a análise uma vez por desenho (`gastosDados`, guardado por `S.renderSeq`) sobre o índice por mês (`indiceMeses`); busca e filtros redesenham só a lista (`gListaAtualiza`), sem `render()`. `histDados()` guarda o resultado por desenho (`S.renderSeq`). Não volte a montar os 12 meses inteiros nem a chamar `E.historico` mais de uma vez por tela.
- Organizar a tela entra no modo sem `render()` (`wgEntrar` transforma o DOM no lugar), para o elemento sob o dedo não sumir no toque longo.
- Telas com widgets organizáveis: Visão geral, Gastos, Rendas, Investimentos e Proventos, registradas em `PAINEIS` (`widgets.js`), cada uma com a sua lista (`WIDGETS`, `G_WIDGETS`, `R_WIDGETS`, `INV_WIDGETS`, `PRO_WIDGETS`) e o seu lugar no perfil (`painel`, `painelGastos`, `painelRendas`, `painelInvest`, `painelProventos`). Fora da Visão geral, a tela monta um objeto `{ id: html }` e chama `telaWidgetsHtml(alvo, html)`: mesma marcação `.wg-grid > .wg`, então "Organizar a tela" e o editor do painel funcionam igual, e as larguras são encaixadas sem buracos (`encaixeLinhas`). As planilhas e listas recolhíveis ficam fora dos widgets.
- Widget novo na Visão geral: entre em `WIDGETS` (com `padrao: () => false` para não mudar a tela de quem já personalizou), desenhe o gráfico em `drawWidgetsExtras` e use ids de elemento únicos. Clientes com layout salvo recebem widgets novos desligados, em "Disponíveis para adicionar".
- Segundo gráfico da Visão geral: `painel2Html`/`drawPainel2` (constância dos aportes; no plano Organização, gastos fixos e variáveis).
- Linha do tempo (`historico` no engine; `histHtml`/`drawHistorico` em `dashboard.js`; gráficos `chartHistorico` e `chartAnos` em `charts.js`).
- Objetivos: `S.profile.objetivos` é a fonte; grave sempre por `objSalvar()` (normaliza, limita as fatias a 100% e espelha o principal em `perfil.objetivo` para compatibilidade). Valores digitados em reais passam por `parseReais` ("300.000" = trezentos mil).
- Avisos (`toast`/`toastAcao`) vão para dentro do painel ou modal aberto (`toastHost`), porque um `<dialog>` aberto cobre o resto da página; quem redesenha o conteúdo de um dialog precisa preservar o `#toast` (veja `renderAdmin` e `openModal`).
- Texto explicativo novo: escreva como sempre (`.page-h .sub`, `.c-h p`, `.sec-h p`, `p.cap`, `.dr-sec > h3 + p.mmsg`, `.field-row small`) e ele vira "i" sozinho. Para manter visível: dê `id`, classe `keep` (ou `disc` para aviso legal), ou ponha botão/link dentro. Classe `.info` é das listas de destaques; o botão é `.info-i`.
- Notificações: regra nova vai em `E.notificacoes` com teste, id com o mês (`grupo:AAAA-MM:...`), título em `NOTIF_TIT` e texto nas quatro vozes em `NOTIF_VOZ`. Valores em reais vão como número nas variáveis listadas em `NOTIF_MOEDA`; a interface formata.
- Marca: nome vem de `CFG.marca`/`CFG.submarca`; logo em `ui.js` (`AVEN_LETRAS`, `LOGO` com o "AV", `logoMarca()`). O azul da seta (`AVEN_AZUL`, #0A84FF) é a única cor fixa permitida fora dos tokens. Não escrever o nome fixo em textos. O id de backup `financial-planning` não muda (compatibilidade).

**Planos** (`engine.js`): `gratis` (Organização), `investidor`, `completo` (Assessoria). O identificador `completo` fica no banco e só o nome mostrado é "Assessoria": clientes pagantes existentes dependem disso. Novo recurso = entrada em `RECURSOS` com o plano mínimo, uso de `temRecurso`/`gated` na tela e, se mexe em dado sensível, regra no banco.

**Segurança**: a interface nunca é a proteção. A proteção é a RLS em `supabase/schema.sql` e nas migrations. Cada cliente só lê os próprios dados. O consultor lê planejamentos **apenas** de clientes com plano `completo` ativo. Só o consultor altera plano e recomendações. Nunca colocar `service_role`, `ANTHROPIC_API_KEY` ou qualquer segredo no repositório (é público). A chave `anon` do Supabase é pública por natureza.

**Banco**: mudança de schema vira **migration nova** em `supabase/migrations/` (numerada, que possa rodar de novo sem erro) **e** entra também em `schema.sql` para instalações novas.

**Dados do plano** (`migratePlan` em `engine.js`): cada ano guarda itens com `valores[12]`, `parcel`, `baixas`, mais `lancamentos` (gastos reais com data) e `ingestao.chaves` (anti-duplicidade). Mudou o formato? Atualize `migratePlan` para dados antigos, e o backup (`makeBackup`/`parseBackup`) continuar lendo arquivos antigos. Parcelamento é um **único** item consolidado e atravessa os anos.

**Importação**: nada é gravado sem o cliente conferir a prévia. A mesma transação nunca entra duas vezes (hash em `ingestao.chaves`). Pagamento de fatura e transferência entre contas próprias são neutros (não contam como gasto). Relatórios da B3 (Movimentação e Negociação, em .xlsx ou .csv) passam por `parseB3` em `ingest.js`: compra é saída de dinheiro (valor negativo, vira aporte), venda/resgate é entrada (reduz o aporte), provento é entrada; eventos sem valor são descartados com aviso. A leitura de PDF por IA só funciona com `ingestao.iaAtiva`, plano Assessoria e Edge Function publicada, e o arquivo é apagado após o uso.

**Interface**: cores só por tokens CSS (`var(--...)` em `app.css`), sempre válidos nos três temas. Respeitar `prefers-reduced-motion`. Sem rolagem lateral em 390 px de largura. Textos de orientação financeira passam por `voz()` (os números nunca mudam com a voz). Textos para o cliente: sem promessa de rentabilidade e sem jargão sem explicação.

## Como trabalhar aqui

1. Mudança de cálculo ou de regra: escreva ou ajuste o teste em `tests/` primeiro, rode `npm test`.
2. Mudança de tela: abra no navegador (modo demonstração) e confira nos três temas e em largura de celular.
3. Mudou o que o consultor enxerga, planos ou RLS: avise o Nathan com clareza, porque isso afeta privacidade e contratos dos clientes.
4. Commits pequenos, em português, no imperativo ("Corrige parcela que não atravessava o ano").
5. Não existe teste automatizado contra um Supabase real: a integração com o banco só foi exercitada com simulador. Qualquer mudança em `store.js`, no `schema.sql` ou na Edge Function precisa de teste manual num projeto Supabase de teste.

## Pendências conhecidas

- Cobrança é manual: o consultor troca o plano do cliente na aba Clientes. Falta o webhook do meio de pagamento (exige Edge Function com `service_role`).
- Notificações só aparecem com o site aberto; não há e-mail nem push (precisaria de Edge Function agendada).
- Sem 2FA, sem cotações de mercado (patrimônio a custo), sem edição simultânea segura do mesmo ano em dois dispositivos (vale o último salvamento).
- Texto de Termos e privacidade (`openTerms` em `ui.js`) é genérico: precisa de revisão jurídica, incluindo o tratamento de dados por IA.
- Ícones PNG (`assets/img/`) são gerados a partir do mesmo desenho do logo; se o logo mudar, gere-os de novo (180, 192 e 512 px).
