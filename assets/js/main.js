/* Navegação, renderização, eventos e inicialização. */
'use strict';
const navItems = () => {
  const tabs = visibleTabs(); const base = ABAS.filter((a) => tabs.includes(a[0])).map((a) => [a[0], a[1]]);
  if (S.isAdmin && Store.mode === 'cloud') base.push(['clientes', 'Clientes']);
  return base;
};
// menu em grupos com título (como MAIN / FEATURES / TOOLS); aba que não estiver num grupo vai para o fim
const GRUPOS_NAV = [['', ['geral']], ['Dinheiro', ['rendas', 'despesas']], ['Investir', ['inv', 'pro', 'cart']], ['Acompanhar', ['relatorio', 'clientes']]];
const navAgrupado = (items, btn) => GRUPOS_NAV.map(([t, ks]) => { const its = items.filter((i) => ks.includes(i[0])); return its.length ? (t ? `<div class="nav-g" aria-hidden="true">${t}</div>` : '') + its.map(btn).join('') : ''; }).join('') + items.filter((i) => !GRUPOS_NAV.some((g) => g[1].includes(i[0]))).map(btn).join('');
// no plano gratuito o rodapé do menu convida a conhecer o Investidor (como o Upgrade Pro); nos pagos fica o cartão do assessor
const cartaoPlanoHtml = () => `<div class="advisor plano"><span class="adv-ic" aria-hidden="true">${I.inv || '★'}</span><div class="adv-t"><b>Conheça o plano ${esc(nomePlano('investidor'))}</b><small>Investimentos, proventos e a carteira no mesmo painel, com o disponível para aportar todo mês.</small></div><button class="hp-btn sm" data-act="upgrade" data-plano="investidor">Conhecer</button><button class="lnk adv-lnk" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div>`;
function renderSide() {
  if (modoBasico()) { basicoBarra(); return; } // modo Básico (basico.js): abas embaixo, sem menu lateral nem topo
  const items = navItems(); const nome = (S.profile && S.profile.nome) || 'Minha conta';
  const btn = ([k, l]) => `<button data-act="nav" data-view="${k}" title="${esc(l)}" ${S.view === k ? 'aria-current="page"' : ''}>${I[k] || I.geral}<span>${l}</span>${k !== 'clientes' && !abaLiberada(k) ? `<em class="lk" title="Plano ${esc(nomePlano(planoMinimoDe(E.ABA_RECURSO[k] || 'fluxo')))}">${I.lock}</em>` : ''}</button>`;
  // no computador o menu recolhe para só o ícone "AV" e os ícones das abas (estado guardado no aparelho: html.side-mini)
  const mini = document.documentElement.classList.contains('side-mini');
  // topo da página: à direita, a busca (nas abas que têm), o sino e o perfil; a marca fica no menu lateral
  const htAntes = $('#topo .htools'); // olho, globo e período movidos pelo render() (renderSide sozinho, no redimensionar, não os perde)
  $('#topo').innerHTML = `<div class="topo-r"><div class="topo-ic">${buscaBtnHtml()}${typeof sinoHtml === 'function' ? sinoHtml() : ''}</div><button class="topo-eu" data-act="admin-open" aria-label="Abrir o seu perfil e o painel" title="${esc(nome)} · ${esc(planLabel())}">${avatarHtml(S.profile)}<span class="topo-eu-t"><b>${esc(nome)}</b><small>${esc(planLabel())}</small></span><svg class="topo-eu-v" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>`;
  if (htAntes) $('#topo .topo-r').prepend(htAntes);
  $('#side').innerHTML = `<div class="brand"><span class="brand-full">${logoMarca()}</span><span class="brand-mini" aria-hidden="true">${LOGO}</span>
      <button class="side-tog" data-act="side-toggle" aria-expanded="${!mini}" aria-label="${mini ? 'Expandir o menu' : 'Recolher o menu'}" title="${mini ? 'Expandir o menu' : 'Recolher o menu'}">${I.chev}</button></div>
    <nav class="nav" aria-label="Seções">${navAgrupado(items, btn)}</nav>
    <div class="side-foot">${planoAtual() === 'gratis' ? cartaoPlanoHtml() : `<div class="advisor"><span class="adv-ic" aria-hidden="true">${esc(CFG.consultor.split(/\s+/).filter(Boolean).map((p, i, l) => (i === 0 || i === l.length - 1 ? p[0] : '')).join('').toUpperCase())}</span><div class="adv-t"><b>Seu assessor</b><span>${esc(CFG.consultor)}</span><small>Dúvidas sobre o seu planejamento? Fale direto, pelo canal que preferir.</small></div><button class="hp-btn sm" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div>`}<div class="save" data-s="${S.save}">${statusText()}</div></div>`;
  const prim = ['geral', 'despesas', 'inv', 'cart'].filter((k) => items.some((i) => i[0] === k));
  const rest = items.filter((i) => !prim.includes(i[0]));
  const sheet = S.maisOpen ? `<div class="sheet" role="dialog" aria-label="Mais opções">${rest.map(btn).join('')}<div class="sheet-conta" role="group" aria-label="Sua conta"><small aria-hidden="true">Sua conta</small><button data-act="perfil-abrir">${avatarHtml(S.profile, 'sm')}<span>Meu perfil</span></button><button data-act="admin-open">${I.user}<span>Painel administrativo</span></button>${basEscolhe() ? `<button data-act="bas-ui" data-v="basico">${I.geral}<span>Usar o ${BAS_NOMES.basico}</span></button>` : ''}<button data-act="contact">${I.chat}<span>Falar com o ${esc(primeiroNome())}</span></button></div></div>` : ''; // abas em cima; conta e contato embaixo, numa faixa mais escura
  $('#tabbar').innerHTML = `${sheet}<div class="tabs">${items.filter((i) => prim.includes(i[0])).map(btn).join('')}<button data-act="mais-toggle" aria-expanded="${S.maisOpen}">${I.mais}<span>Mais</span></button></div>`;
}

