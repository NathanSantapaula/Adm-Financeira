/* A posição da rolagem, sozinha, coloca o Cifrão: cada quadro é função pura dela, nos dois sentidos.
   O mascote do título desce até o campo de mensagem, acompanha o envio, vira o ponto do "Pensando",
   cresce até ser a própria superfície da resposta e, no fim, atravessa a tela para a seção seguinte. */
(() => {
  'use strict';
  const section = document.querySelector('.scroll-story');
  const hero = document.querySelector('.hero-mascot');
  if (!section || !hero || !window.AvenScroll) return;
  const traveler = hero;
  const heroSlot = document.createElement('button');
  heroSlot.className = 'hero-mascot-slot'; heroSlot.type = 'button';
  heroSlot.setAttribute('aria-label', hero.getAttribute('aria-label') || 'Cumprimentar o Cifrão');
  Object.assign(heroSlot.style, { display: 'block', width: '1.45em', height: '1.45em', padding: '0', border: '0', background: 'none', borderRadius: '30%', font: 'inherit', lineHeight: '1', marginTop: '-.11em' });
  heroSlot.addEventListener('click', () => hero.click());
  let fixed = false;
  hero.classList.add('story-traveler');
  hero.style.display = 'block';
  function placeActor(enabled) {
    if (enabled && !fixed) {
      const i = hero.getBoundingClientRect();
      hero.before(heroSlot); document.body.append(hero); fixed = true;
      hero.tabIndex = -1; hero.setAttribute('aria-hidden', 'true');
      Object.assign(hero.style, { position: 'fixed', left: '0', top: '0', margin: '0', pointerEvents: 'none', transformOrigin: '0 0', transition: 'none',
        width: `${i.width}px`, height: `${i.height}px`, transform: `translate3d(${i.left}px, ${i.top + window.scrollY}px, 0)` });
    } else if (!enabled && fixed) {
      heroSlot.replaceWith(hero); fixed = false;
      hero.removeAttribute('aria-hidden'); hero.removeAttribute('tabindex');
      for (const k of ['position', 'left', 'top', 'margin', 'pointerEvents', 'transformOrigin', 'transform', 'width', 'height', 'clipPath', 'opacity', 'visibility', 'transition']) hero.style[k] = '';
      const c = { pose: null };
      hero.dispatchEvent(new CustomEvent('cifrao:read-pose', { detail: c }));
      if (c.pose) hero.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: c.pose }));
    }
  }
  const heroBounds = () => (fixed ? heroSlot : hero).getBoundingClientRect();
  const $ = (s) => section.querySelector(s);
  const stage = $('.story-stage'), canvas = $('.story-canvas'), request = $('.story-request'), text = $('.story-request-text');
  const tools = $('.story-composer-tools'), send = $('.story-send'), answer = $('.story-answer'), thinking = $('.story-thinking');
  const anchor = $('.story-dot-anchor'), hint = $('.story-scroll-hint');
  const root = document.documentElement, themeColor = document.querySelector('meta[name="theme-color"]');
  const startsLight = root.dataset.theme === 'light';
  function setPageInverted(inv) {
    const light = startsLight !== inv, theme = light ? 'light' : 'dark';
    if (root.dataset.theme === theme) return;
    root.dataset.theme = theme;
    themeColor?.setAttribute('content', light ? '#F7F4ED' : '#0A84FF');
    window.dispatchEvent(new CustomEvent('aven:theme-changed'));
  }
  const heroSection = document.querySelector('.hero'), heroContent = heroSection.querySelector('.hero-content'), header = document.querySelector('.header');
  const mesSection = document.querySelector('.mes-story'), mesDock = mesSection?.querySelector('.mes-dock');
  const fullText = text.textContent, motion = window.AvenScroll, visualScroll = () => motion.read();
  const shiftedRect = (el, shift = 0) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width, height: r.height, top: r.top + shift, bottom: r.bottom + shift }; };
  // O navegador prende cada palco (sticky); as medidas seguem o relógio visual, então a roda do mouse desliza o Cifrão em vez de teleportá-lo.
  function stageOffset(owner, ownerStage, headerH, y) {
    const r = owner.getBoundingClientRect(), top = r.top + window.scrollY, h = ownerStage.offsetHeight;
    const stageTop = Math.max(top - y, Math.min(headerH, top + owner.offsetHeight - y - h));
    return stageTop - ownerStage.getBoundingClientRect().top;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dots = [-1, 1].map(() => { const d = document.createElement('span'); d.className = 'story-split-dot'; d.setAttribute('aria-hidden', 'true'); document.body.append(d); return d; });
  const clamp = (n) => Math.min(1, Math.max(0, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;
  const limitGaze = (n) => Math.min(.095, Math.max(-.095, n));
  function clipToStage(el, x, y, w, h, b) {
    if (!b) { el.style.clipPath = ''; return; }
    const l = Math.max(x, b.left), t = Math.max(y, b.top), r = Math.min(x + w, b.right), bo = Math.min(y + h, b.bottom);
    el.style.clipPath = r <= l || bo <= t ? 'inset(100% 0 0 0)' : `inset(${t - y}px ${x + w - r}px ${y + h - bo}px ${l - x}px)`;
  }
  // O corpo vira superfície revelando uma camada sólida de tela inteira por uma máscara: nenhum redesenho por quadro.
  function paintSurface(x, y, w, h, radius, tail, b) {
    const cw = innerWidth + 8, ch = innerHeight + 8;
    traveler.classList.add('is-surface');
    const l = b ? Math.max(x, b.left) : x, t = b ? Math.max(y, b.top) : y, r = b ? Math.min(x + w, b.right) : x + w, bo = b ? Math.min(y + h, b.bottom) : y + h;
    traveler.style.width = `${cw}px`; traveler.style.height = `${ch}px`; traveler.style.transform = 'translate(-4px, -4px)';
    traveler.style.clipPath = r <= l || bo <= t ? 'inset(100% 0 0 0)' : `inset(${t + 4}px ${cw - 4 - r}px ${ch - 4 - bo}px ${l + 4}px round ${radius}px ${radius}px ${radius}px ${tail}px)`;
    traveler.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: { dot: 1 } }));
  }
  function mesStart() {
    if (!mesDock || !mesSection.classList.contains('is-animated')) return null;
    return mesSection.getBoundingClientRect().top + window.scrollY - header.getBoundingClientRect().height;
  }
  const handoffForming = .62;
  let enabled = false, metrics, launchPose = null, launchOrigin = null;
  function reset() {
    stage.inert = false;
    if (!enabled) mesSection?.style.removeProperty('--reveal');
    section.classList.remove('is-scroll', 'is-inverting');
    traveler.classList.remove('is-surface'); traveler.style.removeProperty('--cif-body');
    const next = mesStart();
    if (!enabled || next === null || window.scrollY < next) { traveler.classList.remove('is-active'); traveler.style.clipPath = ''; }
    hero.style.opacity = ''; hero.style.visibility = ''; hero.removeAttribute('data-scroll-suspended');
    launchPose = launchOrigin = null;
    dots.forEach((d) => { d.style.opacity = '0'; d.style.clipPath = ''; });
    [request, text, tools, answer, thinking, canvas].forEach((el) => el.removeAttribute('style'));
    text.textContent = fullText; answer.removeAttribute('aria-hidden'); tools.inert = false;
  }
  let measuredViewport = null;
  function measure() {
    const viewport = motion.viewport(); measuredViewport = viewport;
    const prev = { launchPose, launchOrigin };
    enabled = motion.storyFits(viewport);
    reset();
    heroContent.style.animation = enabled ? 'none' : '';
    placeActor(enabled);
    if (!enabled) { render(); return; }
    section.classList.add('is-scroll');
    const headerHeight = header.getBoundingClientRect().height;
    section.style.setProperty('--story-header', `${headerHeight}px`);
    const rect = section.getBoundingClientRect(), heroRect = heroBounds(), readingHold = mesSection ? viewport.height * .35 : 0;
    metrics = { heroX: heroRect.left + heroRect.width * .5, heroY: heroRect.top + window.scrollY + heroRect.height * .635, heroSize: heroRect.width, headerHeight,
      start: rect.top + window.scrollY - headerHeight, distance: Math.max(1, section.offsetHeight - stage.offsetHeight - readingHold), readingHold,
      width: canvas.clientWidth, height: canvas.clientHeight, canvasTop: canvas.offsetTop, answerHeight: answer.offsetHeight, stageHeight: stage.offsetHeight };
    ({ launchPose, launchOrigin } = prev);
    render();
  }
  function render() {
    if (!enabled) {
      answer.classList.add('aberta');
      const answerTop = answer.getBoundingClientRect().top + window.scrollY - visualScroll();
      setPageInverted(visualScroll() > 0 && answerTop < innerHeight * .5);
      return;
    }
    const nextStart = mesStart(), scroll = visualScroll(), atMes = nextStart !== null && scroll >= nextStart - 1;
    if (launchPose === null) { const o = heroBounds(); metrics.heroX = o.left + o.width * .5; metrics.heroY = o.top + window.scrollY + o.height * .635; metrics.heroSize = o.width; }
    const drift = stageOffset(section, stage, metrics.headerHeight, scroll);
    const stageTop = stage.getBoundingClientRect().top + drift;
    stage.inert = stageTop >= innerHeight || stageTop + metrics.stageHeight <= metrics.headerHeight;
    if (atMes) {
      mesSection.style.setProperty('--reveal', '1');
      traveler.classList.remove('is-surface'); setPageInverted(true); traveler.style.removeProperty('--cif-body');
      section.classList.remove('is-inverting');
      answer.style.opacity = '0'; answer.setAttribute('aria-hidden', 'true'); thinking.style.opacity = '0'; hint.style.opacity = '0';
      dots.forEach((d) => { d.style.opacity = '0'; });
      hero.setAttribute('data-scroll-suspended', '');
      return;
    }
    const handoffStart = metrics.start + metrics.distance * .87 + metrics.readingHold;
    const handoffProgress = nextStart === null ? 0 : range(scroll, handoffStart, nextStart);
    const p = clamp((scroll - metrics.start) / metrics.distance), opening = range(p, .58, .8);
    const finalTop = Math.min(metrics.canvasTop, metrics.stageHeight - metrics.answerHeight - 155);
    canvas.style.top = `${mix(metrics.canvasTop, finalTop, ease(opening))}px`;
    const sectionRect = shiftedRect(section, window.scrollY - scroll), canvasRect = shiftedRect(canvas, drift);
    const sent = ease(range(p, .23, .38)), mobile = metrics.width < 500;
    const bubbleWidth = Math.min(mobile ? metrics.width * .94 : 408, metrics.width), bubbleHeight = mobile ? 78 : 72;
    const belowHero = metrics.heroY - metrics.headerHeight - metrics.canvasTop + 94;
    const initialY = Math.min(metrics.height - 160, Math.max(145, metrics.height * .37, belowHero));
    const width = mix(metrics.width, bubbleWidth, sent), height = mix(148, bubbleHeight, sent), x = mix(0, metrics.width - bubbleWidth, sent), y = mix(initialY, 0, sent);
    request.style.width = `${width}px`; request.style.height = `${height}px`; request.style.transform = `translate(${x}px, ${y}px)`;
    request.style.borderRadius = `${mix(28, 24, sent)}px ${mix(28, 24, sent)}px ${mix(28, 6, sent)}px ${mix(28, 24, sent)}px`;
    text.style.fontSize = `${mix(mobile ? 20 : 25, mobile ? 15 : 16, sent)}px`; text.style.top = `${mix(23, 15, sent)}px`;
    const typed = Math.floor(mix(0, fullText.length, range(p, .025, .205))), content = fullText.slice(0, typed);
    if (text.textContent !== content) text.textContent = content;
    text.setAttribute('aria-label', fullText);
    tools.style.opacity = String(1 - range(p, .21, .29)); tools.inert = p > .29;
    if (handoffProgress > 0) {
      const flight = range(handoffProgress, handoffForming, 1);
      mesSection.style.setProperty('--reveal', String(ease(range(flight, .72, 1))));
      renderHandoff(range(handoffProgress, 0, handoffForming), flight, drift, stageTop);
      return;
    }
    mesSection?.style.setProperty('--reveal', '0');
    setPageInverted(false); section.classList.remove('is-inverting'); traveler.style.removeProperty('--cif-body');
    answer.style.transform = ''; answer.style.transformOrigin = ''; request.style.opacity = '';
    const departure = 0;
    const active = (scroll > departure || opening > 0) && sectionRect.bottom > 0 && sectionRect.top < innerHeight;
    if (active && launchPose === null) {
      const c = { pose: null }; hero.dispatchEvent(new CustomEvent('cifrao:read-pose', { detail: c }));
      const o = hero.getBoundingClientRect(); launchPose = c.pose;
      launchOrigin = scroll < metrics.start + metrics.distance * .12 ? { x: o.left + o.width * .5, y: o.top + o.height * .635, scroll } : { x: metrics.heroX, y: metrics.heroY, scroll: departure };
    }
    const returnPose = !active ? launchPose : null;
    if (!active) launchPose = launchOrigin = null;
    heroSlot.inert = active; heroSlot.tabIndex = active ? -1 : 0;
    const launchScroll = launchOrigin?.scroll ?? departure;
    const descent = ease(range(scroll, launchScroll, metrics.start + metrics.distance * .12)), travel = ease(range(p, .205, .49));
    const dotRect = shiftedRect(anchor, drift), dotX = dotRect.left + dotRect.width / 2, dotY = dotRect.top + dotRect.height / 2;
    const composerX = canvasRect.left + metrics.width * .5, composerY = metrics.headerHeight + metrics.canvasTop + initialY - 62;
    const morph = ease(range(p, .38, .49)), stageRect = shiftedRect(stage, drift);
    const stageClip = morph === 1 ? { top: Math.max(metrics.headerHeight, stageRect.top), right: Math.min(innerWidth, stageRect.right), bottom: Math.min(innerHeight, stageRect.bottom), left: Math.max(0, stageRect.left) } : null;
    const originX = launchOrigin?.x ?? metrics.heroX, originY = launchOrigin?.y ?? metrics.heroY;
    const launchX = mix(originX, composerX, descent), launchY = mix(originY, composerY, descent);
    const arcTop = Math.max(metrics.headerHeight + 25, Math.min(composerY, dotY) - 145);
    const leftWaypoint = mobile ? Math.max(4, dotX - 34) : Math.max(40, dotX - 60);
    const bez = (a, b, c, d, t) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
    const centerX = bez(launchX, composerX - metrics.width * .30, leftWaypoint, dotX, travel), centerY = bez(launchY, arcTop, arcTop, dotY, travel);
    const size = mix(metrics.heroSize, 14, morph);
    hero.toggleAttribute('data-scroll-suspended', active);
    traveler.classList.add('is-active'); traveler.style.visibility = 'visible';
    traveler.classList.toggle('is-flying', morph < 1); traveler.style.opacity = '1';
    const requestRect = shiftedRect(request, drift), writing = typed / fullText.length;
    const gazeX = mix(mix(-.095, .095, writing), limitGaze((requestRect.left + width * .5 - centerX) / 1100), ease(range(p, .215, .30)));
    const gazeY = limitGaze((requestRect.top + Math.min(35, height * .5) - centerY) / 900);
    const surprise = ease(range(scroll, departure, departure + 55)) * (1 - ease(range(descent, .65, 1)));
    if (morph === 1) {
      const answerRect = shiftedRect(answer, drift), growX = ease(range(opening, .15, .72)), growY = ease(range(opening, .19, 1));
      const sw = mix(8.4, answerRect.width, growX), sh = mix(8.4, answerRect.height, growY), sx = mix(dotX - 4.2, answerRect.left, growX), sy = mix(dotY - 4.2, answerRect.top, growY);
      const radius = Math.min(mix(4.2, 24, ease(opening)), sw / 2, sh / 2);
      paintSurface(sx, sy, sw, sh, radius, mix(4.2, 7, growY), stageClip);
      answer.style.clipPath = `inset(${Math.max(0, sy - answerRect.top)}px ${Math.max(0, answerRect.right - sx - sw)}px ${Math.max(0, answerRect.bottom - sy - sh)}px ${Math.max(0, sx - answerRect.left)}px round ${radius}px)`;
    } else {
      traveler.classList.remove('is-surface'); traveler.style.clipPath = '';
      traveler.style.width = `${size}px`; traveler.style.height = `${size}px`;
      traveler.style.transform = `translate(${centerX - size * .5}px, ${centerY - size * .635}px)`;
      const pose = motion.withMomentum({ dot: morph, gazeX: gazeX * (1 - morph), gazeY: gazeY * (1 - morph), eyeScaleX: 1 + surprise * .5,
        leftEyeScaleY: 1 + surprise * .38, rightEyeScaleY: 1 + surprise * .38, leftEyeSmile: 0, rightEyeSmile: 0, rotation: -.10 * Math.sin(travel * Math.PI) });
      // Parte da pose viva do título em vez de saltar de um gesto para o repouso.
      const handoff = ease(range(scroll, launchScroll, launchScroll + 120));
      if (launchPose && handoff < 1) {
        const unit = ['scaleX', 'scaleY', 'eyeScaleX', 'leftEyeScaleY', 'rightEyeScaleY', 'eyeSpacing'];
        for (const [k, from] of Object.entries(launchPose)) {
          const target = pose[k] ?? (unit.includes(k) ? 1 : 0), diff = target - from;
          pose[k] = from + (k === 'yaw' || k === 'pitch' ? Math.atan2(Math.sin(diff), Math.cos(diff)) : diff) * handoff;
        }
      }
      if (active || returnPose) traveler.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: active ? pose : returnPose }));
      answer.style.clipPath = 'inset(0 0 100% 0)';
    }
    const split = ease(range(p, .46, .52)), merge = ease(range(opening, 0, .22));
    dots.forEach((dot, i) => {
      const dir = i === 0 ? -1 : 1, pulse = Math.sin(range(p, .51, .60) * Math.PI * 4 + i * 1.8) * 2 * range(p, .51, .53);
      dot.style.opacity = String(active && opening < .24 ? split : 0);
      const dx = dotX + dir * 12 * split * (1 - merge) - 4.2, dy = dotY - 4.2 + pulse * (1 - merge);
      dot.style.transform = `translate(${dx}px, ${dy}px)`;
      clipToStage(dot, dx, dy, 8.4, 8.4, stageClip);
    });
    thinking.style.opacity = String(ease(range(p, .49, .53)) * (1 - merge));
    answer.style.opacity = String(ease(range(opening, .30, .48)));
    answer.classList.toggle('aberta', opening > .42);
    answer.setAttribute('aria-hidden', String(opening < .30));
    hint.style.opacity = opening > 0 ? '0' : '1';
  }
  // A resposta inteira cobre a tela (a página inverte por trás dela), encolhe até um ponto e esse ponto voa até o comprovante.
  function renderHandoff(handoff, flight, drift, stageTop) {
    answer.style.transform = '';
    const answerRect = shiftedRect(answer, drift);
    const dockRect = shiftedRect(mesDock, stageOffset(mesSection, mesSection.querySelector('.mes-stage'), metrics.headerHeight, visualScroll()));
    const expand = ease(range(handoff, 0, .42)), gather = ease(range(handoff, .04, .70)), unroll = ease(range(handoff, .72, 1));
    const inkX = answerRect.left + answerRect.width / 2, inkY = answerRect.top + answerRect.height / 2;
    const focusX = Math.max(55, Math.min(innerWidth - 55, inkX));
    const focusY = Math.max(metrics.headerHeight + 65, Math.min(innerHeight - 70, inkY - (stageTop - metrics.headerHeight)));
    const inkScale = mix(1, 8.4 / Math.max(1, answerRect.width, answerRect.height), gather), center = ease(range(handoff, 0, .55)), inkVis = 1 - ease(range(handoff, .62, .73));
    section.classList.add('is-inverting');
    setPageInverted(handoff >= .42);
    answer.style.transformOrigin = '50% 50%';
    answer.style.transform = `translate(${(focusX - inkX) * center}px, ${(focusY - inkY) * center}px) scale(${inkScale})`;
    answer.style.clipPath = 'none'; answer.style.opacity = String(inkVis); answer.setAttribute('aria-hidden', String(inkVis < .3));
    request.style.opacity = String(1 - ease(range(handoff, 0, .18)));
    thinking.style.opacity = hint.style.opacity = '0'; dots.forEach((d) => { d.style.opacity = '0'; });
    traveler.classList.add('is-active'); traveler.classList.toggle('is-flying', handoff >= .42); traveler.style.visibility = 'visible';
    hero.setAttribute('data-scroll-suspended', ''); heroSlot.inert = true;
    if (handoff < .42) {
      traveler.style.setProperty('--cif-body', startsLight ? '#06122A' : '#F7F4ED');
      traveler.style.opacity = '1';
      paintSurface(mix(answerRect.left, -4, expand), mix(answerRect.top, -4, expand), mix(answerRect.width, innerWidth + 8, expand), mix(answerRect.height, innerHeight + 8, expand), mix(24, 0, expand), mix(7, 0, expand));
    } else {
      traveler.classList.remove('is-surface'); traveler.style.clipPath = ''; traveler.style.removeProperty('--cif-body');
      traveler.style.opacity = String(ease(range(handoff, .62, .73)));
      const t = ease(flight);
      const cx = mix(focusX, dockRect.left + dockRect.width * .5, t) + Math.sin(flight * Math.PI) ** 2 * 32 * unroll;
      const cy = mix(focusY, dockRect.top + dockRect.height * .635, t), size = mix(14, dockRect.width, unroll);
      traveler.style.width = traveler.style.height = `${size}px`;
      traveler.style.transform = `translate(${cx - size * .5}px, ${cy - size * .635}px)`;
      traveler.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: motion.withMomentum({ dot: 1 - unroll, gazeX: 0, gazeY: .08 * unroll, rotation: 0 }) }));
    }
  }
  function seek(progress) {
    if (enabled) window.scrollTo({ top: metrics.start + metrics.distance * progress, behavior: 'smooth' });
    else answer.scrollIntoView({ behavior: 'auto', block: 'center' });
  }
  send.addEventListener('click', () => seek(.51));
  motion.subscribe(() => render());
  addEventListener('resize', () => { const v = motion.viewport(); if (v.width !== measuredViewport?.width || v.height !== measuredViewport?.height) measure(); else motion.request(); });
  addEventListener('pageshow', measure);
  reduced.addEventListener('change', measure);
  measure();
  window.AvenStory = Object.freeze({ measure, traveler });
})();
