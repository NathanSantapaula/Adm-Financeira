/* Rendas e Conta corrente: categorias livres, hierarquia flexível, orçamento do mês e parcelamento consolidado. */
'use strict';
const bad = (err, msg) => { err(msg); return false; };
const mesChips = () => `<div class="chips" role="tablist" aria-label="Mês">${MES.map((m, i) => `<button role="tab" aria-selected="${S.mes === i}" class="chip-m${S.mes === i ? ' on' : ''}${S.year === NOW_Y && i === NOW_M ? ' now' : ''}" data-act="mes" data-m="${i}">${m}</button>`).join('')}</div>`;
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

/* ---------------- Conta corrente: meses como accordions ---------------- */
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
  ix.reais[m].forEach(([l, d]) => { out.push({ tipo: 'real', id: l.id, cat: l.cat, area: l.area || 'Outros', sub: l.sub || '', nome: l.desc, valor: +l.valor, dia: d.dia, origem: l.origem || 'manual', itemId: l.itemId }); });
  ix.itens.forEach(([it, vals]) => {
    const v = vals[m]; if (Math.abs(v) < 0.005) return;
    out.push({ tipo: 'prev', id: it.id, cat: it.cat, area: it.area || 'Outros', sub: it.sub || '', nome: it.nome, valor: v, dia: 0, parcela: it.parcel ? `${E.parcelaIndice(it.parcel, ano, m)}/${it.parcel.n}` : '', herdado: it.herdado || null });
  });
  return out;
}
function entradaHtml(e, m) {
  const dia = e.tipo === 'real' ? `${pad2(e.dia)}/${pad2(m + 1)}` : '';
  const b = [];
  if (e.tipo === 'prev') { b.push('<span class="badge prev">Previsto</span>'); if (e.parcela) b.push(`<span class="badge parc">Parcela ${e.parcela}</span>`); if (e.herdado) b.push(`<span class="badge">de ${e.herdado}</span>`); }
  else { if (e.origem === 'csv' || e.origem === 'ofx' || e.origem === 'import') b.push('<span class="badge imp">Importado</span>'); if (e.origem === 'ia') b.push('<span class="badge ia">IA</span>'); if (e.itemId) b.push('<span class="badge prev">Conciliado</span>'); }
  const act = e.tipo === 'real' ? `data-act="edit-lanc" data-id="${esc(e.id)}"` : e.herdado ? `data-act="year-pick" data-year="${e.herdado}"` : `data-act="edit-item" data-kind="desp" data-id="${esc(e.id)}"`;
  return `<div class="ent"><span class="ent-d">${dia || '—'}</span><button class="ent-n" ${act}><span>${esc(e.nome)}</span>${b.length ? `<span class="ent-b">${b.join('')}</span>` : ''}</button><span class="ent-v${e.valor < 0 ? ' neg' : ''}">${e.valor < 0 ? '−' : ''}${brl(Math.abs(e.valor))}</span></div>`;
}
function categoriasMes(m, ents, totalMes) {
  const p = S.plan; const cats = p.catsDesp.map((c) => ({ id: c.id, nome: c.nome }));
  if (ents.some((e) => !cats.some((c) => c.id === e.cat))) cats.push({ id: '__sem', nome: 'Sem categoria' });
  return cats.map((c) => {
    const lista = ents.filter((e) => (c.id === '__sem' ? !p.catsDesp.some((x) => x.id === e.cat) : e.cat === c.id)); if (!lista.length) return '';
    const total = lista.reduce((s, e) => s + e.valor, 0); const areas = [];
    lista.forEach((e) => { let a = areas.find((x) => x.nome === e.area); if (!a) { a = { nome: e.area, direto: [], subs: [] }; areas.push(a); } if (e.sub) { let sb = a.subs.find((x) => x.nome === e.sub); if (!sb) { sb = { nome: e.sub, itens: [] }; a.subs.push(sb); } sb.itens.push(e); } else a.direto.push(e); });
    const ord = (arr) => arr.slice().sort((x, y) => x.dia - y.dia || x.nome.localeCompare(y.nome));
    const soma = (arr) => arr.reduce((s, e) => s + e.valor, 0);
    const rename = (area, sub) => `<button class="lnk" data-act="rename-grp" data-cat="${esc(c.id)}" data-area="${esc(area)}"${sub != null ? ` data-sub="${esc(sub)}"` : ''} title="Renomear">`;
    const html = areas.map((a) => {
      const todos = a.direto.concat(...a.subs.map((x) => x.itens));
      return `<div class="marea"><div class="marea-h">${rename(a.nome)}${esc(a.nome)}</button><span>${brl(soma(todos))}</span></div>${ord(a.direto).map((e) => entradaHtml(e, m)).join('')}${a.subs.map((sb) => `<div class="msub"><div class="marea-h">${rename(a.nome, sb.nome)}${esc(sb.nome)}</button><span>${brl(soma(sb.itens))}</span></div>${ord(sb.itens).map((e) => entradaHtml(e, m)).join('')}</div>`).join('')}</div>`;
    }).join('');
    return `<div class="mcat"><div class="mcat-h"><span>${esc(c.nome)}</span><span>${brl(total)}</span></div><div class="mcat-bar"><i style="width:${totalMes > 0 ? Math.max(2, Math.min(100, (total / totalMes) * 100)).toFixed(1) : 0}%"></i></div>${html}</div>`;
  }).join('');
}
function orcEl(m) {
  const C = S.C; const orc = C.orcamento[m]; const custom = S.plan.orcamento[m] != null; const ri = RI++; const ti = FIRST_ED ? 0 : -1; FIRST_ED = false;
  return `<span class="big ed${orc > 0 ? '' : ' z'}" data-k="orc" data-m="${m}" data-ri="${ri}" data-v="${orc}" data-fmt="brl" data-custom="${custom ? 1 : 0}" tabindex="${ti}" title="Clique para definir o orçamento de ${MES_LONGO[m]}">${orc > 0 ? brl0(orc) : 'Definir'}</span>`;
}
// conteúdo de um mês (só é montado quando o mês está aberto; ao abrir, mes-toggle monta na hora)
function mesPadHtml(m, ents) {
  const C = S.C; ents = ents || entradasMes(m); const gasto = C.despesas[m]; const orc = C.orcamento[m]; const uso = C.usoOrc[m];
  const status = uso == null ? '' : uso > 1 ? '<span class="chip warn">Acima do orçamento</span>' : uso > 0.85 ? '<span class="chip warn">Atenção</span>' : '<span class="chip ok">Dentro do orçamento</span>';
  const corpo = ents.length ? categoriasMes(m, ents, gasto) : `<p class="mvazio">${esc(voz('mes_vazio'))}</p>`;
  const resta = orc > 0 ? (C.restante[m] >= 0 ? `Restam ${brl(C.restante[m])}` : `${brl(-C.restante[m])} acima do orçado`) : voz('orc_definir', { mes: MES_LONGO[m] });
  return `<div class="macc-pad">
      <div class="mbud"><div class="mbud-l"><small>Orçamento de ${MES_LONGO[m]}</small>${orcEl(m)}</div><div class="btn-row">${status}${orc > 0 ? '<button class="btn sm" data-act="orc-all" data-m="' + m + '">Usar em todos os meses</button>' : ''}</div></div>
      <p class="muted" style="font-size:13.5px;margin:0 0 4px">${esc(resta)}${/[.!?]$/.test(resta) ? '' : '.'} Entradas do mês: ${brl0(C.receita[m])}. Sobra para investir: <b>${brl0(C.investAlocado[m])}</b>.</p>
      ${corpo}
      <div class="mfoot"><button class="btn primary sm" data-act="add-lanc" data-mes="${m}">${I.plus}Lançamento</button><button class="btn sm" data-act="ingest-open">Importar extrato</button><button class="btn sm" data-act="add-item" data-kind="desp" data-preset-mes="${m}">Gasto previsto ou parcelado</button></div></div>`;
}
function mesAccordion(m) {
  const C = S.C; const ents = entradasMes(m); const gasto = C.despesas[m]; const orc = C.orcamento[m]; const uso = C.usoOrc[m];
  const tone = uso == null ? '' : uso > 1 ? 'neg' : uso > 0.85 ? 'warn' : ''; const aberto = S.mesesAbertos.has(m);
  const nReais = ents.filter((e) => e.tipo === 'real').length; const nPrev = ents.length - nReais;
  const meta = ents.length ? [nReais ? `${nReais} ${nReais === 1 ? 'lançamento' : 'lançamentos'}` : '', nPrev ? `${nPrev} ${nPrev === 1 ? 'previsto' : 'previstos'}` : ''].filter(Boolean).join(' · ') : 'Sem lançamentos';
  return `<section class="macc" data-open="${aberto}" data-m="${m}"${S.year === NOW_Y && m === NOW_M ? ' data-now="true"' : ''}><h3 class="macc-h"><button class="macc-btn" data-act="mes-toggle" data-m="${m}" aria-expanded="${aberto}" aria-controls="mes-${m}">
      <span class="macc-ch">${I.chev}</span><span class="macc-nome"><span class="macc-mes">${mesNome(m)}</span><span class="macc-meta">${meta}</span></span>
      <span class="macc-nums"><b>${brl(gasto)}</b><small>${orc > 0 ? 'de ' + brl(orc) : 'sem orçamento'}</small></span>
      <span class="macc-bar ${tone}" aria-hidden="true"><i style="width:${Math.min(100, (uso || 0) * 100).toFixed(1)}%"></i></span></button></h3>
    <div class="macc-body" id="mes-${m}"><div class="macc-inner">${aberto ? mesPadHtml(m, ents) : `<div class="macc-pad" data-lazy="${m}"></div>`}</div></div></section>`;
}
function viewDespesas() {
  const p = S.plan; const C = S.C; RI = 0; FIRST_ED = true; const T = C.T; const mr = S.year === NOW_Y ? NOW_M : S.mes;
  indiceMeses(); // dados mudam entre desenhos: o índice é refeito a cada vez
  const nImp = p.lancamentos.filter((l) => l.origem && l.origem !== 'manual').length;
  const vazio = !p.lancamentos.length && !(T.despesas > 0) && !(T.orcamento > 0);
  const sum = vazio ? `<section class="cc-empty"><div class="cc-empty-ic" aria-hidden="true">${I.plus}</div><div class="cc-empty-tx"><h3>Seu ${S.year} começa pelo extrato</h3><p>Arraste o CSV ou OFX do seu banco: categorizamos tudo e você só confere. Leva menos de um minuto.</p></div><div class="cc-empty-acts"><button class="btn primary lg" data-act="ingest-open">Importar extrato</button><button class="btn ghost" data-act="add-lanc" data-mes="${mr}">Lançar manualmente</button></div></section>` : `<section class="macc-sum"><div><h3>Gastos de ${S.year}</h3><div class="b-nums"><div><small>Gasto no ano</small><span class="big">${brl0(T.despesas)}</span></div><div><small>Orçado no ano</small><span class="big${T.orcamento > 0 ? '' : ' z'}">${T.orcamento > 0 ? brl0(T.orcamento) : '–'}</span></div><div><small>Média por mês</small><span class="big">${brl0(T.despesas / 12)}</span></div></div>
      <p class="b-note">${p.lancamentos.length} ${p.lancamentos.length === 1 ? 'lançamento real' : 'lançamentos reais'}${nImp ? `, ${nImp} importados` : ''}. ${esc(voz(C.usoOrc[mr] == null ? 'orc_definir' : C.usoOrc[mr] > 1 ? 'orc_estourou' : 'orc_ok', { mes: MES_LONGO[mr], pct: pct(C.usoOrc[mr]), restante: brl0(C.restante[mr]), valor: brl0(-C.restante[mr]) }))}</p></div>
    <div><div class="chart" id="b-chart"></div></div></section>`;
  const acts = `<div class="ccacts">${vazio ? '' : `<button class="btn primary" data-act="ingest-open">${I.plus}Importar extrato</button><button class="btn" data-act="add-lanc" data-mes="${mr}">Lançamento</button>`}<button class="btn" data-act="cats" data-kind="desp">Categorias</button><span class="grow"></span><button class="btn ghost" data-act="mes-todos" data-abrir="1">Expandir tudo</button><button class="btn ghost" data-act="mes-todos" data-abrir="0">Recolher tudo</button></div>`;
  return `<div class="page-h"><div><h2 class="title">Conta corrente</h2><p class="sub">Cada mês é um bloco: abra para ver as categorias e os lançamentos reais.</p></div><div class="acts">${yearControl()}</div></div>${sum}${acts}${MES.map((_, m) => mesAccordion(m)).join('')}`;
}

