/* Controle integrado: o mês e a carteira na mesma cena, varridos pela rolagem.
   A renda se reparte nos gastos, o que sobra vira uma ficha que atravessa a tela e cai na carteira,
   na classe que está abaixo do alvo, e o patrimônio sobe. O Cifrão assiste do meio e comemora. */
(() => {
  'use strict';
  const section = document.querySelector('.mes-story'), motion = window.AvenScroll;
  const traveler = document.querySelector('.story-traveler');
  if (!section || !motion) return;
  const $ = (s) => section.querySelector(s), $$ = (s) => [...section.querySelectorAll(s)];
  const stage = $('.mes-stage'), cena = $('.fx-cena'), head = $('.fx-head'), passo = $('[data-fx-passo]');
  const segs = $$('[data-seg]'), sobraSeg = $('[data-seg-sobra]'), linhas = $$('.fx-lista li'), sobraL = $('.fx-sobra-l');
  const ficha = $('[data-fx-ficha]'), alvos = $$('.fx-cart .alvos li'), patr = $('[data-fx-patr]'), ok = $('.fx-ok'), cart = $('.fx-cart');
  const header = document.querySelector('.header'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n) => Math.max(0, Math.min(1, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;
  const PASSOS = [[0, 'Tudo o que entra no mês.'], [.14, 'Cada gasto no seu lugar, sem digitar.'], [.44, 'O que sobra não fica parado.'], [.7, 'Vira aporte, na classe que está faltando.']];
  const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
  let enabled = false, metrics;
  function measure() {
    enabled = motion.storyFits(motion.viewport());
    section.classList.toggle('is-animated', enabled);
    for (const el of [cena, head, sobraSeg, sobraL, ficha, ok, ...linhas]) el.removeAttribute('style');
    // Segmentos e alvos guardam cor e medida no próprio style: só o que a cena mexe é desfeito.
    segs.forEach((s) => { s.style.flexGrow = ''; }); alvos.forEach((a) => a.style.removeProperty('--mais'));
    if (!enabled) { patr.textContent = fmt(98715); return; }
    const headerH = header.getBoundingClientRect().height;
    metrics = { start: section.getBoundingClientRect().top + window.scrollY - headerH, distance: Math.max(1, section.offsetHeight - stage.offsetHeight) };
    render();
  }
  function render() {
    if (!enabled) return;
    const p = clamp((motion.read() - metrics.start) / metrics.distance);
    const chegada = parseFloat(getComputedStyle(section).getPropertyValue('--reveal')) || 0;
    cena.style.opacity = head.style.opacity = String(chegada);
    cena.style.transform = `translateY(${(1 - chegada) * 30}px)`;
    // 1. A renda se reparte nos gastos.
    const reparte = range(p, .12, .4);
    segs.forEach((s, i) => { s.style.flexGrow = String(+s.dataset.seg * ease(range(reparte, i * .14, i * .14 + .44))); });
    linhas.forEach((l, i) => { const t = ease(range(reparte, i * .14 + .1, i * .14 + .5)); l.style.opacity = String(t); l.style.transform = `translateX(${(1 - t) * -12}px)`; });
    // 2. O que sobra ganha destaque e vira ficha.
    const sobra = ease(range(p, .38, .46));
    sobraSeg.style.opacity = String(.25 + .75 * sobra); sobraL.style.opacity = String(sobra);
    const voo = ease(range(p, .48, .68)), some = ease(range(p, .68, .73));
    const de = sobraL.getBoundingClientRect(), para = patr.getBoundingClientRect(), base = cena.getBoundingClientRect();
    const x = mix(de.left + de.width / 2, para.left + para.width / 2, voo) - base.left, y = mix(de.top + de.height / 2, para.top + para.height / 2, voo) - base.top - Math.sin(voo * Math.PI) * 70;
    ficha.style.opacity = String(ease(range(p, .44, .48)) * (1 - some));
    ficha.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1 + .15 * Math.sin(voo * Math.PI) - .4 * some}) rotate(${Math.sin(voo * Math.PI) * -8}deg)`;
    sobraL.style.opacity = String(sobra * (1 - ease(range(p, .46, .5)) * .65));
    // 3. A ficha cai na carteira: cada classe recebe a sua parte e o patrimônio sobe.
    const aporta = range(p, .68, .88);
    cart.style.setProperty('--pulso', String(Math.sin(range(p, .66, .76) * Math.PI)));
    alvos.forEach((a, i) => { a.style.setProperty('--mais', String(ease(range(aporta, i * .2, i * .2 + .5)))); });
    patr.textContent = fmt(96815 + 1900 * ease(range(p, .7, .9)));
    ok.style.opacity = String(ease(range(p, .88, .95)));
    let txt = PASSOS[0][1]; for (const [k, t] of PASSOS) if (p >= k) txt = t;
    if (passo.textContent !== txt) passo.textContent = txt;
    // O Cifrão acompanha a ficha com os olhos, salta quando ela cai e sorri no fim.
    if (traveler && chegada === 1 && p < 1) {
      const pulo = Math.sin(range(p, .68, .78) * Math.PI), feliz = ease(range(p, .8, .92));
      traveler.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: motion.withMomentum({
        gazeX: mix(-.075, .075, voo) * ease(range(p, .1, .2)), gazeY: .045 - .03 * Math.sin(voo * Math.PI), y: -.07 * pulo, scaleY: 1 + .07 * pulo, scaleX: 1 - .05 * pulo,
        rotation: mix(-.07, .07, voo) * ease(range(p, .1, .2)), eyeScaleX: 1 + .3 * pulo + .12 * sobra, leftEyeSmile: .8 * feliz, rightEyeSmile: .8 * feliz, marcas: pulo > .7 ? 1 : 0,
      }) }));
    }
  }
  motion.subscribe(render);
  addEventListener('resize', measure);
  reduced.addEventListener('change', measure);
  measure();
  window.AvenStory?.measure();
})();
