/* Segunda metade: o Globo do patrimônio (canvas, responde ao toque), a importação de extratos no painel azul,
   a conversa final que leva à criação da conta e as entradas em cascata. */
(() => {
  'use strict';
  const CFG = window.FP_CONFIG || {}, motion = window.AvenScroll;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n) => Math.max(0, Math.min(1, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;

  const nome = document.querySelector('[data-nathan-nome]'); if (nome && CFG.consultor) nome.textContent = CFG.consultor;
  const foto = document.querySelector('[data-nathan-foto]'); if (foto) foto.alt = `Foto de ${CFG.consultor || 'seu assessor'}`;
  if (CFG.foto) document.querySelectorAll('[data-nathan-foto], [data-nathan-cab], [data-nathan-mini]').forEach((i) => { i.src = `../${CFG.foto}`; });
  const comp = document.querySelector('[data-nathan-comp]');
  if (comp) {
    const [W, H] = CFG.fotoTam || [843, 1131], rec = CFG.fotoRecorte, ok = CFG.fotoCorte > 0 && Array.isArray(rec) && rec.length > 2;
    const topo = ok ? CFG.fotoCorte / H : 0, resto = 1 - topo;
    comp.style.aspectRatio = `${W} / ${H}`; comp.style.setProperty('--topo', `${(topo * 100).toFixed(3)}%`);
    if (foto) { foto.style.height = `${(100 / resto).toFixed(3)}%`; foto.style.top = `${(-topo / resto * 100).toFixed(3)}%`; }
    const cab = comp.querySelector('[data-nathan-cab]');
    if (ok && cab) cab.style.clipPath = `polygon(${rec.map(([x, y]) => `${(x / W * 100).toFixed(2)}% ${(y / H * 100).toFixed(2)}%`).join(', ')})`;
    else comp.querySelector('.ass-cabeca')?.remove();
  }

  // Tudo que fala do mês segue o mês de hoje.
  const hoje = new Date(), mesDe = (off, op) => new Date(hoje.getFullYear(), hoje.getMonth() + off, 1).toLocaleDateString('pt-BR', op).replace('.', '');
  document.querySelectorAll('[data-mes]').forEach((el) => { el.textContent = mesDe(0, { month: 'long' }); });
  document.querySelectorAll('[data-mes-ab]').forEach((el) => { el.textContent = mesDe(0, { month: 'short' }).toUpperCase(); });
  document.querySelectorAll('[data-mes-col]').forEach((el) => { el.textContent = mesDe(+el.dataset.mesCol, { month: 'short' }); });
  document.querySelectorAll('[data-mes-off]').forEach((el) => { el.textContent = mesDe(+el.dataset.mesOff, { month: 'short', year: 'numeric' }).replace(' de ', ' '); });
  document.querySelectorAll('[data-hoje]').forEach((el) => { el.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); });
  document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = hoje.getFullYear(); });
  document.querySelectorAll('[data-dias]').forEach((el) => { el.textContent = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate(); });

  // Entradas em cascata.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-rev]').forEach((el) => io.observe(el));

  // Sequência de aportes: 14 meses seguidos acesos em três tons, o resto apagado.
  const meses = document.querySelector('[data-meses]');
  if (meses) meses.innerHTML = Array.from({ length: 21 }, (_, i) => `<li data-n="${i < 4 ? 0 : 1 + (i * 7) % 3}" style="--d:${i * 28}ms"></li>`).join('');

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
      if (reduced.matches) resp.textContent = txt;
      else {
        window.Cifrao?.expressao(document.querySelector('.story-traveler'), 'comemorando');
        let i = 0; digitando = setInterval(() => { resp.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(digitando); }, 18);
      }
      ctaT.textContent = 'Criar conta e montar meu plano'; cta.classList.add('pronto');
    });
  }

  /* Globo do patrimônio. Uma esfera de pontos que gira; as classes da carteira são esferas em órbita,
     os aportes são losangos verdes e os proventos, a poeira dourada. Arrastar gira; tocar numa esfera
     ou numa ficha destaca aquela parte e troca o número do centro. */
  const cv = document.querySelector('[data-globo]');
  if (!cv) return;
  const INFO = {
    tudo: ['Seu patrimônio', 'R$ 98.715', '+ R$ 34.215 em 2026', 'Cada esfera é uma classe da sua carteira.'],
    rf: ['Renda fixa', 'R$ 47.383', '48% da carteira', 'Alvo de 50%. É onde o próximo aporte entra.'],
    acoes: ['Ações', 'R$ 26.653', '27% da carteira', 'Alvo de 30%. Faltam R$ 2.961 para chegar.'],
    fii: ['Fundos imobiliários', 'R$ 24.679', '25% da carteira', 'Alvo de 20%. Está acima, sem aporte por agora.'],
    aportes: ['Aportes em 2026', 'R$ 22.800', '12 meses seguidos', 'Cada losango verde é um aporte que você fez.'],
    prov: ['Proventos em 2026', 'R$ 5.870', `R$ 640 em ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`, 'Os pontos dourados são os dividendos recebidos.'],
  };
  const $g = (k) => document.querySelector(`[data-g-${k}]`), gchips = document.querySelector('[data-g-chips]');
  let sel = 'tudo';
  function escolher(k) {
    sel = INFO[k] ? k : 'tudo';
    const [rot, val, sub, info] = INFO[sel];
    $g('rot').textContent = rot; $g('val').textContent = val; $g('sub').textContent = sub; $g('info').textContent = info;
    gchips?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === sel)));
    liga();
  }
  gchips?.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) escolher(b.dataset.g === sel ? 'tudo' : b.dataset.g); });

  const ctx = cv.getContext('2d'), N = 2600, G = Math.PI * (3 - Math.sqrt(5)), pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * G, lat = Math.asin(y), lon = a % (Math.PI * 2);
    // "Continentes" inventados: só os pontos onde a soma das ondas passa do limite.
    if (Math.sin(3 * lon + 1.3) * Math.cos(2.2 * lat) + Math.sin(1.7 * lon - lat * 2.4) * .6 > .3) pts.push([Math.cos(a) * r, y, Math.sin(a) * r, (i * 13) % 19 === 0]);
  }
  const ORBS = [{ k: 'rf', c: '#0A84FF', a: .4, v: .4, inc: .45, t: 12 }, { k: 'acoes', c: '#5AC8FA', a: 2.5, v: -.3, inc: -.75, t: 9 }, { k: 'fii', c: '#F7F4ED', a: 4.4, v: .24, inc: 1.15, t: 8.5 }];
  const POEIRA = Array.from({ length: 40 }, (_, i) => ({ a: i * 2.4, d: 1.2 + ((i * 37) % 29) / 90, f: (i * 11) % 7 }));
  const OURO = Array.from({ length: 34 }, (_, i) => ({ a: i * .185 + ((i * 7) % 5) * .04, d: 1.14 + ((i * 13) % 9) / 80, f: i % 5 }));
  let rot = 0, incl = .38, giro = 0, toque = null, visivel = false, antes = 0, W = 0, H = 0, quadro = 0, dpr = 1, telas = [];
  function medir() { const r = cv.getBoundingClientRect(); dpr = Math.min(2.5, devicePixelRatio || 1); W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr); }
  const forca = (k) => sel === 'tudo' || sel === k ? 1 : .16;
  function desenhar(t) {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .37, px = Math.max(1, R / 56);
    ctx.clearRect(0, 0, W, H);
    for (const p of POEIRA) { const a = p.a + rot * .1, d = R * p.d; ctx.globalAlpha = .16 + .28 * Math.abs(Math.sin(t / 900 + p.f)); ctx.fillStyle = '#F7F4ED'; ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, px * .5, px * .5); }
    // Proventos: um anel inclinado de pontos dourados, atrás e na frente do globo.
    const ouro = (frente) => { ctx.fillStyle = '#FFB340'; for (const p of OURO) { const a = p.a + t / 9000; if ((Math.sin(a) > 0) !== frente) continue; const x = Math.cos(a) * R * p.d, y = Math.sin(a) * R * p.d * .3; ctx.globalAlpha = forca('prov') * (frente ? .95 : .3) * (.5 + .5 * Math.abs(Math.sin(t / 700 + p.f))); ctx.beginPath(); ctx.arc(cx + x * .96 - y * .28, cy + y + x * .28, px * (sel === 'prov' ? 1.25 : .85), 0, 7); ctx.fill(); } };
    ouro(false);
    // Volume: brilho interno, para a esfera não parecer um disco.
    let g = ctx.createRadialGradient(cx - R * .32, cy - R * .38, R * .05, cx, cy, R);
    g.addColorStop(0, 'rgba(90,200,250,.42)'); g.addColorStop(.55, 'rgba(10,132,255,.14)'); g.addColorStop(1, 'rgba(5,8,15,.55)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const pos = (o, a) => { const x0 = Math.cos(a) * 1.22, z0 = Math.sin(a) * 1.22; return [cx + x0 * R, cy + Math.sin(o.inc) * z0 * R, Math.cos(o.inc) * z0]; };
    ctx.lineWidth = px * .4;
    for (const o of ORBS) { ctx.strokeStyle = o.c; ctx.globalAlpha = .22 * forca(o.k) + (sel === o.k ? .4 : 0); ctx.beginPath(); for (let k = 0; k <= 60; k++) { const [x, y] = pos(o, k / 60 * 6.2832); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    telas = [];
    const orb = (o, atras) => {
      const [x, y, z] = pos(o, o.a + t / 1000 * o.v);
      if ((z < 0) !== atras) return;
      const s = R * o.t / 100 * (1 + z * .2) * (sel === o.k ? 1.25 : 1), f = forca(o.k);
      telas.push([x / dpr, y / dpr, Math.max(24, s / dpr * 2.2), o.k]);
      ctx.shadowColor = o.c; ctx.shadowBlur = sel === o.k ? px * 16 : px * 6;
      g = ctx.createRadialGradient(x - s * .35, y - s * .4, s * .08, x, y, s); g.addColorStop(0, '#fff'); g.addColorStop(.4, o.c); g.addColorStop(1, o.c);
      ctx.globalAlpha = f * (atras ? .45 : 1); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = o.c; ctx.lineWidth = px * .45; ctx.globalAlpha = f * (atras ? .12 : .32);
      const pulso = 1.6 + .5 * Math.abs(Math.sin(t / 800 + o.a)); ctx.beginPath(); ctx.arc(x, y, s * pulso, 0, 7); ctx.stroke();
    };
    ORBS.forEach((o) => orb(o, true));
    const cr = Math.cos(rot), sr = Math.sin(rot), ci = Math.cos(incl), si = Math.sin(incl), fg = sel === 'tudo' ? 1 : .45;
    for (const [x0, y0, z0, luz] of pts) {
      const x1 = x0 * cr + z0 * sr, z1 = z0 * cr - x0 * sr, y1 = y0 * ci - z1 * si, z2 = z1 * ci + y0 * si;
      if (z2 < -.05) continue;
      const s = px * (.5 + .6 * z2) * (luz ? 1.7 : 1);
      ctx.globalAlpha = fg * (luz ? .5 + .5 * Math.abs(Math.sin(t / 600 + x0 * 9)) : .22 + .7 * z2); ctx.fillStyle = luz ? '#8FD0FF' : '#F7F4ED';
      ctx.beginPath(); ctx.arc(cx + x1 * R * .97, cy + y1 * R * .97, s / 2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = px * 1.1; ctx.shadowColor = '#0A84FF'; ctx.shadowBlur = px * 18; ctx.strokeStyle = '#8FD0FF';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    // Aportes: losangos verdes subindo numa diagonal.
    const fa = forca('aportes'); ctx.fillStyle = '#30D158';
    for (let k = 0; k < 5; k++) { const u = 1 - ((k / 5 + t / 22000) % 1) * 2, x = cx + u * R * .95, y = cy + u * R * 1.2, s = px * (2.2 + (k % 2)) * (sel === 'aportes' ? 1.4 : 1); ctx.globalAlpha = fa * Math.sin((u + 1) / 2 * Math.PI); ctx.beginPath(); ctx.moveTo(x, y - s * 1.35); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 1.35); ctx.lineTo(x - s, y); ctx.fill(); }
    ouro(true);
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
  function liga() { if (!quadro && visivel) { antes = 0; quadro = requestAnimationFrame(laco); } }
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) { medir(); liga(); } }, { rootMargin: '60px' }).observe(cv);
  addEventListener('resize', () => { if (visivel) { medir(); desenhar(performance.now()); } });
  cv.addEventListener('pointerdown', (e) => { toque = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!toque) return; giro = (e.clientX - toque.x) * .006; incl = Math.max(-.7, Math.min(.9, incl + (e.clientY - toque.y) * .006)); toque.x = e.clientX; toque.y = e.clientY; liga(); });
  cv.addEventListener('pointerup', (e) => {
    if (!toque) return;
    const parado = Math.hypot(e.clientX - toque.x0, e.clientY - toque.y0) < 7; toque = null;
    if (!parado) return;
    // Toque parado: escolhe a esfera mais próxima; fora delas, volta para o todo.
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const alvo = telas.find(([ox, oy, raio]) => Math.hypot(x - ox, y - oy) < raio);
    escolher(alvo ? (alvo[3] === sel ? 'tudo' : alvo[3]) : 'tudo');
  });
  cv.addEventListener('pointercancel', () => { toque = null; });
})();
