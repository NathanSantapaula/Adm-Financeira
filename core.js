/* Núcleo: estado, sessão, salvamento, anos e jornada do cliente. */
'use strict';
const E = window.FPEngine;
const CFG = window.FP_CONFIG;
const { MES, MES_LONGO } = E;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
const clone = (o) => JSON.parse(JSON.stringify(o));
const z12 = () => new Array(12).fill(0);
const NOW = new Date(); const NOW_M = NOW.getMonth(); const NOW_Y = NOW.getFullYear();
const primeiroNome = () => (CFG.consultorCurto || CFG.consultor.split(' ')[0]);

const ABAS = [
  ['geral', 'Visão geral', 'Boas-vindas, patrimônio e estatísticas do seu planejamento.'],
  ['rendas', 'Rendas', 'Suas fontes de renda, em categorias que você define.'],
  ['despesas', 'Conta corrente', 'Orçamento do mês e gastos por categoria.'],
  ['inv', 'Investimentos', 'Quanto você aplica em cada ativo.'],
  ['pro', 'Proventos', 'Dividendos e rendimentos recebidos.'],
  ['cart', 'Carteira', 'Alocação-alvo e onde investir a cada aporte.'],
];
const ABA_KEYS = ABAS.map((a) => a[0]);

const S = {
  screen: 'boot', view: 'geral', authMode: 'login', authMsg: '', authErr: '', fatal: '',
  user: null, profile: null, assinatura: { plano: 'gratis', status: 'ativo' }, isAdmin: false,
  plans: {}, year: null, plan: null, C: null, mes: NOW_M, modo: 'mes', fechadas: {},
  closed: { inv: new Set(), pro: new Set() }, filter: { inv: '', pro: '' },
  ob: null, adminOpen: false, cart: { mes: null, aporte: null }, imp: { state: 'idle', mode: 'merge' }, clients: null, clientsQ: '',
  save: 'idle', stale: false, needsRender: false, pendingFocus: null, lastKey: null, yearOpen: false, maisOpen: false,
};
const SV = { plan: { dirty: false, saving: false, timer: null, failed: false }, profile: { dirty: false, saving: false, timer: null, failed: false } };
let RI = 0; let FIRST_ED = true;

/* ---------- normalização dos dados ---------- */
const f12 = (a, fill) => { a = Array.isArray(a) ? a.slice(0, 12) : []; while (a.length < 12) a.push(fill); return a.map((x) => (x == null && fill === null ? null : +x || 0)); };
function hydratePlan(raw) {
  const p = E.migratePlan(clone(raw), uid);
  p.year = +p.year;
  p.settings = Object.assign({ metaAporte: 0, metaInvAno: 0, orcPadrao: 0 }, p.settings || {});
  p.rendaCats = Array.isArray(p.rendaCats) ? p.rendaCats : E.CATS_RENDA();
  p.catsDesp = Array.isArray(p.catsDesp) ? p.catsDesp : E.CATS_DESP();
  p.rendas = (p.rendas || []).map((r) => Object.assign({ fonte: '' }, r, { id: r.id || uid(), valores: f12(r.valores, 0) }));
  p.despesas = (p.despesas || []).map((d) => Object.assign({ sub: '' }, d, { id: d.id || uid(), valores: f12(d.valores, 0) }));
  p.orcamento = Array.isArray(p.orcamento) ? p.orcamento.slice(0, 12).concat(new Array(12).fill(null)).slice(0, 12).map((x) => (x == null ? null : +x)) : new Array(12).fill(null);
  p.ativos = (p.ativos || []).map((a) => Object.assign({}, a, { id: a.id || uid(), grupo: a.grupo || null, subgrupo: a.subgrupo || null, ap: f12(a.ap, 0), pr: f12(a.pr, 0) }));
  p.updatedAt = p.updatedAt || 0;
  return p;
}
function hydrateProfile(p) {
  p = Object.assign({}, p);
  let abas = Array.isArray(p.abas) ? p.abas.filter((k) => ABA_KEYS.includes(k)) : ABA_KEYS.slice();
  if (!abas.includes('geral')) abas.unshift('geral');
  p.abas = abas;
  p.carteira = Array.isArray(p.carteira) ? p.carteira.map((e) => ({ k: String(e.k), alvo: +e.alvo || 0, valor: e.valor == null ? null : +e.valor, preco: e.preco == null ? null : +e.preco })) : [];
  p.nome = p.nome || ''; p.email = p.email || ''; p.whatsapp = p.whatsapp || '';
  p.patrimonioInicial = +p.patrimonioInicial || 0; p.rendaMensal = +p.rendaMensal || 0;
  p.anoRef = (p.anoRef | 0) || NOW_Y; p.onboarded = !!p.onboarded; p.retornoAnual = p.retornoAnual != null ? +p.retornoAnual : 10;
  p.planoSolicitado = p.planoSolicitado === 'completo' ? 'completo' : null;
  return p;
}
function blankPlan(year, base) {
  const p = { v: 2, year, updatedAt: Date.now(), settings: { metaAporte: 0, metaInvAno: 0, orcPadrao: 0 }, rendaCats: E.CATS_RENDA(), rendas: [], catsDesp: E.CATS_DESP(), despesas: [], orcamento: new Array(12).fill(null), ativos: [] };
  if (base) {
    p.settings = Object.assign({}, base.settings, { metaInvAno: 0 });
    p.rendaCats = clone(base.rendaCats); p.catsDesp = clone(base.catsDesp);
    p.rendas = base.rendas.map((r) => Object.assign({}, r, { id: uid(), valores: z12() }));
    p.despesas = base.despesas.filter((d) => !d.parcel).map((d) => Object.assign({}, d, { id: uid(), valores: z12() }));
    p.ativos = base.ativos.map((a) => Object.assign({}, a, { id: uid(), ap: z12(), pr: z12() }));
  }
  return p;
}
const defaultMes = (y) => (y === NOW_Y ? NOW_M : 0);

