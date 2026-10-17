/* Interface comum: formatação, ícones, edição de células, tabelas, modais e contato. */
'use strict';
const nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const bf0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/* Olho oculto: com S.privado ligado, valores em reais viram "R$ ••••" em todo o app; percentuais continuam visíveis.
   Vale só dentro do painel (a página inicial não muda) e fica salvo neste aparelho. */
const MASCARA = '••••';
const oculto = () => typeof S !== 'undefined' && !!S.privado && S.screen === 'app';
// campos de valor em reais digitados pelo cliente: "300.000" é trezentos mil (ponto de milhar), não trezentos
const parseReais = (txt) => { const t = String(txt == null ? '' : txt).replace(/R\$|\s/g, ''); return /^\d{1,3}(\.\d{3})+$/.test(t) ? +t.replace(/\./g, '') : E.parseValor(t); };
const fmt = (v) => (Math.abs(v) < 0.005 ? '–' : oculto() ? MASCARA : nf.format(v));
const brl = (v) => (oculto() ? 'R$ ' + MASCARA : bf.format(Math.abs(v) < 0.005 ? 0 : v));
const brl0 = (v) => (oculto() ? 'R$ ' + MASCARA : bf0.format(Math.abs(v) < 0.5 ? 0 : v));
const pct = (v, d = 0) => (v == null || !isFinite(v) ? '–' : (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: d }) + '%');
const fmtPct = (v) => (Math.abs(v) < 0.005 ? '–' : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%');
const fmtPp = (v) => (Math.abs(v) < 0.05 ? '–' : (v > 0 ? '+' : '−') + Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' p.p.');

const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  geral: ic('<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>'),
  rendas: ic('<path d="M12 4v11m0 0-4-4m4 4 4-4"/><path d="M5 19h14"/>'),
  despesas: ic('<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>'),
  inv: ic('<path d="M4 17 9.5 11l4 4L20 7"/><path d="M15 7h5v5"/>'),
  pro: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 14.3c.4.9 1.3 1.4 2.5 1.4 1.4 0 2.4-.7 2.4-1.7 0-2.3-4.9-1.2-4.9-3.5 0-1 1-1.7 2.4-1.7 1.1 0 2 .5 2.4 1.3"/>'),
  cart: ic('<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>'),
  clientes: ic('<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-4.8 5.5-4.8s4.9 1.6 5.5 4.8"/><path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.5c2 .4 3.4 1.9 3.8 4.5"/>'),
  relatorio: ic('<path d="M7 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14.5 3.5V8H19M9 12.5h6M9 16h6"/>'),
  mais: ic('<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>'),
  chev: ic('<path d="m9 6 6 6-6 6"/>'),
  down: ic('<path d="m6 9 6 6 6-6"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
  chat: ic('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V17h0A2.5 2.5 0 0 1 4 14.5z"/>'),
  lock: ic('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  user: ic('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/>'),
  up: ic('<path d="m6 15 6-6 6 6"/>'),
  edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
};
/* Marca AVEN: letras desenhadas em grade de altura 100 (não dependem de fonte).
   O "A" sem travessa é uma seta para cima, com a seta azul dentro; "A" e "V" juntos formam duas setas.
   Cores seguem o tema (currentColor / --ink / --bg); a seta é azul (AVEN_AZUL), exceto no tema Personalizado com outra cor,
   em que acompanha as letras (classe seta-aven, regra :root[data-mono] em app.css). */
const AVEN_AZUL = '#0A84FF';
const AVEN_A = 'M0 100 33 0h26l33 100H67L46 34 25 100Z';
const AVEN_V = 'M0 0h25l21 66L67 0h25L59 100H33Z';
const AVEN_SETA = `<path class="seta-aven" d="M46 56 61 100H31Z" fill="${AVEN_AZUL}"/>`;
const AVEN_LETRAS = `<path d="${AVEN_A}"/>${AVEN_SETA}<path transform="translate(69 0)" d="${AVEN_V}"/><path transform="translate(171 0)" d="M0 0h66v21H24v19h36v20H24v19h42v21H0Z"/><path transform="translate(247 0)" d="M0 100V0h23l38 58V0h23v100H61L23 42v58Z"/>`;
// Ícone (quadrado com "AV" e a seta azul): favicon, ícone do app e espaços pequenos
const LOGO = `<svg class="logo-ic" width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="var(--ink)"/><g transform="translate(14.6 28) scale(.44)"><path d="${AVEN_A}" fill="var(--bg)"/>${AVEN_SETA}<path transform="translate(69 0)" d="${AVEN_V}" fill="var(--bg)"/></g></svg>`;
// Assinatura completa: AVEN + subtítulo
const logoMarca = (cls) => `<span class="marca${cls ? ' ' + cls : ''}" role="img" aria-label="${esc(CFG.marca)}${CFG.submarca ? ', ' + esc(CFG.submarca) : ''}"><svg class="marca-w" viewBox="0 0 331 100" fill="currentColor" aria-hidden="true">${AVEN_LETRAS}</svg>${CFG.submarca ? `<span class="marca-s" aria-hidden="true">${esc(CFG.submarca)}</span>` : ''}</span>`;

/* ---------- contato com o consultor ---------- */
const waDigits = () => String(CFG.whatsapp || '').replace(/\D/g, '');
const waLink = (msg) => (waDigits() ? 'https://wa.me/' + waDigits() + (msg ? '?text=' + encodeURIComponent(msg) : '') : '');
const mailLink = (subj, body) => (CFG.email ? 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body || '') : '');
const baseMsg = (extra) => `Olá, ${primeiroNome()}! ${S.profile && S.profile.nome ? 'Aqui é ' + S.profile.nome + '. ' : ''}${extra || `Gostaria de conversar sobre o meu planejamento no ${CFG.marca}.`}`;
const ext = 'target="_blank" rel="noopener noreferrer"';
function contactButtons(msg, subj, o) {
  o = o || {}; const b = [];
  if (CFG.agendaUrl) b.push(`<a class="btn primary" href="${esc(CFG.agendaUrl)}" ${ext}>Agendar conversa</a>`);
  const w = waLink(msg || baseMsg()); if (w) b.push(`<a class="btn ${CFG.agendaUrl ? '' : 'primary'}" href="${esc(w)}" ${ext}>WhatsApp</a>`);
  const m = mailLink(subj || CFG.marca, msg || baseMsg()); if (m) b.push(`<a class="btn" href="${esc(m)}" ${ext}>E-mail</a>`);
  if (CFG.linkedinUrl) b.push(`<a class="btn" href="${esc(CFG.linkedinUrl)}" ${ext}>LinkedIn</a>`);
  if (!b.length) return `<p class="cap">Os canais de contato do ${esc(primeiroNome())} estão sendo configurados.</p>`;
  return `<div class="btn-row">${b.join('')}</div>`;
}
function openContact() { infoBox(`Falar com o ${primeiroNome()}`, `<p class="mmsg">${esc(CFG.consultor)} atende diretamente os clientes do ${esc(CFG.marca)}. Escolha o canal de sua preferência.</p>${contactButtons()}`); }
function openTerms() {
  infoBox('Termos e privacidade', `<div class="terms">
    <p>O ${esc(CFG.marca)} é uma ferramenta de organização financeira oferecida por ${esc(CFG.consultor)}. Ela não constitui oferta nem recomendação individual de investimento.</p>
    <p>${Store.mode === 'cloud' ? 'Seus lançamentos ficam salvos na sua conta, em servidor protegido por login, e só você tem acesso a eles.' : 'Neste modo de demonstração, seus lançamentos ficam salvos apenas neste navegador.'}</p>
    <p>Seu nome, contato, foto ou avatar de perfil (se você escolher um) e o resultado do diagnóstico (patrimônio informado, perfil de investidor e objetivo) são visíveis para ${esc(CFG.consultor)}, para que ele possa atendê-lo. Os lançamentos detalhados do planejamento só ficam visíveis para ${esc(CFG.consultor)} se você contratar o plano Assessoria, para que ele possa acompanhar e orientar você.</p>
    <p>Quando você usa a leitura de PDF por IA (plano Assessoria), o conteúdo do arquivo é enviado a um provedor de inteligência artificial apenas para extrair os lançamentos e é apagado em seguida.</p>
    <p>O questionário de perfil é uma versão simplificada e não substitui a análise de adequação (suitability) feita na assessoria.</p></div>`);
}

/* ---------- edição de células (qualquer elemento com a classe "ed") ---------- */
const findCell = (ri, m) => document.querySelector(`.ed[data-ri="${ri}"][data-m="${m}"]`);
const findAny = (ri) => document.querySelector(`.ed[data-ri="${ri}"]`);
const isEditing = () => !!document.querySelector('.cell-input') || !!($('#modal') && $('#modal').open) || !!(typeof S !== 'undefined' && S.wgArrastando);
const isTyping = () => {
  const a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !['checkbox', 'radio', 'file', 'button', 'submit'].includes(a.type) && (a.closest('#view') || a.closest('#admin')));
};
function neighbor(ri, m, dir) {
  if (dir === 'left' || dir === 'right') { const dm = dir === 'right' ? 1 : -1; for (let mm = m + dm; mm >= 0 && mm < 12; mm += dm) if (findCell(ri, mm)) return { ri, m: mm }; return null; }
  const dr = dir === 'down' ? 1 : -1;
  for (let rr = ri + dr; rr >= 0 && rr < RI; rr += dr) { const c = findCell(rr, m) || findAny(rr); if (c) return { ri: rr, m: +c.dataset.m }; }
  return null;
}
const CART_FIELD = { al: 'alvo', va: 'valor', pc: 'preco' };
const kindOf = (k) => (CART_FIELD[k] ? 'profile' : 'plan');
function cartEntry(key, create) {
  const c = S.profile.carteira; let e = c.find((x) => x.k === key);
  if (!e && create) { e = { k: key, alvo: 0, valor: null, preco: null }; c.push(e); }
  return e;
}
function applyCell(ds, val, empty) {
  const p = S.plan; const m = +ds.m;
  if (ds.k === 'rv') { const r = p.rendas.find((x) => x.id === ds.id); if (r) r.valores[m] = val; }
  else if (ds.k === 'dv') { const d = p.despesas.find((x) => x.id === ds.id); if (d && !d.parcel) d.valores[m] = val; }
  else if (ds.k === 'orc') p.orcamento[m] = empty ? null : val;
  else if (ds.k === 'ma') p.settings.metaAporte = Math.max(0, empty ? 0 : val);
  else if (ds.k === 'ap' || ds.k === 'pr') { const a = p.ativos.find((x) => x.id === ds.id); if (a) a[ds.k][m] = val; }
  else if (CART_FIELD[ds.k]) { const e = cartEntry(ds.id, true); e[CART_FIELD[ds.k]] = empty && ds.k !== 'al' ? null : val; }
  return kindOf(ds.k);
}
function paintCell(el, val) {
  el.classList.remove('editing', 'z', 'neg', 'auto');
  if (Math.abs(val) < 0.005) el.classList.add('z');
  if (val < -0.004) el.classList.add('neg');
  el.dataset.v = String(val);
  el.textContent = el.dataset.fmt === 'pct' ? fmtPct(val) : el.dataset.fmt === 'brl' ? brl0(val) : fmt(val);
}
function startEdit(el, seed) {
  if (el.classList.contains('editing')) return;
  const cur = +el.dataset.v || 0; const isPct = el.dataset.fmt === 'pct';
  const inp = document.createElement('input');
  inp.className = 'cell-input'; inp.setAttribute('inputmode', 'decimal'); inp.setAttribute('autocomplete', 'off'); inp.setAttribute('aria-label', isPct ? 'Percentual' : 'Valor em reais');
  inp.value = seed != null ? seed : (Math.abs(cur) < 0.005 || el.classList.contains('auto') ? '' : String(cur).replace('.', ','));
  el.classList.add('editing'); el.textContent = ''; el.appendChild(inp); inp.focus();
  if (seed == null) inp.select(); else inp.setSelectionRange(inp.value.length, inp.value.length);
  let done = false;
  const finish = (mode, dir) => {
    if (done) return;
    const ri = +el.dataset.ri; const m = +el.dataset.m;
    if (mode === 'cancel') { done = true; paintCell(el, cur); el.focus(); return; }
    const raw = inp.value.replace('%', ''); const empty = raw.trim() === ''; const val = el.dataset.k === 'ma' ? (empty ? 0 : parseReais(raw)) : E.parseValor(raw); // meta: "2.200" = dois mil e duzentos
    if (Number.isNaN(val)) {
      if (dir) { inp.classList.add('bad'); inp.select(); toast('Valor inválido. Use números como 1.234,56'); return; }
      done = true; paintCell(el, cur); toast('Valor inválido. A edição foi descartada.'); return;
    }
    done = true;
    const optional = el.dataset.k === 'orc' || (CART_FIELD[el.dataset.k] && el.dataset.k !== 'al');
    const changed = Math.abs(val - cur) >= 0.005 || (empty && optional && !el.classList.contains('auto') && el.dataset.k !== 'orc');
    const orcChanged = el.dataset.k === 'orc' && (empty ? el.dataset.custom === '1' : Math.abs(val - cur) >= 0.005);
    if (changed || orcChanged) { const kind = applyCell(el.dataset, val, empty); touch(kind); }
    if (dir) { const nxt = neighbor(ri, m, dir); S.pendingFocus = nxt || { ri, m }; S.stale = false; paintCell(el, val); render(); }
    else { paintCell(el, val); if (changed || orcChanged) S.stale = true; }
  };
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish('commit', e.shiftKey ? 'up' : 'down'); }
    else if (e.key === 'Tab') { e.preventDefault(); finish('commit', e.shiftKey ? 'left' : 'right'); }
    else if (e.key === 'Escape') { e.preventDefault(); finish('cancel'); }
  });
  inp.addEventListener('blur', () => finish('commit', null));
}