/* ---------------- Rendas: painel de estudo + detalhe recolhível ---------------- */
function analiseRendaAtual() { return E.analiseRenda({ C: S.C, meses: mesesDecorridos(), rendas: S.plan.rendas, rendaCats: S.plan.rendaCats }); }
function detalheRendas() {
  const p = S.plan; const C = S.C; const m = S.mes;
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
    ${aberto ? `<div class="sheet-tools ltools">${mesChips()}<div class="ltools-r">${modoToggle()}<button class="btn sm" data-act="cats" data-kind="renda">Categorias</button></div></div><div class="sheet-body">${body}</div>` : ''}</section>`;
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
  const k1 = kpi(S.year === NOW_Y ? `Entradas${ate}` : `Entradas em ${S.year}`, `<span class="num">${brl0(R.ateAgora)}</span>`, `Média de ${brl0(R.mediaMes)} por mês.${S.year === NOW_Y && R.anoPrevisto > R.ateAgora + 1 ? ` Previsto no ano: ${brl0(R.anoPrevisto)}.` : ''}`);
  const k2 = R.previsibilidade == null ? kpi('Previsibilidade', '–', 'Aparece quando houver rendas registradas.')
    : kpi('Previsibilidade', pct(R.previsibilidade), `da renda vem de fontes que se repetem todo mês (${brl0(R.recorrenteMes)} por mês).`, barra(R.previsibilidade, R.previsibilidade >= 0.8 ? 'ok' : R.previsibilidade < 0.5 ? 'warn' : ''));
  const k3 = R.poupanca == null ? kpi('Taxa de poupança', '–', 'Aparece quando houver entradas.')
    : kpi('Taxa de poupança', pct(R.poupanca), R.poupanca >= 0 ? `do que entrou sobrou depois dos gastos: ${brl0(R.sobraMes)} por mês.` : `Os gastos passaram as entradas em ${brl0(-R.sobraMes)} por mês.`, barra(Math.max(0, R.poupanca), R.poupanca >= 0.2 ? 'ok' : R.poupanca < 0.1 ? 'warn' : ''));
  const k4 = kpi('Renda passiva', R.passiva == null ? '–' : pct(R.passiva, 1), R.passivaMes > 0 ? `das entradas vem de proventos: ${brl0(R.passivaMes)} por mês. <button class="lnk strong" data-act="nav" data-view="pro">Ver Proventos</button>` : 'Nenhum provento ainda. Ele entra aqui sozinho quando você registra em Proventos.');
  const cores = R.porCat.map((c, i) => [PAL[i % 6], c.nome]);
  const leg = legenda(cores.concat(R.dividendosAte > 0 ? [['var(--c3)', 'Proventos']] : []).concat([['var(--c6)', 'Gastos']]));
  const top = R.fontes.slice(0, 7);
  const fontes = top.length ? `<ul class="rank">${top.map((f, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(f.nome)}">${esc(f.nome)}</b><small title="Recebida em ${f.mesesCom} de ${R.meses} meses">${esc(f.catNome)} · <span class="tagr${f.recorrente ? ' on' : ''}">${f.recorrente ? 'Recorrente' : 'Eventual'}</span></small></span><span class="rk-t"><i style="width:${(top[0].ate > 0 ? (f.ate / top[0].ate) * 100 : 0).toFixed(1)}%;background:${PAL[Math.max(0, R.porCat.findIndex((c) => c.id === f.cat)) % 6]}"></i></span><span class="rk-v">${brl0(f.ate)}<small>${pct(R.rendasAte > 0 ? f.ate / R.rendasAte : 0)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Nenhuma renda recebida até agora neste ano.</p>';
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
  return `${pageHead('Rendas', sub, acts)}<div class="kpis">${k1}${k2}${k3}${k4}</div>
    <div class="dgrid">
      <section class="card"><div class="c-h"><h3>Entradas mês a mês</h3>${leg}</div><div class="chart" id="r-chart"></div><p class="cap">A marca vermelha é o total de gastos do mês: barra acima da marca é mês em que sobrou dinheiro.</p></section>
      <section class="card"><div class="c-h"><h3>Estabilidade</h3></div>${estab}</section></div>
    <div class="dgrid two">
      <section class="card"><div class="c-h"><h3>De onde vem</h3><small class="c-note">${S.year === NOW_Y ? 'até ' + MES_LONGO[NOW_M] : 'no ano'}</small></div>${fontes}</section>
      <section class="card study"><div class="c-h"><h3>Para estudar</h3></div><ul class="insights">${ins.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul></section></div>
    ${detalheRendas()}`;
}

function drawLedger() {
  if (S.screen !== 'app' || !S.plan) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (S.view === 'despesas' && $('#b-chart')) chartBars($('#b-chart'), { labels: MES, cur, height: 170, aria: 'Gastos e orçamento por mês. Clique em um mês para abri-lo.', bars: [{ color: 'var(--c2)', values: C.despesas }], marks: [{ color: 'var(--c4)', values: C.orcamento }],
    onPick: (i) => { S.mesesAbertos.add(i); S.mes = i; render(); const el = document.getElementById('mes-' + i); if (el) el.closest('.macc').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    tip: (i) => `<b>${MES[i]}</b><br>Gasto: ${brl0(C.despesas[i])}<br>Orçado: ${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : 'sem orçamento'}` });
  if (S.view === 'rendas' && $('#r-chart')) {
    const cats = S.plan.rendaCats.filter((c) => E.sum(C.rendaCat[c.id] || E.z()) > 0);
    chartBars($('#r-chart'), { labels: MES, cur, height: typeof altura === 'function' ? altura($('#r-chart')) : 210, aria: 'Entradas por mês por categoria, com o total de gastos marcado. Clique em um mês para ver o detalhe.',
      bars: cats.map((c, i) => ({ color: PAL[i % 6], values: C.rendaCat[c.id] })).concat([{ color: 'var(--c3)', values: C.dividendos }]), marks: [{ color: 'var(--c6)', values: C.despesas }],
      onPick: (i) => { S.mes = i; S.modo = 'mes'; S.planilha.rendas = true; render(); const sec = document.querySelector('.sheet-sec'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
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
function openLanc(id, preset) {
  const p = S.plan; preset = preset || {};
  if (!p.catsDesp.length) { toast('Crie uma categoria primeiro.'); openCats('desp'); return; }
  const l = id ? p.lancamentos.find((x) => x.id === id) : null; const mes = preset.mes != null ? preset.mes : S.year === NOW_Y ? NOW_M : S.mes; const h = new Date();
  const dataPad = l ? l.data : (S.year === h.getFullYear() && mes === h.getMonth() ? `${h.getFullYear()}-${pad2(h.getMonth() + 1)}-${pad2(h.getDate())}` : `${S.year}-${pad2(mes + 1)}-01`);
  const aprender = !!(l && l.origem && l.origem !== 'manual');
  const f = openModal({
    title: l ? 'Editar lançamento' : 'Novo lançamento', danger: l ? 'Excluir' : null,
    body: `<div class="fld-2"><label class="fld"><span>Data</span><input type="date" name="data" value="${esc(dataPad)}"></label><label class="fld"><span>Valor (R$)</span><input name="valor" inputmode="decimal" value="${l ? esc(String(Math.abs(l.valor)).replace('.', ',')) : ''}" placeholder="0,00" autocomplete="off"></label></div>
      <label class="fld"><span>Descrição</span><input name="desc" value="${esc(l ? l.desc : '')}" autocomplete="off"></label>
      <label class="chk"><input type="checkbox" name="estorno" ${l && l.valor < 0 ? 'checked' : ''}><span><b>É estorno ou reembolso</b><small>Reduz o gasto do mês em vez de somar.</small></span></label>
      <label class="fld"><span>Categoria</span>${sel('cat', p.catsDesp.map((c) => [c.id, c.nome]), l ? l.cat : p.catsDesp[0].id)}</label>
      <div class="fld-2"><label class="fld"><span>Área <small>(ex.: Moradia)</small></span><input name="area" list="dl-area" value="${esc(l ? l.area : '')}" autocomplete="off"></label><label class="fld"><span>Subárea <small>(opcional)</small></span><input name="sub" list="dl-sub" value="${esc(l ? l.sub || '' : '')}" autocomplete="off"></label></div>
      ${aprender ? '<label class="chk"><input type="checkbox" name="lembrar" checked><span><b>Lembrar para lançamentos parecidos</b><small>Nas próximas importações, este estabelecimento já entra com esta categoria.</small></span></label>' : ''}
      ${dlist('dl-area', p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area)))}${dlist('dl-sub', p.despesas.map((x) => x.sub).concat(p.lancamentos.map((x) => x.sub)))}`,
    onDanger: () => { confirmBox('Excluir este lançamento?', `“${l.desc}” será removido.`, 'Excluir', () => { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x.id !== l.id); commit(); }); return false; },
    onOk: (d, err) => {
      const data = String(d.data || ''); const dt = E.parseDataISO(data);
      if (!dt || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !anoValido(dt.ano)) return bad(err, 'Informe uma data válida.');
      const v = E.parseValor(d.valor); if (Number.isNaN(v) || v === 0) return bad(err, 'Informe o valor do lançamento.');
      const desc = (d.desc || '').trim(); if (!desc) return bad(err, 'Informe a descrição.');
      const dados = { data, desc, valor: E.r2(d.estorno ? -Math.abs(v) : Math.abs(v)), cat: d.cat, area: (d.area || '').trim() || 'Outros', sub: (d.sub || '').trim() };
      const alvo = dt.ano === S.year ? p : ensurePlan(dt.ano);
      if (l) { if (alvo !== p) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x.id !== l.id); Object.assign(l, dados); alvo.lancamentos.push(l); savePlanNow(dt.ano); } else Object.assign(l, dados); }
      else { alvo.lancamentos.push(Object.assign({ id: uid(), origem: 'manual' }, dados)); if (alvo !== p) savePlanNow(dt.ano); }
      if (d.lembrar) { S.profile.regras = FPIngest.aprenderRegra(S.profile.regras, { descricao: desc, destino: 'despesa', catTipo: tipoDaCategoria(dados.cat), area: dados.area, sub: dados.sub, ativo: null }); touch('profile'); }
      if (dt.ano === S.year) { S.mesesAbertos.add(dt.mes); S.mes = dt.mes; } else toast(`Lançamento salvo no planejamento de ${dt.ano}.`);
      commit();
    },
  });
  return f;
}
