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
function saLinha(vals, ate, id, ref) {
  const W = 600, H = 190, P = 6; const vs = vals.slice(0, ate + 1); const todos = ref ? vs.concat(ref) : vs; const mx = Math.max(...todos, 1) * 1.08; const mn = Math.min(...todos) * 0.92;
  const x = (i) => P + (i * (W - 2 * P)) / 11; const y = (v) => H - P - ((v - mn) / (mx - mn || 1)) * (H - 2 * P);
  const pts = vs.map((v, i) => [x(i), y(v)]); const d = curvaSaas(pts);
  const ult = pts[pts.length - 1] || [0, H];
  return `<div class="sa-ln"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bas-azul, #0A84FF)" stop-opacity=".35"/><stop offset="1" stop-color="var(--bas-azul, #0A84FF)" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" class="sa-grade"/>`).join('')}
      <path d="${d} L${ult[0]},${H} L${P},${H} Z" fill="url(#${id})"/><path d="${d}" class="sa-ln-l" vector-effect="non-scaling-stroke"/>${ref ? `<path d="${curvaSaas(ref.map((v, i) => [x(i), y(v)]))}" class="sa-ln-ref" vector-effect="non-scaling-stroke"/>` : ''}</svg>
    <i class="sa-ln-p" style="left:${(ult[0] / W) * 100}%;top:${(ult[1] / H) * 100}%"></i>
    <div class="sa-ln-hit">${vs.map((v, i) => `<span style="--x:${(pts[i][0] / W) * 100}%;--y:${(pts[i][1] / H) * 100}%"><b>${esc(cap(MES_LONGO[i]))}<em>${esc(brl0(v))}</em></b></span>`).join('')}</div>
    <div class="sa-eixo">${MES.map((n, i) => `<span${i === ate ? ' class="on"' : ''}>${n}</span>`).join('')}</div></div>`;
}
const curvaSaas = (p) => p.map((q, i) => { if (!i) return `M${q[0]},${q[1]}`; const a = p[i - 1]; const cx = (a[0] + q[0]) / 2; return `C${cx},${a[1]} ${cx},${q[1]} ${q[0]},${q[1]}`; }).join(' ');
// barras em pares (entrou x saiu): a primeira cheia, a segunda listrada, como na referência
function saBarras(a, b, ate, rot) {
  const mx = Math.max(...a.slice(0, ate + 1), ...b.slice(0, ate + 1), 1);
  return `<div class="sa-br">${a.slice(0, ate + 1).map((v, i) => `<button class="sa-br-m${i === ate ? ' on' : ''}"><em class="sa-tip"><b>${esc(cap(MES_LONGO[i]))}</b><span>${esc(rot[0])} ${esc(brl0(v))}</span><span>${esc(rot[1])} ${esc(brl0(b[i]))}</span></em>
      <span class="sa-br-p"><i style="height:${(v / mx) * 100}%"></i><i class="lt" style="height:${(b[i] / mx) * 100}%"></i></span><small>${MES[i]}</small></button>`).join('')}</div>`;
}
// barras simples (um valor por mês), com uma linha de referência opcional (meta ou limite)
function saColunas(vals, ate, ref, bom) { // bom: passar da referência é bom (meta de aporte) em vez de ruim (limite de gasto)
  const mx = Math.max(...vals.slice(0, ate + 1), ref || 0, 1) * 1.05;
  return `<div class="sa-br sa-col">${ref ? `<i class="sa-ref" style="bottom:calc(24px + ${((ref / mx) * 176).toFixed(1)}px)"><b>${esc(brl0(ref))}</b></i>` : ''}${vals.slice(0, ate + 1).map((v, i) => `<button class="sa-br-m${i === ate ? ' on' : ''}${ref && v > ref ? (bom ? ' meta' : ' acima') : ''}"><em class="sa-tip"><b>${esc(cap(MES_LONGO[i]))}</b><span>${esc(brl0(v))}</span></em>
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

/* ---------- peças de SaaS: indicadores com tendência e tabela com busca e ordenação (sem render) ---------- */
const SA_LUPA = ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
function saSpark(vals) { const v = vals.filter((x) => x != null); if (v.length < 2) return ''; const mx = Math.max(...v), mn = Math.min(...v), W = 100, H = 30;
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * W},${H - 3 - ((x - mn) / (mx - mn || 1)) * (H - 6)}`).join(' ');
  return `<svg class="sa-spk" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg>`; }
