// Testes do motor de cálculo. Rode com: npm install && npm test
const E = require('../assets/js/engine.js');
let XLSX = null; try { XLSX = require('xlsx'); } catch (e) { /* teste de planilha é opcional sem a dependência */ }
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } else console.log('✓', m); };
let n = 0; const id = () => 'id' + (++n);
const eq = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 0.005);

// --- entrada de valores
ok(E.parseValor('1.234,56') === 1234.56 && E.parseValor('=100,50+20') === 120.5 && E.parseValor('-10') === -10 && Number.isNaN(E.parseValor('abc')), 'parseValor');

// --- parcelamento: um único item, valor distribuído sem perder centavos
const d = E.distribuir(100, 3);
ok(Math.abs(d.reduce((a, b) => a + b, 0) - 100) < 1e-9 && d[0] === 33.34 && d[2] === 33.33, 'distribuir: R$ 100 em 3 = 33,34 / 33,33 / 33,33');
const p = { total: 3000, n: 10, ano: 2026, mes: 2 }; // mar/2026 a dez/2026
ok(eq(E.parcelaMeses(p, 2026), [0, 0, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300]), 'parcelamento dentro do ano');
const p2 = { total: 1200, n: 12, ano: 2026, mes: 8 }; // set/2026 a ago/2027
ok(eq(E.parcelaMeses(p2, 2026), [0, 0, 0, 0, 0, 0, 0, 0, 100, 100, 100, 100]) && eq(E.parcelaMeses(p2, 2027), [100, 100, 100, 100, 100, 100, 100, 100, 0, 0, 0, 0]), 'parcelamento atravessa o ano');
ok(E.parcelaFim(p2).ano === 2027 && E.parcelaFim(p2).mes === 7 && E.parcelaIndice(p2, 2027, 0) === 5, 'fim e índice da parcela');
const plans = { 2026: { year: 2026, despesas: [{ id: 'x', cat: 'variavel', area: 'A', nome: 'TV', parcel: p2 }] } };
const carry = E.carryItems(plans, 2027);
ok(carry.length === 1 && carry[0].herdado === 2026 && Math.abs(E.sum(carry[0].valores) - 800) < 0.01 && E.carryItems(plans, 2026).length === 0, 'parcelas de anos anteriores aparecem (somente leitura) no ano seguinte');

// --- cálculo do plano
const plan = { v: 2, year: 2027, settings: { metaAporte: 1000, orcPadrao: 3000 },
  rendaCats: E.CATS_RENDA(), rendas: [{ id: 'r', cat: 'fixa', nome: 'Salário', valores: new Array(12).fill(8000) }],
  catsDesp: E.CATS_DESP(), despesas: [{ id: 'd', cat: 'fixa', area: 'Moradia', nome: 'Aluguel', valores: new Array(12).fill(2000) }],
  orcamento: [null, 2500, ...new Array(10).fill(null)],
  ativos: [{ id: 'a', tipo: 'BOLSA DE VALORES', classe: 'Ações BR', ap: new Array(12).fill(1500), pr: [0, 0, 50, ...new Array(9).fill(0)] }] };
const C = E.compute(plan, { carry, patrimonioInicial: 10000, prevAplicado: 5000 });
ok(Math.abs(C.despesas[0] - 2100) < 0.01 && Math.abs(C.despesas[7] - 2100) < 0.01 && Math.abs(C.despesas[8] - 2000) < 0.01, 'despesas incluem parcelas herdadas');
ok(C.orcamento[0] === 3000 && C.orcamento[1] === 2500, 'orçamento: padrão do ano e exceções por mês');
ok(Math.abs(C.restante[0] - (3000 - C.despesas[0])) < 0.01 && Math.abs(C.usoOrc[1] - 0.84) < 0.001, 'restante e uso do orçamento');
ok(Math.abs(C.receita[2] - 8050) < 0.01 && Math.abs(C.investAlocado[2] - (8050 - C.despesas[2])) < 0.01, 'receita inclui dividendos; sobra para investir');
ok(Math.abs(C.patrimonio[0] - 16500) < 0.01 && Math.abs(C.patrimonio[11] - (15000 + 18000)) < 0.01, 'patrimônio acumulado (inicial + anos anteriores + aportes)');
ok(Math.abs(C.meta[2] - 1050) < 0.01 && C.metaAno === C.T.meta, 'meta mensal = meta de aporte + dividendos');

// --- carteira
let r = E.rebalance([{ w: 50, v: 600 }, { w: 50, v: 400 }], 200);
ok(r.alloc[0] === 0 && r.alloc[1] === 200, 'rebalance: aporte vai para o ativo abaixo do alvo');
let all = true;
for (let t = 0; t < 300; t++) { const it = Array.from({ length: 2 + (t % 6) }, () => ({ w: Math.random() < 0.2 ? 0 : 1 + Math.random() * 30, v: Math.random() * 20000 })); const ap = Math.round((50 + Math.random() * 5000) * 100) / 100; const x = E.rebalance(it, ap); if (x.W > 0 && (Math.abs(x.alloc.reduce((a, b) => a + b, 0) - ap) > 0.0051 || x.alloc.some((v) => v < 0))) all = false; }
ok(all, 'rebalance: soma igual ao aporte e nunca negativa (300 casos)');

