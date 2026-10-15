/* Investimentos, Proventos e Carteira (alocação-alvo e onde investir a cada aporte). */
'use strict';
function assetRows(nodes, kind, field, flt, depth) {
  let h = '';
  for (const n of nodes) {
    if (n.leaf) {
      if (flt && !n.label.toLowerCase().includes(flt)) continue;
      const ri = RI++;
      h += `<tr><td class="lab"><div class="in" style="--d:${depth}"><span class="chev-sp"></span><button class="lnk" data-act="edit-ativo" data-id="${n.asset.id}">${esc(n.label)}</button></div></td>${cells(n.v, { k: field, id: n.asset.id, ri })}</tr>`;
    } else {
      const inner = assetRows(n.children, kind, field, flt, depth + 1);
      if (flt && !inner) continue;
      const open = flt ? true : !S.closed[kind].has(n.key);
      h += groupRow({ label: n.label, depth, v: n.v, kind, key: n.key, open }) + (open ? inner : '');
    }
  }
  return h;
}
function groupKeys(nodes, out) { for (const n of nodes) if (!n.leaf) { out.push(n.key); groupKeys(n.children, out); } return out; }

/* ---------- Investimentos e Proventos: painel de estudo + planilha recolhível ---------- */
const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
const mesesDecorridos = () => (S.year === NOW_Y ? NOW_M + 1 : 12);
function analiseAtual() {
  const M = cartModel();
  return E.analiseInvest({ C: S.C, meses: mesesDecorridos(), metaAporte: +S.plan.settings.metaAporte || 0,
    itens: M.items.map((i) => ({ nome: i.a.nome, tipo: i.a.tipo, classe: i.a.classe, valor: i.valor, ap: i.a.ap, pr: i.a.pr })) });
}
const kpi = (rot, val, sub, extra, cls) => `<section class="kpi${cls ? ' ' + cls : ''}"><small class="kpi-k">${rot}</small><div class="kpi-v">${val}</div>${extra || ''}<p class="kpi-s">${sub}</p></section>`;
const barra = (f, tom) => `<span class="kbar${tom ? ' ' + tom : ''}" aria-hidden="true"><i style="width:${(Math.max(0, Math.min(1, f || 0)) * 100).toFixed(1)}%"></i></span>`;
const legenda = (itens) => `<ul class="leg">${itens.map(([c, l]) => `<li><i style="background:${c}"></i>${esc(l)}</li>`).join('')}</ul>`;
const ateMes = () => (S.year === NOW_Y ? ` até ${MES_LONGO[NOW_M]}` : '');
const fmt1 = (v) => (+v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function planilhaHtml(kind) {
  const p = S.plan; const C = S.C; const field = kind === 'inv' ? 'ap' : 'pr'; const flt = (S.filter[kind] || '').trim().toLowerCase();
  const tree = E.buildAssetTree(p.ativos, field); RI = 0; FIRST_ED = true; let b = '';
  if (kind === 'inv') b += labRow('Sobra do mês (entradas menos gastos)', C.investAlocado, { cls: 'r-note' });
  const rows = assetRows(tree, kind, field, flt, 0); b += rows;
  if (flt && !rows) b += `<tr class="r-note"><td class="lab" colspan="14"><div class="in"><span>Nenhum ativo encontrado para “${esc(S.filter[kind])}”.</span></div></td></tr>`;
  if (kind === 'inv') {
    b += labRow('Aportes', C.aportes, { cls: 'r-g' }) + labRow('Dividendos reinvestidos', C.dividendos, { cls: 'r-g' }) + labRow('Total aplicado no mês', C.aplicado, { cls: 'r-total' })
      + labRow('Diferença (sobra do mês menos aportes)', C.diferenca, { cls: 'r-g' }) + labRow('Meta (aporte mensal mais dividendos)', C.meta, { cls: 'r-total' });
  } else b += labRow('Rentabilidade da renda fixa', C.rentab, { cls: 'r-g' }) + labRow('Dividendos', C.dividendos, { cls: 'r-g' }) + labRow('Total de proventos', C.faturamento, { cls: 'r-total' });
  const aberto = !!S.planilha[kind];
  const tools = `<div class="sheet-tools"><input class="search" type="search" data-filter="${kind}" placeholder="Buscar ativo" value="${esc(S.filter[kind])}" aria-label="Buscar ativo"><button class="btn sm" data-act="expand-all" data-kind="${kind}">Expandir</button><button class="btn sm" data-act="collapse-all" data-kind="${kind}">Recolher</button></div>`;
  return `<section class="sheet-sec" data-open="${aberto}"><button class="sheet-tg" data-act="planilha-toggle" data-kind="${kind}" aria-expanded="${aberto}"><span class="macc-ch">${I.chev}</span><span><b>Planilha mês a mês</b><small>${kind === 'inv' ? 'Aportes e resgates de cada ativo. Valores negativos são resgates.' : 'Proventos de cada ativo. Em renda fixa, o valor conta como rentabilidade.'}</small></span></button>
    ${aberto ? `${tools}<div class="tablewrap"><table class="grid">${headRow('Tipo, classe e ativo')}<tbody>${b}</tbody></table></div>` : ''}</section>`;
}

function vazioInvest(kind) {
  return `<section class="cc-empty"><div class="cc-empty-ic" aria-hidden="true">${I[kind === 'inv' ? 'inv' : 'pro']}</div><div class="cc-empty-tx"><h3>${kind === 'inv' ? 'Traga sua carteira em um minuto' : 'Seus proventos aparecem aqui'}</h3>
    <p>${kind === 'inv' ? 'Baixe o extrato de movimentação na Área do Investidor da B3 e solte aqui: aportes, resgates e proventos de todas as corretoras entram de uma vez.' : 'Importe o extrato de movimentação da B3 para trazer dividendos, JCP e rendimentos de cada ativo, mês a mês.'}</p></div>
    <div class="cc-empty-acts"><button class="btn primary lg" data-act="ingest-open" data-modo="corretora">Importar da corretora</button><button class="btn ghost" data-act="add-ativo">Adicionar ativo manualmente</button></div></section>`;
}

/* widgets organizáveis de Investimentos e Proventos (mesmo sistema da Visão geral; ver telaWidgetsHtml) */
const INV_WIDGETS = [
  { id: 'indicadores', nome: () => 'Indicadores dos investimentos', desc: 'Aportado no ano, ritmo da meta, constância e diversificação.', tam: 6, tams: [6], padrao: () => true },
  { id: 'aportes', nome: () => 'Aportes mês a mês', desc: 'Aportes e dividendos reinvestidos de cada mês, com a meta.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'onde', nome: () => 'Onde está o dinheiro', desc: 'Composição por classe e renda fixa contra a referência do perfil.', tam: 2, tams: [2, 3, 4], padrao: () => true },
  { id: 'posicoes', nome: () => 'Maiores posições', desc: 'Os ativos com mais dinheiro, a custo.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'estudar', nome: () => 'Para estudar', desc: 'Concentração, desvio do perfil, projeção ilustrativa e meses sem aporte.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
];
const PRO_WIDGETS = [
  { id: 'indicadores', nome: () => 'Indicadores dos proventos', desc: 'Recebido no ano, média por mês, yield on cost e cobertura dos gastos.', tam: 6, tams: [6], padrao: () => true },
  { id: 'mensal', nome: () => 'Proventos mês a mês', desc: 'Dividendos e renda fixa de cada mês.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'independencia', nome: () => 'Número da independência', desc: 'Quanto precisaria estar investido para os proventos pagarem seus gastos.', tam: 2, tams: [2, 3, 4], padrao: () => true },
  { id: 'pagadores', nome: () => 'Quem mais paga', desc: 'Ranking dos ativos que mais pagaram proventos no ano.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'calendario', nome: () => 'Calendário de pagamentos', desc: 'Em que meses cada ativo pagou.', tam: 3, tams: [3, 4, 6], padrao: () => true },
];
function painelInvest(A) {
  const ap = A.aporte; const ca = A.carteira; const pr = S.profile; const ret = +pr.retornoAnual || 0;
  const k1 = kpi(`Aportado em ${S.year}`, `<span class="num">${brl0(ap.ano)}</span>`, ap.ano > 0 ? `Média de ${brl0(ap.mediaMes)} por mês${ateMes()}.` : 'Nenhum aporte registrado ainda.');
  const k2 = ap.meta > 0
    ? kpi('Ritmo da meta de aporte', pct(ap.ritmo), ap.ritmo >= 1 ? `Acima da meta: ${brl0(ap.ateAgora - ap.metaAte)} a mais${ateMes()}.` : `Faltam ${brl0(ap.faltaMeta)} para a meta de ${brl0(ap.meta)} por mês${ateMes()}.`, barra(ap.ritmo, ap.ritmo >= 1 ? 'ok' : ap.ritmo < 0.6 ? 'warn' : ''))
    : kpi('Ritmo da meta de aporte', '–', '<button class="lnk strong" data-act="admin-open">Definir a meta mensal</button> para acompanhar o ritmo.');
  const dots = `<span class="dots" aria-hidden="true">${MES.map((m, i) => `<i class="${ap.porMes[i] ? 'on' : i >= ap.meses ? 'fut' : ''}" title="${m}"></i>`).join('')}</span>`;
  const k3 = kpi('Constância', `${ap.mesesComAporte} <small>de ${ap.meses} meses</small>`, 'com aporte. Aportar todo mês pesa mais que acertar o momento.', dots);
  const k4 = ca.n ? kpi('Diversificação', `≈ ${fmt1(ca.nEfetivo)} <small>${ca.nEfetivo < 1.5 ? 'ativo' : 'ativos'}</small>`, `de peso igual equivalem à sua carteira de ${ca.n}. Maior posição: ${esc(ca.maior.nome)} (${pct(ca.maior.peso)}).`)
    : kpi('Diversificação', '–', 'Sem posições ainda.');
  const leg = legenda([['var(--c1)', 'Aportes'], ['var(--c3)', 'Dividendos reinvestidos'], ...(ap.meta > 0 ? [['var(--c4)', 'Meta']] : [])]);
  const comp = ca.porClasse.length ? `<div class="comp v"><div class="donut" id="inv-donut"></div><ul class="comp-l">${ca.porClasse.map((c, i) => `<li><i style="background:${PAL[i % 6]}"></i><span>${esc(c.label)}</span><b>${pct(c.peso)}</b></li>`).join('')}</ul></div>` : '<p class="empty-s">As posições aparecem depois do primeiro aporte.</p>';
  const perfil = pr.perfilInvestidor && E.PERFIS[pr.perfilInvestidor.resultado];
  const rfBar = ca.total > 0 ? `<div class="rfbv"><div class="rfbv-l"><span>Renda fixa <b>${pct(ca.pesoRF)}</b></span><span>Renda variável <b>${pct(ca.pesoBolsa)}</b></span></div><span class="rfbv-t"><i style="width:${(ca.pesoRF * 100).toFixed(1)}%"></i>${perfil ? `<em style="left:${perfil.alvo.rendaFixa}%" title="Referência do perfil ${esc(perfil.nome)}"></em>` : ''}</span>${perfil ? `<small>Marca: referência do perfil ${esc(perfil.nome)} (${perfil.alvo.rendaFixa}% em renda fixa).</small>` : ''}</div>` : '';
  const top = ca.posicoes.slice(0, 8);
  const ins = [];
  if (ca.maior) ins.push(ca.maior.peso > 0.25 ? ['warn', `<b>${esc(ca.maior.nome)}</b> concentra ${pct(ca.maior.peso)} da carteira. Se ele cair 20%, a carteira inteira cai ${pct(ca.maior.peso * 0.2, 1)}.`] : ['ok', `Nenhum ativo passa de 25% da carteira: o risco de um único ativo está diluído.`]);
  if (perfil && ca.total > 0) { const dif = (ca.pesoRF * 100) - perfil.alvo.rendaFixa; ins.push([Math.abs(dif) > 10 ? 'warn' : 'ok', `Perfil ${esc(perfil.nome)}: referência de ${perfil.alvo.rendaFixa}% em renda fixa. Você está com ${pct(ca.pesoRF)}${Math.abs(dif) > 10 ? `, ${fmt1(Math.abs(dif))} pontos percentuais ${dif > 0 ? 'acima' : 'abaixo'}. A aba Carteira mostra onde colocar o próximo aporte para reequilibrar.` : ', dentro da faixa.'}`]); }
  if (ap.mediaMes > 0) { const fv = E.projetar(ca.total, ap.mediaMes, ret, 120).pop(); ins.push(['info', `Mantendo ${brl0(ap.mediaMes)} por mês e retorno hipotético de ${fmt1(ret)}% ao ano, a carteira chegaria a <b>${brl0(fv)}</b> em 10 anos, sendo ${brl0(ca.total + ap.mediaMes * 120)} de dinheiro aportado. O resto é efeito dos juros compostos. Ilustração, não promessa.`]); }
  if (ap.meses - ap.mesesComAporte >= 2) ins.push(['info', `${ap.meses - ap.mesesComAporte} meses sem aporte em ${S.year}. Um aporte automático no dia do salário costuma resolver.`]);
  return telaWidgetsHtml('invest', {
    indicadores: `<div class="kpis">${k1}${k2}${k3}${k4}</div>`,
    aportes: `<section class="card"><div class="c-h"><h3>Aportes mês a mês</h3>${leg}</div><div class="chart" id="inv-aportes"></div></section>`,
    onde: `<section class="card"><div class="c-h"><h3>Onde está o dinheiro</h3></div>${comp}${rfBar}</section>`,
    posicoes: `<section class="card"><div class="c-h"><h3>Maiores posições</h3><small class="c-note">a custo</small></div>${top.length ? `<ul class="rank">${top.map((i, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(i.nome)}">${esc(i.nome)}</b><small>${esc(i.classe)}</small></span><span class="rk-t"><i style="width:${((i.valor / top[0].valor) * 100).toFixed(1)}%;background:${PAL[ca.porClasse.findIndex((c) => c.label === i.classe) % 6]}"></i></span><span class="rk-v">${brl0(i.valor)}<small>${pct(i.peso, 1)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Sem posições.</p>'}</section>`,
    estudar: `<section class="card study"><div class="c-h"><h3>Para estudar</h3></div><ul class="insights">${ins.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul></section>`,
  });
}

function painelProventos(A) {
  const pv = A.proventos; const ca = A.carteira; const ap = A.aporte; const ret = +S.profile.retornoAnual || 0;
  const k1 = kpi(`Recebido em ${S.year}`, `<span class="num">${brl0(pv.ano)}</span>`, `Dividendos ${brl0(pv.dividendos)} · Renda fixa ${brl0(pv.rentab)}.`);
  const k2 = kpi('Média por mês', `<span class="num">${brl0(pv.mediaMes)}</span>`, `Cerca de ${brl(pv.porDia)} por dia. ${pv.mesesComProvento} de ${ap.meses} meses com proventos.`);
  const k3 = kpi('Yield on cost', pv.yoc == null ? '–' : pct(pv.yoc, 1), pv.yoc == null ? 'Aparece quando houver aportes e proventos.' : 'Proventos anualizados sobre o valor investido (a custo). Mostra quanto o seu dinheiro rende em caixa.');
  const k4 = kpi('Cobertura dos gastos', pv.cobertura == null ? '–' : pct(pv.cobertura, 1), pv.cobertura == null ? 'Registre gastos na aba Gastos para comparar.' : `dos seus gastos médios (${brl0(pv.gastoMedio)} por mês) já são pagos pelos proventos.`, pv.cobertura == null ? '' : barra(pv.cobertura, pv.cobertura >= 1 ? 'ok' : ''));
  const top = pv.pagadores.slice(0, 8); const heat = pv.pagadores.slice(0, 10); const max = Math.max(1, ...heat.flatMap((p) => p.pr));
  const rank = top.length ? `<ul class="rank">${top.map((p, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(p.nome)}">${esc(p.nome)}</b><small>Pagou em ${p.mesesPagos} ${p.mesesPagos === 1 ? 'mês' : 'meses'}${p.yoc != null ? ` · yield ${pct(p.yoc, 1)}` : ''}</small></span><span class="rk-t"><i style="width:${((p.recebido / top[0].recebido) * 100).toFixed(1)}%;background:${p.tipo === 'RENDA FIXA' ? 'var(--c1)' : 'var(--c3)'}"></i></span><span class="rk-v">${brl0(p.recebido)}<small>${pct(pv.ano > 0 ? p.recebido / pv.ano : 0)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Nenhum provento registrado neste ano.</p>';
  const cal = heat.length ? `<div class="heat" role="table" aria-label="Calendário de proventos por ativo"><div class="heat-r heat-h" role="row"><span role="columnheader"></span>${MES.map((m) => `<span role="columnheader">${m[0]}</span>`).join('')}</div>${heat.map((p) => `<div class="heat-r" role="row"><span class="heat-n" role="rowheader">${esc(p.nome)}</span>${p.pr.map((v, m) => `<span role="cell" class="heat-c${v > 0 ? ' on' : ''}" style="--a:${v > 0 ? (0.25 + 0.75 * (v / max)).toFixed(2) : 0}" title="${esc(p.nome)}, ${MES_LONGO[m]}: ${v > 0 ? brl(v) : 'sem pagamento'}"></span>`).join('')}</div>`).join('')}</div><p class="cap">Cada quadrado é um mês. Quanto mais forte, maior o valor. FIIs costumam pagar todo mês; ações concentram em poucos meses.</p>` : '';
  let lib = '';
  if (pv.capitalLiberdade) {
    const f = ca.total / pv.capitalLiberdade; const n = ap.mediaMes > 0 ? E.mesesAteMeta(ca.total, ap.mediaMes, ret, pv.capitalLiberdade, 1200) : null;
    lib = `<section class="card lib"><div class="c-h"><h3>Seu número da independência</h3></div><div class="lib-v num">${brl0(pv.capitalLiberdade)}</div>${barra(f, f >= 1 ? 'ok' : '')}
      <p>Com o yield atual de ${pct(pv.yoc, 1)}, esse é o valor investido para os proventos pagarem seus gastos médios de ${brl0(pv.gastoMedio)} por mês. Você tem ${brl0(ca.total)} (${pct(f, 1)}).${ap.mediaMes > 0 && f < 1 ? ` No ritmo atual de ${brl0(ap.mediaMes)} por mês e retorno hipotético de ${fmt1(ret)}% ao ano, levaria ${n == null ? '<b>mais de 100 anos</b>' : `cerca de <b>${fmt1(n / 12)} anos</b>`}.` : ''}</p>
      <p class="cap">Estudo ilustrativo: supõe yield e gastos constantes, sem inflação e sem promessa de rentabilidade.</p></section>`;
  }
  return telaWidgetsHtml('proventos', {
    indicadores: `<div class="kpis">${k1}${k2}${k3}${k4}</div>`,
    mensal: `<section class="card"><div class="c-h"><h3>Proventos mês a mês</h3>${legenda([['var(--c3)', 'Dividendos e rendimentos'], ['var(--c1)', 'Renda fixa']])}</div><div class="chart" id="pro-mes"></div></section>`,
    independencia: lib || `<section class="card"><div class="c-h"><h3>Seu número da independência</h3></div><p class="empty-s">Aparece quando houver proventos, posições e gastos registrados: mostra quanto você precisaria investido para os proventos pagarem seus gastos.</p></section>`,
    pagadores: `<section class="card"><div class="c-h"><h3>Quem mais paga</h3></div>${rank}</section>`,
    calendario: `<section class="card"><div class="c-h"><h3>Calendário de pagamentos</h3></div>${cal || '<p class="empty-s">O calendário aparece quando houver proventos registrados.</p>'}</section>`,
  });
}

function viewAssets(kind) {
  const rec = kind === 'inv' ? 'investimentos' : 'proventos';
  const title = kind === 'inv' ? 'Investimentos' : 'Proventos';
  if (!temRecurso(rec)) return `${pageHead(title, kind === 'inv' ? 'Quanto você aplica em cada ativo.' : 'Dividendos e rendimentos recebidos.')}${lockedHtml(rec)}`;
  const sub = kind === 'inv' ? 'Quanto você investe, onde está o dinheiro e se o ritmo leva ao seu objetivo.' : 'Quanto os seus investimentos devolvem em caixa, de quem e quando.';
  const acts = `<button class="btn primary" data-act="ingest-open" data-modo="corretora">${I.plus}Importar da corretora</button><button class="btn" data-act="add-ativo">Adicionar ativo</button>`;
  if (!S.plan.ativos.length) return `${pageHead(title, sub)}${vazioInvest(kind)}`;
  const A = analiseAtual();
  return `${pageHead(title, sub, acts)}${kind === 'inv' ? painelInvest(A) : painelProventos(A)}${planilhaHtml(kind)}`;
}
const altura = (el) => { const c = el && el.closest('.card'); return c ? Math.max(210, Math.min(360, c.clientHeight - 96)) : 210; };
function drawAssets() {
  if (S.screen !== 'app' || !S.plan || !S.C) return; drawCart(); const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (S.view === 'inv' && $('#inv-aportes')) {
    const meta = +S.plan.settings.metaAporte || 0;
    chartBars($('#inv-aportes'), { labels: MES, cur, height: altura($('#inv-aportes')), aria: 'Aportes e dividendos reinvestidos por mês, com a meta mensal', bars: [{ color: 'var(--c1)', values: C.aportes }, { color: 'var(--c3)', values: C.dividendos }], marks: meta > 0 ? [{ color: 'var(--c4)', values: MES.map(() => meta) }] : [],
      tip: (i) => `<b>${MES_LONGO[i]}</b><br>Aportes: ${brl0(C.aportes[i])}<br>Dividendos reinvestidos: ${brl0(C.dividendos[i])}${meta > 0 ? `<br>Meta: ${brl0(meta)}` : ''}` });
    const A = analiseAtual(); if (A.carteira.total > 0 && $('#inv-donut')) chartDonut($('#inv-donut'), { aria: 'Carteira por classe de ativo', title: brl0(A.carteira.total), sub: `${A.carteira.n} ${A.carteira.n === 1 ? 'ativo' : 'ativos'}`, items: A.carteira.porClasse.map((c, i) => ({ label: c.label, value: c.value, color: PAL[i % 6] })) });
  }
  if (S.view === 'pro' && $('#pro-mes')) chartBars($('#pro-mes'), { labels: MES, cur, height: altura($('#pro-mes')), aria: 'Proventos por mês: dividendos e renda fixa', bars: [{ color: 'var(--c3)', values: C.dividendos }, { color: 'var(--c1)', values: C.rentab }],
    tip: (i) => `<b>${MES_LONGO[i]}</b><br>Dividendos e rendimentos: ${brl0(C.dividendos[i])}<br>Renda fixa: ${brl0(C.rentab[i])}<br>Total: ${brl0(C.faturamento[i])}` });
}

/* ---------- Carteira ---------- */
function positions() { return posicoesDe(S.plans); }
function cartModel(opt) { // opt (opcional): { plan, C, mes, aporte } para calcular fora da tela (ex.: notificações)
  opt = opt || {}; const p = opt.plan || S.plan; const Cc = opt.C || S.C; const pos = positions();
  const items = p.ativos.map((a) => {
    const k = E.ativoKey(a); const e = S.profile.carteira.find((x) => x.k === k) || {}; const manual = e.valor != null;
    return { a, k, alvo: +e.alvo || 0, valor: manual ? Math.max(0, +e.valor) : Math.max(0, pos[k] || 0), auto: !manual, preco: e.preco > 0 ? +e.preco : null };
  });
  const sumAlvo = items.reduce((s, i) => s + i.alvo, 0); const total = items.reduce((s, i) => s + i.valor, 0);
  const mes = opt.mes != null ? opt.mes : S.cart.mes == null ? S.mes : S.cart.mes; const planejado = Math.max(0, Cc.investAlocado[mes]);
  const aporte = opt.aporte != null ? opt.aporte : S.cart.aporte != null ? S.cart.aporte : (+p.settings.metaAporte > 0 ? +p.settings.metaAporte : planejado);
  const rb = E.rebalance(items.map((i) => ({ w: i.alvo, v: i.valor })), aporte);
  items.forEach((i, n) => {
    i.sug = rb.alloc[n]; i.pctAtual = total > 0 ? (i.valor / total) * 100 : 0; i.pctAlvo = rb.W > 0 ? (i.alvo / rb.W) * 100 : 0; i.desvio = i.pctAtual - i.pctAlvo;
    i.cotas = i.preco && i.sug > 0 ? Math.floor(i.sug / i.preco + 1e-9) : null;
  });
  return { items, sumAlvo, total, mes, planejado, aporte, rb };
}
/* Carteira: widgets organizáveis (mesmo sistema da Visão geral) sobre E.analiseCarteira.
   O editor de alvos é visual (controle deslizante e campos por ativo) e grava no perfil (S.profile.carteira). */
const CART_WIDGETS = [
  { id: 'assessor', nome: () => `Carteira recomendada pelo ${primeiroNome()}`, desc: 'Aparece quando o seu assessor enviar uma carteira recomendada.', tam: 6, tams: [6], padrao: () => true },
  { id: 'alvos', nome: () => 'Alvos e quanto você tem', desc: 'Ajuste o alvo de cada investimento e quanto você tem hoje nele.', tam: 6, tams: [4, 6], padrao: () => true },
  { id: 'aporte', nome: () => 'Onde investir este mês', desc: 'Quanto colocar em cada ativo para voltar ao alvo, sem vender nada.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'composicao', nome: () => 'Composição da carteira', desc: 'Peso de cada classe. Passe o mouse para ver os números e toque numa classe para ver os ativos dela.', tam: 2, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'ativos', nome: () => 'Cada investimento', desc: 'Um cartão por ativo: quanto tem, quanto pesa contra o alvo e quanto recebe neste aporte.', tam: 6, tams: [4, 6], padrao: () => true },
  { id: 'classes', nome: () => 'Equilíbrio por classe', desc: 'Cada classe hoje, no alvo e depois do aporte.', tam: 3, tams: [3, 4, 6], padrao: () => true },
  { id: 'desvios', nome: () => 'Mais longe do alvo', desc: 'Os ativos que mais fugiram do alvo e quanto falta em cada um.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
];
const fmtPpS = (v) => `${v >= 0 ? '+' : '−'}${fmt1(Math.abs(v))} p.p.`;
const semAlvoMsg = '<p class="empty-s">Aparece quando houver alvos definidos.</p>';
function cartAnalise() {
  const M = cartModel();
  const K = E.analiseCarteira({ aporte: M.aporte, itens: M.items.map((i) => ({ nome: i.a.nome, classe: i.a.classe, tipo: i.a.tipo, alvo: i.alvo, valor: i.valor, preco: i.preco, k: i.k, auto: i.auto })) });
  return { M, K };
}
const barraCart = (hoje, depois, alvo, mx, cor) => `<span class="cart-m" aria-hidden="true"><i class="d" style="width:${((depois / mx) * 100).toFixed(1)}%${cor ? ';background:' + cor : ''}"></i><i class="h" style="width:${((hoje / mx) * 100).toFixed(1)}%"></i><b style="left:${((alvo / mx) * 100).toFixed(1)}%"></b></span>`;

/* ---- editor visual: alvo (%) e quanto tem hoje, ativo por ativo, em grupos por classe que abrem com a seta ---- */
const cedAberto = (classe) => !!(S.cedAberto && S.cedAberto[classe]);
function cedAlternar(btn, abrir) {
  const g = btn.closest('.ced-g'); if (!g) return; const ab = abrir == null ? !g.classList.contains('on') : abrir;
  S.cedAberto = S.cedAberto || {}; S.cedAberto[g.dataset.cedG] = ab;
  g.classList.toggle('on', ab); btn.setAttribute('aria-expanded', ab); const l = g.querySelector('.ced-lista'); if (l) l.hidden = !ab;
}
// leva ao ativo no editor: abre a classe dele, rola até a linha e foca o controle do alvo
function cedIrAtivo(k) {
  const r = [...document.querySelectorAll('.ced input[type="range"][data-cartv="alvo"]')].find((x) => x.dataset.k === k); if (!r) return;
  const g = r.closest('.ced-g'); if (g) cedAlternar(g.querySelector('.ced-gh'), true);
  const li = r.closest('.ced-l'); const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  li.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' }); li.classList.remove('ced-pulso'); void li.offsetWidth; li.classList.add('ced-pulso');
  setTimeout(() => r.focus({ preventScroll: true }), suave ? 350 : 0);
}
function cartSomaHtml(soma) {
  const ok = Math.abs(soma - 100) < 0.05; const tom = soma <= 0 ? '' : ok ? 'ok' : soma > 100 ? 'neg' : 'warn';
  return `<div class="ced-soma ${tom}"><div class="ced-soma-t"><b>Alvos somam <span id="ced-soma-v">${fmtPct(soma)}</span></b><small>${soma <= 0 ? 'Comece pela referência do seu perfil ou distribua igualmente.' : ok ? 'Tudo certo: a carteira está 100% definida.' : soma > 100 ? `Passou ${fmtPct(soma - 100)} do total. Normalize ou reduza algum alvo.` : `Faltam ${fmtPct(100 - soma)} para completar. Normalize ou aumente algum alvo.`}</small></div>
    <span class="ced-soma-b" aria-hidden="true"><i style="width:${Math.min(100, soma).toFixed(1)}%"></i></span></div>`;
}
function cartEditorHtml(M, K) {
  const perfil = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado ? E.PERFIS[S.profile.perfilInvestidor.resultado] : null;
  const grupos = []; K.itens.forEach((i) => { let g = grupos.find((x) => x.classe === i.classe && x.tipo === i.tipo); if (!g) { g = { classe: i.classe, tipo: i.tipo, itens: [] }; grupos.push(g); } g.itens.push(i); });
  const linha = (i) => { const id = 'ced-' + E.norm(i.k).replace(/[^a-z0-9]+/g, '-');
    return `<li class="ced-l"><div class="ced-n"><b>${esc(i.nome)}</b><small>hoje ${fmtPct(i.pctAtual)} da carteira${i.desvio <= -0.5 ? ` · <em class="under">${fmtPpS(i.desvio)}</em>` : i.desvio >= 0.5 ? ` · <em class="over">${fmtPpS(i.desvio)}</em>` : ''}</small></div>
      <div class="ced-alvo"><label class="sr" for="${id}-r">Alvo de ${esc(i.nome)}</label><input id="${id}-r" type="range" min="0" max="100" step="0.5" value="${i.w}" data-cartv="alvo" data-k="${esc(i.k)}" style="--f:${(i.w / 100).toFixed(4)}" aria-label="Alvo de ${esc(i.nome)} em porcentagem">
        <span class="ced-pct"><input class="in-s" inputmode="decimal" value="${String(i.w).replace('.', ',')}" data-cartv="alvo" data-k="${esc(i.k)}" aria-label="Alvo de ${esc(i.nome)} em porcentagem"><span aria-hidden="true">%</span></span></div>
      <div class="ced-val"><label><small>Tenho hoje${i.auto ? ' <em>(soma dos aportes)</em>' : ''}</small><input class="in-s" inputmode="decimal" data-cartv="valor" data-k="${esc(i.k)}"${oculto() ? ' placeholder="Valor oculto"' : ''} value="${oculto() ? '' : nf.format(i.v)}" aria-label="Quanto você tem hoje em ${esc(i.nome)}, em reais"></label>${i.auto ? '' : `<button class="lnk ced-auto" data-act="cart-valor-auto" data-k="${esc(i.k)}" title="Voltar a usar a soma dos aportes">Usar soma dos aportes</button>`}</div>
      <div class="ced-pre"><label><small>Preço da cota</small><input class="in-s" inputmode="decimal" data-cartv="preco" data-k="${esc(i.k)}" placeholder="opcional" value="${i.preco ? nf.format(i.preco) : ''}" aria-label="Preço da cota de ${esc(i.nome)}, opcional"></label></div></li>`; };
  const ini = S.profile.patrimonioInicial; const aviso = ini > M.total + 1 ? `<div class="notice">Você informou ${brl0(ini)} de patrimônio inicial, mas só ${brl0(M.total)} estão distribuídos nos ativos. Ajuste o "Tenho hoje" de cada ativo para um rebalanceamento preciso.</div>` : '';
  return `<section class="card ced" id="cart-alvos"><div class="c-h"><h3>Alvos e quanto você tem</h3></div>
    ${cartSomaHtml(K.somaAlvo)}
    <div class="btn-row ced-acts">${perfil ? `<button class="btn sm${K.somaAlvo <= 0 ? ' primary' : ''}" data-act="cart-perfil">Usar a alocação do perfil ${esc(perfil.nome.toLowerCase())}</button>` : ''}<button class="btn sm" data-act="cart-equal">Distribuir igualmente</button>${Math.abs(K.somaAlvo - 100) >= 0.05 && K.somaAlvo > 0 ? '<button class="btn sm" data-act="cart-norm">Normalizar para 100%</button>' : ''}<button class="btn ghost sm" data-act="cart-clear">Zerar alvos</button></div>
    ${aviso}<div class="ced-gs">${grupos.map((g, n) => { const ab = cedAberto(g.classe); const alvo = g.itens.reduce((s, i) => s + i.w, 0); const hoje = g.itens.reduce((s, i) => s + i.pctAtual, 0); const mx = Math.max(alvo, hoje, 1);
      return `<div class="ced-g${ab ? ' on' : ''}" data-ced-g="${esc(g.classe)}"><button class="ced-gh" data-act="ced-g" aria-expanded="${ab}" aria-controls="ced-g-${n}">
        <i class="ced-dot" style="background:${PAL[n % 6]}" aria-hidden="true"></i><span class="ced-gn"><b>${esc(g.classe)}</b><small>${g.itens.length} ${g.itens.length === 1 ? 'ativo' : 'ativos'} · hoje ${fmtPct(hoje)}</small></span>
        <span class="ced-gb" aria-hidden="true"><i class="h" style="width:${((hoje / mx) * 100).toFixed(1)}%"></i><i class="a" style="width:${((alvo / mx) * 100).toFixed(1)}%;background:${PAL[n % 6]}"></i></span>
        <span class="ced-ga" data-ced-ga>${fmtPct(alvo)}<small>alvo</small></span><span class="ced-chev" aria-hidden="true">${I.chev}</span></button>
        <ul class="ced-lista" id="ced-g-${n}"${ab ? '' : ' hidden'}>${g.itens.map(linha).join('')}</ul></div>`; }).join('')}</div>
    <p class="cap">Toque numa classe para abrir os ativos dela. Arraste o controle ou digite o alvo. "Tenho hoje" começa pela soma dos aportes de todos os anos; digite o valor atual se ele mudou. O preço da cota é opcional e serve para estimar quantas cotas comprar.</p></section>`;
}

/* ---- composição interativa: um anel por classe; tocar numa fatia entra na classe e mostra os ativos de dentro.
   Dentro da classe, tocar num ativo leva ao alvo dele no editor. Estado só da sessão em S.cmpClasse. ---- */
let CMP_SEGS = []; // fatias desenhadas agora: { nome, valor, sub, k? }
function cartComposicaoHtml(K) {
  if (!(K.total > 0)) return '<p class="empty-s">A composição aparece depois do primeiro aporte.</p>';
  const temAlvo = K.somaAlvo > 0; const nc = K.classes.findIndex((c) => c.classe === S.cmpClasse); const cls = nc >= 0 ? K.classes[nc] : null;
  if (!cls) S.cmpClasse = null;
  const tons = (n, m) => (m <= 1 ? [PAL[n % 6]] : Array.from({ length: m }, (_, j) => `color-mix(in srgb, ${PAL[n % 6]} ${Math.round(100 - (j * 55) / (m - 1))}%, var(--surface))`));
  let fatias;
  if (cls) {
    const its = K.itens.filter((i) => i.classe === cls.classe && i.v > 0).sort((x, y) => y.v - x.v); const cores = tons(nc, its.length);
    fatias = its.map((i, j) => ({ nome: i.nome, valor: i.v, pct: cls.valor > 0 ? (i.v / cls.valor) * 100 : 0, cor: cores[j], k: i.k,
      sub: `${fmtPct(cls.valor > 0 ? (i.v / cls.valor) * 100 : 0)} da classe · ${fmtPct(i.pctAtual)} da carteira${temAlvo ? ` · alvo ${fmtPct(i.pctAlvo)}` : ''}`,
      li: `${fmtPct(cls.valor > 0 ? (i.v / cls.valor) * 100 : 0)}`, liSub: temAlvo ? `${fmtPct(i.pctAtual)} da carteira · alvo ${fmtPct(i.pctAlvo)}` : `${fmtPct(i.pctAtual)} da carteira` }));
  } else {
    fatias = K.classes.map((c, n) => { const d = c.atual - c.alvo;
      return { nome: c.classe, valor: c.valor, pct: c.atual, cor: PAL[n % 6], li: fmtPct(c.atual), liSub: temAlvo ? `alvo ${fmtPct(c.alvo)}` : '',
        sub: temAlvo ? `${fmtPct(c.atual)} hoje · ${fmtPct(c.alvo)} alvo${Math.abs(d) >= 0.05 ? ` (${fmtPpS(d)})` : ''}` : `${fmtPct(c.atual)} da carteira` }; });
  }
  CMP_SEGS = fatias;
  const C = 2 * Math.PI * 76; let ac = 0; const gap = fatias.filter((f) => f.pct > 0.3).length > 1 ? 2.5 : 0;
  const segs = fatias.map((f, n) => { const l = (f.pct / 100) * C; const out = l > 0.5 ? `<circle class="cmp-seg" data-cseg="${n}" r="76" cx="100" cy="100" stroke="${f.cor}" stroke-dasharray="${Math.max(0.01, l - gap).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-ac).toFixed(2)}" style="--i:${n}"><title>${esc(f.nome)}</title></circle>` : ''; ac += l; return out; }).join('');
  const total = cls ? cls.valor : K.total; const rotulo = cls ? cls.classe : 'Total hoje';
  const subTotal = cls ? `${fmtPct(cls.atual)} da carteira${temAlvo ? ` · alvo ${fmtPct(cls.alvo)}` : ''}` : `${K.classes.length} ${K.classes.length === 1 ? 'classe' : 'classes'} · toque para abrir`;
  const lista = fatias.map((f, n) => `<li><button class="cmp-li" data-act="cart-seg" data-cseg="${n}"${f.k ? ` data-k="${esc(f.k)}"` : ''}><i style="background:${f.cor}"></i><span>${esc(f.nome)}</span><b>${f.li}</b>${f.liSub ? `<small>${f.liSub}</small>` : ''}<span class="cmp-ir" aria-hidden="true">${I.chev}</span></button></li>`).join('');
  return `<div class="cmp${cls ? ' dentro' : ''}" data-cmp-total="${esc(brl0(total))}" data-cmp-rot="${esc(rotulo)}" data-cmp-sub="${esc(subTotal)}">
    ${cls ? `<button class="btn ghost sm cmp-volta" data-act="cart-cmp-volta">${I.chev} Todas as classes</button>` : ''}
    <div class="cmp-g"><svg viewBox="0 0 200 200" role="img" aria-label="${cls ? `Ativos de ${esc(cls.classe)}` : 'Composição da carteira por classe'}"><circle class="cmp-trilho" r="76" cx="100" cy="100"/><g transform="rotate(-90 100 100)">${segs}</g></svg>
      <div class="cmp-c" aria-live="polite"><small id="cmp-c-k">${esc(rotulo)}</small><b id="cmp-c-v">${brl0(total)}</b><span id="cmp-c-s">${subTotal}</span></div></div>
    <ul class="cmp-l">${lista}</ul></div>`;
}
// destaca uma fatia (ou volta ao total quando n é null), sem redesenhar
function cartSeg(n) {
  const raiz = document.querySelector('.cmp'); if (!raiz) return; const f = n == null ? null : CMP_SEGS[n];
  raiz.classList.toggle('foco', !!f);
  raiz.querySelectorAll('[data-cseg]').forEach((e) => e.classList.toggle('on', !!f && +e.dataset.cseg === +n));
  const k = document.getElementById('cmp-c-k'); const v = document.getElementById('cmp-c-v'); const s = document.getElementById('cmp-c-s'); if (!k) return;
  if (!f) { k.textContent = raiz.dataset.cmpRot; v.textContent = raiz.dataset.cmpTotal; s.textContent = raiz.dataset.cmpSub; return; }
  k.textContent = f.nome; v.textContent = brl0(f.valor); s.textContent = f.sub;
}
// tocar numa fatia: fora de uma classe, entra nela; dentro, leva ao ativo no editor
function cartCmpAbrir(n) {
  const f = CMP_SEGS[n]; if (!f) return;
  if (f.k) { cedIrAtivo(f.k); return; }
  S.cmpClasse = f.nome; cartCmpTrocar();
}
function cartCmpTrocar() {
  const velho = document.querySelector('.cmp'); if (!velho) return; const { K } = cartAnalise();
  const t = document.createElement('div'); t.innerHTML = cartComposicaoHtml(K); const novo = t.firstElementChild; novo.classList.add('troca');
  velho.replaceWith(novo); drawCart(); const foco = novo.querySelector('.cmp-volta') || novo.querySelector('.cmp-li'); if (foco) foco.focus({ preventScroll: true });
}

function viewCart() {
  if (gated('cart')) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}${lockedHtml('cart')}`;
  const p = S.plan;
  if (!p.ativos.length) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}<div class="empty-state"><h2>Cadastre seus ativos primeiro</h2><p>A Carteira usa os ativos da aba Investimentos. Adicione-os lá ou importe a planilha com a carteira que o seu assessor montou.</p><div class="btn-row"><button class="btn primary" data-act="nav" data-view="inv">Ir para Investimentos</button><button class="btn" data-act="admin-open">Importar planilha</button></div></div>`;
  const { M, K } = cartAnalise(); const semAlvo = K.somaAlvo <= 0;
  const html = {};
  const rec = recPainelHtml(); if (rec) html.assessor = rec;
  html.alvos = cartEditorHtml(M, K);
  // onde investir este mês
  const cm = K.itens.filter((i) => i.sug > 0.004).sort((a, b) => b.sug - a.sug);
  const mesSel = `<select data-cart="mes" aria-label="Mês do aporte">${MES.map((m, i) => `<option value="${i}" ${M.mes === i ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
  const entrada = `<div class="cart-in2"><label class="fld"><span>Mês</span>${mesSel}</label><label class="fld"><span>Valor do aporte <small>${S.cart.aporte == null ? '(da sua meta)' : '(digitado)'}</small></span><input class="in-s" data-cart="aporte" inputmode="decimal"${oculto() ? ' placeholder="Valor oculto"' : ''} value="${oculto() ? '' : nf.format(M.aporte)}" aria-label="Valor do aporte em reais"></label>${S.cart.aporte != null ? '<button class="btn sm" data-act="cart-auto">Usar a meta</button>' : ''}</div>`;
  const lista = semAlvo ? '<p class="empty-s">Defina os alvos acima (ou use a alocação do seu perfil) para ver onde investir.</p>' : M.aporte <= 0 ? '<p class="empty-s">Informe um valor de aporte maior que zero.</p>'
    : `<ol class="cart-sug">${cm.map((i) => { const mx = Math.max(i.pctAlvo, i.pctDepois, i.pctAtual, 1) * 1.15;
        return `<li><span class="cart-sug-n"><b>${esc(i.nome)}</b><small>${esc(i.classe)} · hoje ${fmtPct(i.pctAtual)}, depois ${fmtPct(i.pctDepois)}, alvo ${fmtPct(i.pctAlvo)}</small>${barraCart(i.pctAtual, i.pctDepois, i.pctAlvo, mx)}</span>
          <span class="cart-sug-v"><b>${brl(i.sug)}</b>${i.cotas != null ? `<small>≈ ${i.cotas} ${i.cotas === 1 ? 'cota' : 'cotas'}</small>` : ''}</span></li>`; }).join('')}</ol>
      <div class="cart-sug-f"><button class="btn primary" data-act="cart-register">Registrar em Investimentos (${MES[M.mes]})</button><p class="cap">O aporte vai primeiro para o que está mais abaixo do alvo, sem vender nada. Barra clara: hoje; escura: depois do aporte; traço: alvo.</p></div>`;
  html.aporte = `<section class="card"><div class="c-h"><h3>Onde investir ${brl(M.aporte)} em ${MES_LONGO[M.mes]}</h3></div>${entrada}${lista}</section>`;
  html.composicao = `<section class="card"><div class="c-h"><h3>Composição da carteira</h3></div>${cartComposicaoHtml(K)}</section>`;
  // cada investimento
  const tile = (i) => { const prog = i.pctAlvo > 0 ? Math.min(1, i.pctAtual / i.pctAlvo) : 0; const d = i.desvio;
    const st = semAlvo ? '' : i.pctAlvo <= 0 ? '<span class="ca-st">Sem alvo</span>' : Math.abs(d) < 0.5 ? '<span class="ca-st ok">No alvo</span>' : d < 0 ? `<span class="ca-st under">${fmtPpS(d)} abaixo</span>` : `<span class="ca-st over">${fmtPpS(d)} acima</span>`;
    return `<li class="ca"><div class="ca-h"><b>${esc(i.nome)}</b><small>${esc(i.classe)}</small></div><b class="ca-v">${brl0(i.v)}</b>
      <div class="ca-p"><span>${fmtPct(i.pctAtual)} <small>hoje</small></span>${semAlvo ? '' : `<span>${fmtPct(i.pctAlvo)} <small>alvo</small></span>`}</div>
      ${semAlvo ? '' : `<span class="ca-bar" aria-hidden="true"><i style="width:${(prog * 100).toFixed(1)}%"></i></span>`}<div class="ca-f">${st}${i.sug > 0.004 ? `<span class="ca-sug">+${brl0(i.sug)} neste aporte</span>` : ''}</div></li>`; };
  html.ativos = `<section class="card"><div class="c-h"><h3>Cada investimento</h3><small class="c-note">${K.itens.length} ${K.itens.length === 1 ? 'ativo' : 'ativos'}</small></div><ul class="ca-grid">${K.itens.slice().sort((a, b) => b.v - a.v).map(tile).join('')}</ul></section>`;
  // equilíbrio por classe
  const mxC = Math.max(1, ...K.classes.map((c) => Math.max(c.atual, c.alvo, c.depois))) * 1.1;
  html.classes = `<section class="card"><div class="c-h"><h3>Equilíbrio por classe</h3></div>${semAlvo ? semAlvoMsg : `<ul class="cart-cls">${K.classes.map((c, n) => { const d = c.atual - c.alvo;
      return `<li><div class="cart-cls-h"><b>${esc(c.classe)}</b><span>${fmtPct(c.atual)} <small>hoje</small> · ${fmtPct(c.alvo)} <small>alvo</small></span></div>${barraCart(c.atual, c.depois, c.alvo, mxC, PAL[n % 6])}
      <small class="cart-cls-d ${d < -0.05 ? 'under' : d > 0.05 ? 'over' : ''}">${Math.abs(d) < 0.05 ? 'No alvo' : fmtPpS(d) + (d < 0 ? ' abaixo do alvo' : ' acima do alvo')}${c.sug > 0 ? ` · recebe ${brl0(c.sug)} neste aporte` : ''}</small></li>`; }).join('')}</ul>`}</section>`;
  // mais longe do alvo
  html.desvios = `<section class="card"><div class="c-h"><h3>Mais longe do alvo</h3></div>${semAlvo ? semAlvoMsg : K.maisLonge.length ? `<ul class="g-lista">${K.maisLonge.map((i) => `<li><div class="g-li"><span><b>${esc(i.nome)}</b><small>${esc(i.classe)} · hoje ${fmtPct(i.pctAtual)}, alvo ${fmtPct(i.pctAlvo)}</small></span><span class="g-li-v"><b class="${i.desvio < 0 ? 'under' : 'over'}">${fmtPpS(i.desvio)}</b><small>${i.desvio < 0 ? (i.falta > 0 ? `faltam ${brl0(i.falta)} depois deste aporte` : 'chega ao alvo com este aporte') : 'sem novos aportes por enquanto'}</small></span></div></li>`).join('')}</ul>` : '<p class="empty-s">Todos os ativos estão a menos de meio ponto do alvo.</p>'}</section>`;
  return `${pageHead('Carteira', 'Defina o alvo de cada investimento e veja, a cada aporte, onde investir para manter tudo equilibrado.')}${telaWidgetsHtml('carteira', html)}
    <p class="cap disc">Ferramenta de organização. As sugestões seguem os percentuais-alvo definidos por você e não constituem recomendação individual de investimento.</p>`;
}

/* campos do editor: o alvo acompanha o dedo sem redesenhar; ao soltar (change), grava e atualiza a tela */
function cartCampoVivo(t) {
  if (t.dataset.cartv !== 'alvo') return;
  const v = t.type === 'range' ? +t.value : E.parseValor(t.value); if (Number.isNaN(v)) return;
  const linha = t.closest('.ced-l'); if (linha) { const r = linha.querySelector('input[type="range"]'); const n = linha.querySelector('.ced-pct input');
    if (r && r !== t) { r.value = v; } if (r) r.style.setProperty('--f', (Math.max(0, Math.min(100, v)) / 100).toFixed(4)); if (n && n !== t) n.value = String(v).replace('.', ','); }
  // soma ao vivo: todos os alvos do editor
  let soma = 0; document.querySelectorAll('.ced input[type="range"][data-cartv="alvo"]').forEach((r) => { soma += +r.value || 0; });
  const sv = document.getElementById('ced-soma-v'); if (sv) sv.textContent = fmtPct(soma);
  const sb = document.querySelector('.ced-soma-b i'); if (sb) sb.style.width = Math.min(100, soma).toFixed(1) + '%';
  const g = t.closest('.ced-g'); const ga = g && g.querySelector('[data-ced-ga]');
  if (ga) { let sg = 0; g.querySelectorAll('input[type="range"][data-cartv="alvo"]').forEach((r) => { sg += +r.value || 0; }); ga.firstChild.textContent = fmtPct(sg); }
}
function cartCampoGravar(t) {
  const e = cartEntry(t.dataset.k, true); const campo = t.dataset.cartv; const txt = String(t.value || '').trim();
  if (campo === 'alvo') { const v = t.type === 'range' ? +t.value : E.parseValor(txt); if (Number.isNaN(v) || v < 0 || v > 100) { toast('Informe um alvo entre 0 e 100%.'); render(); return; } e.alvo = E.r2(v); }
  else if (campo === 'valor') { if (oculto() && !txt) return; if (!txt) { e.valor = null; } else { const v = parseReais(txt); if (Number.isNaN(v) || v < 0) { toast('Valor inválido. Use números como 1.234,56'); render(); return; } e.valor = E.r2(v); } }
  else if (campo === 'preco') { if (!txt) e.preco = null; else { const v = parseReais(txt); if (Number.isNaN(v) || v < 0) { toast('Preço inválido.'); render(); return; } e.preco = v > 0 ? E.r2(v) : null; } }
  touch('profile'); renderLater();
}
function drawCart() {
  if (S.view !== 'cart' || !S.plan || !S.plan.ativos.length || gated('cart')) return;
  const raiz = document.querySelector('.cmp'); if (!raiz || raiz.dataset.ligado) return; raiz.dataset.ligado = '1';
  // passar o mouse ou focar uma fatia (ou a linha da legenda) mostra os números dela no centro
  raiz.addEventListener('pointerover', (ev) => { const s = ev.target.closest && ev.target.closest('[data-cseg]'); if (s && ev.pointerType === 'mouse') cartSeg(+s.dataset.cseg); });
  raiz.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') cartSeg(null); });
  raiz.addEventListener('focusin', (ev) => { const s = ev.target.closest('[data-cseg]'); if (s) cartSeg(+s.dataset.cseg); });
  raiz.addEventListener('focusout', (ev) => { if (!raiz.contains(ev.relatedTarget)) cartSeg(null); });
  // toque ou clique numa fatia do gráfico: entra na classe (ou leva ao ativo, quando já está dentro dela)
  raiz.querySelector('svg').addEventListener('click', (ev) => { const s = ev.target.closest('[data-cseg]'); if (s) cartCmpAbrir(+s.dataset.cseg); });
}
function cartNormalize() {
  const items = cartModel().items; const s = items.reduce((a, i) => a + i.alvo, 0); if (s <= 0) { toast('Defina ao menos um alvo antes de normalizar.'); return; }
  items.forEach((i) => { if (i.alvo > 0) cartEntry(i.k, true).alvo = E.r2((i.alvo / s) * 100); });
  const rest = items.map((i) => cartEntry(i.k, false)).filter((e) => e && e.alvo > 0); const diff = E.r2(100 - rest.reduce((a, e) => a + e.alvo, 0));
  if (rest.length && diff) rest[rest.length - 1].alvo = E.r2(rest[rest.length - 1].alvo + diff);
  touch('profile'); render();
}
function setAlvos(map) { cartModel().items.forEach((i) => { cartEntry(i.k, true).alvo = map(i); }); touch('profile'); render(); }
function cartEqual() { const n = S.plan.ativos.length; if (!n) return; let acc = 0; let idx = 0; setAlvos(() => { idx++; const v = idx === n ? E.r2(100 - acc) : E.r2(100 / n); acc += v; return v; }); }
function cartClear() { S.profile.carteira.forEach((e) => { e.alvo = 0; }); touch('profile'); render(); }
function cartPerfil() {
  const r = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado; if (!r) return;
  const al = E.PERFIS[r].alvo; const ativos = S.plan.ativos; const nRf = ativos.filter((a) => a.tipo === 'RENDA FIXA').length; const nRv = ativos.length - nRf;
  let wRf = nRf ? al.rendaFixa : 0; let wRv = nRv ? al.bolsa : 0; const t = wRf + wRv; wRf = (wRf / t) * 100; wRv = (wRv / t) * 100;
  const apply = () => { const seen = { rf: 0, rv: 0 }; setAlvos((i) => { const rf = i.a.tipo === 'RENDA FIXA'; const n = rf ? nRf : nRv; seen[rf ? 'rf' : 'rv']++; const w = rf ? wRf : wRv; return seen[rf ? 'rf' : 'rv'] === n ? E.r2(w - E.r2(w / n) * (n - 1)) : E.r2(w / n); }); toast('Alvos preenchidos com a alocação do seu perfil. Ajuste como preferir.'); };
  if (S.profile.carteira.some((e) => e.alvo > 0)) confirmBox('Substituir os alvos atuais?', 'Os percentuais-alvo serão recalculados com base no seu perfil de investidor, dividindo igualmente entre os ativos de cada tipo.', 'Substituir', apply); else apply();
}
function cartRegister() {
  const M = cartModel(); const list = M.items.filter((i) => i.sug > 0.004); if (!list.length) return;
  confirmBox(`Registrar aportes de ${MES_LONGO[M.mes]}?`, `Os ${list.length} valores sugeridos (${brl(list.reduce((a, i) => a + i.sug, 0))}) serão somados aos aportes de ${MES_LONGO[M.mes]} na aba Investimentos.`, 'Registrar', () => {
    list.forEach((i) => { i.a.ap[M.mes] = E.r2((+i.a.ap[M.mes] || 0) + i.sug); }); S.cart.aporte = null; touch('plan'); render(); toast('Aportes registrados em Investimentos.');
  });
}

/* ---------- modal de ativo ---------- */
function suggest(level, a) {
  const own = new Set(); const T = E.TAXONOMIA;
  if (level === 'tipo') Object.keys(T).forEach((k) => own.add(k));
  if (level === 'classe' && T[a.tipo]) Object.keys(T[a.tipo]).forEach((k) => own.add(k));
  if (level === 'grupo' && T[a.tipo] && T[a.tipo][a.classe] && !Array.isArray(T[a.tipo][a.classe])) Object.keys(T[a.tipo][a.classe]).forEach((k) => own.add(k));
  if (level === 'subgrupo' && T[a.tipo] && T[a.tipo][a.classe] && Array.isArray(T[a.tipo][a.classe][a.grupo])) T[a.tipo][a.classe][a.grupo].forEach((k) => own.add(k));
  S.plan.ativos.forEach((x) => {
    if (level === 'tipo') own.add(x.tipo); else if (x.tipo === a.tipo && level === 'classe') own.add(x.classe);
    else if (x.tipo === a.tipo && x.classe === a.classe && level === 'grupo' && x.grupo) own.add(x.grupo);
    else if (x.tipo === a.tipo && x.classe === a.classe && x.grupo === a.grupo && level === 'subgrupo' && x.subgrupo) own.add(x.subgrupo);
  });
  return [...own];
}
const matchCase = (val, list) => { const t = (val || '').trim(); const f = list.find((x) => x.toLowerCase() === t.toLowerCase()); return f || t; };
function openAtivo(id) {
  const p = S.plan; const a0 = id ? p.ativos.find((x) => x.id === id) : null;
  const form = openModal({
    title: a0 ? 'Editar ativo' : 'Novo ativo',
    body: `<div class="fld-2"><label class="fld"><span>Tipo</span><input name="tipo" list="dl-tipo" value="${esc(a0 ? a0.tipo : 'BOLSA DE VALORES')}"></label><label class="fld"><span>Classe</span><input name="classe" list="dl-classe" value="${esc(a0 ? a0.classe : '')}"></label></div>
      <div class="fld-2"><label class="fld"><span>Grupo <small>(opcional)</small></span><input name="grupo" list="dl-grupo" value="${esc(a0 && a0.grupo ? a0.grupo : '')}"></label><label class="fld"><span>Subgrupo <small>(opcional)</small></span><input name="subgrupo" list="dl-sub2" value="${esc(a0 && a0.subgrupo ? a0.subgrupo : '')}"></label></div>
      <label class="fld"><span>Nome do ativo <small>(código, banco ou título)</small></span><input name="nome" value="${esc(a0 ? a0.nome : '')}"></label>
      <p class="mmsg small">Em renda fixa, os valores de Proventos contam como rentabilidade; nos demais tipos, como dividendos.</p>
      <datalist id="dl-tipo"></datalist><datalist id="dl-classe"></datalist><datalist id="dl-grupo"></datalist><datalist id="dl-sub2"></datalist>`,
    danger: a0 ? 'Excluir' : null,
    onDanger: () => { confirmBox('Excluir ativo?', `“${a0.nome}” e seus valores de investimentos e proventos serão removidos.`, 'Excluir', () => { p.ativos = p.ativos.filter((x) => x.id !== a0.id); commit(); }); return false; },
    onOk: (d, err) => {
      const tipo = matchCase(d.tipo, suggest('tipo', {})).toUpperCase(); const a = { tipo };
      a.classe = matchCase(d.classe, suggest('classe', a)); a.grupo = d.grupo && d.grupo.trim() ? matchCase(d.grupo, suggest('grupo', a)) : null;
      a.subgrupo = d.subgrupo && d.subgrupo.trim() ? matchCase(d.subgrupo, suggest('subgrupo', Object.assign({}, a))) : null;
      const nome = (d.nome || '').trim();
      if (!tipo || !a.classe || !nome) return bad(err, 'Preencha tipo, classe e nome do ativo.');
      if (a.subgrupo && !a.grupo) return bad(err, 'Para usar um subgrupo, informe também o grupo.');
      if (a0) Object.assign(a0, a, { nome });
      else {
        const na = Object.assign({ id: uid(), nome, ap: z12(), pr: z12() }, a); const same = (x, lv) => lv.every((k) => (x[k] || null) === (na[k] || null)); let at = -1;
        for (const lv of [['tipo', 'classe', 'grupo', 'subgrupo'], ['tipo', 'classe', 'grupo'], ['tipo', 'classe'], ['tipo']]) { for (let i = p.ativos.length - 1; i >= 0; i--) if (same(p.ativos[i], lv)) { at = i; break; } if (at >= 0) break; }
        p.ativos.splice(at >= 0 ? at + 1 : p.ativos.length, 0, na);
      }
      commit();
    },
  });
  const refresh = () => {
    const g = (n) => form.elements[n].value.trim(); const a = { tipo: matchCase(g('tipo'), suggest('tipo', {})) };
    a.classe = matchCase(g('classe'), suggest('classe', a)); a.grupo = matchCase(g('grupo'), suggest('grupo', Object.assign({}, a)));
    const fill = (id, arr) => { $('#' + id).innerHTML = arr.map((x) => `<option value="${esc(x)}"></option>`).join(''); };
    fill('dl-tipo', suggest('tipo', {})); fill('dl-classe', suggest('classe', a)); fill('dl-grupo', suggest('grupo', a)); fill('dl-sub2', suggest('subgrupo', a));
  };
  form.addEventListener('input', refresh); refresh();
}
