/* Cifrão: digitação mais fácil nos formulários (máscara R$, Enter, teclado do iPhone, Salvar acima do teclado). Carrega por último. */
(() => {
  'use strict';
  // campo de reais: decimal dentro do app, sem "%" ao lado (os de % seguem livres)
  const ehRs = (el) => el && el.matches && el.matches('input[inputmode="decimal"]') && el.closest('.bas, .bas-form, .bas-gp, dialog') && !/%/.test(el.parentElement ? el.parentElement.textContent : '');

  // máscara fluida: 2500 -> 2.500, vírgula para centavos (até 2 casas); ponto digitado no fim vira vírgula
  const fmtRs = (v, data) => {
    let s = String(v);
    if (data === '.' && !s.includes(',') && s.endsWith('.')) s = s.slice(0, -1) + ',';
    const k = s.indexOf(',');
    let int = (k < 0 ? s : s.slice(0, k)).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const dec = k < 0 ? null : s.slice(k + 1).replace(/\D/g, '').slice(0, 2);
    if (dec != null && !int) int = '0';
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dec != null ? ',' + dec : '');
  };
  document.addEventListener('input', (e) => {
    const el = e.target; if (!ehRs(el) || /[+\-=*/]/.test(el.value)) return;
    const pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    const antes = el.value.slice(0, pos).replace(/[^\d,]/g, '').length + (e.data === '.' ? 1 : 0); // dígitos e vírgula antes do cursor (o ponto digitado vira vírgula)
    const novo = fmtRs(el.value, e.data); if (novo === el.value) return;
    el.value = novo;
    let i = 0, n = 0; while (i < novo.length && n < antes) { if (/[\d,]/.test(novo[i])) n++; i++; }
    try { el.setSelectionRange(i, i); } catch (er) { /* alguns tipos não aceitam */ }
  }, true);

  // valor grande do Gasto: a caixa cresce com o número, então o "R$" fica colado nele
  const larg = (el) => { el.style.width = Math.max(4, (el.value || el.placeholder || '').length) + 0.4 + 'ch'; };
  document.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('.bas-gf-vin input')) larg(e.target); });
  const view = document.getElementById('view');
  if (view) new MutationObserver(() => { const el = view.querySelector('.bas-gf-vin input'); if (el && !el.style.width) larg(el); }).observe(view, { childList: true, subtree: true });

  // Enter: vai para o próximo campo vazio do formulário; sem nenhum, salva (submit normal)
  const texto = (x) => x.matches('input:not([type]), input[type="text"], input[type="search"], input[type="tel"], input[type="email"]') && !x.readOnly && !x.disabled && x.offsetParent !== null;
  const proximo = (el) => { const f = el.form; if (!f) return null; const l = [...f.elements].filter(texto); return l.slice(l.indexOf(el) + 1).find((x) => !x.value.trim()) || null; };
  document.addEventListener('focusin', (e) => { const el = e.target; if (el.form && el.form.dataset.form === 'bas' && texto(el) && !el.hasAttribute('enterkeyhint')) el.setAttribute('enterkeyhint', proximo(el) ? 'next' : 'done'); });
  document.addEventListener('keydown', (e) => {
    const el = e.target; if (e.key !== 'Enter' || e.isComposing || !el.form || el.form.dataset.form !== 'bas' || !texto(el)) return;
    const n = proximo(el); if (n) { e.preventDefault(); n.focus(); }
  });

  // iPhone: o teclado só abre com foco dentro do toque. Um campo provisório pega o foco no toque
  // e passa para o valor quando a tela nova aparece (o teclado numérico já sobe aberto).
  const COM_VALOR = ['gasto', 'entrada', 'aporte', 'meta', 'limite', 'provento', 'conta-f', 'ponto'];
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-act="bas-abrir"]');
    if (!b || !COM_VALOR.includes(b.dataset.t) || b.dataset.id || !matchMedia('(pointer: coarse)').matches) return;
    const px = document.createElement('input'); px.setAttribute('inputmode', 'decimal'); px.setAttribute('aria-hidden', 'true'); px.tabIndex = -1;
    px.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0';
    document.body.appendChild(px); px.focus({ preventScroll: true });
    const t0 = Date.now();
    const passa = () => {
      const alvo = document.querySelector('#view .bas-form [data-foco]');
      if (alvo && document.activeElement === px) { alvo.focus({ preventScroll: true }); px.remove(); return; }
      if (document.activeElement !== px || Date.now() - t0 > 1500) { px.remove(); return; }
      requestAnimationFrame(passa);
    };
    requestAnimationFrame(passa);
  }, true);

  // teclado aberto: --kb = altura que ele cobre; o Salvar (sticky) sobe junto
  const vv = window.visualViewport;
  if (vv) {
    const kb = () => { const h = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)); document.documentElement.style.setProperty('--kb', h + 'px'); document.documentElement.classList.toggle('kb-on', h > 80); };
    vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb);
  }
})();