// --- perfil de investidor e projeção
ok(E.scorePerfil(E.QUIZ.map(() => 0)).resultado === 'conservador' && E.scorePerfil(E.QUIZ.map(() => 3)).resultado === 'agressivo' && E.scorePerfil(E.QUIZ.map(() => 2)).resultado === 'moderado', 'questionário: conservador, moderado e agressivo');
const proj = E.projetar(10000, 1000, 12, 12);
ok(proj.length === 12 && proj[11] > 23700 && proj[11] < 24000, 'projeção com aporte e retorno');
ok(E.mesesAteMeta(0, 1000, 0, 12000) === 12 && E.mesesAteMeta(50000, 0, 0, 40000) === 0 && E.mesesAteMeta(0, 0, 0, 1000) === null, 'meses até a meta');

// --- backup: ida e volta
const bk = E.makeBackup({ nome: 'Ana', carteira: [] }, { 2027: plan });
const back = E.parseBackup(JSON.parse(JSON.stringify(bk)), id);
ok(back.ok && back.planos[2027].rendas.length === 1 && back.perfil.nome === 'Ana', 'backup completo restaura perfil e planos');
ok(!E.parseBackup({ foo: 1 }, id).ok && !E.parseBackup(null, id).ok, 'backup inválido é recusado');

// --- migração do modelo v1 (planilhas antigas)
const v1 = { v: 1, year: 2025, settings: { metaBase: 1500 }, outros: [100, ...new Array(11).fill(0)], rendas: [{ id: 'a', cat: 'FIXA', area: 'Empresa', detalhe: 'Salário', v: new Array(12).fill(5000) }],
  despesas: [{ id: 'b', cat: 'VARIAVEL', area: 'Pessoal', nome: 'Vestuário', lanc: [{ id: 'l', m: 0, d: 'Camiseta', v: 90 }, { id: 'm', m: 1, d: 'Camiseta', v: 10 }] }], ativos: [] };
const m2 = E.migratePlan(v1, id);
ok(m2.v === 2 && m2.settings.metaAporte === 1500 && m2.despesas[0].sub === 'Vestuário' && m2.despesas[0].valores[1] === 10 && m2.rendaCats.some((c) => c.id === 'outros'), 'migração v1 para v2');

// --- planilha de importação (modelo -> .xlsx -> importar)
if (XLSX) {
  const wb = XLSX.utils.book_new(); E.templateSheets(2027).forEach((s) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name));
  const wb2 = XLSX.read(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }), { type: 'buffer' });
  const P = E.parseImport(wb2.SheetNames.map((nm) => ({ name: nm, rows: XLSX.utils.sheet_to_json(wb2.Sheets[nm], { header: 1, defval: '', raw: true }) })));
  ok(P.avisos.length === 0 && P.counts.rendas === 2 && P.counts.despesas === 4 && P.counts.parcelados === 1 && P.counts.investimentos === 4 && P.counts.carteira === 4, 'modelo .xlsx: lido sem avisos');
  const pl = { v: 2, year: 2027, settings: {}, rendaCats: E.CATS_RENDA(), rendas: [], catsDesp: E.CATS_DESP(), despesas: [], orcamento: [], ativos: [] }; const cart = [];
  E.applyImport(pl, cart, P, 'merge', id);
  ok(pl.rendaCats.length === 2 && pl.despesas.some((x) => x.parcel && x.parcel.n === 10) && pl.ativos.length === 4 && cart.length === 4, 'importação aplicada (categorias existentes reaproveitadas)');
  const before = JSON.stringify(pl); E.applyImport(pl, cart, P, 'merge', id);
  ok(pl.despesas.length === 5 && pl.rendas.length === 2, 'importar duas vezes não duplica itens');
}

// --- lançamentos reais, baixas e planos (v3)
const planoL = { v: 2, year: 2027, settings: { orcPadrao: 1000 }, rendaCats: E.CATS_RENDA(), rendas: [], catsDesp: E.CATS_DESP(), orcamento: [], ativos: [],
  despesas: [{ id: 'a', cat: 'fixa', area: 'Moradia', nome: 'Aluguel', valores: new Array(12).fill(400) }],
  lancamentos: [{ id: 'l1', data: '2027-03-10', desc: 'Mercado', valor: 150.5, cat: 'variavel', area: 'Alimentação' }, { id: 'l2', data: '2027-03-12', desc: 'Estorno', valor: -20, cat: 'variavel', area: 'Alimentação' }, { id: 'l3', data: '2026-03-10', desc: 'Outro ano', valor: 999, cat: 'variavel', area: 'X' }] };
let CL = E.compute(planoL, {});
ok(Math.abs(CL.despesas[2] - 530.5) < 1e-9 && CL.lancQtd[2] === 2 && Math.abs(E.sum(CL.despesas) - (4800 + 130.5)) < 1e-9, 'lançamentos reais entram nos gastos do mês certo (estorno reduz; outro ano é ignorado)');
planoL.despesas[0].baixas = { '2027-2': true }; CL = E.compute(planoL, {});
ok(Math.abs(CL.despesas[2] - 130.5) < 1e-9 && CL.despesas[3] === 400, 'baixa tira o previsto só do mês realizado');
ok(Math.abs(CL.despCat.variavel[2] - 130.5) < 1e-9, 'gasto por categoria soma os lançamentos');
ok(E.planoPermite('gratis', 'orcamento') && !E.planoPermite('gratis', 'carteira') && E.planoPermite('investidor', 'carteira') && !E.planoPermite('investidor', 'relatorios') && E.planoPermite('completo', 'ia_pdf') && E.planoPermite('qualquer', 'fluxo') && !E.planoPermite('qualquer', 'investimentos'), 'matriz de planos: gratuito, investidor e assessoria');

