/* Tela de abertura "Seu universo financeiro": aparece uma vez por sessão, antes do painel, para quem tem patrimônio.
   No centro, um globo de pontos que gira sozinho e com o arraste (com inércia); os pontos se afastam do mouse e têm
   as cores da composição da carteira. Em volta, em camadas separadas: dividendos (micro pontos dourados), aportes de
   cada mês (losangos verdes numa órbita própria), as classes da carteira (orbs que pulsam, do tamanho da proporção) e
   os objetivos (cristais hexagonais em órbita, com o progresso na borda). Tocar em qualquer um abre o detalhe.
   Um "i" sobrevoa o globo e explica o que é cada coisa. O "Ao vivo" simula o rendimento do patrimônio a 12% ao ano
   desde as 6h da manhã (sem promessa de resultado). O título conversa com as mesmas frases da Visão geral.
   Tudo em canvas 2D, sem biblioteca. Com "reduzir movimento", o globo fica parado e o título não digita. */
'use strict';
const AB_TAXA = 0.12; // simulação do "Ao vivo": 12% ao ano
const AB_CORES = ['#4FC3FF', '#A082FF', '#28EBBE', '#FFC850', '#FF7A9A', '#7CF0A0'];
let AB = null;
const abHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const abCalmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// chamada a cada desenho do app: abre só uma vez por sessão, para quem tem patrimônio
function aberturaTalvez() {
  if (AB || S.screen !== 'app' || S.view !== 'geral' || !aberturaPode()) return;
  const op = abOpcoes(); if (!op.ligada) return;
  // "sessao": uma vez cada vez que o site é aberto; "dia": só na primeira entrada do dia
  const hoje = new Date().toDateString();
  try { if (sessionStorage.getItem('fp:abertura') || (op.quando === 'dia' && localStorage.getItem('fp:aberturaDia') === hoje)) return; } catch (e) { return; }
  try { sessionStorage.setItem('fp:abertura', '1'); localStorage.setItem('fp:aberturaDia', hoje); } catch (e) { /* ignora */ }
  abAbrir();
}

/* ---------- dados do cliente para a cena ---------- */
function abDados() {
  const C = S.C; const p = S.plan; const m = mesRef(); const pr = S.profile;
  let classes = [];
  try {
    if (temRecurso('carteira') && p.ativos.length) { const K = cartAnalise().K; if (K.total > 0) classes = K.classes.filter((c) => c.valor > 0).map((c) => ({ nome: c.classe, valor: c.valor, pct: c.atual / 100, alvo: K.somaAlvo > 0 ? c.alvo / 100 : null })); }
    if (!classes.length) { const comp = composicao(); const tot = comp.reduce((a, b) => a + b.value, 0); classes = comp.map((c) => ({ nome: c.label, valor: c.value, pct: tot > 0 ? c.value / tot : 0, alvo: null })); }
  } catch (e) { classes = []; }
  classes = classes.slice(0, 6).map((c, i) => Object.assign(c, { cor: AB_CORES[i % AB_CORES.length] }));
  const div = []; const apo = [];
  (p.ativos || []).forEach((a) => (a.pr || []).forEach((v, i) => { if (+v > 0) div.push({ ativo: a.nome, mes: i, valor: +v }); }));
  for (let i = 0; i < 12; i++) { const v = +C.aplicado[i] || 0; if (v > 0) { const top = (p.ativos || []).reduce((b, a) => ((+(a.ap || [])[i] || 0) > (b ? +(b.ap || [])[i] || 0 : 0) ? a : b), null); apo.push({ mes: i, valor: v, prov: (p.ativos || []).reduce((s, a) => s + (+(a.pr || [])[i] || 0), 0), ativo: top ? top.nome : '' }); } }
  let objs = [];
  try { const A = objAnalise(); objs = A.itens.slice(0, 5).map((g, i) => ({ nome: objNomeDe(g), progresso: g.progresso, status: g.status, saldo: g.saldo, valor: g.valor, previsto: g.previsto, ano: g.ano, cor: ['#F4C55A', '#FF8A5C', '#8B7BFF', '#5AD1E6', '#FF7A9A'][i % 5] })); } catch (e) { objs = []; }
  const nome = (pr.apelido || (pr.nome || '').split(' ')[0] || '').trim();
  const op = abOpcoes();
  return { op, patr: C.patrimonio[m], cresc: C.patrimonio[m] - C.patrimonioBase, ano: p.year, classes, div: op.dividendos ? div.slice(0, 140) : [], apo: op.aportes ? apo : [], objs: op.objetivos ? objs : [], nome, meta: metaDoAporte() };
}