function emptyState() { return `<div class="empty-state"><h2>Crie o planejamento de ${S.year || NOW_Y}</h2><p>Comece com a estrutura: rendas, categorias de gastos, investimentos e proventos. Também é possível importar uma planilha .xlsx pelo painel administrativo.</p><div class="btn-row"><button class="btn primary lg" data-act="create-plan">Começar planejamento de ${S.year || NOW_Y}</button></div></div>`; }

function viewHtml() {
  if (modoBasico()) return basicoHtml();
  if (!S.plan) return emptyState();
  switch (S.view) {
    case 'rendas': return viewRendas();
    case 'despesas': return viewDespesas();
    case 'inv': return viewAssets('inv');
    case 'pro': return viewAssets('pro');
    case 'cart': return viewCart();
    case 'relatorio': return viewRelatorio();
    case 'clientes': return viewClientes();
    default: return viewGeral();
  }
}

function render(opts) {
  const soft = !!(opts && opts.soft);
  if (isEditing() || (soft && isTyping())) { S.needsRender = true; return; }
  const scr = S.screen;
  if (scr === 'app' && !navItems().some((i) => i[0] === S.view)) S.view = 'geral';
  if (scr !== 'app' || !alvoDaTela() || S.view !== S.wgView) { S.wgEdit = false; S.wgAdd = false; }
  S.wgView = S.view; // organizar vale nas telas com widgets e sai ao trocar de tela
  const key = scr + ':' + (scr === 'app' ? S.view : scr === 'onboarding' && S.ob ? S.ob.step + '.' + S.ob.q : scr === 'auth' ? S.authMode : '');
  const same = S.lastKey === key;
  if (soft && scr !== 'app' && same) return;
  S.needsRender = false; document.body.dataset.screen = scr; document.documentElement.dataset.icones = (S.profile && S.profile.instEstilo) || 'auto'; document.body.dataset.ui = modoBasico() ? 'basico' : 'completo'; S.renderSeq = (S.renderSeq || 0) + 1;
  const y = window.scrollY; const tw = $('.tablewrap'); const tws = tw ? [tw.scrollLeft, tw.scrollTop] : null;
  S.C = S.plan && S.profile ? E.compute(S.plan, planCtx()) : null;
  hideTip();
  $('#view').classList.toggle('tela-nova', !same); // a entrada anima só na troca de tela
  if (scr === 'app') { renderSide(); $('#view').innerHTML = viewHtml(); const ht = $('#view .htools'); const velho = $('#topo .htools'); if (velho) velho.remove(); const tr = $('#topo .topo-r'); if (ht && tr) tr.prepend(ht); if (tr) document.documentElement.style.setProperty('--topo-w', tr.offsetWidth + 'px'); } // olho, globo e período na linha da busca e do perfil; --topo-w reserva o espaço ao lado do título
  else {
    $('#side').innerHTML = ''; $('#tabbar').innerHTML = '';
    const h = { landing: landingHtml, auth: authHtml, onboarding: onboardingHtml, checkout: checkoutHtml }[scr];
    $('#view').innerHTML = h ? h() : scr === 'erro' ? `<div class="empty-state"><h2>Sem conexão</h2><p>${esc(S.fatal)}</p><button class="btn primary" onclick="location.reload()">Tentar de novo</button></div>` : '<div class="loading">Carregando…</div>';
  }
  const tw2 = $('.tablewrap'); if (tw2 && tws && same) { tw2.scrollLeft = tws[0]; tw2.scrollTop = tws[1]; }
  window.scrollTo(window.scrollX, same ? y : 0); S.lastKey = key;
  drawAll();
  if (scr === 'app' && typeof aberturaTalvez === 'function') aberturaTalvez();
  if (scr === 'app' && !modoBasico() && typeof tourTalvez === 'function') tourTalvez(); // não abre com o globo aberto; o abFechar chama de novo
  if (scr === 'app' && S.lastCount !== key + ':' + S.year) { S.lastCount = key + ':' + S.year; contarNumeros($('#view')); }
  if (scr === 'landing') initReveal();
  if (typeof notifTitulo === 'function') notifTitulo();
  if (S.yearOpen || S.perOpen) yearPopAjusta();
  observarGraficos();
  if (S.pendingFocus) { const c = findCell(S.pendingFocus.ri, S.pendingFocus.m); if (c) c.focus(); S.pendingFocus = null; }
  const ad = $('#admin'); if (S.adminOpen && ad && ad.open) { const ae = document.activeElement; if (!(ae && ad.contains(ae) && /INPUT|SELECT|TEXTAREA/.test(ae.tagName))) renderAdmin(); }
}
function drawAll() { if (S.screen === 'landing') drawLanding(); else if (S.screen === 'app') { if (modoBasico()) { basDesenhar(); return; } drawDashboard(); drawLedger(); drawAssets(); drawRelatorio(); } }
function renderLater() { S.stale = true; clearTimeout(S.staleT); S.staleT = setTimeout(() => { if (S.stale) { S.stale = false; render(); } }, 450); }

