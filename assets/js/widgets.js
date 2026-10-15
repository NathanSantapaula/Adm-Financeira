/* Visão geral personalizável: catálogo de widgets, layout salvo no perfil e tela "Personalizar a Visão geral" no painel.
   Layout em S.profile.painel = { itens: [{ id, on, tam }] } (ordem = posição; tam = colunas numa grade de 6: 2, 3, 4 ou 6).
   Widgets que o plano não libera ficam fora da tela, mas a escolha do cliente é mantida para quando o plano mudar. */
'use strict';

const TAM_NOME = { 2: 'Estreito', 3: 'Metade', 4: 'Largo', 6: 'Inteiro' };
const PALETA = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
const inv = () => temRecurso('patrimonio');

/* ---------- conteúdo de cada widget ---------- */
function wPatrimonio() {
  const p = S.plan; const C = S.C; const T = C.T; const pr = S.profile;
  if (inv()) {
    const ganho = C.patrimonio[11] - C.patrimonioBase; const custom = p.settings.patrimonioInicial != null;
    return `<section class="card hero-card"><div class="c-k hc-row"><span>Patrimônio estimado</span><div class="hc-acts">${simBtn()}${histBtn()}</div></div><div class="c-big">${brl0(C.patrimonio[11])}</div>${Math.abs(ganho) < 1 ? `<div class="c-d">Nenhum aporte registrado em ${p.year}. <button class="lnk strong" data-act="nav" data-view="inv">Registrar aporte</button></div>` : `<div class="c-d ${ganho > 0 ? 'pos' : 'neg'}">${ganho > 0 ? '+' : '−'} ${brl0(Math.abs(ganho))} aportados em ${p.year}</div>`}<div class="chart" id="d-patr"></div>
      <p class="cap">${custom ? `Patrimônio inicial de ${p.year} definido por você (${brl0(p.settings.patrimonioInicial)})` : (pr.patrimonioAno && p.year < pr.patrimonioAno ? `Estimado a partir do patrimônio informado no diagnóstico de ${pr.patrimonioAno} (${brl0(pr.patrimonioInicial)}), descontando os aportes registrados até lá` : `Patrimônio informado no diagnóstico (${brl0(pr.patrimonioInicial)}) mais os aportes registrados`)}. Valores a custo, sem a variação de mercado.</p></section>`;
  }
  return `<section class="card hero-card"><div class="c-k hc-row"><span>Sobra para investir em ${p.year}</span><div class="hc-acts">${histBtn()}</div></div><div class="c-big">${brl0(T.investAlocado)}</div><div class="c-d">${brl0(T.receita)} de entradas e ${brl0(T.despesas)} de gastos</div><div class="chart" id="d-patr"></div><p class="cap">Entradas menos gastos, mês a mês.</p></section>`;
}
function wOrcMes() {
  const C = S.C; const m = mesRef(); const u = C.usoOrc[m]; const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : '';
  return `<section class="card goal-card"><div class="c-k">Orçamento de ${MES_LONGO[m]}</div><div class="goal-ring">${ring(Math.min(1, u || 0), { size: 132, stroke: 12, color: tom === 'neg' ? 'var(--neg)' : tom === 'warn' ? 'var(--c4)' : 'var(--accent)', label: u == null ? '–' : pct(u), sub: u == null ? '' : 'usado', aria: 'Uso do orçamento' })}</div>
    <div class="c-d">${C.orcamento[m] > 0 ? `${brl0(C.despesas[m])} de ${brl0(C.orcamento[m])}` : 'Sem orçamento definido'}</div><p class="cap">${esc(voz(C.orcamento[m] > 0 ? (u > 1 ? 'orc_estourou' : 'orc_ok') : 'orc_definir', { mes: MES_LONGO[m], pct: pct(u), restante: brl0(C.restante[m]), valor: brl0(-C.restante[m]) }))}</p></section>`;
}
function wIndicadores() {
  const p = S.plan; const C = S.C; const T = C.T; const m = mesRef(); const u = C.usoOrc[m]; const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : '';
  const orc = ['Orçamento de ' + MES_LONGO[m], u == null ? '–' : pct(u), tom, C.orcamento[m] > 0 ? (C.restante[m] >= 0 ? `Restam ${brl0(C.restante[m])}` : `${brl0(-C.restante[m])} acima do orçado`) : 'Sem orçamento definido', u || 0];
  let k;
  if (inv()) {
    const progMeta = C.metaAno > 0 ? Math.min(1, T.aplicado / C.metaAno) : 0; const md = C.dividendos.filter((x) => x > 0).length;
    k = [['Taxa de poupança em ' + p.year, T.poupanca == null ? '–' : pct(T.poupanca), '', T.receita <= 0 ? 'Cadastre rendas ou importe um extrato' : T.investAlocado >= 0 ? `${brl0(T.investAlocado)} sobraram para investir` : `Gastos ${brl0(-T.investAlocado)} acima das entradas`], orc,
      ['Aportes na meta do ano', C.metaAno > 0 ? pct(progMeta) : '–', '', `${brl0(T.aplicado)} de ${brl0(C.metaAno)}`, progMeta], ['Dividendos em ' + p.year, brl0(T.dividendos), '', md ? `média de ${brl0(T.dividendos / md)} por mês com pagamento` : 'Nenhum provento registrado']];
  } else {
    k = [['Taxa de poupança em ' + p.year, T.poupanca == null ? '–' : pct(T.poupanca), '', T.receita <= 0 ? 'Cadastre rendas ou importe um extrato' : T.investAlocado >= 0 ? `${brl0(T.investAlocado)} sobraram` : `Gastos ${brl0(-T.investAlocado)} acima das entradas`], orc,
      ['Entradas em ' + p.year, brl0(T.receita), '', `média de ${brl0(T.receita / 12)} por mês`], ['Gastos em ' + p.year, brl0(T.despesas), '', `média de ${brl0(T.despesas / 12)} por mês`]];
  }
  return `<div class="stats4">${k.map((x) => `<div class="stat"><div class="c-k">${esc(x[0])}</div><div class="c-num ${x[2] || ''}">${esc(x[1])}</div>${x[4] != null ? `<div class="bar ${x[2] || ''}"><i style="width:${Math.min(100, x[4] * 100).toFixed(1)}%"></i></div>` : ''}<div class="c-n">${esc(x[3])}</div></div>`).join('')}</div>`;
}
const wFluxo = () => `<section class="card"><div class="c-h"><h3>Para onde foi cada mês</h3><div class="legend"><span><i style="background:var(--c2)"></i>Gastos</span><span><i style="background:var(--c1)"></i>Sobra para investir</span></div></div><div class="chart" id="d-flow"></div></section>`;
const wOrcamento = () => `<section class="card"><div class="c-h"><h3>Orçamento e gastos</h3><div class="legend"><span><i style="background:var(--c2)"></i>Gasto</span><span><i class="mk" style="background:var(--c4)"></i>Orçado</span></div></div><div class="chart" id="d-orc"></div></section>`;
function wCarteira() {
  if (!inv()) return `<section class="card"><div class="c-h"><h3>Evolua para o plano Investidor</h3></div><p class="mmsg">Acompanhe patrimônio, aportes e proventos e saiba onde investir a cada aporte para manter a carteira equilibrada.</p><div class="btn-row"><button class="btn primary" data-act="upgrade" data-plano="investidor">Conhecer o plano Investidor</button></div></section>`;
  const comp = composicao(); const tot = comp.reduce((a, b) => a + b.value, 0);
  return `<section class="card"><div class="c-h"><h3>Composição da carteira</h3></div>${tot > 0 ? `<div class="comp"><div class="donut" id="d-donut"></div><ul class="comp-l">${comp.map((c, i) => `<li><i style="background:${PALETA[i % 6]}"></i><span>${esc(c.label)}</span><b>${pct(c.value / tot)}</b></li>`).join('')}</ul></div>` : '<p class="empty-s">Registre aportes em Investimentos para ver a composição da carteira.</p>'}</section>`;
}
function wAreas() { const a = areasDoAno(); return `<section class="card"><div class="c-h"><h3>Onde você mais gasta</h3></div>${a.length ? hbars(a, brl0) : '<p class="empty-s">Importe um extrato ou lance gastos para ver o ranking das suas áreas de gasto.</p>'}</section>`; }
function wDestaques() { const ins = insights(); return `<section class="card"><div class="c-h"><h3>O que o painel está vendo</h3></div>${ins.length ? `<ul class="ins">${ins.map((i) => `<li class="${i.t}"><i></i><span>${esc(i.x)}${i.a ? ' ' + btnAcao(i.a) : ''}</span></li>`).join('')}</ul>` : '<p class="empty-s">Quando houver movimento no mês, os destaques aparecem aqui.</p>'}</section>`; }
function wAssessor() {
  const passos = proximosPassos(); const rec = S.recomendacao && temRecurso('carteira_recomendada') && ((S.recomendacao.carteira || []).length || (S.recomendacao.notas || '').trim());
  return `<section class="card advisor-card"><div class="c-h"><h3>${rec ? 'Recomendação do ' + esc(primeiroNome()) : passos.length ? 'Próximos passos' : 'Revisão com o ' + esc(primeiroNome())}</h3></div>
    ${rec ? `<p class="mmsg">${esc(((S.recomendacao.notas || '').trim() || 'Seu assessor deixou uma carteira recomendada para você.').slice(0, 240))}</p><div class="btn-row"><button class="btn primary" data-act="nav" data-view="cart">Ver recomendação</button></div>`
      : passos.length ? `<ul class="steps">${passos.map((s) => `<li><span>${esc(s[0])}</span><button class="btn sm" data-act="${s[1]}"${s[2] ? ` data-view="${s[2]}"` : ''}>Abrir</button></li>`).join('')}</ul>` : `<p class="mmsg">Seu planejamento está em dia. Que tal levar estes números para a revisão mensal com ${esc(CFG.consultor)}?</p>`}
    <div class="adv-line"><p class="cap keep">Dúvidas sobre o seu momento financeiro?</p><div class="btn-row"><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></div></section>`;
}
function wProventos() {
  const C = S.C; const tot = E.sum(C.faturamento); const md = C.faturamento.filter((v) => v > 0).length;
  return `<section class="card"><div class="c-h"><h3>Proventos mês a mês</h3><div class="legend"><span><i style="background:var(--c3)"></i>Dividendos</span><span><i style="background:var(--c5)"></i>Renda fixa</span></div></div>
    <p class="cap">Quanto os seus investimentos devolveram em caixa em cada mês: dividendos, JCP e rendimentos de renda fixa.</p>${tot > 0 ? '<div class="chart" id="d-prov"></div>' : '<p class="empty-s">Nenhum provento registrado neste ano.</p>'}
    ${tot > 0 ? `<div class="p2-sts"><div class="p2-st"><small>No ano</small><b>${brl0(tot)}</b></div><div class="p2-st"><small>Meses com pagamento</small><b>${md}</b></div><div class="p2-st"><small>Média nesses meses</small><b>${brl0(md ? tot / md : 0)}</b></div></div>` : ''}</section>`;
}
function wObjLista() {
  const A = objAnalise(); if (!A.itens.length) return `<section class="card"><div class="c-h"><h3>Todos os objetivos</h3></div><p class="empty-s">Cadastre seus objetivos para acompanhar o progresso de cada um.</p><div class="btn-row"><button class="btn" data-act="objetivo-definir">Definir objetivos</button></div></section>`;
  return `<section class="card"><div class="c-h"><h3>Todos os objetivos</h3><button class="lnk strong" data-act="objetivos-abrir">Gerenciar</button></div>
    <ul class="wg-objs">${A.itens.map((g, i) => { const st = OBJ_STATUS[g.status] || OBJ_STATUS['sem-valor']; return `<li><button class="wg-obj" data-act="objetivo-foco" data-id="${esc(g.id)}">${objIcone(g, i)}<span class="wg-obj-t"><b>${esc(objNomeDe(g))}</b><small>${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' · ' + g.ano : ''}</small><span class="kbar" style="--cor:${objCor(i)}"><i style="width:${(g.progresso * 100).toFixed(1)}%;background:${objCor(i)}"></i></span></span><span class="wg-obj-r"><b>${pct(g.progresso)}</b><span class="obj-st ${st[1]}">${st[0]}</span></span></button></li>`; }).join('')}</ul></section>`;
}
function wAvisos() {
  const L = (S.notifs || []).slice(0, 3);
  return `<section class="card"><div class="c-h"><h3>Avisos</h3><button class="lnk strong" data-act="notif-toggle">Ver todos</button></div>
    ${L.length ? `<ul class="wg-avisos">${L.map((n) => `<li class="ni ${n.nivel}${n.lida ? '' : ' nova'}"><div class="ni-b"><div class="ni-t"><b>${esc(n.titulo)}</b></div><p>${esc(n.texto)}</p>${n.cta ? `<div class="ni-a"><button class="btn sm" data-act="notif-go" data-id="${esc(n.id)}">${esc(n.cta.rotulo)}</button></div>` : ''}</div></li>`).join('')}</ul>` : '<p class="empty-s">Tudo em dia. Os avisos da central aparecem aqui.</p>'}</section>`;
}
function wAtalhos() {
  const m = S.year === NOW_Y ? NOW_M : S.mes; const b = (act, txt, extra) => `<button class="wg-at" data-act="${act}"${extra || ''}>${txt}</button>`;
  return `<section class="card"><div class="c-h"><h3>Atalhos</h3></div><div class="wg-ats">${b('ingest-open', 'Importar extrato')}${b('add-lanc', 'Novo gasto', ` data-mes="${m}"`)}${temRecurso('investimentos') ? b('nav', 'Registrar aporte', ' data-view="inv"') : ''}${temRecurso('carteira') ? b('nav', 'Onde investir', ' data-view="cart"') : ''}${b('objetivos-abrir', 'Meus objetivos')}${b('contact', 'Falar com o ' + esc(primeiroNome()))}</div></section>`;
}
function wHistMini() {
  const H = histDados();
  return `<section class="card"><div class="c-h"><h3>Patrimônio ano a ano</h3><button class="lnk strong" data-act="hist-toggle">Abrir análise</button></div>
    <p class="cap">Fim de cada ano de planejamento, encadeado a partir do patrimônio do diagnóstico. Valores a custo.</p>${H.temHistorico ? '<div class="chart" id="d-histmini"></div>' : `<p class="empty-s">Com dois ou mais anos de planejamento, a evolução aparece aqui.</p>`}</section>`;
}

