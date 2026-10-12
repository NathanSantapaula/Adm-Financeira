/* Rendas e Conta corrente: categorias livres, hierarquia flexível, orçamento do mês e parcelamento consolidado. */
'use strict';
const bad = (err, msg) => { err(msg); return false; };
const mesChips = () => `<div class="chips" role="tablist" aria-label="Mês">${MES.map((m, i) => `<button role="tab" aria-selected="${S.mes === i}" class="chip-m${S.mes === i ? ' on' : ''}${S.year === NOW_Y && i === NOW_M ? ' now' : ''}" data-act="mes" data-m="${i}">${m}</button>`).join('')}</div>`;
const modoToggle = () => `<div class="seg" role="group" aria-label="Visualização"><button class="${S.modo === 'mes' ? 'on' : ''}" data-act="modo" data-modo="mes">Mês</button><button class="${S.modo === 'ano' ? 'on' : ''}" data-act="modo" data-modo="ano">Ano</button></div>`;
const somaItens = (items) => items.reduce((s, it) => E.add(s, E.itemValores(it, S.year)), E.z());

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
function areasDe(items) {
  const areas = [];
  items.forEach((it) => {
    let a = areas.find((x) => x.nome === it.area); if (!a) { a = { nome: it.area, subs: [], items: [] }; areas.push(a); }
    if (it.sub) { let s = a.subs.find((x) => x.nome === it.sub); if (!s) { s = { nome: it.sub, items: [] }; a.subs.push(s); } s.items.push(it); } else a.items.push(it);
  });
  return areas;
}
const grpH = (cls, label, total, cat, area, sub) => `<div class="${cls}"><button class="lnk" data-act="rename-grp" data-cat="${cat}" data-area="${esc(area)}"${sub != null ? ` data-sub="${esc(sub)}"` : ''} title="Renomear">${esc(label)}</button><span>${brl(total)}</span>${sub == null ? `<button class="icon-btn sm" data-act="add-item" data-kind="desp" data-cat="${cat}" data-area="${esc(area)}" aria-label="Adicionar em ${esc(label)}">${I.plus}</button>` : ''}</div>`;

function despMes(cat, m) {
  const items = S.plan.despesas.filter((i) => i.cat === cat.id);
  if (!items.length) return emptyCat('Nenhum gasto nesta categoria.', 'desp', cat.id);
  return areasDe(items).map((a) => {
    const tA = E.sum(somaItens(a.items.concat(...a.subs.map((s) => s.items))).slice(m, m + 1));
    const subs = a.subs.map((s) => `<div class="lsub">${grpH('lsub-h', s.nome, somaItens(s.items)[m], cat.id, a.nome, s.nome)}${s.items.map((it) => itemRow('desp', it, m)).join('')}</div>`).join('');
    return `<div class="larea">${grpH('larea-h', a.nome, tA, cat.id, a.nome)}${a.items.map((it) => itemRow('desp', it, m)).join('')}${subs}</div>`;
  }).join('');
}

function budgetHero(m) {
  const C = S.C; const p = S.plan; const orc = C.orcamento[m]; const gasto = C.despesas[m]; const resta = orc - gasto; const uso = C.usoOrc[m];
  const tone = uso == null ? '' : uso > 1 ? 'neg' : uso > 0.85 ? 'warn' : ''; const custom = p.orcamento[m] != null;
  const ri = RI++; const ti = FIRST_ED ? 0 : -1; FIRST_ED = false;
  const orcEl = `<span class="big ed${orc > 0 ? '' : ' z'}" data-k="orc" data-m="${m}" data-ri="${ri}" data-v="${orc}" data-fmt="brl" data-custom="${custom ? 1 : 0}" tabindex="${ti}" title="Clique para definir o orçamento de ${MES_LONGO[m]}">${orc > 0 ? brl0(orc) : 'Definir'}</span>`;
  const status = uso == null ? 'Defina o orçamento do mês para acompanhar quanto ainda pode gastar.' : uso > 1 ? `Você passou do orçamento em ${brl0(-resta)} (${pct(uso)} do orçado).` : `${pct(uso)} do orçamento já foi usado.`;
  return `<section class="card budget"><div class="b-main"><div class="b-head"><h3>Orçamento de ${MES_LONGO[m]} de ${S.year}</h3>${orc > 0 ? '<button class="lnk strong" data-act="orc-all">Usar este valor em todos os meses</button>' : ''}</div>
    <div class="b-nums"><div><small>Orçado</small>${orcEl}</div><div><small>Gasto</small><span class="big">${brl0(gasto)}</span></div><div><small>${resta >= 0 || !(orc > 0) ? 'Restante' : 'Acima do orçado'}</small><span class="big ${tone}">${orc > 0 ? brl0(Math.abs(resta)) : '–'}</span></div></div>
    <div class="bar big ${tone}" role="img" aria-label="${uso == null ? 'Sem orçamento' : pct(uso) + ' do orçamento usado'}"><i style="width:${Math.min(100, (uso || 0) * 100)}%"></i></div>
    <p class="b-note">${status} Entradas do mês: ${brl0(C.receita[m])}. Sobra para investir: <b>${brl0(C.investAlocado[m])}</b>.</p></div>
    <div class="b-chart"><div class="chart" id="b-chart"></div></div></section>`;
}