/* ---------- plano contratado ---------- */
const hasFull = () => Store.mode === 'local' || S.isAdmin || (S.assinatura.plano === 'completo' && S.assinatura.status === 'ativo');
const gated = (key) => !!CFG.gates[key] && !hasFull();
const planLabel = () => (S.isAdmin ? 'Consultor' : Store.mode === 'local' ? 'Demonstração' : hasFull() ? 'Plano completo' : S.profile && S.profile.planoSolicitado ? 'Completo, aguardando confirmação' : 'Plano gratuito');
const visibleTabs = () => (S.profile ? S.profile.abas : ABA_KEYS);

/* ---------- contexto de cálculo (parcelas herdadas, patrimônio acumulado) ---------- */
function planCtx() {
  let prev = 0;
  Object.keys(S.plans).map(Number).filter((y) => y < S.year).forEach((y) => { (S.plans[y].ativos || []).forEach((a) => { prev += E.sum(a.ap); }); });
  return { carry: E.carryItems(S.plans, S.year), prevAplicado: prev, patrimonioInicial: S.profile ? S.profile.patrimonioInicial : 0 };
}

/* ---------- salvamento (com antecipação para não perder o que foi digitado) ---------- */
const anyBusy = () => SV.plan.dirty || SV.plan.saving || SV.profile.dirty || SV.profile.saving;
function statusText() {
  switch (S.save) {
    case 'pending': return 'Alterações pendentes';
    case 'saving': return 'Salvando…';
    case 'saved': return Store.mode === 'cloud' ? 'Salvo na nuvem' : 'Salvo neste navegador';
    case 'error': return 'Falha ao salvar. Tentando de novo…';
    default: return '';
  }
}
function setStatus(s) { S.save = s; $$('.save').forEach((el) => { el.dataset.s = s; el.textContent = statusText(); }); }
function touch(kind) {
  kind = kind || 'plan'; const o = kind === 'plan' ? S.plan : S.profile; if (!o) return;
  o.updatedAt = Date.now(); SV[kind].dirty = true; setStatus('pending');
  clearTimeout(SV[kind].timer); SV[kind].timer = setTimeout(() => flush(kind), 700);
}
async function flush(kind) {
  if (!kind) { await flush('plan'); await flush('profile'); return; }
  const sv = SV[kind]; clearTimeout(sv.timer); const obj = kind === 'plan' ? S.plan : S.profile;
  if (sv.saving || !sv.dirty || !obj || !S.user) return;
  sv.saving = true; sv.dirty = false; sv.failed = false; setStatus('saving');
  const snap = clone(obj);
  try {
    if (kind === 'plan') await Store.savePlan(snap.year, snap, S.user); else await Store.saveProfile(snap, S.user);
    if (!anyBusy()) setStatus('saved');
  } catch (e) { sv.failed = true; sv.dirty = true; setStatus('error'); sv.timer = setTimeout(() => flush(kind), 5000); }
  finally { sv.saving = false; if (!sv.failed && sv.dirty) sv.timer = setTimeout(() => flush(kind), 250); }
}

