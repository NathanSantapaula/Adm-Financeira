/* Painel administrativo lateral, backup completo, importação .xlsx, anos e área do consultor. */
'use strict';
function openAdmin() { if (S.screen !== 'app' || !S.profile) return; S.adminOpen = true; renderAdmin(); const d = $('#admin'); if (!d.open) d.showModal(); }
function closeAdmin() { S.adminOpen = false; const d = $('#admin'); if (d && d.open) d.close(); }

function abrirAno(y) {
  if (!anoValido(y)) { toast('Informe um ano entre 1990 e 2100.'); return; }
  if (S.plans[y]) { switchYear(y); return; }
  closeAdmin();
  openModal({ title: `Criar o planejamento de ${y}?`, ok: 'Criar',
    body: `<label class="chk"><input type="checkbox" name="copiar" checked><span><b>Copiar a estrutura de ${S.year}</b><small>Categorias, rendas, gastos e ativos entram com valores zerados. Parcelas em andamento aparecem automaticamente.</small></span></label>`,
    onOk: (d) => { createPlan(y, d.copiar ? S.plan : null); } });
}

/* ---------- painel ---------- */
const OBJ_FIELDS = (o) => `<label class="fld"><span>Objetivo principal</span>${sel('objTipo', OBJETIVOS, o.tipo || 'independencia').replace('<select', '<select data-obj="tipo"')}</label>
  <div class="fld-2"><label class="fld"><span>Valor (R$)</span><input data-obj="valor" inputmode="decimal" value="${o.valor ? nf.format(o.valor) : ''}" placeholder="Ex.: 1.000.000,00"></label><label class="fld"><span>Até que ano</span><input data-obj="ano" inputmode="numeric" maxlength="4" value="${esc(o.ano || '')}"></label></div>`;

