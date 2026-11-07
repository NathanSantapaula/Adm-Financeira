# API nova do engine (SaaS reinventado)

Todas em `E` (`FPEngine`). `C` = `E.compute(plan, ctx)` do ano; `hoje` = `{ ano, mes (0-11), dia }`. Valores em reais saem como número: formate com `brl`/`brl0` (olho oculto).

## E.previsaoMes({ C, plan, hoje })
Sobra prevista no fim do mês: fixos e parcelas inteiros + gastos com data no ritmo de hoje. Fim do ano = isso + `investAlocado` dos meses seguintes.
Saída: `{ dia, diasMes, mes: { receita, gastosAteHoje, gastosFim, saldoFim }, ano: { saldoFim } }`.
Ex.: renda 6000, aluguel 2000, 1000 gastos até dia 10/out → `mes.gastosFim 5100`, `mes.saldoFim 900`.

## E.livreHoje({ C, hoje })
Quanto dá para gastar por dia até o fim do mês: (orçamento do mês, ou renda − meta de aporte sem orçamento) − já gasto, ÷ dias restantes (hoje incluso).
Saída: `{ base: 'orcamento'|'sobra', limite, restante, diasRestantes, porDia }` (porDia 0 se estourou).
Ex.: orçamento 4000, gasto 3000, dia 10/out → `{ restante: 1000, diasRestantes: 22, porDia: 45.45 }`.

## E.detectarRecorrentes({ lancamentos, ano?, despesas?, minMeses = 3 })
Agrupa por `nomeEstab`; recorrente em `minMeses`+ meses. `assinatura` = valores a ±10% da média; `jaFixo` = já existe item em `despesas` com o mesmo nome.
Saída: `[{ chave, nome, area, meses, valor (média), anual, ultimo (data), assinatura, jaFixo }]`, maior valor primeiro.

## E.planoDoMes({ C, mes, contas?, objetivos? })
`contas` = `E.contasMes(...)`, `objetivos` = `E.analiseObjetivos(...)`. Até 3 ações por prioridade: `deficit`, `contas`, `objetivo` (atrasado, `extra`), `investir` (`disponivelAporte`), `orcamento` (uso ≥ 80%).
Saída: `[{ prioridade, id, valor, ... }]` (`contas`: `qtd`; `objetivo`: `objetivo`, `nome`; `orcamento`: `uso`). Textos da tela via `voz()`.

## E.raioXMes({ C, plan, carry?, mes })
Saída: `{ receita, gastos, sobra, poupanca, aportes, areas: [{ area, valor, pct }], maior: { desc, valor, data, area } | null, lancamentos, variacao: { gastos, receita, sobra } }` (variação = fração contra o mês anterior do mesmo ano, null sem base).

## E.etapasObjetivo({ valor, saldo, aporte, retorno, hoje: { ano, mes }, pcts = [.1,.25,.5,.75,1] })
Use `saldo`/`aporte` de um item de `E.analiseObjetivos`. Retorno vem do cliente (sem promessa).
Saída: `[{ pct, valor, atingido, falta, meses, previsto: { ano, mes } | null }]`.
Ex.: valor 10000, saldo 3000, aporte 1000, retorno 0, out/2026 → etapa 100% em 7 meses, mai/2027.
