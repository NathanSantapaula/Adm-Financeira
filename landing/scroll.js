/* Um relógio visual sobre a rolagem nativa. A entrada nunca é interceptada: roda, trackpad, toque,
   teclado e barra movem a posição real; cada cena é função pura dessa posição, suavizada. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'), coarse = matchMedia('(pointer: coarse)');
  const STEPPED = 120, FINE = 60, TOUCH = 70, SPEED = 170, MIN_H = 520, FULL_SPEED = 5;
  const listeners = new Set();
  const actual = () => Math.max(0, window.scrollY);
  history.scrollRestoration = 'manual';
  function startOver() {
    const reloaded = performance.getEntriesByType?.('navigation')[0]?.type === 'reload';
    if (location.hash && !reloaded || window.scrollY <= 0) return;
    const root = document.documentElement, b = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto'; window.scrollTo({ top: 0, behavior: 'auto' }); root.style.scrollBehavior = b;
  }
  startOver();
  let value = actual(), target = value, speed = 0, frame = null, prevT = 0, response = coarse.matches ? TOUCH : STEPPED, layout = null;
  function viewport() {
    const width = innerWidth, height = innerHeight, keepsH = width <= 760 || coarse.matches;
    if (!layout || width !== layout.width || !keepsH && height !== layout.height) {
      layout = Object.freeze({ width, height });
      document.documentElement.style.setProperty('--vh-fixo', `${height}px`);
    }
    return layout;
  }
  viewport();
  const publish = (now) => { for (const l of [...listeners]) l(value, now); };
  function sync() { if (frame !== null) cancelAnimationFrame(frame); frame = null; prevT = 0; speed = 0; value = target = actual(); publish(performance.now()); }
  function request() { if (document.hidden || reduced.matches || frame !== null) return; if (!prevT) prevT = performance.now(); frame = requestAnimationFrame(tick); }
  function tick(now) {
    frame = null;
    if (document.hidden || reduced.matches) { sync(); return; }
    const el = Math.max(0, Math.min(64, now - prevT)); prevT = now; target = actual();
    const before = value;
    value += (target - value) * (1 - Math.exp(-el / response));
    const settled = Math.abs(target - value) < .1;
    if (settled) value = target;
    if (el) speed += ((value - before) / el - speed) * (1 - Math.exp(-el / SPEED));
    if (settled && Math.abs(speed) < .004) speed = 0;
    publish(now);
    if (!settled || speed !== 0) request();
    if (frame === null) prevT = 0;
  }
  // A rolagem tem peso: o Cifrão estica no movimento rápido e olha para onde vai.
  function withMomentum(pose) {
    const amount = Math.sqrt(Math.min(1, Math.abs(speed) / FULL_SPEED)) * (1 - (pose.dot ?? 0));
    if (!amount) return pose;
    const dir = Math.sign(speed);
    return { ...pose, scaleX: (pose.scaleX ?? 1) * (1 - .09 * amount), scaleY: (pose.scaleY ?? 1) * (1 + .13 * amount), rotation: (pose.rotation ?? 0) + .07 * dir * amount, gazeY: (pose.gazeY ?? 0) + .05 * dir * amount };
  }
  addEventListener('wheel', (e) => { const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1; response = Math.abs(e.deltaY * unit) >= 40 ? STEPPED : FINE; }, { passive: true });
  addEventListener('touchstart', () => { response = TOUCH; }, { passive: true });
  window.AvenScroll = Object.freeze({ read: () => value, velocity: () => speed, viewport, request, withMomentum,
    storyFits: (l) => !reduced.matches && l.height >= MIN_H, subscribe(l) { listeners.add(l); return () => listeners.delete(l); } });
  addEventListener('scroll', () => { target = actual(); if (reduced.matches || document.hidden) { sync(); return; } request(); }, { passive: true });
  addEventListener('pageshow', (e) => { if (!e.persisted) startOver(); sync(); }, { passive: true });
  for (const t of ['hashchange', 'popstate']) addEventListener(t, sync, { passive: true });
  const resume = () => { target = actual(); if (document.hidden) sync(); else request(); };
  for (const t of ['resize', 'blur', 'focus']) addEventListener(t, resume, { passive: true });
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', sync);
})();