function adminHtml() {
  const p = S.profile; const pl = S.plan; const years = Object.keys(S.plans).map(Number).sort(); const cloud = Store.mode === 'cloud';
  const ob = p.perfilInvestidor && p.perfilInvestidor.resultado ? E.PERFIS[p.perfilInvestidor.resultado].nome : 'não definido';
  const abas = ABAS.concat(S.isAdmin && cloud ? [['clientes', 'Clientes', 'Painel do consultor: cadastros e planos.']] : []).filter((a) => a[0] !== 'clientes');
  let plano;
  if (Store.mode === 'local') plano = '<div class="plan-badge on">Modo demonstração</div><p class="mmsg">Todos os recursos estão liberados. Os dados ficam apenas neste navegador.</p>';
  else if (S.isAdmin) plano = `<div class="plan-badge on">Consultor</div><p class="mmsg">Você está logado como ${esc(CFG.consultor)}, com todos os recursos e a área de clientes.</p>`;
  else if (hasFull()) plano = `<div class="plan-badge on">Assessoria ativa</div><p class="mmsg">Você conta com a assessoria exclusiva do ${esc(primeiroNome())}, a aba Carteira e a importação de planilhas.</p>`;
  else if (p.planoSolicitado) plano = `<div class="plan-badge wait">Aguardando confirmação</div><p class="mmsg">Assim que o ${esc(primeiroNome())} confirmar o pagamento, o plano completo é liberado na sua conta.</p><div class="btn-row"><button class="btn" data-act="upgrade">Ver como pagar</button></div>`;
  else plano = `<div class="plan-badge">Organização (gratuito)</div><p class="mmsg">A assessoria (${brl(CFG.precoPor)}) inclui conversa com ${esc(CFG.consultor)}, via XP Inc., planejamento completo com carteira assessorada, a aba Carteira e a importação de planilhas.</p><div class="btn-row"><button class="btn primary" data-act="upgrade">Conhecer a assessoria</button></div>`;

  const importBlock = gated('importar') ? lockedHtml('importar') : importHtml();
  return `<section class="dr-sec"><h3>Conta</h3>
      <label class="fld"><span>Nome</span><input data-pf="nome" value="${esc(p.nome)}" autocomplete="name"></label>
      <label class="fld"><span>E-mail</span><input data-pf="email" type="email" value="${esc(p.email)}" ${cloud ? 'readonly' : ''} autocomplete="email"></label>
      <label class="fld"><span>WhatsApp</span><input data-pf="whatsapp" value="${esc(p.whatsapp)}" inputmode="tel" autocomplete="tel"></label></section>
    <section class="dr-sec"><h3>Metas e ponto de partida</h3>
      ${pl ? `<div class="field-row"><div>Meta de aportes mensais<small>A meta de cada mês soma os dividendos recebidos.</small></div><input class="in-s" data-setting="metaAporte" inputmode="decimal" value="${pl.settings.metaAporte ? nf.format(pl.settings.metaAporte) : ''}" placeholder="0,00" aria-label="Meta de aportes mensais"></div>
      <div class="field-row"><div>Meta de investimento de ${pl.year}<small>Opcional. Se vazio, soma as metas mensais.</small></div><input class="in-s" data-setting="metaInvAno" inputmode="decimal" value="${pl.settings.metaInvAno ? nf.format(pl.settings.metaInvAno) : ''}" placeholder="—" aria-label="Meta de investimento do ano"></div>
      <div class="field-row"><div>Patrimônio inicial de ${pl.year}<small>Sobrescrito para este ano. Se vazio, usa o global do perfil.</small></div><input class="in-s" data-setting="patrimonioInicialAno" inputmode="decimal" value="${pl.settings.patrimonioInicialAno ? nf.format(pl.settings.patrimonioInicialAno) : ''}" placeholder="0,00" aria-label="Patrimônio inicial do ano"></div>` : ''}
      <div class="field-row"><div>Patrimônio inicial (global)<small>O que você tinha investido ao começar no perfil.</small></div><input class="in-s" data-prof="patrimonioInicial" inputmode="decimal" value="${p.patrimonioInicial ? nf.format(p.patrimonioInicial) : ''}" placeholder="0,00" aria-label="Patrimônio inicial"></div>
      ${OBJ_FIELDS(p.objetivo || {})}
      <div class="field-row"><div>Perfil de investidor<small>${esc(ob)}</small></div><button class="btn" data-act="refazer-perfil">Refazer questionário</button></div></section>
    <section class="dr-sec"><h3>Abas do menu</h3><div class="abas">${abas.map(([k, l, d]) => `<label class="chk aba"><input type="checkbox" data-aba="${k}" ${p.abas.includes(k) ? 'checked' : ''} ${k === 'geral' ? 'disabled' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div></section>
    <section class="dr-sec"><h3>Anos de planejamento</h3><ul class="yrs">${years.map((y) => `<li><b>${y}</b>${years.length > 1 ? `<button class="btn sm danger" data-act="del-year" data-year="${y}">Excluir</button>` : ''}</li>`).join('')}</ul>
      <form data-form="year" class="yr-new"><label class="pop-t" for="yr-adm">Adicionar ou abrir outro ano</label><div class="act-row"><input id="yr-adm" name="ano" class="in-s left" inputmode="numeric" maxlength="4" placeholder="Ex.: ${NOW_Y + 1}" autocomplete="off"><button class="btn primary" type="submit">Abrir</button></div></form></section>
    <section class="dr-sec"><h3>Backup completo</h3><p class="mmsg">Baixe todos os seus dados (perfil, anos, rendas, gastos, ativos e carteira) em um único arquivo. Se precisar, restaure aqui mesmo.</p>
      <div class="btn-row"><button class="btn primary" data-act="backup">Backup completo</button><label class="btn" for="bk-file">Restaurar backup</label><input id="bk-file" type="file" accept=".json,application/json" hidden></div>${bkHtml()}</section>
    <section class="dr-sec"><h3>Importar planilha (.xlsx)</h3>${importBlock}</section>
    <section class="dr-sec"><h3>Plano</h3>${plano}<div class="btn-row"><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></section>
    <section class="dr-sec"><h3>Sessão</h3><div class="btn-row"><button class="btn" data-act="goto-landing">Ver página inicial</button><button class="btn" data-act="terms">Termos e privacidade</button><button class="btn danger" data-act="sair">Sair</button></div></section>`;
}
function renderAdmin() {
  const d = $('#admin'); if (!d || !S.profile) return;
  const sc = $('.dr-body', d) ? $('.dr-body', d).scrollTop : 0;
  d.innerHTML = `<div class="dr-head"><div><h2>Painel administrativo</h2><p>${esc(S.profile.nome || 'Minha conta')}, ${esc(planLabel().toLowerCase())}</p></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div><div class="dr-body">${adminHtml()}</div>`;
  $('.dr-body', d).scrollTop = sc;
}

/* ---------- backup ---------- */
function backupCompleto() {
  const planos = {}; Object.keys(S.plans).forEach((y) => { planos[y] = clone(S.plans[y]); });
  const d = new Date(); const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  saveFile(`financial-planning-backup-${dia}.json`, JSON.stringify(E.makeBackup(clone(S.profile), planos), null, 2), 'application/json');
  toast('Backup gerado. Guarde o arquivo em local seguro.');
}
function bkHtml() {
  const b = S.bk; if (!b) return '';
  if (b.state === 'error') return `<div class="notice">${esc(b.msg)}</div>`;
  const P = b.parsed; const anos = Object.keys(P.planos).sort(); const nAt = anos.reduce((s, y) => s + (P.planos[y].ativos || []).length, 0);
  return `<div class="imp-prev card"><h4>${esc(b.name)}</h4><ul class="sum"><li><b>${anos.length}</b> ${anos.length === 1 ? 'ano' : 'anos'} (${anos.join(', ')})</li><li><b>${nAt}</b> registros de ativos</li></ul>${P.avisos.length ? `<ul class="warns">${P.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    <p class="mmsg">Restaurar substitui todos os planejamentos atuais pelo conteúdo do arquivo.</p><div class="btn-row"><button class="btn primary" data-act="bk-apply">Restaurar e substituir tudo</button><button class="btn" data-act="bk-cancel">Cancelar</button></div></div>`;
}
async function lerBackup(file) {
  try { const obj = JSON.parse(await file.text()); const r = E.parseBackup(obj, uid); S.bk = r.ok ? { state: 'ready', name: file.name, parsed: r } : { state: 'error', msg: r.erro }; }
  catch (e) { S.bk = { state: 'error', msg: 'Não foi possível ler o arquivo. Use um backup gerado pelo Financial planning (.json).' }; }
  renderAdmin();
}
async function aplicarBackup() {
  const b = S.bk.parsed; const antigos = Object.keys(S.plans).map(Number);
  S.plans = {}; Object.keys(b.planos).forEach((y) => { S.plans[y] = hydratePlan(b.planos[y]); });
  try {
    for (const y of antigos) if (!S.plans[y]) await Store.deletePlan(y, S.user);
    for (const y of Object.keys(S.plans)) await Store.savePlan(+y, S.plans[y], S.user);
  } catch (e) { toast('Restaurado na tela, mas houve falha ao salvar. Tente de novo.'); }
  if (b.perfil) { const keep = { nome: S.profile.nome, email: S.profile.email, whatsapp: S.profile.whatsapp, criadoEm: S.profile.criadoEm, planoSolicitado: S.profile.planoSolicitado }; S.profile = hydrateProfile(Object.assign({}, b.perfil, keep, { onboarded: true })); }
  touch('profile'); S.bk = null; S.year = pickYear(); S.plan = S.plans[S.year]; S.mes = defaultMes(S.year); S.profile.anoRef = S.year;
  render(); toast('Backup restaurado.');
}

/* ---------- importação de planilha ---------- */
function importHtml() {
  const im = S.imp;
  const how = `<details class="how"><summary>Como preencher o modelo</summary><ul><li><b>Rendas:</b> Categoria (qualquer nome), Fonte (opcional), Item e o valor de cada mês.</li><li><b>Despesas:</b> Categoria, Área, Subárea (opcional), Item e o valor de cada mês.</li><li><b>Parcelados:</b> Valor total, parcelas, mês e ano inicial. O sistema distribui o valor pelos meses.</li><li><b>Investimentos e Proventos:</b> Tipo, Classe, Grupo e Subgrupo (opcionais), Ativo e os valores por mês.</li><li><b>Carteira:</b> os mesmos campos do ativo, mais Alvo % (somando 100), Valor atual e Preço (opcionais).</li><li>Preencha só as abas que quiser e apague as linhas de exemplo antes.</li></ul></details>`;
  const modes = `<fieldset class="plan-pick tight"><legend>Como importar</legend>
    <label class="pick"><input type="radio" name="impmode" data-imp-mode value="merge" ${im.mode === 'merge' ? 'checked' : ''}><span><b>Mesclar</b><small>Atualiza o que já existe e acrescenta o novo, sem duplicar.</small></span></label>
    <label class="pick"><input type="radio" name="impmode" data-imp-mode value="replace" ${im.mode === 'replace' ? 'checked' : ''}><span><b>Substituir</b><small>Troca o conteúdo das seções enviadas pelo do arquivo.</small></span></label></fieldset>`;
  let state = '';
  if (im.state === 'reading') state = `<p class="mmsg">Lendo ${esc(im.name)}…</p>`;
  else if (im.state === 'error') state = `<div class="notice">${esc(im.msg)}</div>`;
  else if (im.state === 'ready') {
    const P = im.parsed; const c = P.counts; const rows = [['Rendas', c.rendas], ['Despesas', c.despesas], ['Parcelados', c.parcelados], ['Ativos em Investimentos', c.investimentos], ['Ativos em Proventos', c.proventos], ['Ativos na Carteira', c.carteira]].filter((r) => r[1] > 0);
    const av = P.avisos.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join('') + (P.avisos.length > 8 ? `<li>E mais ${P.avisos.length - 8} avisos.</li>` : '');
    state = P.vazio ? `<div class="notice">Não encontramos abas conhecidas em ${esc(im.name)}. Use o modelo (Rendas, Despesas, Parcelados, Investimentos, Proventos ou Carteira).</div>${av ? `<ul class="warns">${av}</ul>` : ''}`
      : `<div class="imp-prev card"><h4>${esc(im.name)}</h4><ul class="sum">${rows.map(([l, n]) => `<li><b>${n}</b> ${l}</li>`).join('')}</ul>${av ? `<p class="mmsg">Avisos:</p><ul class="warns">${av}</ul>` : ''}<p class="mmsg">Os dados serão importados em ${S.year}.</p><div class="btn-row"><button class="btn primary" data-act="imp-apply">Importar para ${S.year}</button><button class="btn" data-act="imp-cancel">Cancelar</button></div></div>`;
  }
  return `<p class="mmsg">Baixe o modelo, preencha e importe. Serve também para receber a carteira montada pelo seu assessor.</p><div class="btn-row"><button class="btn" data-act="download-template">Baixar modelo (.xlsx)</button></div>${how}${modes}<div class="btn-row"><label class="btn primary" for="imp-file">Escolher arquivo .xlsx</label><input id="imp-file" type="file" accept=".xlsx" hidden></div>${state}`;
}
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX); if (loadXlsx.p) return loadXlsx.p;
  loadXlsx.p = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => { loadXlsx.p = null; rej(new Error('xlsx')); }; document.head.appendChild(s); });
  return loadXlsx.p;
}
async function baixarModelo() {
  let arr;
  try {
    const X = await loadXlsx(); const wb = X.utils.book_new();
    E.templateSheets(S.year).forEach((sh) => { const ws = X.utils.aoa_to_sheet(sh.rows); ws['!cols'] = sh.name === 'Instruções' ? [{ wch: 130 }] : sh.rows[0].map((_, i) => ({ wch: i < 5 ? 22 : 11 })); X.utils.book_append_sheet(wb, ws, sh.name); });
    arr = X.write(wb, { bookType: 'xlsx', type: 'array' });
  } catch (e) { toast('Não foi possível carregar o gerador de planilhas. Verifique a conexão e tente de novo.'); return; }
  saveFile('financial-planning-modelo.xlsx', new Uint8Array(arr), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); toast('Modelo baixado.');
}
async function lerPlanilha(file) {
  const mode = S.imp.mode; S.imp = { state: 'reading', mode, name: file.name }; renderAdmin();
  try {
    const X = await loadXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const sheets = wb.SheetNames.map((n) => ({ name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: true }) }));
    S.imp = { state: 'ready', mode, name: file.name, parsed: E.parseImport(sheets) };
  } catch (e) { S.imp = { state: 'error', mode, name: file.name, msg: 'Não foi possível ler o arquivo. Confirme que é um .xlsx válido e que a conexão está ativa.' }; }
  renderAdmin();
}
function aplicarPlanilha() {
  if (gated('importar') || !S.plan || S.imp.state !== 'ready') return;
  const { parsed, mode } = S.imp; const r = E.applyImport(S.plan, S.profile.carteira, parsed, mode, uid);
  touch('plan'); if (parsed.found.cart) touch('profile'); S.imp = { state: 'idle', mode };
  render(); renderAdmin();
  const parts = []; if (r.rendas) parts.push(`${r.rendas} rendas`); if (r.despesas) parts.push(`${r.despesas} gastos`); if (r.parcelados) parts.push(`${r.parcelados} parcelados`); if (r.ativos) parts.push(`${r.ativos} ativos novos`); if (r.carteira) parts.push(`${r.carteira} alvos`);
  toast('Importação concluída' + (parts.length ? ': ' + parts.join(', ') : '') + '.');
}

