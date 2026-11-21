/* SaaS no computador, pensado do zero no visual do App: alto azul com o número principal e as ações em pílulas,
   uma folha de cantos arredondados por cima e, nela, uma grade de cartões própria de cada aba (Início, Gastos, Patrimônio).
   Mesmos dados e cálculos do App (S.C, E.*); ações abrem as telas do App na folha lateral (basIr). Sem render() nos gráficos. */
'use strict';
const SA_SETA = ic('<path d="M7 17 17 7M8 7h9v9"/>');
const SA_CORES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
const saMes = () => S.mes;
const saMesNome = () => MES_LONGO[saMes()];
const saLk = (attrs, txt) => `<button class="sa-lk" ${attrs}>${txt}${SA_SETA}</button>`;
const saCard = (cls, tit, link, corpo) => `<section class="sa-c ${cls}"><header class="sa-c-h"><h3>${tit}</h3>${link || ''}</header>${corpo}</section>`;
const saPct = (v) => `${Math.round(v * 100)}%`;
const saSoma = (a) => a.reduce((s, v) => s + (+v || 0), 0);

/* ---------- gráficos em SVG (largura pela viewBox, texto em HTML para não esticar) ---------- */
// linha com área em degradê; meses futuros não aparecem; o último ponto pulsa
function saLinha(vals, ate, id) {
  const W = 600, H = 190, P = 6; const vs = vals.slice(0, ate + 1); const mx = Math.max(...vs, 1) * 1.08; const mn = Math.min(...vs) * 0.92;
  const x = (i) => P + (i * (W - 2 * P)) / 11; const y = (v) => H - P - ((v - mn) / (mx - mn || 1)) * (H - 2 * P);
  const pts = vs.map((v, i) => [x(i), y(v)]); const d = curvaSaas(pts);
  const ult = pts[pts.length - 1] || [0, H];
  return `<div class="sa-ln"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bas-azul, #0A84FF)" stop-opacity=".35"/><stop offset="1" stop-color="var(--bas-azul, #0A84FF)" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" class="sa-grade"/>`).join('')}
      <path d="${d} L${ult[0]},${H} L${P},${H} Z" fill="url(#${id})"/><path d="${d}" class="sa-ln-l" vector-effect="non-scaling-stroke"/></svg>
    <i class="sa-ln-p" style="left:${(ult[0] / W) * 100}%;top:${(ult[1] / H) * 100}%"></i>
    <div class="sa-eixo">${MES.map((n, i) => `<span${i === ate ? ' class="on"' : ''}>${n}</span>`).join('')}</div></div>`;
}
const curvaSaas = (p) => p.map((q, i) => { if (!i) return `M${q[0]},${q[1]}`; const a = p[i - 1]; const cx = (a[0] + q[0]) / 2; return `C${cx},${a[1]} ${cx},${q[1]} ${q[0]},${q[1]}`; }).join(' ');
// barras em pares (entrou x saiu): a primeira cheia, a segunda listrada, como na referência
function saBarras(a, b, ate, rot) {
  const mx = Math.max(...a.slice(0, ate + 1), ...b.slice(0, ate + 1), 1);
  return `<div class="sa-br">${a.slice(0, ate + 1).map((v, i) => `<button class="sa-br-m${i === ate ? ' on' : ''}" title="${esc(MES_LONGO[i])}: ${esc(rot[0])} ${esc(brl0(v))} · ${esc(rot[1])} ${esc(brl0(b[i]))}">
      <span class="sa-br-p"><i style="height:${(v / mx) * 100}%"></i><i class="lt" style="height:${(b[i] / mx) * 100}%"></i></span><small>${MES[i]}</small></button>`).join('')}</div>`;
}
// barras simples (um valor por mês), com uma linha de referência opcional (meta ou limite)
function saColunas(vals, ate, ref, bom) { // bom: passar da referência é bom (meta de aporte) em vez de ruim (limite de gasto)
  const mx = Math.max(...vals.slice(0, ate + 1), ref || 0, 1) * 1.05;
  return `<div class="sa-br sa-col">${ref ? `<i class="sa-ref" style="bottom:calc(24px + ${((ref / mx) * 176).toFixed(1)}px)"><b>${esc(brl0(ref))}</b></i>` : ''}${vals.slice(0, ate + 1).map((v, i) => `<button class="sa-br-m${i === ate ? ' on' : ''}${ref && v > ref ? (bom ? ' meta' : ' acima') : ''}" title="${esc(MES_LONGO[i])}: ${esc(brl0(v))}">
      <span class="sa-br-p"><i style="height:${(v / mx) * 100}%"></i></span><small>${MES[i]}</small></button>`).join('')}</div>`;
}
// rosca: fatias com um respiro entre elas e o total no meio
function saRosca(partes, centro, sub) {
  const tot = saSoma(partes.map((p) => p[1])) || 1; let a = 0; const R = 42, C = 2 * Math.PI * R;
  const arcos = partes.map(([, v], i) => { const f = v / tot; const s = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="${SA_CORES[i % 6]}" stroke-width="11" stroke-dasharray="${Math.max(0, f * C - 1.5)} ${C}" stroke-dashoffset="${-a * C}" stroke-linecap="butt"/>`; a += f; return s; }).join('');
  return `<div class="sa-ro"><svg viewBox="0 0 100 100" aria-hidden="true"><circle r="${R}" cx="50" cy="50" fill="none" class="sa-ro-f" stroke-width="11"/><g transform="rotate(-90 50 50)">${arcos}</g></svg><div class="sa-ro-c"><b>${centro}</b><small>${sub}</small></div></div>`;
}
// anel de progresso (meta)
const saAnel = (f, txt) => `<div class="sa-an" style="--f:${Math.max(0, Math.min(1, f || 0))}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle r="42" cx="50" cy="50" class="sa-an-f"/><circle r="42" cx="50" cy="50" class="sa-an-v" pathLength="100"/></svg><b>${txt}</b></div>`;
// gasto acumulado dia a dia: este mês (área) contra o mês anterior (tracejado)
function saAcum(m) {
  const ano = S.year; const dia = (l) => +l.data.slice(8, 10); const doMes = (mm) => (S.plan.lancamentos || []).filter((l) => l.data && +l.data.slice(5, 7) === mm + 1 && +l.data.slice(0, 4) === ano);
  const acum = (L) => { const d = Array(31).fill(0); L.forEach((l) => { d[dia(l) - 1] += +l.valor || 0; }); let s = 0; return d.map((v) => (s += v)); };
  const hoje = ano === NOW_Y && m === NOW_M ? new Date().getDate() : 31;
  const a = acum(doMes(m)).slice(0, hoje); const b = m > 0 ? acum(doMes(m - 1)) : null;
  const W = 600, H = 170; const mx = Math.max(a[a.length - 1] || 0, b ? b[30] : 0, 1) * 1.1;
  const pt = (v, i) => `${(i / 30) * W},${H - (v / mx) * H}`;
  return { svg: `<div class="sa-ln sa-ac"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${[0.33, 0.66].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" class="sa-grade"/>`).join('')}
      ${b ? `<polyline points="${b.map(pt).join(' ')}" class="sa-ac-b" vector-effect="non-scaling-stroke"/>` : ''}
      <polygon points="0,${H} ${a.map(pt).join(' ')} ${((a.length - 1) / 30) * W},${H}" class="sa-ac-a"/><polyline points="${a.map(pt).join(' ')}" class="sa-ln-l" vector-effect="non-scaling-stroke"/></svg>
      <div class="sa-eixo sa-eixo-d"><span>Dia 1</span><span>7</span><span>14</span><span>21</span><span>31</span></div></div>`, este: a[a.length - 1] || 0, antes: b ? b[Math.min(30, hoje - 1)] : null };
}

/* ---------- dados de apoio ---------- */
function saAreasMes(m) { // gastos do mês por área: lançamentos e contas fixas
  const A = {}; (S.plan.lancamentos || []).forEach((l) => { if (l.data && +l.data.slice(5, 7) === m + 1) A[l.area || 'Outros'] = (A[l.area || 'Outros'] || 0) + (+l.valor || 0); });
  (S.plan.despesas || []).forEach((d) => { const v = +(d.valores || [])[m] || 0; if (v > 0) A[d.area || 'Outros'] = (A[d.area || 'Outros'] || 0) + v; });
  return Object.entries(A).sort((a, b) => b[1] - a[1]);
}
const saPartes = (L, n) => (L.length > n ? L.slice(0, n - 1).concat([['Outros', saSoma(L.slice(n - 1).map((x) => x[1]))]]) : L);
const saHero = (esq, dir) => `<section class="sa-hero"><div class="sa-hero-e">${esq}</div><div class="sa-hero-d">${dir}</div></section>`;
const saFerr = () => `<div class="sa-ferr"><button class="sa-per" ${basIr('periodo')}>${typeof I_CAL !== 'undefined' ? I_CAL : ''}<span>${esc(basJanRot())} ${S.year}</span></button>${olhoHtml()}</div>`;
const saVar = (d, txt) => `<span class="sa-var ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '↑' : '↓'} ${txt}</span>`;