// --- análise de investimentos e proventos
{
  const plan = E.migratePlan({ year: 2026, ativos: [
    { id: 'a', tipo: 'BOLSA DE VALORES', classe: 'Fundos Imobiliários', nome: 'HGLG11', ap: [1000, 0, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0], pr: [10, 10, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'b', tipo: 'RENDA FIXA', classe: 'Tesouro Direto', nome: 'Tesouro Selic', ap: [3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], pr: [0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0] }] }, () => 'n' + Math.random());
  const C = E.compute(plan, { patrimonioInicial: 0, metaAporte: 1500 }); C.despesas = [1000, 1000, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // gasto fixo de teste
  const A = E.analiseInvest({ C, meses: 3, metaAporte: 1500, itens: plan.ativos.map((a) => ({ nome: a.nome, tipo: a.tipo, classe: a.classe, valor: E.sum(a.ap), ap: a.ap, pr: a.pr })) });
  ok(A.carteira.total === 5000 && Math.abs(A.carteira.pesoRF - 0.6) < 1e-9 && A.carteira.maior.nome === 'Tesouro Selic' && Math.abs(A.carteira.nEfetivo - 1 / (0.36 + 0.16)) < 1e-9, 'análise: total, peso da renda fixa, maior posição e nº efetivo de ativos');
  ok(A.proventos.ano === 70 && Math.abs(A.proventos.mediaMes - 70 / 3) < 0.01 && Math.abs(A.proventos.yoc - (70 / 3 * 12) / 5000) < 1e-6 && Math.abs(A.proventos.cobertura - (70 / 3) / 1000) < 1e-6, 'análise: média mensal, yield on cost e cobertura dos gastos');
  ok(A.proventos.capitalLiberdade > 0 && Math.abs(A.proventos.capitalLiberdade - 12000 / A.proventos.yoc) < 0.01 && A.proventos.pagadores[0].nome === 'HGLG11' && A.proventos.pagadores[0].mesesPagos === 3, 'análise: capital para cobrir os gastos e ranking de pagadores');
  ok(A.aporte.mesesComAporte === 2 && A.aporte.meses === 3 && A.aporte.metaAte === 4500 && A.aporte.porMes.filter(Boolean).length === 2, 'análise: constância e meta proporcional aos meses');
  const V = E.analiseInvest({ C: E.compute(E.migratePlan({ year: 2026 }, () => 'z'), {}), meses: 12, itens: [] });
  ok(V.carteira.total === 0 && V.carteira.nEfetivo === 0 && V.proventos.yoc === null && V.proventos.cobertura === null && V.aporte.ritmo === null, 'análise: carteira vazia não gera divisão por zero');
}


// --- análise da renda
{
  const z12 = (arr) => arr.concat(new Array(12 - arr.length).fill(0));
  const C = { rendas: z12([10000, 10000, 12000, 10000]), dividendos: z12([100, 100, 100, 100]), receita: z12([10100, 10100, 12100, 10100]), despesas: z12([7000, 7000, 7000, 7000]),
    despCat: { fixa: z12([5000, 5000, 5000, 5000]) }, rendaCat: { fixa: z12([10000, 10000, 10000, 10000]), extra: z12([0, 0, 2000, 0]) } };
  const R = E.analiseRenda({ C, meses: 4, rendaCats: [{ id: 'fixa', nome: 'Renda fixa' }, { id: 'extra', nome: 'Renda extra' }],
    rendas: [{ id: 's', cat: 'fixa', nome: 'Salário', valores: z12([10000, 10000, 10000, 10000]) }, { id: 'f', cat: 'extra', nome: 'Freela', valores: z12([0, 0, 2000, 0]) }] });
  ok(R.nFontes === 2 && R.maior.nome === 'Salário' && R.maior.recorrente && !R.fontes[1].recorrente && Math.abs(R.pesoMaior - 40000 / 42000) < 1e-9, 'renda: fontes, maior fonte e recorrência');
  ok(Math.abs(R.previsibilidade - 40000 / 42000) < 1e-9 && R.recorrenteMes === 10000 && Math.abs(R.comprometimento - 0.5) < 1e-9, 'renda: previsibilidade e comprometimento dos gastos fixos');
  ok(R.ateAgora === 42400 && Math.abs(R.poupanca - (42400 - 28000) / 42400) < 1e-9 && Math.abs(R.passiva - 400 / 42400) < 1e-9 && R.reserva[0] === 42000, 'renda: poupança, renda passiva e reserva sugerida');
  ok(R.min === 10100 && R.max === 12100 && R.cv > 0 && R.cv < 0.1 && R.mesesSemRenda === 0, 'renda: estabilidade (mínimo, máximo e variação)');
  const V = E.analiseRenda({ C: { rendas: E.z(), dividendos: E.z(), receita: E.z(), despesas: E.z() }, meses: 12, rendas: [], rendaCats: [] });
  ok(V.nFontes === 0 && V.previsibilidade === null && V.poupanca === null && V.cv === null && V.comprometimento === null, 'renda: sem dados não gera divisão por zero');
}


// --- Central de notificações (regras automáticas)
{
  const doze = (v, ate) => new Array(12).fill(0).map((_, i) => (i < ate ? v : 0));
  const lanc = (mes, valor, area) => ({ id: 'l' + mes + valor, data: `2026-${String(mes + 1).padStart(2, '0')}-03`, valor, cat: 'variavel', area });
  const base = () => ({ v: 2, year: 2026, settings: { metaAporte: 1500, orcPadrao: 5000 }, rendaCats: E.CATS_RENDA(), catsDesp: E.CATS_DESP(),
    rendas: [{ id: 'r', cat: 'fixa', nome: 'Salário', valores: doze(8000, 9) }],
    despesas: [{ id: 'd', cat: 'fixa', area: 'Moradia', nome: 'Aluguel', valores: new Array(12).fill(2000) }],
    lancamentos: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((mm) => lanc(mm, 800, 'Mercado')).concat([lanc(9, 2600, 'Mercado')]),
    orcamento: new Array(12).fill(null), ativos: [{ id: 'a', tipo: 'BOLSA DE VALORES', classe: 'Ações BR', nome: 'ITSA4', ap: doze(1500, 9), pr: z12() }] });
  function z12() { return new Array(12).fill(0); }
  const rodar = (plan, hoje, extra) => E.notificacoes(Object.assign({ C: E.compute(plan, {}), plan, hoje, recursos: { investimentos: true, carteira: true } }, extra || {}));
  const ch = (L) => L.map((n) => n.chave);
  const out = rodar(base(), { ano: 2026, mes: 9, dia: 12 });
  ok(ch(out).includes('n_orc_90') && out.find((n) => n.chave === 'n_orc_90').id === 'orc:2026-10:90', 'orçamento: 92% do mês dispara o alerta de 90% com id do período');
  const area = out.find((n) => n.chave === 'n_area_alta');
  ok(area && area.vars.area === 'Mercado' && Math.abs(area.vars.media - 800) < 0.01 && area.cta.view === 'despesas' && area.cta.mes === 9, 'gasto atípico: Mercado bem acima da média dos meses anteriores');
  ok(ch(out).includes('n_entradas_falta') && !ch(out).includes('n_extrato'), 'lembrete do dia 5: sem entradas no mês; extrato já importado não gera lembrete');
  const ap = out.find((n) => n.chave === 'n_aporte_sobra');
  ok(ap && ap.nivel === 'oportunidade' && Math.abs(ap.vars.sobra - 5200) < 0.01 && ap.cta.view === 'inv' && ap.cta.rotulo === 'Aportar agora', 'aporte: sobra do mês anterior vira convite para aportar');
  ok(out.every((n, i) => i === 0 || { critico: 5, alerta: 4, oportunidade: 3, info: 2, positivo: 1 }[out[i - 1].nivel] >= { critico: 5, alerta: 4, oportunidade: 3, info: 2, positivo: 1 }[n.nivel]), 'avisos ordenados por gravidade');
  ok(new Set(out.map((n) => n.id)).size === out.length && JSON.stringify(rodar(base(), { ano: 2026, mes: 9, dia: 12 }).map((n) => n.id)) === JSON.stringify(out.map((n) => n.id)), 'ids únicos e estáveis entre execuções');

  const p2 = base(); p2.lancamentos.push(lanc(9, 900, 'Lazer'));
  const o2 = rodar(p2, { ano: 2026, mes: 9, dia: 12 });
  ok(o2[0].chave === 'n_orc_estouro' && o2[0].nivel === 'critico' && Math.abs(o2[0].vars.valor - 500) < 0.01 && o2[0].id === 'orc:2026-10:100', 'orçamento estourado é crítico, vem primeiro e muda o id (volta como novo)');

  const p3 = base(); p3.settings.orcPadrao = 10000; p3.lancamentos = p3.lancamentos.filter((l) => !l.data.startsWith('2026-10')).concat([lanc(9, 3000, 'Lazer')]);
  const o3 = rodar(p3, { ano: 2026, mes: 9, dia: 8 }); const rt = o3.find((n) => n.chave === 'n_orc_ritmo');
  ok(rt && rt.vars.projecao > 10500 && !ch(o3).includes('n_orc_75'), 'ritmo: metade do orçamento no dia 8 projeta estouro no fim do mês');

  ok(rodar(base(), { ano: 2027, mes: 0, dia: 10 }).length === 0, 'plano de outro ano não gera avisos');
  const vazio = base(); vazio.rendas = []; vazio.despesas = []; vazio.lancamentos = []; vazio.ativos = [];
  const ov = rodar(vazio, { ano: 2026, mes: 9, dia: 12 });
  ok(ov.length === 1 && ov[0].chave === 'n_comecar' && ov[0].cta.acao === 'ingest', 'sem dados: um único convite para começar');

  const o4 = rodar(base(), { ano: 2026, mes: 9, dia: 3 });
  const rs = o4.find((n) => n.chave === 'n_resumo_sobra');
  ok(rs && rs.vars.mesAnt === 'setembro' && Math.abs(rs.vars.valor - 5200) < 0.01 && rs.cta.mes === 8 && !ch(o4).includes('n_entradas_falta') && !ch(o4).includes('n_aporte_sobra'), 'início do mês: resumo do mês anterior; lembretes de entrada e aporte só depois');

  const p5 = base(); p5.lancamentos = p5.lancamentos.filter((l) => !l.data.startsWith('2026-10')).concat([lanc(9, 600, 'Mercado')]); p5.rendas[0].valores[9] = 8000; p5.ativos[0].ap[9] = 900;
  const o5 = rodar(p5, { ano: 2026, mes: 9, dia: 25 });
  const fc = o5.find((n) => n.chave === 'n_fechamento'); const af = o5.find((n) => n.chave === 'n_aporte_falta');
  ok(fc && fc.vars.dias === 6 && Math.abs(fc.vars.restante - 2400) < 0.01 && af && Math.abs(af.vars.falta - 600) < 0.01, 'dia 20 em diante: fechamento do mês e quanto falta para a meta de aporte');
  p5.ativos[0].ap[9] = 1620; p5.ativos[0].pr[9] = 120; // aporte novo = aplicado − proventos reinvestidos
  const o6 = rodar(p5, { ano: 2026, mes: 9, dia: 25 });
  ok(ch(o6).includes('n_meta_batida') && ch(o6).includes('n_proventos') && !ch(o6).includes('n_aporte_falta'), 'conquistas: meta de aporte batida e proventos recebidos');

  const K = { somaAlvo: 100, aporte: 1500, itens: [{ nome: 'IVVB11', pctAtual: 12, pctAlvo: 20, sug: 1100 }, { nome: 'ITSA4', pctAtual: 58, pctAlvo: 50, sug: 400 }, { nome: 'Tesouro IPCA', pctAtual: 30, pctAlvo: 30, sug: 0 }] };
  const o7 = rodar(base(), { ano: 2026, mes: 9, dia: 12 }, { carteira: K });
  const ab = o7.find((n) => n.chave === 'n_cart_abaixo_sug'); const ac = o7.find((n) => n.chave === 'n_cart_acima');
  ok(ab && ab.vars.ativo === 'IVVB11' && ab.vars.pp === 8 && ab.vars.valor === 1100 && ab.id === 'cart:abaixo:2026-10:ivvb11' && ab.cta.view === 'cart', 'carteira: ativo mais abaixo do alvo, com o valor sugerido do aporte');
  ok(ac && ac.vars.ativo === 'ITSA4' && ac.vars.pp === 8, 'carteira: ativo acima do alvo (evitar novos aportes nele)');
  const o8 = rodar(base(), { ano: 2026, mes: 9, dia: 12 }, { carteira: Object.assign({}, K, { somaAlvo: 90 }) });
  ok(ch(o8).includes('n_cart_alvo'), 'carteira: alvos que não somam 100% geram aviso');
  const o9 = rodar(base(), { ano: 2026, mes: 9, dia: 12 }, { carteira: K, recursos: { investimentos: false, carteira: false } });
  ok(!o9.some((n) => n.grupo === 'oportunidade' || /aporte|cart_|proventos/.test(n.chave)), 'plano sem investimentos: nenhum aviso de aporte ou carteira');
}

// --- Simulador "E se?" (juros compostos)
{
  const s0 = E.simularObjetivo({ patrimonio: 100000, aporte: 2000, extra: 0, retornoBase: 10, retorno: 10, alvo: 1000000 });
  ok(s0.base.meses === s0.sim.meses && s0.diferenca === 0 && s0.base.meses === E.mesesAteMeta(100000, 2000, 10, 1000000), 'simulador: sem mudança, mesmo prazo do cenário atual');
  const s1 = E.simularObjetivo({ patrimonio: 100000, aporte: 2000, extra: 1000, retornoBase: 10, retorno: 10, alvo: 1000000 });
  ok(s1.sim.meses < s1.base.meses && s1.diferenca === s1.base.meses - s1.sim.meses && s1.diferenca > 12, `simulador: aporte extra antecipa a meta (${s1.diferenca} meses)`);
  const s2 = E.simularObjetivo({ patrimonio: 100000, aporte: 2000, extra: 0, retornoBase: 10, retorno: 6, alvo: 1000000 });
  ok(s2.diferenca < 0, 'simulador: retorno menor adia a meta (diferença negativa)');
  const c = s1.sim; ok(c.final >= 1000000 && Math.abs(c.aportado - (100000 + 3000 * c.meses)) < 0.01 && Math.abs(c.juros - (c.final - c.aportado)) < 0.01 && c.juros > 0, 'simulador: separa o que veio dos aportes e o que veio dos juros');
  ok(s1.serieSim.length === s1.anos + 1 && s1.serieSim[0] === 100000 && s1.anos >= Math.ceil(s1.base.meses / 12), 'simulador: série anual cobre o prazo mais longo');
  const s3 = E.simularObjetivo({ patrimonio: 0, aporte: 0, extra: 0, retornoBase: 10, retorno: 10, alvo: 500000 });
  ok(s3.base.meses === null && s3.diferenca === null && s3.anos === 30, 'simulador: sem aporte e sem patrimônio, a meta não é atingida no limite');
  const s4 = E.simularObjetivo({ patrimonio: 600000, aporte: 1000, extra: 500, retornoBase: 10, retorno: 12, alvo: 500000 });
  ok(s4.base.meses === 0 && s4.sim.meses === 0, 'simulador: meta já alcançada');
}

// --- Linha do tempo multi-anos
{
  const doze = (v) => new Array(12).fill(v);
  const mk = (ano, renda, gasto, ap, pr) => ({ v: 2, year: ano, settings: { metaAporte: 0, orcPadrao: 0 }, rendaCats: E.CATS_RENDA(), catsDesp: E.CATS_DESP(), lancamentos: [], orcamento: doze(null),
    rendas: [{ id: 'r' + ano, cat: 'fixa', nome: 'Salário', valores: doze(renda) }], despesas: [{ id: 'd' + ano, cat: 'fixa', area: 'Moradia', nome: 'Aluguel', valores: doze(gasto) }],
    ativos: [{ id: 'a' + ano, tipo: 'FII', classe: 'FII', nome: 'HGLG11', ap: doze(ap), pr: doze(pr) }] });
  const plans = { 2024: mk(2024, 8000, 5000, 1000, 0), 2025: mk(2025, 10000, 6000, 2000, 50), 2026: mk(2026, 12000, 7000, 3000, 100), 2027: mk(2027, 1, 1, 1, 1) };
  const H = E.historico(plans, { patrimonioInicial: 50000, hoje: { ano: 2026, mes: 9 } });
  ok(H.anos.map((a) => a.ano).join() === '2024,2025,2026' && JSON.stringify(H.anosFuturos) === '[2027]', 'histórico: anos em ordem, sem anos futuros');
  ok(H.serie.length === 12 + 12 + 10 && H.serie[0].ano === 2024 && H.serie[H.serie.length - 1].mes === 9, 'histórico: série mensal contínua até o mês atual');
  ok(H.anos[0].patrimonioFim === 62000 && H.anos[1].patrimonioInicio === 62000 && H.anos[1].patrimonioFim === 86000 && H.anos[2].patrimonioFim === 116000, 'histórico: patrimônio encadeado entre os anos (dez/2024 vira o início de 2025)');
  const s26 = H.anos[2]; ok(s26.parcial && s26.meses === 10 && s26.entradas === 121000 && s26.gastos === 70000, 'histórico: ano corrente soma só até o mês atual');
  ok(H.totais.entradas === 96000 + 120600 + 121000 && H.totais.patrimonioInicio === 50000 && H.totais.patrimonioAtual === 116000 && Math.abs(H.totais.crescimentoPct - 1.32) < 1e-9, 'histórico: totais do período e crescimento');
  ok(H.destaques.rendaCresc && H.destaques.rendaCresc.de === 2024 && H.destaques.rendaCresc.para === 2025 && Math.abs(H.destaques.rendaCresc.pct - (120600 / 96000 - 1)) < 1e-9, 'histórico: crescimento da renda só entre anos completos');
  ok(H.destaques.melhorPoupanca.ano === 2026 && H.temHistorico, 'histórico: destaque de melhor poupança e histórico disponível');
  // âncora: patrimônio informado no diagnóstico de 2026; anos anteriores cadastrados depois não inflam o patrimônio de hoje
  const HA = E.historico(plans, { patrimonioInicial: 50000, ancora: 2026, hoje: { ano: 2026, mes: 9 } });
  ok(HA.anos[2].patrimonioInicio === 50000 && HA.anos[2].patrimonioFim === 80000 && HA.anos[0].patrimonioInicio === 50000 - 12000 - 24000 && HA.anos[1].patrimonioFim === 50000, 'âncora: o ano do diagnóstico parte do valor informado e os anos anteriores descontam os aportes');
  const c26a = E.ctxAno({ 2026: plans[2026] }, 2026, 50000, 2026); const c26b = E.ctxAno(plans, 2026, 50000, 2026);
  ok(c26a.prevAplicado === 0 && c26b.prevAplicado === 0 && E.ctxAno(plans, 2027, 50000, 2026).prevAplicado === 36000, 'âncora: registrar 2024 e 2025 não muda o ponto de partida de 2026');
  ok(E.ctxAno(plans, 2024, 10000, 2026).prevAplicado === -10000, 'âncora: antes do diagnóstico, o patrimônio de partida não fica negativo');
  const so = E.historico({ 2026: mk(2026, 1000, 500, 100, 0) }, { patrimonioInicial: 0, hoje: { ano: 2026, mes: 3 } });
  ok(so.anos.length === 1 && !so.temHistorico, 'histórico: um ano só ainda não forma linha do tempo');
  const vazio = mk(2025, 0, 0, 0, 0); const comLacuna = E.historico({ 2023: mk(2023, 0, 0, 0, 0), 2024: mk(2024, 5000, 3000, 500, 0), 2026: mk(2026, 6000, 3000, 500, 0) }, { patrimonioInicial: 1000, hoje: { ano: 2026, mes: 11 } });
  ok(comLacuna.anos[0].ano === 2024 && comLacuna.anos[1].lacuna && JSON.stringify(comLacuna.destaques.lacunas) === '[2026]' && vazio.year === 2025, 'histórico: ignora anos vazios no começo e marca lacunas');
}

// --- Múltiplos objetivos
{
  const leg = E.normObjetivos({ objetivo: { tipo: 'imovel', valor: 500000, ano: 2032 } });
  ok(leg.length === 1 && leg[0].tipo === 'imovel' && leg[0].pct === 100 && leg[0].ano === 2032 && leg[0].id, 'objetivos: perfil antigo vira lista com um objetivo (100%)');
  ok(E.normObjetivos({ objetivo: { tipo: 'imovel', valor: 0 } }).length === 0 && E.normObjetivos({}).length === 0, 'objetivos: objetivo antigo sem valor não é migrado');
  const sobra = E.normObjetivos({ objetivos: [{ id: 'a', tipo: 'xyz', valor: '100', pct: 80 }, { id: 'b', tipo: 'carro', valor: 50, pct: 70, ano: '2030' }] });
  ok(sobra[0].tipo === 'outro' && sobra[0].valor === 100 && sobra[0].pct + sobra[1].pct === 100 && sobra[1].ano === 2030, 'objetivos: limpa tipos e valores e reduz percentuais que passam de 100%');
  const H = { ano: 2026, mes: 9 };
  const objs = [{ id: 'ind', tipo: 'independencia', valor: 2000000, ano: 2045, pct: 60 }, { id: 'car', tipo: 'carro', valor: 90000, ano: 2028, pct: 30 }, { id: 'res', tipo: 'reserva', valor: 20000, ano: 2027, pct: 10 }];
  const A = E.analiseObjetivos({ objetivos: objs, patrimonio: 200000, aporte: 5000, retorno: 10, hoje: H });
  const car = A.itens[1]; const res = A.itens[2];
  ok(Math.abs(car.saldo - 60000) < 0.01 && Math.abs(car.aporte - 1500) < 0.01 && Math.abs(car.progresso - 60000 / 90000) < 1e-9 && car.prazo === 26, 'objetivos: saldo e aporte de cada meta pela fatia');
  ok(res.status === 'concluido' && res.progresso === 1, 'objetivos: meta com saldo suficiente fica concluída');
  ok(A.pctAlocado === 100 && A.livre === 0, 'objetivos: divisão completa');
  // aporte necessário: projetando com ele, chega ao valor no prazo
  const ind = A.itens[0]; const fv = E.projetar(ind.saldo, ind.necessario, 10, ind.prazo).pop();
  ok(Math.abs(fv - 2000000) < 1, `objetivos: aporte necessário cumpre o prazo (${Math.round(fv)})`);
  ok((ind.status === 'atrasado') === (ind.meses > ind.prazo) && (ind.status !== 'atrasado' || ind.extra > 0), 'objetivos: status no prazo/atrasado coerente com a previsão');
  const semDiv = E.analiseObjetivos({ objetivos: [{ id: 'x', tipo: 'viagem', valor: 30000, ano: 2027, pct: 0 }], patrimonio: 100000, aporte: 1000, retorno: 10, hoje: H });
  ok(semDiv.itens[0].status === 'sem-divisao' && semDiv.livre === 100, 'objetivos: meta sem fatia pede divisão');
  const sug = E.sugerirDivisao({ objetivos: objs, retorno: 10, hoje: H });
  ok(sug.ind + sug.car + sug.res === 100 && sug.car > sug.res && Object.values(sug).every((v) => Number.isInteger(v)), `objetivos: divisão sugerida soma 100% e pesa urgência e valor (${JSON.stringify(sug)})`);
  ok(E.aporteNecessario(0, 1200, 0, 12) === 100 && E.aporteNecessario(500, 400, 10, 12) === 0 && E.aporteNecessario(100, 400, 10, 0) === 300, 'objetivos: aporte necessário sem juros, já atingido e prazo vencido');
}

// --- análise dos gastos (aba Gastos)
{
  const cats = E.CATS_DESP(); const fixa = cats.find((c) => c.id === 'fixa').id; const varia = cats.find((c) => c.id !== 'fixa').id;
  const ents = [];
  [0, 1, 2].forEach((m) => {
    ents.push({ m, dia: 0, valor: 2000, cat: fixa, area: 'Moradia', nome: 'Aluguel', tipo: 'prev' });
    ents.push({ m, dia: 5, valor: 39.9, cat: varia, area: 'Assinaturas', nome: `PAG*NETFLIX.COM ${m + 1}/12`, tipo: 'real' });
    ents.push({ m, dia: m === 2 ? 3 : 10, valor: [500, 600, 1300][m], cat: varia, area: 'Mercado', nome: 'SUPERMERCADO BOA VISTA 0412', tipo: 'real' });
  });
  ents.push({ m: 2, dia: 20, valor: 300, cat: varia, area: 'Restaurantes', nome: 'RESTAURANTE SOL', tipo: 'real' });
  ents.push({ m: 2, dia: 21, valor: -40, cat: varia, area: 'Mercado', nome: 'ESTORNO MERCADO', tipo: 'real' });
  const orc = new Array(12).fill(0); orc[2] = 3000;
  const G = E.analiseGastos({ ano: 2026, mes: 2, meses: 3, entradas: ents, catsDesp: cats, orcamento: orc, hoje: { mes: 2, dia: 10 },
    parcelados: [{ nome: 'TV', cat: varia, parcel: { total: 1200, n: 12, ano: 2026, mes: 0 } }] });
  ok(Math.abs(G.total - 3599.9) < 0.01 && Math.abs(G.restante - (3000 - 3599.9)) < 0.01 && G.uso > 1, `gastos: total do mês com estorno e orçamento (${G.total})`);
  ok(Math.abs(G.base - 2589.9) < 0.01 && G.baseMeses === 2 && G.delta > 0.38 && G.delta < 0.40, 'gastos: comparação com a média dos meses anteriores');
  ok(Math.abs(G.pctFixos - 2000 / 3599.9) < 1e-6 && G.porCat[0].k === fixa, 'gastos: peso dos fixos e categoria principal');
  ok(G.ritmo.dias === 31 && Math.abs(G.ritmo.acum[30] - G.total) < 0.01 && Math.abs(G.ritmo.acum[0] - 2000) < 0.01 && G.ritmo.diaAtual === 10, 'gastos: acumulado dia a dia (previstos no dia 1)');
  ok(Math.abs(G.ritmo.projecao - (2000 + (1599.9 / 10) * 31)) < 0.02 && G.ritmo.cabeDia === 0, 'gastos: projeção do mês e folga diária');
  ok(G.mudou.some((x) => x.nome === 'Mercado' && x.dif > 600) && G.mudou.some((x) => x.nome === 'Restaurantes' && x.pct === null) && G.mudou.every((x) => x.dif > 0), 'gastos: o que mudou (só altas no mês corrente)');
  ok(G.recorrentes.length === 1 && /NETFLIX/.test(G.recorrentes[0].nome) && G.recorrentes[0].meses === 3 && Math.abs(G.recorrentes[0].media - 39.9) < 0.01, 'gastos: assinatura detectada, mercado com valor variável não');
  ok(E.nomeEstab('PAG*NETFLIX.COM 3/12') === E.nomeEstab('Compra cartão NETFLIX COM') && E.nomeEstab('PIX 123') === '', 'gastos: nome do estabelecimento normalizado');
  ok(G.estab[0].k === E.nomeEstab('SUPERMERCADO BOA VISTA') && G.estab.length === 3, 'gastos: onde mais compra');
  ok(G.parcelas.length === 1 && G.parcelas[0].i === 3 && Math.abs(G.parcelas[0].valor - 100) < 0.01 && Math.abs(G.parcelas[0].restante - 900) < 0.01, 'gastos: parcelamento em andamento');
  ok(Math.abs(G.semana[new Date(2026, 2, 5).getDay()] - 39.9) < 0.01 && G.top[0].valor === 2000, 'gastos: dia da semana e maiores gastos');
  const A = E.analiseGastos({ ano: 2026, mes: -1, meses: 3, entradas: ents, catsDesp: cats, orcamento: orc });
  ok(Math.abs(A.total - (2539.9 + 2639.9 + 3599.9)) < 0.01 && Math.abs(A.mediaMes - A.total / 3) < 0.01 && A.ritmo === null && A.delta === null, 'gastos: visão do ano');
  ok(Math.abs(E.sum(A.porMes) - A.total) < 0.01 && Math.abs(A.fixosMes[0] - 2000) < 0.01 && Math.abs(A.variaveisMes[2] - 1599.9) < 0.01, 'gastos: fixos e variáveis por mês');
}

// --- análise da carteira contra o alvo (aba Carteira)
{
  const itens = [{ nome: 'A', classe: 'RF', tipo: 'RENDA FIXA', alvo: 50, valor: 6000, preco: 100 }, { nome: 'B', classe: 'Ações', tipo: 'BOLSA', alvo: 30, valor: 1000, preco: 25 }, { nome: 'C', classe: 'FII', tipo: 'BOLSA', alvo: 20, valor: 3000 }];
  const K = E.analiseCarteira({ itens, aporte: 2000 });
  ok(Math.abs(K.itens[1].sug - 2000) < 0.01 && K.itens[0].sug === 0 && K.itens[1].cotas === 80 && K.itens[2].cotas === null, 'carteira: aporte vai para o que está mais abaixo do alvo, com cotas');
  ok(Math.abs(K.itens[1].pctDepois - 25) < 1e-9 && Math.abs(K.itens[1].desvio + 20) < 1e-9 && Math.abs(K.itens[1].falta - 600) < 0.01, 'carteira: posição depois do aporte e quanto ainda falta');
  ok(Math.abs(K.aderencia - 0.8) < 1e-9 && K.aderenciaDepois > K.aderencia && K.foraDoAlvo === 3 && K.maisLonge[0].nome === 'B', 'carteira: aderência ao alvo e ativos mais longe');
  ok(K.mesesEquilibrio === 3, `carteira: chega ao alvo em 3 aportes sem vender (${K.mesesEquilibrio})`);
  const cls = K.classes.find((c) => c.classe === 'Ações'); ok(Math.abs(cls.atual - 10) < 1e-9 && Math.abs(cls.alvo - 30) < 1e-9 && Math.abs(cls.depois - 25) < 1e-9, 'carteira: equilíbrio por classe');
  const eq = E.analiseCarteira({ itens: [{ nome: 'A', classe: 'RF', alvo: 50, valor: 500 }, { nome: 'B', classe: 'RV', alvo: 50, valor: 500 }], aporte: 100 });
  ok(eq.mesesEquilibrio === 0 && eq.foraDoAlvo === 0 && eq.aderencia === 1, 'carteira: já no alvo');
  const sem = E.analiseCarteira({ itens: [{ nome: 'A', classe: 'RF', alvo: 0, valor: 500 }], aporte: 100 });
  ok(sem.aderencia === null && sem.mesesEquilibrio === null && sem.maisLonge.length === 0, 'carteira: sem alvos definidos');
}

process.exit(bad ? 1 : 0);