/* ---------- campos do painel ---------- */
function refazerPerfil() { closeAdmin(); initOb(); S.ob.step = OB_STEPS.indexOf('perfil'); S.ob.q = 0; S.ob.resp = []; S.ob.perfil = null; S.screen = 'onboarding'; render(); }

function onAdminChange(t) {
  const p = S.profile; const num = (v) => (String(v).trim() === '' ? 0 : E.parseValor(String(v).replace('%', '')));
  if (t.matches('[data-pf]')) {
    const k = t.dataset.pf; const v = t.value.trim();
    if (k === 'nome' && v.length < 2) { toast('Informe seu nome.'); t.value = p.nome; return true; }
    p[k] = v; touch('profile'); renderLater(); const hp = $('.dr-head p', $('#admin')); if (hp) hp.textContent = `${p.nome || 'Minha conta'}, ${planLabel().toLowerCase()}`; return true;
  }
  if (t.matches('[data-prof]')) {
    const k = t.dataset.prof; const v = num(t.value);
    if (Number.isNaN(v) || v < 0 || (k === 'retornoAnual' && v > 100)) { toast('Valor inválido.'); t.value = String(p[k]).replace('.', ','); return true; }
    p[k] = v; t.value = k === 'retornoAnual' ? String(v).replace('.', ',') : (v ? nf.format(v) : ''); touch('profile'); renderLater(); return true;
  }
  if (t.matches('[data-setting]') && S.plan) {
    const k = t.dataset.setting; const v = num(t.value);
    if (Number.isNaN(v) || v < 0) { toast('Valor inválido.'); t.value = S.plan.settings[k] ? nf.format(S.plan.settings[k]) : ''; return true; }
    S.plan.settings[k] = v; t.value = v ? nf.format(v) : ''; touch('plan'); renderLater(); return true;
  }
  if (t.matches('[data-obj]')) {
    const k = t.dataset.obj; p.objetivo = Object.assign({ tipo: 'independencia', valor: 0, ano: NOW_Y + 10 }, p.objetivo || {});
    if (k === 'tipo') p.objetivo.tipo = t.value;
    else if (k === 'valor') { const v = num(t.value); if (Number.isNaN(v) || v < 0) { toast('Valor inválido.'); return true; } p.objetivo.valor = v; t.value = v ? nf.format(v) : ''; }
    else { const a = parseInt(t.value, 10); if (!anoValido(a)) { toast('Informe um ano válido.'); t.value = p.objetivo.ano || ''; return true; } p.objetivo.ano = a; }
    touch('profile'); renderLater(); return true;
  }
  if (t.matches('[data-aba]')) {
    const keys = $$('[data-aba]:checked', $('#admin')).map((x) => x.dataset.aba);
    p.abas = hydrateProfile({ abas: ['geral'].concat(keys.filter((k) => k !== 'geral')) }).abas; if (!p.abas.includes(S.view)) S.view = 'geral'; touch('profile'); renderLater(); return true;
  }
  if (t.matches('[data-imp-mode]')) { S.imp.mode = t.value; return true; }
  if (t.id === 'imp-file') { const f = t.files && t.files[0]; if (f) lerPlanilha(f); return true; }
  if (t.id === 'bk-file') { const f = t.files && t.files[0]; if (f) lerBackup(f); return true; }
  return false;
}