/* ---------- montagem ---------- */
// a cena precisa de patrimônio para existir
const aberturaPode = () => !!(S.plan && S.C && temRecurso('patrimonio') && S.C.patrimonio[mesRef()] > 0);
const abOpcoes = () => Object.assign({}, ABERTURA_PADRAO, (S.profile && S.profile.abertura) || {});
function abAbrir() {
  const D = abDados(); const el = document.createElement('div'); el.className = 'ab'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Boas-vindas ao seu universo financeiro');
  el.innerHTML = `<canvas class="ab-cv" aria-hidden="true"></canvas>
    <div class="ab-marca">${logoMarca()}</div>
    <div class="ab-esq"><p class="ab-saud">${esc(saudacaoHora())}${D.nome ? ', ' + esc(D.nome) : ''}.</p>
      <h1 class="ab-tit" aria-live="polite"><span class="ab-tt"></span><span class="ab-cur" aria-hidden="true"></span></h1>
      <div class="ab-vivo"><span class="ab-pill"><i></i>Ao vivo</span><small class="ab-desde"></small><b class="ab-rend">R$ 0,00</b><em>Simulação com 12% ao ano. Sem promessa de resultado.</em></div></div>
    <div class="ab-card" hidden role="status"></div>
    <button class="ab-entrar" type="button">Entrar no meu painel<span aria-hidden="true">→</span></button>`;
  document.body.appendChild(el); document.documentElement.classList.add('sem-rolagem');
  const cv = el.querySelector('.ab-cv'); const ctx = cv.getContext('2d');
  AB = { el, cv, ctx, D, t0: performance.now(), rotY: 0.7, rotX: -0.28, vY: 0, vX: 0, arr: null, mouse: null, alvos: [], sel: null, raf: 0, calmo: abCalmo() };
  abPreparar(); abTamanho();
  AB.ro = new ResizeObserver(abTamanho); AB.ro.observe(el);
  if (!D.op.titulo) el.querySelector('.ab-tit').hidden = true; if (!D.op.vivo) el.querySelector('.ab-vivo').hidden = true;
  abEventos(); if (D.op.titulo) abTitulo(); if (D.op.vivo) abVivo();
  const b = el.querySelector('.ab-entrar'); b.addEventListener('click', abFechar); setTimeout(() => b.focus({ preventScroll: true }), 50);
  const quadro = (agora) => { if (!AB) return; abQuadro(agora); AB.raf = requestAnimationFrame(quadro); };
  AB.raf = requestAnimationFrame(quadro);
}
function abFechar() {
  if (!AB) return; const A = AB; AB = null; cancelAnimationFrame(A.raf); clearTimeout(A.tT); clearInterval(A.tV); A.ro.disconnect();
  document.removeEventListener('keydown', A.tecla, true);
  A.el.classList.add('saindo'); document.documentElement.classList.remove('sem-rolagem');
  setTimeout(() => A.el.remove(), abCalmo() ? 0 : 520);
}
function abTamanho() {
  if (!AB) return; const r = AB.el.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
  AB.W = r.width; AB.H = r.height; AB.cv.width = AB.W * dpr; AB.cv.height = AB.H * dpr; AB.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const estreito = AB.W < 760; AB.estreito = estreito;
  AB.cx = estreito ? AB.W * 0.5 : AB.W * 0.665; AB.cy = estreito ? AB.H * 0.47 : AB.H * 0.47; AB.R = Math.min(AB.W, AB.H) * (estreito ? 0.31 : 0.3);
  // a órbita dos objetivos não invade o texto da esquerda
  const viv = AB.el.querySelector('.ab-vivo'); const lim = estreito ? AB.W / 2 - 34 : AB.cx - viv.getBoundingClientRect().right - 40; AB.OA = Math.max(1.2, Math.min(estreito ? 1.42 : 1.6, lim / AB.R));
}
// pontos do globo, malha, anel, estrelas e as órbitas: calculados uma vez (vetores unitários)
function abPreparar() {
  const A = AB; let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; A.rnd = rnd;
  const N = matchMedia('(max-width: 760px)').matches ? 2600 : 4600; const cls = A.D.classes.length ? A.D.classes : [{ pct: 1, cor: '#4FC3FF' }];
  A.pts = []; for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const t = i * 2.39996; const u = (1 - y) / 2 + (rnd() - 0.5) * 0.06;
    let acc = 0; let cor = cls[cls.length - 1].cor; for (const c of cls) { acc += c.pct; if (u <= acc) { cor = c.cor; break; } }
    A.pts.push({ v: [Math.cos(t) * r, y, Math.sin(t) * r], c: abHex(cor) });
  }
  A.malha = []; for (let mm = 0; mm < 12; mm++) { const lo = (mm / 12) * Math.PI * 2; const L = []; for (let k = 0; k <= 40; k++) { const la = -Math.PI / 2 + (k / 40) * Math.PI; L.push([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]); } A.malha.push(L); }
  for (let k = 1; k < 9; k++) { const la = -Math.PI / 2 + (k / 9) * Math.PI; const L = []; for (let j = 0; j <= 60; j++) { const lo = (j / 60) * Math.PI * 2; L.push([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]); } A.malha.push(L); }
  A.anel = []; for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2; const rr = 1.18 + rnd() * 0.16; A.anel.push({ a, rr, b: 0.15 + rnd() * 0.35 }); }
  A.estrelas = []; for (let i = 0; i < 260; i++) A.estrelas.push([rnd(), rnd(), rnd() * 1.2 + 0.2, 0.12 + rnd() * 0.5]);
  A.div = A.D.div.map((d) => ({ d, inc: (rnd() - 0.5) * 2.4, fase: rnd() * Math.PI * 2, rr: 1.07 + rnd() * 0.1, vel: 0.08 + rnd() * 0.1, gir: rnd() * 6 }));
  A.nos = !A.D.op.classes ? [] : A.D.classes.map((c, i, arr) => { const n = arr.length; const la = Math.asin(1 - (2 * (i + 0.5)) / n) * 0.85; return { c, la, lo: i * 2.4 + 0.4 }; });
}