/* ---------- eventos ---------- */
function onClick(e) {
  const tgt = e.target;
  if (S.yearOpen && !(tgt.closest && tgt.closest('.year'))) { S.yearOpen = false; render(); }
  if (S.perOpen && !(tgt.closest && tgt.closest('.per'))) { S.perOpen = false; S.perIni = null; render(); }
  if (S.notifOpen && !(tgt.closest && tgt.closest('.notif'))) { S.notifOpen = false; notifRefresh(); }
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
      case 'nav': if (ds.view === 'geral' && S.view !== 'geral') S.titTrocar = true; /* voltou à Visão geral: frase nova no título */ S.view = ds.view; S.stale = false; S.maisOpen = false; S.notifOpen = false; closeAdmin(); render(); break;
      case 'mais-toggle': S.maisOpen = !S.maisOpen; render(); break;
      case 'obj-sw-mover': objSwMover(+ds.d); break;
      case 'prov-cel': provCalSel(el); break;
      case 'prov-modo': S.provModo = ds.m; el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el))); drawProv(); break;
      case 'patr-meta': S.patrMeta = !S.patrMeta; el.setAttribute('aria-pressed', String(S.patrMeta)); drawPatr(); break;
      case 'side-toggle': { const m = document.documentElement.classList.toggle('side-mini'); try { localStorage.setItem('fp:sideMini', m ? '1' : '0'); } catch (e) { /* ignora */ }
        renderSide(); const b = document.querySelector('.side-tog'); if (b) b.focus(); clearTimeout(resizeT); resizeT = setTimeout(drawAll, 300); break; } // gráficos acompanham a nova largura
      case 'toggle': { const set = S.closed[ds.kind]; if (set.has(ds.key)) set.delete(ds.key); else set.add(ds.key); S.stale = false; render(); break; }
      case 'expand-all': S.closed[ds.kind] = new Set(); render(); break;
      case 'planilha-toggle': S.planilha[ds.kind] = !S.planilha[ds.kind]; render(); if (S.planilha[ds.kind]) { const sec = document.querySelector('.sheet-sec'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } break;
      case 'collapse-all': S.closed[ds.kind] = new Set(groupKeys(E.buildAssetTree(p.ativos, ds.kind === 'inv' ? 'ap' : 'pr'), [])); render(); break;
      case 'toggle-cat': S.fechadas[ds.key] = !S.fechadas[ds.key]; render(); break;
      case 'mes': S.mes = +ds.m; render(); break;
      case 'modo': S.modo = ds.modo; render(); break;
      case 'add-item': if (ds.kind === 'desp') openLanc(null, { modo: ds.parc ? 'parcelado' : 'mensal', cat: ds.cat, area: ds.area, mes: ds.presetMes != null ? +ds.presetMes : undefined }); else openItem(ds.kind, null, { cat: ds.cat, area: ds.area, mes: ds.presetMes != null ? +ds.presetMes : undefined }); break; // gastos: o mesmo formulário do Novo gasto
      case 'add-lanc': openLanc(null, { mes: ds.mes != null ? +ds.mes : undefined }); break;
      case 'busca': buscaAbrir(); break;
      case 'inst-estilo': instEstiloDefinir(ds.v, el); break;
      case 'edit-lanc': openLanc(ds.id); break;
      case 'g-per': case 'g-mes': case 'g-tipo': case 'g-agrup': case 'g-area': case 'g-busca': case 'g-limpa': case 'g-mais': case 'g-pers': case 'g-limite': case 'g-fixo': gAcao(act, ds); break;
      case 'ingest-open': abrirIngestao(el.dataset.modo); break;
      case 'ing-edit': S.ing.editando = S.ing.editando === +ds.i ? null : +ds.i; renderIng(); break;
      case 'ing-filtro': S.ing.filtro = ds.f; renderIng(); break;
      case 'ing-ia': ingRefinar(); break;
      case 'tema': definirTema(ds.tema); break;
      case 'tema-cor': definirCor(ds.campo, ds.v); break;
      case 'tema-roda': { const c = rodaCor(el, e); if (c) definirCor('cor', c); break; }
      case 'voz': definirVoz(ds.voz); break;
      case 'rec-aplicar': recAplicar(); break;
      case 'rec-add': recAdd(); break;
      case 'rec-norm': recNorm(); break;
      case 'rec-del': { const r = el.closest('.rec-row'); if (r) { r.remove(); recSoma(); } break; }
      case 'cliente-abrir': abrirCliente(ds.id); break;
      case 'imprimir': window.print(); break;
      case 'regras-limpar': S.profile.regras = []; touch('profile'); renderAdmin(); toast('O painel esqueceu as regras aprendidas.'); break;
      case 'edit-item': if (ds.kind === 'desp') openLanc(null, { item: ds.id }); else openItem(ds.kind, ds.id); break;
      case 'rename-grp': openRename(ds.cat, ds.area, ds.sub); break;
      case 'cats': openCats(ds.kind); break;
      case 'cat-up': case 'cat-down': case 'cat-del': catAction(act, ds.id); break;
      case 'cat-add': { const inp = $('#modal [name=novacat]'); catAction('cat-add', null, inp ? inp.value : ''); break; }
      case 'orc-all': { const v = S.C.orcamento[ds.m != null ? +ds.m : S.mes]; p.settings.orcPadrao = v; p.orcamento = new Array(12).fill(null); commit(); toast('Orçamento aplicado a todos os meses.'); break; }
      case 'year-toggle': S.yearOpen = !S.yearOpen; S.perOpen = false; S.notifOpen = false; render(); break;
      case 'fluxo-modo': { S.fluxoModo = ds.v; const sec = el.closest('section'); if (sec) { sec.outerHTML = wFluxo(); drawFluxo(); if (typeof wgIcones === 'function') wgIcones(); } break; }
      case 'per-novo-ano': S.perNovoAno = !S.perNovoAno; render(); setTimeout(() => { const i = document.getElementById('yr-in'); if (i) i.focus(); }, 0); break;
      case 'per-toggle': S.perOpen = !S.perOpen; S.perIni = null; S.perNovoAno = false; S.yearOpen = false; S.notifOpen = false; render(); break;
      case 'per-atalho': { const n = +ds.n; const ref = perRef(); S.periodo = n >= 12 ? null : { de: Math.max(0, ref - n + 1), ate: ref }; S.perOpen = false; S.perIni = null; render(); const b = document.querySelector('[data-act="per-toggle"]'); if (b) b.focus(); break; }
      case 'per-mes': { // primeiro toque marca o início, o segundo fecha o período
        const m = +ds.m;
        if (S.perIni == null) { S.perIni = m; render(); const b = document.querySelector(`.per-m[data-m="${m}"]`); if (b) b.focus(); break; }
        const de = Math.min(S.perIni, m); const ate = Math.max(S.perIni, m); S.periodo = de === 0 && ate === 11 ? null : { de, ate }; S.perIni = null; S.perOpen = false; render();
        const b = document.querySelector('[data-act="per-toggle"]'); if (b) b.focus(); break;
      }
      case 'year-pick': if (+ds.year !== S.year) switchYear(+ds.year); else { S.yearOpen = false; render(); } break;
      case 'create-plan': createPlan(S.year || NOW_Y, null); break;
      case 'add-ativo': openAtivo(); break;
      case 'aporte-novo': openAporte(); break;
      case 'meta-padrao': S.plan.metasAporte[+ds.m] = null; commit(); break;
      case 'edit-ativo': openAtivo(ds.id); break;
      case 'cart-norm': cartNormalize(); break;
      case 'cart-equal': cartEqual(); break;
      case 'cart-clear': cartClear(); break;
      case 'cart-perfil': cartPerfil(); break;
      case 'cart-auto': S.cart.aporte = null; render(); break;
      case 'cart-valor-auto': { const e = cartEntry(ds.k, false); if (e) { e.valor = null; touch('profile'); render(); } break; }
      case 'cart-seg': cartCmpAbrir(+ds.cseg); break;
      case 'cart-expandir': cartExpandir(ds.w); break;
      case 'cart-cmp-volta': S.cmpClasse = null; cartCmpTrocar(); break;
      case 'ced-g': cedAlternar(el); break;
      case 'cart-alvos': { const sec = document.getElementById('cart-alvos'); if (sec) sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); break; }
      case 'cart-register': cartRegister(); break;
      case 'upgrade': iniciarCheckout(ds.plano); break;
      case 'checkout-back': S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break;
      case 'contact': S.maisOpen = false; openContact(); break;
      case 'terms': openTerms(); break;
      case 'conta-excluir': openModal({ title: 'Excluir minha conta', ok: 'Excluir para sempre',
        body: `<p class="mmsg keep">Isso apaga o cadastro, o perfil, o diagnóstico, todos os anos de planejamento e a assinatura. Não dá para desfazer. Se quiser guardar uma cópia, use antes “Baixar meus dados”.</p><label class="fld"><span>Para confirmar, escreva EXCLUIR</span><input name="conf" autocomplete="off" autocapitalize="characters"></label>`,
        onOk: (d, err) => { if (String(d.conf || '').trim().toUpperCase() !== 'EXCLUIR') { err('Escreva EXCLUIR para confirmar.'); return false; } closeAdmin(); excluirConta().catch((e) => toast(e && e.amigavel ? e.message : 'Não foi possível excluir a conta agora.')); } }); break;
      case 'as-dep': asDep(+ds.i); break;
      case 'adm-sec': { S.admSec = S.admSec || {}; const sec = el.closest('.dr-acc'); const ab = sec.dataset.open !== 'true'; S.admSec[ds.id] = ab; sec.dataset.open = ab; el.setAttribute('aria-expanded', ab); break; }
      case 'lp-confirma': case 'lp-set': case 'lp-tela': lpAcao(act, el); break;
      // "Quero a assessoria" (data-pagar) vai direto ao pagamento: logado, na hora; sem conta, logo depois do cadastro
      case 'go-auth': S.authPagar = !!ds.pagar && (ds.plano === 'completo' || ds.plano === 'investidor'); if (S.user && S.authPagar && !S.isAdmin) { S.authPagar = false; iniciarCheckout(ds.plano); break; } if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break; } S.authMode = ds.mode || 'signup'; S.authPlano = ds.plano === 'completo' || ds.plano === 'investidor' ? ds.plano : 'gratis'; S.authErr = ''; S.authDraft = null; S.screen = 'auth'; render(); break;
      case 'auth-mode': S.authMode = ds.mode; S.authErr = ''; S.authMsg = ''; render(); break;
      case 'goto-landing': closeAdmin(); S.screen = 'landing'; render(); break;
      case 'open-app': S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); break;
      case 'scroll': { const t = document.getElementById(ds.to); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
      case 'ob-back': { const f = $('#f-ob'); if (f) readOb(f); obBack(); break; }
      case 'quiz-pick': quizPick(+ds.i); break;
      case 'ob-finish': finishOb(); break;
      case 'ob-finish-pay': finishOb(); iniciarCheckout(S.profile.planoSolicitado); break;
      case 'ob-finish-talk': finishOb(); openContact(); break;
      case 'admin-open': S.maisOpen = false; openAdmin(); break;
      case 'ob-obj-add': case 'ob-obj-del': obObjAcao(act, ds); break;
      case 'admin-close': closeAdmin(); break;
      case 'ab-quando': aberturaQuando(ds.v, el); break;
      case 'ab-ver': aberturaVer(); break;
      case 'ab-valores': aberturaValores(ds.v, el); break;
      case 'ab-globo': aberturaGlobo(ds.v, el); break;
      case 'ab-estilo': aberturaEstilo(ds.v, el); break;
      case 'ab-abrir': aberturaAbrir(); break;
      case 'perfil-abrir': S.maisOpen = false; S.adminPage = 'perfil'; if (!S.adminOpen) openAdmin('perfil'); else renderAdmin(true); break;
      case 'perfil-voltar': S.adminPage = 'inicio'; renderAdmin(true); break;
      case 'adm-grupo': S.adminPage = 'grupo:' + ds.g; renderAdmin(true); { const b = document.querySelector('#admin [data-act="adm-voltar"]'); if (b) b.focus(); } break;
      case 'adm-voltar': { const era = S.adminPage; S.adminPage = 'inicio'; renderAdmin(true); const b = document.querySelector(`#admin [data-act="adm-grupo"][data-g="${era.replace('grupo:', '')}"]`); if (b) b.focus(); break; }
      case 'avatar': definirAvatar({ tipo: 'preset', id: ds.av }); break;
      case 'avatar-remover': definirAvatar(null); break;
      case 'backup': backupCompleto(); break;
      case 'bk-apply': aplicarBackup(); break;
      case 'bk-cancel': S.bk = null; renderAdmin(); break;
      case 'download-template': baixarModelo(); break;
      case 'imp-apply': aplicarPlanilha(); break;
      case 'imp-cancel': S.imp = { state: 'idle', mode: S.imp.mode }; renderAdmin(); break;
      case 'refazer-perfil': refazerPerfil(); break;
      case 'del-year': confirmBox(`Excluir o planejamento de ${ds.year}?`, 'Todos os valores deste ano serão apagados. Esta ação não pode ser desfeita. Faça um backup antes, se precisar.', 'Excluir', () => deletePlan(+ds.year)); break;
      case 'sair': closeAdmin(); sair(); break;
      case 'privado': alternarPrivado(); break;
      default: if (!basAcao(act, ds, el) && !notifAcao(act, ds) && !iaAcao(act, ds) && !simAcao(act, ds) && !histAcao(act, ds) && !objAcao(act, ds) && !painelAcao(act, ds)) wgAcao(act, ds); break;
    }
  }
  if (S.stale) { S.stale = false; clearTimeout(S.staleT); render(); }
}

