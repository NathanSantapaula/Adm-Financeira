/* Botão "i": descrições e recomendações saem da tela e ficam atrás de um ícone ao lado do título.
   Passar o mouse (ou focar com o teclado) mostra o texto; tocar ou clicar fixa e solta (celular).
   Funciona por cima dos templates: uma passada no DOM (infoPass) recolhe subtítulos de página, subtítulos de cartão,
   legendas explicativas (.cap), parágrafos de ajuda do painel e as dicas dos campos de configuração.
   Não mexe em: textos com id (atualizados ao vivo), com botão ou link dentro, avisos legais (.disc), itens .keep,
   página inicial e relatório para impressão. Um MutationObserver aplica a passada em tudo o que for desenhado depois. */
'use strict';

const INFO_ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r=".9" fill="currentColor" stroke="none"/></svg>';
let infoSeq = 0;
const infoInterativo = (el) => !!el.querySelector('a, button, input, select, textarea, label');
const infoLivre = (el) => !el.id && !el.classList.contains('keep') && !el.classList.contains('disc') && !el.closest('.rel, .hp, .info-i, .npop, .keep-txt') && !infoInterativo(el);

function infoBotao(heading, onde) {
  let b = [...heading.children].find((c) => c.classList && c.classList.contains('info-i'));
  if (b) return b;
  const titulo = (heading.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  b = document.createElement('button'); b.type = 'button'; b.className = 'info-i'; b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-label', titulo ? `Sobre "${titulo}"` : 'Mais informações'); b.id = 'info-' + (++infoSeq);
  b.innerHTML = INFO_ICONE + '<span class="info-c" hidden></span>';
  if (onde && onde.parentNode === heading) onde.after(b); else heading.appendChild(b);
  return b;
}
function infoMover(heading, el, onde) {
  const b = infoBotao(heading, onde); const c = b.querySelector('.info-c');
  const p = document.createElement('span'); p.className = 'info-p'; p.innerHTML = el.innerHTML; c.appendChild(p);
  el.remove();
}
// título de um bloco: h3/h2 do bloco ou o rótulo .c-k (nesse caso o "i" vai logo depois do texto)
function infoTitulo(box) {
  const h = box.querySelector(':scope > .c-h h3, :scope > .c-h .c-k, :scope > h3, :scope > h2, :scope > .c-k, :scope > div > h3, :scope > header h3, h3, h2, .c-k');
  if (!h) return null;
  const sp = h.classList.contains('c-k') ? h.querySelector(':scope > span') : null;
  return sp ? { h, onde: sp } : { h, onde: null };
}
function infoPass(root) {
  if (!root || !root.querySelectorAll || document.body.dataset.screen === 'landing') return;
  // 1) subtítulo da página
  root.querySelectorAll('.page-h .sub').forEach((p) => { const t = p.closest('.page-h').querySelector('.title'); if (t && infoLivre(p)) infoMover(t, p); });
  // 2) subtítulo do cabeçalho de cartão ou de seção
  root.querySelectorAll('.c-h p, .sec-h p').forEach((p) => { const h = p.parentElement && p.parentElement.querySelector('h3'); if (h && infoLivre(p)) infoMover(h, p); });
  // 3) legendas explicativas
  root.querySelectorAll('p.cap').forEach((p) => {
    if (!infoLivre(p) || !p.textContent.trim()) return;
    const box = p.closest('section, .card, .dr-sec, .ob-card, .mform, .kpi');
    if (!box) { // legenda solta na página: vai para o título de seção mais próximo acima dela
      let ant = p.previousElementSibling; while (ant && !ant.matches('.sec-h, .page-h')) ant = ant.previousElementSibling;
      const h = ant && ant.querySelector('h3, h2'); if (h) infoMover(h, p); return;
    }
    const t = infoTitulo(box); if (t && !p.contains(t.h)) infoMover(t.h, p, t.onde);
  });
  // 4) parágrafo de ajuda logo abaixo do título de uma seção do painel
  root.querySelectorAll('.dr-sec > h3 + p.mmsg').forEach((p) => { if (infoLivre(p)) infoMover(p.previousElementSibling, p); });
  // 5) dicas dos campos de configuração
  root.querySelectorAll('.field-row > div > small').forEach((s) => { if (infoLivre(s)) infoMover(s.parentElement, s); });
}

/* ---------- balão ---------- */
let infoAtual = null; let infoFixo = false;
function infoBalao() {
  let t = document.getElementById('infotip');
  if (!t) { t = document.createElement('div'); t.id = 'infotip'; t.className = 'infotip'; t.setAttribute('role', 'tooltip'); }
  const dlg = [...document.querySelectorAll('dialog[open]')].pop(); const host = dlg || document.body; // dentro do painel aberto, senão fica por baixo
  if (t.parentElement !== host) host.appendChild(t);
  return t;
}
function infoMostrar(b, fixo) {
  const c = b.querySelector('.info-c'); if (!c) return;
  if (infoAtual && infoAtual !== b) infoEsconder(true);
  const t = infoBalao(); t.innerHTML = c.innerHTML;
  // dentro de um painel aberto, o balão se posiciona em relação a ele (o painel cria o próprio referencial)
  const host = t.parentElement; const hr = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect(); t.classList.add('on'); infoAtual = b; infoFixo = !!fixo;
  b.setAttribute('aria-expanded', String(!!fixo)); b.setAttribute('aria-describedby', 'infotip'); b.classList.add('ativo');
  // posição: abaixo do botão, alinhado a ele, sem sair da tela; se não couber embaixo, vai para cima
  const r = b.getBoundingClientRect(); const vw = window.innerWidth; const vh = window.innerHeight;
  const w = Math.min(320, vw - 24); t.style.width = w + 'px';
  const left = Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - 28));
  t.style.left = (left - hr.left) + 'px'; t.style.top = '0px'; const hgt = t.offsetHeight;
  const abaixo = r.bottom + 8 + hgt <= vh - 8 || r.top - 8 - hgt < 8;
  t.style.top = ((abaixo ? r.bottom + 8 : r.top - 8 - hgt) - hr.top) + 'px';
  t.style.setProperty('--seta', Math.max(14, Math.min(w - 14, r.left + r.width / 2 - left)) + 'px'); t.classList.toggle('cima', !abaixo);
}
function infoEsconder(forcar) {
  if (!infoAtual) return; if (infoFixo && !forcar) return;
  const t = document.getElementById('infotip'); if (t) t.classList.remove('on');
  infoAtual.setAttribute('aria-expanded', 'false'); infoAtual.removeAttribute('aria-describedby'); infoAtual.classList.remove('ativo');
  infoAtual = null; infoFixo = false;
}
function infoIniciar() {
  const mouse = () => window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('pointerover', (e) => { const b = e.target.closest && e.target.closest('.info-i'); if (b && mouse() && !infoFixo) infoMostrar(b, false); });
  document.addEventListener('pointerout', (e) => { const b = e.target.closest && e.target.closest('.info-i'); if (b && mouse() && !b.contains(e.relatedTarget)) infoEsconder(false); });
  document.addEventListener('focusin', (e) => { const b = e.target.closest && e.target.closest('.info-i'); if (b && !infoFixo) infoMostrar(b, false); });
  document.addEventListener('focusout', (e) => { const b = e.target.closest && e.target.closest('.info-i'); if (b) infoEsconder(false); });
  // clique: fixa ou solta (capturado antes do roteador de ações, para não abrir nada por trás)
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.info-i');
    if (b) { e.preventDefault(); e.stopPropagation(); if (infoAtual === b && infoFixo) infoEsconder(true); else infoMostrar(b, true); return; }
    if (infoAtual && !(e.target.closest && e.target.closest('#infotip'))) infoEsconder(true);
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && infoAtual) { const b = infoAtual; infoEsconder(true); b.focus(); e.stopPropagation(); e.preventDefault(); } /* Esc fecha só o balão, não a janela por baixo */ }, true);
  window.addEventListener('scroll', () => infoEsconder(true), true); window.addEventListener('resize', () => infoEsconder(true));
  // tudo o que for desenhado depois (telas, painel, modais, trocas parciais) passa pela mesma regra
  const alvo = '.cap, .sub, .c-h p, .sec-h p, .mmsg, .field-row small';
  const mo = new MutationObserver((muts) => {
    if (infoAtual && !infoAtual.isConnected) { infoEsconder(true); }
    const raizes = new Set();
    muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.id !== 'infotip' && (n.matches(alvo) || n.querySelector(alvo))) raizes.add(n.parentElement || n); }));
    raizes.forEach((r) => infoPass(r));
  });
  mo.observe(document.body, { childList: true, subtree: true });
  infoPass(document.body);
}
