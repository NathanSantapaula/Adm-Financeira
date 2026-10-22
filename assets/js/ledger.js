/* Rendas e Conta corrente: categorias livres, hierarquia flexível, orçamento do mês e parcelamento consolidado. */
'use strict';
const bad = (err, msg) => { err(msg); return false; };
const modoToggle = () => `<div class="seg" role="group" aria-label="Visualização"><button class="${S.modo === 'mes' ? 'on' : ''}" data-act="modo" data-modo="mes">Mês</button><button class="${S.modo === 'ano' ? 'on' : ''}" data-act="modo" data-modo="ano">Ano</button></div>`;

/* valor de um item no mês (editável quando não é parcelado) */
function lamt(k, it, m, v, locked) {
  if (locked) return `<span class="lamt${Math.abs(v) < 0.005 ? ' z' : ''}">${fmt(v)}</span>`;
  const ti = FIRST_ED ? 0 : -1; FIRST_ED = false; const ri = RI++;
  return `<span class="lamt ed${Math.abs(v) < 0.005 ? ' z' : ''}${v < -0.004 ? ' neg' : ''}" data-k="${k}" data-id="${esc(it.id)}" data-m="${m}" data-ri="${ri}" data-v="${v}" tabindex="${ti}" title="Clique para editar">${fmt(v)}</span>`;
}
const parcInfo = (it, m) => {
  const p = it.parcel; if (!p) return '';
  const i = E.parcelaIndice(p, S.year, m);
  return i ? `Parcela ${i} de ${p.n}` : `Parcelado em ${p.n}x`;
};
function itemRow(kind, it, m) {
  const vals = E.itemValores(it, S.year); const v = vals[m]; const locked = !!it.parcel || !!it.herdado;
  const sub = kind === 'desp' ? parcInfo(it, m) : (it.fonte || '');
  const act = it.herdado ? `data-act="year-pick" data-year="${it.herdado}" title="Parcelamento criado em ${it.herdado}"` : `data-act="edit-item" data-kind="${kind}" data-id="${esc(it.id)}"`;
  return `<div class="lrow"><button class="lname" ${act}><span>${esc(it.nome)}</span>${sub ? `<small>${esc(sub)}${it.herdado ? ` · de ${it.herdado}` : ''}</small>` : ''}</button>${lamt(kind === 'desp' ? 'dv' : 'rv', it, m, v, locked)}</div>`;
}
function catSection(kind, cat, total, inner, preset) {
  const key = kind + ':' + cat.id; const closed = !!S.fechadas[key];
  return `<section class="lcat"><header class="lcat-h"><button class="chev" data-act="toggle-cat" data-key="${key}" aria-expanded="${!closed}" aria-label="${closed ? 'Expandir' : 'Recolher'} ${esc(cat.nome)}">${I.chev}</button><h3>${esc(cat.nome)}</h3><span class="lcat-t">${brl(total)}</span><button class="icon-btn" data-act="add-item" data-kind="${kind}" data-cat="${cat.id}" aria-label="Adicionar em ${esc(cat.nome)}">${I.plus}</button></header>${closed ? '' : `<div class="lbody">${inner || ''}</div>`}</section>`;
}
const emptyCat = (txt, kind, cat) => `<p class="empty-s">${txt} <button class="lnk strong" data-act="add-item" data-kind="${kind}" data-cat="${cat}">Adicionar</button></p>`;

/* ---------------- hierarquia: Categoria > Área > Subárea > Item ---------------- */

/* ---------------- Gastos: índice dos lançamentos por mês ---------------- */
const pad2 = (n) => String(n).padStart(2, '0');
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const mesNome = (m) => cap(MES_LONGO[m]);

/* tudo o que pesa no mês m: lançamentos reais (com data) e gastos previstos/parcelados (sem data) */
// índice por mês, montado uma vez por desenho da tela (antes: cada um dos 12 meses relia todos os lançamentos e as parcelas)
let CC_IDX = null;
function indiceMeses() {
  const p = S.plan; const ano = S.year; const reais = MES.map(() => []);
  p.lancamentos.forEach((l) => { const d = E.parseDataISO(l.data); if (d && d.ano === ano) reais[d.mes].push([l, d]); });
  const itens = p.despesas.concat(planCtx().carry).map((it) => [it, E.itemValores(it, ano)]);
  CC_IDX = { plan: p, ano, reais, itens }; return CC_IDX;
}
function entradasMes(m) {
  const p = S.plan; const ano = S.year; const out = [];
  const ix = CC_IDX && CC_IDX.plan === p && CC_IDX.ano === ano ? CC_IDX : indiceMeses();
  ix.reais[m].forEach(([l, d]) => { out.push({ tipo: 'real', id: l.id, cat: l.cat, area: l.area || 'Outros', sub: l.sub || '', nome: l.desc, valor: +l.valor, dia: d.dia, origem: l.origem || 'manual', itemId: l.itemId, inst: l.inst || '' }); });
  ix.itens.forEach(([it, vals]) => {
    const v = vals[m]; if (Math.abs(v) < 0.005) return;
    out.push({ tipo: 'prev', id: it.id, cat: it.cat, area: it.area || 'Outros', sub: it.sub || '', nome: it.nome, valor: v, dia: 0, parcela: it.parcel ? `${E.parcelaIndice(it.parcel, ano, m)}/${it.parcel.n}` : '', herdado: it.herdado || null, inst: it.inst || '' });
  });
  return out;
}
function orcEl(m) {
  const C = S.C; const orc = C.orcamento[m]; const custom = S.plan.orcamento[m] != null; const ri = RI++; const ti = FIRST_ED ? 0 : -1; FIRST_ED = false;
  return `<span class="big ed${orc > 0 ? '' : ' z'}" data-k="orc" data-m="${m}" data-ri="${ri}" data-v="${orc}" data-fmt="brl" data-custom="${custom ? 1 : 0}" tabindex="${ti}" title="Clique para definir o orçamento de ${MES_LONGO[m]}">${orc > 0 ? brl0(orc) : 'Definir'}</span>`;
}
/* ---------------- Gastos: período, números do período, análises e todos os lançamentos num lugar só ----------------
   O período vem do seletor do topo (S.periodo): um mês só abre a visão do mês (S.mes), o resto a do ano (gAno). As análises vêm de E.analiseGastos (testada); a lista
   filtra e busca sem redesenhar a página (gListaAtualiza). Os widgets seguem o layout salvo em S.profile.painelGastos (mesmo editor da Visão geral). */