/* ---------- catálogo ---------- */
const WIDGETS = [
  { id: 'patrimonio', nome: () => (inv() ? 'Patrimônio estimado' : 'Sobra para investir'), desc: 'Valor do ano com o gráfico mês a mês e os atalhos E se? e Histórico.', tam: 4, tams: [3, 4, 6], padrao: () => true, html: wPatrimonio },
  { id: 'objetivos', nome: () => 'Objetivos', desc: 'Progresso do objetivo em foco, com troca entre as metas.', tam: 2, tams: [2, 3], padrao: () => true, html: () => objCardHtml(), disponivel: inv },
  { id: 'orcmes', nome: () => 'Orçamento do mês', desc: 'Quanto do orçamento do mês já foi usado.', tam: 2, tams: [2, 3], padrao: () => !inv(), html: wOrcMes },
  { id: 'indicadores', nome: () => 'Indicadores do ano', desc: 'Poupança, orçamento, aportes e dividendos (ou entradas e gastos).', tam: 6, tams: [6], padrao: () => true, html: wIndicadores },
  { id: 'fluxo', nome: () => 'Para onde foi cada mês', desc: 'Gastos e sobra para investir, mês a mês.', tam: 3, tams: [3, 4, 6], padrao: () => true, html: wFluxo },
  { id: 'constancia', nome: () => (temRecurso('investimentos') ? 'Constância dos aportes' : 'Gastos fixos e variáveis'), desc: 'Aportes de cada mês contra a meta (ou o peso dos gastos fixos).', tam: 3, tams: [3, 4, 6], padrao: () => true, html: () => painel2Html() },
  { id: 'carteira', nome: () => (inv() ? 'Composição da carteira' : 'Plano Investidor'), desc: 'Peso de cada classe de ativo na carteira.', tam: 3, tams: [2, 3, 4], padrao: () => true, html: wCarteira },
  { id: 'areas', nome: () => 'Onde você mais gasta', desc: 'Ranking das áreas de gasto do ano.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true, html: wAreas },
  { id: 'destaques', nome: () => 'O que o painel está vendo', desc: 'Leituras automáticas do mês: orçamento, poupança, aportes e carteira.', tam: 3, tams: [3, 4, 6], padrao: () => true, html: wDestaques },
  { id: 'assessor', nome: () => 'Assessor e próximos passos', desc: 'Recomendação do assessor ou os próximos passos sugeridos.', tam: 3, tams: [2, 3, 4], padrao: () => true, html: wAssessor },
  { id: 'orcamento', nome: () => 'Orçamento e gastos', desc: 'Gasto de cada mês contra o orçamento.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wOrcamento },
  { id: 'proventos', nome: () => 'Proventos mês a mês', desc: 'Dividendos e rendimentos recebidos em cada mês.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wProventos, disponivel: () => temRecurso('investimentos') },
  { id: 'objlista', nome: () => 'Todos os objetivos', desc: 'Lista com o progresso e a situação de cada objetivo.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wObjLista, disponivel: inv },
  { id: 'avisos', nome: () => 'Avisos', desc: 'Os três avisos mais importantes da central de notificações.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wAvisos },
  { id: 'atalhos', nome: () => 'Atalhos', desc: 'Botões para as tarefas mais comuns.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wAtalhos },
  { id: 'histmini', nome: () => 'Patrimônio ano a ano', desc: 'Evolução do patrimônio em todos os anos de planejamento.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wHistMini, disponivel: inv },
];
const widgetDe = (id) => WIDGETS.find((w) => w.id === id);
const widgetDisp = (w) => !w.disponivel || w.disponivel();

/* ---------- layout ---------- */
function painelLayout() {
  const salvo = S.profile.painel && Array.isArray(S.profile.painel.itens) ? S.profile.painel.itens : null; const out = [];
  (salvo || []).forEach((it) => { const w = widgetDe(it && it.id); if (w && widgetDisp(w) && !out.some((o) => o.id === w.id)) out.push({ id: w.id, on: !!it.on, tam: w.tams.includes(+it.tam) ? +it.tam : w.tam }); });
  WIDGETS.forEach((w) => { if (widgetDisp(w) && !out.some((o) => o.id === w.id)) out.push({ id: w.id, on: salvo ? false : w.padrao(), tam: w.tam }); });
  return out.filter((x) => x.on).concat(out.filter((x) => !x.on)); // na tela, em ordem; depois os desligados
}
// grava o layout visível sem perder a escolha dos widgets que o plano atual não mostra
function painelSalvar(lista, semRender) {
  const ant = (S.profile.painel && S.profile.painel.itens) || []; const fora = ant.filter((it) => it && widgetDe(it.id) && !widgetDisp(widgetDe(it.id)) && !lista.some((x) => x.id === it.id));
  S.profile.painel = { itens: lista.map((x) => ({ id: x.id, on: !!x.on, tam: x.tam })).concat(fora) };
  touch('profile'); if (S.view === 'geral' && !semRender) renderLater();
}
function widgetsHtml() {
  const L = painelLayout().filter((x) => x.on); const ed = !!S.wgEdit; let h = '';
  L.forEach((x, k) => {
    const w = widgetDe(x.id); let corpo = ''; try { corpo = w.html(); } catch (e) { corpo = ''; }
    if (!corpo) return;
    h += `<div class="wg" data-wg="${x.id}" data-tam="${x.tam}" style="--i:${k % 4}"${ed ? ` aria-label="${esc(w.nome())}"` : ''}>${ed ? wgControles(w, x) : ''}${corpo}</div>`;
  });
  const barra = ed ? wgBarraHtml() : '';
  const pe = ed ? '' : `<div class="wg-foot"><button class="btn ghost sm" data-act="wg-editar">${I_AJUSTE}Organizar a tela</button><button class="lnk" data-act="painel-abrir">Mais opções</button></div>`;
  return `${barra}<div class="wg-grid${ed ? ' editando' : ''}">${h}</div>${pe}`;
}
const I_AJUSTE = ic('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 14v6M14 17h6"/>');
// gráficos dos widgets novos (os antigos continuam em drawDashboard)
function drawWidgetsExtras() {
  const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  chartBars($('#d-orc'), { labels: MES, cur, aria: 'Gastos comparados com o orçamento de cada mês', bars: [{ color: 'var(--c2)', values: C.despesas }], marks: [{ color: 'var(--c4)', values: C.orcamento }], tip: (i) => `<b>${MES[i]}</b><br>Gasto: ${brl0(C.despesas[i])}<br>Orçado: ${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : 'sem orçamento'}` });
  chartBars($('#d-prov'), { labels: MES, cur, height: 190, aria: 'Proventos recebidos em cada mês', bars: [{ color: 'var(--c3)', values: C.dividendos }, { color: 'var(--c5)', values: C.rentab }], tip: (i) => `<b>${MES_LONGO[i]}</b><br>Dividendos: ${brl0(C.dividendos[i])}<br>Renda fixa: ${brl0(C.rentab[i])}` });
  const hm = $('#d-histmini');
  if (hm) { const H = histDados(); const P = H.serie.map((p) => ({ ano: p.ano, mes: p.mes, v: p.patrimonio })); chartHistorico(hm, { pontos: P, height: 200, aria: 'Patrimônio de todos os anos', rotuloPonto: (v) => tickFmt(v), tip: (i) => `<b>${MES_LONGO[H.serie[i].mes]} de ${H.serie[i].ano}</b><br>Patrimônio: ${brl0(H.serie[i].patrimonio)}` }); }
}

/* ---------- painel: Personalizar a Visão geral ---------- */
function painelLinkHtml() {
  const L = painelLayout(); const n = L.filter((x) => x.on).length;
  return `<button class="pf-card obj-link" data-act="painel-abrir"><span class="obj-stack"><span class="obj-ic" style="--cor:var(--accent)">${I_AJUSTE}</span></span><span class="pf-t"><b>Personalizar a Visão geral</b><small>${n} de ${L.length} widgets na tela</small></span><span class="pf-go">Abrir${I.chev}</span></button>`;
}
function painelEditorHtml() {
  const L = painelLayout(); const on = L.filter((x) => x.on); const off = L.filter((x) => !x.on);
  const linha = (x, i) => { const w = widgetDe(x.id);
    const tams = w.tams.length > 1 ? `<div class="wg-tams" role="group" aria-label="Largura de ${esc(w.nome())}">${w.tams.map((t) => `<button type="button" class="np-chip" data-act="painel-tam" data-id="${x.id}" data-tam="${t}" aria-pressed="${x.tam === t}">${TAM_NOME[t]}</button>`).join('')}</div>` : '<small class="wg-fixo">Largura inteira</small>';
    return `<li class="wg-row" draggable="true" data-id="${x.id}">
      <span class="wg-alca" aria-hidden="true" title="Arraste para mudar a posição">${I_ALCA}</span>
      <label class="wg-sw"><input type="checkbox" data-painel-on="${x.id}" checked aria-label="Mostrar ${esc(w.nome())}"><span></span></label>
      <div class="wg-row-t"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small>${tams}</div>
      <div class="wg-row-a"><button class="icon-btn sm" data-act="painel-mover" data-id="${x.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(w.nome())}">${I.up}</button><button class="icon-btn sm" data-act="painel-mover" data-id="${x.id}" data-d="1" ${i === on.length - 1 ? 'disabled' : ''} aria-label="Descer ${esc(w.nome())}">${I.down}</button></div></li>`; };
  const extra = (x) => { const w = widgetDe(x.id);
    return `<li class="wg-row off" data-id="${x.id}"><span></span><label class="wg-sw"><input type="checkbox" data-painel-on="${x.id}" aria-label="Mostrar ${esc(w.nome())}"><span></span></label>
      <div class="wg-row-t"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small></div><button class="btn sm" data-act="painel-add" data-id="${x.id}">Adicionar</button></li>`; };
  const mini = `<div class="wg-mini" aria-hidden="true">${on.map((x) => `<i style="grid-column: span ${x.tam}">${esc(widgetDe(x.id).nome())}</i>`).join('')}</div>`;
  return `<section class="dr-sec"><h3>Como a tela fica</h3><p class="mmsg">Ligue ou desligue cada widget, escolha a largura e arraste (ou use as setas) para mudar a ordem. As mudanças valem na hora e ficam salvas na sua conta. No celular, cada widget ocupa a largura toda.</p>${mini}</section>
    <section class="dr-sec"><h3>Na tela (${on.length})</h3><ul class="wg-lista" id="wg-lista">${on.map(linha).join('') || '<li class="empty-s">Nenhum widget na tela.</li>'}</ul></section>
    ${off.length ? `<section class="dr-sec"><h3>Disponíveis para adicionar (${off.length})</h3><ul class="wg-lista">${off.map(extra).join('')}</ul></section>` : ''}
    <div class="btn-row"><button class="btn sm" data-act="painel-padrao">Restaurar o padrão</button></div>`;
}
const I_ALCA = ic('<circle cx="9" cy="6.5" r="1.2"/><circle cx="15" cy="6.5" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="17.5" r="1.2"/><circle cx="15" cy="17.5" r="1.2"/>');
function painelRender(foco, reserva) {
  renderAdmin();
  const el = (foco && document.querySelector('#admin ' + foco)) || (reserva && document.querySelector('#admin ' + reserva)); if (el) el.focus();
}
function painelAcao(act, ds) {
  const L = painelLayout(); const i = L.findIndex((x) => x.id === ds.id);
  switch (act) {
    case 'painel-abrir': S.maisOpen = false; if (!S.adminOpen) openAdmin('painel'); else { S.adminPage = 'painel'; renderAdmin(true); } return true;
    case 'painel-voltar': S.adminPage = 'inicio'; renderAdmin(true); return true;
    case 'painel-mover': { const n = L.filter((x) => x.on).length; const j = i + (+ds.d); if (i < 0 || j < 0 || j >= n) return true; [L[i], L[j]] = [L[j], L[i]]; painelSalvar(L); painelRender(`[data-act="painel-mover"][data-id="${ds.id}"][data-d="${ds.d}"]:not([disabled])`, `[data-act="painel-mover"][data-id="${ds.id}"]:not([disabled])`); return true; }
    case 'painel-add': { if (i < 0) return true; const [x] = L.splice(i, 1); x.on = true; L.splice(L.filter((y) => y.on).length, 0, x); painelSalvar(L); painelRender(`[data-painel-on="${x.id}"]`); toast(`${widgetDe(x.id).nome()} adicionado ao fim da Visão geral.`); return true; }
    case 'painel-tam': if (i >= 0) { L[i].tam = +ds.tam; painelSalvar(L); painelRender(`[data-act="painel-tam"][data-id="${ds.id}"][data-tam="${ds.tam}"]`); } return true;
    case 'painel-padrao': {
      const antes = S.profile.painel ? JSON.parse(JSON.stringify(S.profile.painel)) : null;
      S.profile.painel = null; touch('profile'); renderAdmin(); if (S.view === 'geral') renderLater();
      toastAcao('Visão geral de volta ao padrão.', 'Desfazer', () => { S.profile.painel = antes; touch('profile'); if (S.adminOpen) renderAdmin(); render(); });
      return true;
    }
    default: return false;
  }
}
function painelLigar(t) {
  const L = painelLayout(); const x = L.find((y) => y.id === t.dataset.painelOn); if (!x) return;
  const i = L.indexOf(x); L.splice(i, 1); x.on = t.checked;
  if (x.on) L.splice(L.filter((y) => y.on).length, 0, x); else L.push(x); // ligado vai para o fim da tela; desligado sai da ordem
  painelSalvar(L); painelRender(`[data-painel-on="${x.id}"]`);
}
// arrastar e soltar na lista do painel (mouse); no toque, as setas fazem o mesmo
function painelDnD() {
  let arrastando = null;
  document.addEventListener('dragstart', (e) => { const r = e.target.closest && e.target.closest('.wg-row:not(.off)'); if (!r) return; arrastando = r.dataset.id; r.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', arrastando); } catch (er) { /* ignora */ } });
  document.addEventListener('dragend', () => { arrastando = null; document.querySelectorAll('.wg-row.arrastando, .wg-row.antes, .wg-row.depois').forEach((r) => r.classList.remove('arrastando', 'antes', 'depois')); });
  document.addEventListener('dragover', (e) => {
    const r = e.target.closest && e.target.closest('.wg-row:not(.off)'); if (!r || !arrastando) return; e.preventDefault();
    const meio = r.getBoundingClientRect(); const antes = e.clientY < meio.top + meio.height / 2;
    document.querySelectorAll('.wg-row.antes, .wg-row.depois').forEach((x) => { if (x !== r) x.classList.remove('antes', 'depois'); });
    r.classList.toggle('antes', antes); r.classList.toggle('depois', !antes);
  });
  document.addEventListener('drop', (e) => {
    const r = e.target.closest && e.target.closest('.wg-row:not(.off)'); if (!r || !arrastando) return; e.preventDefault();
    const L = painelLayout(); const de = L.findIndex((x) => x.id === arrastando); if (de < 0 || r.dataset.id === arrastando) return;
    const [item] = L.splice(de, 1); let para = L.findIndex((x) => x.id === r.dataset.id); if (r.classList.contains('depois')) para++;
    L.splice(para, 0, item); arrastando = null; painelSalvar(L); painelRender();
  });
}

/* ---------- Organizar na própria tela (como no celular) ----------
   Toque e segure um widget (ou "Organizar a tela") para soltar os widgets: eles balançam, ganham botões de remover e de
   largura, e podem ser arrastados com o dedo ou o mouse. Os vizinhos abrem espaço enquanto arrasta. "Concluir" ou Esc fecha. */
const I_MENOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>';
function wgControles(w, x) {
  const tam = w.tams.length > 1 ? `<button class="wg-tam" data-act="wg-tam" data-id="${x.id}" aria-label="Largura de ${esc(w.nome())}: ${TAM_NOME[x.tam]}. Tocar troca.">${TAM_NOME[x.tam]}</button>` : '';
  return `<div class="wg-ctl"><button class="wg-rm" data-act="wg-remover" data-id="${x.id}" aria-label="Tirar ${esc(w.nome())} da tela">${I_MENOS}</button>${tam}
    <span class="wg-mv"><button data-act="wg-mover" data-id="${x.id}" data-d="-1" aria-label="Mover ${esc(w.nome())} para antes">${I.up}</button><button data-act="wg-mover" data-id="${x.id}" data-d="1" aria-label="Mover ${esc(w.nome())} para depois">${I.down}</button></span></div>`;
}
function wgBarraHtml() {
  const off = painelLayout().filter((x) => !x.on);
  const lista = S.wgAdd ? `<div class="wg-add" role="dialog" aria-label="Adicionar widget">${off.length ? off.map((x) => { const w = widgetDe(x.id); return `<button class="wg-add-i" data-act="wg-add" data-id="${x.id}"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small></button>`; }).join('') : '<p class="empty-s">Todos os widgets já estão na tela.</p>'}</div>` : '';
  return `<div class="wg-barra" role="toolbar" aria-label="Organizar a Visão geral"><span class="wg-barra-t"><b>Organizando a tela</b><small>Arraste os widgets para mudar a ordem</small></span>
    <span class="wg-barra-a"><button class="btn sm" data-act="wg-add-abrir" aria-expanded="${!!S.wgAdd}">${I.plus}Adicionar</button><button class="btn sm primary" data-act="wg-concluir">Concluir</button></span>${lista}</div>`;
}
function wgEntrar(focar) {
  if (S.wgEdit) return; S.wgEdit = true; S.wgAdd = false; S.simAberto = false; if (S.hist) S.hist.aberto = false;
  { const pd = document.getElementById('wg-pop'); if (pd && pd.open) pd.close(); } // fecha a janela do simulador/histórico
  // transforma a tela no lugar, sem redesenhar: no toque longo, o elemento sob o dedo precisa continuar no DOM
  // (se ele sumisse, o navegador deixaria de entregar os eventos de toque e o arraste não começaria)
  const grid = document.querySelector('#view .wg-grid');
  if (!grid) { const y = window.scrollY; render(); window.scrollTo(0, y); }
  else {
    const L = painelLayout();
    grid.querySelectorAll(':scope > .wg[data-wg="extras"], :scope > .wg:not([data-wg])').forEach((e) => e.remove());
    grid.querySelectorAll(':scope > .wg[data-wg]').forEach((e) => { const x = L.find((y) => y.id === e.dataset.wg); const w = widgetDe(e.dataset.wg); if (x && w) { e.insertAdjacentHTML('afterbegin', wgControles(w, x)); e.setAttribute('aria-label', w.nome()); } });
    grid.classList.add('editando'); grid.insertAdjacentHTML('beforebegin', wgBarraHtml());
    const pe = document.querySelector('#view .wg-foot'); if (pe) pe.remove();
    document.querySelectorAll('.hero-card [data-act="sim-toggle"], .hero-card [data-act="hist-toggle"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignora */ } }
  if (focar) { const b = document.querySelector('.wg-barra [data-act="wg-concluir"]'); if (b) b.focus({ preventScroll: true }); }
}
function wgSair() { if (!S.wgEdit) return; S.wgEdit = false; S.wgAdd = false; const y = window.scrollY; render(); window.scrollTo(0, y); }
// ordem atual dos widgets na tela -> layout salvo (sem redesenhar)
function wgGravarOrdem() {
  const ids = [...document.querySelectorAll('.wg-grid.editando > .wg[data-wg]')].map((e) => e.dataset.wg);
  const L = painelLayout(); const on = ids.map((id) => L.find((x) => x.id === id)).filter(Boolean);
  painelSalvar(on.concat(L.filter((x) => !ids.includes(x.id))), true);
}
// anima os vizinhos da posição antiga para a nova (técnica FLIP)
function wgFlip(mudar) {
  const els = [...document.querySelectorAll('.wg-grid.editando > .wg:not(.wg-vazio)')]; const antes = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  mudar();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  els.forEach((e) => { const a = antes.get(e); const b = e.getBoundingClientRect(); const dx = a.left - b.left; const dy = a.top - b.top; if (!dx && !dy) return;
    e.style.transition = 'none'; e.style.translate = `${dx}px ${dy}px`; requestAnimationFrame(() => { e.style.transition = 'translate 220ms var(--ease-out)'; e.style.translate = '0 0'; }); });
}
function wgAcao(act, ds) {
  switch (act) {
    case 'wg-editar': wgEntrar(true); return true;
    case 'wg-concluir': wgSair(); return true;
    case 'wg-add-abrir': S.wgAdd = !S.wgAdd; { const b = document.querySelector('.wg-barra'); if (b) b.outerHTML = wgBarraHtml(); } return true;
    case 'wg-add': {
      const L = painelLayout(); const i = L.findIndex((x) => x.id === ds.id); if (i < 0) return true;
      const [x] = L.splice(i, 1); x.on = true; L.splice(L.filter((y) => y.on).length, 0, x); painelSalvar(L, true); S.wgAdd = false; render();
      const el = document.querySelector(`.wg[data-wg="${x.id}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); el.classList.add('wg-novo'); }
      return true;
    }
    case 'wg-remover': {
      const el = document.querySelector(`.wg[data-wg="${ds.id}"]`); const antes = JSON.parse(JSON.stringify(S.profile.painel || null));
      const L = painelLayout(); const x = L.find((y) => y.id === ds.id); if (!x) return true; x.on = false;
      const fim = () => { wgFlip(() => { if (el) el.remove(); }); painelSalvar(L.filter((y) => y.on).concat(L.filter((y) => !y.on)), true); };
      if (el && !matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('wg-saindo'); setTimeout(fim, 180); } else fim();
      toastAcao(`${widgetDe(ds.id).nome()} saiu da tela.`, 'Desfazer', () => { S.profile.painel = antes; touch('profile'); render(); });
      return true;
    }
    case 'wg-tam': {
      const w = widgetDe(ds.id); const L = painelLayout(); const x = L.find((y) => y.id === ds.id); if (!x || !w) return true;
      x.tam = w.tams[(w.tams.indexOf(x.tam) + 1) % w.tams.length]; painelSalvar(L, true);
      const el = document.querySelector(`.wg[data-wg="${ds.id}"]`); if (el) wgFlip(() => { el.dataset.tam = x.tam; });
      const b = el && el.querySelector('.wg-tam'); if (b) { b.textContent = TAM_NOME[x.tam]; b.setAttribute('aria-label', `Largura de ${w.nome()}: ${TAM_NOME[x.tam]}. Tocar troca.`); }
      setTimeout(() => drawDashboard(), 240); // os gráficos se ajustam à nova largura
      return true;
    }
    case 'wg-mover': {
      const el = document.querySelector(`.wg[data-wg="${ds.id}"]`); if (!el) return true;
      const viz = +ds.d < 0 ? el.previousElementSibling : el.nextElementSibling; if (!viz) return true;
      wgFlip(() => { if (+ds.d < 0) viz.before(el); else viz.after(el); }); wgGravarOrdem();
      const b = el.querySelector(`[data-act="wg-mover"][data-d="${ds.d}"]`); if (b) b.focus({ preventScroll: true });
      return true;
    }
    default: return false;
  }
}

/* gestos: segurar para soltar os widgets; arrastar para mover */
function wgGestos() {
  let G = null; // gesto em andamento
  const MOUSE_MOVE = 5; const TOQUE_SEGURA = 180; const SEGURA_EDITAR = 550; const TOLERANCIA = 8;
  const ignorar = (t) => t.closest('input, select, textarea, .wg-ctl, .info-i, .hist-btn, a, [contenteditable], .sld, .obj-sw');
  const limpar = () => { if (G) { clearTimeout(G.t); if (G.raf) cancelAnimationFrame(G.raf); } G = null; S.wgArrastando = false; };
  document.addEventListener('pointerdown', (e) => {
    if (S.screen !== 'app' || S.view !== 'geral' || e.button !== 0) return;
    const el = e.target.closest && e.target.closest('.wg-grid > .wg[data-wg]:not([data-wg="extras"])'); if (!el || ignorar(e.target)) return;
    G = { el, id: el.dataset.wg, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, tipo: e.pointerType, armado: false, arrastando: false, suprimir: false };
    if (!S.wgEdit) {
      if (e.target.closest('button') && e.pointerType === 'mouse') { G = null; return; }
      G.t = setTimeout(() => { if (!G) return; G.suprimir = true; wgEntrar(false); if (G.el.isConnected) G.armado = true; else limpar(); }, SEGURA_EDITAR);
    } else if (e.pointerType === 'mouse') G.armado = true;
    else G.t = setTimeout(() => { if (G) { G.armado = true; G.el.classList.add('wg-pego'); } }, TOQUE_SEGURA);
  });
  document.addEventListener('pointermove', (e) => {
    if (!G) return; G.px = e.clientX; G.py = e.clientY; const dist = Math.hypot(e.clientX - G.x, e.clientY - G.y);
    if (!G.arrastando) {
      if (!G.armado) { if (dist > TOLERANCIA) limpar(); return; } // mexeu antes da hora: é rolagem, não arraste
      if (dist > (G.tipo === 'mouse' ? MOUSE_MOVE : 4)) iniciar(e);
      return;
    }
    mover();
  });
  // no toque, impede a rolagem da página só enquanto um widget está sendo arrastado
  document.addEventListener('touchmove', (e) => { if (G && (G.arrastando || G.armado)) e.preventDefault(); }, { passive: false });
  const soltar = () => {
    if (!G) return; const g = G;
    if (g.arrastando) {
      const alvo = g.el.getBoundingClientRect(); g.fantasma.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s'; g.fantasma.style.transform = `translate(${alvo.left}px, ${alvo.top}px)`;
      g.fantasma.classList.remove('voando');
      setTimeout(() => { g.fantasma.remove(); g.el.classList.remove('wg-vazio'); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
      wgGravarOrdem();
    }
    if (g.el) g.el.classList.remove('wg-pego');
    if (g.suprimir || g.arrastando) { const parar = (ev) => { ev.stopPropagation(); ev.preventDefault(); document.removeEventListener('click', parar, true); }; document.addEventListener('click', parar, true); setTimeout(() => document.removeEventListener('click', parar, true), 400); }
    limpar(); if (S.needsRender) setTimeout(() => { if (!S.wgArrastando && S.needsRender) render({ soft: true }); }, 300);
  };
  document.addEventListener('pointerup', soltar); document.addEventListener('pointercancel', soltar);
  function iniciar() {
    const r = G.el.getBoundingClientRect(); G.arrastando = true; S.wgArrastando = true; clearTimeout(G.t);
    G.dx = G.x - r.left; G.dy = G.y - r.top;
    const f = G.el.cloneNode(true); f.classList.add('wg-fantasma', 'voando'); f.removeAttribute('data-wg'); f.setAttribute('aria-hidden', 'true');
    f.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    Object.assign(f.style, { width: r.width + 'px', height: r.height + 'px', transform: `translate(${r.left}px, ${r.top}px)` });
    document.body.appendChild(f); G.fantasma = f; G.el.classList.add('wg-vazio'); G.el.classList.remove('wg-pego');
    const passo = () => { if (!G || !G.arrastando) return; rolar(); G.raf = requestAnimationFrame(passo); }; G.raf = requestAnimationFrame(passo);
    mover();
  }
  function mover() {
    const g = G; g.fantasma.style.transform = `translate(${g.px - g.dx}px, ${g.py - g.dy}px) scale(1.03)`;
    const alvos = [...document.querySelectorAll('.wg-grid.editando > .wg[data-wg]:not(.wg-vazio)')];
    const t = alvos.find((a) => { const r = a.getBoundingClientRect(); return g.px >= r.left && g.px <= r.right && g.py >= r.top && g.py <= r.bottom; });
    if (!t) return;
    const r = t.getBoundingClientRect(); const largo = t.dataset.tam === '6' || window.innerWidth <= 900;
    const antes = largo ? g.py < r.top + r.height / 2 : g.px < r.left + r.width / 2;
    const ref = antes ? t : t.nextElementSibling;
    if (ref === g.el || (antes ? t.previousElementSibling === g.el : t.nextElementSibling === g.el)) return;
    wgFlip(() => { if (antes) t.before(g.el); else t.after(g.el); });
  }
  function rolar() { const m = 80; const v = G.py < m ? -Math.ceil((m - G.py) / 6) : G.py > window.innerHeight - m ? Math.ceil((G.py - (window.innerHeight - m)) / 6) : 0; if (v) { window.scrollBy(0, v); mover(); } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.wgEdit && !document.querySelector('dialog[open]')) { if (S.wgAdd) { S.wgAdd = false; const b = document.querySelector('.wg-barra'); if (b) b.outerHTML = wgBarraHtml(); } else wgSair(); } });
  // evita o menu de contexto do toque longo enquanto organiza
  document.addEventListener('contextmenu', (e) => { if ((S.wgEdit || G) && e.target.closest && e.target.closest('.wg-grid')) e.preventDefault(); });
}
