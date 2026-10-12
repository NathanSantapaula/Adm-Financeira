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
process.exit(bad ? 1 : 0);