/* ---------- tabelas de 12 meses ---------- */
const curCls = (m) => (S.year === NOW_Y && m === NOW_M ? 'cur' : '');
const cellCls = (v, m, extra) => ['num', curCls(m), Math.abs(v) < 0.005 ? 'z' : '', v < -0.004 ? 'neg' : '', extra || ''].filter(Boolean).join(' ');
function cell(v, m, o) {
  o = o || {};
  if (o.k) {
    const ti = FIRST_ED ? 0 : -1; FIRST_ED = false; const txt = o.fmt === 'pct' ? fmtPct(v) : fmt(v);
    return `<td class="${cellCls(v, o.col != null ? -1 : m, 'ed' + (o.auto ? ' auto' : ''))}" data-k="${o.k}" data-id="${esc(o.id || '')}" data-m="${m}" data-ri="${o.ri}" data-v="${v}"${o.fmt ? ` data-fmt="${o.fmt}"` : ''} tabindex="${ti}">${txt}</td>`;
  }
  return `<td class="${cellCls(v, m)}">${fmt(v)}</td>`;
}
function cells(v, o) { o = o || {}; let h = ''; for (let m = 0; m < 12; m++) h += cell(v[m], m, o); const t = E.sum(v); return h + `<td class="${cellCls(t, -1, 'tot')}">${fmt(t)}</td>`; }
const headRow = (first) => `<thead><tr><th class="lab">${esc(first)}</th>${MES.map((m, i) => `<th class="${curCls(i)}">${m}</th>`).join('')}<th class="tot">Total</th></tr></thead>`;
const labRow = (label, v, o) => `<tr class="${(o && o.cls) || ''}"><td class="lab"><div class="in" style="--d:${(o && o.d) || 0}"><span>${esc(label)}</span></div></td>${cells(v, o)}</tr>`;
const chevBtn = (kind, key, open, label) => `<button class="chev" data-act="toggle" data-kind="${kind}" data-key="${esc(key)}" aria-expanded="${open}" aria-label="${open ? 'Recolher' : 'Expandir'} ${esc(label)}">${I.chev}</button>`;
function groupRow(o) {
  const chev = o.kind ? chevBtn(o.kind, o.key, o.open, o.label) : '';
  const name = o.act ? `<button class="lnk" data-act="${o.act}" data-id="${esc(o.id)}">${esc(o.label)}</button>` : `<span>${esc(o.label)}</span>`;
  return `<tr class="r-g d${Math.min(o.depth, 2)}"><td class="lab"><div class="in" style="--d:${o.depth}">${chev}${name}</div></td>${cells(o.v)}</tr>`;
}
const addBtn = (act, label, extra) => `<button class="btn primary" data-act="${act}" ${extra || ''}>${I.plus}${esc(label)}</button>`;

