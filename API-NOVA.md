# API nova do engine (SaaS reinventado)

Todas em `E` (`FPEngine`). `C` = `E.compute(plan, ctx)` do ano; `hoje` = `{ ano, mes (0-11), dia }`. Valores em reais saem como número: formate com `brl`/`brl0` (olho oculto).

## E.previsaoMes({ C, plan, hoje })
Sobra prevista no fim do mês: fixos e parcelas inteiros + gastos com data no ritmo de hoje. Fim do ano = isso + `investAlocado` dos meses seguintes.
Saída: `{ dia, diasMes, mes: { receita, gastosAteHoje, gastosFim, saldoFim }, ano: { saldoFim } }`.
Ex.: renda 6000, aluguel 2000, 1000 gastos até dia 10/out → `mes.gastosFim 5100`, `mes.saldoFim 900`.

## E.livreHoje({ C, hoje })
Quanto dá para gastar por dia até o fim do mês: (orçamento do mês, ou renda − meta de aporte sem orçamento) − já gasto, ÷ dias restantes (hoje incluso).
Entrada opcional `contas` (= `E.contasMes`). Contas fixas e parcelas já entram inteiras em `C.despesas`, então as não pagas ficam reservadas.
Saída: `{ base: 'orcamento'|'sobra', limite, restante, contasAPagar (null sem contas), diasRestantes, porDia }` (porDia 0 se estourou).
Ex.: orçamento 4000, gasto 3000, dia 10/out → `{ restante: 1000, diasRestantes: 22, porDia: 45.45 }`.

## E.detectarRecorrentes({ lancamentos, ano?, despesas?, minMeses = 3 })
Agrupa por `nomeEstab`; recorrente em `minMeses`+ meses, com intervalo de 20 a 40 dias entre um mês e o seguinte. `assinatura` = valores a ±10% da média; `jaFixo` = já existe item em `despesas` com o mesmo nome.
Saída: `[{ chave, nome, area, meses, valor (média), anual, ultimo (data), assinatura, jaFixo }]`, maior valor primeiro.

## E.planoDoMes({ C, mes, contas?, objetivos? })
`contas` = `E.contasMes(...)`, `objetivos` = `E.analiseObjetivos(...)`. Até 3 ações por prioridade: `deficit`, `contas`, `objetivo` (atrasado, `extra`), `investir` (`disponivelAporte`), `orcamento` (uso ≥ 80%).
Saída: `[{ prioridade, id, valor, ... }]` (`contas`: `qtd`; `objetivo`: `objetivo`, `nome`; `orcamento`: `uso`). Textos da tela via `voz()`.

## E.raioXMes({ C, plan, carry?, mes })
Saída: `{ receita, gastos, sobra, poupanca, aportes, areas: [{ area, valor, pct }], maior: { desc, valor, data, area } | null, lancamentos, variacao: { gastos, receita, sobra } }` (variação = fração contra o mês anterior do mesmo ano, null sem base).

## E.etapasObjetivo({ valor, saldo, aporte, retorno, hoje: { ano, mes }, prazo?, pcts = [.1,.25,.5,.75,1] })
Use `saldo`/`aporte` de um item de `E.analiseObjetivos`. Retorno vem do cliente (sem promessa).
`prazo` = meses até a data do objetivo (`item.prazo` de `analiseObjetivos`).
Saída: `[{ pct, valor, atingido, falta, meses, previsto: { ano, mes } | null, esperado, atraso }]`: `esperado` = mês da etapa no caminho em linha reta até o prazo; `atraso` > 0 atrasado, < 0 adiantado (null sem prazo ou já atingida).
Ex.: valor 10000, saldo 3000, aporte 1000, retorno 0, out/2026 → etapa 100% em 7 meses, mai/2027.

## E.previsaoAno({ C, plan, hoje })
Saída: `{ meses: [{ mes, sobra, tipo: 'real'|'agora'|'previsto', acumulado }] (12), total, piorMes }`. O mês de hoje vem de `previsaoMes`.

## E.saldoDiario({ plan, carry?, hoje, diaRenda = 5, diaContas = 10 })
Calendário do dinheiro do mês. Rendas no `r.dia` ou `diaRenda`, contas fixas no `it.dia` ou `diaContas`, gastos na data deles e, depois de hoje, o ritmo médio do dia. Lançamento com `itemId` (já conciliado num fixo) não conta duas vezes.
Saída: `{ dias: [{ dia, entra, sai, saldo, previsto, baixo (saldo < 0) }], menor (dia de menor saldo), fim }`.

## E.faixaHistorica({ serie, atual, n = 12 })
Você contra você: `serie` = valores dos meses anteriores (zeros fora, ao menos 3, senão null).
Saída: `{ min, mediana, max, n, atual, pos (0 a 1), faixa: 'abaixo'|'baixo'|'normal'|'alto'|'acima' }`.

## E.metaReserva({ C, patrimonio | reserva, hoje?, meses = 6 })
Meta = meses × gasto fixo médio (sem fixos, gasto total) dos meses com gasto até hoje.
Saída: `{ gastoMedio, meta, atual, cobertos (meses), falta, pct, objetivo: { tipo: 'reserva', nome, modo: 'marco', valor } }` (passe `objetivo` a `objSalvar` para criar com um toque).

## Avisos antecipados (dentro de E.notificacoes)
- `n_prev_negativo`, id `prev:AAAA-MM:negativo`: no ritmo de hoje o mês fecha no vermelho (`valor`), sem aviso de orçamento no mês.
- `n_lim_ritmo`, id `limprev:AAAA-MM:<area>`: o limite da área passa antes do fim do mês. `vars: { area, dia, limite, projecao }`. Só aparece abaixo de 80% (acima disso já existem `n_lim_perto` e `n_lim_passou`).
Títulos em `NOTIF_TIT`, textos nas três vozes em `NOTIF_VOZ` (`notif.js`).

## Assistente: intenção `posso_gastar`
"Quanto posso gastar hoje?" (ficha `IA_FICHAS.posso_gastar`) → `ia_livre_hoje` `{ porDia, restante, dias }` ou `ia_livre_zero` `{ valor }`, pelo `livreHoje`. `iaDados` passa agora `ano`. Textos nas três vozes em `IA_VOZ` (`ia.js`).
