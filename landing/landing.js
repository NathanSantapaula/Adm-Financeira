/* Menu, contatos vindos do config.js e a saudação do Cifrão. */
(() => {
  'use strict';
  const CFG = window.FP_CONFIG || {};
  const toggle = document.querySelector('.menu-toggle'), nav = document.getElementById('mobile-nav');
  const setMenu = (open) => { nav.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); toggle.querySelector('use').setAttribute('href', open ? '#close' : '#menu'); };
  toggle?.addEventListener('click', () => setMenu(nav.hidden));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !nav.hidden) setMenu(false); });
  const liga = (sel, href) => document.querySelectorAll(sel).forEach((el) => { if (href) el.href = href; else el.remove(); });
  liga('[data-whatsapp]', CFG.whatsapp && `https://wa.me/${CFG.whatsapp.replace(/\D/g, '')}`);
  liga('[data-email]', CFG.email && `mailto:${CFG.email}`);
  liga('[data-agenda]', CFG.agendaUrl);
  // Boas-vindas: o Cifrão do título percebe o visitante e saúda.
  const hero = document.querySelector('.hero-mascot');
  setTimeout(() => window.Cifrao?.expressao(hero, 'surpreso'), 400);
  setTimeout(() => window.Cifrao?.expressao(hero, 'animado'), 1900);
  // Os avisos e o rodapé reagem quando entram na tela.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; window.Cifrao?.expressao(e.target, e.target.dataset.expr); io.unobserve(e.target); }), { threshold: .6 });
  document.querySelectorAll('.bento-notification-icon').forEach((el, i) => { el.dataset.expr = i ? 'curioso' : 'animado'; io.observe(el); });
})();
