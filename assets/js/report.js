/* Relatório avançado (plano Assessoria), recomendação do assessor e visão do consultor sobre o cliente. */
'use strict';
const posicoesDe = (plans) => { const map = {}; Object.keys(plans).forEach((y) => { (plans[y].ativos || []).forEach((a) => { const k = E.ativoKey(a); map[k] = (map[k] || 0) + E.sum(a.ap); }); }); return map; };
function ctxDe(perfil, plans, ano) { return E.ctxAno(plans, ano, +perfil.patrimonioInicial || 0, perfil.patrimonioAno); }
function carteiraDe(perfil, plans, plan) {
  const pos = posicoesDe(plans); const cart = perfil.carteira || [];
  const itens = plan.ativos.map((a) => { const k = E.ativoKey(a); const e = cart.find((x) => x.k === k) || {}; return { a, k, alvo: +e.alvo || 0, valor: e.valor != null ? Math.max(0, +e.valor) : Math.max(0, pos[k] || 0) }; });
  const W = itens.reduce((s, i) => s + i.alvo, 0); const tot = itens.reduce((s, i) => s + i.valor, 0);
  itens.forEach((i) => { i.pctAlvo = W > 0 ? (i.alvo / W) * 100 : 0; i.pctAtual = tot > 0 ? (i.valor / tot) * 100 : 0; i.desvio = i.pctAtual - i.pctAlvo; });
  return { itens, W, tot };
}
function areasDe2(plan, carry, ano) {
  const map = new Map(); const add = (a, v) => { if (v > 0) map.set(a, (map.get(a) || 0) + v); };
  plan.despesas.concat(carry).forEach((it) => add(it.area || 'Outros', E.sum(E.itemValores(it, ano))));
  (plan.lancamentos || []).forEach((l) => { const d = E.parseDataISO(l.data); if (d && d.ano === ano) add(l.area || 'Outros', +l.valor); });
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
}
function montarRelatorio(o) {
  const { perfil, plans, ano, rec } = o; const id = o.id || 'r'; const plan = plans[ano];
  if (!plan) return { html: '<p class="empty-s">Nenhum planejamento para este ano.</p>', draw() {} };
  const ctx = ctxDe(perfil, plans, ano); const C = E.compute(plan, ctx); const T = C.T; const cart = carteiraDe(perfil, plans, plan); const areas = areasDe2(plan, ctx.carry, ano);
  const hoje = new Date().toLocaleDateString('pt-BR'); const comRec = rec && ((rec.carteira || []).length || (rec.notas || '').trim());
  const pr = perfil.perfilInvestidor && perfil.perfilInvestidor.resultado ? E.PERFIS[perfil.perfilInvestidor.resultado].nome : 'não definido';
  const kp = (l, v) => `<div><small>${l}</small><b>${v}</b></div>`;
  const meses = MES.map((m, i) => `<tr><td>${m}</td><td class="num">${brl0(C.receita[i])}</td><td class="num">${brl0(C.despesas[i])}</td><td class="num">${C.orcamento[i] > 0 ? brl0(C.orcamento[i]) : '–'}</td><td class="num">${brl0(C.investAlocado[i])}</td><td class="num">${brl0(C.aplicado[i])}</td><td class="num">${brl0(C.patrimonio[i])}</td></tr>`).join('');
  const cartTbl = cart.itens.length && cart.W > 0 ? `<table class="rel-tbl"><thead><tr><th>Ativo</th><th>Classe</th><th class="num">Alvo</th><th class="num">Atual</th><th class="num">Desvio</th></tr></thead><tbody>${cart.itens.filter((i) => i.alvo > 0 || i.valor > 0).map((i) => `<tr><td>${esc(i.a.nome)}</td><td>${esc(i.a.classe)}</td><td class="num">${fmtPct(i.pctAlvo)}</td><td class="num">${fmtPct(i.pctAtual)}</td><td class="num">${fmtPp(i.desvio)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Carteira-alvo ainda não definida.</p>';
  const recTbl = rec && (rec.carteira || []).length ? `<table class="rel-tbl"><thead><tr><th>Ativo</th><th>Classe</th><th class="num">Alvo recomendado</th></tr></thead><tbody>${rec.carteira.map((r) => `<tr><td>${esc(r.nome)}</td><td>${esc(r.classe)}</td><td class="num">${fmtPct(+r.alvo)}</td></tr>`).join('')}</tbody></table>` : '';
  const html = `<article class="rel"><div class="rel-h"><div><h2>Relatório de ${ano}</h2><p class="muted">${esc(perfil.nome || 'Cliente')} · perfil ${esc(pr)} · gerado em ${hoje}</p></div><div class="muted" style="text-align:right">${esc(CFG.consultor)}<br>${esc(CFG.marca)}</div></div>
    <div class="rel-grid">${kp('Patrimônio estimado', brl0(C.patrimonio[11]))}${kp('Entradas no ano', brl0(T.receita))}${kp('Gastos no ano', brl0(T.despesas))}${kp('Taxa de poupança', T.poupanca == null ? '–' : pct(T.poupanca))}
      ${kp('Aportes', brl0(T.aportes))}${kp('Dividendos', brl0(T.dividendos))}${kp('Orçado no ano', T.orcamento > 0 ? brl0(T.orcamento) : '–')}${kp('Meta de investimento', brl0(C.metaAno))}</div>
    <div class="rel-sec"><h3>Evolução do patrimônio</h3><div class="chart" id="${id}-patr"></div></div>
    <div class="rel-sec"><h3>Mês a mês</h3><div style="overflow:auto"><table class="rel-tbl"><thead><tr><th>Mês</th><th class="num">Entradas</th><th class="num">Gastos</th><th class="num">Orçado</th><th class="num">Sobra</th><th class="num">Aplicado</th><th class="num">Patrimônio</th></tr></thead><tbody>${meses}</tbody></table></div></div>
    ${areas.length ? `<div class="rel-sec"><h3>Onde mais se gasta</h3>${hbars(areas, brl0)}</div>` : ''}
    <div class="rel-sec"><h3>Carteira: alvo e posição</h3>${cartTbl}</div>
    ${comRec ? `<div class="rel-sec"><h3>Recomendação do ${esc(primeiroNome())}</h3>${recTbl}${(rec.notas || '').trim() ? `<div class="rel-nota" style="margin-top:10px">${esc(rec.notas)}</div>` : ''}</div>` : ''}
    <p class="cap" style="margin-top:22px">Relatório informativo gerado a partir dos lançamentos registrados. Patrimônio a custo, sem variação de mercado. Não constitui oferta nem recomendação individual de investimento, salvo a recomendação expressa do assessor acima. Rentabilidade passada não garante resultados futuros.</p></article>`;
  return { html, draw() { chartLine(document.getElementById(id + '-patr'), { height: 170, zoom: C.patrimonio[0] > 0 && C.patrimonio[11] > C.patrimonio[0], labels: MES, aria: 'Evolução do patrimônio no ano', series: [{ color: 'var(--c1)', values: C.patrimonio, area: true }], tip: (i) => `<b>${MES[i]}</b><br>${brl0(C.patrimonio[i])}` }); } };
}
let relAtual = null;
function viewRelatorio() {
  if (!temRecurso('relatorios')) return `${pageHead('Relatório', 'Resumo do ano para imprimir ou levar à reunião.')}${lockedHtml('relatorios')}`;
  relAtual = montarRelatorio({ perfil: S.profile, plans: S.plans, ano: S.year, rec: S.recomendacao, id: 'rel' });
  return `<div class="page-h no-print"><div><h2 class="title">Relatório</h2><p class="sub">Resumo do ano para imprimir ou levar à reunião com o assessor.</p></div><div class="acts"><button class="btn primary" data-act="imprimir">Imprimir ou salvar em PDF</button>${yearControl()}</div></div>${relAtual.html}`;
}
const drawRelatorio = () => { if (S.screen === 'app' && S.view === 'relatorio' && relAtual) relAtual.draw(); };

/* ---------- recomendação do assessor (lado do cliente) ---------- */
const tipoDeClasse = (classe) => (/cdb|tesouro|renda fixa|lci|lca|poupan|aplica/i.test(classe) ? 'RENDA FIXA' : 'BOLSA DE VALORES');
function recPainelHtml() {
  const r = S.recomendacao; if (!temRecurso('carteira_recomendada') || !r || !(r.carteira || []).length) return '';
  return `<div class="card" style="margin-bottom:16px"><div class="c-h"><h3>Carteira recomendada pelo ${esc(primeiroNome())}</h3><button class="btn primary sm" data-act="rec-aplicar">Aplicar à minha carteira</button></div>
    <table class="mini" style="margin-bottom:8px"><thead><tr><th>Ativo</th><th>Classe</th><th class="num">Alvo</th></tr></thead><tbody>${r.carteira.map((x) => `<tr><td>${esc(x.nome)}</td><td>${esc(x.classe)}</td><td class="num">${fmtPct(+x.alvo)}</td></tr>`).join('')}</tbody></table>
    ${(r.notas || '').trim() ? `<div class="rel-nota">${esc(r.notas)}</div>` : ''}<p class="cap">Aplicar cria os ativos que faltam e substitui os seus alvos pelos recomendados. Os valores continuam sendo os seus.</p></div>`;
}
function recAplicar() {
  const r = S.recomendacao; if (!r || !(r.carteira || []).length) return;
  confirmBox('Aplicar a carteira recomendada?', 'Os ativos que faltam serão criados e os seus percentuais-alvo serão substituídos pelos recomendados.', 'Aplicar', () => {
    S.profile.carteira.forEach((e) => { e.alvo = 0; });
    r.carteira.forEach((x) => { const a = FPIngest.garantirAtivo(S.plan, { tipo: x.tipo || tipoDeClasse(x.classe), classe: x.classe, grupo: x.grupo || null, subgrupo: x.subgrupo || null, nome: x.nome }, uid); cartEntry(E.ativoKey(a), true).alvo = +x.alvo || 0; });
    touch('plan'); touch('profile'); render(); toast('Carteira recomendada aplicada. Ajuste ou defina o aporte na aba Carteira.');
  });
}

/* ---------- visão do consultor sobre um cliente ---------- */
const CLASSES_OPC = () => { const o = []; Object.keys(E.TAXONOMIA).forEach((t) => Object.keys(E.TAXONOMIA[t]).forEach((c) => o.push([t + '|' + c, (t === 'RENDA FIXA' ? 'Renda fixa › ' : 'Renda variável › ') + c]))); return o; };
function recLinha(x) {
  x = x || {}; const v = (x.tipo || 'BOLSA DE VALORES') + '|' + (x.classe || 'Ações BR');
  const opc = CLASSES_OPC(); if (!opc.some((o) => o[0] === v) && x.classe) opc.push([v, x.classe]);
  return `<div class="rec-row"><input data-rec="nome" value="${esc(x.nome || '')}" placeholder="Ativo (ex.: HGLG11)" aria-label="Ativo"><select data-rec="classe" aria-label="Classe">${opc.map(([val, l]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><input data-rec="alvo" inputmode="decimal" value="${x.alvo != null ? esc(String(x.alvo).replace('.', ',')) : ''}" placeholder="%" aria-label="Alvo em %"><button type="button" class="icon-btn danger" data-act="rec-del" aria-label="Remover linha">${I.x}</button></div>`;
}
async function abrirCliente(id) {
  if (!S.isAdmin) return;
  const c = (S.clients || []).find((x) => x.id === id); let d;
  openModal({ title: c ? c.nome || c.email : 'Cliente', ok: 'Fechar', noCancel: true, wide: true, noFocus: true, body: '<div class="skel" style="height:120px"></div>', onOk: () => true });
  try { d = await Store.loadClient(id); } catch (e) { closeModal(); toast('Não foi possível abrir este cliente. Confira as regras do banco.'); return; }
  const perfil = hydrateProfile(d.perfil || {}); const planos = {}; Object.keys(d.planos || {}).forEach((y) => { planos[y] = hydratePlan(d.planos[y]); });
  const anos = Object.keys(planos).map(Number).sort(); const ano = anos.includes(NOW_Y) ? NOW_Y : anos[anos.length - 1];
  const rel = ano ? montarRelatorio({ perfil, plans: planos, ano, rec: d.recomendacao, id: 'relc' }) : null; const rec = d.recomendacao || { carteira: [], notas: '' };
  const semVisao = !ano ? `<div class="notice">Os planejamentos só ficam visíveis para clientes com a Assessoria ativa (${d.assinatura.plano === 'completo' ? 'sem planejamento criado ainda' : 'plano atual: ' + esc(nomePlano(d.assinatura.plano))}). Você ainda pode registrar uma recomendação.</div>` : '';
  const f = openModal({ title: `Cliente: ${perfil.nome || c.email}`, ok: 'Salvar recomendação', noCancel: false, wide: true, noFocus: true,
    body: `${semVisao}${rel ? `<div class="no-print">${rel.html}</div>` : ''}<div class="rel-sec"><h3>Recomendação para o cliente</h3><p class="mmsg">Monte a carteira recomendada e deixe uma nota. O cliente vê na aba Carteira e no relatório.</p>
      <div class="rec-rows" id="rec-rows">${(rec.carteira || []).map(recLinha).join('') || recLinha()}</div><div class="btn-row" style="margin:8px 0"><button type="button" class="btn sm" data-act="rec-add">${I.plus}Adicionar ativo</button><button type="button" class="btn sm" data-act="rec-norm">Normalizar para 100%</button><span class="muted" id="rec-soma"></span></div>
      <textarea class="nota" id="rec-notas" placeholder="Nota do assessor para o cliente" aria-label="Nota do assessor">${esc(rec.notas || '')}</textarea></div>`,
    onOk: (_d, err) => {
      const linhas = $$('#rec-rows .rec-row').map((r) => { const nome = $('[data-rec=nome]', r).value.trim(); const [tipo, classe] = $('[data-rec=classe]', r).value.split('|'); const alvo = E.parseValor($('[data-rec=alvo]', r).value); return { nome, tipo, classe, alvo: Number.isNaN(alvo) ? 0 : alvo }; }).filter((x) => x.nome);
      if (linhas.some((x) => x.alvo < 0)) return bad(err, 'Os percentuais não podem ser negativos.');
      const soma = linhas.reduce((s, x) => s + x.alvo, 0); if (linhas.length && Math.abs(soma - 100) > 0.5) return bad(err, `Os alvos somam ${E.r2(soma)}%. Ajuste para 100% ou use “Normalizar”.`);
      Store.saveRecomendacao(id, { carteira: linhas.map((x) => ({ nome: x.nome, tipo: x.tipo, classe: x.classe, alvo: E.r2(x.alvo) })), notas: $('#rec-notas').value.trim() }).then(() => toast('Recomendação salva. O cliente já pode ver.')).catch(() => toast('Não foi possível salvar a recomendação.'));
      return true;
    } });
  recSoma(); if (rel) setTimeout(() => rel.draw(), 30);
  f.addEventListener('input', (e) => {
    recSoma(); const t = e.target; // sugere a classe pelo código: terminado em 11 = fundo imobiliário
    if (t.matches && t.matches('[data-rec=nome]')) { const sel = $('[data-rec=classe]', t.closest('.rec-row')); if (sel && /^[A-Za-z]{4}11$/.test(t.value.trim()) && sel.value === 'BOLSA DE VALORES|Ações BR') sel.value = 'BOLSA DE VALORES|Fundos Imobiliários'; }
  });
}
function recSoma() { const el = $('#rec-soma'); if (!el) return; const s = $$('#rec-rows [data-rec=alvo]').reduce((a, i) => a + (E.parseValor(i.value) || 0), 0); el.textContent = `Soma dos alvos: ${fmtPct(E.r2(s)) === '–' ? '0%' : fmtPct(E.r2(s))}`; }
function recAdd() { const box = $('#rec-rows'); if (box) { box.insertAdjacentHTML('beforeend', recLinha()); recSoma(); } }
function recNorm() {
  const ins = $$('#rec-rows [data-rec=alvo]'); const v = ins.map((i) => Math.max(0, E.parseValor(i.value) || 0)); const s = v.reduce((a, b) => a + b, 0); if (s <= 0) { toast('Informe ao menos um alvo.'); return; }
  let acc = 0; ins.forEach((inp, i) => { const x = i === ins.length - 1 ? E.r2(100 - acc) : E.r2((v[i] / s) * 100); acc += x; inp.value = String(x).replace('.', ','); }); recSoma();
}
