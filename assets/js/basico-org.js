// Organizar as abas como na tela de início do iPhone: segura um bloco até ele tremer, arrasta para mudar a posição,
// "−" tira da tela, "Adicionar" coloca os que não estão, "OK" termina. Sem ir para outra página.
(() => {
  const ABAS = () => (typeof BAS_SECS === 'object' ? BAS_SECS : {});
  const aba = () => (S && S.basAba) || 'inicio';
  const editando = () => S.basEdita && S.basEdita === aba() && ABAS()[aba()];
  const vibra = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* sem vibração */ } };
  const lista = () => { const s = document.querySelector('.bas-sec[data-sec]'); return s ? s.parentElement : null; };
  const salva = () => { const L = lista(); if (!L) return; const a = aba(); const vis = [...L.querySelectorAll(':scope > .bas-sec[data-sec]')].map((x) => x.dataset.sec);
    const resto = basOrdemDe(a).filter((id) => !vis.includes(id)); const p = S.profile; p.basOrdem = p.basOrdem || {}; p.basOrdem[a] = vis.concat(resto); touch('profile'); };
  const nomeDe = (a, id) => ((ABAS()[a] || []).find((x) => x[0] === id) || [, id])[1];

  function entra() { if (!ABAS()[aba()]) return; S.basEdita = aba(); vibra(12); decora(); }
  function sai() { S.basEdita = null; fechaFolha(); document.documentElement.classList.remove('bas-edita'); document.querySelectorAll('.bas-ed-x, .bas-ed-bar').forEach((x) => x.remove()); }

  // pinta o modo de edição depois de cada desenho da tela
  function decora() {
    const on = editando(); document.documentElement.classList.toggle('bas-edita', !!on);
    if (!on) { document.querySelectorAll('.bas-ed-x, .bas-ed-bar').forEach((x) => x.remove()); return; }
    const a = aba();
    document.querySelectorAll('.bas-sec[data-sec]').forEach((s, i) => { s.style.setProperty('--k', i % 4);
      if (!s.querySelector(':scope > .bas-ed-x')) s.insertAdjacentHTML('afterbegin', `<button type="button" class="bas-ed-x" data-act="bas-ord-vis" data-aba="${a}" data-id="${s.dataset.sec}" aria-label="Tirar ${esc(nomeDe(a, s.dataset.sec))} da tela"></button>`); });
    if (!document.querySelector('.bas-ed-bar')) {
      const fora = basOrdemDe(a).filter((id) => basOculto(a, id));
      document.body.insertAdjacentHTML('beforeend', `<div class="bas-ed-bar" role="toolbar" aria-label="Organizar a tela"><button type="button" class="bas-ed-add" data-ed="add"${fora.length ? '' : ' disabled'}><span aria-hidden="true">+</span>Adicionar</button><span class="bas-ed-dica">Segure e arraste</span><button type="button" class="bas-ed-ok" data-ed="ok">OK</button></div>`);
    }
  }
  function fechaFolha() { document.querySelector('.bas-ed-folha')?.remove(); }
  function abreFolha() {
    const a = aba(); const fora = basOrdemDe(a).filter((id) => basOculto(a, id)); fechaFolha(); if (!fora.length) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="bas-ed-folha" role="dialog" aria-label="Adicionar widget"><div class="bas-ed-fundo" data-ed="fecha"></div><div class="bas-ed-cx"><span class="bas-ed-alca" aria-hidden="true"></span><h3>Adicionar à tela</h3>
      <ul>${fora.map((id) => `<li><span>${esc(nomeDe(a, id))}</span><button type="button" class="bas-ed-mais" data-act="bas-ord-vis" data-aba="${a}" data-id="${id}" aria-label="Colocar ${esc(nomeDe(a, id))} na tela">+</button></li>`).join('')}</ul></div></div>`);
  }

  // segurar para entrar no modo e já arrastar; no modo, segurar um instante e arrastar
  let toque = null; let arr = null; let engoleClique = false;
  const ESPERA_FORA = 520; const ESPERA_DENTRO = 160;
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || arr) return; engoleClique = false; const s = e.target.closest('.bas-sec[data-sec]'); if (!s || !ABAS()[aba()] || e.target.closest('.bas-ed-x')) return;
    if (!lista() || !lista().contains(s)) return;
    const dentro = editando(); const x0 = e.clientX, y0 = e.clientY;
    toque = { s, x0, y0, id: e.pointerId, t: setTimeout(() => { if (!toque) return; if (!dentro) entra(); comeca(toque.s, toque.y0); }, dentro ? ESPERA_DENTRO : ESPERA_FORA) };
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (arr) { move(e.clientY); return; }
    if (toque && (Math.abs(e.clientX - toque.x0) > 9 || Math.abs(e.clientY - toque.y0) > 9)) { clearTimeout(toque.t); toque = null; }
  }, true);
  const fim = () => { if (toque) { clearTimeout(toque.t); toque = null; } if (arr) solta(); };
  document.addEventListener('pointerup', fim, true); document.addEventListener('pointercancel', fim, true);
  // enquanto arrasta, a página não rola (o iPhone só respeita isso num touchmove não passivo)
  document.addEventListener('touchmove', (e) => { if (arr) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (toque || arr) e.preventDefault(); }, true);

  function comeca(s, y) { toque = null; engoleClique = true; vibra(8); const r = s.getBoundingClientRect(); arr = { s, y0: y, dy: 0, h: r.height, rolar: 0 }; s.classList.add('bas-ed-pega'); }
  function move(y) {
    const L = lista(); if (!L || !arr) return; const s = arr.s; arr.ultY = y; let dy = y - arr.y0;
    const irmas = [...L.querySelectorAll(':scope > .bas-sec[data-sec]')].filter((x) => x !== s);
    for (const o of irmas) { const r = o.getBoundingClientRect(); const meio = r.top + r.height / 2;
      const antes = o.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING; // o está antes de s
      if (dy < 0 && antes && y < meio) { const t0 = s.getBoundingClientRect().top; L.insertBefore(s, o); const t1 = s.getBoundingClientRect().top - dy; arr.y0 += t1 - t0; dy = y - arr.y0; vibra(4); break; }
      if (dy > 0 && !antes && y > meio) { const t0 = s.getBoundingClientRect().top; L.insertBefore(s, o.nextSibling); const t1 = s.getBoundingClientRect().top - dy; arr.y0 += t1 - t0; dy = y - arr.y0; vibra(4); break; } }
    s.style.translate = `0 ${dy}px`;
    // perto da borda, a página rola sozinha
    const borda = 90; const v = y < borda ? -(borda - y) / 6 : y > innerHeight - borda - 40 ? (y - (innerHeight - borda - 40)) / 6 : 0;
    if (v && !arr.rolar) { const passo = () => { if (!arr || !arr.vel) { if (arr) arr.rolar = 0; return; } scrollBy(0, arr.vel); arr.y0 -= arr.vel; move(arr.ultY); arr.rolar = requestAnimationFrame(passo); }; arr.vel = v; arr.rolar = requestAnimationFrame(passo); }
    arr.vel = v;
  }
  function solta() { const s = arr.s; arr.vel = 0; cancelAnimationFrame(arr.rolar); arr = null; s.classList.remove('bas-ed-pega'); s.classList.add('bas-ed-cai'); s.style.translate = '';
    setTimeout(() => s.classList.remove('bas-ed-cai'), 320); setTimeout(() => { engoleClique = false; }, 350); salva(); try { basSom('toque'); } catch (er) { /* sem som */ } }

  // no modo de edição os blocos não abrem nada; o "Organizar esta tela" entra no modo aqui mesmo
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.bas-org')) { e.preventDefault(); e.stopImmediatePropagation(); if (editando()) sai(); else { entra(); scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    const ed = t.closest('[data-ed]'); if (ed) { e.preventDefault(); e.stopImmediatePropagation(); if (ed.dataset.ed === 'ok') sai(); else if (ed.dataset.ed === 'add') abreFolha(); else fechaFolha(); return; }
    if (engoleClique) { engoleClique = false; if (t.closest('.bas-sec')) { e.preventDefault(); e.stopImmediatePropagation(); return; } }
    if (editando() && t.closest('.bas-sec[data-sec]') && !t.closest('.bas-ed-x')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // ao colocar um widget pela folha, a folha fecha
  document.addEventListener('click', (e) => { if (e.target.closest('.bas-ed-mais')) setTimeout(fechaFolha, 0); });
  // trocou de aba ou de tela: sai do modo
  let pend = 0; new MutationObserver(() => { if (pend) return; pend = setTimeout(() => { pend = 0; if (S.basEdita && S.basEdita !== aba()) sai(); else decora(); }, 30); }).observe(document.body, { childList: true, subtree: true });
})();

// Saúde financeira: o Cifrão lê a "ficha" das suas finanças (os olhos correm as linhas), termina e reage à nota
(() => {
  const liga = (w) => {
    if (w.dataset.on) return; w.dataset.on = '1'; const h = w.querySelector('.cifrao'); const pap = w.querySelector('.bas-sdx-pap'); const nota = w.dataset.nota === '' ? null : +w.dataset.nota;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; const C = () => window.Cifrao;
    const olha = (x, y) => h && h.dispatchEvent(new CustomEvent('cifrao:olhar', { detail: { x, y } }));
    const fim = () => { w.classList.add('lido'); try { if (nota == null) C().expressao(h, 'confuso'); else if (nota >= 80) { C().expressao(h, 'comemorando'); setTimeout(() => C().forma(h, 'mais'), 900); } else if (nota >= 60) C().expressao(h, 'confiante'); else C().expressao(h, 'frio'); } catch (e) { /* sem Cifrão */ } };
    if (quieto) { fim(); return; }
    setTimeout(() => { try { C().expressao(h, 'pensando'); } catch (e) { /* ignora */ } }, 300);
    // cada linha: da esquerda para a direita, descendo
    const linhas = [...pap.querySelectorAll('i')]; let k = 0;
    const le = () => { if (!w.isConnected) return; if (k >= linhas.length) { fim(); return; } const r = linhas[k].getBoundingClientRect(); pap.style.setProperty('--l', k); olha(r.left, r.top); setTimeout(() => olha(r.right, r.top), 380); k++; setTimeout(le, 720); };
    setTimeout(le, 700);
  };
  new MutationObserver(() => document.querySelectorAll('.bas-sdx-le:not([data-on])').forEach(liga)).observe(document.body, { childList: true, subtree: true });
})();

// Cartão: setinhas nas bordas mostram que dá para passar para os outros cartões (tocar também passa)
(() => {
  const vai = (d) => { try { const ks = basGastoInsts().map((x) => x.k); const t = basPilha()[basPilha().length - 1]; const i = ks.indexOf(t.id); if (ks.length < 2 || i < 0) return; t.id = ks[(i + d + ks.length) % ks.length]; S.basCtDir = d; basSom('toque'); render(); } catch (e) { /* ignora */ } };
  const poe = () => { const c = document.querySelector('.bas-ct2-card'); if (!c || c.parentElement.querySelector('.bas-ct2-seta')) return; let n = 0; try { n = basGastoInsts().length; } catch (e) { return; } if (n < 2) return;
    c.insertAdjacentHTML('afterend', '<button type="button" class="bas-ct2-seta d" data-ct-seta="1" aria-label="Próximo cartão"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button><button type="button" class="bas-ct2-seta e" data-ct-seta="-1" aria-label="Cartão anterior"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button>'); };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-ct-seta]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); vai(+b.dataset.ctSeta); }, true);
  let p = 0; new MutationObserver(() => { if (p) return; p = setTimeout(() => { p = 0; poe(); }, 30); }).observe(document.body, { childList: true, subtree: true });
})();