function onSubmit(e) {
  const f = e.target;
  if (f.id === 'f-auth') { e.preventDefault(); submitAuth(f); }
  else if (f.id === 'lp-comeco') { e.preventDefault(); lpComecar(); }
  else if (f.dataset.form === 'ia') { e.preventDefault(); iaSubmit(f); }
  else if (f.id === 'f-ob') { e.preventDefault(); if (readOb(f)) { if (S.ob.step === OB_STEPS.length - 1) finishOb(); else obNext(); } }
  else if (f.dataset.form === 'year') { e.preventDefault(); const v = parseInt(new FormData(f).get('ano'), 10); if (!anoValido(v)) { const m = $('.merr', f); if (m) { m.textContent = 'Informe um ano entre 1990 e 2100.'; m.classList.add('show'); } toast('Informe um ano entre 1990 e 2100.'); return; } S.yearOpen = false; abrirAno(v); }
}

function onChange(e) {
  const t = e.target;
  if (t.id === 'ing-file') { const f = t.files && t.files[0]; if (f) ingLer(f); return; }
  if (t.id === 'av-file') { const f = t.files && t.files[0]; t.value = ''; if (f) enviarFoto(f); return; }
  if (t.matches('[data-ing]')) { ingCampo(+t.dataset.i, t.dataset.ing, t.value, t.checked); return; }
  if (t.matches('[data-ing-conta]')) { ingConta(t.value); return; }
  if (t.matches('[data-ing-col]')) { ingMapa(t.dataset.ingCol, t.value); return; }
  if (t.closest && t.closest('#admin') && onAdminChange(t)) return;
  if (t.matches('[data-cat-name]')) { catAction('cat-rename', t.dataset.catName, t.value); return; }
  if (t.matches('[data-plano-cli]')) { setPlanoCliente(t.dataset.planoCli, t.value); return; }
  if (t.matches('[data-cartv]')) { cartCampoGravar(t); return; }
  if (t.matches('[data-cart="mes"]')) { S.cart.mes = +t.value; renderLater(); return; }
  if (t.matches('[data-cart="aporte"]')) {
    if (oculto() && !t.value.trim()) return; // com valores ocultos, campo vazio não muda nada
    const v = E.parseValor(t.value); if (Number.isNaN(v) || v < 0) { toast('Valor de aporte inválido.'); t.value = nf.format(cartModel().aporte); return; }
    S.cart.aporte = v; t.value = nf.format(v); renderLater();
  }
}