/* ---------- geometria ---------- */
function abProj(v) { const A = AB; const cY = Math.cos(A.rotY), sY = Math.sin(A.rotY), cX = Math.cos(A.rotX), sX = Math.sin(A.rotX);
  const x2 = v[0] * cY - v[2] * sY, z2 = v[0] * sY + v[2] * cY; const y2 = v[1] * cX - z2 * sX, z3 = v[1] * sX + z2 * cX; return [A.cx + x2 * A.R, A.cy + y2 * A.R, z3]; }
const abRot = (v, ax, ay) => { let [x, y, z] = v; const c1 = Math.cos(ax), s1 = Math.sin(ax); [y, z] = [y * c1 - z * s1, y * s1 + z * c1]; const c2 = Math.cos(ay), s2 = Math.sin(ay); [x, z] = [x * c2 - z * s2, x * s2 + z * c2]; return [x, y, z]; };
// órbita dos objetivos: elipse fixa na tela (não gira com o globo), como planetas em volta
function abOrbita(ang) { const A = AB; const OA = A.OA, OB = 0.46, ROT = -0.2; const ox = Math.cos(ang) * A.R * OA, oy = Math.sin(ang) * A.R * OB;
  return { x: A.cx + ox * Math.cos(ROT) - oy * Math.sin(ROT), y: A.cy + A.R * 0.06 + ox * Math.sin(ROT) + oy * Math.cos(ROT), frente: Math.sin(ang) > 0 }; }

