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
  const COM_VALOR = ['gasto', 'aporte', 'meta', 'limite', 'provento', 'conta-f', 'ponto'];
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