/* ---------- área do consultor ---------- */
async function loadClients() {
  S.clientsLoading = true;
  try { S.clients = await Store.listClients(); } catch (e) { S.clients = []; toast('Não foi possível carregar os clientes.'); }
  S.clientsLoading = false; render({ soft: true });
}
async function setPlanoCliente(id, plano) {
  try { await Store.setPlano(id, plano, 'ativo'); const c = S.clients.find((x) => x.id === id); if (c) c.plano = plano; toast(plano === 'completo' ? 'Plano completo liberado para o cliente.' : 'Cliente voltou ao plano gratuito.'); }
  catch (e) { toast('Não foi possível alterar o plano. Confira as regras do banco.'); }
  render();
}
function viewClientes() {
  if (!S.isAdmin) return '<p class="empty-s">Área restrita ao consultor.</p>';
  if (S.clients == null) { if (!S.clientsLoading) loadClients(); return '<div class="page-h"><div><h2 class="title">Clientes</h2></div></div><div class="loading">Carregando clientes…</div>'; }
  const q = S.clientsQ.trim().toLowerCase(); const all = S.clients.filter((c) => !S.user || c.id !== S.user.id);
  const lista = all.filter((c) => !q || `${c.nome} ${c.email}`.toLowerCase().includes(q));
  const f = { cad: all.length, diag: all.filter((c) => c.dados.onboarded).length, sol: all.filter((c) => c.dados.planoSolicitado === 'completo' && c.plano !== 'completo').length, comp: all.filter((c) => c.plano === 'completo').length };
  const rows = lista.map((c) => { const d = c.dados; const pf = d.perfilInvestidor && d.perfilInvestidor.resultado ? E.PERFIS[d.perfilInvestidor.resultado].nome : '–'; const w = waDigits() ? '' : ''; const zap = String(c.whatsapp || '').replace(/\D/g, '');
    return `<tr><td><b>${esc(c.nome || '(sem nome)')}</b><small>${esc(c.email)}</small></td><td>${zap ? `<a class="lnk strong" href="https://wa.me/${zap}" ${ext}>${esc(c.whatsapp)}</a>` : '–'}</td><td>${pf}</td><td class="num">${d.patrimonioInicial ? brl0(d.patrimonioInicial) : '–'}</td>
      <td>${d.objetivo && d.objetivo.tipo ? esc(objNome(d.objetivo.tipo)) : '–'}</td><td>${sel('plano', [['gratis', 'Gratuito'], ['completo', 'Completo']], c.plano).replace('<select', `<select data-plano-cli="${c.id}"`)}${d.planoSolicitado === 'completo' && c.plano !== 'completo' ? '<small class="warn-t">Solicitou</small>' : ''}</td><td>${c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '–'}</td></tr>`; }).join('');
  return `<div class="page-h"><div><h2 class="title">Clientes</h2><p class="sub">Quem se cadastrou, o resultado do diagnóstico e o plano de cada um.</p></div></div>
    <div class="stats4"><div class="stat"><div class="c-k">Cadastros</div><div class="c-num">${f.cad}</div></div><div class="stat"><div class="c-k">Diagnósticos concluídos</div><div class="c-num">${f.diag}</div><div class="c-n">${f.cad ? pct(f.diag / f.cad) : '–'} dos cadastros</div></div>
      <div class="stat"><div class="c-k">Pediram a assessoria</div><div class="c-num">${f.sol}</div></div><div class="stat"><div class="c-k">Assessoria ativa</div><div class="c-num">${f.comp}</div><div class="c-n">${f.cad ? pct(f.comp / f.cad) : '–'} dos cadastros</div></div></div>
    <div class="ltools"><input class="search" type="search" data-clients-q placeholder="Buscar por nome ou e-mail" value="${esc(S.clientsQ)}" aria-label="Buscar cliente"></div>
    <div class="tablewrap"><table class="clientes"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Perfil</th><th class="num">Patrimônio</th><th>Objetivo</th><th>Plano</th><th>Cadastro</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-s">Nenhum cliente encontrado.</td></tr>'}</tbody></table></div>`;
}
