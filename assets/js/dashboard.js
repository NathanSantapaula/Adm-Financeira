/* Visão geral: tela de boas-vindas com estatísticas e gráficos. Muda conforme o plano e fala no tom escolhido (voz). */
'use strict';
const mesRef = () => (S.year === NOW_Y ? NOW_M : S.mes);

function areasDoAno() { const [de, ate] = perIntervalo(); return areasDe2(S.plan, planCtx().carry, S.year, de, ate).slice(0, 6); }
function composicao() {
  if (!S.plan.ativos.length) return [];
  const M = cartModel(); const map = new Map();
  M.items.forEach((i) => { map.set(i.a.classe, (map.get(i.a.classe) || 0) + i.valor); });
  return [...map.entries()].map(([label, value]) => ({ label, value })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
}
const metaDoAporte = () => +S.plan.settings.metaAporte || 0;
// Objetivo em foco (Visão geral e simulador): saldo e aporte são a fatia dele no patrimônio e no aporte mensal
function projecaoObjetivo() {
  const A = objAnalise(); const g = objFoco(A); const B = objBase();
  if (!g) return { ob: {}, patr: B.patrimonio, aporte: B.aporte, meses: null, ano: null, fatia: 1, n: 0 };
  return { ob: g, patr: g.saldo, aporte: g.aporte, meses: g.meses, ano: g.previsto ? g.previsto.ano : null, fatia: (+g.pct || 0) / 100, n: A.itens.length };
}

function insights() {
  const C = S.C; const T = C.T; const m = mesRef(); const mn = MES_LONGO[m]; const out = []; const inv = temRecurso('investimentos');
  const vm = { mes: mn, ano: S.year };
  if (T.receita === 0 && T.despesas === 0) out.push({ t: 'info', x: voz('sem_dados'), a: ['ingest-open', null, 'Importar extrato'] });
  if (C.orcamento[m] > 0) {
    const u = C.usoOrc[m];
    out.push({ t: u > 1 ? 'neg' : u > 0.85 ? 'warn' : 'pos', x: voz(u > 1 ? 'orc_estourou' : 'orc_ok', Object.assign({ pct: pct(u), restante: brl0(C.restante[m]), valor: brl0(-C.restante[m]) }, vm)), a: ['nav', 'despesas', 'Ver gastos'] });
  } else if (T.despesas > 0) out.push({ t: 'info', x: voz('orc_definir', vm), a: ['nav', 'despesas', 'Definir orçamento'] });
  if (T.poupanca != null && T.receita > 0 && T.poupanca >= 0) out.push({ t: T.poupanca >= 0.2 ? 'pos' : 'info', x: voz('poupanca', Object.assign({ pct: pct(T.poupanca), valor: brl0(T.investAlocado) }, vm)) });
  else if (T.despesas > T.receita && T.despesas > 0) out.push({ t: 'warn', x: voz('deficit', Object.assign({ valor: brl0(T.despesas - T.receita) }, vm)), a: ['nav', 'rendas', 'Conferir rendas'] });
  const ma = metaDoAporte();
  if (inv && ma > 0 && C.aportes[m] !== 0) out.push({ t: C.aportes[m] >= ma ? 'pos' : 'info', x: voz('aporte_mes', Object.assign({ valor: brl0(C.aportes[m]), pct: pct(C.aportes[m] / ma), meta: brl0(ma) }, vm)) });
  if (temRecurso('carteira') && S.plan.ativos.length) {
    try { const M = cartModel(); if (M.rb.W > 0) { const w = M.items.slice().sort((a, b) => a.desvio - b.desvio)[0]; if (w && w.desvio < -1) out.push({ t: 'info', x: voz('carteira_desvio', { ativo: w.a.nome, pp: Math.abs(w.desvio).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }), a: ['nav', 'cart', 'Ver onde investir'] }); } } catch (e) { /* sem carteira */ }
  }
  return out.slice(0, 4);
}
function proximosPassos() {
  const p = S.plan; const T = S.C.T; const steps = [];
  if (!p.lancamentos.length && !p.despesas.length && !(T.receita > 0)) steps.push(['Importe o extrato do mês', 'ingest-open', null]);
  if (!p.rendas.some((r) => E.sum(r.valores) > 0) && !(T.receita > 0)) steps.push(['Cadastre suas rendas', 'nav', 'rendas']);
  if (!(T.orcamento > 0)) steps.push(['Defina o orçamento do mês', 'nav', 'despesas']);
  if (temRecurso('investimentos') && !(T.aplicado > 0)) steps.push(['Registre seus aportes', 'nav', 'inv']);
  if (temRecurso('carteira') && p.ativos.length && !S.profile.carteira.some((e) => e.alvo > 0)) steps.push(['Defina o alvo da sua carteira', 'nav', 'cart']);
  return steps.slice(0, 3);
}
const btnAcao = (a, cls) => `<button class="${cls || 'lnk strong'}" data-act="${a[0]}"${a[1] ? ` data-view="${a[1]}"` : ''}>${esc(a[2])}</button>`;

/* Período do card de patrimônio (só da sessão): S.periodo = { de, ate } em meses 0–11, ou null para o ano todo.
   Atalhos de 3 e 6 meses terminam no mês atual (ou em dezembro, para outros anos); o calendário escolhe início e fim. */
const PER_ATALHOS = [[3, 'Últimos 3 meses'], [6, 'Últimos 6 meses'], [12, 'Ano todo']];
const perRef = () => (S.year === NOW_Y ? NOW_M : 11);
function perIntervalo() { const p = S.periodo; return p ? [Math.min(p.de, p.ate), Math.max(p.de, p.ate)] : [0, 11]; }
const perIds = () => { const [de, ate] = perIntervalo(); const r = []; for (let i = de; i <= ate; i++) r.push(i); return r; };
const perSoma = (arr) => perIds().reduce((a, i) => a + (+arr[i] || 0), 0);
// barras mês a mês só nos meses do período: cfg traz arrays de 12 meses, e cur/tip/onPick usam o mês do ano
function chartBarsPer(el, cfg) {
  const ids = perIds(); const so = (a) => ids.map((i) => a[i]);
  chartBars(el, Object.assign({}, cfg, { labels: so(cfg.labels), cur: ids.indexOf(cfg.cur), bars: cfg.bars.map((b) => Object.assign({}, b, { values: so(b.values) })),
    marks: (cfg.marks || []).map((k) => Object.assign({}, k, { values: so(k.values) })), tip: (j) => cfg.tip(ids[j]), onPick: cfg.onPick ? (j) => cfg.onPick(ids[j]) : undefined }));
}
function perAtalho() { if (!S.periodo) return 12; const [de, ate] = perIntervalo(); const n = ate - de + 1; return ate === perRef() && n !== 12 && PER_ATALHOS.some((a) => a[0] === n) ? n : 0; }
function perRotulo(curto) {
  const n = perAtalho(); if (n) return curto && n < 12 ? n + ' meses' : PER_ATALHOS.find((a) => a[0] === n)[1];
  const [de, ate] = perIntervalo(); return de === ate ? mesNome(de) : MES[de] + (curto ? '–' : ' a ') + MES[ate];
}
// "nos últimos 3 meses", "de março a maio", "em abril" ou "em 2026"
function perFrase() { const n = perAtalho(); if (n === 12) return 'em ' + S.year; if (n) return 'nos ' + PER_ATALHOS.find((a) => a[0] === n)[1].toLowerCase(); const [de, ate] = perIntervalo(); return de === ate ? 'em ' + MES_LONGO[de] : 'de ' + MES_LONGO[de] + ' a ' + MES_LONGO[ate]; }
const I_CAL = ic('<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>');
function periodoHtml() {
  const [de, ate] = perIntervalo(); const ini = S.perIni; const at = perAtalho(); const ref = perRef();
  const meses = MES.map((m, i) => {
    const c = ini != null ? (i === ini ? ' ponta' : '') : (S.periodo && i >= de && i <= ate ? (i === de || i === ate ? ' ponta' : ' in') : '');
    return `<button class="per-m${c}${S.year === NOW_Y && i > NOW_M ? ' fut' : ''}" data-act="per-mes" data-m="${i}" aria-pressed="${c ? 'true' : 'false'}" aria-label="${mesNome(i)}">${m}</button>`;
  }).join('');
  const dica = ini != null ? `Início em ${MES_LONGO[ini]}.` : 'Toque no mês inicial e depois no final.' + (S.year === NOW_Y && ref < 11 ? ` Os meses depois de ${MES_LONGO[ref]} ainda não aconteceram.` : '');
  return `<div class="year per"><button class="year-pill per-pill" data-act="per-toggle" aria-haspopup="true" aria-expanded="${!!S.perOpen}" aria-label="Período da Visão geral: ${esc(perRotulo())}">${I_CAL}<span>${esc(perRotulo(true))}</span>${I.down}</button>
    ${S.perOpen ? `<div class="popover per-pop" role="dialog" aria-label="Escolher o período"><div class="pop-t">Mostrar a Visão geral de</div>
      <div class="yr-list">${PER_ATALHOS.map((a) => `<button class="yr-opt${at === a[0] && ini == null ? ' on' : ''}" data-act="per-atalho" data-n="${a[0]}">${a[1]}</button>`).join('')}</div>
      <div class="pop-t">${ini != null ? 'Agora toque no mês final' : 'Ou escolha no calendário de ' + S.year}</div><div class="per-cal">${meses}</div>
      <p class="per-dica keep">${dica}</p></div>` : ''}</div>`;
}
function viewGeral() {
  const p = S.plan; const pr = S.profile; const nome = (pr.apelido || (pr.nome || '').split(' ')[0]) || 'por aqui';
  const cab = `<div class="welcome"><div><p class="greet">${esc(voz('saudacao', { saud: saudacaoHora(), nome }))}</p><h1 class="wh">${esc(voz('titulo', { ano: p.year }))}</h1></div>${yearControl(periodoHtml())}</div>`;
  return cab + widgetsHtml(); // widgets na ordem e no tamanho escolhidos pelo cliente (widgets.js)
}

/* Patrimônio estimado: linha do patrimônio (bolinha em cada mês, mês atual em destaque, ritmo da meta opcional)
   ou barras dos aportes de cada mês contra a meta mensal. Os botões do card trocam só o gráfico, sem render(). */
function drawPatr() {
  const el = $('#d-patr'); if (!el) return; hideTip(); const C = S.C; const meta = C.metaAno > 0 ? C.metaAno : 0;
  const [de, ate] = perIntervalo(); const ids = []; for (let i = de; i <= ate; i++) ids.push(i); const so = (arr) => ids.map((i) => arr[i]);
  const curAbs = S.year === NOW_Y ? NOW_M : -1; const cur = curAbs >= de && curAbs <= ate ? curAbs - de : -1;
  const base = C.patrimonioBase; const ritmo = MES.map((_, i) => base + (meta * (i + 1)) / 12); const comMeta = !!(S.patrMeta && meta);
  const varia = (i) => { const ant = i ? C.patrimonio[i - 1] : base; const d = C.patrimonio[i] - ant; return Math.abs(d) < 0.5 ? 'sem variação' : `${d > 0 ? '+' : '−'} ${brl0(Math.abs(d))}${ant > 0 ? ` (${d > 0 ? '+' : '−'}${pct(Math.abs(d) / ant)})` : ''}`; };
  if (S.patrModo === 'aportes') {
    chartBars(el, { labels: so(MES), cur, height: 170, aria: 'Aportes de cada mês comparados com a meta mensal', bars: [{ color: 'var(--c1)', values: so(C.aplicado) }], marks: meta ? [{ color: 'var(--c4)', values: ids.map(() => meta / 12) }] : [],
      tip: (j) => { const i = ids[j]; return `<b>${mesNome(i)}</b><br>Aporte: ${brl0(C.aplicado[i])}${meta ? `<br>Meta do mês: ${brl0(meta / 12)}` : ''}`; } });
    return;
  }
  const series = [{ color: 'var(--c1)', values: so(C.patrimonio), area: true, w: 3 }]; if (comMeta) series.push({ color: 'var(--c4)', values: so(ritmo), dashed: true, w: 2 });
  chartLine(el, { height: 170, suave: true, brilho: true, pontos: true, pontoFinal: true, teclado: true, cur, zoom: Math.min(...so(C.patrimonio)) > 0, labels: so(MES), aria: 'Evolução do patrimônio no período. Use as setas para percorrer os meses.', series,
    tip: (j) => { const i = ids[j]; const dif = C.patrimonio[i] - ritmo[i]; return `<b>${mesNome(i)}${i === curAbs ? ' · hoje' : ''}</b><br>Patrimônio: ${brl0(C.patrimonio[i])}<br>No mês: ${varia(i)}<br>Aportes no mês: ${brl0(C.aplicado[i])}${comMeta ? `<br>Ritmo da meta: ${brl0(ritmo[i])} (${Math.abs(dif) < 0.5 ? 'em dia' : (dif > 0 ? 'acima ' : 'abaixo ') + brl0(Math.abs(dif))})` : ''}`; } });
}
function drawDashboard() {
  if (S.screen !== 'app' || S.view !== 'geral' || !S.plan) return;
  const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1; const sobra = C.investAlocado.map((v) => Math.max(0, v));
  if (temRecurso('patrimonio')) drawPatr();
  else { const [de, ate] = perIntervalo(); const ids = []; for (let i = de; i <= ate; i++) ids.push(i); chartBars($('#d-patr'), { labels: ids.map((i) => MES[i]), cur: cur >= de && cur <= ate ? cur - de : -1, height: 200, aria: 'Sobra para investir por mês', bars: [{ color: 'var(--c1)', values: ids.map((i) => C.investAlocado[i]) }], tip: (j) => { const i = ids[j]; return `<b>${MES[i]}</b><br>Entradas: ${brl0(C.receita[i])}<br>Gastos: ${brl0(C.despesas[i])}<br>Sobra: ${brl0(C.investAlocado[i])}`; } }); }
  chartBarsPer($('#d-flow'), { labels: MES, cur, aria: 'Gastos e sobra para investir por mês', bars: [{ color: 'var(--c2)', values: C.despesas }, { color: 'var(--c1)', values: sobra }], tip: (i) => `<b>${MES[i]}</b><br>Entradas: ${brl0(C.receita[i])}<br>Gastos: ${brl0(C.despesas[i])}<br>Sobra: ${brl0(C.investAlocado[i])}` });
  drawPainel2(); drawWidgetsExtras();
  popSync(); // simulador ou histórico aberto na janela: acompanha os dados redesenhados
  if (temRecurso('investimentos')) { const comp = composicao(); const tot = comp.reduce((a, b) => a + b.value, 0); const palette = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)']; if (tot > 0) chartDonut($('#d-donut'), { aria: 'Composição da carteira por classe de ativo', title: brl0(tot), sub: 'em ativos', items: comp.map((c, i) => ({ label: c.label, value: c.value, color: palette[i % 6] })) }); }
}

/* ---------- Simulador "E se?" do objetivo (juros compostos) ----------
   Estado só da sessão em S.sim = { extra, taxa }. Mover um controle não redesenha a página:
   simAtualizar() troca só os textos, o preenchimento dos controles e o gráfico (no máximo uma vez por quadro). */
const SIM_TAXA = { min: 2, max: 20, passo: 0.5 };
const SIM_LIMITE = 600; // 50 anos
function simBase() {
  const pj = projecaoObjetivo(); const taxa = Math.min(SIM_TAXA.max, Math.max(SIM_TAXA.min, +S.profile.retornoAnual || 10));
  return { pj, aporte: Math.max(0, pj.aporte || 0), taxa, alvo: +pj.ob.valor || 0, patr: pj.patr };
}
function simEstado(b) {
  const oid = (b.pj.ob && b.pj.ob.id) || '';
  if (!S.sim || S.sim.ano !== S.year || (S.sim.obj || '') !== oid) S.sim = { extra: 0, taxa: b.taxa, ano: S.year, obj: oid };
  if (S.sim.taxa == null) S.sim.taxa = b.taxa;
  return S.sim;
}
const simMaxExtra = (ap) => Math.ceil(Math.max(2000, ap * 2) / 500) * 500;
const simPasso = (max) => (max <= 5000 ? 50 : max <= 20000 ? 100 : 500);
function duracao(m) {
  if (m == null) return null; if (m <= 0) return 'agora';
  const a = Math.floor(m / 12); const r = m % 12;
  const pa = a ? `${a} ${a === 1 ? 'ano' : 'anos'}` : ''; const pm = r ? `${r} ${r === 1 ? 'mês' : 'meses'}` : '';
  return pa && pm ? `${pa} e ${pm}` : pa || pm;
}
const mesAnoDe = (m) => { const i = NOW_Y * 12 + NOW_M + m; return MES[i % 12].toLowerCase() + '/' + Math.floor(i / 12); };
const fmtTaxa = (v) => (+v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
const fracDe = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min))).toFixed(4);
function simCalc(b, st) {
  return E.simularObjetivo({ patrimonio: b.patr, aporte: b.aporte, extra: st.extra, retornoBase: b.taxa, retorno: st.taxa, alvo: b.alvo, limite: SIM_LIMITE });
}