/* ---------- cabeçalho de página e seletor de ano (em todas as telas) ---------- */
// Botão do olho: alterna a exibição dos valores (aria-pressed = valores ocultos)
const I_OLHO = ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>');
const I_OLHO_OFF = ic('<path d="M3 3l18 18"/><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 3.9M6.3 7.4C3.9 9.2 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
function olhoHtml() {
  const on = !!S.privado; const r = on ? 'Mostrar valores' : 'Ocultar valores';
  return `<button class="olho" data-act="privado" aria-pressed="${on}" aria-label="${r}" title="${r}">${on ? I_OLHO_OFF : I_OLHO}</button>`;
}
function alternarPrivado() {
  S.privado = !S.privado; try { localStorage.setItem('fp:privado', S.privado ? '1' : '0'); } catch (e) { /* ignora */ }
  document.documentElement.dataset.privado = S.privado ? '1' : '0';
  const y = window.scrollY; render(); window.scrollTo(window.scrollX, y);
  const b = document.querySelector('.olho'); if (b) b.focus();
  toast(S.privado ? 'Valores ocultos. Os percentuais continuam visíveis.' : 'Valores visíveis.');
}
function yearControl(extra) {
  const ys = Object.keys(S.plans).map(Number).sort();
  const list = ys.map((y) => `<button class="yr-opt${y === S.year ? ' on' : ''}" data-act="year-pick" data-year="${y}">${y}${y === S.year ? I.check : ''}</button>`).join('');
  const sino = typeof sinoHtml === 'function' ? sinoHtml() : '';
  const globo = typeof aberturaBtnHtml === 'function' ? aberturaBtnHtml() : '';
  return `<div class="htools">${olhoHtml()}${globo}${sino}${extra || ''}<div class="year"><button class="year-pill" data-act="year-toggle" aria-haspopup="true" aria-expanded="${S.yearOpen}"><span>${S.year}</span>${I.down}</button>
    ${S.yearOpen ? `<div class="popover" role="dialog" aria-label="Escolher ano"><div class="pop-t">Planejamento de</div><div class="yr-list">${list}</div>
      <form class="yr-new" data-form="year"><label class="pop-t" for="yr-in">Outro ano</label><div class="act-row"><input id="yr-in" name="ano" class="in-s left" inputmode="numeric" maxlength="4" placeholder="Ex.: ${NOW_Y + 1}" autocomplete="off"><button class="btn primary" type="submit">Abrir</button></div><div class="merr" role="alert"></div></form></div>` : ''}</div></div>`;
}
// o balão abre alinhado à direita do botão; se não couber (no celular o botão fica à esquerda), desliza para dentro da tela
function yearPopAjusta() {
  const p = document.querySelector('.year .popover'); if (!p) return;
  p.style.left = ''; p.style.right = ''; p.style.transformOrigin = '';
  const m = 12; const W = document.documentElement.clientWidth; const base = p.parentElement.getBoundingClientRect(); const r = p.getBoundingClientRect();
  if (r.left < m) { p.style.right = 'auto'; p.style.left = Math.min(0, m - base.left) + 'px'; p.style.transformOrigin = 'top left'; }
  else if (r.right > W - m) { p.style.right = (r.right - (W - m)) + 'px'; }
}
const pageHead = (title, sub, acts) => `<div class="page-h"><div><h2 class="title">${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div><div class="acts">${acts || ''}${yearControl()}</div></div>`;

/* ---------- modais ---------- */
function openModal(o) {
  const d = $('#modal'); if (d.open) d.close();
  const tst = $('#toast'); // o aviso pode estar dentro deste painel (ver toastHost): não deixa ele sumir no redesenho
  d.innerHTML = `<form class="mform" id="mform" novalidate><header><h3>${esc(o.title)}</h3></header><div class="mbody">${o.body || ''}<div class="merr" id="merr" role="alert"></div></div><footer>${o.danger ? `<button type="button" class="btn danger" id="m-danger">${esc(o.danger)}</button>` : ''}<span class="sp"></span>${o.noCancel ? '' : '<button type="button" class="btn" id="m-cancel">Cancelar</button>'}<button type="submit" class="btn primary">${esc(o.ok || 'Salvar')}</button></footer></form>`;
  if (tst && !tst.isConnected) d.appendChild(tst);
  const f = $('#mform'); const err = (msg) => { $('#merr').textContent = msg; };
  f.addEventListener('submit', (ev) => { ev.preventDefault(); const data = Object.fromEntries(new FormData(f).entries()); if (o.onOk(data, err, f) !== false) closeModal(); });
  if (!o.noCancel) $('#m-cancel').onclick = closeModal;
  if (o.danger) $('#m-danger').onclick = () => { if (o.onDanger() !== false) closeModal(); };
  d.classList.toggle('dialog-wide', !!o.wide);
  d.showModal(); const first = f.querySelector('input:not([type=radio]):not([type=checkbox]),select'); if (first && !o.noFocus) first.focus();
  return f;
}
const closeModal = () => { const d = $('#modal'); if (d.open) d.close(); };
function confirmBox(title, msg, okLabel, onYes) { openModal({ title, body: `<p class="mmsg">${esc(msg)}</p>`, ok: okLabel, onOk: () => { onYes(); } }); }
function infoBox(title, body) { openModal({ title, body, ok: 'Fechar', noCancel: true, onOk: () => true }); }
const commit = () => { touch('plan'); render(); };
const sel = (name, opts, cur) => `<select name="${name}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const dlist = (id, arr) => `<datalist id="${id}">${[...new Set(arr)].filter(Boolean).map((x) => `<option value="${esc(x)}"></option>`).join('')}</datalist>`;

/* ---------- arquivos ---------- */
function saveFile(filename, data, mime) {
  const blob = new Blob([data], { type: mime || 'application/octet-stream' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* Números grandes contam de 0 até o valor ao entrar na tela (uma vez por tela e ano). */
function contarNumeros(root) {
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('entrando'); clearTimeout(root._entT); root._entT = setTimeout(() => root.classList.remove('entrando'), 1200);
  root.querySelectorAll('.c-big, .macc-sum .big, .kpi-v .num, .lib-v').forEach((el) => {
    const m = /^([^\d]*?)(\d{1,3}(?:\.\d{3})*|\d+)(,\d+)?(.*)$/.exec(el.textContent.trim()); if (!m) return;
    const alvo = +m[2].replace(/\./g, ''); if (!(alvo > 0)) return;
    const fmt = (v) => m[1] + Math.round(v).toLocaleString('pt-BR') + (m[3] || '') + m[4];
    const final = el.textContent; const t0 = performance.now(); const dur = Math.min(900, 380 + Math.log10(alvo + 1) * 90);
    el.classList.add('counting');
    const passo = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = k < 1 ? fmt(alvo * e) : final; if (k < 1) requestAnimationFrame(passo); else el.classList.remove('counting'); };
    requestAnimationFrame(passo);
  });
}