/* ---------- Início: como estou e o que faço agora ---------- */
function saInicio() {
  const C = S.C; const m = saMes(); const p = C.patrimonio[m] || 0; const ant = m > 0 ? C.patrimonio[m - 1] : C.patrimonioBase || p; const dv = p - ant;
  const ent = C.receita[m] || 0; const sai = C.despesas[m] || 0; const sob = ent - sai;
  const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const meta = C.metaAporteMes[m] || 0;
  const g = objFoco(objAnalise()); const areas = saAreasMes(m); const totA = saSoma(areas.map((a) => a[1]));
  const ac = saAcum(m); const av = notifLista().filter((n) => !n.lida).slice(0, 3);
  const hero = saHero(`<small class="sa-k">Patrimônio total · ${esc(saMesNome())}</small><b class="sa-v">${basCent(p)}</b>
      <div class="sa-lin">${saVar(dv, `${brl0(Math.abs(dv))} no mês`)}<span class="sa-lin-t">${ant ? `${(dv / ant * 100).toFixed(1).replace('.', ',')}% desde ${esc(MES_LONGO[Math.max(0, m - 1)])}` : ''}</span></div>${saAcoes()}`,
    `<div class="sa-vid sa-mes"><small>${esc(cap(saMesNome()))} em resumo</small>
      <div class="sa-mes-l"><span>Entrou</span><b class="pos">${brl0(ent)}</b></div><div class="sa-mes-l"><span>Saiu</span><b>${brl0(sai)}</b></div>
      <div class="sa-mes-bar"><i style="width:${ent > 0 ? Math.min(100, (sai / ent) * 100) : 0}%"></i></div>
      <div class="sa-mes-l sa-mes-t"><span>Sobrou</span><b class="${sob >= 0 ? 'pos' : 'neg'}">${brl0(sob)}</b></div></div>`);
  const cards = [
    saCard('w8', 'Evolução do patrimônio', saLk(basIr('historico'), 'Histórico'), `<div class="sa-c-n"><b>${brl0(p)}</b>${saVar(p - (C.patrimonioBase || 0), `${brl0(Math.abs(p - (C.patrimonioBase || 0)))} em ${S.year}`)}</div>${saLinha(C.patrimonio, m, 'sa-g-patr')}`),
    saCard('w4 sa-disp', 'Dá para investir', '', `<div class="sa-disp-c">${saAnel(meta > 0 ? (D.aportado || 0) / meta : 0, meta > 0 ? saPct((D.aportado || 0) / meta) : '—')}
        <div><b class="sa-big">${basCent(D.disponivel)}</b><small>${meta > 0 ? `Meta do mês ${brl0(meta)} · investido ${brl0(D.aportado || 0)}` : 'Sem meta definida para o mês'}</small></div></div>
      <div class="sa-c-acs"><button class="btn primary" ${basIrInv()}>${I_APLICAR}Investir agora</button>${saLk(basIr('meta'), 'Meta')}</div>`),
    saCard('w7 sa-escuro', 'Entradas x gastos', `<span class="sa-tag">${S.year}</span>`, `${saBarras(C.receita, C.despesas, m, ['Entrou', 'Saiu'])}
      <footer class="sa-leg"><span><i class="cheia"></i>Entradas ${brl0(saSoma(C.receita.slice(0, m + 1)))}</span><span><i class="listra"></i>Gastos ${brl0(saSoma(C.despesas.slice(0, m + 1)))}</span></footer>`),
    saCard('w5', 'Gastos do mês, dia a dia', `<span class="sa-tag">${ac.antes != null ? (ac.este <= ac.antes ? 'Abaixo do mês passado' : 'Acima do mês passado') : ''}</span>`, `${ac.svg}
      <footer class="sa-leg"><span><i class="cheia"></i>${esc(cap(saMesNome()))} ${brl0(ac.este)}</span>${ac.antes != null ? `<span><i class="tracejado"></i>Mesmo dia em ${esc(MES_LONGO[m - 1])} ${brl0(ac.antes)}</span>` : ''}</footer>`),
    g ? saCard('w4 sa-sonho', 'Seu sonho principal', saLk(basIr('sonhos'), 'Sonhos'), `<button class="sa-sonho-b" ${basIr('sonho-det', { id: g.id })}>${saAnel(g.progresso || 0, saPct(g.progresso || 0))}<span class="sa-sonho-t"><span class="sa-sonho-ic">${objIcone(g, 0)}</span><b>${esc(objNomeDe(g))}</b><small>${g.ano ? `Até ${g.ano}` : 'Sem prazo'}${g.status && BAS_OBJ_ST[g.status] ? ` · ${esc(BAS_OBJ_ST[g.status])}` : ''}</small></span></button>
        <div class="sa-kv"><span>Guardado<b>${brl0(g.saldo)}</b></span><span>Falta<b>${brl0(Math.max(0, g.falta || 0))}</b></span></div>`)
      : saCard('w4', 'Seu sonho', '', `<p class="sa-p">Dê um nome ao que você quer conquistar e veja quanto falta, mês a mês.</p><button class="btn primary" ${basIr('sonho-novo')}>${I_META}Criar meu sonho</button>`),
    saCard('w4', 'Para onde foi o dinheiro', saLk('data-act="nav" data-view="despesas"', 'Gastos'), areas.length ? `<div class="sa-ro-w">${saRosca(saPartes(areas, 5), brl0(totA), esc(saMesNome()))}
        <ul class="sa-lista">${saPartes(areas, 5).map(([n, v], i) => `<li><i style="background:${SA_CORES[i % 6]}"></i><span>${esc(n)}</span><b>${saPct(v / (totA || 1))}</b></li>`).join('')}</ul></div>` : `<p class="sa-p">Nenhum gasto em ${esc(saMesNome())}.</p>`),
    saCard('w4 sa-ia-c', `<span class="cifrao sa-cif" aria-hidden="true"></span><span>Cifrão Intelligence</span>`, saLk(basIr('ia'), 'Abrir'), av.length ? `<ul class="sa-av">${av.map((n) => `<li><button ${basIr('ia', { aba: 'avisos' })}><i class="${esc(n.nivel || 'info')}"></i><span>${esc(n.titulo || '')}</span>${I.chev}</button></li>`).join('')}</ul>`
      : `<p class="sa-p">Tudo em ordem por aqui. Pergunte qualquer coisa sobre o seu dinheiro.</p>`),
    saCard('w12', 'Atividade recente', saLk('data-act="nav" data-view="despesas"', 'Ver tudo'), `<ul class="bas-ativ sa-ativ">${basLancJan().slice(0, 6).map(basLancLinha).join('') || `<li class="sa-p">Nada registrado no período.</li>`}</ul>`),
  ];
  return `<div class="sa2" data-aba="inicio">${hero}<div class="sa-folha2"><div class="sa-grid">${cards.join('')}</div></div></div>`;
}

