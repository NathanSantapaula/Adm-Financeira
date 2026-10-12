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

function viewAssets(kind) {
  const p = S.plan; const C = S.C; const field = kind === 'inv' ? 'ap' : 'pr'; const flt = (S.filter[kind] || '').trim().toLowerCase();
  const tree = E.buildAssetTree(p.ativos, field); RI = 0; FIRST_ED = true; let b = '';
  if (kind === 'inv') b += labRow('Sobra do mês (entradas menos gastos)', C.investAlocado, { cls: 'r-note' });
  const rows = assetRows(tree, kind, field, flt, 0); b += rows;
  if (!p.ativos.length) b += '<tr class="r-note"><td class="lab" colspan="14"><div class="in"><span>Nenhum ativo ainda. Adicione CDBs, títulos do Tesouro, ações, FIIs e outros.</span></div></td></tr>';
  else if (flt && !rows) b += `<tr class="r-note"><td class="lab" colspan="14"><div class="in"><span>Nenhum ativo encontrado para “${esc(S.filter[kind])}”.</span></div></td></tr>`;
  if (kind === 'inv') {
    b += labRow('Aportes', C.aportes, { cls: 'r-g' }) + labRow('Dividendos reinvestidos', C.dividendos, { cls: 'r-g' }) + labRow('Total aplicado no mês', C.aplicado, { cls: 'r-total' })
      + labRow('Diferença (sobra do mês menos aportes)', C.diferenca, { cls: 'r-g' }) + labRow('Meta (aporte mensal mais dividendos)', C.meta, { cls: 'r-total' });
  } else b += labRow('Rentabilidade da renda fixa', C.rentab, { cls: 'r-g' }) + labRow('Dividendos', C.dividendos, { cls: 'r-g' }) + labRow('Total de proventos', C.faturamento, { cls: 'r-total' });
  const title = kind === 'inv' ? 'Investimentos' : 'Proventos';
  const sub = kind === 'inv' ? 'Quanto foi aplicado em cada ativo, mês a mês. Valores negativos são resgates.' : 'Dividendos e rendimentos recebidos de cada ativo. Em renda fixa, o valor conta como rentabilidade.';
  const acts = `<input class="search" type="search" data-filter="${kind}" placeholder="Buscar ativo" value="${esc(S.filter[kind])}" aria-label="Buscar ativo"><button class="btn" data-act="expand-all" data-kind="${kind}">Expandir</button><button class="btn" data-act="collapse-all" data-kind="${kind}">Recolher</button>${addBtn('add-ativo', 'Adicionar ativo')}`;
  return `${pageHead(title, sub, acts)}<div class="tablewrap"><table class="grid">${headRow('Tipo, classe e ativo')}<tbody>${b}</tbody></table></div>`;
}