// ícone do "E se?": o botão fica no card do objetivo (objetivos.js), ao lado da seta para Meus objetivos
const I_SIM = ic('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>');
const simFechar = `<button class="icon-btn" data-act="sim-toggle" aria-label="Fechar o simulador">${I.x}</button>`;
function simHtml() {
  if (!temRecurso('patrimonio') || !S.simAberto) return '';
  const b = simBase(); const nome = esc(objNomeDe(b.pj.ob || {}));
  const aviso = (txt, botao) => `<section class="card sim" id="sim" aria-labelledby="sim-t"><div class="c-h"><div><h3 id="sim-t">Simulador do objetivo${b.alvo > 0 ? ' · ' + nome : ''}</h3></div>${simFechar}</div><div class="sim-vazio"><p>${txt}</p>${botao || ''}</div></section>`;
  if (!(b.alvo > 0)) return aviso('Defina o valor de um objetivo para simular o prazo com outros aportes e taxas.', '<button class="btn primary" data-act="objetivo-definir">Definir meus objetivos</button>');
  if (!(b.pj.fatia > 0)) return aviso(`“${nome}” ainda não recebe parte do patrimônio nem do aporte. Dê uma fatia a ele para simular.`, '<button class="btn" data-act="objetivos-abrir">Ajustar fatias</button>');
  if (b.patr >= b.alvo) return aviso(`“${nome}” já está coberto. Escolha outro objetivo no card Objetivos para simular.`);
  const st = simEstado(b); const max = simMaxExtra(b.aporte); const passo = simPasso(max); if (st.extra > max) st.extra = max;
  const presets = b.aporte > 0 ? [[0.1, '+10%'], [0.25, '+25%'], [0.5, '+50%'], [1, 'Dobrar']].map(([f, l]) => { const v = Math.min(max, Math.round((b.aporte * f) / passo) * passo); return `<button type="button" class="np-chip" data-act="sim-preset" data-v="${v}" aria-pressed="${st.extra === v}">${l}</button>`; }).join('') : '';
  return `<section class="card sim" id="sim" aria-labelledby="sim-t">
    <div class="c-h"><div><h3 id="sim-t">Simulador do objetivo · ${esc(objNomeDe(b.pj.ob))}</h3><p class="sim-sub">Mova os controles e veja o prazo de “${esc(objNomeDe(b.pj.ob))}” mudar na hora. Juros compostos, mês a mês.</p></div><div class="sim-hacts"><button class="btn sm" data-act="sim-reset" id="sim-reset" hidden>Voltar ao cenário atual</button>${simFechar}</div></div>
    <div class="sim-grid">
      <div class="sim-ctrl">
        <div class="sld">
          <div class="sld-h"><label for="sim-extra">Aporte extra por mês</label><output id="sim-extra-o" for="sim-extra"></output></div>
          <input type="range" id="sim-extra" data-sim="extra" min="0" max="${max}" step="${passo}" value="${st.extra}">
          <div class="sld-f"><span>Hoje: ${brl0(b.aporte)} por mês${b.pj.fatia < 1 ? ` (${pct(b.pj.fatia)} do seu aporte)` : ''}</span><span>Total: <b id="sim-ap-tot"></b></span></div>
          ${presets ? `<div class="sim-presets" role="group" aria-label="Atalhos de aporte extra">${presets}</div>` : ''}
        </div>
        <div class="sld">
          <div class="sld-h"><label for="sim-taxa">Retorno anual</label><output id="sim-taxa-o" for="sim-taxa"></output></div>
          <div class="sld-wrap"><input type="range" id="sim-taxa" data-sim="taxa" min="${SIM_TAXA.min}" max="${SIM_TAXA.max}" step="${SIM_TAXA.passo}" value="${st.taxa}"><span class="sld-base" style="--f:${fracDe(b.taxa, SIM_TAXA.min, SIM_TAXA.max)}" title="Taxa do seu perfil"></span></div>
          <div class="sld-f"><span>Seu perfil: ${fmtTaxa(b.taxa)} ao ano</span><span id="sim-taxa-m"></span></div>
        </div>
      </div>
      <div class="sim-res" aria-live="polite">
        <div class="sim-top">
          <div class="sim-prazo"><span class="c-k">Novo prazo</span><b id="sim-prazo"></b><small id="sim-data"></small></div>
          <div class="sim-delta" id="sim-delta"><i aria-hidden="true"></i><span></span></div>
        </div>
        <div class="chart" id="sim-chart"></div>
        <div class="legend sim-leg"><span><i style="background:var(--accent)"></i>Simulação</span><span><i class="ln" style="border-color:var(--ink-3)"></i>Cenário atual</span><span><i class="ln" style="border-color:var(--c4)"></i>Objetivo</span></div>
        <p class="cap" id="sim-juros"></p>
        <div class="btn-row"><button class="btn" data-act="sim-aplicar" id="sim-aplicar" hidden></button></div><p class="sim-nota" id="sim-nota" hidden>Este objetivo recebe ${pct(b.pj.fatia)} do seu aporte. Para colocar o valor extra só nele, aumente a fatia dele em <button class="lnk strong" data-act="objetivos-abrir">Meus objetivos</button>.</p>
      </div>
    </div>
    <p class="cap disc sim-disc">Simulação hipotética. Não é promessa de rentabilidade.</p>
    <p class="cap sim-aviso">O retorno é constante e hipotético, sem inflação, impostos ou taxas: use para comparar cenários e converse com o ${esc(primeiroNome())} antes de mudar a estratégia.</p>
  </section>`;
}