/* ---------- Gastos: para onde foi e o que vem por aí ---------- */
function saGastos() {
  const C = S.C; const m = saMes(); const sai = C.despesas[m] || 0; const lim = C.orcamento[m] || 0; const uso = lim > 0 ? sai / lim : 0;
  const areas = saAreasMes(m); const tot = saSoma(areas.map((a) => a[1])); const lims = (S.plan.settings && S.plan.settings.limites) || {};
  const K = E.contasMes({ despesas: S.plan.despesas, carry: E.carryItems(S.plans, S.year), ano: S.year, mes: m }); const kit = K.itens || [];
  const bancos = {}; (S.plan.lancamentos || []).forEach((l) => { if (l.data && +l.data.slice(5, 7) === m + 1 && l.inst) bancos[l.inst] = (bancos[l.inst] || 0) + (+l.valor || 0); });
  const bL = Object.entries(bancos).sort((a, b) => b[1] - a[1]); const bMx = bL.length ? bL[0][1] : 1;
  const sem = Array(7).fill(0); (S.plan.lancamentos || []).forEach((l) => { if (l.data && +l.data.slice(0, 4) === S.year) sem[new Date(l.data + 'T12:00').getDay()] += +l.valor || 0; });
  const semMx = Math.max(...sem, 1); const DS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; const top = sem.indexOf(Math.max(...sem));
  const hero = saHero(`<small class="sa-k">Gastou em ${esc(saMesNome())}</small><b class="sa-v">${basCent(sai)}</b>
      ${lim > 0 ? `<div class="sa-lim${uso > 1 ? ' passou' : uso > 0.8 ? ' perto' : ''}"><div class="sa-lim-b"><i style="width:${Math.min(100, uso * 100)}%"></i></div><span>${saPct(uso)} do limite de ${brl0(lim)}${uso > 1 ? ` · passou ${brl0(sai - lim)}` : ` · sobram ${brl0(lim - sai)}`}</span></div>` : `<button class="sa-lim-def" ${basIr('limite')}>Definir um limite para o mês</button>`}
      <div class="sa-acoes"><button class="sa-pl" ${basIr('gasto')}>${I.plus}Novo gasto</button><button class="sa-pl" data-act="bas-importar">${I_ENTRADA}Importar extrato</button><button class="sa-pl" ${basIr('limite')}>${I_META}Limites</button><button class="sa-pl" ${basIr('entradas')}>${I_ENTRADA}Entradas</button></div>`,
    `<div class="sa-vid sa-bancos"><small>Por banco em ${esc(saMesNome())}</small>${bL.slice(0, 4).map(([k, v]) => `<div class="sa-bk">${typeof instIcone === 'function' ? instIcone(k) : ''}<span>${esc((INSTITUICOES.find((x) => x.id === k) || { nome: k }).nome)}</span><b>${brl0(v)}</b><i style="--w:${(v / bMx) * 100}%"></i></div>`).join('') || '<p class="sa-p">Sem gastos com banco marcado.</p>'}</div>`);
  const cards = [
    saCard('w7', 'Para onde foi o dinheiro', `<span class="sa-tag">${esc(cap(saMesNome()))}</span>`, areas.length ? `<div class="sa-onde">${saRosca(saPartes(areas, 6), brl0(tot), 'no mês')}
        <ul class="sa-cats">${areas.map(([n, v], i) => { const l = +lims[n] || 0; return `<li><button ${basIr('categoria', { area: n })}><i style="background:${SA_CORES[Math.min(i, 5)]}"></i><span class="sa-cats-n">${esc(n)}<small>${l > 0 ? `${saPct(v / l)} do limite de ${brl0(l)}` : `${saPct(v / (tot || 1))} do total`}</small></span><b>${brl0(v)}</b>
          ${l > 0 ? `<span class="sa-cats-b${v > l ? ' passou' : ''}"><i style="width:${Math.min(100, (v / l) * 100)}%"></i></span>` : ''}</button></li>`; }).join('')}</ul></div>` : `<p class="sa-p">Nenhum gasto em ${esc(saMesNome())}.</p>`),
    saCard('w5 sa-escuro', 'Mês a mês', `<span class="sa-tag">${lim > 0 ? `Limite ${brl0(lim)}` : S.year}</span>`, `${saColunas(C.despesas, m, lim)}<footer class="sa-leg"><span>Média ${brl0(saSoma(C.despesas.slice(0, m + 1)) / (m + 1))} por mês</span><span>${brl0(saSoma(C.despesas.slice(0, m + 1)))} no ano</span></footer>`),
    saCard('w5', 'Contas do mês', `<span class="sa-tag">${kit.filter((k) => k.pago).length} de ${kit.length} pagas</span>`, kit.length ? `<ul class="sa-contas">${kit.map((k) => `<li class="${k.pago ? 'ok' : ''}"><button ${basIr('conta', { id: k.id })}>${typeof instIcone === 'function' && k.inst ? instIcone(k.inst) : '<span class="sa-ponto"></span>'}<span>${esc(k.nome)}<small>${esc(k.area || '')}${k.parcela ? ` · parcela ${esc(String(k.parcela))}` : ''}</small></span><b>${brl0(k.valor)}</b><em>${k.pago ? 'Paga' : 'Em aberto'}</em></button></li>`).join('')}</ul>`
      : `<p class="sa-p">Nenhuma conta fixa ou parcela neste mês.</p>`),
    saCard('w7', 'Últimos gastos', saLk(basIr('gasto'), 'Novo gasto'), `<ul class="bas-ativ sa-ativ">${basLancJan().slice(0, 7).map(basLancLinha).join('') || '<li class="sa-p">Nada registrado no período.</li>'}</ul>`),
    saCard('w12 sa-semana', 'Dia da semana em que você mais gasta', `<span class="sa-tag">${esc(DS[top])} lidera em ${S.year}</span>`, `<div class="sa-sem">${sem.map((v, i) => `<div class="${i === top ? 'on' : ''}"><span style="--h:${(v / semMx) * 100}%"><i></i></span><b>${brl0(v)}</b><small>${DS[i]}</small></div>`).join('')}</div>`),
  ];
  return `<div class="sa2" data-aba="gastos">${hero}<div class="sa-folha2"><div class="sa-grid">${cards.join('')}</div></div></div>`;
}

