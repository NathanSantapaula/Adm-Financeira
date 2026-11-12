/* A trilha do Cifrão: depois de "Seu mês", o mesmo mascote corre pela página, de âncora em âncora.
   Cada [data-ancora] é um pouso. Entre dois pousos ele corre aos saltos; pousado, volta a ter vida própria
   (pisca, segue o ponteiro, reage ao toque). Tudo é função da posição da rolagem, nos dois sentidos. */
(() => {
  'use strict';
  const traveler = document.querySelector('.story-traveler'), motion = window.AvenScroll;
  const mes = document.querySelector('.mes-story'), dock = mes?.querySelector('.mes-dock');
  const els = [...document.querySelectorAll('[data-ancora]')];
  if (!traveler || !motion || !dock || !els.length) return;
  const clamp = (n) => Math.min(1, Math.max(0, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;
  const CLARO = '#F7F4ED', NAVY = '#06122A';
  let pts = [], on = false, ativo = false, pouso = -1, estatico = false;

  function measure() {
    on = mes.classList.contains('is-animated') && getComputedStyle(traveler).position === 'fixed';
    if (!on) {
      // Sem a história rolável (tela baixa ou menos movimento): um Cifrão vivo em cada pouso.
      if (!estatico) { estatico = true; els.forEach((el) => { if (el.hasAttribute('data-fim')) return; const c = document.createElement('span'); c.className = 'cifrao'; c.style.setProperty('--cif-size', `${el.dataset.tam || 56}px`); if (el.dataset.tema === 'escuro') { c.style.setProperty('--cif-body', CLARO); c.style.setProperty('--cif-eyes', NAVY); } el.append(c); }); }
      return;
    }
    const vh = motion.viewport().height, topo = (el) => el.getBoundingClientRect().top + window.scrollY;
    pts = [{ el: dock, k: topo(mes) + mes.offsetHeight - vh, tam: dock.offsetWidth, tema: '', expr: '' }];
    for (const el of els) {
      const sec = el.closest('section, footer'), em = el.dataset.em;
      const r = el.getBoundingClientRect();
      const k = em !== undefined ? topo(sec) + (sec.offsetHeight - vh) * +em : r.top + window.scrollY + r.height / 2 - vh * .55;
      // O último pouso precisa ser alcançável: a chave nunca passa do fim da página.
      pts.push({ el, k: Math.min(Math.max(k, pts[pts.length - 1].k + 240), document.documentElement.scrollHeight - vh - 2), tam: +(el.dataset.tam || 60), tema: el.dataset.tema || '', expr: el.dataset.expr || '', fim: el.hasAttribute('data-fim') });
    }
    render();
  }
  const centro = (el, shift) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 + shift }; };
  function tema(t) {
    if (t === 'escuro') { traveler.style.setProperty('--cif-body', CLARO); traveler.style.setProperty('--cif-eyes', NAVY); }
    else { traveler.style.removeProperty('--cif-body'); traveler.style.removeProperty('--cif-eyes'); }
  }
  function render() {
    if (!on || !pts.length) return;
    const s = motion.read(), vh = innerHeight, shift = window.scrollY - s;
    if (s < pts[0].k) {
      if (ativo) { ativo = false; pouso = -1; tema(''); traveler.style.pointerEvents = 'none'; traveler.style.opacity = '1'; traveler.style.visibility = 'visible'; const c = centro(dock, 0), t = pts[0].tam; traveler.style.width = traveler.style.height = `${t}px`; traveler.style.transform = `translate(${c.x - t / 2}px, ${c.y - t * .635}px)`; }
      return;
    }
    ativo = true;
    let i = 0; while (i < pts.length - 1 && pts[i + 1].k <= s) i++;
    const A = pts[i], B = pts[i + 1];
    let a = centro(A.el, shift), x = a.x, y = a.y, tam = A.tam, t = 0, op = A.fim ? 0 : 1;
    if (B) {
      const d = B.k - A.k, partida = A.k + Math.min(d * .35, vh * .3);
      t = range(s, partida, B.k);
      if (t > 0) {
        const b = centro(B.el, shift), e = ease(t);
        // Durante a corrida ele fica dentro da tela, mesmo que o pouso de origem ou de destino já esteja fora.
        const ay = Math.max(110, Math.min(vh - 90, a.y)), by = Math.max(110, Math.min(vh - 70, b.y));
        const fora = ease(range(t, 0, .12)), dentro = ease(range(t, .82, 1));
        const y0 = mix(a.y, ay, fora), y1 = mix(by, b.y, dentro);
        x = mix(a.x, b.x, e); y = mix(y0, y1, e); tam = mix(A.tam, B.tam, e);
        const n = Math.max(2, Math.min(7, Math.round((B.k - partida) / 240))), fase = t * n, salto = Math.abs(Math.sin(Math.PI * fase));
        const fôlego = Math.sin(Math.PI * t) ** .6, dir = Math.sign(b.x - a.x) || 1;
        y -= salto * Math.min(64, tam * .9) * fôlego;
        if (B.fim) op = 1 - ease(range(t, .55, 1));
        // No meio da corrida ele usa a cor do tema da página; a cor do pouso só vale perto dele.
        tema(e < .1 ? A.tema : e > .9 ? B.tema : '');
        traveler.setAttribute('data-scroll-suspended', '');
        traveler.style.pointerEvents = 'none';
        pouso = -1;
        traveler.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: motion.withMomentum({
          yaw: dir * .5 * fôlego, rotation: dir * .13 * fôlego + Math.sin(fase * Math.PI * 2) * .05 * fôlego,
          scaleY: 1 + (.13 * salto - .09 * (1 - salto)) * fôlego, scaleX: 1 - (.08 * salto - .08 * (1 - salto)) * fôlego,
          gazeX: dir * .045 * fôlego, gazeY: .025 * fôlego, eyeScaleX: 1 + .2 * fôlego, marcas: t > .93 && !B.fim ? 1 : 0,
          leftEyeSmile: .5 * dentro, rightEyeSmile: .5 * dentro,
        }) }));
      }
    }
    if (t === 0) {
      // Pousado: devolve o controle ao próprio Cifrão e deixa tocar nele.
      tema(A.tema);
      traveler.removeAttribute('data-scroll-suspended');
      traveler.style.pointerEvents = A.fim ? 'none' : 'auto';
      if (pouso !== i) { pouso = i; if (A.expr) window.Cifrao?.expressao(traveler, A.expr); }
    }
    traveler.classList.add('is-active', 'is-flying'); traveler.classList.remove('is-surface');
    traveler.style.clipPath = '';
    traveler.style.opacity = String(op); traveler.style.visibility = op <= 0 ? 'hidden' : 'visible';
    traveler.style.width = traveler.style.height = `${tam}px`;
    traveler.style.transform = `translate(${x - tam / 2}px, ${y - tam / 2}px)`;
  }
  motion.subscribe(render);
  addEventListener('resize', measure);
  addEventListener('load', measure);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', measure);
  // As imagens e os dados do config mudam alturas: mede de novo quando o corpo muda de tamanho.
  new ResizeObserver(() => measure()).observe(document.body);
  measure();
})();
