/* Segunda metade: o Globo do patrimônio desenhado ao vivo, o simulador de objetivos no painel azul,
   a conversa final que leva à criação da conta e as entradas em cascata. */
(() => {
  'use strict';
  const CFG = window.FP_CONFIG || {}, motion = window.AvenScroll;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n) => Math.max(0, Math.min(1, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;
  const viajante = () => document.querySelector('.story-traveler');

  const nome = document.querySelector('[data-nathan-nome]'); if (nome && CFG.consultor) nome.textContent = CFG.consultor;
  const foto = document.querySelector('[data-nathan-foto]'); if (foto) { if (CFG.foto) foto.src = `../${CFG.foto}`; foto.alt = `Foto de ${CFG.consultor || 'seu assessor'}`; }

  // Entradas em cascata.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-rev]').forEach((el) => io.observe(el));

  // Sequência de aportes: 14 meses seguidos acesos em três tons, o resto apagado.
  const meses = document.querySelector('[data-meses]');
  if (meses) meses.innerHTML = Array.from({ length: 21 }, (_, i) => `<li data-n="${i < 4 ? 0 : 1 + (i * 7) % 3}" style="--d:${i * 28}ms"></li>`).join('');

  /* Simulador de objetivos: aporte todo mês, juros compostos na taxa escolhida, até bater a meta. */
  const sim = document.querySelector('.sim');
  if (sim) {
    const $ = (s) => sim.querySelector(s), brl = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
    const slider = $('#sim-aporte'), out = $('[data-sim-out]'), data = $('[data-sim-data]'), prazo = $('[data-sim-prazo]');
    const area = $('[data-sim-area]'), linha = $('[data-sim-linha]'), inv = $('[data-sim-inv]'), vInv = $('[data-sim-v-inv]'), vJur = $('[data-sim-v-jur]');
    let antes = 0;
    const marcado = (attr) => +sim.querySelector(`[${attr}][aria-pressed="true"]`).getAttribute(attr);
    function calcular() {
      const meta = marcado('data-sim-meta'), aporte = +slider.value, r = Math.pow(1 + marcado('data-sim-taxa') / 100, 1 / 12) - 1;
      const serie = [0]; let saldo = 0, n = 0;
      while (saldo < meta && n < 720) { saldo = saldo * (1 + r) + aporte; serie.push(Math.min(saldo, meta)); n++; }
      const quando = new Date(); quando.setMonth(quando.getMonth() + n);
      const anos = Math.floor(n / 12), m = n % 12, partes = [anos && `${anos} ${anos > 1 ? 'anos' : 'ano'}`, m && `${m} ${m > 1 ? 'meses' : 'mês'}`].filter(Boolean);
      out.textContent = brl(aporte);
      data.textContent = saldo < meta ? 'mais de 60 anos' : quando.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      prazo.textContent = saldo < meta ? 'Aumente o aporte para ver a data.' : partes.join(' e ');
      const investido = Math.min(aporte * n, meta);
      vInv.textContent = brl(investido); vJur.textContent = brl(Math.max(0, meta - investido));
      const X = (i) => (i / n) * 400, Y = (v) => 146 - (v / meta) * 138;
      const d = serie.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
      linha.setAttribute('d', d); area.setAttribute('d', `${d} L400 150 L0 150 Z`);
      inv.setAttribute('d', `M0 146 L400 ${Y(investido).toFixed(1)}`);
      slider.style.setProperty('--p', `${(aporte - 200) / 98}%`);
      // O Cifrão reage: chegou mais cedo, comemora; ficou mais longe, desanima.
      if (antes && n !== antes) window.Cifrao?.expressao(viajante(), n < antes ? 'animado' : 'sonolento');
      antes = n;
    }
    slider.addEventListener('input', calcular);
    sim.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sim-meta], [data-sim-taxa]'); if (!b) return;
      b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      calcular();
    });
    sim.querySelectorAll('button:not([aria-pressed])').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    calcular();
    // O painel azul cresce ao entrar na tela.
    const painel = $('[data-sim-painel]');
    const entra = () => { const r = sim.getBoundingClientRect(), p = ease(range(innerHeight - r.top - (window.scrollY - motion.read()), 0, innerHeight * .75)); painel.style.transform = `scale(${mix(.86, 1, p)}) translateY(${mix(60, 0, p)}px)`; painel.style.borderRadius = `${mix(80, 44, p)}px`; };
    if (motion && !reduced.matches) { motion.subscribe(entra); entra(); }
  }

  /* Final: uma pergunta, quatro respostas. A escolha vira a primeira mensagem do plano e acende o botão. */
  const chips = document.querySelector('[data-fim-chips]');
  if (chips) {
    const RESP = { reserva: 'Boa escolha. Reserva primeiro, o resto vem depois. Eu calculo quanto você precisa.', imovel: 'Vamos colocar data e valor nesse imóvel. Eu mostro o aporte de cada mês.', investir: 'Então vamos dar um alvo para cada classe. Eu aviso onde aportar.', renda: 'O caminho é longo e dá para medir. Eu mostro em que ano você chega.' };
    const user = document.querySelector('[data-fim-user]'), resp = document.querySelector('[data-fim-resp]'), cta = document.querySelector('[data-fim-cta]'), ctaT = document.querySelector('[data-fim-cta-t]');
    let digitando = 0;
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-obj]'); if (!b) return;
      chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      chips.classList.add('escolhido');
      user.textContent = b.textContent; user.hidden = false;
      const txt = RESP[b.dataset.obj]; clearInterval(digitando); resp.hidden = false; resp.textContent = '';
      window.Cifrao?.expressao(viajante(), 'comemorando');
      if (reduced.matches) resp.textContent = txt;
      else { let i = 0; digitando = setInterval(() => { resp.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(digitando); }, 18); }
      ctaT.textContent = 'Criar conta e montar meu plano'; cta.classList.add('pronto');
    });
  }

  /* Globo do patrimônio, minimalista: esfera de pontos que gira, brilho interno, aro de luz, classes em órbita
     com as suas trilhas, aportes em losango e a poeira dourada dos proventos. Gira sozinho, acelera com a
     rolagem e segue o arraste do dedo ou do mouse. */
  const cv = document.querySelector('[data-globo]');
  if (!cv) return;
  const ctx = cv.getContext('2d'), N = 2600, G = Math.PI * (3 - Math.sqrt(5)), pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * G, lat = Math.asin(y), lon = a % (Math.PI * 2);
    // "Continentes" inventados: só os pontos onde a soma das ondas passa do limite.
    if (Math.sin(3 * lon + 1.3) * Math.cos(2.2 * lat) + Math.sin(1.7 * lon - lat * 2.4) * .6 > .3) pts.push([Math.cos(a) * r, y, Math.sin(a) * r, (i * 13) % 19 === 0]);
  }
  const ORBS = [{ c: '#0A84FF', r: 1.06, a: .4, v: .42, inc: .5, t: 9 }, { c: '#5AC8FA', r: 1.06, a: 2.4, v: -.3, inc: -.7, t: 7 }, { c: '#F7F4ED', r: 1.06, a: 4.3, v: .24, inc: 1.1, t: 5.5 }, { c: '#30D158', r: 1.06, a: 5.4, v: -.2, inc: 2.2, t: 4.5 }];
  const POEIRA = Array.from({ length: 46 }, (_, i) => ({ a: i * 2.4, d: 1.14 + ((i * 37) % 29) / 70, f: (i * 11) % 7 }));
  const OURO = Array.from({ length: 30 }, (_, i) => ({ a: i * .21 + ((i * 7) % 5) * .05, d: 1.2 + ((i * 13) % 9) / 60, f: i % 5 }));
  let rot = 0, giro = 0, arrasto = null, visivel = false, antes = 0, W = 0, H = 0, quadro = 0;
  function medir() { const r = cv.getBoundingClientRect(), d = Math.min(2.5, devicePixelRatio || 1); W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d); }
  function desenhar(t) {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .39, px = Math.max(1, R / 56);
    ctx.clearRect(0, 0, W, H);
    for (const p of POEIRA) { const a = p.a + rot * .1, d = R * p.d; ctx.globalAlpha = .18 + .3 * Math.abs(Math.sin(t / 900 + p.f)); ctx.fillStyle = '#F7F4ED'; ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .95, px * .6, px * .6); }
    // Poeira dourada dos proventos: um anel inclinado que passa por trás e pela frente.
    ctx.fillStyle = '#FFB340';
    for (const p of OURO) { const a = p.a * 6.28 / 6.3 + t / 9000, x = Math.cos(a) * R * p.d, y = Math.sin(a) * R * p.d * .3; ctx.globalAlpha = (Math.sin(a) > 0 ? .9 : .28) * (.5 + .5 * Math.abs(Math.sin(t / 700 + p.f))); ctx.beginPath(); ctx.arc(cx + x * .96 - y * .28, cy + y + x * .28, px * .75, 0, 7); ctx.fill(); }
    // Brilho interno: a esfera tem volume, não é um disco.
    let g = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .05, cx, cy, R * 1.06);
    g.addColorStop(0, 'rgba(10,132,255,.34)'); g.addColorStop(.6, 'rgba(10,132,255,.08)'); g.addColorStop(1, 'rgba(5,8,15,.5)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, 7); ctx.fill();
    const pos = (o, a) => { const x0 = Math.cos(a) * o.r, z0 = Math.sin(a) * o.r; return [cx + x0 * R, cy + Math.sin(o.inc) * z0 * R, Math.cos(o.inc) * z0]; };
    // Trilhas das órbitas, finas e tracejadas.
    ctx.lineWidth = px * .35; ctx.setLineDash([px * 2, px * 3]);
    for (const o of ORBS) { ctx.strokeStyle = o.c; ctx.globalAlpha = .2; ctx.beginPath(); for (let k = 0; k <= 48; k++) { const [x, y] = pos(o, k / 48 * 6.2832); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.setLineDash([]);
    const orb = (o, atras) => {
      const [x, y, z] = pos(o, o.a + t / 1000 * o.v);
      if ((z < 0) !== atras) return;
      const s = R * o.t / 100 * (1 + z * .25);
      g = ctx.createRadialGradient(x - s * .35, y - s * .35, s * .1, x, y, s); g.addColorStop(0, '#fff'); g.addColorStop(.35, o.c); g.addColorStop(1, o.c);
      ctx.globalAlpha = atras ? .3 : 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
      ctx.strokeStyle = o.c; ctx.lineWidth = px * .45;
      for (const k of [1.7, 2.5]) { ctx.globalAlpha = (atras ? .1 : .32) / k; ctx.beginPath(); ctx.arc(x, y, s * k, 0, 7); ctx.stroke(); }
    };
    ORBS.forEach((o) => orb(o, true));
    const cr = Math.cos(rot), sr = Math.sin(rot), ci = Math.cos(.38), si = Math.sin(.38);
    for (const [x0, y0, z0, luz] of pts) {
      const x1 = x0 * cr + z0 * sr, z1 = z0 * cr - x0 * sr, y1 = y0 * ci - z1 * si, z2 = z1 * ci + y0 * si;
      if (z2 < -.05) continue;
      const s = px * (.5 + .55 * z2) * (luz ? 1.7 : 1);
      ctx.globalAlpha = luz ? .5 + .5 * Math.abs(Math.sin(t / 600 + x0 * 9)) : .26 + .7 * z2; ctx.fillStyle = luz ? '#8FD0FF' : '#F7F4ED';
      ctx.fillRect(cx + x1 * R - s / 2, cy + y1 * R - s / 2, s, s);
    }
    // Aro de luz, com um halo mais largo por fora.
    ctx.globalAlpha = .16; ctx.strokeStyle = '#5AC8FA'; ctx.lineWidth = px * .5; ctx.beginPath(); ctx.arc(cx, cy, R * 1.17, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = px * 1.2; ctx.shadowColor = '#0A84FF'; ctx.shadowBlur = px * 16; ctx.strokeStyle = '#8FD0FF';
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    // Aportes: losangos verdes numa diagonal tracejada que atravessa o globo.
    ctx.strokeStyle = '#30D158'; ctx.globalAlpha = .3; ctx.lineWidth = px * .35; ctx.setLineDash([px * 1.5, px * 2.5]);
    ctx.beginPath(); ctx.moveTo(cx - R * 1.1, cy - R * 1.25); ctx.lineTo(cx + R * 1.1, cy + R * 1.25); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#30D158';
    for (let k = 0; k < 4; k++) { const u = ((k / 4 + t / 26000) % 1) * 2 - 1, x = cx + u * R * 1.1, y = cy + u * R * 1.25, s = px * (2.4 + (k % 2)); ctx.globalAlpha = .95 * Math.sin((u + 1) / 2 * Math.PI); ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 1.3); ctx.lineTo(x - s, y); ctx.fill(); }
    ORBS.forEach((o) => orb(o, false));
    ctx.globalAlpha = 1;
  }
  function laco(t) {
    quadro = 0;
    if (!visivel) return;
    const dt = Math.min(50, t - (antes || t)); antes = t;
    giro *= .94;
    rot += dt * .00026 + giro + (motion ? motion.velocity() * .004 : 0);
    desenhar(t);
    if (!reduced.matches) quadro = requestAnimationFrame(laco);
  }
  const liga = () => { if (!quadro && visivel) { antes = 0; quadro = requestAnimationFrame(laco); } };
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) { medir(); liga(); } }, { rootMargin: '60px' }).observe(cv);
  addEventListener('resize', () => { if (visivel) { medir(); desenhar(performance.now()); } });
  cv.addEventListener('pointerdown', (e) => { arrasto = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (arrasto === null) return; giro = (e.clientX - arrasto) * .006; arrasto = e.clientX; liga(); });
  for (const tipo of ['pointerup', 'pointercancel']) cv.addEventListener(tipo, () => { arrasto = null; });
})();