/* ---------- Patrimônio: quanto construí e para onde vai ---------- */
function saPatrimonio() {
  const C = S.C; const m = saMes(); const p = C.patrimonio[m] || 0; const base = C.patrimonioBase || 0; const cres = base > 0 ? (p - base) / base : 0;
  const apl = saSoma(C.aplicado.slice(0, m + 1)); const metaAno = (S.plan.settings && +S.plan.settings.metaInvAno) || saSoma(C.metaAporteMes);
  const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes });
  const cls = {}; const pos = (S.plan.ativos || []).map((a) => [a, saSoma(a.ap || []), saSoma(a.pr || [])]); pos.forEach(([a, v]) => { cls[a.classe || 'Outros'] = (cls[a.classe || 'Outros'] || 0) + v; });
  const cL = Object.entries(cls).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]); const cT = saSoma(cL.map((x) => x[1]));
  const prov = C.dividendos || Array(12).fill(0); const provAno = saSoma(prov.slice(0, m + 1)); const objs = objAnalise().itens;
  const hero = saHero(`<small class="sa-k">Patrimônio em ${esc(saMesNome())}</small><b class="sa-v">${basCent(p)}</b>
      <div class="sa-lin">${saVar(p - base, `${(cres * 100).toFixed(1).replace('.', ',')}% em ${S.year}`)}<span class="sa-lin-t">${brl0(p - base)} desde o início do ano · valores a custo</span></div>
      <div class="sa-acoes"><button class="sa-pl" ${basIrInv()}>${I_APLICAR}Investir</button><button class="sa-pl" ${basIr('proventos')}>${I_PROV}Proventos</button><button class="sa-pl" ${basIr('carteira')}>${I_CART}Carteira</button><button class="sa-pl" data-act="bas-importar">${I_ENTRADA}Importar</button></div>`,
    `<div class="sa-vid sa-aportei"><small>Aportei em ${S.year}</small><div class="sa-aportei-c">${saAnel(metaAno > 0 ? apl / metaAno : 0, metaAno > 0 ? saPct(apl / metaAno) : '—')}<div><b>${brl0(apl)}</b><span>${metaAno > 0 ? `de ${brl0(metaAno)} na meta do ano` : 'Defina a meta do ano'}</span></div></div></div>`);
  const cards = [
    saCard('w8', 'Evolução do patrimônio', saLk(basIr('historico'), 'Ano a ano'), `${saLinha(C.patrimonio, m, 'sa-g-patr2')}`),
    saCard('w4', 'Disponível para aportar', '', `<b class="sa-big">${basCent(D.disponivel)}</b><div class="sa-kv"><span>Sobrou no mês<b>${brl0(D.sobra || 0)}</b></span><span>Já investido<b>${brl0(D.aportado || 0)}</b></span></div>
      <div class="sa-c-acs"><button class="btn primary" ${basIrInv()}>${I_APLICAR}Investir</button></div>`),
    saCard('w7 sa-escuro', 'Aportes mês a mês', `<span class="sa-tag">${C.metaAporteMes[m] > 0 ? `Meta ${brl0(C.metaAporteMes[m])}` : S.year}</span>`, `${saColunas(C.aplicado, m, C.metaAporteMes[m] || 0, true)}<footer class="sa-leg"><span>${C.aplicado.slice(0, m + 1).filter((v, i) => v > 0 && v >= (C.metaAporteMes[i] || 0)).length} meses na meta</span><span>${brl0(apl)} no ano</span></footer>`),
    saCard('w5', 'Como está dividido', saLk(basIr('carteira'), 'Carteira'), cL.length ? `<div class="sa-ro-w">${saRosca(cL, brl0(cT), 'investido')}<ul class="sa-lista">${cL.map(([n, v], i) => `<li><i style="background:${SA_CORES[i % 6]}"></i><span>${esc(n)}</span><b>${saPct(v / (cT || 1))}</b></li>`).join('')}</ul></div>` : '<p class="sa-p">Registre seu primeiro investimento.</p>'),
    saCard('w5', 'Proventos', saLk(basIr('proventos'), 'Ver todos'), `<div class="sa-c-n"><b>${brl0(provAno)}</b><span class="sa-lin-t">em ${S.year} · média ${brl0(provAno / (m + 1))} por mês</span></div>${saColunas(prov, m, 0)}`),
    saCard('w7', 'Maiores posições', `<span class="sa-tag">${pos.length} ativos</span>`, `<table class="sa-tab"><thead><tr><th>Ativo</th><th>Classe</th><th>Aportado</th><th>Proventos</th><th>Peso</th></tr></thead><tbody>${pos.sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a, v, pr]) => `<tr><td><b>${esc(a.nome || a.tipo || '')}</b><small>${esc(a.tipo || '')}</small></td><td>${esc(a.classe || '')}</td><td>${brl0(v)}</td><td>${brl0(pr)}</td><td><span class="sa-peso"><i style="width:${(v / (cT || 1)) * 100}%"></i></span>${saPct(v / (cT || 1))}</td></tr>`).join('')}</tbody></table>`),
    saCard('w12 sa-sonhos', 'Seus sonhos', saLk(basIr('sonhos'), 'Todos'), `<div class="sa-sn">${objs.map((g) => `<button ${basIr('sonho-det', { id: g.id })}><span class="sa-sonho-ic">${objIcone(g, 0)}</span><small>${g.ano ? `Até ${g.ano}` : 'Sem prazo'}</small><b>${esc(objNomeDe(g))}</b><span class="sa-sonho-bar"><i style="width:${Math.round((g.progresso || 0) * 100)}%"></i></span><span class="sa-sonho-r"><span>${brl0(g.saldo)}</span><span>${brl0(g.valor)}</span></span></button>`).join('')}<button class="sa-sn-novo" ${basIr('sonho-novo')}>${I.plus}<b>Novo sonho</b></button></div>`),
  ];
  return `<div class="sa2" data-aba="patrimonio">${hero}<div class="sa-folha2"><div class="sa-grid">${cards.join('')}</div></div></div>`;
}