// Atualiza textos, controles e gráfico a partir de S.sim (chamado no desenho da tela e a cada movimento dos controles)
function simAtualizar() {
  const card = document.getElementById('sim'); if (!card || !document.getElementById('sim-extra')) return;
  const b = simBase(); const st = simEstado(b); const R = simCalc(b, st);
  const ex = document.getElementById('sim-extra'); const tx = document.getElementById('sim-taxa');
  const totAp = b.aporte + st.extra; const rel = b.aporte > 0 && st.extra > 0 ? ` (+${pct(st.extra / b.aporte)})` : '';
  ex.style.setProperty('--f', fracDe(st.extra, 0, +ex.max)); tx.style.setProperty('--f', fracDe(st.taxa, SIM_TAXA.min, SIM_TAXA.max));
  const oEx = st.extra > 0 ? `+ ${brl0(st.extra)}${rel}` : 'Nenhum'; const oTx = `${fmtTaxa(st.taxa)} ao ano`;
  $('#sim-extra-o').textContent = oEx; ex.setAttribute('aria-valuetext', oEx);
  $('#sim-taxa-o').textContent = oTx; tx.setAttribute('aria-valuetext', oTx);
  $('#sim-ap-tot').textContent = brl0(totAp) + ' por mês';
  const am = (Math.pow(1 + st.taxa / 100, 1 / 12) - 1) * 100; $('#sim-taxa-m').textContent = `≈ ${am.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% ao mês`;
  // prazo e diferença
  const s = R.sim; const bm = R.base.meses;
  $('#sim-prazo').textContent = s.meses == null ? `Mais de ${SIM_LIMITE / 12} anos` : duracao(s.meses);
  $('#sim-data').textContent = s.meses == null ? 'Com este cenário, a meta não chega em 50 anos.' : `Previsto para ${mesAnoDe(s.meses)}`;
  const mudou = st.extra > 0 || Math.abs(st.taxa - b.taxa) > 1e-9;
  let tom = 'neu'; let txt;
  if (bm == null && s.meses == null) { tom = 'neg'; txt = 'Nem neste cenário a meta chega em 50 anos. Teste um aporte maior.'; }
  else if (bm == null) { tom = 'pos'; txt = `Neste cenário, a meta passa a ser alcançável em ${duracao(s.meses)}.`; }
  else if (s.meses == null) { tom = 'neg'; txt = 'Neste cenário, a meta deixa de ser atingida em 50 anos.'; }
  else if (R.diferenca > 0) { tom = 'pos'; txt = `Você antecipa sua meta em ${duracao(R.diferenca)}.`; }
  else if (R.diferenca < 0) { tom = 'neg'; txt = `Sua meta atrasa ${duracao(-R.diferenca)}.`; }
  else txt = mudou ? 'O prazo não muda neste cenário.' : `Este é o seu cenário atual: ${duracao(bm)}. Mova os controles para testar.`;
  const d = $('#sim-delta'); d.className = 'sim-delta ' + tom; d.querySelector('span').textContent = txt;
  // juros compostos: de onde vem o valor da meta
  const j = $('#sim-juros');
  if (s.meses > 0 && s.final > 0) { const fj = Math.max(0, s.juros) / s.final; j.textContent = `Na data da meta, ${brl0(s.aportado)} terão saído do seu bolso (patrimônio de hoje mais os aportes) e ${brl0(Math.max(0, s.juros))} virão dos juros compostos: ${pct(fj)} do total.`; }
  else j.textContent = '';
  // ações
  $('#sim-reset').hidden = !mudou;
  const so = b.pj.fatia >= 1; const nt = $('#sim-nota'); if (nt) nt.hidden = !(st.extra > 0 && !so);
  const ap = $('#sim-aplicar'); ap.hidden = !(st.extra > 0 && so); ap.textContent = `Usar ${brl0(totAp)} como minha meta de aporte`;
  card.querySelectorAll('[data-act="sim-preset"]').forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.v === st.extra)));
  simGrafico(R);
}
function simGrafico(R) {
  const el = document.getElementById('sim-chart'); if (!el) return;
  const labels = R.serieSim.map((_, k) => String(NOW_Y + k));
  chartLine(el, { labels, height: window.innerWidth < 640 ? 190 : 220, goal: R.alvo, goalLabel: 'Objetivo', goalLeft: true,
    aria: 'Projeção do patrimônio no cenário atual e na simulação, com a linha do objetivo',
    series: [{ color: 'var(--ink-3)', values: R.serieBase, w: 2, dashed: true }, { color: 'var(--accent)', values: R.serieSim, area: true }],
    tip: (i) => `<b>${labels[i]}</b><br>Simulação: ${brl0(R.serieSim[i])}<br>Cenário atual: ${brl0(R.serieBase[i])}` });
}
let simRaf = 0;
function simInput(t) {
  const st = simEstado(simBase());
  st[t.dataset.sim] = +t.value;
  if (!simRaf) simRaf = requestAnimationFrame(() => { simRaf = 0; simAtualizar(); });
}
function simAcao(act, ds) {
  switch (act) {
    case 'sim-preset': { const st = simEstado(simBase()); st.extra = +ds.v; const ex = document.getElementById('sim-extra'); if (ex) ex.value = st.extra; simAtualizar(); return true; }
    case 'sim-reset': { const b = simBase(); S.sim = { extra: 0, taxa: b.taxa, ano: S.year, obj: (b.pj.ob && b.pj.ob.id) || '' }; const ex = document.getElementById('sim-extra'); const tx = document.getElementById('sim-taxa'); if (ex) ex.value = 0; if (tx) tx.value = b.taxa; simAtualizar(); return true; }
    case 'sim-toggle': case 'sim-ir': popAlternar('sim', act === 'sim-ir'); return true;
    case 'sim-aplicar': {
      const b = simBase(); const st = simEstado(b); const antes = S.plan.settings.metaAporte; const novo = Math.round(b.aporte + st.extra);
      S.plan.settings.metaAporte = novo; S.sim = { extra: 0, taxa: st.taxa, ano: S.year, obj: st.obj }; touch('plan'); render();
      toastAcao(`Meta de aporte atualizada para ${brl0(novo)} por mês.`, 'Desfazer', () => { S.plan.settings.metaAporte = antes; touch('plan'); render(); });
      return true;
    }
    default: return false;
  }
}

