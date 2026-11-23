/* ---- sons e háptico dos momentos que importam (Web Audio sintetizado, sem arquivos) ----
   Carrega depois de basico.js e basico-org.js: estende basSom com tipos novos e envolve funções globais (não edita o basico). */
(() => {
  if (typeof basSom !== 'function') return;
  const rm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // preferência: liga por padrão; desliga se o perfil disser sons === false (basSomLigado do basico é fixo em false)
  const ligado = () => !(S && S.profile && S.profile.prefs && S.profile.prefs.sons === false);

  /* ---------- motor ---------- */
  let AC = null, MESTRE = null, RUIDO = null;
  function ctx() {
    try {
      if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)();
        const cp = AC.createDynamicsCompressor(); cp.threshold.value = -18; cp.ratio.value = 4; cp.connect(AC.destination);
        MESTRE = AC.createGain(); MESTRE.gain.value = 0.55; MESTRE.connect(cp); }
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  // iOS só libera o áudio dentro de um toque: destrava no primeiro gesto
  const destrava = () => { const ac = ctx(); if (ac) { const b = ac.createBuffer(1, 1, 22050); const s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } };
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, destrava, { once: true, capture: true, passive: true }));

  const ruido = (ac) => { if (RUIDO) return RUIDO; const n = ac.sampleRate; RUIDO = ac.createBuffer(1, n, n); const d = RUIDO.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return RUIDO; };
  // nota com envelope exponencial; f pode ser [de, para] (glissando)
  function nota(ac, out, t, f, dur, vol, forma = 'sine', ataque = 0.006) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = forma;
    if (Array.isArray(f)) { o.frequency.setValueAtTime(f[0], t); o.frequency.exponentialRampToValueAtTime(f[1], t + dur * 0.8); } else o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.03);
  }
  // sino/cristal: parciais inarmônicos que somem rápido (o brilho) sobre a fundamental
  function sino(ac, out, t, f, vol = 0.05, dur = 1.1) {
    nota(ac, out, t, f, dur, vol); nota(ac, out, t, f * 2.76, dur * 0.45, vol * 0.35); nota(ac, out, t, f * 5.4, dur * 0.2, vol * 0.18); nota(ac, out, t, f * 2, dur * 0.7, vol * 0.25, 'triangle');
  }
  // ruído filtrado: whoosh (banda que varre), rio de luz, clique
  function sopro(ac, out, t, dur, vol, f0, f1, q = 1.2, tipo = 'bandpass') {
    const s = ac.createBufferSource(); s.buffer = ruido(ac); const bp = ac.createBiquadFilter(); bp.type = tipo; bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const NT = (m) => 440 * Math.pow(2, (m - 69) / 12); // nota MIDI em Hz
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

  // a biblioteca: cada som recebe (ac, saída, instante, opções)
  const SONS = {
    tick: (ac, o, t, x = {}) => nota(ac, o, t, x.f || 2400, 0.03, x.v || 0.018, 'triangle', 0.002),
    pop: (ac, o, t, x = {}) => { const f = x.f || 520; nota(ac, o, t, [f, f * 2.4], 0.07, x.v || 0.045); nota(ac, o, t + 0.01, f * 3, 0.03, (x.v || 0.045) * 0.3, 'triangle'); },
    moeda: (ac, o, t, x = {}) => { const b = x.f || NT(83); sino(ac, o, t, b, 0.035, 0.35); sino(ac, o, t + 0.075, b * 1.335, 0.04, 0.7); },
    brilho: (ac, o, t, x = {}) => { const b = x.b || 84; [0, 7, 12, 16, 19].forEach((s, k) => sino(ac, o, t + k * 0.045, NT(b + s), 0.016 * (x.v || 1), 0.6)); },
    whoosh: (ac, o, t, x = {}) => sopro(ac, o, t, x.d || 0.5, x.v || 0.05, x.de || 400, x.para || 2600, 0.9),
    sobe: (ac, o, t, x = {}) => { const d = x.d || 1.6; sopro(ac, o, t, d, x.v || 0.04, 300, 4200, 1.6); nota(ac, o, t, [NT(60), NT(72)], d, 0.018, 'sine', d * 0.5); },
    desce: (ac, o, t, x = {}) => { const d = x.d || 1.4; sopro(ac, o, t, d, x.v || 0.035, 2400, 260, 1.4); },
    baque: (ac, o, t, x = {}) => nota(ac, o, t, [x.f || 150, 70], 0.16, x.v || 0.05, 'sine', 0.004),
    cadeado: (ac, o, t) => { sopro(ac, o, t, 0.03, 0.09, 3800, 3000, 2, 'highpass'); nota(ac, o, t, [190, 110], 0.09, 0.06, 'triangle', 0.002);
      sopro(ac, o, t + 0.085, 0.025, 0.07, 5200, 4200, 2, 'highpass'); nota(ac, o, t + 0.085, 1250, 0.05, 0.02, 'square', 0.002); },
    acorde: (ac, o, t, x = {}) => { const b = x.b || 72; (x.menor ? [0, 3, 7, 12] : [0, 4, 7, 12]).forEach((s, k) => sino(ac, o, t + k * 0.085, NT(b + s), 0.035, 1.3)); },
    rio: (ac, o, t, x = {}) => { const d = x.d || 0.9; sopro(ac, o, t, d, 0.025, 900, 5200, 4); nota(ac, o, t, [NT(76 + (x.k || 0) * 2), NT(88 + (x.k || 0) * 2)], d, 0.01, 'sine', d * 0.6); },
    fanfarra: (ac, o, t, x = {}) => { // curta, de metal suave: G C E G ... e o acorde aberto
      [[67, 0], [72, 0.11], [76, 0.22], [79, 0.33]].forEach(([m, d]) => { nota(ac, o, t + d, NT(m), 0.22, 0.03, 'sawtooth', 0.01); sino(ac, o, t + d, NT(m + 12), 0.022, 0.5); });
      [72, 76, 79, 84].forEach((m) => { nota(ac, o, t + 0.46, NT(m), 1.4, 0.018, 'sawtooth', 0.03); nota(ac, o, t + 0.46, NT(m), 1.6, 0.03, 'triangle', 0.02); });
      SONS.brilho(ac, o, t + 0.5, { b: 88, v: x.v || 1 });
    },
    // momentos do app
    gasto: (ac, o, t) => { SONS.whoosh(ac, o, t, { d: 0.55, de: 300, para: 2200 }); SONS.moeda(ac, o, t + 1.07); SONS.desce(ac, o, t + 2.3, { d: 0.6, v: 0.025 }); },
    entrada: (ac, o, t) => { SONS.desce(ac, o, t, { d: 0.8, v: 0.03 }); SONS.baque(ac, o, t + 0.92, { f: 220, v: 0.035 }); SONS.moeda(ac, o, t + 0.98, { f: NT(84) });
      for (let k = 0; k < 7; k++) SONS.tick(ac, o, t + 1.05 + k * 0.06, { f: NT(PENTA[k] + 84), v: 0.012 }); },
    invest: (ac, o, t) => { SONS.whoosh(ac, o, t, { d: 0.5, de: 300, para: 2400 }); SONS.brilho(ac, o, t + 0.57, { b: 79 }); SONS.sobe(ac, o, t + 1.9, { d: 0.7, v: 0.035 }); SONS.acorde(ac, o, t + 2.05, { b: 79 }); },
    sonho: (ac, o, t) => { SONS.sobe(ac, o, t, { d: 1.2, v: 0.03 }); },
    'sonho-ok': (ac, o, t) => { SONS.acorde(ac, o, t, { b: 76 }); SONS.brilho(ac, o, t + 0.35, { b: 88 }); },
    widget: (ac, o, t) => { SONS.pop(ac, o, t, { f: 600, v: 0.04 }); sino(ac, o, t + 0.05, NT(88), 0.025, 0.5); },
    conquista: (ac, o, t) => SONS.fanfarra(ac, o, t),
  };
  // toca um som; out = barramento (retrospectiva) ou o mestre; em = atraso em segundos
  function toca(tipo, em = 0, x, out) {
    if (!ligado() || !SONS[tipo]) return; const ac = ctx(); if (!ac) return;
    try { SONS[tipo](ac, out || MESTRE, ac.currentTime + 0.01 + em, x); } catch (e) { /* sem áudio: segue */ }
  }
  const velhoSom = basSom; // os tipos antigos ficam iguais (toque, volta, ok, pago, apaga)
  basSom = function (tipo, em, x) { if (SONS[tipo]) return toca(tipo, em || 0, x); return velhoSom.apply(this, arguments); };

  /* ---------- háptico ---------- */
  // Android: navigator.vibrate. iPhone (iOS 18+): tocar no <label> de um <input switch> dá um tique; só funciona dentro de um gesto
  let LB = null;
  const iosTique = () => { try { if (!LB) { LB = document.createElement('label'); LB.setAttribute('aria-hidden', 'true'); LB.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; LB.appendChild(i); document.body.appendChild(LB); } LB.click(); } catch (e) { /* ignora */ } };
  // [padrão Android em ms, instantes dos tiques no iPhone em ms]
  const HP = { leve: [[8], [0]], sucesso: [[10, 60, 14], [0, 90]], conquista: [[12, 50, 12, 50, 30], [0, 80, 160, 320]], alerta: [[30, 80, 30], [0, 120, 240]], cadeado: [[6, 40, 18], [0, 60]] };
  window.basHaptico2 = function (nome = 'leve') {
    const p = HP[nome] || HP.leve;
    try { if (navigator.vibrate) { navigator.vibrate(p[0]); return; } } catch (e) { return; }
    if (navigator.userActivation && !navigator.userActivation.isActive) return; // fora de um gesto o iOS ignora: nem tenta
    p[1].forEach((ms) => (ms ? setTimeout(iosTique, ms) : iosTique()));
  };
  const hap = (n) => window.basHaptico2(n);

  /* ---------- momentos do app ---------- */
  // telas de sucesso: gasto, investimento, entrada (o som segue o voo do Cifrão)
  let FESTOU = false;
  if (typeof basFesta === 'function') { const v = basFesta; basFesta = function (tipo) { FESTOU = true;
    if (rm()) toca(tipo === 'inv' ? 'sonho-ok' : 'moeda'); else toca(tipo === 'inv' ? 'invest' : tipo === 'ent' ? 'entrada' : 'gasto');
    hap(tipo === 'gasto' ? 'leve' : 'sucesso'); return v.apply(this, arguments); }; }
  // quantos sonhos estão concluídos (para festejar quando um chega lá)
  const concluidos = () => { try { return objAnalise().itens.filter((g) => g.status === 'concluido').length; } catch (e) { return 0; } };
  // salvar formulário: o que não tem tela de sucesso (objetivo, provento) ganha som aqui; sonho concluído ganha fanfarra
  if (typeof basSalvar === 'function') { const v = basSalvar; basSalvar = function (f) {
    const t = basTopoPilha(); const c0 = concluidos(); FESTOU = false; const r = v.apply(this, arguments);
    try { if (t && basTopoPilha() !== t) { // fechou = salvou
      if (!FESTOU && t.t === 'objetivo') { toca('sonho-ok'); hap('sucesso'); } else if (!FESTOU && t.t === 'provento') { toca('moeda'); hap('sucesso'); }
      const fest = FESTOU; setTimeout(() => { if (concluidos() > c0) { toca('conquista'); hap('conquista'); } }, fest ? 3200 : 450); } } catch (e) { /* ignora */ }
    return r; }; }
  // sonho novo (a animação de criação vira "Sonho criado" em ~1,9 s) e sonho editado
  if (typeof basSn2Criar === 'function') { const v = basSn2Criar; basSn2Criar = function () {
    const st = S.basSn2; const ed = st && st.ed; const n0 = objLista().length; const p0 = basPilha().length; const r = v.apply(this, arguments);
    try { if (ed && basPilha().length < p0) { toca('sonho-ok'); hap('sucesso'); }
      else if (!ed && objLista().length > n0) { toca('sonho'); hap('leve'); const q = rm() ? 0.3 : 1.9; toca('sonho-ok', q); toca('brilho', q + 0.5, { b: 91 }); setTimeout(() => hap('conquista'), q * 1000); } } catch (e) { /* ignora */ }
    return r; }; }
  // widget colocado na tela (Organizar esta tela)
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.bas-ed-mais')) { toca('widget'); hap('leve'); } }, true);
  // conquista: ao abrir a medalha
  if (typeof basMedalhaLigar === 'function') { const v = basMedalhaLigar; basMedalhaLigar = function () {
    const w = document.querySelector('.bas-m3'); if (w && !w.dataset.lig) { toca('conquista', 0.15); hap('conquista'); } return v.apply(this, arguments); }; }

  /* ---------- retrospectiva: uma trilha por tela, num barramento próprio (trocar ou fechar a tela corta tudo) ---------- */
  let RT = null; // { w, i, g, iv }
  const corta = () => { if (!RT) return; const r = RT; RT = null; clearInterval(r.iv); try { const t = AC.currentTime; r.g.gain.cancelScheduledValues(t); r.g.gain.setTargetAtTime(0.0001, t, 0.03); setTimeout(() => r.g.disconnect(), 400); } catch (e) { /* ignora */ } };
  const vivo = (w) => RT && RT.w === w && +w.dataset.i === RT.i;
  // um barramento por (retrospectiva, tela); criado no primeiro som da tela
  function bus(w) { if (vivo(w)) return RT; corta(); const ac = ctx(); if (!ac || !ligado() || !w.isConnected) return null; const g = ac.createGain(); g.connect(MESTRE);
    const i = +w.dataset.i; RT = { w, i, g, n: 0, iv: setInterval(() => { if (!w.isConnected || +w.dataset.i !== i) corta(); }, 200) }; return RT; }
  const rt = (w, tipo, em, x) => { const b = bus(w); if (b) toca(tipo, em, x, b.g); };
  const rtM = (w, tipo, em, x) => { if (!rm()) rt(w, tipo, em, x); }; // ganchos da cena: no movimento reduzido tudo dispara junto, então ficam mudos
  if (typeof basRtAto === 'function') { const v = basRtAto; basRtAto = function (w, s) { try { if (bus(w)) trilha(w, s); } catch (e) { /* ignora */ } return v.apply(this, arguments); }; }
  // número contando (ease-out de 4ª potência em 1,5 s): ticks cada vez mais espaçados e um sino no fim
  if (typeof basRtConta === 'function') { const v = basRtConta; basRtConta = function (b, atraso = 0) {
    const w = b.closest && b.closest('.bas-wr');
    if (w && !rm()) { const N = 16; for (let j = 1; j <= N; j++) rt(w, 'tick', atraso / 1000 + (1 - Math.pow(1 - j / N, 0.25)) * 1.5, { f: 1900 + j * 40 }); rt(w, 'moeda', atraso / 1000 + 1.5, { f: NT(88) }); }
    return v.apply(this, arguments); }; }
  // as viradas do Cifrão na cena viram som no mesmo instante
  if (typeof basRtForma === 'function') { const v = basRtForma; basRtForma = function (w, nome) {
    if (nome === 'moeda') rtM(w, 'moeda'); else if (nome === 'seta') { rtM(w, 'whoosh', 0, { d: 0.4, de: 500, para: 3500 }); rtM(w, 'brilho', 0.05, { b: 81 }); hap('leve'); }
    else if (nome === 'cadeado') { rtM(w, 'cadeado'); rtM(w, 'brilho', 0.15, { b: 86, v: 0.8 }); hap('cadeado'); } else if (nome === 'mais') { rtM(w, 'acorde', 0, { b: 77 }); hap('sucesso'); }
    return v.apply(this, arguments); }; }
  if (typeof basRtFaisca === 'function') { const v = basRtFaisca; basRtFaisca = function (w) {
    if (!rm() && vivo(w)) { const k = RT.n++; rtM(w, 'pop', 0, { f: 500 + k * 70, v: 0.03 }); rtM(w, 'tick', 0.02, { f: NT(84 + PENTA[k % PENTA.length]), v: 0.016 }); hap('leve'); }
    return v.apply(this, arguments); }; }
  if (typeof basRtPouso === 'function') { const v = basRtPouso; basRtPouso = function (w, atraso = 0) { rtM(w, 'baque', atraso / 1000 + 0.05, { v: 0.025 }); return v.apply(this, arguments); }; }

  // o que não passa pelas funções acima, sincronizado com o CSS de basico.css (.bas-rt-s.vai ...)
  function trilha(w, s) {
    const k = s.dataset.k, ruim = w.classList.contains('ruim'), q = (sel) => s.querySelectorAll(sel), r = (tipo, ms, x) => rt(w, tipo, ms / 1000, x);
    if (+w.dataset.i > 0) r('whoosh', 0, { d: 0.7, v: 0.03, de: 250, para: 1800 }); // a tela nova abre em círculo (780 ms)
    if (rm()) { r(k === 'fim' && !ruim ? 'acorde' : 'brilho', 150); return; } // movimento reduzido: um som só por tela
    if (k === 'abre') { r('brilho', 260, { b: 79 }); r('acorde', 1800, { b: 72 }); r('brilho', 3700, { b: 86 }); }
    else if (k === 'entrou') q('.rt-fontes > span').forEach((_, j) => r('rio', 1100 + j * 650, { k: j })); // rios de luz (rt-traca 900 ms cada)
    else if (k === 'bolhas') { // cada bolha nasce com um pop (--d), o contador de pagamentos tica, a carona sobe
      const B = JSON.parse((s.querySelector('.rt-bolhas') || {}).dataset?.b || '[]');
      B.forEach((_, j) => r('pop', 250 + ((j * 0.31) % 3.2) * 1000, { f: 380 + (j % 7) * 60, v: 0.022 }));
      const cn = s.querySelector('.rt-conta'); const n = cn ? Math.min(30, +cn.dataset.n || 0) : 0; for (let j = 1; j <= n; j++) r('tick', 1000 + (j / n) * 1800, { f: 2000 + j * 25 });
      r('pop', 3950, { f: 300, v: 0.05 }); r('sobe', 4500, { d: 2.2, v: 0.03 }); r(ruim ? 'acorde' : 'brilho', 6000, ruim ? { b: 69, menor: true } : { b: 84 });
    } else if (k === 'dias') { q('.rt-cal i:not(.v)').forEach((c) => { const d = +c.dataset.d || 0; if (d % 2) r('tick', 380 + d * 22, { f: NT(84 + PENTA[d % 6]), v: 0.01 }); }); }
    else if (k === 'pod') q('.rt-pc').forEach((c) => { const o = +c.style.getPropertyValue('--o') || 0; r('sobe', 350 + o * 160, { d: 0.7, v: 0.018 }); r('tick', 900 + o * 160, { f: NT([76, 79, 84][o] || 76), v: 0.025 }); });
    else if (k === 'guarda') { const neg = !!s.querySelector('.rt-anel.neg'); r(neg ? 'desce' : 'sobe', 2700, { d: 1.3, v: 0.025 }); r(neg ? 'acorde' : 'brilho', 3900, neg ? { b: 64, menor: true } : { b: 86 }); }
    else if (k === 'invest') q('.rt-esc i').forEach((b, j) => { const neg = b.classList.contains('neg'), nada = b.classList.contains('nada'); // uma nota por barra subindo
      r('tick', 300 + j * 90 + 350, { f: NT(neg ? 64 - j : 72 + PENTA[j]), v: nada ? 0.008 : 0.03 }); });
    else if (k === 'patri') { const dn = !!s.querySelector('.rt-gw.dn'); r(dn ? 'desce' : 'sobe', 1000, { d: 1.7, v: 0.04 }); r('pop', 2700, { f: dn ? 300 : 700, v: 0.05 }); r('brilho', 2800, { b: dn ? 72 : 88, v: 0.8 }); }
    else if (k === 'sonho') { r('brilho', 200, { b: 84 }); r('sobe', 700, { d: 1.5, v: 0.025 }); r('acorde', 2200, { b: 76 }); r('brilho', 4700, { b: 91 }); }
    else if (k === 'fim') { q('.bas-rt-res span').forEach((_, j) => r('pop', 80 * j + 200, { f: 600 + j * 90, v: 0.035 }));
      if (ruim) r('acorde', 900, { b: 67 }); else { r('fanfarra', 900); setTimeout(() => { if (vivo(w)) hap('conquista'); }, 900); r('brilho', 2800, { b: 91 }); r('brilho', 5000, { b: 86 }); } }
  }
})();
