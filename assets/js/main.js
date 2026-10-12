/* Navegação, renderização, eventos e inicialização. */
'use strict';
const navItems = () => {
  const tabs = visibleTabs(); const base = ABAS.filter((a) => tabs.includes(a[0])).map((a) => [a[0], a[1]]);
  if (S.isAdmin && Store.mode === 'cloud') base.push(['clientes', 'Clientes']);
  return base;
};
function renderSide() {
  const items = navItems(); const nome = (S.profile && S.profile.nome) || 'Minha conta';
  const btn = ([k, l]) => `<button data-act="nav" data-view="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${I[k] || I.geral}<span>${l}</span>${k === 'cart' && gated('cart') ? `<em class="lk" title="Plano completo">${I.lock}</em>` : ''}</button>`;
  $('#side').innerHTML = `<div class="brand">${LOGO}<div><div class="bname">${esc(CFG.marca)}</div><div class="bsub">por ${esc(CFG.consultor)}</div></div></div>
    <nav class="nav" aria-label="Seções">${items.map(btn).join('')}</nav>
    <div class="side-foot"><button class="acct" data-act="admin-open" aria-label="Abrir painel administrativo"><span class="av">${esc(nome.trim().charAt(0).toUpperCase() || 'C')}</span><span class="acct-t"><b>${esc(nome)}</b><small>${esc(planLabel())}</small></span>${I.mais}</button>
      <div class="advisor"><div class="adv-t">Seu assessor<b>${esc(CFG.consultor)}</b></div><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div><div class="save" data-s="${S.save}">${statusText()}</div></div>`;
  const prim = ['geral', 'despesas', 'inv', 'cart'].filter((k) => items.some((i) => i[0] === k));
  const rest = items.filter((i) => !prim.includes(i[0]));
  const sheet = S.maisOpen ? `<div class="sheet" role="dialog" aria-label="Mais opções">${rest.map(btn).join('')}<button data-act="admin-open">${I.user}<span>Painel administrativo</span></button><button data-act="contact">${I.chat}<span>Falar com o ${esc(primeiroNome())}</span></button></div>` : '';
  $('#tabbar').innerHTML = `${sheet}<div class="tabs">${items.filter((i) => prim.includes(i[0])).map(btn).join('')}<button data-act="mais-toggle" aria-expanded="${S.maisOpen}">${I.mais}<span>Mais</span></button></div>`;
}

function emptyState() { return `<div class="empty-state"><h2>Crie o planejamento de ${S.year || NOW_Y}</h2><p>Comece com a estrutura: rendas, categorias de gastos, investimentos e proventos. Também é possível importar uma planilha .xlsx pelo painel administrativo.</p><div class="btn-row"><button class="btn primary lg" data-act="create-plan">Começar planejamento de ${S.year || NOW_Y}</button></div></div>`; }

function viewHtml() {
  if (!S.plan) return emptyState();
  switch (S.view) {
    case 'rendas': return viewRendas();
    case 'despesas': return viewDespesas();
    case 'inv': return viewAssets('inv');
    case 'pro': return viewAssets('pro');
    case 'cart': return viewCart();
    case 'clientes': return viewClientes();
    default: return viewGeral();
  }
}

function render(opts) {
  const soft = !!(opts && opts.soft);
  if (isEditing() || (soft && isTyping())) { S.needsRender = true; return; }
  const scr = S.screen;
  if (scr === 'app' && !navItems().some((i) => i[0] === S.view)) S.view = 'geral';
  const key = scr + ':' + (scr === 'app' ? S.view : scr === 'onboarding' && S.ob ? S.ob.step + '.' + S.ob.q : scr === 'auth' ? S.authMode : '');
  const same = S.lastKey === key;
  if (soft && scr !== 'app' && same) return;
  S.needsRender = false; document.body.dataset.screen = scr;
  const y = window.scrollY; const tw = $('.tablewrap'); const tws = tw ? [tw.scrollLeft, tw.scrollTop] : null;
  S.C = S.plan && S.profile ? E.compute(S.plan, planCtx()) : null;
  hideTip();
  if (scr === 'app') { renderSide(); $('#view').innerHTML = viewHtml(); }
  else {
    $('#side').innerHTML = ''; $('#tabbar').innerHTML = '';
    const h = { landing: landingHtml, auth: authHtml, onboarding: onboardingHtml, checkout: checkoutHtml }[scr];
    $('#view').innerHTML = h ? h() : scr === 'erro' ? `<div class="empty-state"><h2>Sem conexão</h2><p>${esc(S.fatal)}</p><button class="btn primary" onclick="location.reload()">Tentar de novo</button></div>` : '<div class="loading">Carregando…</div>';
  }
  const tw2 = $('.tablewrap'); if (tw2 && tws && same) { tw2.scrollLeft = tws[0]; tw2.scrollTop = tws[1]; }
  window.scrollTo(window.scrollX, same ? y : 0); S.lastKey = key;
  drawAll();
  if (scr === 'landing') initReveal();
  if (S.pendingFocus) { const c = findCell(S.pendingFocus.ri, S.pendingFocus.m); if (c) c.focus(); S.pendingFocus = null; }
  const ad = $('#admin'); if (S.adminOpen && ad && ad.open) { const ae = document.activeElement; if (!(ae && ad.contains(ae) && /INPUT|SELECT|TEXTAREA/.test(ae.tagName))) renderAdmin(); }
}
function drawAll() { if (S.screen === 'landing') drawLanding(); else if (S.screen === 'app') { drawDashboard(); drawLedger(); } }
function renderLater() { S.stale = true; clearTimeout(S.staleT); S.staleT = setTimeout(() => { if (S.stale) { S.stale = false; render(); } }, 450); }