function viewDespesas() {
  const p = S.plan; const C = S.C; const m = S.mes; RI = 0; FIRST_ED = true;
  const hero = budgetHero(m); const carry = planCtx().carry;
  const tools = `<div class="ltools">${mesChips()}<div class="ltools-r">${modoToggle()}<button class="btn" data-act="cats" data-kind="desp">Categorias</button>${addBtn('add-item', 'Adicionar gasto', 'data-kind="desp"')}</div></div>`;
  let body = '';
  if (S.modo === 'mes') {
    body = p.catsDesp.map((cat) => catSection('desp', cat, C.despCat[cat.id] ? somaItens(p.despesas.filter((i) => i.cat === cat.id))[m] : 0, despMes(cat, m))).join('');
    if (carry.length) body += `<section class="lcat herd"><header class="lcat-h"><span class="chev-sp"></span><h3>Parcelas de anos anteriores</h3><span class="lcat-t">${brl(carry.reduce((s, it) => s + it.valores[m], 0))}</span></header><div class="lbody">${carry.map((it) => itemRow('desp', it, m)).join('')}</div></section>`;
    if (!p.catsDesp.length) body = '<p class="empty-s">Crie a primeira categoria de gasto em “Categorias”.</p>';
  } else {
    let b = '';
    p.catsDesp.forEach((cat) => {
      const items = p.despesas.filter((i) => i.cat === cat.id); b += groupRow({ label: cat.nome, depth: 0, v: somaItens(items) });
      areasDe(items).forEach((a) => {
        b += groupRow({ label: a.nome, depth: 1, v: somaItens(a.items.concat(...a.subs.map((s) => s.items))) });
        const row = (it, d) => { const locked = !!it.parcel; const ri = locked ? null : RI++; return `<tr><td class="lab"><div class="in" style="--d:${d}"><button class="lnk" data-act="edit-item" data-kind="desp" data-id="${esc(it.id)}">${esc(it.nome)}</button>${it.parcel ? `<small class="tag">${it.parcel.n}x</small>` : ''}</div></td>${cells(E.itemValores(it, S.year), locked ? {} : { k: 'dv', id: it.id, ri })}</tr>`; };
        a.items.forEach((it) => { b += row(it, 2); });
        a.subs.forEach((s) => { b += groupRow({ label: s.nome, depth: 2, v: somaItens(s.items) }); s.items.forEach((it) => { b += row(it, 3); }); });
      });
    });
    if (carry.length) { b += groupRow({ label: 'Parcelas de anos anteriores', depth: 0, v: carry.reduce((s, it) => E.add(s, it.valores), E.z()) }); carry.forEach((it) => { b += `<tr><td class="lab"><div class="in" style="--d:2"><button class="lnk" data-act="year-pick" data-year="${it.herdado}">${esc(it.nome)}</button><small class="tag">de ${it.herdado}</small></div></td>${cells(it.valores)}</tr>`; }); }
    b += labRow('Total de gastos', C.despesas, { cls: 'r-total' }) + labRow('Orçamento', C.orcamento, { cls: 'r-g' }) + labRow('Restante', C.restante, { cls: 'r-g' });
    body = `<div class="tablewrap"><table class="grid">${headRow('Categoria, área e item')}<tbody>${b}</tbody></table></div>`;
  }
  return `<div class="page-h"><div><h2 class="title">Conta corrente</h2></div><div class="acts">${yearControl()}</div></div>${hero}${tools}${body}`;
}

