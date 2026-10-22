/* Tour de boas-vindas: na primeira entrada depois do cadastro (S.profile.tourPendente, marcado em finishOb), escurece a tela
   e destaca, um por vez, só o essencial: as abas principais, o período, o olho, os avisos e o perfil.
   Passo sem alvo visível (aba bloqueada no celular, dentro de "Mais") é pulado. Esc ou "Pular" encerram; não volta a aparecer. */
let TOUR = null;
const TOUR_PASSOS = [
  { t: 'Bem-vindo ao seu painel', d: 'Em menos de um minuto mostramos o essencial. Dá para pular quando quiser.' },
  { s: '[data-act="nav"][data-view="geral"]', t: 'Visão geral', d: 'O resumo do seu dinheiro: patrimônio, quanto sobrou no mês e seus objetivos.' },
  { s: '[data-act="nav"][data-view="despesas"]', t: 'Gastos', d: 'Registre o que gasta e veja para onde foi o dinheiro. Também dá para importar o extrato do banco.' },
  { s: '[data-act="nav"][data-view="rendas"]', t: 'Rendas', d: 'Salário e outras entradas. A sobra entre rendas e gastos é o que dá para investir.' },
  { s: '[data-act="nav"][data-view="inv"]', t: 'Investimentos', d: 'Quanto você aportou no mês e quanto ainda dá para investir.' },
  { s: '[data-act="nav"][data-view="cart"]', t: 'Carteira', d: 'Como seus investimentos estão divididos e o que aportar para equilibrar.' },
  { s: '.per-pill, .year-pill', t: 'Período', d: 'Escolha o ano e os meses. Os números da tela acompanham a escolha.' },
  { s: '.olho', t: 'Esconder valores', d: 'Em público? Toque no olho e os valores em reais ficam ocultos.' },
  { s: '.ia-btn', t: 'Avisos e assistente', d: 'Lembretes do mês e respostas para as suas dúvidas.' },
  { s: '.topo-eu', t: 'Seu perfil', d: 'Objetivos, aparência, backup e o seu plano ficam aqui.' },
];
// primeiro elemento visível do seletor (no computador o menu lateral; no celular a barra de baixo)
function tourAlvo(s) { if (!s) return null; return [...document.querySelectorAll(s)].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }) || null; }
function tourTalvez() {
  if (TOUR || (typeof AB !== 'undefined' && AB) || S.screen !== 'app' || !S.profile || !S.profile.tourPendente || document.querySelector('dialog[open]')) return;
  S.profile.tourPendente = false; touch('profile'); // marcado já no início: não repete mesmo se fechar a aba no meio
  const passos = TOUR_PASSOS.filter((p) => !p.s || tourAlvo(p.s)); if (passos.length < 2) return;
  const el = document.createElement('div'); el.className = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tour-t');
  el.innerHTML = '<div class="tour-luz" aria-hidden="true"></div><div class="tour-card"><small class="tour-n"></small><h3 id="tour-t"></h3><p></p><div class="tour-b"><button class="btn tour-pular" type="button">Pular</button><span></span><button class="btn tour-volta" type="button">Voltar</button><button class="btn primary tour-ir" type="button"></button></div></div>';
  document.body.appendChild(el); window.scrollTo(0, 0);
  const pos = () => tourPos(); const tecla = (e) => { if (e.key === 'Escape') { e.preventDefault(); tourFim(); } };
  TOUR = { el, passos, i: 0, pos, tecla };
  el.querySelector('.tour-pular').addEventListener('click', tourFim);
  el.querySelector('.tour-volta').addEventListener('click', () => tourIr(TOUR.i - 1));
  el.querySelector('.tour-ir').addEventListener('click', () => (TOUR.i >= TOUR.passos.length - 1 ? tourFim() : tourIr(TOUR.i + 1)));
  addEventListener('resize', pos); addEventListener('scroll', pos, true); document.addEventListener('keydown', tecla, true);
  tourIr(0);
}
function tourIr(i) {
  const T = TOUR; if (!T) return; T.i = Math.max(0, Math.min(T.passos.length - 1, i)); const p = T.passos[T.i]; const q = (s) => T.el.querySelector(s);
  q('.tour-n').textContent = `${T.i + 1} de ${T.passos.length}`; q('h3').textContent = p.t; q('p').textContent = p.d;
  q('.tour-volta').hidden = T.i === 0; q('.tour-ir').textContent = T.i === T.passos.length - 1 ? 'Começar' : 'Próximo';
  const a = tourAlvo(p.s); if (a) a.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  tourPos(); q('.tour-ir').focus({ preventScroll: true });
}
// luz no alvo (a sombra enorme escurece o resto) e o cartão ao lado: à direita do menu lateral, senão embaixo ou em cima
function tourPos() {
  const T = TOUR; if (!T) return; const luz = T.el.querySelector('.tour-luz'); const card = T.el.querySelector('.tour-card'); const a = tourAlvo(T.passos[T.i].s);
  T.el.classList.toggle('sem-alvo', !a); const W = innerWidth, H = innerHeight, cw = card.offsetWidth, ch = card.offsetHeight, m = 16;
  if (!a) { card.style.left = (W - cw) / 2 + 'px'; card.style.top = (H - ch) / 2 + 'px'; return; }
  const r = a.getBoundingClientRect(); const f = 6;
  Object.assign(luz.style, { left: r.left - f + 'px', top: r.top - f + 'px', width: r.width + f * 2 + 'px', height: r.height + f * 2 + 'px' });
  let x, y;
  if (r.right + 14 + cw <= W - m && r.left < W / 3) { x = r.right + 14; y = r.top + r.height / 2 - ch / 2; }
  else { x = r.left + r.width / 2 - cw / 2; y = r.bottom + 14 + ch <= H - m ? r.bottom + 14 : r.top - 14 - ch; }
  card.style.left = Math.max(m, Math.min(W - cw - m, x)) + 'px'; card.style.top = Math.max(m, Math.min(H - ch - m, y)) + 'px';
}
function tourFim() {
  const T = TOUR; if (!T) return; TOUR = null; removeEventListener('resize', T.pos); removeEventListener('scroll', T.pos, true); document.removeEventListener('keydown', T.tecla, true); T.el.remove();
}