/* ---------- eventos ---------- */
function onClick(e) {
  const tgt = e.target;
  if (S.yearOpen && !(tgt.closest && tgt.closest('.year'))) { S.yearOpen = false; render(); }
  if (S.maisOpen && !(tgt.closest && (tgt.closest('.sheet') || tgt.closest('[data-act="mais-toggle"]')))) { S.maisOpen = false; render(); }
  const ed = tgt.closest && tgt.closest('.ed');
  if (ed && !ed.classList.contains('editing')) {
    let el = ed; if (S.stale) { const ri = +ed.dataset.ri; const m = +ed.dataset.m; S.stale = false; render(); el = findCell(ri, m); }
    if (el) startEdit(el); return;
  }
  const el = tgt.closest && tgt.closest('[data-act]');
  if (el) {
    const act = el.dataset.act; const p = S.plan; const ds = el.dataset;
    switch (act) {
      case 'nav': S.view = ds.view; S.stale = false; S.maisOpen = false; closeAdmin(); render(); break;
      case 'mais-toggle': S.maisOpen = !S.maisOpen; render(); break;
      case 'toggle': { const set = S.closed[ds.kind]; if (set.has(ds.key)) set.delete(ds.key); else set.add(ds.key); S.stale = false; render(); break; }
      case 'expand-all': S.closed[ds.kind] = new Set(); render(); break;
      case 'collapse-all': S.closed[ds.kind] = new Set(groupKeys(E.buildAssetTree(p.ativos, ds.kind === 'inv' ? 'ap' : 'pr'), [])); render(); break;
      case 'toggle-cat': S.fechadas[ds.key] = !S.fechadas[ds.key]; render(); break;
      case 'mes': S.mes = +ds.m; render(); break;
      case 'modo': S.modo = ds.modo; render(); break;
      case 'add-item': openItem(ds.kind, null, { cat: ds.cat, area: ds.area }); break;
      case 'edit-item': openItem(ds.kind, ds.id); break;
      case 'rename-grp': openRename(ds.cat, ds.area, ds.sub); break;
      case 'cats': openCats(ds.kind); break;
      case 'cat-up': case 'cat-down': case 'cat-del': catAction(act, ds.id); break;
      case 'cat-add': { const inp = $('#modal [name=novacat]'); catAction('cat-add', null, inp ? inp.value : ''); break; }
      case 'orc-all': { const v = S.C.orcamento[S.mes]; p.settings.orcPadrao = v; p.orcamento = new Array(12).fill(null); commit(); toast('Orçamento aplicado a todos os meses.'); break; }
      case 'year-toggle': S.yearOpen = !S.yearOpen; render(); break;
      case 'year-pick': if (+ds.year !== S.year) switchYear(+ds.year); else { S.yearOpen = false; render(); } break;
      case 'create-plan': createPlan(S.year || NOW_Y, null); break;
      case 'add-ativo': openAtivo(); break;
      case 'edit-ativo': openAtivo(ds.id); break;
      case 'cart-norm': cartNormalize(); break;
      case 'cart-equal': cartEqual(); break;
      case 'cart-clear': cartClear(); break;
      case 'cart-perfil': cartPerfil(); break;
      case 'cart-auto': S.cart.aporte = null; render(); break;
      case 'cart-register': cartRegister(); break;
      case 'upgrade': iniciarCompleto(); break;
      case 'checkout-back': S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break;
      case 'contact': S.maisOpen = false; openContact(); break;
      case 'terms': openTerms(); break;
      case 'go-auth': if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break; } S.authMode = ds.mode || 'signup'; S.authPlano = ds.plano === 'completo' ? 'completo' : 'gratis'; S.authErr = ''; S.authDraft = null; S.screen = 'auth'; render(); break;
      case 'auth-mode': S.authMode = ds.mode; S.authErr = ''; S.authMsg = ''; render(); break;
      case 'goto-landing': closeAdmin(); S.screen = 'landing'; render(); break;
      case 'open-app': S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break;
      case 'scroll': { const t = document.getElementById(ds.to); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
      case 'ob-back': { const f = $('#f-ob'); if (f) readOb(f); obBack(); break; }
      case 'quiz-pick': quizPick(+ds.i); break;
      case 'ob-finish': finishOb(); break;
      case 'ob-finish-pay': finishOb(); iniciarCompleto(); break;
      case 'ob-finish-talk': finishOb(); openContact(); break;
      case 'admin-open': S.maisOpen = false; openAdmin(); break;
      case 'admin-close': closeAdmin(); break;
      case 'backup': backupCompleto(); break;
      case 'bk-apply': aplicarBackup(); break;
      case 'bk-cancel': S.bk = null; renderAdmin(); break;
      case 'download-template': baixarModelo(); break;
      case 'imp-apply': aplicarPlanilha(); break;
      case 'imp-cancel': S.imp = { state: 'idle', mode: S.imp.mode }; renderAdmin(); break;
      case 'refazer-perfil': refazerPerfil(); break;
      case 'del-year': confirmBox(`Excluir o planejamento de ${ds.year}?`, 'Todos os valores deste ano serão apagados. Esta ação não pode ser desfeita. Faça um backup antes, se precisar.', 'Excluir', () => deletePlan(+ds.year)); break;
      case 'sair': closeAdmin(); sair(); break;
      default: break;
    }
  }
  if (S.stale) { S.stale = false; clearTimeout(S.staleT); render(); }
}