/* ---------- desenho ---------- */
function abQuadro(agora) {
  const A = AB; const ctx = A.ctx; const W = A.W, H = A.H, cx = A.cx, cy = A.cy, R = A.R; const t = A.calmo ? 0 : (agora - A.t0) / 1000;
  const entra = A.calmo ? 1 : Math.min(1, (agora - A.t0) / 1800); const e = 1 - Math.pow(1 - entra, 3);
  // giro: sozinho devagar, arraste com inércia
  if (!A.arr) { A.rotY += (A.calmo ? 0 : 0.0018) + A.vY; A.rotX = Math.max(-1.1, Math.min(1.1, A.rotX + A.vX)); A.vY *= 0.95; A.vX *= 0.95; }
  A.alvos = []; ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  A.estrelas.forEach(([x, y, r, al], i) => { ctx.fillStyle = `rgba(200,220,255,${al * (0.75 + 0.25 * Math.sin(t * 1.3 + i))})`; ctx.fillRect(x * W, y * H, r, r); });
  let g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.75); g.addColorStop(0, 'rgba(79,195,255,.28)'); g.addColorStop(0.45, 'rgba(79,140,255,.09)'); g.addColorStop(1, 'rgba(79,140,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.75, 0, 7); ctx.fill();
  g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.05, cx, cy, R); g.addColorStop(0, 'rgba(120,200,255,.3)'); g.addColorStop(0.55, 'rgba(40,80,170,.2)'); g.addColorStop(1, 'rgba(10,20,50,.5)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * e, 0, 7); ctx.fill();
  // objetivos (atrás)
  const ob = A.D.objs.map((o, i, arr) => Object.assign({ o }, abOrbita((i / arr.length) * Math.PI * 2 + 0.5 + t * 0.06)));
  abElipse(false); ob.filter((p) => !p.frente).forEach((p) => abCristal(p, t));
  // camadas de trás
  const anel = A.anel.map((q) => abProj(abRot([Math.cos(q.a + t * 0.05) * q.rr, 0, Math.sin(q.a + t * 0.05) * q.rr], 0.42, 0)));
  const div = A.div.map((q) => ({ q, p: abProj(abRot([Math.cos(q.fase + t * q.vel) * q.rr, 0, Math.sin(q.fase + t * q.vel) * q.rr], q.inc, q.gir)) }));
  const apo = A.D.apo.map((a, i, arr) => ({ a, p: abProj(abRot([Math.cos((i / arr.length) * Math.PI * 2 + t * 0.12) * 1.3, 0, Math.sin((i / arr.length) * Math.PI * 2 + t * 0.12) * 1.3], 0.95, 0.4)) }));
  ctx.globalCompositeOperation = 'lighter';
  anel.forEach((q, i) => { if (q[2] < 0) { ctx.fillStyle = `rgba(150,200,255,${A.anel[i].b * 0.7})`; ctx.fillRect(q[0], q[1], 1.2, 1.2); } });
  abTrilha(false, t); div.forEach((d) => { if (d.p[2] < 0) abDiv(d, false); }); apo.forEach((a) => { if (a.p[2] < 0) abLosango(a, false); });
  // malha
  ctx.lineWidth = 1; A.malha.forEach((L) => { let ant = null; L.forEach((v) => { const p = abProj(v); if (ant) { const prof = (p[2] + ant[2]) / 2; if (prof > -0.05) { ctx.strokeStyle = `rgba(120,190,255,${0.2 * (0.25 + prof * 0.75) * e})`; ctx.beginPath(); ctx.moveTo(ant[0], ant[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } } ant = p; }); });
  // pontos do globo (entram espalhados e se juntam; afastam-se do mouse)
  const mx = A.mouse ? A.mouse[0] : -9999, my = A.mouse ? A.mouse[1] : -9999;
  A.pts.forEach((pt, i) => {
    let [sx, sy, z] = abProj(pt.v); if (e < 1) { const k = (1 - e) * (1.6 + (i % 7) * 0.35); sx = cx + (sx - cx) * (1 + k); sy = cy + (sy - cy) * (1 + k); }
    let realce = 0; if (z > 0) { const dx = sx - mx, dy = sy - my, d = Math.hypot(dx, dy); if (d < 110) { const f = (110 - d) / 110; sx += (dx / (d || 1)) * f * 30; sy += (dy / (d || 1)) * f * 30; realce = f; } }
    const prof = (z + 1) / 2; const tam = (0.5 + prof * 2.1) * (1 + realce * 0.8); const al = Math.min(1, (0.06 + prof * 0.85) * (1 + realce)) * e;
    ctx.fillStyle = `rgba(${pt.c[0]},${pt.c[1]},${pt.c[2]},${al})`; ctx.fillRect(sx - tam / 2, sy - tam / 2, tam, tam);
  });
  // classes da carteira: orbs que pulsam na superfície, do tamanho da proporção
  A.nos.forEach((n) => { const p = abProj([Math.cos(n.la) * Math.cos(n.lo), Math.sin(n.la), Math.cos(n.la) * Math.sin(n.lo)]); if (p[2] < -0.15) return;
    const c = abHex(n.c.cor); const rr = (6 + Math.sqrt(n.c.pct * 100) * 3) * (0.75 + (p[2] + 1) * 0.15); const pulso = 1 + 0.08 * Math.sin(t * 2.4 + n.lo);
    ctx.fillStyle = `rgba(${c},.2)`; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2.4 * pulso, 0, 7); ctx.fill();
    [1.35, 1.75, 2.2].forEach((k, j) => { const fase = (t * 0.6 + j / 3) % 1; ctx.strokeStyle = `rgba(${c},${(0.55 - j * 0.12) * (1 - fase * 0.6)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p[0], p[1], rr * (k + fase * 0.4), 0, 7); ctx.stroke(); });
    const gg = ctx.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.4, rr * 0.1, p[0], p[1], rr); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(0.35, n.c.cor); gg.addColorStop(1, `rgba(${c},.45)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], rr * pulso, 0, 7); ctx.fill();
    A.alvos.push({ x: p[0], y: p[1], r: Math.max(16, rr * 1.6), tipo: 'classe', d: n.c });
  });
  // camadas da frente
  anel.forEach((q, i) => { if (q[2] >= 0) { ctx.fillStyle = `rgba(170,215,255,${A.anel[i].b})`; ctx.fillRect(q[0], q[1], 1.4, 1.4); } });
  ctx.globalCompositeOperation = 'source-over';
  abTrilha(true, t); div.forEach((d) => { if (d.p[2] >= 0) abDiv(d, true); }); apo.forEach((a) => { if (a.p[2] >= 0) abLosango(a, true); });
  ctx.strokeStyle = 'rgba(120,200,255,.5)'; ctx.lineWidth = 2; ctx.shadowColor = '#4FC3FF'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(cx, cy, R * 1.005 * e, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
  // valor no centro
  ctx.textAlign = 'center'; ctx.globalAlpha = e; ctx.fillStyle = 'rgba(210,225,248,.92)'; ctx.font = `600 ${Math.max(11, Math.round(R * 0.06))}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText('Seu patrimônio', cx, cy - R * 0.08);
  ctx.shadowColor = 'rgba(79,195,255,1)'; ctx.shadowBlur = 28; ctx.fillStyle = '#FFFFFF'; ctx.font = `780 ${Math.round(R * 0.2)}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(brl0(A.D.patr), cx, cy + R * 0.11); ctx.shadowBlur = 0;
  if (Math.abs(A.D.cresc) >= 1) { ctx.fillStyle = A.D.cresc > 0 ? '#3EE08A' : '#FF7A8A'; ctx.font = `650 ${Math.max(10.5, Math.round(R * 0.058))}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillText(`${A.D.cresc > 0 ? '+' : '−'} ${brl0(Math.abs(A.D.cresc))} em ${A.D.ano}`, cx, cy + R * 0.22); }
  ctx.globalAlpha = 1;
  // objetivos (frente) e as etiquetas
  abElipse(true); ob.filter((p) => p.frente).forEach((p) => abCristal(p, t));
  if (A.D.op.info) abInfo(t);
  if (A.sel) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.sel.x, A.sel.y, A.sel.r + 4, 0, 7); ctx.stroke(); }
}
function abElipse(frente) { const A = AB; const ctx = A.ctx; const OA = A.OA; ctx.save(); ctx.translate(A.cx, A.cy + A.R * 0.06); ctx.rotate(-0.2); ctx.strokeStyle = 'rgba(140,190,255,.3)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 6]);
  ctx.beginPath(); ctx.ellipse(0, 0, A.R * OA, A.R * 0.46, 0, frente ? 0 : Math.PI, frente ? Math.PI : Math.PI * 2); ctx.stroke(); ctx.restore(); }
function abTrilha(frente, t) { const A = AB; const ctx = A.ctx; if (!A.D.apo.length) return; ctx.strokeStyle = frente ? 'rgba(62,224,138,.42)' : 'rgba(62,224,138,.14)'; ctx.lineWidth = 1.2; ctx.setLineDash([1, 5]);
  let ant = null; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; const p = abProj(abRot([Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3], 0.95, 0.4)); if (ant && (p[2] >= 0) === frente) { ctx.beginPath(); ctx.moveTo(ant[0], ant[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } ant = p; }
  ctx.setLineDash([]); }
function abDiv(d, frente) { const A = AB; const ctx = A.ctx; const prof = (d.p[2] + 1) / 2; const r = 1.3 + prof * 1.6; ctx.fillStyle = `rgba(255,205,90,${0.3 + prof * 0.7})`;
  if (frente) { ctx.shadowColor = '#FFC94A'; ctx.shadowBlur = 8; } ctx.beginPath(); ctx.arc(d.p[0], d.p[1], r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  if (frente) A.alvos.push({ x: d.p[0], y: d.p[1], r: 9, tipo: 'div', d: d.q.d }); }
function abLosango(a, frente) { const A = AB; const ctx = A.ctx; const prof = (a.p[2] + 1) / 2; const tam = 8 + prof * 7; const al = 0.35 + prof * 0.65;
  ctx.save(); ctx.translate(a.p[0], a.p[1]); ctx.rotate(Math.PI / 4); ctx.fillStyle = `rgba(62,224,138,${al})`; if (frente) { ctx.shadowColor = '#3EE08A'; ctx.shadowBlur = 14; } ctx.fillRect(-tam / 2, -tam / 2, tam, tam); ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(220,255,235,${al})`; ctx.lineWidth = 1.3; ctx.strokeRect(-tam / 2, -tam / 2, tam, tam); ctx.restore();
  if (frente) A.alvos.push({ x: a.p[0], y: a.p[1], r: 14, tipo: 'aporte', d: a.a }); }
const abHexPts = (x, y, rr, gir) => Array.from({ length: 6 }, (_, i) => [x + Math.cos(gir + (i * Math.PI) / 3) * rr, y + Math.sin(gir + (i * Math.PI) / 3) * rr]);
const abHexPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };
// objetivo: cristal hexagonal com facetas, anéis em hexágono pulsando e o progresso desenhado na borda
function abCristal(p, t) {
  const A = AB; const ctx = A.ctx; const o = p.o; const rr = (A.estreito ? 15 : 22) * (p.frente ? 1 : 0.8); const pct = o.status === 'concluido' ? 1 : Math.max(0, Math.min(1, o.progresso || 0)); const al = p.frente ? 1 : 0.6;
  ctx.globalAlpha = al; let gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 3); gg.addColorStop(0, o.cor + '77'); gg.addColorStop(1, o.cor + '00'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 3, 0, 7); ctx.fill();
  [1.55, 1.95, 2.4].forEach((k, j) => { const fase = (t * 0.5 + j / 3) % 1; ctx.strokeStyle = o.cor; ctx.globalAlpha = al * (0.5 - j * 0.14) * (1 - fase * 0.5); ctx.lineWidth = 1.3; abHexPath(ctx, abHexPts(p.x, p.y, rr * (k + fase * 0.3), Math.PI / 6)); ctx.stroke(); });
  const Hx = abHexPts(p.x, p.y, rr, Math.PI / 6 + t * 0.15); ctx.shadowColor = o.cor; ctx.shadowBlur = 22;
  Hx.forEach((q, i) => { const q2 = Hx[(i + 1) % 6]; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q[0], q[1]); ctx.lineTo(q2[0], q2[1]); ctx.closePath(); ctx.fillStyle = o.cor; ctx.globalAlpha = al * [0.95, 0.75, 0.45, 0.3, 0.5, 0.8][i]; ctx.fill(); });
  ctx.shadowBlur = 0; ctx.globalAlpha = al; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; abHexPath(ctx, Hx); ctx.stroke();
  gg = ctx.createRadialGradient(p.x - rr * 0.3, p.y - rr * 0.35, 0, p.x - rr * 0.3, p.y - rr * 0.35, rr * 0.7); gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; abHexPath(ctx, Hx); ctx.fill();
  const anel = abHexPts(p.x, p.y, rr * 1.32, -Math.PI / 2); const lados = 6 * pct; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 3; abHexPath(ctx, anel); ctx.stroke();
  if (lados > 0) { ctx.strokeStyle = o.cor; ctx.beginPath(); ctx.moveTo(anel[0][0], anel[0][1]); for (let i = 0; i < Math.floor(lados); i++) { const q = anel[(i + 1) % 6]; ctx.lineTo(q[0], q[1]); }
    const resto = lados - Math.floor(lados); if (resto > 0 && lados < 6) { const a = anel[Math.floor(lados) % 6], b = anel[(Math.floor(lados) + 1) % 6]; ctx.lineTo(a[0] + (b[0] - a[0]) * resto, a[1] + (b[1] - a[1]) * resto); } ctx.stroke(); }
  ctx.globalAlpha = 1; A.alvos.push({ x: p.x, y: p.y, r: rr * 1.6, tipo: 'objetivo', d: o });
}
// "i" sobrevoando o globo
function abInfo(t) { const A = AB; const ctx = A.ctx; const ang = -2.25 + t * 0.18; const raio = A.R * 1.22;
  for (let k = 1; k <= 14; k++) { const a = ang - k * 0.035; ctx.fillStyle = `rgba(200,230,255,${0.5 - k * 0.033})`; ctx.beginPath(); ctx.arc(A.cx + Math.cos(a) * raio, A.cy + Math.sin(a) * raio, 2.4 - k * 0.12, 0, 7); ctx.fill(); }
  const x = A.cx + Math.cos(ang) * raio, y = A.cy + Math.sin(ang) * raio; ctx.shadowColor = '#9FD6FF'; ctx.shadowBlur = 18; ctx.fillStyle = 'rgba(16,30,64,.92)'; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(190,225,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#EEF3FF'; ctx.font = 'italic 700 17px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('i', x, y + 6);
  A.alvos.push({ x, y, r: 20, tipo: 'info' }); }

/* ---------- interação: arrastar, mouse, tocar para ver o detalhe ---------- */
function abEventos() {
  const A = AB; const cv = A.cv; let ini = null; let andou = 0;
  cv.addEventListener('pointerdown', (e) => { ini = [e.clientX, e.clientY]; andou = 0; A.arr = [e.clientX, e.clientY]; A.vY = A.vX = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect(); A.mouse = [e.clientX - r.left, e.clientY - r.top];
    if (A.arr) { const dx = e.clientX - A.arr[0], dy = e.clientY - A.arr[1]; andou += Math.abs(dx) + Math.abs(dy); A.rotY += dx * 0.006; A.rotX = Math.max(-1.1, Math.min(1.1, A.rotX + dy * 0.004)); A.vY = dx * 0.0016; A.vX = dy * 0.001; A.arr = [e.clientX, e.clientY]; }
    else cv.style.cursor = abAlvo(A.mouse) ? 'pointer' : 'grab';
  });
  const soltar = (e) => { if (!A.arr) return; A.arr = null; if (andou < 6 && ini) { const r = cv.getBoundingClientRect(); abTocar([e.clientX - r.left, e.clientY - r.top]); } ini = null; };
  cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', () => { A.arr = null; });
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') A.mouse = null; });
  A.tecla = (e) => { if (!AB) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!A.el.querySelector('.ab-card').hidden) abCard(null); else abFechar(); } };
  document.addEventListener('keydown', A.tecla, true);
}
const abAlvo = (pt) => { const A = AB; let melhor = null; let dmin = 1e9; A.alvos.forEach((a) => { const d = Math.hypot(a.x - pt[0], a.y - pt[1]); if (d <= a.r && d < dmin) { dmin = d; melhor = a; } }); return melhor; };
function abTocar(pt) { const a = abAlvo(pt); AB.sel = a; abCard(a); }
function abCard(a) {
  const A = AB; const el = A.el.querySelector('.ab-card'); if (!a) { el.hidden = true; A.sel = null; return; }
  const d = a.d; const mes = (i) => MES_LONGO[i].replace(/^./, (c) => c.toUpperCase()); let cor = '#9FD6FF'; let h = '';
  if (a.tipo === 'classe') { cor = d.cor; h = `<small>Investimento</small><b>${esc(d.nome)}</b><span class="ab-v">${brl0(d.valor)}</span><span>${pct(d.pct)} da carteira${d.alvo != null ? ` · alvo ${pct(d.alvo)}` : ''}</span>`; }
  else if (a.tipo === 'aporte') { cor = '#3EE08A'; h = `<small>◆ Aporte de ${esc(MES_LONGO[d.mes])}</small><b class="ab-v">${brl0(d.valor)}</b>${d.ativo ? `<span>Principal destino: ${esc(d.ativo)}</span>` : ''}${A.D.meta > 0 ? `<span>${d.valor + d.prov >= A.D.meta - 0.5 ? 'Na meta mensal' : 'Meta mensal de ' + brl0(A.D.meta)}</span>` : ''}`; }
  else if (a.tipo === 'div') { cor = '#FFC850'; h = `<small>● Dividendo</small><b class="ab-v">${brl0(d.valor)}</b><span>${esc(d.ativo)} · ${esc(mes(d.mes))}</span>`; }
  else if (a.tipo === 'objetivo') { cor = d.cor; const ok = d.status === 'concluido'; h = `<small>Objetivo</small><b>${esc(d.nome)}</b><span class="ab-v">${brl0(d.saldo)} <em>de ${brl0(d.valor)}</em></span><span>${ok ? 'Conquistado' : pct(d.progresso) + ' do caminho'}${!ok && d.previsto ? ` · previsto para ${esc(MES_LONGO[d.previsto.mes])} de ${d.previsto.ano}` : ''}</span>`; }
  else if (a.tipo === 'info') { h = `<small>O que você está vendo</small><ul class="ab-leg"><li><i style="background:#4FC3FF"></i>O globo é o seu patrimônio; as cores são as classes da carteira.</li>${A.D.op.classes ? '<li><i class="o"></i>Orbs que pulsam: cada classe, do tamanho da proporção.</li>' : ''}${A.D.apo.length ? '<li><i class="l"></i>Losangos verdes: os aportes de cada mês.</li>' : ''}${A.D.div.length ? '<li><i style="background:#FFC850"></i>Pontinhos dourados: cada dividendo recebido.</li>' : ''}${A.D.objs.length ? '<li><i class="h"></i>Cristais em órbita: os seus objetivos. Toque para ver o nome e o progresso.</li>' : ''}</ul><span>Arraste para girar. Toque em qualquer ponto para ver o detalhe.</span>`; }
  el.style.setProperty('--ab-cor', cor); el.innerHTML = `<button class="ab-x" type="button" aria-label="Fechar">×</button>${h}`; el.hidden = false;
  el.querySelector('.ab-x').addEventListener('click', () => abCard(null));
  const w = el.offsetWidth, hh = el.offsetHeight; let x = a.x + 24, y = a.y - hh / 2; if (x + w > A.W - 16) x = a.x - w - 24; x = Math.max(16, Math.min(A.W - w - 16, x)); y = Math.max(16, Math.min(A.H - hh - 90, y));
  el.style.left = x + 'px'; el.style.top = y + 'px';
}