/* ---------------- Rendas ---------------- */
function viewRendas() {
  const p = S.plan; const C = S.C; const m = S.mes; RI = 0; FIRST_ED = true;
  const hero = `<section class="card budget"><div class="b-main"><div class="b-head"><h3>Entradas de ${MES_LONGO[m]} de ${S.year}</h3></div>
    <div class="b-nums"><div><small>Rendas</small><span class="big">${brl0(C.rendas[m])}</span></div><div><small>Dividendos e proventos</small><span class="big">${brl0(C.dividendos[m])}</span></div><div><small>Total de entradas</small><span class="big">${brl0(C.receita[m])}</span></div></div>
    <p class="b-note">Total de entradas no ano: <b>${brl0(C.T.receita)}</b>. Os dividendos entram automaticamente a partir de <button class="lnk strong" data-act="nav" data-view="pro">Proventos</button>.</p></div><div class="b-chart"><div class="chart" id="r-chart"></div></div></section>`;
  const tools = `<div class="ltools">${mesChips()}<div class="ltools-r">${modoToggle()}<button class="btn" data-act="cats" data-kind="renda">Categorias</button>${addBtn('add-item', 'Adicionar renda', 'data-kind="renda"')}</div></div>`;
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
  return `<div class="page-h"><div><h2 class="title">Rendas</h2></div><div class="acts">${yearControl()}</div></div>${hero}${tools}${body}`;
}

function drawLedger() {
  if (S.screen !== 'app' || !S.plan) return; const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1; const pick = (i) => { S.mes = i; render(); };
  if (S.view === 'despesas') chartBars($('#b-chart'), { labels: MES, cur, height: 190, aria: 'Gastos e orçamento por mês. Clique em um mês para selecioná-lo.', bars: [{ color: 'var(--c2)', values: C.despesas }], marks: [{ color: 'var(--c4)', values: C.orcamento }], onPick: pick,
    tip: (i) => `<b>${MES[i]}</b><br>Gasto: ${brl0(C.despesas[i])}<br>Orçado: ${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : 'sem orçamento'}` });
  if (S.view === 'rendas') chartBars($('#r-chart'), { labels: MES, cur, height: 190, aria: 'Entradas por mês. Clique em um mês para selecioná-lo.', bars: [{ color: 'var(--c1)', values: C.rendas }, { color: 'var(--c3)', values: C.dividendos }], onPick: pick,
    tip: (i) => `<b>${MES[i]}</b><br>Rendas: ${brl0(C.rendas[i])}<br>Dividendos: ${brl0(C.dividendos[i])}` });
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
      <label class="pick"><input type="radio" name="tipo" value="mensal" ${parc ? '' : 'checked'}><span><b>Valores mensais</b><small>Você informa o valor de cada mês direto na lista.</small></span></label>
      <label class="pick"><input type="radio" name="tipo" value="parcelado" ${parc ? 'checked' : ''}><span><b>Parcelado</b><small>Um único item: o valor total é dividido pelos meses automaticamente.</small></span></label></fieldset>` : ''}
    <div data-blk="mensal"><div class="fld-2"><label class="fld"><span>Valor mensal fixo <small>(opcional)</small></span><input name="fixo" inputmode="decimal" placeholder="Preenche vários meses de uma vez"></label><label class="fld"><span>A partir de</span>${sel('de', mesOpts(), S.mes)}</label></div></div>
    ${isD ? `<div data-blk="parcelado" hidden><div class="fld-2"><label class="fld"><span>Valor total (R$)</span><input name="total" inputmode="decimal" value="${parc ? esc(String(parc.total).replace('.', ',')) : ''}"></label><label class="fld"><span>Parcelas</span><input name="n" inputmode="numeric" value="${parc ? parc.n : 10}"></label></div>
      <div class="fld-2"><label class="fld"><span>Primeiro mês</span>${sel('pmes', mesOpts(), parc ? parc.mes : S.mes)}</label><label class="fld"><span>Ano</span><input name="pano" inputmode="numeric" maxlength="4" value="${parc ? parc.ano : S.year}"></label></div><p class="mmsg" data-prev></p></div>` : ''}
    ${isD ? dlist('dl-area', p.despesas.map((x) => x.area)) + dlist('dl-sub', p.despesas.map((x) => x.sub)) : ''}`;
  const f = openModal({
    title: it ? (isD ? 'Editar gasto' : 'Editar renda') : (isD ? 'Novo gasto' : 'Nova renda'), body, danger: it ? 'Excluir' : null,
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