/* ---------- Carteira ---------- */
function positions() {
  const map = {};
  Object.keys(S.plans).forEach((y) => { (S.plans[y].ativos || []).forEach((a) => { const k = E.ativoKey(a); map[k] = (map[k] || 0) + E.sum(a.ap); }); });
  return map;
}
function cartModel() {
  const p = S.plan; const pos = positions();
  const items = p.ativos.map((a) => {
    const k = E.ativoKey(a); const e = S.profile.carteira.find((x) => x.k === k) || {}; const manual = e.valor != null;
    return { a, k, alvo: +e.alvo || 0, valor: manual ? Math.max(0, +e.valor) : Math.max(0, pos[k] || 0), auto: !manual, preco: e.preco > 0 ? +e.preco : null };
  });
  const sumAlvo = items.reduce((s, i) => s + i.alvo, 0); const total = items.reduce((s, i) => s + i.valor, 0);
  const mes = S.cart.mes == null ? S.mes : S.cart.mes; const planejado = Math.max(0, S.C.investAlocado[mes]);
  const aporte = S.cart.aporte != null ? S.cart.aporte : (+p.settings.metaAporte > 0 ? +p.settings.metaAporte : planejado);
  const rb = E.rebalance(items.map((i) => ({ w: i.alvo, v: i.valor })), aporte);
  items.forEach((i, n) => {
    i.sug = rb.alloc[n]; i.pctAtual = total > 0 ? (i.valor / total) * 100 : 0; i.pctAlvo = rb.W > 0 ? (i.alvo / rb.W) * 100 : 0; i.desvio = i.pctAtual - i.pctAlvo;
    i.cotas = i.preco && i.sug > 0 ? Math.floor(i.sug / i.preco + 1e-9) : null;
  });
  return { items, sumAlvo, total, mes, planejado, aporte, rb };
}
function lockedHtml(key) {
  const txt = { cart: ['A aba Carteira faz parte da assessoria', `Defina o percentual-alvo de cada ativo e veja, a cada aporte, onde investir para manter a carteira equilibrada. Na assessoria, a carteira é montada junto com ${CFG.consultor}.`],
    importar: ['A importação de planilhas faz parte da assessoria', 'Importe seus dados de um arquivo .xlsx e receba a carteira montada pelo seu assessor já pronta para usar. O modelo de planilha pode ser baixado abaixo.'] }[key];
  return `<div class="locked"><div class="lock-ic">${I.lock}</div><div><h3>${txt[0]}</h3><p>${txt[1]}</p><div class="btn-row"><button class="btn primary" data-act="upgrade">Conhecer a assessoria</button><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></div></div>`;
}
function viewCart() {
  if (gated('cart')) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}${lockedHtml('cart')}`;
  const p = S.plan;
  if (!p.ativos.length) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}<div class="empty-state"><h2>Cadastre seus ativos primeiro</h2><p>A Carteira usa os ativos da aba Investimentos. Adicione-os lá ou importe a planilha com a carteira que o seu assessor montou.</p><div class="btn-row"><button class="btn primary" data-act="nav" data-view="inv">Ir para Investimentos</button><button class="btn" data-act="admin-open">Importar planilha</button></div></div>`;
  const M = cartModel(); const { items } = M; RI = 0; FIRST_ED = true;
  const okAlvo = Math.abs(M.sumAlvo - 100) < 0.05;
  const chip = M.sumAlvo <= 0 ? '<span class="chip warn">Defina o alvo (%) de cada ativo</span>' : okAlvo ? '<span class="chip ok">Alvos somam 100%</span>' : `<span class="chip warn">Alvos somam ${fmtPct(M.sumAlvo)}. Normalize para 100%</span>`;
  const cm = items.filter((i) => i.sug > 0.004).sort((a, b) => b.sug - a.sug);
  const out = M.rb.W <= 0 ? '<p class="mmsg">Informe o percentual-alvo dos ativos na tabela abaixo para ver onde investir.</p>' : M.aporte <= 0 ? '<p class="mmsg">Informe um valor de aporte maior que zero.</p>'
    : `<ol class="alloc">${cm.map((i) => `<li><span class="a-n">${esc(i.a.nome)}<small>${esc(i.a.classe)}</small></span><span class="a-p">${i.cotas != null ? `≈ ${i.cotas} ${i.cotas === 1 ? 'cota' : 'cotas'}` : ''}</span><span class="a-v">${brl(i.sug)}</span></li>`).join('')}</ol>
      <p class="cap">O aporte vai primeiro para os ativos mais abaixo do alvo, sem vender nada. Se todos estiverem no alvo, divide pelos percentuais. As sugestões seguem as metas que você definiu.</p>`;
  const mesSel = `<select data-cart="mes" aria-label="Mês do aporte">${MES.map((m, i) => `<option value="${i}" ${M.mes === i ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
  const painel = `<div class="card cart-top"><div class="cart-in"><label class="fld"><span>Mês do aporte</span>${mesSel}</label>
    <label class="fld"><span>Valor do aporte <small>${S.cart.aporte == null ? '(da sua meta)' : '(digitado)'}</small></span><input class="in-s" data-cart="aporte" inputmode="decimal" value="${nf.format(M.aporte)}" aria-label="Valor do aporte em reais"></label>${S.cart.aporte != null ? '<button class="btn" data-act="cart-auto">Usar valor da meta</button>' : ''}</div>
    <div class="cart-out"><h3>Onde investir ${brl(M.aporte)} em ${MES_LONGO[M.mes]}</h3>${out}${cm.length ? `<div class="btn-row"><button class="btn primary" data-act="cart-register">Registrar em Investimentos (${MES[M.mes]})</button></div>` : ''}</div></div>`;
  const byClass = [];
  items.forEach((i) => { let g = byClass.find((x) => x.classe === i.a.classe && x.tipo === i.a.tipo); if (!g) { g = { tipo: i.a.tipo, classe: i.a.classe, items: [] }; byClass.push(g); } g.items.push(i); });
  const clsRows = byClass.map((g) => { const at = g.items.reduce((s, i) => s + i.pctAtual, 0); const al = g.items.reduce((s, i) => s + i.pctAlvo, 0); const mx = Math.max(40, at, al);
    return `<tr><td>${esc(g.classe)}</td><td><div class="meter" role="img" aria-label="Atual ${fmtPct(at)}, alvo ${fmtPct(al)}"><i style="width:${(at / mx) * 100}%"></i><b style="left:${(al / mx) * 100}%"></b></div></td><td class="num">${fmtPct(al)}</td><td class="num">${fmtPct(at)}</td><td class="num ${at - al < -0.05 ? 'under' : at - al > 0.05 ? 'over' : ''}">${fmtPp(at - al)}</td></tr>`; }).join('');
  const classTbl = M.rb.W > 0 ? `<div class="sec-h"><div><h3>Equilíbrio por classe</h3><p>A barra mostra quanto a classe pesa hoje; o traço marca o alvo.</p></div></div><div class="card flush"><table class="mini"><thead><tr><th>Classe</th><th></th><th class="num">Alvo</th><th class="num">Atual</th><th class="num">Desvio</th></tr></thead><tbody>${clsRows}</tbody></table></div>` : '';
  let body = '';
  byClass.forEach((g) => {
    const s = (f) => g.items.reduce((a, i) => a + f(i), 0);
    body += `<tr class="r-g d1"><td class="lab"><div class="in"><span>${esc(g.classe)}</span></div></td><td class="num">${fmtPct(s((i) => i.alvo))}</td><td class="num">${fmt(s((i) => i.valor))}</td><td class="num"></td><td class="num">${fmtPct(s((i) => i.pctAtual))}</td><td class="num">${fmtPp(s((i) => i.desvio))}</td><td class="num">${fmt(s((i) => i.sug))}</td><td class="num"></td></tr>`;
    g.items.forEach((i) => { const ri = RI++; const ed = (k, col, v, o) => cell(v, col, Object.assign({ k, id: i.k, ri, col: true }, o || {}));
      body += `<tr><td class="lab"><div class="in" style="--d:1"><span>${esc(i.a.nome)}</span></div></td>${ed('al', 0, i.alvo, { fmt: 'pct' })}${ed('va', 1, i.valor, { auto: i.auto })}${ed('pc', 2, i.preco || 0)}<td class="num${i.pctAtual < 0.005 ? ' z' : ''}">${fmtPct(i.pctAtual)}</td><td class="num ${i.desvio < -0.05 ? 'under' : i.desvio > 0.05 ? 'over' : 'z'}">${fmtPp(i.desvio)}</td><td class="num sug${i.sug > 0 ? ' pos' : ' z'}">${fmt(i.sug)}</td><td class="num${i.cotas ? '' : ' z'}">${i.cotas != null ? i.cotas : '–'}</td></tr>`; });
  });
  body += `<tr class="r-total"><td class="lab"><div class="in"><span>Total</span></div></td><td class="num">${fmtPct(M.sumAlvo)}</td><td class="num">${fmt(M.total)}</td><td class="num"></td><td class="num">${M.total > 0 ? '100%' : '–'}</td><td class="num"></td><td class="num">${fmt(items.reduce((a, i) => a + i.sug, 0))}</td><td class="num"></td></tr>`;
  const ini = S.profile.patrimonioInicial; const aviso = ini > M.total + 1 ? `<div class="notice">Você informou ${brl0(ini)} de patrimônio inicial, mas só ${brl0(M.total)} estão distribuídos nos ativos. Digite o valor atual de cada ativo na coluna “Posição atual” para um rebalanceamento preciso.</div>` : '';
  const perfilNome = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado ? E.PERFIS[S.profile.perfilInvestidor.resultado].nome : '';
  const acts = `${chip}<button class="btn" data-act="cart-norm">Normalizar para 100%</button><button class="btn" data-act="cart-equal">Distribuir igualmente</button>${perfilNome ? `<button class="btn" data-act="cart-perfil">Usar alocação do perfil ${perfilNome.toLowerCase()}</button>` : ''}<button class="btn" data-act="cart-clear">Limpar alvos</button>`;
  return `${pageHead('Carteira', 'Adapte a alocação-alvo à sua carteira. A cada aporte mensal, veja onde investir para manter tudo equilibrado.')}${aviso}<div class="acts wrap-acts">${acts}</div>${painel}${classTbl}<div class="sec-h"><div><h3>Alvo e posição por ativo</h3></div></div>
    <div class="tablewrap"><table class="grid grid-cart"><thead><tr><th class="lab">Ativo</th><th>Alvo (%)</th><th>Posição atual (R$)</th><th>Preço (R$)</th><th>Atual (%)</th><th>Desvio</th><th>Aporte sugerido (R$)</th><th>Cotas</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="cap">Posição atual: soma dos aportes de todos os anos, a menos que você digite o valor de mercado (apague para voltar ao automático). Preço é opcional e serve para estimar as cotas.</p>
    <p class="cap disc">Ferramenta de organização. As sugestões seguem os percentuais-alvo definidos por você e não constituem recomendação individual de investimento.</p>`;
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