/* ---------- conversa no título e o "Ao vivo" ---------- */
function abTitulo() {
  const A = AB; const alvo = A.el.querySelector('.ab-tt'); const h = A.el.querySelector('.ab-tit'); let L = [];
  // as frases da Visão geral, em ordem sorteada pelo peso de cada situação (as mais relevantes tendem a vir antes)
  try { L = tituloLista().map((c) => ({ f: c.f, k: Math.pow(Math.random(), 1 / Math.max(0.01, (c.p || 1) * (c.p || 1))) })).sort((a, b) => b.k - a.k).map((c) => c.f).filter((f, j, arr) => arr.indexOf(f) === j).slice(0, 12); } catch (e) { L = []; } if (!L.length) L = [voz('titulo', { ano: S.plan.year })];
  let i = 0; let atual = L[0];
  if (A.calmo) { alvo.textContent = atual; h.setAttribute('aria-label', atual); A.el.querySelector('.ab-cur').style.display = 'none'; return; }
  const depois = (fn, ms) => { A.tT = setTimeout(() => { if (AB === A) fn(); }, ms); };
  const digitar = (f, k) => { alvo.textContent = f.slice(0, k + 1); if (k + 1 < f.length) depois(() => digitar(f, k + 1), (/[,.:!?]/.test(f[k]) ? 180 : f[k] === ' ' ? 65 : 32) + Math.random() * 40); else { h.setAttribute('aria-label', f); depois(apagar, 5200); } };
  const apagar = () => { const tx = alvo.textContent; if (tx.length) { alvo.textContent = tx.slice(0, -1); depois(apagar, 15 + Math.random() * 15); } else { i = (i + 1) % L.length; atual = L[i] === atual && L.length > 1 ? L[(i + 1) % L.length] : L[i]; depois(() => digitar(atual, 0), 300); } };
  depois(() => digitar(atual, 0), 500);
}
// rendimento simulado a 12% ao ano, desde as 6h de hoje (antes das 6h, desde as 6h de ontem)
function abVivo() {
  const A = AB; const b = A.el.querySelector('.ab-rend'); const desde = A.el.querySelector('.ab-desde');
  const agora0 = new Date(); const ini = new Date(agora0); ini.setHours(6, 0, 0, 0); const ontem = agora0 < ini; if (ontem) ini.setDate(ini.getDate() - 1);
  desde.textContent = `Desde as 6h de ${ontem ? 'ontem' : 'hoje'}, seu patrimônio rendeu`;
  const conta = () => { if (oculto()) { b.textContent = 'R$ •••'; return; } const s = (Date.now() - ini.getTime()) / 1000; const v = A.D.patr * (Math.pow(1 + AB_TAXA, s / 31557600) - 1);
    const [int, dec] = v.toFixed(4).split('.'); b.innerHTML = `R$ ${(+int).toLocaleString('pt-BR')},${dec.slice(0, 2)}<span>${dec.slice(2)}</span>`; };
  conta(); A.tV = setInterval(conta, 80);
}