// variação em % com a cor pelo sentido bom (gasto subindo é ruim)
const saDelta = (d, bomSobe = true) => (d == null || !isFinite(d) ? '' : `<span class="sa-var ${(d >= 0) === bomSobe ? 'pos' : 'neg'}">${d >= 0 ? '↑' : '↓'} ${Math.abs(d * 100).toFixed(1).replace('.', ',')}%</span>`);
const saKpi = (rot, val, d, serie, bomSobe = true, nota = '') => `<div class="sa-kpi"><small>${rot}</small><b>${val}</b><span class="sa-kpi-r">${saDelta(d, bomSobe)}<em>${nota}</em></span>${saSpark(serie)}</div>`;
const saVarMes = (a, m) => (m > 0 && a[m - 1] ? (a[m] - a[m - 1]) / Math.abs(a[m - 1]) : null);
const saUlt6 = (a, m) => a.slice(Math.max(0, m - 5), m + 1);
function saTabela(id, cols, linhas, busca) { // cols: [rótulo, numérico?]; linha: { attrs, cel: [html], ord: [valor], txt }
  return `<div class="sa-tb" data-sa-tb="${id}">${busca ? `<label class="sa-busca">${SA_LUPA}<input type="search" placeholder="${esc(busca)}" data-sa-busca aria-label="${esc(busca)}"></label>` : ''}
    <table class="sa-tab"><thead><tr>${cols.map((c, i) => `<th${c[1] ? ' class="n"' : ''}><button type="button" data-sa-ord="${i}">${c[0]}<i aria-hidden="true"></i></button></th>`).join('')}</tr></thead>
    <tbody>${linhas.map((l) => `<tr ${l.attrs || ''} data-txt="${esc((l.txt || '').toLowerCase())}" ${l.ord.map((v, i) => `data-o${i}="${esc(String(v))}"`).join(' ')}>${l.cel.map((c, i) => `<td${cols[i][1] ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="sa-p sa-tb-vazio"${linhas.length ? ' hidden' : ''}>Nada por aqui.</p></div>`; }
document.addEventListener('input', (e) => { const i = e.target.closest && e.target.closest('[data-sa-busca]'); if (!i) return; const tb = i.closest('[data-sa-tb]'); const q = i.value.trim().toLowerCase(); let n = 0;
  tb.querySelectorAll('tbody tr').forEach((r) => { const ok = !q || r.dataset.txt.includes(q); r.hidden = !ok; n += ok; }); tb.querySelector('.sa-tb-vazio').hidden = n > 0; });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-sa-ord]'); if (!b) return; const tb = b.closest('[data-sa-tb]'); const k = 'o' + b.dataset.saOrd;
  const dir = b.dataset.dir === 'desc' ? 'asc' : 'desc'; tb.querySelectorAll('[data-sa-ord]').forEach((x) => delete x.dataset.dir); b.dataset.dir = dir; const corpo = tb.querySelector('tbody'); const rs = [...corpo.rows];
  const num = rs.every((r) => r.dataset[k] !== '' && !isNaN(+r.dataset[k])); rs.sort((a, c) => { const x = a.dataset[k], y = c.dataset[k]; const r = num ? (+x) - (+y) : x.localeCompare(y, 'pt-BR'); return dir === 'asc' ? r : -r; }).forEach((r) => corpo.appendChild(r)); });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-sa-alt]'); if (!b) return; const c = b.closest('.sa-c'); const k = b.dataset.saAlt; const v = b.dataset.v;
  if (v != null) { c.dataset[k] = v; c.querySelectorAll(`[data-sa-alt="${k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === v))); } else { const on = c.toggleAttribute('data-' + k); b.setAttribute('aria-pressed', String(on)); } });
const saInstNome = (k) => (INSTITUICOES.find((x) => x.id === k) || { nome: k || '' }).nome;
function saLancLinhas(L) { return L.map((l) => { const d = E.parseDataISO(l.data); return { attrs: basIr('gasto-ver', { id: l.id }), txt: `${l.desc} ${l.area} ${saInstNome(l.inst)}`,
  cel: [`<span class="sa-dt">${pad2(d.dia)}/${pad2(d.mes + 1)}</span>`, `<b class="sa-tx">${esc(l.desc || l.area || '')}</b>`, `<span class="sa-cat">${esc(l.area || 'Outros')}</span>`, l.inst ? `<span class="sa-bco">${instIcone(l.inst)}${esc(saInstNome(l.inst))}</span>` : '<span class="sa-tag">—</span>', `<b>${basCent(Math.abs(l.valor))}</b>`],
  ord: [l.data, l.desc || '', l.area || '', saInstNome(l.inst), Math.abs(+l.valor || 0)] }; }); }
const SA_COLS_LANC = [['Data'], ['Descrição'], ['Categoria'], ['Banco'], ['Valor', 1]];
const saLancMes = (m) => (S.plan.lancamentos || []).filter((l) => l.data && +l.data.slice(5, 7) === m + 1 && +l.data.slice(0, 4) === S.year).sort((a, b) => (a.data < b.data ? 1 : -1));

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

/* ---------- Início: a organização da Visão geral antiga, no visual novo ----------
   1) patrimônio estimado (com o ritmo da meta) e o próximo objetivo; 2) quatro indicadores; 3) proventos e composição; 4) ano a ano e orçamento */
const saInd = (rot, val, sub, f, tom, chip) => `<div class="sa-c sa-ind w3"><small>${rot}</small><b class="${tom || ''}">${val}${chip || ''}</b>${f != null ? `<span class="sa-ind-b ${tom || ''}"><i style="width:${Math.min(100, Math.max(0, f) * 100).toFixed(1)}%"></i></span>` : ''}<p>${sub}</p></div>`;
const SA_ORC = { pos: 'Dentro', warn: 'Perto', neg: 'Acima', sem: 'Sem orçamento' };
function saOrc(ate) { // gasto de cada mês colorido pela situação do orçamento, com a marca do orçado
  const C = S.C; const mx = Math.max(...C.despesas.slice(0, ate + 1), ...C.orcamento.slice(0, ate + 1), 1) * 1.05;
  return `<div class="sa-br sa-col sa-orc">${C.despesas.slice(0, ate + 1).map((v, i) => { const o = C.orcamento[i] || 0; const st = orcSit(i);
    return `<button class="sa-br-m ${st}${i === ate ? ' on' : ''}"><em class="sa-tip"><b>${esc(cap(MES_LONGO[i]))}</b><span>Gastou ${esc(brl0(v))}</span><span>${o > 0 ? `Orçado ${esc(brl0(o))}` : 'Sem orçamento'}</span></em>
      <span class="sa-br-p"><i style="height:${(v / mx) * 100}%"></i>${o > 0 ? `<u style="bottom:${(o / mx) * 100}%"></u>` : ''}</span><small>${MES[i]}</small></button>`; }).join('')}</div>`;
}
function saAnoAno() { // fim de cada ano, encadeado a partir do diagnóstico; com um ano só, o começo e agora
  const H = histDados(); const C = S.C; const ult = S.year === NOW_Y ? NOW_M : 11;
  const anos = (H.anos || []).filter((l) => l.preenchido).slice(-5);
  const pts = anos.length > 1 ? anos.map((l) => ({ k: l.ano === NOW_Y ? 'Hoje' : String(l.ano), v: l.patrimonioFim, ano: l.ano }))
    : [{ k: `Início de ${S.year}`, v: +C.patrimonioBase || 0 }, { k: 'Hoje', v: C.patrimonio[ult] || 0, ano: S.year }];
  const W = 600, H2 = 170; const vs = pts.map((q) => q.v); const mn = Math.min(...vs), mx = Math.max(...vs); const fo = (mx - mn) * 0.25 || mx * 0.1 || 1;
  const P = pts.map((q, k) => [24 + (k / Math.max(1, pts.length - 1)) * (W - 48), H2 - 12 - ((q.v - (mn - fo)) / ((mx + fo) - (mn - fo))) * (H2 - 28)]); const d = curvaSaas(P);
  return `<div class="sa-ln sa-aa"><svg viewBox="0 0 ${W} ${H2}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sa-g-aa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bas-azul, #0A84FF)" stop-opacity=".3"/><stop offset="1" stop-color="var(--bas-azul, #0A84FF)" stop-opacity="0"/></linearGradient></defs>
      ${P.slice(1, -1).map((q) => `<line x1="${q[0]}" x2="${q[0]}" y1="0" y2="${H2}" class="sa-grade"/>`).join('')}<path d="${d} L${P[P.length - 1][0]},${H2} L${P[0][0]},${H2} Z" fill="url(#sa-g-aa)"/><path d="${d}" class="sa-ln-l" vector-effect="non-scaling-stroke"/></svg>
      ${P.map((q, k) => `<i class="sa-aa-p${k === P.length - 1 ? ' fim' : ''}" style="left:${(q[0] / W) * 100}%;top:${(q[1] / H2) * 100}%"></i>`).join('')}</div>
    <ul class="sa-aa-anos" style="--n:${pts.length}">${pts.map((q, k) => { const a = k ? pts[k - 1].v : 0; const dv = k && a > 0 ? (q.v - a) / a : null;
      return `<li class="${k === pts.length - 1 ? 'on' : ''}">${q.ano ? `<button ${basIr('ano-hist', { id: q.ano })}>` : '<span>'}<small>${esc(q.k)}</small><b>${tickFmt(q.v)}</b>${dv != null ? `<em class="${dv >= 0 ? 'pos' : 'neg'}">${dv >= 0 ? '+' : '−'}${pct(Math.abs(dv))}</em>` : ''}${q.ano ? '</button>' : '</span>'}</li>`; }).join('')}</ul>`;
}
function saInicio() {
  const C = S.C; const m = saMes(); const p = C.patrimonio[m] || 0; const ant = m > 0 ? C.patrimonio[m - 1] : C.patrimonioBase || p; const dv = p - ant;
  const base = +C.patrimonioBase || 0; const A = objAnalise(); const g = objFoco(A);
  const hero = saHero(`<small class="sa-k">Patrimônio total · ${esc(saMesNome())}</small><b class="sa-v">${basCent(p)}</b>
      <div class="sa-lin">${saVar(dv, `${brl0(Math.abs(dv))} no mês`)}<span class="sa-lin-t">${ant ? `${(dv / ant * 100).toFixed(1).replace('.', ',')}% desde ${esc(MES_LONGO[Math.max(0, m - 1)])}` : ''}</span></div>${saAcoes()}`, '');
  // 1) patrimônio estimado: a linha do ano e, num botão, o ritmo da meta (início do ano mais a meta de aporte acumulada)
  let acc = base; const ritmo = C.metaAporteMes.map((v) => (acc += +v || 0)); const temMeta = saSoma(C.metaAporteMes) > 0;
  const patr = saCard('w8 sa-patr', 'Patrimônio estimado', `<span class="sa-c-acs2">${temMeta ? `<button class="sa-lk sa-alt" data-sa-alt="meta" aria-pressed="false"><i class="sa-alt-t" aria-hidden="true"></i>Ritmo da meta</button>` : ''}${saLk(basIr('historico'), 'Histórico')}</span>`,
    `<div class="sa-c-n"><b>${brl0(p)}</b>${saVar(p - base, `${base > 0 ? pct(Math.abs(p - base) / base) : brl0(Math.abs(p - base))} em ${S.year}`)}${temMeta ? `<span class="sa-lin-t sa-meta-t">no ritmo da meta: ${brl0(ritmo[m])} em ${esc(MES_LONGO[m])}</span>` : ''}</div>${saLinha(C.patrimonio, m, 'sa-g-patr', temMeta ? ritmo : null)}`);
  // 1) próximo objetivo: o objeto 3D do App, o anel, quanto falta, a previsão, fichas para trocar e o "E se?"
  const obj = !g ? saCard('w4 sa-obj vazio', 'Seu próximo objetivo', '', `<p class="sa-p">Imóvel, carro, viagem, filhos: dê um nome ao que você quer conquistar e acompanhe aqui.</p><button class="btn primary" ${basIr('sonho-novo')}>${I_META}Criar meu sonho</button>`)
    : saCard('w4 sa-obj', 'Seu próximo objetivo', `<span class="sa-c-acs2">${g.status !== 'concluido' && g.valor > 0 && basPago() ? `<button class="sa-lk" ${basIr('simular', { id: g.id })}>E se?</button>` : ''}${saLk(basIr('sonhos'), 'Sonhos')}</span>`,
      `<button class="sa-obj-palco" ${basIr('sonho-det', { id: g.id })} aria-label="Ver ${esc(objNomeDe(g))}"><span class="bas-o3 sa-o3" id="bas-o3" data-tipo="${esc(obj3dDe(g))}">${obj3dHtml(obj3dDe(g))}<span class="bas-o3-ic" aria-hidden="true">${objIcone(g, 0)}</span></span>${saAnel(g.progresso || 0, saPct(g.progresso || 0))}</button>
      <div class="sa-obj-t"><b>${esc(objNomeDe(g))}</b><span class="sa-obj-f">${g.valor > g.saldo ? `Faltam ${brl0(g.valor - g.saldo)}` : 'Meta coberta'}</span><small>meta de ${brl0(g.valor)}${g.ano ? ` · ${g.status === 'concluido' ? 'concluído' : g.previsto ? `previsão ${esc(MES_LONGO[g.previsto.mes])} de ${g.previsto.ano}` : `até ${g.ano}`}` : ''}</small></div>
      ${A.itens.length > 1 ? `<div class="sa-obj-ch" role="tablist" aria-label="Trocar de objetivo">${A.itens.map((x, k) => `<button role="tab" aria-selected="${x.id === g.id}" data-act="bas-foco" data-id="${esc(x.id)}" title="${esc(objNomeDe(x))}">${objIcone(x, k)}<span>${esc(objNomeDe(x))}</span></button>`).join('')}</div>` : ''}`);
  // 2) indicadores do ano até o mês aberto
  const rec = saSoma(C.receita.slice(0, m + 1)); const sob = saSoma(C.investAlocado.slice(0, m + 1)); const poup = rec > 0 ? sob / rec : null;
  const u = C.usoOrc[m]; const tomO = u == null ? '' : u > 1 ? 'neg' : u > 0.85 ? 'warn' : 'pos';
  const apl = saSoma(C.aplicado.slice(0, m + 1)); const metaAno = (S.plan.settings && +S.plan.settings.metaInvAno) || saSoma(C.metaAporteMes);
  const prov = C.dividendos || Array(12).fill(0); const provAno = saSoma(prov.slice(0, m + 1)); const md = prov.slice(0, m + 1).filter((v) => v > 0).length;
  const inds = saInd(`Taxa de poupança em ${S.year}`, poup == null ? '—' : pct(poup), rec <= 0 ? 'Aparece quando houver entradas' : sob >= 0 ? `${brl0(sob)} sobraram para investir` : `Gastos ${brl0(-sob)} acima das entradas`, poup, poup == null ? '' : poup >= 0.2 ? 'pos' : poup < 0.1 ? 'warn' : '')
    + saInd(`Orçamento de ${esc(MES_LONGO[m])}`, u == null ? '—' : pct(u), C.orcamento[m] > 0 ? (C.restante[m] >= 0 ? `Restam ${brl0(C.restante[m])}` : `${brl0(-C.restante[m])} acima do orçado`) : `<button class="sa-lk" ${basIr('limite')}>Definir</button>`, u, tomO)
    + saInd(`Aportes na meta de ${S.year}`, metaAno > 0 ? pct(Math.min(1, apl / metaAno)) : '—', metaAno > 0 ? `${brl0(apl)} de ${brl0(metaAno)}` : `<button class="sa-lk" ${basIr('meta')}>Definir</button>`, metaAno > 0 ? apl / metaAno : null, metaAno > 0 && apl >= metaAno ? 'pos' : '')
    + saInd(`Dividendos em ${S.year}`, brl0(provAno), md ? `média de ${brl0(provAno / md)} por mês com pagamento` : 'Nenhum provento registrado', null, '', typeof varChip === 'function' ? varChip('dividendos', 1) : '');
  // 3) proventos (mês a mês ou acumulado) e composição da carteira
  let pa = 0; const provAc = prov.map((v) => (pa += +v || 0));
  const cls = {}; (S.plan.ativos || []).forEach((a) => { cls[a.classe || 'Outros'] = (cls[a.classe || 'Outros'] || 0) + saSoma(a.ap || []); });
  const cL = Object.entries(cls).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]); const cT = saSoma(cL.map((x) => x[1]));
  const provC = `<div class="sa-c w7 sa-prov" data-modo="mes"><header class="sa-c-h"><h3>Proventos mês a mês</h3><span class="sa-seg" role="group" aria-label="Ver proventos"><button data-sa-alt="modo" data-v="mes" aria-pressed="true">Mês a mês</button><button data-sa-alt="modo" data-v="acum" aria-pressed="false">Acumulado</button></span></header>
      <div class="sa-c-n"><b>${brl0(provAno)}</b><span class="sa-lin-t">em ${S.year} · ${saLk(basIr('proventos'), 'Ver todos')}</span></div><div class="sa-prov-mes">${saColunas(prov, m, 0)}</div><div class="sa-prov-acum">${saLinha(provAc, m, 'sa-g-prov')}</div></div>`;
  const comp = saCard('w5', 'Composição da carteira', saLk(basIr('carteira'), 'Carteira'), cL.length ? `<div class="sa-ro-w">${saRosca(saPartes(cL, 6), brl0(cT), 'investido')}<ul class="sa-lista">${saPartes(cL, 6).map(([n, v], i) => `<li><i style="background:${SA_CORES[i % 6]}"></i><span>${esc(n)}</span><b>${saPct(v / (cT || 1))}</b></li>`).join('')}</ul></div>` : `<p class="sa-p">Registre seu primeiro investimento.</p><button class="btn primary" ${basIrInv()}>${I_APLICAR}Investir</button>`);
  // 4) patrimônio ano a ano e orçamento e gastos
  const lim = S.year === NOW_Y ? NOW_M : 11; const mO = []; for (let i = 0; i <= Math.min(m, lim); i++) if (C.orcamento[i] > 0) mO.push(i);
  const dentro = mO.filter((i) => C.despesas[i] <= C.orcamento[i]).length; const sits = [...new Set(C.despesas.slice(0, m + 1).map((v, i) => orcSit(i)))];
  const aa = saCard('w6', 'Patrimônio ano a ano', saLk(basIr('historico'), 'Linha do tempo'), saAnoAno());
  const orc = saCard('w6 sa-orc-c', 'Orçamento e gastos', `<span class="sa-tag">${mO.length ? `Meses dentro <b>${dentro} de ${mO.length}</b>` : 'Sem orçamento'}</span>`, `${saOrc(m)}
      <footer class="sa-leg">${['pos', 'warn', 'neg', 'sem'].filter((k) => sits.includes(k)).map((k) => `<span><i class="sa-orc-${k}"></i>${SA_ORC[k]}</span>`).join('')}${mO.length ? '<span><i class="sa-orc-ref"></i>Orçado</span>' : ''}</footer>`);
  const cards = [patr, obj, inds, provC, comp, aa, orc,
    saCard('w12', 'Atividade recente', saLk('data-act="nav" data-view="despesas"', 'Ver todos os gastos'), saTabela('ativ', SA_COLS_LANC, saLancLinhas(saLancMes(m).slice(0, 8)))),
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
  const hoje = S.year === NOW_Y && m === NOW_M ? new Date().getDate() : new Date(S.year, m + 1, 0).getDate();
  const abertas = kit.filter((k) => !k.pago); const topA = areas[0];
  const kpis = `<div class="sa-kpis w12">${saKpi(`Gastou em ${esc(saMesNome())}`, brl0(sai), saVarMes(C.despesas, m), saUlt6(C.despesas, m), false)}
    ${saKpi('Por dia, em média', brl0(sai / hoje), null, [], true, `${hoje} dias`)}${saKpi('Maior categoria', topA ? esc(topA[0]) : '—', null, [], true, topA ? `${brl0(topA[1])} · ${saPct(topA[1] / (tot || 1))}` : '')}
    ${saKpi('Contas em aberto', String(abertas.length), null, [], true, abertas.length ? brl0(saSoma(abertas.map((k) => k.valor))) : 'tudo pago')}
    ${saKpi('Do limite do mês', lim > 0 ? saPct(uso) : '—', null, [], true, lim > 0 ? (uso > 1 ? `passou ${brl0(sai - lim)}` : `sobram ${brl0(lim - sai)}`) : 'sem limite')}</div>`;
  const cards = [kpis,
    saCard('w7', 'Para onde foi o dinheiro', `<span class="sa-tag">${esc(cap(saMesNome()))}</span>`, areas.length ? `<div class="sa-onde">${saRosca(saPartes(areas, 6), brl0(tot), 'no mês')}
        <ul class="sa-cats">${areas.map(([n, v], i) => { const l = +lims[n] || 0; return `<li><button ${basIr('categoria', { area: n })}><i style="background:${SA_CORES[Math.min(i, 5)]}"></i><span class="sa-cats-n">${esc(n)}<small>${l > 0 ? `${saPct(v / l)} do limite de ${brl0(l)}` : `${saPct(v / (tot || 1))} do total`}</small></span><b>${brl0(v)}</b>
          ${l > 0 ? `<span class="sa-cats-b${v > l ? ' passou' : ''}"><i style="width:${Math.min(100, (v / l) * 100)}%"></i></span>` : ''}</button></li>`; }).join('')}</ul></div>` : `<p class="sa-p">Nenhum gasto em ${esc(saMesNome())}.</p>`),
    saCard('w5 sa-escuro', 'Mês a mês', `<span class="sa-tag">${lim > 0 ? `Limite ${brl0(lim)}` : S.year}</span>`, `${saColunas(C.despesas, m, lim)}<footer class="sa-leg"><span>Média ${brl0(saSoma(C.despesas.slice(0, m + 1)) / (m + 1))} por mês</span><span>${brl0(saSoma(C.despesas.slice(0, m + 1)))} no ano</span></footer>`),
    saCard('w12 sa-contas-c', 'Contas do mês', `<span class="sa-tag">${kit.filter((k) => k.pago).length} de ${kit.length} pagas</span>`, kit.length ? `<ul class="sa-contas">${kit.map((k) => `<li class="${k.pago ? 'ok' : ''}"><button ${basIr('conta', { id: k.id })}>${typeof instIcone === 'function' && k.inst ? instIcone(k.inst) : '<span class="sa-ponto"></span>'}<span>${esc(k.nome)}<small>${esc(k.area || '')}${k.parcela ? ` · parcela ${esc(String(k.parcela))}` : ''}</small></span><b>${brl0(k.valor)}</b><em>${k.pago ? 'Paga' : 'Em aberto'}</em></button></li>`).join('')}</ul>`
      : `<p class="sa-p">Nenhuma conta fixa ou parcela neste mês.</p>`),
    saCard('w12 sa-lanc', `Lançamentos de ${esc(saMesNome())}`, `<span class="sa-tag">${saLancMes(m).length} gastos</span>${saLk(basIr('gasto'), 'Novo gasto')}`, saTabela('lanc', SA_COLS_LANC, saLancLinhas(saLancMes(m)), 'Buscar por nome, categoria ou banco')),
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
  const kpis = `<div class="sa-kpis w12">${saKpi('Patrimônio', brl0(p), saVarMes(C.patrimonio, m), saUlt6(C.patrimonio, m))}
    ${saKpi(`Aportado em ${S.year}`, brl0(apl), null, saUlt6(C.aplicado, m), true, metaAno > 0 ? `${saPct(apl / metaAno)} da meta` : '')}
    ${saKpi(`Proventos em ${S.year}`, brl0(provAno), saVarMes(prov, m), saUlt6(prov, m), true, `${brl0(provAno / (m + 1))} por mês`)}
    ${saKpi('Dá para aportar', brl0(D.disponivel), null, [], true, `sobrou ${brl0(D.sobra || 0)}`)}
    ${saKpi('Ativos', String(pos.length), null, [], true, `${cL.length} classes`)}</div>`;
  const cards = [kpis,
    saCard('w8', 'Evolução do patrimônio', saLk(basIr('historico'), 'Ano a ano'), `${saLinha(C.patrimonio, m, 'sa-g-patr2')}`),
    saCard('w4', 'Ritmo da meta do ano', '', `<div class="sa-disp-c">${saAnel(metaAno > 0 ? apl / metaAno : 0, metaAno > 0 ? saPct(apl / metaAno) : '—')}<div><b class="sa-big">${brl0(Math.max(0, metaAno - apl))}</b><small>${metaAno > 0 ? (apl >= metaAno ? 'Meta do ano batida' : `${m < 11 ? `${brl0(Math.max(0, metaAno - apl) / (11 - m))} por mês até dezembro` : 'último mês do ano'}`) : 'Defina a meta do ano'}</small></div></div>
      <div class="sa-c-acs"><button class="btn primary" ${basIrInv()}>${I_APLICAR}Investir</button>${saLk(basIr('meta'), 'Meta')}</div>`),
    saCard('w7 sa-escuro', 'Aportes mês a mês', `<span class="sa-tag">${C.metaAporteMes[m] > 0 ? `Meta ${brl0(C.metaAporteMes[m])}` : S.year}</span>`, `${saColunas(C.aplicado, m, C.metaAporteMes[m] || 0, true)}<footer class="sa-leg"><span>${C.aplicado.slice(0, m + 1).filter((v, i) => v > 0 && v >= (C.metaAporteMes[i] || 0)).length} meses na meta</span><span>${brl0(apl)} no ano</span></footer>`),
    saCard('w5', 'Como está dividido', saLk(basIr('carteira'), 'Carteira'), cL.length ? `<div class="sa-ro-w">${saRosca(cL, brl0(cT), 'investido')}<ul class="sa-lista">${cL.map(([n, v], i) => `<li><i style="background:${SA_CORES[i % 6]}"></i><span>${esc(n)}</span><b>${saPct(v / (cT || 1))}</b></li>`).join('')}</ul></div>` : '<p class="sa-p">Registre seu primeiro investimento.</p>'),
    saCard('w5', 'Proventos', saLk(basIr('proventos'), 'Ver todos'), `<div class="sa-c-n"><b>${brl0(provAno)}</b><span class="sa-lin-t">em ${S.year} · média ${brl0(provAno / (m + 1))} por mês</span></div>${saColunas(prov, m, 0)}`),
    saCard('w7', 'Posições', `<span class="sa-tag">${pos.length} ativos</span>`, saTabela('pos', [['Ativo'], ['Classe'], ['Aportado', 1], ['Proventos', 1], ['Peso', 1]], pos.slice().sort((a, b) => b[1] - a[1]).map(([a, v, pr]) => ({ txt: `${a.nome} ${a.tipo} ${a.classe}`,
      cel: [`<b class="sa-tx">${esc(a.nome || a.tipo || '')}</b><small>${esc(a.tipo || '')}</small>`, `<span class="sa-cat">${esc(a.classe || '')}</span>`, brl0(v), brl0(pr), `<span class="sa-peso"><i style="width:${(v / (cT || 1)) * 100}%"></i></span>${saPct(v / (cT || 1))}`],
      ord: [a.nome || '', a.classe || '', v, pr, v] })), 'Buscar ativo')),
    saCard('w12 sa-sonhos', 'Seus sonhos', saLk(basIr('sonhos'), 'Todos'), `<div class="sa-sn">${objs.map((g) => `<button ${basIr('sonho-det', { id: g.id })}><span class="sa-sonho-ic">${objIcone(g, 0)}</span><small>${g.ano ? `Até ${g.ano}` : 'Sem prazo'}</small><b>${esc(objNomeDe(g))}</b><span class="sa-sonho-bar"><i style="width:${Math.round((g.progresso || 0) * 100)}%"></i></span><span class="sa-sonho-r"><span>${brl0(g.saldo)}</span><span>${brl0(g.valor)}</span></span></button>`).join('')}<button class="sa-sn-novo" ${basIr('sonho-novo')}>${I.plus}<b>Novo sonho</b></button></div>`),
  ];
  return `<div class="sa2" data-aba="patrimonio">${hero}<div class="sa-folha2"><div class="sa-grid">${cards.join('')}</div></div></div>`;
}