/* ---------- Linha do tempo multi-anos ("Evolução histórica") ----------
   Discreta: só aparece quando o cliente toca em "Histórico" no card principal. Estado da sessão em S.hist = { aberto, aba }.
   Os números vêm de E.historico (engine.js), que encadeia todos os anos de S.plans. */
const I_HIST = ic('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5v4h4"/><path d="M12 7.5V12l3 2"/>');
const histEstado = () => S.hist || (S.hist = { aberto: false, aba: temRecurso('patrimonio') ? 'patrimonio' : 'fluxo' });
const histBtn = () => `<button class="hist-btn" data-act="hist-toggle" aria-label="Histórico de todos os anos" title="Histórico de todos os anos" aria-expanded="${!!histEstado().aberto}" aria-controls="hist">${I_HIST}<span>Histórico</span></button>`;
// a consolidação de todos os anos é o cálculo mais caro da Visão geral: guardado durante cada desenho da tela
let HIST_MEMO = { seq: -1, v: null };
function histDados() {
  if (HIST_MEMO.seq === S.renderSeq && HIST_MEMO.v) return HIST_MEMO.v;
  HIST_MEMO = { seq: S.renderSeq, v: E.historico(S.plans, { patrimonioInicial: S.profile.patrimonioInicial, ancora: S.profile.patrimonioAno, hoje: new Date() }) };
  return HIST_MEMO.v;
}
function histAbas() {
  const inv = temRecurso('patrimonio');
  return (inv ? [['patrimonio', 'Patrimônio']] : []).concat([['fluxo', 'Renda e gastos']], inv ? [['invest', 'Aportes e proventos']] : []);
}
const histLeg = (aba) => (aba === 'patrimonio' ? '<ul class="leg"><li><i style="background:var(--accent)"></i>Patrimônio mês a mês</li><li><i class="hy-dot"></i>Fim de cada ano</li></ul>'
  : aba === 'fluxo' ? legenda([['var(--c1)', 'Entradas'], ['var(--c2)', 'Gastos'], ['var(--pos)', 'Sobra']]) : legenda([['var(--accent)', 'Aportes'], ['var(--c3)', 'Proventos']]));