/* ---------- Painel › Personalizar o painel › Tela de abertura ---------- */
const AB_CAMADAS = [
  ['titulo', 'Conversa no título', 'Frases sobre o seu momento, digitadas na hora.'],
  ['vivo', 'Ao vivo', 'Quanto o patrimônio renderia desde as 6h, numa simulação de 12% ao ano.'],
  ['classes', 'Investimentos', 'Orbs que pulsam, uma por classe da carteira, do tamanho da proporção.'],
  ['objetivos', 'Objetivos', 'Cristais em órbita; o nome e o progresso aparecem ao tocar.'],
  ['aportes', 'Aportes', 'Losangos verdes, um por mês com aporte.'],
  ['dividendos', 'Dividendos', 'Pontinhos dourados, um por dividendo recebido.'],
  ['info', 'Ícone de ajuda', 'O "i" que sobrevoa o globo e explica cada símbolo.'],
];
function aberturaAdmHtml() {
  const op = abOpcoes(); const pode = aberturaPode();
  const quando = [['sessao', 'Toda vez que entrar'], ['dia', 'Uma vez por dia']].map(([v, l]) => `<button class="${op.quando === v ? 'on' : ''}" data-act="ab-quando" data-v="${v}" aria-pressed="${op.quando === v}">${l}</button>`).join('');
  return `<section class="dr-sec"><h3>Tela de abertura</h3><p class="mmsg">O seu universo financeiro antes do painel: o globo do patrimônio e, em volta, o que você escolher.</p>
    <label class="chk"><input type="checkbox" data-abf="ligada" ${op.ligada ? 'checked' : ''}><span><b>Mostrar ao entrar</b><small>${pode ? 'Aparece antes da Visão geral.' : 'Aparece quando houver patrimônio registrado.'}</small></span></label>
    <div class="dr-sub"><h4>Quando aparece</h4><div class="seg" role="group" aria-label="Quando a tela de abertura aparece">${quando}</div></div>
    <div class="dr-sub"><h4>O que aparece</h4><div class="abas">${AB_CAMADAS.map(([k, l, d]) => `<label class="chk aba"><input type="checkbox" data-abf="${k}" ${op[k] ? 'checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div></div>
    <div class="btn-row"><button class="btn" data-act="ab-ver" ${pode ? '' : 'disabled'}>Ver a tela agora</button></div></section>`;
}
function aberturaCampo(t) { S.profile.abertura = Object.assign(abOpcoes(), { [t.dataset.abf]: t.checked }); touch('profile'); }
function aberturaQuando(v, btn) {
  S.profile.abertura = Object.assign(abOpcoes(), { quando: v === 'dia' ? 'dia' : 'sessao' }); touch('profile');
  btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S.profile.abertura.quando; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
// prévia pelo painel: fecha o painel (um <dialog> aberto ficaria por cima) e abre a cena com as escolhas atuais
function aberturaVer() { if (AB || !aberturaPode()) return; closeAdmin(); if (S.view !== 'geral') { S.view = 'geral'; render(); } abAbrir(); }