let filterT = null;
function onInput(e) {
  const t = e.target; if (!(t.matches)) return;
  const refocus = (sel, pos) => { const n = $(sel); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* ignora */ } } };
  if (t.matches('[data-sim]')) { simInput(t); return; }
  if (t.matches('[data-lp]')) { lpInput(t); return; }
  if (t.matches('[data-gf]')) { gInput(t); return; }
  if (t.matches('[data-cartv]')) { cartCampoVivo(t); return; }
  if (t.matches('[data-filter]')) { S.filter[t.dataset.filter] = t.value; clearTimeout(filterT); filterT = setTimeout(() => { const pos = t.selectionStart; render(); refocus(`[data-filter="${t.dataset.filter}"]`, pos); }, 160); }
  if (t.matches('[data-clients-q]')) { S.clientsQ = t.value; clearTimeout(filterT); filterT = setTimeout(() => { const pos = t.selectionStart; render(); refocus('[data-clients-q]', pos); }, 160); }
}

/* ---------- busca rápida (Ctrl+K ou a lupa do topo, só em Gastos, Investimentos e Proventos): lançamentos, gastos previstos, ativos e proventos do ano aberto ---------- */
const I_LUPA = ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>');
// a busca só existe em Gastos, Investimentos e Proventos
const BUSCA_ABAS = ['despesas', 'inv', 'pro'];
const buscaBtnHtml = () => (!BUSCA_ABAS.includes(S.view) ? '' : `<button class="ab-ir" data-act="busca" aria-label="Buscar (Ctrl+K)" title="Buscar (Ctrl+K)">${I_LUPA}</button>`);
function navPara(v) { closeModal(); S.view = v; S.stale = false; S.maisOpen = false; S.notifOpen = false; closeAdmin(); render(); }
function buscaItens() {
  const p = S.plan; const L = []; const dt = (s) => { const d = E.parseDataISO(s); return d ? `${pad2(d.dia)}/${pad2(d.mes + 1)}` : ''; };
  if (p) {
    p.lancamentos.forEach((l) => L.push({ t: l.valor < 0 ? 'Estorno' : 'Gasto', n: l.desc, s: [dt(l.data), l.area, brl(Math.abs(l.valor)), (instDe(l.inst) || [])[1]].filter(Boolean).join(' · '), go: () => { navPara('despesas'); openLanc(l.id); } }));
    p.despesas.forEach((it) => L.push({ t: it.parcel ? 'Parcelamento' : 'Gasto previsto', n: it.nome, s: [it.area, (instDe(it.inst) || [])[1]].filter(Boolean).join(' · '), go: () => { navPara('despesas'); openLanc(null, { item: it.id }); } }));
    (p.ativos || []).forEach((a) => { L.push({ t: 'Ativo', n: a.nome, s: a.classe || '', go: () => navPara('inv') });
      const pr = (a.pr || []).reduce((t, v) => t + (+v || 0), 0); if (pr > 0) L.push({ t: 'Proventos', n: a.nome, s: brl(pr) + ' no ano', go: () => navPara('pro') }); });
  }
  return L;
}
function buscaAbrir() {
  if (S.screen !== 'app' || !BUSCA_ABAS.includes(S.view)) return; const itens = buscaItens(); let achados = [];
  const f = openModal({ title: 'Buscar', ok: 'Abrir', body: `<input class="search busca-in" name="q" type="search" placeholder="Gasto, ativo ou provento" autocomplete="off" aria-label="Buscar" aria-controls="busca-res"><ul class="busca-res" id="busca-res" role="listbox"></ul>`,
    onOk: () => { if (achados[0]) { achados[0].go(); return false; } return false; } });
  const res = f.querySelector('#busca-res'); const inp = f.elements.q;
  // todas as palavras precisam aparecer (sem acento nem maiúscula); sem texto, mostra as telas
  const desenhar = () => { const q = E.norm(inp.value).split(/\s+/).filter(Boolean);
    achados = (q.length ? itens.filter((x) => { const h = E.norm(`${x.n} ${x.s} ${x.t}`); return q.every((w) => h.includes(w)); }) : []).slice(0, 30);
    res.innerHTML = achados.length ? achados.map((x, i) => `<li><button type="button" class="busca-it" data-i="${i}" role="option"><span><b>${esc(x.n)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span><em>${esc(x.t)}</em></button></li>`).join('') : `<li class="busca-vazio">${inp.value.trim() ? 'Nada encontrado.' : 'Digite para buscar gastos, ativos e proventos.'}</li>`; };
  inp.addEventListener('input', desenhar); res.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) achados[+b.dataset.i].go(); });
  desenhar();
}
function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K') && S.screen === 'app') { e.preventDefault(); buscaAbrir(); return; }
  if (e.key === 'Escape' && S.notifOpen) { S.notifOpen = false; notifRefresh('.bell'); return; }
  if (e.key === 'Escape' && S.yearOpen) { S.yearOpen = false; render(); return; }
  if (e.key === 'Escape' && S.perOpen) { S.perOpen = false; S.perIni = null; render(); const b = document.querySelector('[data-act="per-toggle"]'); if (b) b.focus(); return; }
  if (e.key === 'Escape' && S.cartExp) { cartExpFechar(); return; }
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
/* gráficos acompanham a largura do próprio cartão (não só da janela): mudou a largura de um widget, redesenha */
const graficoRO = 'ResizeObserver' in window ? new ResizeObserver((es) => {
  if (S.wgArrastando) return;
  const mudou = es.some((e) => { const svg = e.target.querySelector('svg'); const w = Math.floor(e.contentRect.width); return w > 0 && svg && Math.abs((+svg.getAttribute('width') || 0) - Math.max(200, w)) > 6; });
  if (mudou) { clearTimeout(resizeT); resizeT = setTimeout(drawAll, 120); }
}) : null;
function observarGraficos() { if (!graficoRO) return; graficoRO.disconnect(); document.querySelectorAll('#view .chart').forEach((c) => graficoRO.observe(c)); }
function bind() {
  document.addEventListener('click', onClick); document.addEventListener('change', onChange); document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey); document.addEventListener('submit', onSubmit);
  infoIniciar(); painelDnD(); wgGestos(); // botão "i": descrições ficam atrás de um ícone ao lado do título
  document.addEventListener('focusout', () => { if (S.needsRender) setTimeout(() => { if (S.needsRender && !isEditing() && !isTyping()) render(); }, 80); });
  $('#modal').addEventListener('close', () => { if (!$('#modal').open) $('#modal').classList.remove('dialog-wide'); if (!$('#modal').open && S.ing && S.ing.estado !== 'lendo') S.ing = null; if (S.needsRender) render(); if (S.adminOpen) renderAdmin(); });
  document.addEventListener('dragover', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('on'); } });
  document.addEventListener('dragleave', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (d) d.classList.remove('on'); });
  document.addEventListener('drop', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.remove('on'); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) ingLer(f); } });
  $('#admin').addEventListener('close', () => { S.adminOpen = false; if (S.needsRender) render(); });
  $('#admin').addEventListener('click', (e) => { if (e.target === $('#admin')) closeAdmin(); });
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(drawAll, 150); });
  window.addEventListener('pagehide', () => { flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
}

window.__fp = { S, E, CFG, Store, render, FPIngest };
bind(); render(); boot();