const varTxt = (v, custo) => (v == null ? '' : `<small class="${(v >= 0) !== !!custo ? 'up' : 'down'}">${v >= 0 ? '+' : '−'}${pct(Math.abs(v))}</small>`);

function histHtml() {
  const st = histEstado(); if (!st.aberto) return '';
  const H = histDados(); const inv = temRecurso('patrimonio');
  const titulo = inv ? 'Evolução histórica do patrimônio' : 'Evolução histórica';
  const fechar = `<button class="icon-btn" data-act="hist-toggle" aria-label="Fechar o histórico">${I.x}</button>`;
  if (!H.temHistorico) {
    const ano0 = H.anos.length ? H.anos[0].ano : NOW_Y; const anoAnt = ano0 - 1;
    const pts = [anoAnt - 1, anoAnt, ano0, ano0 + 1].map((a) => `<li class="${a === ano0 ? 'on' : a < ano0 ? 'pas' : 'fut'}"><i></i><span>${a}</span></li>`).join('');
    return `<section class="card hist" id="hist" aria-labelledby="hist-t"><div class="c-h"><div><h3 id="hist-t">${titulo}</h3><p class="sim-sub">Todos os seus anos de planejamento, em uma linha só.</p></div>${fechar}</div>
      <div class="hist-vazio"><ol class="hist-tl" aria-hidden="true">${pts}</ol>
        <div><h4>Sua linha do tempo começa em ${ano0}</h4><p>Cada ano que você planejar se conecta aqui: o patrimônio de dezembro vira o ponto de partida do ano seguinte, e você passa a comparar renda, gastos e aportes ano a ano. Já tem números de ${anoAnt}? Registre o ano e ele entra no início da linha.</p>
        <div class="btn-row"><button class="btn" data-act="hist-ano-anterior" data-ano="${anoAnt}">Registrar ${anoAnt}</button></div></div></div></section>`;
  }
  const T = H.totais; const a0 = H.anos[0]; const aN = H.anos[H.anos.length - 1]; const D = H.destaques;
  const k = [];
  if (inv) k.push(kpi('Patrimônio hoje', `<span class="num">${brl0(T.patrimonioAtual)}</span>`, T.crescimentoPct != null ? `${T.crescimento >= 0 ? '+' : '−'}${brl0(Math.abs(T.crescimento))} (${T.crescimentoPct >= 0 ? '+' : '−'}${pct(Math.abs(T.crescimentoPct))}) desde o início de ${a0.ano}.` : `Desde o início de ${a0.ano}.`));
  k.push(kpi('Entradas no período', `<span class="num">${brl0(T.entradas)}</span>`, `${brl0(T.entradas / Math.max(1, T.meses))} por mês, em média, em ${T.meses} meses.`));
  k.push(kpi('Gastos no período', `<span class="num">${brl0(T.gastos)}</span>`, T.poupanca != null ? `Você guardou ${pct(T.poupanca)} de tudo o que entrou.` : 'Sem entradas registradas.'));
  if (inv) k.push(kpi('Investido do próprio bolso', `<span class="num">${brl0(T.aportes)}</span>`, T.proventos > 0 ? `Mais ${brl0(T.proventos)} recebidos em proventos.` : 'Nenhum provento registrado ainda.'));
  else k.push(kpi('Sobra acumulada', `<span class="num">${brl0(T.sobra)}</span>`, 'Entradas menos gastos, somando todos os anos.'));
  const abas = histAbas(); if (!abas.some((a) => a[0] === st.aba)) st.aba = abas[0][0];
  const tabs = abas.length > 1 ? `<div class="np-chips hist-tabs" role="tablist" aria-label="O que mostrar no gráfico">${abas.map(([id, l]) => `<button class="np-chip" role="tab" data-act="hist-aba" data-aba="${id}" aria-selected="${st.aba === id}" aria-pressed="${st.aba === id}">${l}</button>`).join('')}</div>` : '';
  const leg = histLeg(st.aba);
  // estudos: crescimento da renda e dos gastos, melhor ano, lacunas
  const ins = [];
  if (D.rendaCresc && D.gastosCresc) { const r = D.rendaCresc.pct; const g = D.gastosCresc.pct; ins.push([r >= g ? 'ok' : 'warn', `De ${D.rendaCresc.de} para ${D.rendaCresc.para}, sua renda ${r >= 0 ? 'cresceu' : 'caiu'} <b>${pct(Math.abs(r))}</b> e seus gastos ${g >= 0 ? 'cresceram' : 'caíram'} <b>${pct(Math.abs(g))}</b>. ${r >= g ? 'A renda andou mais rápido que o custo de vida: é isso que abre espaço para investir.' : 'Os gastos andaram mais rápido que a renda. Vale olhar o que entrou no custo fixo.'}`]); }
  if (D.melhorPoupanca && H.anos.length > 1) ins.push(['info', `Seu melhor ano de poupança foi <b>${D.melhorPoupanca.ano}</b>${D.melhorPoupanca.parcial ? ' (até agora)' : ''}, guardando ${pct(D.melhorPoupanca.v)} do que entrou.`]);
  if (inv && D.maiorAporte) ins.push(['info', `O ano com mais dinheiro novo investido foi <b>${D.maiorAporte.ano}</b>${D.maiorAporte.parcial ? ' (até agora)' : ''}: ${brl0(D.maiorAporte.v)}.`]);
  if (D.lacunas.length) ins.push(['warn', `Há ${D.lacunas.length === 1 ? 'um ano' : 'anos'} sem planejamento antes de ${D.lacunas.join(', ')}. A linha segue do último ano registrado; cadastre o ano que falta para completar a história.`]);
  if (H.anos.some((l) => l.ajuste)) ins.push(['info', `Em ${H.anos.filter((l) => l.ajuste).map((l) => l.ano).join(', ')}, o patrimônio inicial foi definido à mão, por isso a curva pode dar um salto na virada do ano.`]);
  const linhas = H.anos.map((l) => `<tr${l.parcial ? ' class="parc"' : ''}><td class="lab">${l.ano}${l.parcial ? '*' : ''}</td><td class="num">${brl0(l.entradas)}${varTxt(l.entradasVar)}</td><td class="num">${brl0(l.gastos)}${varTxt(l.gastosVar, true)}</td><td class="num ${l.sobra < 0 ? 'neg' : ''}">${brl0(l.sobra)}</td><td class="num">${pct(l.poupanca)}</td>${inv ? `<td class="num">${brl0(l.aportes)}</td><td class="num">${brl0(l.proventos)}</td><td class="num"><b>${brl0(l.patrimonioFim)}</b></td>` : ''}</tr>`).join('');
  return `<section class="card hist" id="hist" aria-labelledby="hist-t">
    <div class="c-h"><div><h3 id="hist-t">${titulo}</h3><p class="sim-sub">${a0.ano} a ${aN.ano} · ${H.anos.length} anos consolidados${inv ? '. Patrimônio a custo: o valor do diagnóstico ajustado pelos aportes de cada ano, sem a variação de mercado' : ''}.</p></div>${fechar}</div>
    <div class="kpis hist-kpis">${k.join('')}</div>
    <div class="hist-graf"><div class="hist-gh">${tabs}${leg}</div><div class="chart" id="hist-chart"></div></div>
    ${ins.length ? `<ul class="insights hist-ins">${ins.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul>` : ''}
    <div class="tablewrap hist-tw"><table class="mini hist-tab"><thead><tr><th>Ano</th><th class="num">Entradas</th><th class="num">Gastos</th><th class="num">Sobra</th><th class="num">Poupança</th>${inv ? '<th class="num">Aportes</th><th class="num">Proventos</th><th class="num">Patrimônio no fim</th>' : ''}</tr></thead><tbody>${linhas}</tbody></table></div>
    ${aN.parcial ? `<p class="cap">* ${aN.ano} em andamento: valores até ${MES_LONGO[aN.meses - 1]}. As variações percentuais comparam só anos completos.</p>` : ''}
  </section>`;
}
function drawHistorico() {
  const el = document.getElementById('hist-chart'); if (!el) return;
  const st = histEstado(); const H = histDados(); if (!H.temHistorico) return;
  const alt = window.innerWidth < 640 ? 210 : 260;
  if (st.aba === 'patrimonio') {
    const P = H.serie.map((p) => ({ ano: p.ano, mes: p.mes, v: p.patrimonio }));
    chartHistorico(el, { pontos: P, height: alt, aria: `Patrimônio mês a mês de ${H.anos[0].ano} a ${H.anos[H.anos.length - 1].ano}`, rotuloPonto: (v) => tickFmt(v),
      tip: (i) => { const p = H.serie[i]; return `<b>${MES_LONGO[p.mes]} de ${p.ano}</b><br>Patrimônio: ${brl0(p.patrimonio)}<br>Entradas: ${brl0(p.entradas)}<br>Gastos: ${brl0(p.gastos)}`; } });
  } else {
    const labels = H.anos.map((l) => String(l.ano)); const parcial = H.anos.findIndex((l) => l.parcial);
    const series = st.aba === 'fluxo'
      ? [{ nome: 'Entradas', color: 'var(--c1)', values: H.anos.map((l) => l.entradas) }, { nome: 'Gastos', color: 'var(--c2)', values: H.anos.map((l) => l.gastos) }, { nome: 'Sobra', color: 'var(--pos)', values: H.anos.map((l) => l.sobra) }]
      : [{ nome: 'Aportes', color: 'var(--accent)', values: H.anos.map((l) => l.aportes) }, { nome: 'Proventos', color: 'var(--c3)', values: H.anos.map((l) => l.proventos) }];
    chartAnos(el, { labels, series, height: alt, parcial: parcial < 0 ? null : parcial, aria: st.aba === 'fluxo' ? 'Entradas, gastos e sobra por ano' : 'Aportes e proventos por ano',
      tip: (i) => { const l = H.anos[i]; return `<b>${l.ano}${l.parcial ? ` (até ${MES_LONGO[l.meses - 1]})` : ''}</b><br>` + series.map((s) => `${s.nome}: ${brl0(s.values[i])}`).join('<br>') + (st.aba === 'fluxo' && l.poupanca != null ? `<br>Poupança: ${pct(l.poupanca)}` : ''); } });
  }
}
function histAcao(act, ds) {
  const st = histEstado();
  switch (act) {
    case 'hist-toggle': popAlternar('hist'); return true;
    case 'hist-aba': {
      st.aba = ds.aba; document.querySelectorAll('.hist-tabs .np-chip').forEach((b) => { const on = b.dataset.aba === st.aba; b.setAttribute('aria-selected', on); b.setAttribute('aria-pressed', on); });
      const lg = document.querySelector('.hist-gh .leg'); if (lg) lg.outerHTML = histLeg(st.aba);
      drawHistorico(); return true;
    }
    case 'hist-ano-anterior': {
      const ano = +ds.ano; if (!anoValido(ano) || S.plans[ano]) return true;
      const base = S.plans[ano + 1] || S.plan; createPlan(ano, base);
      toast(`Planejamento de ${ano} criado com a mesma estrutura. Preencha os valores e ele entra na linha do tempo.`);
      return true;
    }
    default: return false;
  }
}

/* ---------- Segundo gráfico da Visão geral (no lugar de "Orçamento e gastos") ----------
   Planos com investimentos: constância dos aportes contra a meta mensal. Plano Organização: gastos fixos e variáveis. */
function painel2Dados() {
  const C = S.C; const ult = S.year === NOW_Y ? NOW_M : S.year < NOW_Y ? 11 : -1; const meta = metaDoAporte();
  const ap = C.aportes.map((v) => Math.max(0, +v || 0)); const [de, ate] = perIntervalo(); const fim = Math.min(ate, ult); const meses = Math.max(0, fim - de + 1);
  const trecho = ap.slice(de, de + meses); const dentro = trecho.map((v) => meta > 0 && v >= meta - 0.5);
  let seq = 0; for (let i = dentro.length - 1; i >= 0 && dentro[i]; i--) seq++;
  const comAporte = trecho.filter((v) => v > 0).length; const media = meses > 0 ? trecho.reduce((a, v) => a + v, 0) / meses : 0;
  return { ap, meta, meses, naMeta: dentro.filter(Boolean).length, seq, comAporte, media };
}
function painel2Html() {
  if (temRecurso('investimentos')) {
    const D = painel2Dados();
    const st = (k, v) => `<div class="p2-st"><small>${k}</small><b>${v}</b></div>`;
    const stats = D.meses <= 0 ? '' : D.meta > 0
      ? `<div class="p2-sts">${st('Meses na meta', `${D.naMeta} de ${D.meses}`)}${st('Sequência atual', D.seq ? `${D.seq} ${D.seq === 1 ? 'mês' : 'meses'}` : '–')}${st('Média por mês', brl0(D.media))}</div>`
      : `<div class="p2-sts">${st('Meses com aporte', `${D.comAporte} de ${D.meses}`)}${st('Média por mês', brl0(D.media))}<div class="p2-st"><small>Meta mensal</small><button class="lnk strong" data-act="admin-open">Definir</button></div></div>`;
    return `<section class="card"><div class="c-h"><h3>Constância dos aportes</h3><div class="legend"><span><i style="background:var(--accent)"></i>Aporte</span>${D.meta > 0 ? '<span><i class="mk" style="background:var(--c4)"></i>Meta</span>' : ''}</div></div>
      <p class="cap">Dinheiro novo investido em cada mês (sem contar proventos reinvestidos), comparado com a sua meta mensal. Constância pesa mais que o valor de um mês isolado.</p>
      <div class="chart" id="d-p2"></div>${stats}</section>`;
  }
  const cats = (S.plan.catsDesp || []).filter((c) => E.sum(S.C.despCat[c.id] || []) > 0);
  const tot = cats.reduce((a, c) => a + E.sum(S.C.despCat[c.id]), 0); const fixa = cats.find((c) => c.id === 'fixa');
  const pf = fixa && tot > 0 ? E.sum(S.C.despCat.fixa) / tot : null; const cores = ['var(--c2)', 'var(--c4)', 'var(--c3)', 'var(--c5)', 'var(--c6)', 'var(--c1)'];
  return `<section class="card"><div class="c-h"><h3>Gastos fixos e variáveis</h3><div class="legend">${cats.map((c, i) => `<span><i style="background:${cores[i % 6]}"></i>${esc(c.nome)}</span>`).join('')}</div></div>
    <p class="cap">Gastos fixos se repetem todo mês e são os mais difíceis de cortar; os variáveis mostram onde há espaço para ajustar.</p>
    <div class="chart" id="d-p2"></div>${pf != null ? `<div class="p2-sts"><div class="p2-st"><small>Peso dos fixos</small><b>${pct(pf)}</b></div><div class="p2-st"><small>Referência</small><b>até 50% da renda</b></div></div>` : ''}</section>`;
}
function drawPainel2() {
  const el = $('#d-p2'); if (!el) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (temRecurso('investimentos')) {
    const D = painel2Dados();
    chartBarsPer(el, { labels: MES, cur, height: 190, aria: 'Aportes de cada mês comparados com a meta mensal', bars: [{ color: 'var(--accent)', values: D.ap }], marks: D.meta > 0 ? [{ color: 'var(--c4)', values: MES.map(() => D.meta) }] : [],
      tip: (i) => `<b>${MES_LONGO[i][0].toUpperCase() + MES_LONGO[i].slice(1)}</b><br>Aporte: ${brl0(D.ap[i])}${D.meta > 0 ? `<br>Meta: ${brl0(D.meta)}<br>${D.ap[i] >= D.meta - 0.5 ? 'Na meta' : i <= (S.year === NOW_Y ? NOW_M : 11) ? `Faltaram ${brl0(D.meta - D.ap[i])}` : ''}` : ''}` });
    return;
  }
  const cats = (S.plan.catsDesp || []).filter((c) => E.sum(C.despCat[c.id] || []) > 0); const cores = ['var(--c2)', 'var(--c4)', 'var(--c3)', 'var(--c5)', 'var(--c6)', 'var(--c1)'];
  chartBarsPer(el, { labels: MES, cur, height: 190, aria: 'Gastos de cada mês divididos entre fixos e variáveis', bars: cats.map((c, i) => ({ color: cores[i % 6], values: C.despCat[c.id] })),
    tip: (i) => `<b>${MES_LONGO[i]}</b><br>` + cats.map((c) => `${esc(c.nome)}: ${brl0(C.despCat[c.id][i])}`).join('<br>') });
}

/* ---------- Janela (pop-up) do simulador e do histórico ----------
   "E se?" e "Histórico", no card do patrimônio, abrem o conteúdo numa janela sobre a tela em vez de inseri-lo na página.
   Usa um <dialog> modal: fundo escurecido, Esc ou toque fora fecham, e o foco volta ao botão que abriu. */
function popDialogo() {
  let d = document.getElementById('wg-pop');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'wg-pop'; d.className = 'pop-dlg'; document.body.appendChild(d);
    d.addEventListener('close', () => { // fechou por Esc, toque fora ou botão: limpa o estado e devolve o foco
      const era = d.dataset.tipo; S.simAberto = false; if (S.hist) S.hist.aberto = false; d.dataset.tipo = ''; ['toast', 'infotip'].forEach((id) => { const n = document.getElementById(id); if (n && d.contains(n)) document.body.appendChild(n); }); d.innerHTML = ''; /* toast/dica podem estar hospedados no diálogo: voltam ao body antes de limpar */
      popBotoes(); const b = document.querySelector(era === 'sim' ? '#obj-card [data-act="sim-ir"], .hero-card [data-act="sim-toggle"]' : '.hero-card [data-act="hist-toggle"]'); if (b) b.focus({ preventScroll: true }); // o "E se?" agora mora no card do objetivo
    });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // toque no fundo escurecido
  }
  return d;
}
const popBotoes = () => {
  document.querySelectorAll('[data-act="sim-toggle"].hist-btn').forEach((b) => b.setAttribute('aria-expanded', String(!!S.simAberto)));
  document.querySelectorAll('[data-act="hist-toggle"].hist-btn').forEach((b) => b.setAttribute('aria-expanded', String(!!(S.hist && S.hist.aberto))));
};
// conteúdo da janela conforme o estado (S.simAberto ou S.hist.aberto); desenha os gráficos depois de visível
function popSync() {
  const tipo = S.simAberto ? 'sim' : S.hist && S.hist.aberto ? 'hist' : '';
  const d = document.getElementById('wg-pop');
  if (!tipo || S.screen !== 'app' || S.view !== 'geral') { if (d && d.open) d.close(); return; }
  const dlg = popDialogo(); const html = tipo === 'sim' ? simHtml() : histHtml();
  if (!html) { if (dlg.open) dlg.close(); else { S.simAberto = false; if (S.hist) S.hist.aberto = false; } return; }
  const sc = dlg.scrollTop; const tst = document.getElementById('toast');
  dlg.dataset.tipo = tipo; dlg.innerHTML = html; if (tst && !tst.isConnected) dlg.appendChild(tst);
  dlg.setAttribute('aria-labelledby', tipo === 'sim' ? 'sim-t' : 'hist-t');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = sc; popBotoes();
  if (tipo === 'sim') simAtualizar(); else drawHistorico();
}
function popAlternar(tipo, abrir) {
  const st = histEstado(); const aberto = tipo === 'sim' ? !!S.simAberto : !!st.aberto;
  const novo = abrir === true ? true : !aberto;
  S.simAberto = tipo === 'sim' ? novo : false; st.aberto = tipo === 'hist' ? novo : false; // uma janela por vez
  if (!novo) { const d = document.getElementById('wg-pop'); if (d && d.open) d.close(); popBotoes(); return; }
  popSync();
  const d = document.getElementById('wg-pop'); if (!d || !d.open) return;
  const alvo = tipo === 'sim' ? document.getElementById('sim-extra') : d.querySelector('.hist-tabs .np-chip[aria-selected="true"]');
  setTimeout(() => (alvo || d).focus({ preventScroll: true }), 60);
}