const G_WIDGETS = [
  { id: 'onde', nome: () => 'Para onde foi o dinheiro', desc: 'Categorias e áreas do período, com a comparação com a média.', tam: 3, tams: [3, 4, 6], padrao: () => true },
  { id: 'ritmo', nome: () => 'Ritmo do mês', desc: 'Gasto acumulado dia a dia contra o orçamento, com a projeção até o fim do mês. Só na visão de um mês.', tam: 3, tams: [3, 4, 6], padrao: () => true },
  { id: 'mensal', nome: () => 'Mês a mês', desc: 'Gastos fixos e variáveis de cada mês, com o orçamento marcado.', tam: 6, tams: [3, 4, 6], padrao: () => true },
  { id: 'contas', nome: () => 'Contas do mês', desc: 'Gastos fixos e parcelas que caem no mês, pagos ou previstos.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'top', nome: () => 'Maiores gastos', desc: 'Os lançamentos de maior valor do período.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'parc', nome: () => 'Parcelamentos em andamento', desc: 'Parcela do mês, quanto falta e quando termina.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'mudou', nome: () => 'O que mudou', desc: 'Áreas que subiram ou caíram em relação à média dos meses anteriores. Só na visão de um mês.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false },
  { id: 'estab', nome: () => 'Onde você mais compra', desc: 'Estabelecimentos agrupados pelo nome, com número de compras e total.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false },
  { id: 'recorr', nome: () => 'Assinaturas e contas recorrentes', desc: 'O que se repete todo mês com valor parecido.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false },
  { id: 'inst', nome: () => 'Por instituição', desc: 'Quanto saiu por banco, cartão ou carteira no período, com o ícone de cada um.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'cartoes', nome: () => 'Meus cartões', desc: 'Um cartão por banco, cartão ou carteira usado no período, com quanto saiu por ele.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'limites', nome: () => 'Limites por área', desc: 'Um limite por mês para as áreas que você escolher, com aviso ao chegar perto.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'semana', nome: () => 'Por dia da semana', desc: 'Em que dias você mais gasta.', tam: 3, tams: [3, 4, 6], padrao: () => false },
];
// visão do mês quando o período do topo é um mês só; gIrMes leva a ele (o período vale para todas as abas)
const gAno = () => !(S.periodo && S.periodo.de === S.periodo.ate);
function gIrMes(m) { S.mes = m; S.periodo = { de: m, ate: m }; }
const gEstado = () => (S.gf = S.gf || { q: '', cat: '', tipo: 'todos', area: '', agrupar: 'data', lim: 80 });
const gMesNome = () => { if (!gAno()) return MES_LONGO[S.mes]; if (!S.periodo) return String(S.year); const [de, ate] = perIntervalo(); return de === ate ? MES_LONGO[de] : `${MES_LONGO[de]} a ${MES_LONGO[ate]}`; };
const gSinal = (d) => (d == null ? '' : `${d >= 0 ? '+' : '−'}${pct(Math.abs(d))}`);
const DIA_SEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// entradas do ano e a análise do período: uma vez por desenho da tela
function gastosDados() {
  if (S.gCache && S.gCache.seq === S.renderSeq && S.gCache.plan === S.plan) return S.gCache;
  indiceMeses(); const ents = [];
  for (let m = 0; m < 12; m++) entradasMes(m).forEach((e) => { e.m = m; ents.push(e); });
  const parcelados = S.plan.despesas.concat(planCtx().carry).filter((it) => it.parcel);
  const hoje = S.year === NOW_Y ? { mes: NOW_M, dia: new Date().getDate() } : null;
  const G = E.analiseGastos({ ano: S.year, mes: gAno() ? -1 : S.mes, ...perJanela(), entradas: ents, catsDesp: S.plan.catsDesp, orcamento: S.C.orcamento, hoje, parcelados });
  S.gCache = { seq: S.renderSeq, plan: S.plan, ents, G }; return S.gCache;
}

/* ---- os quatro números do período ---- */
function gNumeros(G) {
  const ano = G.mes < 0; const nomeP = gMesNome(); const C = S.C;
  const orcLinha = ano ? (G.orcamento > 0 ? `de ${brl0(G.orcamento)} orçados no ano` : 'Sem orçamento definido no ano.')
    : `<span class="g-orc">Orçamento: ${orcEl(S.mes)}</span>`;
  const tom = G.uso == null ? '' : G.uso > 1 ? 'neg' : G.uso > 0.85 ? 'warn' : 'ok';
  const restoTxt = G.restante == null ? '' : G.restante >= 0 ? `Restam ${brl0(G.restante)}.` : `${brl0(-G.restante)} acima do orçado.`;
  const k1 = `<section class="kpi g-k1"><small class="kpi-k">Gasto ${ano ? 'em ' : 'em '}${esc(nomeP)}</small><div class="kpi-v ${tom === 'neg' ? 'neg' : ''}"><span class="num">${brl0(G.total)}</span>${varChip('despesas', -1)}</div>${G.uso != null ? barra(G.uso, tom === 'ok' ? 'ok' : tom) : ''}<p class="kpi-s">${orcLinha}${restoTxt ? ' ' + restoTxt : ''}</p>${!ano && C.orcamento[S.mes] > 0 ? `<button class="lnk strong g-orc-all" data-act="orc-all" data-m="${S.mes}">Usar este orçamento em todos os meses</button>` : ''}</section>`;
  let k2;
  if (!ano && G.ritmo && G.ritmo.diaAtual) {
    const r = G.ritmo; const acima = G.orcamento > 0 && r.projecao > G.orcamento;
    k2 = kpi('Projeção do mês', `<span class="num${acima ? ' neg' : ''}">${brl0(r.projecao)}</span>`, `No ritmo de ${brl0(r.porDia)} por dia.${r.cabeDia != null ? (r.cabeDia > 0 ? ` Para fechar no orçamento, até ${brl0(r.cabeDia)} por dia daqui em diante.` : ' O orçamento do mês já foi usado.') : ''}`);
  } else if (!ano) k2 = kpi('Média por dia', `<span class="num">${brl0(G.ritmo ? G.ritmo.mediaDia : 0)}</span>`, `nos ${G.ritmo ? G.ritmo.dias : 30} dias de ${esc(nomeP)}.`);
  else k2 = kpi('Média por mês', `<span class="num">${brl0(G.mediaMes)}</span>`, `${perJanela().meses - perJanela().de} ${perJanela().meses - perJanela().de === 1 ? 'mês' : 'meses'}${ateMes()}.`);
  let k3;
  if (!ano) k3 = G.delta == null ? kpi('Contra a média', '–', 'Aparece quando houver gastos nos meses anteriores.')
    : kpi('Contra a média', `<span class="${G.delta > 0.1 ? 'neg' : G.delta < -0.05 ? 'pos' : ''}">${gSinal(G.delta)}</span>`, `Média dos ${G.baseMeses} ${G.baseMeses === 1 ? 'mês anterior' : 'meses anteriores'}: ${brl0(G.base)}.${S.year === NOW_Y && S.mes === NOW_M ? ' O mês ainda está em andamento.' : ''}`);
  else { const mx = Math.max(...G.porMes); const im = G.porMes.indexOf(mx); k3 = kpi('Mês mais caro', mx > 0 ? `<span class="num">${brl0(mx)}</span>` : '–', mx > 0 ? `${cap(MES_LONGO[im])}. <button class="lnk strong" data-act="g-mes" data-m="${im}">Ver o mês</button>` : 'Sem gastos no ano.'); }
  const k4 = kpi('Gastos fixos', G.pctFixos == null ? '–' : pct(G.pctFixos), G.total > 0 ? `${brl0(G.fixos)} fixos e ${brl0(G.total - G.fixos)} variáveis.` : 'Aparece quando houver gastos.', G.pctFixos == null ? '' : barra(G.pctFixos, G.pctFixos > 0.6 ? 'warn' : ''));
  return `<div class="kpis g-kpis">${k1}${k2}${k3}${k4}</div>`;
}

/* ---- widgets de análise ---- */
const gCard = (id, titulo, corpo, extra) => `<section class="card g-w"><div class="c-h"><h3>${esc(titulo)}</h3>${extra || ''}</div>${corpo}</section>`;
const gVazio = (t) => `<p class="empty-s">${t}</p>`;
// Contas do mês (Gastos e Visão geral): gastos fixos e parcelas que caem no mês, pagos (já lançados) ou previstos, por E.contasMes;
// tocar numa conta abre o gasto no formulário único
function contasHtml(m) {
  const K = E.contasMes({ despesas: S.plan.despesas, carry: E.carryItems(S.plans, S.year), ano: S.year, mes: m }); const f = K.total > 0 ? K.pago / K.total : 0;
  const lin = (x) => `<li><button class="ct-it${x.pago ? ' pago' : ''}" ${x.herdado ? `data-act="year-pick" data-year="${x.herdado}"` : `data-act="edit-item" data-kind="desp" data-id="${esc(x.id)}"`}>${instIcone(x.inst)}<span class="ct-n"><b>${esc(x.nome)}</b><small>${[x.area, x.parcela ? `parcela ${x.parcela.i} de ${x.parcela.n}` : 'todo mês'].filter(Boolean).map(esc).join(' · ')}</small></span><span class="ct-v"><b>${brl(x.valor)}</b><em class="ct-st">${x.pago ? 'Pago' : 'Previsto'}</em></span></button></li>`;
  return `<section class="card ct"><div class="c-h"><h3>Contas de ${MES_LONGO[m]}</h3><button class="lnk strong" data-act="add-item" data-kind="desp">Nova conta</button></div>
    ${K.itens.length ? `<div class="ct-top"><div><small>Pago</small><b>${brl(K.pago)}</b></div><div><small>Falta pagar</small><b>${brl(K.falta)}</b></div></div><span class="kbar ok" aria-hidden="true"><i style="width:${(f * 100).toFixed(1)}%"></i></span>
    <ul class="ct-l">${K.itens.map(lin).join('')}</ul>` : gVazio('Nenhuma conta fixa ou parcela neste mês. Use “Todo mês” ou “Parcelado” no Novo gasto.')}</section>`;
}
function gWidgets(G) {
  const ano = G.mes < 0; const L = painelLayout('gastos').filter((x) => x.on); const liga = new Set(L.map((x) => x.id)); const html = {};
  const add = (id, h) => { if (liga.has(id) && h) html[id] = h; };
  // para onde foi: barra por categoria e as áreas, com a média ao lado
  const mxA = G.porArea.length ? G.porArea[0].total : 1;
  add('onde', gCard('onde', 'Para onde foi o dinheiro', G.porArea.length ? `<div class="g-catbar" role="img" aria-label="Divisão por categoria">${G.porCat.map((c, i) => `<i style="width:${(c.pct * 100).toFixed(2)}%;--bc:${PAL[i % 6]}" title="${esc(c.nome)}: ${pct(c.pct)}"></i>`).join('')}</div>
    ${legenda(G.porCat.map((c, i) => [PAL[i % 6], `${c.nome} ${pct(c.pct)}`]))}
    <ul class="g-areas">${G.porArea.slice(0, 8).map((a) => { const d0 = a.media > 0 ? a.total / a.media - 1 : null; const d = d0 != null && S.year === NOW_Y && G.mes === NOW_M && d0 < 0 ? null : d0; const ci = Math.max(0, G.porCat.findIndex((c) => c.k === a.k.split('|')[0]));
      return `<li><button class="g-area" data-act="g-area" data-area="${esc(a.nome)}" title="Ver os lançamentos de ${esc(a.nome)}"><span class="g-area-n"><b>${esc(a.nome)}</b><small>${esc(a.catNome)} · ${a.qtd} ${a.qtd === 1 ? 'lançamento' : 'lançamentos'}</small></span>
        <span class="g-area-t"><i style="width:${((a.total / mxA) * 100).toFixed(1)}%;--bc:${PAL[ci % 6]}"></i></span>
        <span class="g-area-v"><b>${brl0(a.total)}</b><small>${pct(a.pct)}${d != null && Math.abs(d) >= 0.05 ? ` · <em class="${d > 0 ? 'neg' : 'pos'}">${gSinal(d)}</em>` : ''}</small></span></button></li>`; }).join('')}</ul>
    ${G.porArea.length > 8 ? `<p class="cap">E mais ${G.porArea.length - 8} ${G.porArea.length - 8 === 1 ? 'área' : 'áreas'} na lista abaixo.</p>` : ''}` : gVazio('Sem gastos neste período.')));
  // ritmo do mês
  if (!ano && G.ritmo) add('ritmo', gCard('ritmo', 'Ritmo do mês', `<div class="chart" id="g-ritmo"></div>${legenda([['var(--c1)', 'Gasto acumulado']].concat(G.ritmo.diaAtual ? [['var(--c3)', 'Projeção']] : []).concat(G.orcamento > 0 ? [['var(--c4)', 'Orçamento']] : []))}
    <p class="cap">Gastos previstos e parcelas entram no dia 1; os lançamentos reais, no dia em que aconteceram.</p>`));
  // mês a mês
  { const C = S.C; const lim = S.year === NOW_Y ? NOW_M : 11; const comOrc = MES.map((_, i) => i).filter((i) => i <= lim && C.orcamento[i] > 0); const dentro = comOrc.filter((i) => C.despesas[i] <= C.orcamento[i]).length;
    add('mensal', gCard('mensal', 'Mês a mês', `${legenda(['pos', 'warn', 'neg', 'sem'].map((k) => ORC_SIT[k]).concat([['var(--ink-3)', 'Orçado']]))}<div class="chart" id="g-mensal"></div><p class="cap">Cada mês na cor do orçamento. Toque em um mês para abri-lo.</p>`,
      comOrc.length ? `<small class="c-note">${dentro} de ${comOrc.length} ${comOrc.length === 1 ? 'mês' : 'meses'} dentro</small>` : '')); }
  // o que mudou
  if (!ano) add('mudou', gCard('mudou', 'O que mudou', G.baseMeses ? (G.mudou.length ? `<ul class="g-lista">${G.mudou.map((x) => `<li><button class="g-li" data-act="g-area" data-area="${esc(x.nome)}"><span><b>${esc(x.nome)}</b><small>${esc(x.catNome)} · média ${brl0(x.media)}</small></span><span class="g-li-v"><b>${brl0(x.agora)}</b><small class="${x.dif > 0 ? 'neg' : 'pos'}">${x.pct == null ? 'novo no período' : gSinal(x.pct)}</small></span></button></li>`).join('')}</ul>`
    : gVazio('Nenhuma área fugiu da média dos meses anteriores.')) : gVazio('Aparece quando houver gastos nos meses anteriores.'), `<small class="c-note">contra ${G.baseMeses || 0} ${G.baseMeses === 1 ? 'mês anterior' : 'meses anteriores'}</small>`));
  // maiores gastos
  add('top', gCard('top', 'Maiores gastos', G.top.length ? `<ul class="g-lista">${G.top.map((e) => `<li><button class="g-li" ${gAcaoEnt(e)}><span><b>${esc(e.nome)}</b><small>${e.dia ? `${pad2(e.dia)}/${pad2(e.m + 1)}` : MES[e.m] + ', previsto'} · ${esc(e.area)}</small></span><span class="g-li-v"><b>${brl(e.valor)}</b><small>${G.total > 0 ? pct(e.valor / G.total) + ' do período' : ''}</small></span></button></li>`).join('')}</ul>` : gVazio('Sem gastos neste período.')));
  // onde mais compra
  add('estab', gCard('estab', 'Onde você mais compra', G.estab.length ? `<ul class="g-lista">${G.estab.map((x) => `<li><button class="g-li" data-act="g-busca" data-q="${esc(x.k)}"><span><b>${esc(x.nome)}</b><small>${x.qtd} ${x.qtd === 1 ? 'compra' : 'compras'} · média de ${brl(x.media)}</small></span><span class="g-li-v"><b>${brl0(x.total)}</b><small>${pct(x.pct)}</small></span></button></li>`).join('')}</ul>` : gVazio('Aparece quando houver lançamentos reais (importados ou lançados à mão).')));
  // recorrentes
  add('recorr', gCard('recorr', 'Assinaturas e contas recorrentes', G.recorrentes.length ? `<ul class="g-lista">${G.recorrentes.slice(0, 8).map((x) => `<li class="g-rec"><button class="g-li" data-act="g-busca" data-q="${esc(E.nomeEstab(x.nome))}"><span><b>${esc(x.nome)}</b><small>em ${x.meses} meses · último em ${MES[x.ultimoMes]}</small></span><span class="g-li-v"><b>${brl(x.media)}</b><small>por mês</small></span></button>${gEhFixo(x.nome) ? '<span class="badge prev">Fixo</span>' : x.ultimoMes < 11 ? `<button class="btn sm" data-act="g-fixo" data-nome="${esc(x.nome)}" data-valor="${x.ultimo}" data-m="${x.ultimoMes}">Tornar fixo</button>` : ''}</li>`).join('')}</ul>
    <p class="g-foot">Somam cerca de <b>${brl0(G.recorrentesMes)}</b> por mês${G.recorrentes.length > 8 ? ` (${G.recorrentes.length} no total)` : ''}.</p>` : gVazio('Nada se repetiu com valor parecido em vários meses até aqui.')));
  // parcelamentos
  add('parc', gCard('parc', 'Parcelamentos em andamento', G.parcelas.length ? `<ul class="g-lista">${G.parcelas.map((x) => `<li><div class="g-li"><span><b>${esc(x.nome)}</b><small>Parcela ${x.i} de ${x.n} · termina em ${MES[x.fim.mes]}/${String(x.fim.ano).slice(2)}</small></span><span class="g-li-v"><b>${brl(x.valor)}</b><small>faltam ${brl0(x.restante)}</small></span></div></li>`).join('')}</ul>
    <p class="g-foot"><b>${brl0(G.parcelasMes)}</b> por mês em parcelas; ainda faltam <b>${brl0(G.parcelasRestante)}</b>.</p>` : gVazio('Nenhum parcelamento correndo neste período.'), `<button class="lnk strong" data-act="add-item" data-kind="desp" data-parc="1">Novo parcelamento</button>`));
  add('contas', contasHtml(gAno() ? (S.year === NOW_Y ? NOW_M : 11) : S.mes));
  // dia da semana
  add('semana', gCard('semana', 'Por dia da semana', G.semana.some((v) => v > 0) ? `<div class="chart" id="g-semana"></div>` : gVazio('Aparece quando houver lançamentos reais com data.')));
  // por instituição: todos os gastos do período (com data, previstos e parcelas); tocar filtra a lista
  { const meses = new Set(G.mes >= 0 ? [G.mes] : perIds()); const soma = {}; let tot = 0;
    gastosDados().ents.forEach((e) => { if (!meses.has(e.m) || !(e.valor > 0)) return; const k = instDe(e.inst) ? e.inst : ''; soma[k] = (soma[k] || 0) + e.valor; tot += e.valor; });
    const L = Object.keys(soma).map((k) => ({ k, v: soma[k] })).sort((a, b) => b.v - a.v); const mx = L.length ? L[0].v : 1;
    add('inst', gCard('inst', 'Por instituição', L.length ? `<ul class="g-areas">${L.map((x) => { const nome = x.k ? instDe(x.k)[1] : 'Sem instituição';
      return `<li><button class="g-area g-inst" ${x.k ? `data-act="g-busca" data-q="${esc(nome)}"` : 'disabled'}>${instIcone(x.k)}<span class="g-area-n"><b>${esc(nome)}</b></span>
        <span class="g-area-t"><i style="width:${((x.v / mx) * 100).toFixed(1)}%;--bc:${x.k ? instDe(x.k)[2] : 'var(--ink-3)'}"></i></span><span class="g-area-v"><b>${brl0(x.v)}</b><small>${pct(x.v / tot)}</small></span></button></li>`; }).join('')}</ul>
      ${soma[''] ? '<p class="cap">Marque "Pago com" nos lançamentos para separar o que está sem instituição.</p>' : ''}` : gVazio('Sem gastos neste período.')));
        // meus cartões: um cartão por instituição usada no período, na cor dela, com o gasto e a fatia; tocar filtra a lista
    const C2 = L.filter((x) => x.k); const quando = G.mes >= 0 ? 'em ' + MES_LONGO[G.mes] : perFrase();
    add('cartoes', gCard('cartoes', 'Meus cartões', C2.length ? `<div class="cc-cards" role="list">${C2.map((x) => { const i = instDe(x.k); return `<button class="cc-card" role="listitem" style="--cb:${i[2]};--cf:${i[3]}" data-act="g-busca" data-q="${esc(i[1])}" aria-label="${esc(i[1])}: ${esc(brl(x.v))} ${esc(quando)}"><span class="cc-tex" aria-hidden="true"></span><span class="cc-top"><span class="cc-nfc" aria-hidden="true">${CC_NFC}</span><span class="cc-nome">${esc(i[1])}</span>${instIcone(x.k)}</span><span class="cc-pe"><span><small>Gasto ${esc(quando)}</small><b class="cc-v">${brl(x.v)}</b></span><span><small>Do total</small><b>${pct(x.v / tot)}</b></span></span></button>`; }).join('')}</div>` : gVazio('Marque "Pago com" ao lançar um gasto para ver um cartão por banco ou carteira.'))); }
  // limites por área: sempre de um mês (o escolhido; na visão do ano, o mês atual)
  { const m = G.mes >= 0 ? G.mes : S.year === NOW_Y ? NOW_M : 11; const L = E.analiseLimites((S.plan.settings || {}).limites, E.gastosAreaMes(S.plan, planCtx().carry, m)); const cor = { ok: 'var(--pos)', perto: 'var(--warn)', passou: 'var(--neg)' };
    const segL = L.reduce((t, x) => t + x.limite, 0); const segG = L.reduce((t, x) => t + x.gasto, 0); // barra em segmentos: tamanho = limite, preenchido até o gasto
    const seg = L.length ? `<div class="lim-seg-h"><b>${brl0(segG)}</b><small>de ${brl0(segL)} somando os limites</small></div><div class="lim-seg" role="img" aria-label="Uso de cada limite">${L.map((x, i) => `<span style="flex:${x.limite}" title="${esc(x.area)}: ${pct(x.uso)}"><i style="width:${Math.min(100, x.uso * 100).toFixed(1)}%;--bc:${x.sit === 'passou' ? 'var(--neg)' : PAL[i % 6]}"></i></span>`).join('')}</div><ul class="lim-leg">${L.map((x, i) => `<li><i style="--bc:${x.sit === 'passou' ? 'var(--neg)' : PAL[i % 6]}"></i>${esc(x.area)} (${pct(x.uso)})</li>`).join('')}</ul>` : '';
    add('limites', gCard('limites', 'Limites por área', L.length ? seg + `<ul class="g-areas">${L.map((x) => `<li><button class="g-area g-lim ${x.sit}" data-act="g-limite" data-area="${esc(x.area)}" title="Alterar o limite de ${esc(x.area)}"><span class="g-area-n"><b>${esc(x.area)}</b><small>${x.sit === 'passou' ? `${brl0(-x.falta)} acima` : `restam ${brl0(x.falta)}`}</small></span>
        <span class="g-area-t"><i style="width:${Math.min(100, x.uso * 100).toFixed(1)}%;--bc:${cor[x.sit]}"></i></span><span class="g-area-v"><b>${brl0(x.gasto)}</b><small>de ${brl0(x.limite)}</small></span></button></li>`).join('')}</ul>`
      : gVazio('Defina um limite por mês para as áreas que pesam mais, como Alimentação ou Lazer.'), `<button class="lnk strong" data-act="g-limite">${L.length ? 'Novo limite' : 'Definir limite'}</button>`)); }
  return telaWidgetsHtml('gastos', html);
}
const gAcaoEnt = (e) => (e.tipo === 'real' ? `data-act="edit-lanc" data-id="${esc(e.id)}"` : e.herdado ? `data-act="year-pick" data-year="${e.herdado}"` : `data-act="edit-item" data-kind="desp" data-id="${esc(e.id)}"`);

/* ---- lista de lançamentos: busca, filtros e agrupamento ---- */
function gFiltrar(ents) {
  const f = gEstado(); const q = E.norm(f.q); const ano = gAno();
  return ents.filter((e) => (ano || e.m === S.mes) && (!f.cat || e.cat === f.cat) && (!f.area || e.area === f.area)
    && (f.tipo === 'todos' || (f.tipo === 'real' ? e.tipo === 'real' : f.tipo === 'prev' ? e.tipo !== 'real' : e.tipo === 'real' && e.origem && e.origem !== 'manual'))
    && (!q || E.norm(e.nome + ' ' + e.area + ' ' + (e.sub || '') + ' ' + ((instDe(e.inst) || [])[1] || '')).includes(q) || E.nomeEstab(e.nome).includes(q)));
}
function gLinha(e) {
  const catN = (S.plan.catsDesp.find((c) => c.id === e.cat) || {}).nome || 'Sem categoria';
  const b = [];
  if (e.tipo === 'prev') { if (e.parcela) b.push(`<span class="badge parc">Parcela ${e.parcela}</span>`); if (e.herdado) b.push(`<span class="badge">de ${e.herdado}</span>`); }
  else { if (e.origem === 'csv' || e.origem === 'ofx' || e.origem === 'import') b.push('<span class="badge imp">Importado</span>'); if (e.origem === 'ia') b.push('<span class="badge ia">IA</span>'); }
  // status em pílula à direita, embaixo do valor (como Received / Processed)
  const st = e.tipo === 'prev' ? ['prev', 'Previsto'] : e.valor < 0 ? ['estorno', 'Estorno'] : e.itemId ? ['conc', 'Conciliado'] : ['pago', 'Pago'];
  return `<li class="g-ent"><button class="g-ent-b" ${gAcaoEnt(e)}>${instIcone(e.inst)}<span class="g-ent-n"><b>${esc(e.nome)}</b><small>${b.length ? `<span class="ent-b">${b.join('')}</span>` : ''}${esc(catN)} · ${esc(e.area)}${e.sub ? ' › ' + esc(e.sub) : ''}</small></span>
    <span class="g-ent-r"><span class="g-ent-v${e.valor < 0 ? ' pos' : ''}">${e.valor < 0 ? '−' : ''}${brl(Math.abs(e.valor))}</span><em class="ent-st ${st[0]}">${st[1]}</em></span></button></li>`;
}
function gListaHtml() {
  const { ents } = gastosDados(); const f = gEstado(); const lista = gFiltrar(ents); const ano = gAno();
  const total = lista.reduce((s, e) => s + e.valor, 0);
  if (!lista.length) return `<p class="g-resumo">Nenhum lançamento${f.q || f.cat || f.area || f.tipo !== 'todos' ? ' com estes filtros' : ' neste período'}.</p>${f.q || f.cat || f.area || f.tipo !== 'todos' ? '<p><button class="btn sm" data-act="g-limpa">Limpar filtros</button></p>' : ''}`;
  const resumo = `<p class="g-resumo">${lista.length} ${lista.length === 1 ? 'lançamento' : 'lançamentos'} · <b>${brl(total)}</b></p>`;
  if (f.agrupar === 'cat') {
    const cats = S.plan.catsDesp.map((c) => c.id).concat(['__sem']);
    const grupos = cats.map((id) => { const l = lista.filter((e) => (id === '__sem' ? !S.plan.catsDesp.some((c) => c.id === e.cat) : e.cat === id)); return { id, nome: id === '__sem' ? 'Sem categoria' : S.plan.catsDesp.find((c) => c.id === id).nome, l }; }).filter((g) => g.l.length);
    return resumo + grupos.map((g) => { const areas = [...new Set(g.l.map((e) => e.area))].map((a) => ({ a, l: g.l.filter((e) => e.area === a) })).sort((x, y) => y.l.reduce((s, e) => s + e.valor, 0) - x.l.reduce((s, e) => s + e.valor, 0));
      return `<section class="g-grupo"><h4 class="g-grupo-h"><span>${esc(g.nome)}</span><span>${brl(g.l.reduce((s, e) => s + e.valor, 0))}</span></h4>${areas.map((x) => `<div class="g-sub"><div class="g-sub-h"><button class="lnk" data-act="rename-grp" data-cat="${esc(g.id)}" data-area="${esc(x.a)}" title="Renomear área">${esc(x.a)}</button><span>${brl(x.l.reduce((s, e) => s + e.valor, 0))}</span></div><ul class="g-ents">${x.l.sort((p, q2) => q2.valor - p.valor).map(gLinha).join('')}</ul></div>`).join('')}</section>`; }).join('');
  }
  // por data: reais do mais recente para o mais antigo; previstos e parcelas no fim de cada mês
  const ordem = lista.slice().sort((x, y) => y.m - x.m || (y.dia || 0) - (x.dia || 0) || y.valor - x.valor).slice(0, f.lim);
  const chave = (e) => (e.tipo === 'real' && e.dia ? `${e.m}-${e.dia}` : `${e.m}-prev`);
  const grupos = []; ordem.forEach((e) => { const k = chave(e); let g = grupos[grupos.length - 1]; if (!g || g.k !== k) { g = { k, e, l: [] }; grupos.push(g); } g.l.push(e); });
  const titulo = (e) => (e.tipo === 'real' && e.dia ? `${DIA_SEM[new Date(S.year, e.m, e.dia).getDay()]}, ${e.dia} de ${MES_LONGO[e.m]}` : `Previstos e parcelas de ${MES_LONGO[e.m]}`);
  const mais = lista.length > f.lim ? `<div class="g-mais"><button class="btn" data-act="g-mais">Mostrar mais ${Math.min(80, lista.length - f.lim)} de ${lista.length - f.lim}</button></div>` : '';
  return resumo + grupos.map((g) => `<section class="g-grupo"><h4 class="g-grupo-h"><span>${titulo(g.e)}</span><span>${brl(g.l.reduce((s, e) => s + e.valor, 0))}</span></h4><ul class="g-ents">${g.l.map(gLinha).join('')}</ul></section>`).join('') + mais;
}
function gListaAtualiza() { const el = document.getElementById('g-lista-c'); if (el) el.innerHTML = gListaHtml(); const fx = document.getElementById('g-filtros-ativos'); if (fx) fx.innerHTML = gFiltrosAtivos(); }
const gFiltrosAtivos = () => { const f = gEstado(); return f.area ? `<button class="g-chip" data-act="g-area" data-area="" aria-label="Tirar o filtro de área">Área: ${esc(f.area)} <span aria-hidden="true">×</span></button>` : ''; };
function gLancamentos() {
  const f = gEstado(); const mr = gAno() ? (S.year === NOW_Y ? NOW_M : 11) : S.mes;
  const tipos = [['todos', 'Todos'], ['real', 'Reais'], ['prev', 'Previstos'], ['imp', 'Importados']];
  const aberto = !!S.planilha.gastos; const { ents } = gastosDados(); const doPer = ents.filter((e) => gAno() || e.m === S.mes); const tot = doPer.reduce((s2, e) => s2 + e.valor, 0);
  return `<section class="sheet-sec g-lanc" id="g-lancamentos" data-open="${aberto}"><button class="sheet-tg" data-act="planilha-toggle" data-kind="gastos" aria-expanded="${aberto}"><span class="macc-ch">${I.chev}</span><span><b>Lançamentos de ${esc(gMesNome())}</b><small>${doPer.length} ${doPer.length === 1 ? 'lançamento' : 'lançamentos'} · ${brl(tot)}. Busque, filtre e edite cada um.</small></span></button>
    ${aberto ? `<div class="g-lanc-c"><div class="btn-row g-lanc-a"><button class="btn primary sm" data-act="add-lanc" data-mes="${mr}">${I.plus}Novo gasto</button></div>
    <div class="g-tools">
      <input class="search g-busca" type="search" data-gf="q" value="${esc(f.q)}" placeholder="Buscar por nome, área ou estabelecimento" aria-label="Buscar lançamentos">
      <select class="g-sel" data-gf="cat" aria-label="Categoria"><option value="">Todas as categorias</option>${S.plan.catsDesp.map((c) => `<option value="${esc(c.id)}" ${f.cat === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
      <div class="seg" role="group" aria-label="Tipo">${tipos.map(([v, l]) => `<button class="${f.tipo === v ? 'on' : ''}" data-act="g-tipo" data-v="${v}" aria-pressed="${f.tipo === v}">${l}</button>`).join('')}</div>
      <div class="seg" role="group" aria-label="Agrupar"><button class="${f.agrupar === 'data' ? 'on' : ''}" data-act="g-agrup" data-v="data" aria-pressed="${f.agrupar === 'data'}">Por data</button><button class="${f.agrupar === 'cat' ? 'on' : ''}" data-act="g-agrup" data-v="cat" aria-pressed="${f.agrupar === 'cat'}">Por categoria</button></div>
      <span id="g-filtros-ativos">${gFiltrosAtivos()}</span>
    </div>
    <div id="g-lista-c">${gListaHtml()}</div></div>` : ''}</section>`;
}

function viewDespesas() {
  if (!gAno()) S.mes = S.periodo.de; // o mês escolhido no período do topo
  const p = S.plan; RI = 0; FIRST_ED = true; const mr = S.year === NOW_Y ? NOW_M : S.mes;
  const vazio = !p.lancamentos.length && !(S.C.T.despesas > 0) && !(S.C.T.orcamento > 0);
  const acts = `<button class="btn primary" data-act="ingest-open">${I.plus}Importar extrato</button><button class="btn" data-act="add-lanc" data-mes="${gAno() ? mr : S.mes}">Novo gasto</button>${yearControl()}`;
  const head = `<div class="page-h"><div><h2 class="title">Gastos</h2><p class="sub">Escolha o período no topo (um mês, alguns meses ou o ano todo): os números, as análises e a lista mostram o mesmo período.</p></div><div class="acts">${acts}</div></div>`;
  if (vazio) return `${head}<section class="cc-empty"><div class="cc-empty-ic" aria-hidden="true">${I.plus}</div><div class="cc-empty-tx"><h3>Seu ${S.year} começa pelo extrato</h3><p>Arraste o CSV ou OFX do seu banco: categorizamos tudo e você só confere. Leva menos de um minuto.</p></div><div class="cc-empty-acts"><button class="btn primary lg" data-act="ingest-open">Importar extrato</button><button class="btn ghost" data-act="add-lanc" data-mes="${mr}">Lançar manualmente</button></div></section>`;
  const { G } = gastosDados();
  return `${head}${gNumeros(G)}${gWidgets(G)}${gLancamentos()}`;
}

function gAcao(act, ds) {
  const f = gEstado();
  switch (act) {
    case 'g-tipo': f.tipo = ds.v; gListaAtualiza(); document.querySelectorAll('[data-act="g-tipo"]').forEach((b) => { const on = b.dataset.v === ds.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); return true;
    case 'g-agrup': f.agrupar = ds.v; gListaAtualiza(); document.querySelectorAll('[data-act="g-agrup"]').forEach((b) => { const on = b.dataset.v === ds.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); return true;
    case 'g-limite': gLimite(ds.area || ''); return true;
    case 'g-fixo': gTornarFixo(ds.nome, +ds.valor, +ds.m); return true;
    case 'g-area': f.area = ds.area || ''; f.lim = 80; if (f.area && !S.planilha.gastos) { S.planilha.gastos = true; render(); } else gListaAtualiza(); if (f.area) gIrLista(); return true;
    case 'g-busca': f.q = ds.q || ''; f.area = ''; f.lim = 80; if (!S.planilha.gastos) { S.planilha.gastos = true; render(); } else { const i = document.querySelector('[data-gf="q"]'); if (i) i.value = f.q; gListaAtualiza(); } gIrLista(); return true;
    case 'g-limpa': Object.assign(f, { q: '', cat: '', tipo: 'todos', area: '', lim: 80 }); render(); return true;
    case 'g-mais': f.lim += 80; gListaAtualiza(); return true;
    case 'g-pers': painelAcao('painel-abrir', { alvo: 'gastos' }); return true;
    default: return false;
  }
}
function gIrLista() { const el = document.getElementById('g-lancamentos'); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
let gBuscaT = null;
function gInput(t) { const f = gEstado(); f[t.dataset.gf] = t.value; f.lim = 80; clearTimeout(gBuscaT); gBuscaT = setTimeout(gListaAtualiza, t.dataset.gf === 'q' ? 140 : 0); }

function drawGastos() {
  const el = (id) => document.getElementById(id); if (!el('g-mensal') && !el('g-ritmo') && !el('g-semana')) return;
  const { G } = gastosDados(); const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (el('g-mensal')) { const sit = MES.map((_, i) => orcSit(i)); // mesma regra de cor do widget de orçamento da Visão geral
    (gAno() ? chartBarsPer : chartBars)(el('g-mensal'), { labels: MES, cur: gAno() ? cur : S.mes, height: altura(el('g-mensal')), aria: 'Gastos de cada mês na cor da situação do orçamento, com o orçado marcado. Toque em um mês para abri-lo.',
      bars: ['pos', 'warn', 'neg', 'sem'].map((k) => ({ color: ORC_SIT[k][0], values: C.despesas.map((v, i) => (sit[i] === k ? v : 0)) })), marks: [{ color: 'var(--ink-3)', values: C.orcamento }],
      onPick: (i) => { gIrMes(i); render(); },
      tip: (i) => `<b>${cap(MES_LONGO[i])}</b><br>Gasto: ${brl0(C.despesas[i])} (fixos ${brl0(G.fixosMes[i])}, variáveis ${brl0(G.variaveisMes[i])})<br>Orçado: ${C.orcamento[i] > 0 ? `${brl0(C.orcamento[i])} · ${C.despesas[i] <= C.orcamento[i] ? 'sobraram ' + brl0(C.orcamento[i] - C.despesas[i]) : brl0(C.despesas[i] - C.orcamento[i]) + ' acima'}` : 'sem orçamento'}` }); }
  if (el('g-ritmo') && G.ritmo) {
    const r = G.ritmo; const dias = Array.from({ length: r.dias }, (_, i) => String(i + 1)); const ate = r.diaAtual || r.dias;
    const real = r.acum.map((v, i) => (i < ate ? v : null));
    const series = [{ color: 'var(--c1)', values: real, area: true }];
    if (r.diaAtual && r.projecao != null) { const ini = r.acum[r.diaAtual - 1]; const passo = (r.projecao - ini) / Math.max(1, r.dias - r.diaAtual); series.push({ color: 'var(--c3)', dashed: true, values: r.acum.map((_, i) => (i < r.diaAtual - 1 ? null : ini + passo * (i - r.diaAtual + 1))) }); }
    chartLine(el('g-ritmo'), { height: 200, labels: dias.map((d, i) => (i % 5 === 0 || i === r.dias - 1 ? d : '')), aria: 'Gasto acumulado no mês, dia a dia, contra o orçamento', series,
      goal: G.orcamento > 0 ? G.orcamento : null, goalLabel: G.orcamento > 0 ? 'Orçamento ' + brl0(G.orcamento) : '', goalLeft: true,
      tip: (i) => `<b>Dia ${i + 1}</b><br>${real[i] != null ? 'Acumulado: ' + brl0(real[i]) : 'Projeção: ' + brl0(series[1] ? series[1].values[i] : 0)}` });
  }
  if (el('g-semana')) chartBars(el('g-semana'), { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], height: 170, aria: 'Gastos por dia da semana', bars: [{ color: 'var(--c1)', values: G.semana }],
    tip: (i) => `<b>${DIA_SEM[i]}</b><br>${brl0(G.semana[i])} em ${G.semanaQtd[i]} ${G.semanaQtd[i] === 1 ? 'compra' : 'compras'}` });
}

/* ---------------- Rendas: painel de estudo (widgets organizáveis) + detalhe recolhível ---------------- */
const R_WIDGETS = [
  { id: 'indicadores', nome: () => 'Indicadores da renda', desc: 'Entradas, previsibilidade, taxa de poupança e renda passiva.', tam: 6, tams: [6], padrao: () => true },
  { id: 'mensal', nome: () => 'Entradas mês a mês', desc: 'Entradas de cada mês por categoria, com o total de gastos marcado.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'estab', nome: () => 'Estabilidade', desc: 'Menor, maior e média dos meses, com os meses abaixo da média.', tam: 2, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'fontes', nome: () => 'De onde vem', desc: 'Ranking das fontes de renda, recorrentes ou eventuais.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'estudar', nome: () => 'Para estudar', desc: 'Leituras automáticas: dependência de uma fonte, oscilação, gastos fixos e poupança.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
];
function analiseRendaAtual() { return E.analiseRenda({ C: S.C, ...perJanela(), rendas: S.plan.rendas, rendaCats: S.plan.rendaCats }); }
function detalheRendas() {
  const p = S.plan; const C = S.C; const m = S.periodo ? perIntervalo()[1] : S.mes; // o mês vem do calendário do topo (fim do período)
  let body = '';
  if (S.modo === 'mes') {
    body = p.rendaCats.map((cat) => {
      const items = p.rendas.filter((r) => r.cat === cat.id);
      return catSection('renda', cat, items.reduce((s, r) => s + r.valores[m], 0), items.length ? items.map((it) => itemRow('renda', it, m)).join('') : emptyCat('Nenhuma renda nesta categoria.', 'renda', cat.id));
    }).join('');
    if (!p.rendaCats.length) body = '<p class="empty-s">Crie a primeira categoria de renda em “Categorias”.</p>';
    body += `<section class="lcat herd"><header class="lcat-h"><span class="chev-sp"></span><h3>Dividendos e proventos</h3><span class="lcat-t">${brl(C.dividendos[m])}</span></header><div class="lbody"><p class="empty-s">Calculados automaticamente a partir dos proventos que você registra.</p></div></section>`;
  } else {
    let b = '';
    p.rendaCats.forEach((cat) => {
      const items = p.rendas.filter((r) => r.cat === cat.id); b += groupRow({ label: cat.nome, depth: 0, v: items.reduce((s, r) => E.add(s, r.valores), E.z()) });
      items.forEach((it) => { const ri = RI++; b += `<tr><td class="lab"><div class="in" style="--d:1"><button class="lnk" data-act="edit-item" data-kind="renda" data-id="${esc(it.id)}">${esc(it.nome)}</button>${it.fonte ? `<small class="tag">${esc(it.fonte)}</small>` : ''}</div></td>${cells(it.valores, { k: 'rv', id: it.id, ri })}</tr>`; });
    });
    b += labRow('Dividendos e proventos', C.dividendos, { cls: 'r-g' }) + labRow('Total de entradas', C.receita, { cls: 'r-total' });
    body = `<div class="tablewrap"><table class="grid">${headRow('Categoria e renda')}<tbody>${b}</tbody></table></div>`;
  }
  const aberto = !!S.planilha.rendas;
  return `<section class="sheet-sec" data-open="${aberto}"><button class="sheet-tg" data-act="planilha-toggle" data-kind="rendas" aria-expanded="${aberto}"><span class="macc-ch">${I.chev}</span><span><b>Rendas mês a mês</b><small>Edite cada renda por mês ou veja o ano inteiro em tabela.</small></span></button>
    ${aberto ? `<div class="sheet-tools ltools">${S.modo === 'mes' ? `<span class="ltools-mes"><b>${cap(MES_LONGO[m])}</b><small>mês escolhido no calendário do topo</small></span>` : '<span></span>'}<div class="ltools-r">${modoToggle()}<button class="btn sm" data-act="cats" data-kind="renda">Categorias</button></div></div><div class="sheet-body">${body}</div>` : ''}</section>`;
}
function viewRendas() {
  const p = S.plan; RI = 0; FIRST_ED = true;
  const sub = 'De onde vem o seu dinheiro, quão previsível ele é e quanto dele sobra.';
  const acts = `${addBtn('add-item', 'Adicionar renda', 'data-kind="renda"')}<button class="btn" data-act="ingest-open">Importar extrato</button>`;
  if (!p.rendas.length && !(S.C.T.dividendos > 0)) {
    return `${pageHead('Rendas', sub)}<section class="cc-empty"><div class="cc-empty-ic" aria-hidden="true">${I.rendas}</div><div class="cc-empty-tx"><h3>Comece pela sua renda</h3><p>Cadastre o salário, pró-labore ou aluguel que recebe todo mês. Com isso, o painel mostra quanto sobra, quão previsível é a sua renda e quanto ela comporta de gastos fixos.</p></div>
      <div class="cc-empty-acts"><button class="btn primary lg" data-act="add-item" data-kind="renda">Adicionar renda</button><button class="btn ghost" data-act="ingest-open">Importar do extrato</button></div></section>${detalheRendas()}`;
  }
  const R = analiseRendaAtual(); const ate = ateMes();
  const k1 = kpi(S.periodo ? `Entradas ${perFrase()}` : S.year === NOW_Y ? `Entradas${ate}` : `Entradas em ${S.year}`, `<span class="num">${brl0(R.ateAgora)}</span>${varChip('receita', 1)}`, `Média de ${brl0(R.mediaMes)} por mês.${S.year === NOW_Y && R.anoPrevisto > R.ateAgora + 1 ? ` Previsto no ano: ${brl0(R.anoPrevisto)}.` : ''}`);
  const k2 = R.previsibilidade == null ? kpi('Previsibilidade', '–', 'Aparece quando houver rendas registradas.')
    : kpi('Previsibilidade', pct(R.previsibilidade), `da renda vem de fontes que se repetem todo mês (${brl0(R.recorrenteMes)} por mês).`, barra(R.previsibilidade, R.previsibilidade >= 0.8 ? 'ok' : R.previsibilidade < 0.5 ? 'warn' : ''));
  const k3 = R.poupanca == null ? kpi('Taxa de poupança', '–', 'Aparece quando houver entradas.')
    : kpi('Taxa de poupança', pct(R.poupanca), R.poupanca >= 0 ? `do que entrou sobrou depois dos gastos: ${brl0(R.sobraMes)} por mês.` : `Os gastos passaram as entradas em ${brl0(-R.sobraMes)} por mês.`, barra(Math.max(0, R.poupanca), R.poupanca >= 0.2 ? 'ok' : R.poupanca < 0.1 ? 'warn' : ''));
  const k4 = kpi('Renda passiva', R.passiva == null ? '–' : pct(R.passiva, 1), R.passivaMes > 0 ? `das entradas vem de proventos: ${brl0(R.passivaMes)} por mês. <button class="lnk strong" data-act="nav" data-view="pro">Ver Proventos</button>` : 'Nenhum provento ainda. Ele entra aqui sozinho quando você registra em Proventos.');
  const cores = R.porCat.map((c, i) => [PAL[i % 6], c.nome]);
  const leg = legenda(cores.concat(R.dividendosAte > 0 ? [['var(--c3)', 'Proventos']] : []).concat([['var(--c6)', 'Gastos']]));
  const top = R.fontes.slice(0, 7);
  const fontes = top.length ? `<ul class="rank">${top.map((f, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(f.nome)}">${esc(f.nome)}</b><small title="Recebida em ${f.mesesCom} de ${R.meses} meses">${esc(f.catNome)} · <span class="tagr${f.recorrente ? ' on' : ''}">${f.recorrente ? 'Recorrente' : 'Eventual'}</span></small></span><span class="rk-t"><i style="width:${(top[0].ate > 0 ? (f.ate / top[0].ate) * 100 : 0).toFixed(1)}%;--bc:${PAL[Math.max(0, R.porCat.findIndex((c) => c.id === f.cat)) % 6]}"></i></span><span class="rk-v">${brl0(f.ate)}<small>${pct(R.rendasAte > 0 ? f.ate / R.rendasAte : 0)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Nenhuma renda recebida até agora neste ano.</p>';
  // estabilidade: faixa do menor ao maior mês, com a média marcada
  const span = R.max - R.min; const pos = (v) => (span > 0 ? ((v - R.min) / span) * 100 : 50);
  const mx = Math.max(1, ...S.C.receita); const mini = `<div class="estab" aria-hidden="true">${S.C.receita.map((v, i) => `<span class="${i >= R.meses ? 'fut' : v < R.media * 0.9 ? 'low' : ''}" title="${MES_LONGO[i]}: ${brl0(v)}"><i style="height:${Math.max(3, (v / mx) * 100).toFixed(1)}%"></i><small>${MES[i][0]}</small></span>`).join('')}<em style="bottom:${((R.media / mx) * 100).toFixed(1)}%"></em></div>`;
  const estab = R.max > 0 ? `${mini}<div class="faixa"><div class="faixa-t"><i style="left:0;right:0"></i><em style="left:${pos(R.media).toFixed(1)}%"></em></div><div class="faixa-l"><span>Menor mês<b>${brl0(R.min)}</b></span><span class="c">Média<b>${brl0(R.media)}</b></span><span class="r">Maior mês<b>${brl0(R.max)}</b></span></div></div>
    <p class="kpi-s">${R.cv == null ? 'Com mais meses registrados, mostramos o quanto a sua renda varia.' : R.cv > 0.25 ? `Sua renda varia bastante (cerca de ${pct(R.cv)} em torno da média).` : `Renda estável: varia cerca de ${pct(R.cv)} em torno da média.`}${R.mesesSemRenda ? ` ${R.mesesSemRenda} ${R.mesesSemRenda === 1 ? 'mês' : 'meses'} sem entrada${ate}.` : ''}${S.C.receita.some((v, i) => i < R.meses && v < R.media * 0.9) ? ' Em laranja, os meses abaixo da média; a linha tracejada é a média.' : ''}</p>` : '<p class="empty-s">Sem entradas registradas até agora.</p>';
  const ins = [];
  if (R.maior && R.pesoMaior != null) ins.push(R.pesoMaior > 0.8
    ? ['warn', `<b>${esc(R.maior.nome)}</b> responde por ${pct(R.pesoMaior)} da sua renda. Com uma fonte principal, uma referência comum é manter de 6 a 12 meses de gastos em reserva: <b>${brl0(R.reserva[0])} a ${brl0(R.reserva[1])}</b>.`]
    : ['ok', `Sua renda está distribuída em ${R.nFontes} fontes; a maior (${esc(R.maior.nome)}) responde por ${pct(R.pesoMaior)}. Isso reduz o impacto de perder uma delas.`]);
  if (R.cv != null && R.cv > 0.25) ins.push(['warn', `A renda oscila entre ${brl0(R.min)} e ${brl0(R.max)}. Planeje os gastos fixos pelo mês mais fraco e guarde o excedente dos meses bons.`]);
  if (R.comprometimento != null) ins.push([R.comprometimento > 0.5 ? 'warn' : 'ok', `Os gastos fixos (${brl0(R.fixosMes)} por mês) consomem ${pct(R.comprometimento)} da sua renda recorrente. Uma referência usada em educação financeira é deixar até 50% para as necessidades.`]);
  if (R.poupanca != null) ins.push(R.poupanca >= 0.2 ? ['ok', `Você guarda ${pct(R.poupanca)} do que entra, acima da referência de 20%. É esse excedente que vira aporte em Investimentos.`] : ['info', `Sobram ${pct(Math.max(0, R.poupanca))} do que entra. Chegar a 20% significaria guardar cerca de ${brl0(Math.max(0, R.mediaMes * 0.2 - Math.max(0, R.sobraMes)))} a mais por mês.`]);
  if (R.coberturaPassiva) ins.push(['info', `Os proventos já pagam ${pct(R.coberturaPassiva, 1)} dos seus gastos. Em Proventos, o "número da independência" mostra quanto falta para pagarem tudo.`]);
  const html = {
    indicadores: `<div class="kpis">${k1}${k2}${k3}${k4}</div>`,
    mensal: `<section class="card"><div class="c-h"><h3>Entradas mês a mês</h3>${leg}</div><div class="chart" id="r-chart"></div><p class="cap">A marca vermelha é o total de gastos do mês: barra acima da marca é mês em que sobrou dinheiro.</p></section>`,
    estab: `<section class="card"><div class="c-h"><h3>Estabilidade</h3></div>${estab}</section>`,
    fontes: `<section class="card"><div class="c-h"><h3>De onde vem</h3><small class="c-note">${S.year === NOW_Y ? 'até ' + MES_LONGO[NOW_M] : 'no ano'}</small></div>${fontes}</section>`,
    estudar: `<section class="card study"><div class="c-h"><h3>Para estudar</h3></div><ul class="insights">${ins.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul></section>`,
  };
  return `${pageHead('Rendas', sub, acts)}${telaWidgetsHtml('rendas', html)}${detalheRendas()}`;
}

function drawLedger() {
  if (S.screen !== 'app' || !S.plan) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (S.view === 'despesas') drawGastos();
  if (S.view === 'rendas' && $('#r-chart')) {
    const cats = S.plan.rendaCats.filter((c) => E.sum(C.rendaCat[c.id] || E.z()) > 0);
    chartBarsPer($('#r-chart'), { labels: MES, cur, height: typeof altura === 'function' ? altura($('#r-chart')) : 210, aria: 'Entradas por mês por categoria, com o total de gastos marcado. Clique em um mês para ver o detalhe.',
      bars: cats.map((c, i) => ({ color: PAL[i % 6], values: C.rendaCat[c.id] })).concat([{ color: 'var(--c3)', values: C.dividendos }]), marks: [{ color: 'var(--c6)', values: C.despesas }],
      onPick: (i) => { S.periodo = { de: i, ate: i }; S.mes = i; S.modo = 'mes'; S.planilha.rendas = true; render(); const sec = document.querySelector('.sheet-sec'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      tip: (i) => `<b>${MES_LONGO[i]}</b>${cats.map((c) => `<br>${esc(c.nome)}: ${brl0(C.rendaCat[c.id][i])}`).join('')}<br>Proventos: ${brl0(C.dividendos[i])}<br>Gastos: ${brl0(C.despesas[i])}<br><b>${C.receita[i] - C.despesas[i] >= 0 ? 'Sobrou' : 'Faltou'}: ${brl0(Math.abs(C.receita[i] - C.despesas[i]))}</b>` });
  }
}

/* ---------------- modais: item, grupo e categorias ---------------- */
const mesOpts = () => MES.map((m, i) => [i, m]);
function parcPreview(total, n, mes, ano) {
  if (!(total > 0) || !(n >= 1)) return 'Informe o valor total e o número de parcelas.';
  const d = E.distribuir(total, n); const fim = E.parcelaFim({ n, ano, mes }); const igual = d.every((x) => Math.abs(x - d[0]) < 0.011);
  const txt = `${n} ${n === 1 ? 'parcela' : 'parcelas'} ${igual ? 'de ' + brl(d[0]) : 'de cerca de ' + brl(total / n)}, de ${MES[mes].toLowerCase()}/${ano} a ${MES[fim.mes].toLowerCase()}/${fim.ano}.`;
  return fim.ano > ano ? txt + ` As parcelas de ${fim.ano} aparecem sozinhas no planejamento de ${fim.ano}.` : txt;
}
function fillFrom(valores, v, m0) { for (let m = m0; m < 12; m++) valores[m] = v; }

function openItem(kind, id, preset) {
  const p = S.plan; preset = preset || {}; const isD = kind === 'desp';
  const list = isD ? p.despesas : p.rendas; const cats = isD ? p.catsDesp : p.rendaCats;
  if (!cats.length) { toast('Crie uma categoria primeiro.'); openCats(kind); return; }
  const it = id ? list.find((x) => x.id === id) : null; const cat = it ? it.cat : (preset.cat || cats[0].id); const parc = it && it.parcel;
  const body = `<label class="fld"><span>Categoria</span>${sel('cat', cats.map((c) => [c.id, c.nome]), cat)}</label>
    ${isD ? `<div class="fld-2"><label class="fld"><span>Área <small>(ex.: Moradia, Pessoal)</small></span><input name="area" list="dl-area" value="${esc(it ? it.area : preset.area || '')}" autocomplete="off"></label>
      <label class="fld"><span>Subárea <small>(opcional)</small></span><input name="sub" list="dl-sub" value="${esc(it ? it.sub || '' : '')}" autocomplete="off"></label></div>` : ''}
    <label class="fld"><span>${isD ? 'Nome do gasto' : 'Nome da renda'}</span><input name="nome" value="${esc(it ? it.nome : '')}" autocomplete="off"></label>
    ${isD ? '' : `<label class="fld"><span>Fonte <small>(opcional: empresa, cliente…)</small></span><input name="fonte" value="${esc(it ? it.fonte || '' : '')}" autocomplete="off"></label>`}
    ${isD ? `<fieldset class="plan-pick tight"><legend>Como esse gasto acontece</legend>
      <label class="pick"><input type="radio" name="tipo" value="mensal" ${parc ? '' : 'checked'}><span><b>Valores mensais</b><small>Um valor previsto por mês (aluguel, assinaturas). Quando o lançamento real chegar, ele pode substituir o previsto.</small></span></label>
      <label class="pick"><input type="radio" name="tipo" value="parcelado" ${parc ? 'checked' : ''}><span><b>Parcelado</b><small>Um único item: o valor total é dividido pelos meses automaticamente.</small></span></label></fieldset>` : ''}
    <div data-blk="mensal"><div class="fld-2"><label class="fld"><span>Valor mensal fixo <small>(opcional)</small></span><input name="fixo" inputmode="decimal" placeholder="Preenche vários meses de uma vez"></label><label class="fld"><span>A partir de</span>${sel('de', mesOpts(), preset.mes != null ? preset.mes : S.mes)}</label></div></div>
    ${isD ? `<div data-blk="parcelado" hidden><div class="fld-2"><label class="fld"><span>Valor total (R$)</span><input name="total" inputmode="decimal" value="${parc ? esc(String(parc.total).replace('.', ',')) : ''}"></label><label class="fld"><span>Parcelas</span><input name="n" inputmode="numeric" value="${parc ? parc.n : 10}"></label></div>
      <div class="fld-2"><label class="fld"><span>Primeiro mês</span>${sel('pmes', mesOpts(), parc ? parc.mes : preset.mes != null ? preset.mes : S.mes)}</label><label class="fld"><span>Ano</span><input name="pano" inputmode="numeric" maxlength="4" value="${parc ? parc.ano : S.year}"></label></div><p class="mmsg" data-prev></p></div>` : ''}
    ${isD ? dlist('dl-area', p.despesas.map((x) => x.area)) + dlist('dl-sub', p.despesas.map((x) => x.sub)) : ''}`;
  const f = openModal({
    title: it ? (isD ? 'Editar gasto previsto' : 'Editar renda') : (isD ? 'Gasto previsto ou parcelado' : 'Nova renda'), body, danger: it ? 'Excluir' : null,
    onDanger: () => { confirmBox(isD ? 'Excluir este gasto?' : 'Excluir esta renda?', `“${it.nome}” e seus valores serão removidos.`, 'Excluir', () => { const l = isD ? 'despesas' : 'rendas'; p[l] = p[l].filter((x) => x.id !== it.id); commit(); }); return false; },
    onOk: (d, err) => {
      const nome = (d.nome || '').trim(); if (!nome) return bad(err, 'Informe o nome.');
      const area = (d.area || '').trim(); if (isD && !area) return bad(err, 'Informe a área do gasto (ex.: Moradia).');
      let fixo = 0; const hasFixo = String(d.fixo || '').trim() !== ''; if (hasFixo) { fixo = E.parseValor(d.fixo); if (Number.isNaN(fixo)) return bad(err, 'Valor mensal inválido. Use números como 1.234,56'); }
      const parcelado = isD && d.tipo === 'parcelado'; let parcel = null;
      if (parcelado) {
        const total = E.parseValor(d.total); const n = parseInt(d.n, 10); const ano = parseInt(d.pano, 10);
        if (Number.isNaN(total) || !(total > 0)) return bad(err, 'Informe o valor total do parcelamento.');
        if (!(n >= 1 && n <= 120)) return bad(err, 'Informe de 1 a 120 parcelas.');
        if (!anoValido(ano)) return bad(err, 'Informe um ano válido para a primeira parcela.');
        parcel = { total, n, ano, mes: +d.pmes };
      }
      const base = { cat: d.cat, nome };
      if (isD) Object.assign(base, { area, sub: (d.sub || '').trim() }); else base.fonte = (d.fonte || '').trim();
      let target = it;
      if (!target) { target = Object.assign({ id: uid(), valores: z12() }, base); list.push(target); } else Object.assign(target, base);
      if (parcel) { target.parcel = parcel; target.valores = z12(); } else { delete target.parcel; if (hasFixo) fillFrom(target.valores, fixo, +d.de); }
      if (parcel && parcel.ano === S.year) S.mes = parcel.mes; S.fechadas[(isD ? 'desp:' : 'renda:') + target.cat] = false;
      commit();
    },
  });
  const refresh = () => {
    const tipo = f.elements.tipo ? f.elements.tipo.value : 'mensal';
    f.querySelectorAll('[data-blk]').forEach((b) => { b.hidden = b.dataset.blk !== tipo; });
    const pv = f.querySelector('[data-prev]'); if (pv && tipo === 'parcelado') pv.textContent = parcPreview(E.parseValor(f.elements.total.value) || 0, parseInt(f.elements.n.value, 10) || 0, +f.elements.pmes.value, parseInt(f.elements.pano.value, 10) || S.year);
  };
  f.addEventListener('input', refresh); f.addEventListener('change', refresh); refresh();
}

function openRename(catId, area, sub) {
  const isSub = sub != null; const atual = isSub ? sub : area;
  openModal({ title: isSub ? 'Renomear subárea' : 'Renomear área', body: `<label class="fld"><span>Novo nome</span><input name="nome" value="${esc(atual)}" autocomplete="off"></label><p class="mmsg">Vale para todos os gastos desta ${isSub ? 'subárea' : 'área'}.</p>`,
    onOk: (d, err) => {
      const nome = (d.nome || '').trim(); if (!nome) return bad(err, 'Informe o nome.');
      S.plan.despesas.forEach((it) => { if (it.cat === catId && it.area === area && (!isSub || it.sub === sub)) { if (isSub) it.sub = nome; else it.area = nome; } });
      commit();
    } });
}

/* gerenciador de categorias: criar, renomear, reordenar e excluir (serve para rendas e gastos) */
function openCats(kind) {
  const p = S.plan; const isD = kind === 'desp'; const cats = isD ? p.catsDesp : p.rendaCats; S.catKind = kind;
  const cnt = (c) => (isD ? p.despesas : p.rendas).filter((i) => i.cat === c.id).length;
  const rows = cats.map((c, i) => `<li class="catrow"><input data-cat-name="${c.id}" value="${esc(c.nome)}" aria-label="Nome da categoria" autocomplete="off"><span class="catn">${cnt(c)} ${cnt(c) === 1 ? 'item' : 'itens'}</span>
    <button type="button" class="icon-btn" data-act="cat-up" data-id="${c.id}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${I.up}</button><button type="button" class="icon-btn" data-act="cat-down" data-id="${c.id}" ${i === cats.length - 1 ? 'disabled' : ''} aria-label="Descer">${I.down}</button>
    <button type="button" class="icon-btn danger" data-act="cat-del" data-id="${c.id}" aria-label="Excluir categoria">${I.x}</button></li>`).join('');
  openModal({ title: isD ? 'Categorias de gastos' : 'Categorias de rendas', ok: 'Concluir', noCancel: true, onOk: () => true,
    body: `<p class="mmsg">Crie, renomeie e reordene. A ordem aqui é a ordem em que as categorias aparecem na tela.</p><ul class="catlist">${rows || '<li class="empty-s">Nenhuma categoria.</li>'}</ul>
      <div class="act-row"><input name="novacat" class="in-s left" placeholder="Nome da nova categoria" autocomplete="off" aria-label="Nome da nova categoria"><button type="button" class="btn" data-act="cat-add">Adicionar</button></div>` });
}
function catAction(act, id, nome) {
  const isD = S.catKind === 'desp'; const p = S.plan; const key = isD ? 'catsDesp' : 'rendaCats'; const cats = p[key]; const i = cats.findIndex((c) => c.id === id);
  if (act === 'cat-add') { const n = (nome || '').trim(); if (!n) { toast('Informe o nome da categoria.'); return; } cats.push({ id: uid(), nome: n }); }
  else if (act === 'cat-up' && i > 0) [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]];
  else if (act === 'cat-down' && i >= 0 && i < cats.length - 1) [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]];
  else if (act === 'cat-rename' && i >= 0) { const n = (nome || '').trim(); if (!n) { toast('A categoria precisa de um nome.'); return; } cats[i].nome = n; touch('plan'); render(); return; }
  else if (act === 'cat-del' && i >= 0) {
    const items = (isD ? p.despesas : p.rendas).filter((x) => x.cat === id);
    const ok = () => { p[isD ? 'despesas' : 'rendas'] = p[isD ? 'despesas' : 'rendas'].filter((x) => x.cat !== id); cats.splice(cats.findIndex((c) => c.id === id), 1); touch('plan'); render(); setTimeout(() => openCats(S.catKind), 0); };
    if (items.length) { confirmBox('Excluir categoria?', `“${cats[i].nome}” e ${items.length} ${items.length === 1 ? 'item' : 'itens'} serão removidos.`, 'Excluir', ok); return; }
    cats.splice(i, 1);
  } else return;
  touch('plan'); render(); setTimeout(() => openCats(S.catKind), 0);
}

/* ---------------- lançamento real (com data) ---------------- */
function desfazerBaixa(l) {
  if (!l.itemId) return; const d = E.parseDataISO(l.data); const it = S.plan.despesas.find((x) => x.id === l.itemId);
  if (it && it.baixas && d) delete it.baixas[d.ano + '-' + d.mes];
}
const tipoDaCategoria = (catId) => { const c = S.plan.catsDesp.find((x) => x.id === catId); return c && (c.id === 'fixa' || E.norm(c.nome).includes('fixa')) ? 'fixa' : 'variavel'; };
// recorrente que já tem gasto fixo (mesmo estabelecimento)
const gEhFixo = (nome) => { const k = E.nomeEstab(nome); return !!k && S.plan.despesas.some((it) => !it.parcel && E.nomeEstab(it.nome) === k); };
// "Tornar fixo": um gasto fixo com o último valor, nos meses depois do último lançamento, copiando categoria, área e instituição dele
function gTornarFixo(nome, valor, m) {
  const p = S.plan; const k = E.nomeEstab(nome); if (!k || !(valor > 0) || gEhFixo(nome)) return;
  const ult = p.lancamentos.filter((l) => E.nomeEstab(l.desc) === k).sort((a, b) => (a.data < b.data ? 1 : -1))[0] || {};
  p.despesas.push({ id: uid(), cat: ult.cat || (p.catsDesp[0] || {}).id, area: ult.area || 'Outros', sub: ult.sub || '', nome, inst: ult.inst || '', valores: E.repetirValores(valor, m) });
  touch('plan'); render(); toast(`“${nome}” agora é um gasto fixo de ${brl(valor)} por mês até dezembro.`);
}
// limite de uma área (por mês, vale para o ano do planejamento); valor vazio ou zero remove
function gLimite(area) {
  const p = S.plan; const lim = (p.settings.limites = p.settings.limites || {}); const atual = area ? +lim[area] || 0 : 0;
  const areas = [...new Set(p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area)).filter(Boolean))].sort();
  openModal({ title: area ? `Limite de ${area}` : 'Novo limite por área', ok: 'Salvar', danger: atual ? 'Remover' : null,
    body: `<label class="fld"><span>Área</span><input name="area" list="dl-lim" value="${esc(area)}" autocomplete="off" ${area ? 'readonly' : ''} placeholder="Ex.: Alimentação"></label>${dlist('dl-lim', areas)}
      <label class="fld"><span>Limite por mês (R$)</span><input name="valor" inputmode="decimal" value="${atual ? esc(String(atual).replace('.', ',')) : ''}" placeholder="0,00" autocomplete="off"></label>
      <p class="cap keep">Avisamos quando os gastos da área chegarem a 80% do limite e quando passarem dele.</p>`,
    onDanger: () => { delete lim[area]; touch('plan'); render(); },
    onOk: (d, err) => { const a = String(d.area || '').trim(); if (!a) { err('Informe a área.'); return false; }
      const v = d.valor && String(d.valor).trim() ? parseReais(d.valor) : 0; if (Number.isNaN(v) || v < 0) { err('Informe um valor válido.'); return false; }
      const k = Object.keys(lim).find((x) => E.norm(x) === E.norm(a)) || a; if (v > 0) lim[k] = E.r2(v); else delete lim[k]; touch('plan'); render(); } });
}
const CAT_NOVA = '__nova';
/* instituição de pagamento de cada gasto: ícone no jeito dos ícones da Apple, que se adaptam ao tema.
   A logo é só o símbolo (assets/img/inst, fontes em CREDITOS.md), aplicado como máscara: assim a cor dele pode mudar.
   Estilos (S.profile.instEstilo, no <html> como data-icones): "cor" (fundo na cor da instituição, símbolo claro),
   "escuro" (fundo grafite, símbolo na cor da instituição), "tingido" (vidro na cor de destaque, símbolo de uma cor só)
   e "auto" (cor no tema claro, escuro no escuro, tingido no personalizado).
   id, nome, cor da instituição, cor do símbolo sobre ela, sigla (sem logo), tamanho do símbolo no ícone (0 = sigla) */
// ícone de pagamento por aproximação do cartão
const CC_NFC = '<svg viewBox="0 0 24 24"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17"/></svg>';
const INSTITUICOES = [
  ['nubank', 'Nubank', '#820AD1', '#fff', 'nu', 0.6], ['itau', 'Itaú', '#FF6200', '#fff', 'itaú', 'itau.svg'], ['bradesco', 'Bradesco', '#CC092F', '#fff', 'B', 0.62],
  ['santander', 'Santander', '#EC0000', '#fff', 'S', 0.58], ['bb', 'Banco do Brasil', '#FCFC30', '#465EFF', 'BB', 0.62], ['caixa', 'Caixa', '#005CA9', '#fff', 'CX', 0.8],
  ['xp', 'XP', '#121212', '#fff', 'xp', 'xp.png'], ['btg', 'BTG Pactual', '#0D2B5E', '#fff', 'btg', 0.7], ['inter', 'Inter', '#FF7A00', '#fff', 'in', 0.8],
  ['c6', 'C6 Bank', '#1A1A1A', '#fff', 'C6', 0.6], ['picpay', 'PicPay', '#21C25E', '#fff', 'pp', 0.54], ['mercadopago', 'Mercado Pago', '#00B1EA', '#fff', 'mp', 0.68],
  ['sicoob', 'Sicoob', '#003641', '#C9D200', 'sc', 0.58], ['dinheiro', 'Dinheiro', '#2E7D32', '#fff', 'R$', 0], ['outra', 'Outra', '#6B7280', '#fff', '•', 0],
];
const instDe = (id) => INSTITUICOES.find((x) => x[0] === id) || null;
const instMinhas = () => (S.profile && S.profile.instituicoes) || [];
const INST_ESTILOS = [['auto', 'Automático'], ['cor', 'Cor'], ['escuro', 'Escuro'], ['tingido', 'Tingido']];
// ícone da instituição; sem instituição, um ícone vazio (mantém a lista alinhada)
function instIcone(id, cls) {
  const i = instDe(id); const c = 'inst-ic' + (cls ? ' ' + cls : ''); if (!i) return `<span class="${c} vazio" aria-hidden="true"></span>`;
  const inv = typeof i[5] === 'string'; const u = new URL(`assets/img/inst/${inv ? i[5] : i[0] + '.svg'}`, document.baseURI).href; // endereço completo: url() relativa numa variável CSS seria lida a partir do app.css
  return `<span class="${c}" style="--ib:${i[2]};--if:${i[3]}" role="img" aria-label="${esc(i[1])}" title="${esc(i[1])}">${inv ? `<i class="inv" style="--m:url(${u})"></i>` : i[5] ? `<i style="--m:url(${u});--k:${i[5]}"></i>` : `<b>${esc(i[4])}</b>`}</span>`;
}
// fichas: as minhas como escolha única (formulário) ou todas para marcar (painel e "Editar" no formulário)
const instFicha = (id, tipo, on, extra) => `<label class="inst-pill"><input type="${tipo}" ${extra} ${on ? 'checked' : ''}><span>${id ? instIcone(id) + esc(instDe(id)[1]) : 'Não informar'}</span></label>`;
const instTodasHtml = (attr) => INSTITUICOES.map(([id]) => instFicha(id, 'checkbox', instMinhas().includes(id), `${attr}="${id}"`)).join('');
function instMinhaAlternar(id, on) { if (!instDe(id)) return; const m = instMinhas().filter((x) => x !== id); if (on) m.push(id); S.profile.instituicoes = INSTITUICOES.map((x) => x[0]).filter((x) => m.includes(x)); touch('profile'); }
function instEstiloDefinir(v, btn) {
  S.profile.instEstilo = INST_ESTILOS.some((x) => x[0] === v) ? v : 'auto'; touch('profile'); document.documentElement.dataset.icones = S.profile.instEstilo;
  btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S.profile.instEstilo; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
// Painel › Planejamento › Minhas instituições: o cliente marca antes as que usa; só elas aparecem ao lançar um gasto
function instAdmHtml() {
  const e = (S.profile && S.profile.instEstilo) || 'auto';
  return `<section class="dr-sec"><h3>Minhas instituições</h3><p class="mmsg">Bancos, cartões e carteiras que você usa. Só eles aparecem ao lançar um gasto.</p>
    <div class="inst-pills">${instTodasHtml('data-inst-minha')}</div>
    <div class="ap-linha inst-estilo"><span>Ícones</span><div class="seg" role="group" aria-label="Estilo dos ícones">${INST_ESTILOS.map(([v, l]) => `<button class="${e === v ? 'on' : ''}" data-act="inst-estilo" data-v="${v}" aria-pressed="${e === v}">${l}</button>`).join('')}</div></div></section>`;
}
// Novo gasto: um formulário só para o gasto do dia (lançamento com data), o previsto de todo mês e o parcelado.
// Editar um lançamento abre aqui; editar um previsto ou parcelado também (preset.item), então todos têm instituição e categoria nova.
function openLanc(id, preset) {
  const p = S.plan; preset = preset || {};
  const l = id ? p.lancamentos.find((x) => x.id === id) : null; const it = preset.item ? p.despesas.find((x) => x.id === preset.item) : null; const parc = it && it.parcel;
  const mes = preset.mes != null ? preset.mes : S.year === NOW_Y ? NOW_M : S.mes; const h = new Date();
  const modo0 = it ? (parc ? 'parcelado' : 'mensal') : l ? 'real' : preset.modo || 'real';
  const dataPad = l ? l.data : (S.year === h.getFullYear() && mes === h.getMonth() ? `${h.getFullYear()}-${pad2(h.getMonth() + 1)}-${pad2(h.getDate())}` : `${S.year}-${pad2(mes + 1)}-01`);
  const aprender = !!(l && l.origem && l.origem !== 'manual');
  // novo gasto já vem com a instituição usada por último
  const instPad = l ? l.inst || '' : it ? it.inst || '' : ([...p.lancamentos].reverse().find((x) => x.inst && instMinhas().includes(x.inst)) || {}).inst || '';
  // as minhas (e a deste gasto, se não for mais uma delas)
  const instOps = (sel) => [''].concat([...new Set(instMinhas().concat(sel ? [sel] : []))].filter(instDe)).map((v) => instFicha(v, 'radio', v === sel, `name="inst" value="${v}"`)).join('');
  const MODOS = [['real', 'Gasto do dia'], ['mensal', 'Todo mês'], ['parcelado', 'Parcelado']];
  const escolha = l ? '<input type="hidden" name="modo" value="real">' : `<div class="seg ap-modo" role="radiogroup" aria-label="Como esse gasto acontece">${MODOS.filter(([v]) => !it || v !== 'real').map(([v, n]) => `<label><input type="radio" name="modo" value="${v}" ${v === modo0 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>`;
  const catPad = l ? l.cat : it ? it.cat : preset.cat || (p.catsDesp.length ? p.catsDesp[0].id : CAT_NOVA);
  const f = openModal({
    title: l ? 'Editar lançamento' : it ? (parc ? 'Editar parcelamento' : 'Editar gasto previsto') : 'Novo gasto', danger: l || it ? 'Excluir' : null,
    body: `${escolha}
      <div data-blk="real"><div class="fld-2"><label class="fld"><span>Data</span><input type="date" name="data" value="${esc(dataPad)}"></label><label class="fld"><span>Valor (R$)</span><input name="valor" inputmode="decimal" value="${l ? esc(String(Math.abs(l.valor)).replace('.', ',')) : ''}" placeholder="0,00" autocomplete="off"></label></div></div>
      <div data-blk="mensal"><div class="fld-2"><label class="fld"><span>Valor por mês (R$)${it ? ' <small>(opcional: refaz os meses a partir do escolhido)</small>' : ''}</span><input name="fixo" inputmode="decimal" placeholder="0,00" autocomplete="off"></label><label class="fld"><span>A partir de</span>${sel('de', mesOpts(), mes)}</label></div></div>
      <div data-blk="parcelado"><div class="fld-2"><label class="fld"><span>Valor total (R$)</span><input name="total" inputmode="decimal" value="${parc ? esc(String(parc.total).replace('.', ',')) : ''}" autocomplete="off"></label><label class="fld"><span>Parcelas</span><input name="n" inputmode="numeric" value="${parc ? parc.n : 10}"></label></div>
        <div class="fld-2"><label class="fld"><span>Primeiro mês</span>${sel('pmes', mesOpts(), parc ? parc.mes : mes)}</label><label class="fld"><span>Ano</span><input name="pano" inputmode="numeric" maxlength="4" value="${parc ? parc.ano : S.year}"></label></div><p class="mmsg" data-prev></p></div>
      <label class="fld"><span>Descrição</span><input name="desc" value="${esc(l ? l.desc : it ? it.nome : '')}" autocomplete="off" placeholder="Ex.: Mercado, Aluguel, Notebook"></label>
      <fieldset class="fld inst-esc"><legend>Pago com</legend><div class="inst-pills" id="inst-minhas" role="radiogroup" aria-label="Instituição de pagamento">${instOps(instPad)}</div>
        <button type="button" class="lnk" id="inst-editar" aria-expanded="${instMinhas().length ? 'false' : 'true'}" aria-controls="inst-todas">${instMinhas().length ? 'Editar minhas instituições' : 'Escolher as instituições que você usa'}</button>
        <div class="inst-pills inst-todas" id="inst-todas" ${instMinhas().length ? 'hidden' : ''}>${instTodasHtml('data-inst-form')}</div></fieldset>
      <div data-blk="real">${l && l.itemId ? '' : '<label class="chk"><input type="checkbox" name="repetir"><span><b>Repetir todo mês</b><small>Vira um gasto fixo com este valor nos meses seguintes, até dezembro. Ao lançar o de cada mês, ele já é conferido com o fixo e não conta duas vezes.</small></span></label>'}
        <label class="chk"><input type="checkbox" name="estorno" ${l && l.valor < 0 ? 'checked' : ''}><span><b>É estorno ou reembolso</b><small>Reduz o gasto do mês em vez de somar.</small></span></label></div>
      <label class="fld"><span>Categoria</span>${sel('cat', p.catsDesp.map((c) => [c.id, c.nome]).concat([[CAT_NOVA, '+ Nova categoria']]), catPad)}</label>
      <label class="fld" data-cat-nova${catPad === CAT_NOVA ? '' : ' hidden'}><span>Nome da nova categoria</span><input name="catNova" autocomplete="off" placeholder="Ex.: Pets"></label>${p.catsDesp.length ? '<button type="button" class="lnk lanc-cats" data-act="cats" data-kind="desp">Organizar categorias</button>' : ''}
      <div class="fld-2"><label class="fld"><span>Área <small>(ex.: Moradia)</small></span><input name="area" list="dl-area" value="${esc(l ? l.area : it ? it.area : preset.area || '')}" autocomplete="off"></label><label class="fld"><span>Subárea <small>(opcional)</small></span><input name="sub" list="dl-sub" value="${esc(l ? l.sub || '' : it ? it.sub || '' : '')}" autocomplete="off"></label></div>
      ${aprender ? '<label class="chk"><input type="checkbox" name="lembrar" checked><span><b>Lembrar para lançamentos parecidos</b><small>Nas próximas importações, este estabelecimento já entra com esta categoria.</small></span></label>' : ''}
      ${dlist('dl-area', p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area)))}${dlist('dl-sub', p.despesas.map((x) => x.sub).concat(p.lancamentos.map((x) => x.sub)))}`,
    onDanger: () => {
      if (it) confirmBox('Excluir este gasto?', `“${it.nome}” e seus valores serão removidos.`, 'Excluir', () => { p.despesas = p.despesas.filter((x) => x.id !== it.id); commit(); });
      else confirmBox('Excluir este lançamento?', `“${l.desc}” será removido.`, 'Excluir', () => { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x.id !== l.id); commit(); });
      return false;
    },
    onOk: (d, err) => {
      const modo = d.modo || 'real'; const desc = (d.desc || '').trim();
      // valida tudo antes de criar a categoria nova
      let data = ''; let dt = null; let v = 0; let parcel = null; let fixo = 0; const hasFixo = String(d.fixo || '').trim() !== '';
      if (modo === 'real') {
        data = String(d.data || ''); dt = E.parseDataISO(data);
        if (!dt || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !anoValido(dt.ano)) return bad(err, 'Informe uma data válida.');
        v = parseReais(d.valor); if (Number.isNaN(v) || v === 0) return bad(err, 'Informe o valor do gasto.');
      } else if (modo === 'parcelado') {
        const total = parseReais(d.total); const n = parseInt(d.n, 10); const ano = parseInt(d.pano, 10);
        if (Number.isNaN(total) || !(total > 0)) return bad(err, 'Informe o valor total do parcelamento.');
        if (!(n >= 1 && n <= 120)) return bad(err, 'Informe de 1 a 120 parcelas.');
        if (!anoValido(ano)) return bad(err, 'Informe um ano válido para a primeira parcela.');
        parcel = { total, n, ano, mes: +d.pmes };
      } else if (hasFixo) { fixo = parseReais(d.fixo); if (Number.isNaN(fixo)) return bad(err, 'Valor por mês inválido. Use números como 1.234,56'); } else if (!it) return bad(err, 'Informe o valor por mês.');
      if (!desc) return bad(err, 'Informe a descrição.');
      if (d.cat === CAT_NOVA) { // categoria nova criada aqui mesmo; com o mesmo nome de uma que já existe, usa a existente
        const nome = (d.catNova || '').trim(); if (!nome) return bad(err, 'Informe o nome da nova categoria.');
        const ja = p.catsDesp.find((c) => E.norm(c.nome) === E.norm(nome)); d.cat = ja ? ja.id : uid(); if (!ja) p.catsDesp.push({ id: d.cat, nome });
      }
      const area = (d.area || '').trim() || 'Outros'; const sub = (d.sub || '').trim(); const inst = instDe(d.inst) ? d.inst : '';
      if (modo !== 'real') { // previsto de todo mês ou parcelado: um item do planejamento
        const base = { cat: d.cat, nome: desc, area, sub, inst }; let alvoIt = it;
        if (!alvoIt) { alvoIt = Object.assign({ id: uid(), valores: z12() }, base); p.despesas.push(alvoIt); } else Object.assign(alvoIt, base);
        if (parcel) { alvoIt.parcel = parcel; alvoIt.valores = z12(); } else { delete alvoIt.parcel; if (hasFixo) fillFrom(alvoIt.valores, fixo, +d.de); }
        if (parcel && parcel.ano === S.year) S.mes = parcel.mes; S.fechadas['desp:' + alvoIt.cat] = false;
        commit(); return;
      }
      const dados = { data, desc, valor: E.r2(d.estorno ? -Math.abs(v) : Math.abs(v)), cat: d.cat, area, sub, inst };
      const alvo = dt.ano === S.year ? p : ensurePlan(dt.ano);
      if (l) { if (alvo !== p) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x.id !== l.id); Object.assign(l, dados); alvo.lancamentos.push(l); savePlanNow(dt.ano); } else Object.assign(l, dados); }
      else { alvo.lancamentos.push(Object.assign({ id: uid(), origem: 'manual' }, dados)); if (alvo !== p) savePlanNow(dt.ano); }
      // gastos que se repetem: o lançamento novo cumpre o gasto fixo do mês (não conta duas vezes), ou vira um gasto fixo até dezembro
      const lanc = l || alvo.lancamentos[alvo.lancamentos.length - 1]; let aviso = '';
      if (!l && dados.valor > 0) { const fx = E.acharFixo(alvo.despesas, desc, dt.ano, dt.mes); if (fx) { lanc.itemId = fx.id; fx.baixas = Object.assign({}, fx.baixas, { [dt.ano + '-' + dt.mes]: lanc.id }); aviso = `Conciliado com o gasto fixo “${fx.nome}”.`; } }
      if (d.repetir && dados.valor > 0 && !lanc.itemId && dt.mes < 11) { alvo.despesas.push({ id: uid(), cat: dados.cat, area: dados.area, sub: dados.sub, nome: desc, inst: dados.inst, valores: E.repetirValores(dados.valor, dt.mes) }); aviso = `“${desc}” vai se repetir todo mês até dezembro, como gasto fixo.`; }
      if (aviso) setTimeout(() => toast(aviso), 0);
      if (d.lembrar) { S.profile.regras = FPIngest.aprenderRegra(S.profile.regras, { descricao: desc, destino: 'despesa', catTipo: tipoDaCategoria(dados.cat), area: dados.area, sub: dados.sub, ativo: null }); touch('profile'); }
      if (dt.ano === S.year) { S.mesesAbertos.add(dt.mes); S.mes = dt.mes; } else toast(`Lançamento salvo no planejamento de ${dt.ano}.`);
      commit();
    },
  });
  // editar as minhas aqui mesmo, sem perder o que já foi digitado: marcar ou desmarcar refaz só a fileira de escolha
  const ed = f.querySelector('#inst-editar'); const todas = f.querySelector('#inst-todas');
  ed.addEventListener('click', () => { todas.hidden = !todas.hidden; ed.setAttribute('aria-expanded', !todas.hidden); ed.textContent = todas.hidden ? 'Editar minhas instituições' : 'Pronto'; });
  todas.addEventListener('change', (ev) => { const t = ev.target; if (!t.dataset.instForm) return; instMinhaAlternar(t.dataset.instForm, t.checked);
    const atual = (f.querySelector('[name="inst"]:checked') || {}).value || (t.checked ? t.dataset.instForm : ''); f.querySelector('#inst-minhas').innerHTML = instOps(atual); });
  const nova = f.querySelector('[data-cat-nova]'); f.elements.cat.addEventListener('change', () => { nova.hidden = f.elements.cat.value !== CAT_NOVA; if (!nova.hidden) f.elements.catNova.focus(); });
  // mostra só os campos do jeito escolhido (gasto do dia, todo mês ou parcelado) e a prévia das parcelas
  const sync = () => { const modo = f.elements.modo.value; f.querySelectorAll('[data-blk]').forEach((b) => { b.hidden = b.dataset.blk !== modo; });
    if (modo === 'parcelado') f.querySelector('[data-prev]').textContent = parcPreview(parseReais(f.elements.total.value) || 0, parseInt(f.elements.n.value, 10) || 0, +f.elements.pmes.value, parseInt(f.elements.pano.value, 10) || S.year); };
  f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
  return f;
}