function onSubmit(e) {
  const f = e.target;
  if (f.id === 'f-auth') { e.preventDefault(); submitAuth(f); }
  else if (f.id === 'f-ob') { e.preventDefault(); if (readOb(f)) { if (S.ob.step === OB_STEPS.length - 1) finishOb(); else obNext(); } }
  else if (f.dataset.form === 'year') { e.preventDefault(); const v = parseInt(new FormData(f).get('ano'), 10); if (!anoValido(v)) { const m = $('.merr', f); if (m) { m.textContent = 'Informe um ano entre 1990 e 2100.'; m.classList.add('show'); } toast('Informe um ano entre 1990 e 2100.'); return; } S.yearOpen = false; abrirAno(v); }
}

function onChange(e) {
  const t = e.target;
  if (t.closest && t.closest('#admin') && onAdminChange(t)) return;
  if (t.matches('[data-cat-name]')) { catAction('cat-rename', t.dataset.catName, t.value); return; }
  if (t.matches('[data-plano-cli]')) { setPlanoCliente(t.dataset.planoCli, t.value); return; }
  if (t.matches('[data-cart="mes"]')) { S.cart.mes = +t.value; renderLater(); return; }
  if (t.matches('[data-cart="aporte"]')) {
    const v = E.parseValor(t.value); if (Number.isNaN(v) || v < 0) { toast('Valor de aporte inválido.'); t.value = nf.format(cartModel().aporte); return; }
    S.cart.aporte = v; t.value = nf.format(v); renderLater();
  }
}

let filterT = null;
function onInput(e) {
  const t = e.target; if (!(t.matches)) return;
  const refocus = (sel, pos) => { const n = $(sel); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* ignora */ } } };
  if (t.matches('[data-filter]')) { S.filter[t.dataset.filter] = t.value; clearTimeout(filterT); filterT = setTimeout(() => { const pos = t.selectionStart; render(); refocus(`[data-filter="${t.dataset.filter}"]`, pos); }, 160); }
  if (t.matches('[data-clients-q]')) { S.clientsQ = t.value; clearTimeout(filterT); filterT = setTimeout(() => { const pos = t.selectionStart; render(); refocus('[data-clients-q]', pos); }, 160); }
}

function onKey(e) {
  if (e.key === 'Escape' && S.yearOpen) { S.yearOpen = false; render(); return; }
  const t = e.target;
  if (!(t.matches && t.matches('.ed')) || t.classList.contains('editing')) return;
  const ri = +t.dataset.ri; const m = +t.dataset.m;
  const go = (dir) => { const n = neighbor(ri, m, dir); if (n) { const c = findCell(n.ri, n.m); if (c) c.focus(); } };
  switch (e.key) {
    case 'Enter': case 'F2': e.preventDefault(); startEdit(t); return;
    case 'ArrowRight': e.preventDefault(); go('right'); return; case 'ArrowLeft': e.preventDefault(); go('left'); return;
    case 'ArrowDown': e.preventDefault(); go('down'); return; case 'ArrowUp': e.preventDefault(); go('up'); return;
    case 'Delete': case 'Backspace': { e.preventDefault(); const kind = applyCell(t.dataset, 0, true); touch(kind); S.pendingFocus = { ri, m }; render(); return; }
    default: if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[0-9,.\-=+]$/.test(e.key)) { e.preventDefault(); startEdit(t, e.key); }
  }
}

let resizeT = null;
function bind() {
  document.addEventListener('click', onClick); document.addEventListener('change', onChange); document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey); document.addEventListener('submit', onSubmit);
  document.addEventListener('focusout', () => { if (S.needsRender) setTimeout(() => { if (S.needsRender && !isEditing() && !isTyping()) render(); }, 80); });
  $('#modal').addEventListener('close', () => { if (S.needsRender) render(); if (S.adminOpen) renderAdmin(); });
  $('#admin').addEventListener('close', () => { S.adminOpen = false; if (S.needsRender) render(); });
  $('#admin').addEventListener('click', (e) => { if (e.target === $('#admin')) closeAdmin(); });
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(drawAll, 150); });
  window.addEventListener('pagehide', () => { flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
}

window.__fp = { S, E, CFG, Store, render };
bind(); render(); boot();
