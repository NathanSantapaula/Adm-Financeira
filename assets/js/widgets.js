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
    // com um período escolhido (seletor ao lado do ano), o valor é o do fim do período e o crescimento é só dele
    const [de, ate] = perIntervalo(); const ini = de ? C.patrimonio[de - 1] : C.patrimonioBase; const cres = C.patrimonio[ate] - ini;
    const dPer = Math.abs(cres) < 1 ? `<div class="c-d">Sem crescimento ${perFrase()}.</div>` : `<div class="c-d ${cres > 0 ? 'pos' : 'neg'}">${cres > 0 ? '+' : '−'} ${brl0(Math.abs(cres))} ${perFrase()}${ini > 0 ? ` (${cres > 0 ? '+' : '−'}${pct(Math.abs(cres) / ini)})` : ''}</div>`;
    return `<section class="card hero-card${visualAtual() === '3d' ? ' hero-3d' : ''}"><div class="c-k hc-row"><span>${S.periodo && ate < 11 ? 'Patrimônio no fim de ' + MES_LONGO[ate] : 'Patrimônio estimado'}</span><div class="hc-acts">${histBtn()}</div></div><div class="c-big" data-v="${C.patrimonio[ate]}">${brl0(C.patrimonio[ate])}</div>${S.periodo ? dPer : Math.abs(ganho) < 1 ? `<div class="c-d">Nenhum aporte registrado em ${p.year}. <button class="lnk strong" data-act="nav" data-view="inv">Registrar aporte</button></div>` : `<div class="c-d ${ganho > 0 ? 'pos' : 'neg'}">${ganho > 0 ? '+' : '−'} ${brl0(Math.abs(ganho))} investidos em ${p.year}</div>`}${patrCtl()}<div class="chart" id="d-patr"></div>
      <p class="cap">${custom ? `Patrimônio inicial de ${p.year} definido por você (${brl0(p.settings.patrimonioInicial)})` : (pr.patrimonioAno && p.year < pr.patrimonioAno ? `Estimado a partir do patrimônio informado no diagnóstico de ${pr.patrimonioAno} (${brl0(pr.patrimonioInicial)}), descontando os aportes registrados até lá` : `Patrimônio informado no diagnóstico (${brl0(pr.patrimonioInicial)}) mais os aportes registrados`)}. Valores a custo, sem a variação de mercado.</p></section>`;
  }
  const [de, ate] = perIntervalo(); const soma = (arr) => { let s = 0; for (let i = de; i <= ate; i++) s += arr[i] || 0; return s; };
  return `<section class="card hero-card"><div class="c-k hc-row"><span>Sobra para investir ${S.periodo ? perFrase() : 'em ' + p.year}</span><div class="hc-acts">${histBtn()}</div></div><div class="c-big">${brl0(soma(C.investAlocado))}</div><div class="c-d">${brl0(soma(C.receita))} de entradas e ${brl0(soma(C.despesas))} de gastos</div><div class="chart" id="d-patr"></div><p class="cap">Entradas menos gastos, mês a mês.</p></section>`;
}
// botão do gráfico do patrimônio: a linha do ritmo da meta
function patrCtl() {
  return S.C.metaAno > 0 ? `<div class="pt-ctl"><button class="pt-meta" data-act="patr-meta" aria-pressed="${!!S.patrMeta}"><i></i>Ritmo da meta</button></div>` : '';
}
function wOrcMes() {
  const C = S.C; const m = S.periodo ? perIntervalo()[1] : mesRef(); const u = C.usoOrc[m]; const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : '';
  return `<section class="card goal-card"><div class="c-k">Orçamento de ${MES_LONGO[m]}</div><div class="goal-ring">${ring(Math.min(1, u || 0), { size: 132, stroke: 12, color: tom === 'neg' ? 'var(--neg)' : tom === 'warn' ? 'var(--c4)' : 'var(--accent)', label: u == null ? '–' : pct(u), sub: u == null ? '' : 'usado', aria: 'Uso do orçamento' })}</div>
    <div class="c-d">${C.orcamento[m] > 0 ? `${brl0(C.despesas[m])} de ${brl0(C.orcamento[m])}` : 'Sem orçamento definido'}</div><p class="cap">${esc(voz(C.orcamento[m] > 0 ? (u > 1 ? 'orc_estourou' : 'orc_ok') : 'orc_definir', { mes: MES_LONGO[m], pct: pct(u), restante: brl0(C.restante[m]), valor: brl0(-C.restante[m]) }))}</p></section>`;
}
function wIndicadores() {
  const C = S.C; const T = C.T; const ids = perIds(); const n = ids.length; const fr = perFrase();
  // com um período escolhido, os totais são só dos meses dele; sem período, os do ano (C.T)
  const TP = S.periodo ? { receita: perSoma(C.receita), despesas: perSoma(C.despesas), investAlocado: perSoma(C.investAlocado), aplicado: perSoma(C.aplicado), dividendos: perSoma(C.dividendos) } : T;
  const poup = S.periodo ? (TP.receita > 0 ? TP.investAlocado / TP.receita : null) : T.poupanca;
  let orc;
  if (S.periodo && n > 1) {
    const o = perSoma(C.orcamento); const u = o > 0 ? TP.despesas / o : null; const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : '';
    orc = ['Orçamento ' + fr, u == null ? '–' : pct(u), tom, o > 0 ? (o - TP.despesas >= 0 ? `Sobraram ${brl0(o - TP.despesas)}` : `${brl0(TP.despesas - o)} acima do orçado`) : 'Sem orçamento definido', u || 0, WG_IC.orcmes, 'despesas'];
  } else {
    const m = S.periodo ? ids[0] : mesRef(); const u = C.usoOrc[m]; const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : '';
    orc = ['Orçamento de ' + MES_LONGO[m], u == null ? '–' : pct(u), tom, C.orcamento[m] > 0 ? (C.restante[m] >= 0 ? `Restam ${brl0(C.restante[m])}` : `${brl0(-C.restante[m])} acima do orçado`) : 'Sem orçamento definido', u || 0, WG_IC.orcmes, 'despesas'];
  }
  const IP = '<path d="M12 3v18M16.5 7c0-1.7-2-3-4.5-3S7.5 5.3 7.5 7s2 2.6 4.5 3.1 4.5 1.4 4.5 3.4-2 3.5-4.5 3.5-4.5-1.5-4.5-3.5"/>';
  const poupTxt = TP.receita <= 0 ? 'Cadastre rendas ou importe um extrato' : TP.investAlocado >= 0 ? `${brl0(TP.investAlocado)} sobraram${inv() ? ' para investir' : ''}` : `Gastos ${brl0(-TP.investAlocado)} acima das entradas`;
  let k;
  if (inv()) {
    const meta = S.periodo ? (C.metaAno * n) / 12 : C.metaAno; const progMeta = meta > 0 ? Math.min(1, TP.aplicado / meta) : 0; const md = ids.filter((i) => C.dividendos[i] > 0).length;
    k = [['Taxa de poupança ' + fr, poup == null ? '–' : pct(poup), '', poupTxt, null, IP, 'rendas'], orc,
      [S.periodo ? 'Aportes na meta do período' : 'Aportes na meta do ano', meta > 0 ? pct(progMeta) : '–', '', `${brl0(TP.aplicado)} de ${brl0(meta)}`, progMeta, WG_IC.patrimonio, 'inv'], ['Dividendos ' + fr, brl0(TP.dividendos), '', md ? `média de ${brl0(TP.dividendos / md)} por mês com pagamento` : 'Nenhum provento registrado', null, WG_IC.proventos, 'pro']];
  } else {
    k = [['Taxa de poupança ' + fr, poup == null ? '–' : pct(poup), '', poupTxt, null, IP, 'rendas'], orc,
      ['Entradas ' + fr, brl0(TP.receita), '', `média de ${brl0(TP.receita / n)} por mês`, null, '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>', 'rendas'], ['Gastos ' + fr, brl0(TP.despesas), '', `média de ${brl0(TP.despesas / n)} por mês`, null, '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>', 'despesas']];
  }
  return `<div class="stats4">${k.map((x) => `<div class="stat"><div class="c-k wg-tit">${wgIco(x[5], x[6])}<span>${esc(x[0])}</span></div><div class="c-num ${x[2] || ''}">${esc(x[1])}</div>${x[4] != null ? `<div class="bar ${x[2] || ''}"><i style="width:${Math.min(100, x[4] * 100).toFixed(1)}%"></i></div>` : ''}<div class="c-n">${esc(x[3])}</div></div>`).join('')}</div>`;
}
const wFluxo = () => `<section class="card"><div class="c-h"><h3>Para onde foi cada mês</h3><div class="legend"><span><i style="background:var(--c2)"></i>Gastos</span><span><i style="background:var(--c1)"></i>Sobra para investir</span></div></div><div class="chart" id="d-flow"></div></section>`;
function wCarteira() {
  if (!inv()) return `<section class="card"><div class="c-h"><h3>Evolua para o plano Investidor</h3></div><p class="mmsg">Acompanhe patrimônio, aportes e proventos e saiba onde investir a cada aporte para manter a carteira equilibrada.</p><div class="btn-row"><button class="btn primary" data-act="upgrade" data-plano="investidor">Conhecer o plano Investidor</button></div></section>`;
  // com a Carteira liberada, a mesma composição interativa da aba Carteira (passar o mouse, entrar na classe, ir ao ativo)
  if (temRecurso('carteira') && S.plan && S.plan.ativos.length) { const { K } = cartAnalise(); if (K.total > 0) return `<section class="card cart-exp-card" data-exp="composicao"><div class="c-h"><h3>Composição da carteira</h3>${cartExpBtn('composicao')}</div>${cartComposicaoHtml(K, true)}</section>`; }
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

// Proventos: total do período em destaque, divisão dividendos x renda fixa, gráfico mês a mês ou acumulado e o melhor mês
function wProventos() {
  const C = S.C; const ids = perIds(); const tot = perSoma(C.faturamento); const div = perSoma(C.dividendos); const rf = perSoma(C.rentab);
  const com = ids.filter((i) => C.faturamento[i] > 0); const md = com.length; const melhor = com.reduce((b, i) => (b == null || C.faturamento[i] > C.faturamento[b] ? i : b), null);
  if (!(tot > 0)) return `<section class="card pv-card"><div class="c-h"><h3>Proventos mês a mês</h3></div><div class="pv-vazio"><span class="pv-vazio-i">${ic(WG_IC.proventos)}</span><div><b>Nenhum provento ${perFrase()}</b><p>Dividendos, JCP e rendimentos de renda fixa que você registrar aparecem aqui, mês a mês.</p><button class="btn sm" data-act="nav" data-view="pro">Registrar proventos</button></div></div></section>`;
  const modo = S.provModo === 'acum' ? 'acum' : 'mes'; const b = (m, t) => `<button data-act="prov-modo" data-m="${m}" aria-pressed="${modo === m}">${t}</button>`;
  const pd = (div / tot) * 100;
  return `<section class="card pv-card"><div class="c-h"><h3>Proventos mês a mês</h3><div class="pt-seg pv-seg" role="group" aria-label="Como ver os proventos">${b('mes', 'Mês a mês')}${b('acum', 'Acumulado')}</div></div>
    <div class="pv-top"><div class="pv-tot"><small>Recebido ${perFrase()}</small><b>${brl0(tot)}</b></div>
      <div class="pv-mix"><div class="pv-bar" role="img" aria-label="Dividendos ${pct(pd / 100)} e renda fixa ${pct(1 - pd / 100)}"><i style="width:${pd.toFixed(1)}%;background:var(--c3)"></i><i style="width:${(100 - pd).toFixed(1)}%;background:var(--c5)"></i></div>
        <div class="pv-leg"><span><i style="background:var(--c3)"></i>Dividendos <b>${brl0(div)}</b></span><span><i style="background:var(--c5)"></i>Renda fixa <b>${brl0(rf)}</b></span></div></div></div>
    <div class="chart" id="d-prov"></div>
    <div class="pv-sts"><div class="pv-st"><small>Melhor mês</small><b>${melhor == null ? '–' : mesNome(melhor)}</b><span>${melhor == null ? '' : brl0(C.faturamento[melhor])}</span></div>
      <div class="pv-st"><small>Média nos meses com pagamento</small><b>${brl0(md ? tot / md : 0)}</b><span>por mês</span></div>
      <div class="pv-st"><small>Meses com pagamento</small><b>${md} de ${ids.length}</b><span>${md === ids.length ? 'todos os meses' : md ? 'continue assim' : ''}</span></div></div></section>`;
}
function drawProv() {
  const el = $('#d-prov'); if (!el) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (S.provModo === 'acum') {
    const ids = perIds(); let s = 0; const acum = ids.map((i) => (s += C.faturamento[i] || 0)); const curJ = ids.indexOf(cur);
    chartLine(el, { height: 190, suave: true, brilho: true, pontos: true, pontoFinal: true, teclado: true, cur: curJ, labels: ids.map((i) => MES[i]), aria: 'Proventos acumulados no período', series: [{ color: 'var(--c3)', values: acum, area: true, w: 3 }],
      tip: (j) => `<b>${mesNome(ids[j])}</b><br>Acumulado: ${brl0(acum[j])}<br>No mês: ${brl0(C.faturamento[ids[j]])}` });
    return;
  }
  chartBarsPer(el, { labels: MES, cur, height: 190, aria: 'Proventos recebidos em cada mês', bars: [{ color: 'var(--c3)', values: C.dividendos }, { color: 'var(--c5)', values: C.rentab }], tip: (i) => `<b>${mesNome(i)}</b><br>Dividendos: ${brl0(C.dividendos[i])}<br>Renda fixa: ${brl0(C.rentab[i])}<br>Total: ${brl0(C.faturamento[i])}` });
}
// Patrimônio ano a ano: valor de hoje em destaque, crescimento desde o primeiro ano e o fechamento de cada ano
function wHistMini() {
  const H = histDados(); const T = H.totais;
  if (!H.temHistorico) return `<section class="card hm-card"><div class="c-h"><h3>Patrimônio ano a ano</h3></div><p class="empty-s">Com dois ou mais anos de planejamento, a evolução aparece aqui.</p></section>`;
  const a0 = H.anos[0]; const sinal = (v) => (v >= 0 ? '+' : '−');
  const chip = T.crescimentoPct != null ? `<span class="hm-chip ${T.crescimento >= 0 ? 'up' : 'down'}">${sinal(T.crescimento)}${brl0(Math.abs(T.crescimento))} (${sinal(T.crescimentoPct)}${pct(Math.abs(T.crescimentoPct))}) desde ${a0.ano}</span>` : '';
  const anos = H.anos.filter((l) => l.preenchido).slice(-4).map((l) => `<li><small>${l.ano === NOW_Y ? 'Hoje' : l.ano}</small><b>${brl0(l.patrimonioFim)}</b>${l.variacaoPct != null ? `<span class="${l.variacao >= 0 ? 'up' : 'down'}">${sinal(l.variacaoPct)}${pct(Math.abs(l.variacaoPct))}</span>` : ''}</li>`).join('');
  return `<section class="card hm-card"><div class="c-h"><h3>Patrimônio ano a ano</h3></div>
    <div class="hm-top"><div class="hm-hoje"><small>Patrimônio hoje</small><b>${brl0(T.patrimonioAtual)}</b></div>${chip}</div>
    <div class="chart" id="d-histmini"></div><ul class="hm-anos">${anos}</ul>
    <p class="cap">Fim de cada ano de planejamento, encadeado a partir do patrimônio do diagnóstico. Valores a custo.</p></section>`;
}
// Orçamento e gastos: cada mês colorido pela situação (dentro, perto do limite, acima), resumo do período e detalhe do mês tocado
const orcSit = (i) => { const C = S.C; const o = C.orcamento[i]; const g = C.despesas[i]; return !(o > 0) ? 'sem' : g > o ? 'neg' : g > o * 0.85 ? 'warn' : 'pos'; };
const ORC_SIT = { pos: ['var(--pos)', 'Dentro do orçamento'], warn: ['var(--c4)', 'Perto do limite'], neg: ['var(--neg)', 'Acima do orçamento'], sem: ['var(--c2)', 'Sem orçamento'] };
function wOrcamento() {
  const C = S.C; const ids = perIds(); const lim = S.year === NOW_Y ? NOW_M : 11; const meses = ids.filter((i) => C.orcamento[i] > 0 && i <= lim);
  const dentro = meses.filter((i) => C.despesas[i] <= C.orcamento[i]).length; const gasto = perSoma(C.despesas); const orc = perSoma(C.orcamento); const u = orc > 0 ? gasto / orc : null;
  const tom = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : 'pos';
  const leg = ['pos', 'warn', 'neg'].map((k) => `<span><i style="background:${ORC_SIT[k][0]}"></i>${ORC_SIT[k][1].replace(' do orçamento', '')}</span>`).join('') + '<span><i class="mk" style="background:var(--ink-3)"></i>Orçado</span>';
  return `<section class="card oc-card"><div class="c-h"><h3>Orçamento e gastos</h3><div class="legend">${leg}</div></div>
    <div class="oc-top"><div class="oc-k"><small>Gasto ${perFrase()}</small><b>${brl0(gasto)}</b><span>${orc > 0 ? 'de ' + brl0(orc) + ' orçados' : 'sem orçamento definido'}</span></div>
      ${u != null ? `<div class="oc-uso ${tom}"><div class="oc-uso-b"><i style="width:${Math.min(100, u * 100).toFixed(1)}%"></i></div><span><b>${pct(u)}</b> do orçamento usado</span></div>` : ''}
      <div class="oc-k oc-meses"><small>Meses dentro</small><b>${dentro} de ${meses.length}</b></div></div>
    <div class="chart" id="d-orc"></div><p class="oc-det keep" id="orc-det" aria-live="polite">Toque num mês para ver o detalhe.</p></section>`;
}
function orcDetalhe(i) {
  const el = document.getElementById('orc-det'); if (!el) return; const C = S.C; const o = C.orcamento[i]; const g = C.despesas[i]; const s = orcSit(i);
  el.className = 'oc-det keep ' + s;
  el.innerHTML = `<i style="background:${ORC_SIT[s][0]}"></i><span><b>${esc(mesNome(i))}</b>: ${o > 0 ? `${brl0(g)} de ${brl0(o)} (${pct(g / o)}) · ${g <= o ? 'restaram ' + brl0(o - g) : brl0(g - o) + ' acima'}` : `${brl0(g)} gastos, sem orçamento definido`}</span> <button class="lnk strong" data-act="nav" data-view="despesas">Ver gastos</button>`;
}
function drawOrc() {
  const el = $('#d-orc'); if (!el) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1; const sit = MES.map((_, i) => orcSit(i));
  const so = (k) => C.despesas.map((v, i) => (sit[i] === k ? v : 0));
  chartBarsPer(el, { labels: MES, cur, aria: 'Gastos de cada mês comparados com o orçamento', bars: ['pos', 'warn', 'neg', 'sem'].map((k) => ({ color: ORC_SIT[k][0], values: so(k) })), marks: [{ color: 'var(--ink-3)', values: C.orcamento }],
    tip: (i) => `<b>${mesNome(i)}</b><br>Gasto: ${brl0(C.despesas[i])}<br>Orçado: ${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : 'sem orçamento'}<br>${ORC_SIT[sit[i]][1]}`, onPick: orcDetalhe });
}

/* ---------- catálogo ---------- */
const WIDGETS = [
  { id: 'patrimonio', nome: () => (inv() ? 'Patrimônio estimado' : 'Sobra para investir'), desc: 'Valor do ano com o gráfico mês a mês (patrimônio ou aportes, com o ritmo da meta) e o Histórico.', tam: 4, tams: [3, 4, 6], padrao: () => true, html: wPatrimonio, aba: () => (inv() ? 'inv' : 'despesas') },
  { id: 'objetivos', nome: () => 'Objetivos', desc: 'O objetivo em foco com a foto do seu sonho, o progresso e o prazo; troque entre as metas.', tam: 2, tams: [2, 3, 4, 6], padrao: () => true, html: () => objCardHtml(), disponivel: inv },
  { id: 'orcmes', nome: () => 'Orçamento do mês', desc: 'Quanto do orçamento do mês já foi usado.', tam: 2, tams: [2, 3], padrao: () => !inv(), html: wOrcMes, aba: () => 'despesas' },
  { id: 'indicadores', nome: () => 'Indicadores do ano', desc: 'Poupança, orçamento, aportes e dividendos (ou entradas e gastos).', tam: 6, tams: [6], padrao: () => true, html: wIndicadores },
  { id: 'fluxo', nome: () => 'Para onde foi cada mês', desc: 'Gastos e sobra para investir, mês a mês.', tam: 3, tams: [3, 4, 6], padrao: () => true, html: wFluxo, aba: () => 'despesas' },
  { id: 'constancia', nome: () => (temRecurso('investimentos') ? 'Constância dos aportes' : 'Gastos fixos e variáveis'), desc: 'Aportes de cada mês contra a meta (ou o peso dos gastos fixos).', tam: 3, tams: [3, 4, 6], padrao: () => true, html: () => painel2Html(), aba: () => (temRecurso('investimentos') ? 'inv' : 'despesas') },
  { id: 'carteira', nome: () => (inv() ? 'Composição da carteira' : 'Plano Investidor'), desc: 'Peso de cada classe de ativo na carteira.', tam: 3, tams: [2, 3, 4], padrao: () => true, html: wCarteira, aba: () => (inv() ? 'cart' : '') },
  { id: 'areas', nome: () => 'Onde você mais gasta', desc: 'Ranking das áreas de gasto do ano.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true, html: wAreas, aba: () => 'despesas' },
  { id: 'destaques', nome: () => 'O que o painel está vendo', desc: 'Leituras automáticas do mês: orçamento, poupança, aportes e carteira.', tam: 3, tams: [3, 4, 6], padrao: () => true, html: wDestaques },
  { id: 'assessor', nome: () => 'Assessor e próximos passos', desc: 'Recomendação do assessor ou os próximos passos sugeridos.', tam: 3, tams: [2, 3, 4], padrao: () => true, html: wAssessor },
  { id: 'orcamento', nome: () => 'Orçamento e gastos', desc: 'Gasto de cada mês contra o orçamento.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wOrcamento, aba: () => 'despesas' },
  { id: 'proventos', nome: () => 'Proventos mês a mês', desc: 'Dividendos e rendimentos recebidos em cada mês.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wProventos, aba: () => 'pro', disponivel: () => temRecurso('investimentos') },
  { id: 'objlista', nome: () => 'Todos os objetivos', desc: 'Lista com o progresso e a situação de cada objetivo.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wObjLista, disponivel: inv },
  { id: 'avisos', nome: () => 'Avisos', desc: 'Os três avisos mais importantes da central de notificações.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wAvisos },
  { id: 'atalhos', nome: () => 'Atalhos', desc: 'Botões para as tarefas mais comuns.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false, html: wAtalhos },
  { id: 'histmini', nome: () => 'Patrimônio ano a ano', desc: 'Evolução do patrimônio em todos os anos de planejamento.', tam: 3, tams: [3, 4, 6], padrao: () => false, html: wHistMini, disponivel: inv },
];
/* cada tela personalizável tem a sua lista de widgets e o seu lugar no perfil */
const PAINEIS = {
  geral: { defs: () => WIDGETS, chave: 'painel', nome: 'Visão geral', view: 'geral' },
  gastos: { defs: () => G_WIDGETS, chave: 'painelGastos', nome: 'Gastos', view: 'despesas' },
  rendas: { defs: () => R_WIDGETS, chave: 'painelRendas', nome: 'Rendas', view: 'rendas' },
  invest: { defs: () => INV_WIDGETS, chave: 'painelInvest', nome: 'Investimentos', view: 'inv', recurso: 'investimentos' },
  proventos: { defs: () => PRO_WIDGETS, chave: 'painelProventos', nome: 'Proventos', view: 'pro', recurso: 'proventos' },
  carteira: { defs: () => CART_WIDGETS, chave: 'painelCarteira', nome: 'Carteira', view: 'cart', recurso: 'carteira' },
};
const alvoDaTela = () => Object.keys(PAINEIS).find((k) => PAINEIS[k].view === S.view) || null; // tela com widgets aberta agora
const nomeTela = (alvo) => (alvo && alvo !== 'geral' ? 'a aba ' + painelDe(alvo).nome : 'a Visão geral');
const painelDe = (alvo) => PAINEIS[alvo] || PAINEIS.geral;
const alvoAtual = () => (PAINEIS[S.painelAlvo] ? S.painelAlvo : 'geral');
const widgetDe = (id, alvo) => painelDe(alvo).defs().find((w) => w.id === id);
const widgetDisp = (w) => !w.disponivel || w.disponivel();

/* ---------- layout ---------- */
function painelLayout(alvo) {
  const P = painelDe(alvo); const reg = S.profile[P.chave]; const salvo = reg && Array.isArray(reg.itens) ? reg.itens : null; const out = [];
  (salvo || []).forEach((it) => { const w = widgetDe(it && it.id, alvo); if (w && widgetDisp(w) && !out.some((o) => o.id === w.id)) out.push({ id: w.id, on: !!it.on, tam: w.tams.includes(+it.tam) ? +it.tam : w.tam }); });
  P.defs().forEach((w) => { if (widgetDisp(w) && !out.some((o) => o.id === w.id)) out.push({ id: w.id, on: salvo ? false : w.padrao(), tam: w.tam }); });
  return out.filter((x) => x.on).concat(out.filter((x) => !x.on)); // na tela, em ordem; depois os desligados
}
// grava o layout visível sem perder a escolha dos widgets que o plano atual não mostra
function painelSalvar(lista, semRender, alvo) {
  const P = painelDe(alvo); const reg = S.profile[P.chave];
  const ant = (reg && reg.itens) || []; const fora = ant.filter((it) => it && widgetDe(it.id, alvo) && !widgetDisp(widgetDe(it.id, alvo)) && !lista.some((x) => x.id === it.id));
  S.profile[P.chave] = { itens: lista.map((x) => ({ id: x.id, on: !!x.on, tam: x.tam })).concat(fora) };
  touch('profile'); if (S.view === P.view && !semRender) renderLater();
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
/* telas com widgets (Gastos, Rendas, Investimentos, Proventos): mesma marcação da Visão geral (.wg-grid > .wg),
   então "Organizar a tela" funciona igual; fora do modo organizar, as larguras são encaixadas sem buracos (encaixeLinhas).
   html: { idDoWidget: htmlDoCartão }; widgets sem html (sem dado ou fora do período) não aparecem. */
function telaWidgetsHtml(alvo, html) {
  const ed = !!S.wgEdit && alvoDaTela() === alvo; const L = painelLayout(alvo).filter((x) => x.on && html[x.id]);
  const sp = encaixeLinhas(L.map((x) => x.tam)); const spm = encaixeLinhas(tamMedio(sp));
  const cel = L.map((x, k) => { const w = widgetDe(x.id, alvo);
    return `<div class="wg" data-wg="${x.id}" data-tam="${x.tam}" style="--i:${k % 4};--sp:${sp[k]};--spm:${spm[k]}"${ed ? ` aria-label="${esc(w.nome())}"` : ''}>${ed ? wgControles(w, x) : ''}${html[x.id]}</div>`; }).join('');
  const pe = ed ? '' : `<div class="wg-foot"><button class="btn ghost sm" data-act="wg-editar">${I_AJUSTE}Organizar a tela</button><button class="lnk" data-act="painel-abrir" data-alvo="${alvo}">Mais opções</button></div>`;
  return `${ed ? wgBarraHtml() : ''}<div class="tw-wrap"><div class="wg-grid tw${ed ? ' editando' : ''}">${cel}</div></div>${pe}`;
}
/* encaixe sem buracos numa grade de 6: quando o próximo widget não cabe no resto da linha, o último da linha cresce até a borda */
function encaixeLinhas(tams, cols) {
  cols = cols || 6; const out = []; let usado = 0; let ultimo = -1;
  tams.forEach((t, i) => { t = Math.min(cols, t); if (usado + t > cols) { if (ultimo >= 0) out[ultimo] += cols - usado; usado = 0; } out.push(t); usado += t; ultimo = i; if (usado === cols) usado = 0; });
  if (usado > 0 && ultimo >= 0) out[ultimo] += cols - usado;
  return out;
}
// larguras em telas médias: quem divide uma linha com só mais um widget fica meio a meio; sozinho, ocupa a linha
function tamMedio(sp) {
  const out = []; let linha = []; let soma = 0;
  const fecha = () => { if (linha.length === 2) out.push(3, 3); else linha.forEach((t) => out.push(linha.length === 1 || t > 3 ? 6 : 3)); linha = []; soma = 0; };
  sp.forEach((t) => { linha.push(t); soma += t; if (soma >= 6) fecha(); }); if (linha.length) fecha();
  return out;
}
const I_AJUSTE = ic('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 14v6M14 17h6"/>');
// gráficos dos widgets novos (os antigos continuam em drawDashboard)
/* ícone próprio de cada widget, à esquerda do título: tocar leva à aba de origem (ou abre o que o widget resume) */
const WG_IC = {
  patrimonio: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  orcmes: '<path d="M3.5 16a9 9 0 1 1 17 0"/><path d="m12 13 4-4"/>',
  fluxo: '<path d="M6 20V11M12 20V5M18 20v-6M3 20h18"/>',
  constancia: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M9 15.5l2 2 4-4"/>',
  carteira: '<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.6A9 9 0 0 1 20.4 9H15z"/>',
  areas: '<path d="M4 6h16M4 12h11M4 18h6"/>',
  destaques: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  assessor: '<path d="M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z"/><path d="M8 8.5h9M8 12h6"/>',
  orcamento: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  proventos: '<circle cx="9" cy="9" r="6"/><path d="M15.6 9.3A6 6 0 1 1 9.3 15.6"/>',
  objlista: '<path d="M5 21V4M5 4h12l-2.2 4L17 12H5"/>',
  avisos: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9"/><path d="M10.3 20.5a2 2 0 0 0 3.4 0"/>',
  atalhos: '<path d="M13 2.5 4 13.5h7.5l-1 8 9-11H12z"/>',
  histmini: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/>',
};
const WG_ACAO = { objlista: ['objetivos-abrir', 'Abrir Meus objetivos'], avisos: ['notif-toggle', 'Abrir a central de avisos'], histmini: ['hist-toggle', 'Abrir o histórico'] };
const abaNome = (aba) => (ABAS.find((a) => a[0] === aba) || [])[1] || 'aba';
const abaAberta = (aba) => !!aba && visibleTabs().includes(aba) && abaLiberada(aba);
// devolve o ícone como botão (com destino) ou como enfeite (sem destino)
function wgIco(path, aba, acao) {
  const svg = ic(path);
  if (abaAberta(aba)) return `<button class="wg-ic" data-act="nav" data-view="${aba}" aria-label="Abrir ${esc(abaNome(aba))}" title="Abrir ${esc(abaNome(aba))}">${svg}</button>`;
  if (acao) return `<button class="wg-ic" data-act="${acao[0]}" aria-label="${esc(acao[1])}" title="${esc(acao[1])}">${svg}</button>`;
  return `<span class="wg-ic" aria-hidden="true">${svg}</span>`;
}
function wgIcones() {
  document.querySelectorAll('#view .wg-grid > .wg[data-wg]').forEach((wg) => {
    const id = wg.dataset.wg; const path = WG_IC[id]; const card = wg.firstElementChild; if (!path || !card) return;
    const alvo = card.querySelector(':scope > .c-h > h3') || card.querySelector(':scope > .c-k > span'); if (!alvo || alvo.querySelector('.wg-ic')) return;
    const w = widgetDe(id); alvo.classList.add('wg-tit'); alvo.insertAdjacentHTML('afterbegin', wgIco(path, w && w.aba ? w.aba() : '', WG_ACAO[id]));
  });
}
function drawWidgetsExtras() {
  wgIcones(); objSwLigar(); if (visualAtual() === '3d') obj3dLigar(); if (S.view === 'geral' && typeof cmpLigar === 'function') cmpLigar();
  const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  drawOrc(); drawProv();
  const hm = $('#d-histmini');
  if (hm) { const H = histDados(); const P = H.serie.map((p) => ({ ano: p.ano, mes: p.mes, v: p.patrimonio })); chartHistorico(hm, { pontos: P, height: 200, suave: true, brilho: true, color: 'var(--c1)', aria: 'Patrimônio de todos os anos', rotuloPonto: (v) => tickFmt(v), tip: (i) => `<b>${MES_LONGO[H.serie[i].mes]} de ${H.serie[i].ano}</b><br>Patrimônio: ${brl0(H.serie[i].patrimonio)}` }); }
}

/* ---------- painel: Personalizar a Visão geral ---------- */
function painelLinkHtml(alvo) {
  const L = painelLayout(alvo); const n = L.filter((x) => x.on).length;
  return `<button class="pf-card obj-link" data-act="painel-abrir" data-alvo="${alvo || 'geral'}"><span class="obj-stack"><span class="obj-ic" style="--cor:var(--accent)">${I_AJUSTE}</span></span><span class="pf-t"><b>Personalizar ${nomeTela(alvo)}</b><small>${n} de ${L.length} widgets na tela</small></span><span class="pf-go">Abrir${I.chev}</span></button>`;
}
function painelEditorHtml() {
  const alvo = alvoAtual(); const L = painelLayout(alvo); const on = L.filter((x) => x.on); const off = L.filter((x) => !x.on);
  const linha = (x, i) => { const w = widgetDe(x.id, alvo);
    const tams = w.tams.length > 1 ? `<div class="wg-tams" role="group" aria-label="Largura de ${esc(w.nome())}">${w.tams.map((t) => `<button type="button" class="np-chip" data-act="painel-tam" data-id="${x.id}" data-tam="${t}" aria-pressed="${x.tam === t}">${TAM_NOME[t]}</button>`).join('')}</div>` : '<small class="wg-fixo">Largura inteira</small>';
    return `<li class="wg-row" draggable="true" data-id="${x.id}">
      <span class="wg-alca" aria-hidden="true" title="Arraste para mudar a posição">${I_ALCA}</span>
      <label class="wg-sw"><input type="checkbox" data-painel-on="${x.id}" checked aria-label="Mostrar ${esc(w.nome())}"><span></span></label>
      <div class="wg-row-t"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small>${tams}</div>
      <div class="wg-row-a"><button class="icon-btn sm" data-act="painel-mover" data-id="${x.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(w.nome())}">${I.up}</button><button class="icon-btn sm" data-act="painel-mover" data-id="${x.id}" data-d="1" ${i === on.length - 1 ? 'disabled' : ''} aria-label="Descer ${esc(w.nome())}">${I.down}</button></div></li>`; };
  const extra = (x) => { const w = widgetDe(x.id, alvo);
    return `<li class="wg-row off" data-id="${x.id}"><span></span><label class="wg-sw"><input type="checkbox" data-painel-on="${x.id}" aria-label="Mostrar ${esc(w.nome())}"><span></span></label>
      <div class="wg-row-t"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small></div><button class="btn sm" data-act="painel-add" data-id="${x.id}">Adicionar</button></li>`; };
  const mini = `<div class="wg-mini" aria-hidden="true">${on.map((x) => `<i style="grid-column: span ${x.tam}">${esc(widgetDe(x.id, alvo).nome())}</i>`).join('')}</div>`;
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
  const alvo = alvoAtual(); const L = painelLayout(alvo); const i = L.findIndex((x) => x.id === ds.id); const salvar = (lista) => painelSalvar(lista, false, alvo);
  switch (act) {
    case 'painel-abrir': S.painelAlvo = PAINEIS[ds.alvo] ? ds.alvo : 'geral'; S.maisOpen = false; S.admAntes = S.adminOpen && /^grupo:/.test(S.adminPage || '') ? S.adminPage : 'inicio'; if (!S.adminOpen) openAdmin('painel'); else { S.adminPage = 'painel'; renderAdmin(true); } return true;
    case 'painel-voltar': S.adminPage = S.admAntes || 'inicio'; S.admAntes = null; renderAdmin(true); return true;
    case 'painel-mover': { const n = L.filter((x) => x.on).length; const j = i + (+ds.d); if (i < 0 || j < 0 || j >= n) return true; [L[i], L[j]] = [L[j], L[i]]; salvar(L); painelRender(`[data-act="painel-mover"][data-id="${ds.id}"][data-d="${ds.d}"]:not([disabled])`, `[data-act="painel-mover"][data-id="${ds.id}"]:not([disabled])`); return true; }
    case 'painel-add': { if (i < 0) return true; const [x] = L.splice(i, 1); x.on = true; L.splice(L.filter((y) => y.on).length, 0, x); salvar(L); painelRender(`[data-painel-on="${x.id}"]`); toast(`${widgetDe(x.id, alvo).nome()} adicionado ao fim de ${painelDe(alvo).nome}.`); return true; }
    case 'painel-tam': if (i >= 0) { L[i].tam = +ds.tam; salvar(L); painelRender(`[data-act="painel-tam"][data-id="${ds.id}"][data-tam="${ds.tam}"]`); } return true;
    case 'painel-padrao': {
      const P = painelDe(alvo); const antes = S.profile[P.chave] ? JSON.parse(JSON.stringify(S.profile[P.chave])) : null;
      S.profile[P.chave] = null; touch('profile'); renderAdmin(); if (S.view === P.view) renderLater();
      toastAcao(`${P.nome} de volta ao padrão.`, 'Desfazer', () => { S.profile[P.chave] = antes; touch('profile'); if (S.adminOpen) renderAdmin(); render(); });
      return true;
    }
    default: return false;
  }
}
function painelLigar(t) {
  const alvo = alvoAtual(); const L = painelLayout(alvo); const x = L.find((y) => y.id === t.dataset.painelOn); if (!x) return;
  const i = L.indexOf(x); L.splice(i, 1); x.on = t.checked;
  if (x.on) L.splice(L.filter((y) => y.on).length, 0, x); else L.push(x); // ligado vai para o fim da tela; desligado sai da ordem
  painelSalvar(L, false, alvo); painelRender(`[data-painel-on="${x.id}"]`);
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
    const alvo = alvoAtual(); const L = painelLayout(alvo); const de = L.findIndex((x) => x.id === arrastando); if (de < 0 || r.dataset.id === arrastando) return;
    const [item] = L.splice(de, 1); let para = L.findIndex((x) => x.id === r.dataset.id); if (r.classList.contains('depois')) para++;
    L.splice(para, 0, item); arrastando = null; painelSalvar(L, false, alvo); painelRender();
  });
}

/* ---------- Organizar na própria tela (como no celular) ----------
   Toque e segure um widget (ou "Organizar a tela") para soltar os widgets: eles balançam, ganham botões de remover e de
   largura, e podem ser arrastados com o dedo ou o mouse. Os vizinhos abrem espaço enquanto arrasta. "Concluir" ou Esc fecha. */
const wgAlvo = () => alvoDaTela() || 'geral'; // a tela que está sendo organizada
const I_MENOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>';
function wgControles(w, x) {
  const tam = w.tams.length > 1 ? `<button class="wg-tam" data-act="wg-tam" data-id="${x.id}" aria-label="Largura de ${esc(w.nome())}: ${TAM_NOME[x.tam]}. Tocar troca.">${TAM_NOME[x.tam]}</button>` : '';
  return `<div class="wg-ctl"><button class="wg-rm" data-act="wg-remover" data-id="${x.id}" aria-label="Tirar ${esc(w.nome())} da tela">${I_MENOS}</button>${tam}
    <span class="wg-mv"><button data-act="wg-mover" data-id="${x.id}" data-d="-1" aria-label="Mover ${esc(w.nome())} para antes">${I.up}</button><button data-act="wg-mover" data-id="${x.id}" data-d="1" aria-label="Mover ${esc(w.nome())} para depois">${I.down}</button></span></div>`;
}
function wgBarraHtml() {
  const off = painelLayout(wgAlvo()).filter((x) => !x.on);
  const lista = S.wgAdd ? `<div class="wg-add" role="dialog" aria-label="Adicionar widget">${off.length ? off.map((x) => { const w = widgetDe(x.id, wgAlvo()); return `<button class="wg-add-i" data-act="wg-add" data-id="${x.id}"><b>${esc(w.nome())}</b><small>${esc(w.desc)}</small></button>`; }).join('') : '<p class="empty-s">Todos os widgets já estão na tela.</p>'}</div>` : '';
  return `<div class="wg-barra" role="toolbar" aria-label="Organizar ${painelDe(wgAlvo()).nome}"><span class="wg-barra-t"><b>Organizando a tela</b><small>Arraste os widgets para mudar a ordem</small></span>
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
    const L = painelLayout(wgAlvo());
    grid.querySelectorAll(':scope > .wg[data-wg="extras"], :scope > .wg:not([data-wg])').forEach((e) => e.remove());
    grid.querySelectorAll(':scope > .wg[data-wg]').forEach((e) => { const x = L.find((y) => y.id === e.dataset.wg); const w = widgetDe(e.dataset.wg, wgAlvo()); if (x && w) { e.insertAdjacentHTML('afterbegin', wgControles(w, x)); e.setAttribute('aria-label', w.nome()); } });
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
  const L = painelLayout(wgAlvo()); const on = ids.map((id) => L.find((x) => x.id === id)).filter(Boolean);
  painelSalvar(on.concat(L.filter((x) => !ids.includes(x.id))), true, wgAlvo());
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
      const L = painelLayout(wgAlvo()); const i = L.findIndex((x) => x.id === ds.id); if (i < 0) return true;
      const [x] = L.splice(i, 1); x.on = true; L.splice(L.filter((y) => y.on).length, 0, x); painelSalvar(L, true, wgAlvo()); S.wgAdd = false; render();
      const el = document.querySelector(`.wg[data-wg="${x.id}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); el.classList.add('wg-novo'); }
      return true;
    }
    case 'wg-remover': {
      const el = document.querySelector(`.wg[data-wg="${ds.id}"]`); const chave = painelDe(wgAlvo()).chave; const antes = JSON.parse(JSON.stringify(S.profile[chave] || null));
      const L = painelLayout(wgAlvo()); const x = L.find((y) => y.id === ds.id); if (!x) return true; x.on = false;
      const fim = () => { wgFlip(() => { if (el) el.remove(); }); painelSalvar(L.filter((y) => y.on).concat(L.filter((y) => !y.on)), true, wgAlvo()); };
      if (el && !matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('wg-saindo'); setTimeout(fim, 180); } else fim();
      toastAcao(`${widgetDe(ds.id, wgAlvo()).nome()} saiu da tela.`, 'Desfazer', () => { S.profile[chave] = antes; touch('profile'); render(); });
      return true;
    }
    case 'wg-tam': {
      const w = widgetDe(ds.id, wgAlvo()); const L = painelLayout(wgAlvo()); const x = L.find((y) => y.id === ds.id); if (!x || !w) return true;
      x.tam = w.tams[(w.tams.indexOf(x.tam) + 1) % w.tams.length]; painelSalvar(L, true, wgAlvo());
      const el = document.querySelector(`.wg[data-wg="${ds.id}"]`); if (el) wgFlip(() => { el.dataset.tam = x.tam; });
      const b = el && el.querySelector('.wg-tam'); if (b) { b.textContent = TAM_NOME[x.tam]; b.setAttribute('aria-label', `Largura de ${w.nome()}: ${TAM_NOME[x.tam]}. Tocar troca.`); }
      setTimeout(() => drawAll(), 240); // os gráficos se ajustam à nova largura
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
  const ignorar = (t) => t.closest('input, select, textarea, .wg-ctl, .info-i, .hist-btn, a, [contenteditable], .sld, .obj-sw, .obj-sw-seta');
  const limpar = () => { if (G) { clearTimeout(G.t); if (G.raf) cancelAnimationFrame(G.raf); } G = null; S.wgArrastando = false; };
  document.addEventListener('pointerdown', (e) => {
    if (S.screen !== 'app' || !alvoDaTela() || e.button !== 0) return;
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