// arrastar para confirmar (gasto, entrada e investimento): o botão segue o dedo; antes do fim volta com mola,
// no fim vira um "ok", vibra e salva. Enter/Espaço e o toque do VoiceOver no botão também confirmam.
(() => {
  'use strict';
  const FIM = 0.82; let ar = null;
  const vib = (ms) => { if (typeof basVibra === 'function') basVibra(ms); };
  const max = (w) => { const b = w.querySelector('.bas-desl-b'); return Math.max(1, w.clientWidth - b.offsetWidth - 2 * b.offsetLeft); };
  const pos = (w, x) => { w.style.setProperty('--max', max(w) + 'px'); w.style.setProperty('--x', x.toFixed(1) + 'px'); w.style.setProperty('--p', Math.max(0, Math.min(1, x / max(w))).toFixed(3)); };
  const mola = (w, x) => { w.classList.add('mola'); pos(w, x); clearTimeout(w._t); w._t = setTimeout(() => w.classList.remove('mola'), 560); };
  const volta = (w, erro) => { w.classList.remove('feito', 'puxa'); mola(w, 0); if (erro) { w.classList.remove('treme'); void w.offsetWidth; w.classList.add('treme'); vib(30); } };
  const confirma = (w) => {
    w.classList.add('feito'); mola(w, max(w)); vib(18); if (typeof basSom === 'function') basSom('toque');
    const f = w.closest('form'); const err = f && f.querySelector('.bas-err');
    setTimeout(() => { if (!f || !f.isConnected) return; if (err) err.hidden = true; f.requestSubmit();
      setTimeout(() => { if (w.isConnected && err && !err.hidden) volta(w, true); }, 60); }, 260);
  };
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.bas-desl-b'); if (!b || e.button) return; const w = b.closest('.bas-desl'); if (w.classList.contains('feito')) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* segue sem captura */ }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // fecha o teclado para ver o fim do trilho
    ar = { w, x0: e.clientX, m: max(w), id: e.pointerId, passou: false, mx: 0 }; w.classList.remove('mola', 'treme'); w.classList.add('puxa'); vib(6);
  });
  document.addEventListener('pointermove', (e) => {
    if (!ar || e.pointerId !== ar.id) return; let x = e.clientX - ar.x0; ar.mx = Math.max(ar.mx, Math.abs(x));
    x = Math.max(0, Math.min(ar.m, x)); // nunca passa das pontas
    pos(ar.w, x); const p = x / ar.m >= FIM; if (p !== ar.passou) { ar.passou = p; vib(p ? 12 : 4); }
  });
  const solta = (e) => {
    if (!ar || e.pointerId !== ar.id) return; const { w, passou, mx } = ar; ar = null; w.classList.remove('puxa');
    if (passou && e.type === 'pointerup') confirma(w);
    else if (mx < 6) { mola(w, 46); setTimeout(() => mola(w, 0), 200); } // só tocou: mostra o caminho
    else volta(w);
  };
  document.addEventListener('pointerup', solta); document.addEventListener('pointercancel', solta);
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.bas-desl-b'); if (b && e.detail === 0 && !b.closest('.feito')) confirma(b.closest('.bas-desl')); });
})();

// barra da IA: o microfone dita a pergunta no campo (vazio: voz e microfone; com texto: microfone e enviar, só no CSS)
(() => {
  let rec = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.bas-iax-mic'); if (!b) return; const f = b.closest('form'); const q = f && f.querySelector('[name="q"]'); if (!q) return;
    if (rec) { rec.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { q.focus(); return; } // sem ditado no navegador: o do teclado resolve
    const base = q.value ? q.value.replace(/\s*$/, ' ') : ''; rec = new SR(); rec.lang = document.documentElement.lang || 'pt-BR'; rec.interimResults = true; rec.continuous = false;
    rec.onstart = () => { b.classList.add('on'); if (typeof basVibra === 'function') basVibra(8); };
    rec.onresult = (ev) => { q.value = base + [...ev.results].map((r) => r[0].transcript).join(''); q.dispatchEvent(new Event('input', { bubbles: true })); };
    rec.onend = rec.onerror = () => { b.classList.remove('on'); rec = null; };
    try { rec.start(); } catch (er) { rec = null; q.focus(); }
  });
})();