/* ---------- sessão ---------- */
async function boot() {
  try {
    const user = await Store.init();
    Store.onAuth(onAuthEvent);
    if (user) await entrar(user); else S.screen = 'landing';
  } catch (e) { console.error(e); S.screen = 'erro'; S.fatal = 'Não foi possível conectar ao servidor. Verifique sua internet e a configuração do Supabase em assets/js/config.js.'; }
  render();
}
async function entrar(user) {
  const d = await Store.loadAll(user);
  S.user = user; S.assinatura = d.assinatura || { plano: 'gratis', status: 'ativo' }; S.isAdmin = !!d.isAdmin;
  S.plans = {}; Object.keys(d.planos || {}).forEach((y) => { S.plans[y] = hydratePlan(d.planos[y]); });
  if (d.perfil) S.profile = hydrateProfile(d.perfil);
  else {
    S.profile = hydrateProfile({ nome: user.nome, email: user.email, whatsapp: user.whatsapp, consentimento: true, criadoEm: new Date().toISOString() });
    try { if (localStorage.getItem('fp:plano') === 'completo') { S.profile.planoSolicitado = 'completo'; localStorage.removeItem('fp:plano'); } } catch (e) { /* ignora */ }
    touch('profile');
  }
  S.year = pickYear(); S.plan = S.plans[S.year] || null; S.mes = defaultMes(S.year);
  S.view = 'geral'; S.clients = null;
  S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding') initOb();
}
function pickYear() {
  const ref = S.profile && S.profile.anoRef; const ys = Object.keys(S.plans).map(Number).sort();
  if (ref && S.plans[ref]) return ref; if (S.plans[NOW_Y]) return NOW_Y; return ys.length ? ys[ys.length - 1] : (ref || NOW_Y);
}
async function onAuthEvent(event, user) {
  if (event === 'SIGNED_OUT') { if (S.screen !== 'landing') { resetSession(); render(); } return; }
  if (event === 'PASSWORD_RECOVERY') { S.recoveryUser = user; S.screen = 'auth'; S.authMode = 'recovery'; S.authErr = ''; render(); return; }
  if (event === 'SIGNED_IN' && user && (!S.user || S.user.id !== user.id) && S.authMode !== 'recovery') { try { await entrar(user); } catch (e) { S.authErr = 'Não foi possível carregar seus dados.'; } render(); }
}
function resetSession() {
  clearTimeout(SV.plan.timer); clearTimeout(SV.profile.timer);
  SV.plan.dirty = SV.profile.dirty = false;
  Object.assign(S, { user: null, profile: null, plans: {}, plan: null, year: null, C: null, screen: 'landing', view: 'geral', adminOpen: false, authMode: 'login', authErr: '', authMsg: '', ob: null, clients: null, isAdmin: false, assinatura: { plano: 'gratis', status: 'ativo' } });
}
async function sair() { await flush(); try { await Store.signOut(); } catch (e) { /* ignora */ } resetSession(); render(); }

/* ---------- anos: abrir, criar, excluir (de qualquer tela) ---------- */
const anoValido = (y) => Number.isInteger(y) && y >= 1990 && y <= 2100;
async function switchYear(y) {
  await flush('plan'); S.year = y; S.plan = S.plans[y]; S.mes = defaultMes(y); S.yearOpen = false;
  S.profile.anoRef = y; touch('profile'); render();
}
function createPlan(year, base) {
  S.plans[year] = blankPlan(year, base); S.year = year; S.plan = S.plans[year]; S.mes = defaultMes(year); S.yearOpen = false;
  S.profile.anoRef = year; touch('profile'); touch('plan'); render();
}
async function deletePlan(year) {
  if (Object.keys(S.plans).length <= 1) { toast('Mantenha ao menos um ano de planejamento.'); return; }
  try { await Store.deletePlan(year, S.user); } catch (e) { toast('Não foi possível excluir agora. Tente de novo.'); return; }
  delete S.plans[year];
  if (S.year === year) { S.year = pickYear(); S.plan = S.plans[S.year]; S.mes = defaultMes(S.year); S.profile.anoRef = S.year; touch('profile'); }
  render();
}

/* ---------- onboarding e diagnóstico ---------- */
function initOb() {
  const p = S.profile; const pl = S.plans[p.anoRef];
  S.ob = { step: 0, q: 0, nome: p.nome || '', anoRef: p.anoRef || NOW_Y, patrimonio: p.patrimonioInicial || '', renda: p.rendaMensal || '',
    resp: (p.perfilInvestidor && p.perfilInvestidor.respostas) || [], perfil: p.perfilInvestidor || null,
    objTipo: (p.objetivo && p.objetivo.tipo) || 'independencia', objValor: (p.objetivo && p.objetivo.valor) || '', objAno: (p.objetivo && p.objetivo.ano) || NOW_Y + 10,
    metaAporte: (pl && pl.settings.metaAporte) || '', metaInvAno: (pl && pl.settings.metaInvAno) || '' };
}
function finishOb() {
  const o = S.ob; const perfil = o.perfil || { resultado: 'moderado', pontos: 0 };
  Object.assign(S.profile, { nome: o.nome.trim(), anoRef: +o.anoRef, patrimonioInicial: +o.patrimonio || 0, rendaMensal: +o.renda || 0,
    perfilInvestidor: { resultado: perfil.resultado, pontos: perfil.pontos, respostas: o.resp }, objetivo: { tipo: o.objTipo, valor: +o.objValor || 0, ano: +o.objAno },
    retornoAnual: E.RETORNO_PADRAO[perfil.resultado], onboarded: true });
  touch('profile');
  if (!S.plans[o.anoRef]) createPlan(+o.anoRef, null); else { S.year = +o.anoRef; S.plan = S.plans[S.year]; S.mes = defaultMes(S.year); }
  S.plan.settings.metaAporte = +o.metaAporte || 0; S.plan.settings.metaInvAno = +o.metaInvAno || 0; touch('plan');
  S.ob = null; S.screen = 'app'; S.view = 'geral'; render();
}

/* ---------- avisos ---------- */
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
