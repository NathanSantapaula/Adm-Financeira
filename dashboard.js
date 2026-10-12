/* Visão geral: tela de boas-vindas com estatísticas e gráficos que contam a história do planejamento. */
'use strict';
const mesRef = () => (S.year === NOW_Y ? NOW_M : S.mes);
const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

function areasDoAno() {
  const map = new Map();
  S.plan.despesas.concat(planCtx().carry).forEach((it) => { const v = E.sum(E.itemValores(it, S.year)); if (v > 0) map.set(it.area, (map.get(it.area) || 0) + v); });
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
}

function composicao() {
  if (!S.plan.ativos.length) return [];
  const M = cartModel(); const map = new Map();
  M.items.forEach((i) => { map.set(i.a.classe, (map.get(i.a.classe) || 0) + i.valor); });
  return [...map.entries()].map(([label, value]) => ({ label, value })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
}

function metaDoAporte() { return +S.plan.settings.metaAporte || 0; }

function projecaoObjetivo() {
  const ob = S.profile.objetivo || {}; const C = S.C; const patr = C.patrimonio[11];
  const aporte = metaDoAporte() || (C.T.aportes > 0 ? C.T.aportes / Math.max(1, S.year === NOW_Y ? NOW_M + 1 : 12) : 0);
  const meses = E.mesesAteMeta(patr, aporte, S.profile.retornoAnual, +ob.valor || 0);
  return { ob, patr, aporte, meses, ano: meses != null ? NOW_Y + Math.floor((NOW_M + meses) / 12) : null };
}

function insights() {
  const C = S.C; const T = C.T; const m = mesRef(); const out = []; const mn = MES_LONGO[m];
  if (T.receita === 0 && T.despesas === 0) { out.push({ t: 'info', x: 'Comece registrando suas rendas e seus gastos. Em poucos minutos o painel mostra para onde vai o seu dinheiro.', a: ['nav', 'rendas', 'Cadastrar rendas'] }); }
  if (C.orcamento[m] > 0) {
    const u = C.usoOrc[m];
    if (u > 1) out.push({ t: 'neg', x: `Você já passou do orçamento de ${mn} em ${brl0(-C.restante[m])}. Vale rever os gastos do mês.`, a: ['nav', 'despesas', 'Ver gastos'] });
    else out.push({ t: u > 0.85 ? 'warn' : 'pos', x: `Você usou ${pct(u)} do orçamento de ${mn}. Ainda restam ${brl0(C.restante[m])}.`, a: ['nav', 'despesas', 'Ver gastos'] });
  } else if (T.despesas > 0) out.push({ t: 'info', x: `Defina um orçamento para ${mn} e acompanhe quanto ainda pode gastar.`, a: ['nav', 'despesas', 'Definir orçamento'] });
  if (T.poupanca != null && T.receita > 0) out.push({ t: T.poupanca >= 0.2 ? 'pos' : 'info', x: `Em ${S.year}, ${pct(T.poupanca)} da sua renda sobrou para investir (${brl0(T.investAlocado)}).` });
  const ma = metaDoAporte();
  if (ma > 0 && C.aportes[m] !== 0) out.push({ t: C.aportes[m] >= ma ? 'pos' : 'info', x: `Em ${mn} você aportou ${brl0(C.aportes[m])}, ${pct(C.aportes[m] / ma)} da meta mensal de ${brl0(ma)}.` });
  if (!gated('cart') && S.plan.ativos.length) {
    try { const M = cartModel(); if (M.rb.W > 0) { const w = M.items.slice().sort((a, b) => a.desvio - b.desvio)[0]; if (w && w.desvio < -1) out.push({ t: 'info', x: `${w.a.nome} está ${Math.abs(w.desvio).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p. abaixo do alvo. O próximo aporte deve priorizá-lo.`, a: ['nav', 'cart', 'Ver onde investir'] }); } } catch (e) { /* sem carteira */ }
  }
  return out.slice(0, 4);
}

function proximosPassos() {
  const p = S.plan; const T = S.C.T; const steps = [];
  if (!p.rendas.some((r) => E.sum(r.valores) > 0)) steps.push(['Cadastre suas rendas', 'rendas']);
  if (!(T.orcamento > 0)) steps.push(['Defina o orçamento do mês', 'despesas']);
  if (!p.despesas.length) steps.push(['Registre seus primeiros gastos', 'despesas']);
  if (!(T.aplicado > 0)) steps.push(['Registre seus aportes', 'inv']);
  if (!gated('cart') && p.ativos.length && !S.profile.carteira.some((e) => e.alvo > 0)) steps.push(['Defina o alvo da sua carteira', 'cart']);
  return steps.slice(0, 3);
}

function viewGeral() {
  const p = S.plan; const C = S.C; const T = C.T; const pr = S.profile; const m = mesRef();
  const nome = (pr.nome || '').split(' ')[0] || 'por aqui';
  const pj = projecaoObjetivo(); const objVal = +pj.ob.valor || 0;
  const progObj = objVal > 0 ? Math.min(1, pj.patr / objVal) : 0;
  const ganho = C.patrimonio[11] - C.patrimonioBase;
  const ins = insights(); const passos = proximosPassos();
  const mesesDiv = C.dividendos.filter((x) => x > 0).length;
  const orcTone = C.usoOrc[m] == null ? '' : C.usoOrc[m] > 1 ? 'neg' : C.usoOrc[m] > 0.85 ? 'warn' : '';
  const progMeta = C.metaAno > 0 ? Math.min(1, T.aplicado / C.metaAno) : 0;
  const comp = composicao(); const areas = areasDoAno();
  const tot = comp.reduce((a, b) => a + b.value, 0);
  const palette = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  const objetivoTxt = objVal > 0
    ? (pj.meses === 0 ? 'Você já alcançou o valor do objetivo.' : pj.ano ? `Previsto para ${pj.ano}, mantendo o ritmo atual de aportes.` : 'Defina a meta de aportes para projetar o prazo.')
    : 'Defina o valor do seu objetivo em Painel > Metas.';
  return `<div class="welcome"><div><p class="greet">${saudacao()}, ${esc(nome)}.</p><h1 class="wh">Seu planejamento de ${p.year}, em um relance.</h1></div>${yearControl()}</div>

  <div class="dgrid">
    <section class="card hero-card"><div class="c-k">Patrimônio estimado</div><div class="c-big">${brl0(C.patrimonio[11])}</div>
      <div class="c-d ${ganho >= 0 ? 'pos' : 'neg'}">${ganho >= 0 ? '+' : '−'} ${brl0(Math.abs(ganho))} aportados em ${p.year}</div><div class="chart" id="d-patr"></div>
      <p class="cap">Patrimônio informado no diagnóstico (${brl0(pr.patrimonioInicial)}) somado aos aportes registrados. Valores a custo, sem a variação de mercado.</p></section>
    <section class="card goal-card"><div class="c-k">Objetivo: ${esc(objNome(pj.ob.tipo || 'independencia'))}</div><div class="goal-ring">${ring(progObj, { size: 132, stroke: 12, label: objVal > 0 ? pct(progObj) : '–', sub: objVal > 0 ? 'do objetivo' : '', aria: 'Progresso do objetivo' })}</div>
      <div class="c-d">${objVal > 0 ? `${brl0(pj.patr)} de ${brl0(objVal)}${pj.ob.ano ? ' até ' + pj.ob.ano : ''}` : 'Objetivo sem valor definido'}</div><p class="cap">${objetivoTxt} Projeção com retorno hipotético de ${S.profile.retornoAnual}% ao ano, sem promessa de resultado.</p></section>
  </div>

  <div class="stats4">
    <div class="stat"><div class="c-k">Taxa de poupança em ${p.year}</div><div class="c-num">${T.poupanca == null ? '–' : pct(T.poupanca)}</div><div class="c-n">${T.receita > 0 ? `${brl0(T.investAlocado)} sobraram para investir` : 'Cadastre suas rendas para calcular'}</div></div>
    <div class="stat"><div class="c-k">Orçamento de ${MES_LONGO[m]}</div><div class="c-num ${orcTone}">${C.usoOrc[m] == null ? '–' : pct(C.usoOrc[m])}</div><div class="bar ${orcTone}"><i style="width:${Math.min(100, (C.usoOrc[m] || 0) * 100)}%"></i></div><div class="c-n">${C.orcamento[m] > 0 ? (C.restante[m] >= 0 ? `Restam ${brl0(C.restante[m])}` : `${brl0(-C.restante[m])} acima do orçado`) : 'Sem orçamento definido'}</div></div>
    <div class="stat"><div class="c-k">Aportes na meta do ano</div><div class="c-num">${C.metaAno > 0 ? pct(progMeta) : '–'}</div><div class="bar"><i style="width:${progMeta * 100}%"></i></div><div class="c-n">${brl0(T.aplicado)} de ${brl0(C.metaAno)}</div></div>
    <div class="stat"><div class="c-k">Dividendos em ${p.year}</div><div class="c-num">${brl0(T.dividendos)}</div><div class="c-n">${mesesDiv ? `média de ${brl0(T.dividendos / mesesDiv)} por mês com pagamento` : 'Nenhum provento registrado'}</div></div>
  </div>

  <div class="dgrid two">
    <section class="card"><div class="c-h"><h3>Para onde foi cada mês</h3><div class="legend"><span><i style="background:var(--c2)"></i>Gastos</span><span><i style="background:var(--c1)"></i>Sobra para investir</span></div></div><div class="chart" id="d-flow"></div></section>
    <section class="card"><div class="c-h"><h3>Orçamento e gastos</h3><div class="legend"><span><i style="background:var(--c2)"></i>Gasto</span><span><i class="mk" style="background:var(--c4)"></i>Orçado</span></div></div><div class="chart" id="d-orc"></div></section>
  </div>

  <div class="dgrid two">
    <section class="card"><div class="c-h"><h3>Composição da carteira</h3></div>${tot > 0 ? `<div class="comp"><div class="donut" id="d-donut"></div><ul class="comp-l">${comp.map((c, i) => `<li><i style="background:${palette[i % 6]}"></i><span>${esc(c.label)}</span><b>${pct(c.value / tot)}</b></li>`).join('')}</ul></div>` : '<p class="empty-s">Registre aportes em Investimentos para ver a composição da carteira.</p>'}</section>
    <section class="card"><div class="c-h"><h3>Onde você mais gasta</h3></div>${areas.length ? hbars(areas, brl0) : '<p class="empty-s">Cadastre gastos em Conta corrente para ver o ranking das suas áreas de gasto.</p>'}</section>
  </div>

  <div class="dgrid two">
    <section class="card"><div class="c-h"><h3>O que o painel está vendo</h3></div>${ins.length ? `<ul class="ins">${ins.map((i) => `<li class="${i.t}"><i></i><span>${esc(i.x)}${i.a ? ` <button class="lnk strong" data-act="${i.a[0]}" data-view="${i.a[1]}">${esc(i.a[2])}</button>` : ''}</span></li>`).join('')}</ul>` : '<p class="empty-s">Quando houver movimento no mês, os destaques aparecem aqui.</p>'}</section>
    <section class="card advisor-card"><div class="c-h"><h3>${passos.length ? 'Próximos passos' : 'Revisão com o ' + esc(primeiroNome())}</h3></div>
      ${passos.length ? `<ul class="steps">${passos.map((s) => `<li><span>${esc(s[0])}</span><button class="btn sm" data-act="nav" data-view="${s[1]}">Abrir</button></li>`).join('')}</ul>` : `<p class="mmsg">Seu planejamento está em dia. Que tal levar estes números para a revisão mensal com ${esc(CFG.consultor)}?</p>`}
      <div class="adv-line"><p class="cap">Dúvidas sobre o seu momento financeiro?</p><div class="btn-row"><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></div></section>
  </div>`;
}

function drawDashboard() {
  if (S.screen !== 'app' || S.view !== 'geral' || !S.plan) return;
  const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1; const sobra = C.investAlocado.map((v) => Math.max(0, v));
  chartLine($('#d-patr'), { height: 200, zoom: C.patrimonio[11] > 0 && C.patrimonio[0] > 0, labels: MES, aria: 'Evolução do patrimônio ao longo do ano', series: [{ color: 'var(--c1)', values: C.patrimonio, area: true }],
    tip: (i) => `<b>${MES[i]}</b><br>Patrimônio: ${brl0(C.patrimonio[i])}<br>Aportes no mês: ${brl0(C.aplicado[i])}` });
  chartBars($('#d-flow'), { labels: MES, cur, aria: 'Gastos e sobra para investir por mês', bars: [{ color: 'var(--c2)', values: C.despesas }, { color: 'var(--c1)', values: sobra }],
    tip: (i) => `<b>${MES[i]}</b><br>Entradas: ${brl0(C.receita[i])}<br>Gastos: ${brl0(C.despesas[i])}<br>Sobra: ${brl0(C.investAlocado[i])}` });
  chartBars($('#d-orc'), { labels: MES, cur, aria: 'Gastos comparados com o orçamento de cada mês', bars: [{ color: 'var(--c2)', values: C.despesas }], marks: [{ color: 'var(--c4)', values: C.orcamento }],
    tip: (i) => `<b>${MES[i]}</b><br>Gasto: ${brl0(C.despesas[i])}<br>Orçado: ${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : 'sem orçamento'}` });
  const comp = composicao(); const tot = comp.reduce((a, b) => a + b.value, 0); const palette = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  if (tot > 0) chartDonut($('#d-donut'), { aria: 'Composição da carteira por classe de ativo', title: brl0(tot), sub: 'em ativos', items: comp.map((c, i) => ({ label: c.label, value: c.value, color: palette[i % 6] })) });
}
