/* Tela de abertura "Seu universo financeiro": aparece uma vez por sessão, antes do painel, para quem tem patrimônio.
   No centro, um globo de pontos que gira sozinho e com o arraste (com inércia); os pontos se afastam do mouse e têm
   as cores da composição da carteira. Em volta, em camadas separadas: dividendos (micro pontos dourados), aportes de
   cada mês (losangos verdes numa órbita própria), as classes da carteira (orbs que pulsam, do tamanho da proporção) e
   os objetivos (cristais hexagonais em órbita, com o progresso na borda). Tocar em qualquer um abre o detalhe.
   Um "i" sobrevoa o globo e explica o que é cada coisa. O "Ao vivo" simula o rendimento do patrimônio a 12% ao ano
   desde as 6h da manhã (sem promessa de resultado). O título conversa com as mesmas frases da Visão geral.
   Tudo em canvas 2D, sem biblioteca. As cores vêm do tema (fundo, destaque e a paleta --c1…--c6), claro ou escuro.
   Tocar em algo (ou parar o mouse em cima) prende só aquele item no lugar, com o resto girando; ao soltar, ele volta
   deslizando para a órbita. Zoom pela roda do mouse, pinça, toque duplo, botões + e − e "Aproximar" no detalhe.
   Com "reduzir movimento", o globo fica parado e o título não digita. */
'use strict';
const AB_TAXA = 0.12; // simulação do "Ao vivo": 12% ao ano
let AB = null;
const abRgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
// lê um token do tema já resolvido em [r, g, b] (color-mix chega como "color(srgb …)")
function abCorToken(el, nome) {
  const s = document.createElement('i'); s.style.color = `var(${nome})`; el.appendChild(s); const v = getComputedStyle(s).color; s.remove();
  const n = (v.match(/[\d.]+/g) || ['0', '0', '0']).map(Number); return /^color\(/.test(v) ? n.slice(0, 3).map((x) => Math.round(x * 255)) : n.slice(0, 3);
}
// paleta da cena a partir do tema atual
function abTema() {
  const A = AB; const k = (n) => abCorToken(A.el, n); const bg = k('--bg');
  const escuro = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 < 0.45;
  const acc = k('--accent'); const acc2 = k('--accent-2'); const cls0 = ['--c1', '--c2', '--c3', '--c4', '--c6', '--c5'].map(k); const branco = [255, 255, 255];
  // no claro, as cores da cena saem todas da cor de destaque (tons vizinhos no círculo de cores, mesma saturação e luz):
  // o globo é uma joia na cor de destaque e tudo em volta conversa com ela; só os dividendos guardam o dourado, de contraponto
  const viz = (d, l) => abDeHsl(abHsl(acc)[0] + d, 0.7, l == null ? 0.52 : l);
  const cls = escuro ? cls0 : [0, 32, -32, 64, -64, 96].map((d) => viz(d));
  A.T = { escuro, bg, ink: k('--ink'), ink2: k('--ink-2'), acc, acc2, pos: escuro ? k('--pos') : viz(-60, 0.42), neg: k('--neg'), ouro: escuro ? k('--c4') : [226, 160, 40], cls,
    obj: escuro ? ['--c4', '--c6', '--c2', '--c3', '--c1'].map(k) : [48, -48, 96, -96, 0].map((d) => viz(d, 0.5)),
    luz: escuro ? branco : k('--surface'), // brilho e contorno: branco no escuro, superfície no claro
    soma: escuro ? 'lighter' : 'screen', // luz que soma no escuro; no claro, "screen" clareia sobre a esfera colorida sem estourar
    // no claro o globo vira uma joia: esfera saturada na cor de destaque, com pontos quase brancos (um toque do tom de cada classe) e textos claros
    esfera: escuro ? null : { brilho: abMix(acc, branco, 0.55), meio: acc, borda: abMix(acc2, [0, 0, 0], 0.35) },
    pts: escuro ? cls : cls.map((c) => abMix(c, branco, 0.7)),
    poeira: escuro ? null : [acc, acc2, viz(32, 0.6), viz(-32, 0.6)],
    texto: escuro ? k('--ink') : branco, texto2: escuro ? k('--ink-2') : abMix(acc, branco, 0.85), sobe: escuro ? k('--pos') : abMix(k('--pos'), branco, 0.74) };
}
// conversão de cor para matiz/saturação/luz e de volta (para a paleta do tema claro)
function abHsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)); const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; }
function abDeHsl(h, s, l) { h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r, g, b].map((v) => Math.round((v + m) * 255)); }
const abMix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
// desempenho: cores em texto ficam guardadas por cor e transparência (128 níveis, abaixo do que a tela distingue),
// em vez de montar uma string por ponto a cada quadro; o cache zera quando o tema muda
const AB_NIV = 128;
function abEstilo(c, a) {
  const A = AB; const n = Math.max(0, Math.min(AB_NIV, Math.round(a * AB_NIV))); const ch = c.join(',') + '|' + n;
  let s = A.estilos.get(ch); if (!s) { s = abRgba(c, n / AB_NIV); A.estilos.set(ch, s); } return s;
}
const abCalmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// valores na cena: o globo tem o próprio olhinho (AB.oc), que começa como o cliente escolheu no painel
const abOc = () => !!(AB && AB.oc);
const abR = (v) => (abOc() ? 'R$ ' + MASCARA : bf0.format(Math.abs(v) < 0.5 ? 0 : v));
// mês mostrado: o atual no ano corrente; nos outros anos, dezembro (o fim do ano, realizado ou previsto)
const abMesDe = (y) => (y === NOW_Y ? NOW_M : 11);
// anos que têm globo (com patrimônio no mês mostrado)
function abAnos() {
  if (!temRecurso('patrimonio')) return [];
  return Object.keys(S.plans).map(Number).sort((a, b) => a - b).filter((y) => { try { const C = y === S.year && S.C ? S.C : E.compute(S.plans[y], planCtx(y)); return C.patrimonio[abMesDe(y)] > 0; } catch (e) { return false; } });
}

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
  const C = S.C; const p = S.plan; const m = abMesDe(p.year); const pr = S.profile;
  let classes = [];
  try {
    if (temRecurso('carteira') && p.ativos.length) { const K = cartAnalise().K; if (K.total > 0) classes = K.classes.filter((c) => c.valor > 0).map((c) => ({ nome: c.classe, valor: c.valor, pct: c.atual / 100, alvo: K.somaAlvo > 0 ? c.alvo / 100 : null })); }
    if (!classes.length) { const comp = composicao(); const tot = comp.reduce((a, b) => a + b.value, 0); classes = comp.map((c) => ({ nome: c.label, valor: c.value, pct: tot > 0 ? c.value / tot : 0, alvo: null })); }
  } catch (e) { classes = []; }
  classes = classes.slice(0, 6).map((c, i) => Object.assign(c, { k: i }));
  const div = []; const apo = [];
  (p.ativos || []).forEach((a) => (a.pr || []).forEach((v, i) => { if (+v > 0) div.push({ ativo: a.nome, mes: i, valor: +v }); }));
  for (let i = 0; i < 12; i++) { const v = +C.aplicado[i] || 0; if (v > 0) { const top = (p.ativos || []).reduce((b, a) => ((+(a.ap || [])[i] || 0) > (b ? +(b.ap || [])[i] || 0 : 0) ? a : b), null); apo.push({ mes: i, valor: v, prov: (p.ativos || []).reduce((s, a) => s + (+(a.pr || [])[i] || 0), 0), ativo: top ? top.nome : '' }); } }
  let objs = [];
  try { const A = objAnalise(); objs = A.itens.slice(0, 5).map((g, i) => ({ nome: objNomeDe(g), progresso: g.progresso, status: g.status, saldo: g.saldo, valor: g.valor, previsto: g.previsto, ano: g.ano, k: i % 5 })); } catch (e) { objs = []; }
  const nome = (pr.apelido || (pr.nome || '').split(' ')[0] || '').trim();
  const op = abOpcoes();
  const rotulo = p.year === NOW_Y ? 'Seu patrimônio' : p.year < NOW_Y ? `Patrimônio em dez. de ${p.year}` : `Previsto para dez. de ${p.year}`;
  return { op, rotulo, vivo: op.vivo && p.year === NOW_Y, patr: C.patrimonio[m], cresc: C.patrimonio[m] - C.patrimonioBase, ano: p.year, classes, div: op.dividendos ? div.slice(0, 140) : [], apo: op.aportes ? apo : [], objs: op.objetivos ? objs : [], nome, meta: metaDoAporte() };
}

/* ---------- montagem ---------- */
// a cena precisa de patrimônio para existir
const aberturaPode = () => !!(S.plan && S.C && temRecurso('patrimonio') && S.C.patrimonio[abMesDe(S.plan.year)] > 0);
const abOpcoes = () => Object.assign({}, ABERTURA_PADRAO, (S.profile && S.profile.abertura) || {});
function abAbrir() {
  const D = abDados(); const el = document.createElement('div'); el.className = 'ab'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Boas-vindas ao seu universo financeiro');
  el.innerHTML = `<canvas class="ab-cv" aria-hidden="true"></canvas>
    <div class="ab-marca">${logoMarca()}</div>
    <div class="ab-esq"><p class="ab-saud">${esc(saudacaoHora())}${D.nome ? ', ' + esc(D.nome) : ''}.</p>
      <h1 class="ab-tit" aria-live="polite"><span class="ab-tt"></span><span class="ab-cur" aria-hidden="true"></span></h1>
      <div class="ab-vivo"><span class="ab-pill"><i></i>Ao vivo</span><small class="ab-desde"></small><b class="ab-rend">R$ 0,00</b><em>Simulação com 12% ao ano. Sem promessa de resultado.</em></div></div>
    <div class="ab-ferr"><div class="ab-ano" role="group" aria-label="Ano do globo" hidden><button type="button" data-ano="-1" aria-label="Ano anterior">${AB_SETA_E}</button><b aria-live="polite"></b><button type="button" data-ano="1" aria-label="Próximo ano">${AB_SETA_D}</button></div>
      <button class="ab-olho" type="button"></button>
      <div class="ab-zoom" role="group" aria-label="Zoom"><button type="button" data-z="mais" aria-label="Aproximar">+</button><button type="button" data-z="menos" aria-label="Afastar">−</button><button type="button" data-z="tudo" aria-label="Ver tudo" hidden>⤢</button></div></div>
    <div class="ab-card" hidden role="status"></div>
    <button class="ab-entrar" type="button">Entrar no meu painel<span aria-hidden="true">→</span></button>`;
  document.body.appendChild(el); document.documentElement.classList.add('sem-rolagem');
  const cv = el.querySelector('.ab-cv'); const ctx = cv.getContext('2d');
  AB = { el, cv, ctx, D, t0: performance.now(), rotY: 0.7, rotX: -0.28, vY: 0, vX: 0, arr: null, mouse: null, alvos: [], sel: null, raf: 0, calmo: abCalmo(),
    fix: null, solta: null, z: 1, ox: 0, oy: 0, zA: 1, oxA: 0, oyA: 0, oc: D.op.valores === 'ocultar' || (D.op.valores !== 'mostrar' && !!S.privado) }; // fix: item preso no lugar; z/ox/oy: zoom e deslocamento da vista (e os alvos)
  AB.estilos = new Map(); AB.baldes = new Map(); AB.ver = 0; AB.fonte = getComputedStyle(document.body).fontFamily; AB.ult = performance.now(); AB.tc = 0;
  // se o globo completo não puder rodar aqui (sem canvas, erro ao montar ou escolha do cliente), entra a versão simples
  try {
    if (D.op.globo === 'simples' || !ctx) throw new Error('globo simples');
    abTema(); abPreparar(); abTamanho();
    // o tema pode mudar com a tela aberta (aparelho trocando de claro para escuro)
    AB.mo = new MutationObserver(() => { if (AB && !AB.leve) { abTema(); AB.estilos.clear(); AB.ver++; } }); AB.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-custom', 'style'] });
    AB.ro = new ResizeObserver(abTamanho); AB.ro.observe(el);
  } catch (er) { abSimples(); }
  if (!D.op.titulo) el.querySelector('.ab-tit').hidden = true; if (!D.vivo) el.querySelector('.ab-vivo').hidden = true;
  abEventos(); abAnoUi(); abOlhoUi(); if (D.op.titulo) abTitulo(); if (D.vivo) abVivo();
  const b = el.querySelector('.ab-entrar'); b.addEventListener('click', abFechar); setTimeout(() => b.focus({ preventScroll: true }), 50);
  // um erro em qualquer quadro (ou um aparelho lento demais) troca para a versão simples, em vez de deixar a tela vazia
  const quadro = (agora) => { if (!AB || AB.leve) return; try { abQuadro(agora); abVigia(agora); } catch (er) { abSimples(); return; } if (!AB.leve) AB.raf = requestAnimationFrame(quadro); };
  if (!AB.leve) AB.raf = requestAnimationFrame(quadro);
}
// mede o ritmo dos quadros por 2,5 s logo depois da entrada (só com a aba visível): abaixo de 12 por segundo, vai para a versão simples
function abVigia(agora) {
  const A = AB; if (A.calmo || A.vigiado) return; if (document.hidden) { A.vg = null; return; }
  if (!A.vg) { if (agora - A.t0 > 600) A.vg = { t: agora, n: 0 }; return; } A.vg.n++;
  if (agora - A.vg.t >= 2500) { A.vigiado = true; if (A.vg.n / ((agora - A.vg.t) / 1000) < 12) abSimples(); }
}
/* ---------- versão simples: só o globo, o valor no meio e anéis girando (CSS, sem canvas) ---------- */
function abSimples() {
  const A = AB; if (!A || A.leve) return; A.leve = true; cancelAnimationFrame(A.raf);
  if (A.ro) A.ro.disconnect(); if (A.mo) A.mo.disconnect(); A.ro = A.mo = null;
  A.el.querySelector('.ab-card').hidden = true; A.sel = A.segura = A.sobre = null; A.z = A.zA = 1; A.ox = A.oxA = A.oy = A.oyA = 0; A.el.classList.remove('ab-ampliado'); A.el.classList.add('ab-leve');
  const s = document.createElement('div'); s.className = 'abs';
  s.innerHTML = `<div class="abs-halo"></div><div class="abs-orb"><div class="abs-anel a1"><i></i></div><div class="abs-anel a2"><i></i></div><div class="abs-esfera"></div></div><div class="abs-txt" aria-live="polite"></div>`;
  A.el.insertBefore(s, A.el.querySelector('.ab-cv').nextSibling); abSimplesTxt();
}
function abSimplesTxt() {
  const A = AB; if (!A || !A.leve) return; const D = A.D; const c = D.cresc;
  A.el.querySelector('.abs-txt').innerHTML = `<small>${esc(D.rotulo)}</small><b>${abR(D.patr)}</b>${Math.abs(c) >= 1 ? `<em class="${c > 0 ? 'sobe' : 'desce'}">${c > 0 ? '+' : '−'} ${abR(Math.abs(c))} em ${D.ano}</em>` : ''}`;
}
function abFechar() {
  if (!AB) return; const A = AB; AB = null; cancelAnimationFrame(A.raf); clearTimeout(A.tT); clearInterval(A.tV); if (A.ro) A.ro.disconnect(); if (A.mo) A.mo.disconnect();
  document.removeEventListener('keydown', A.tecla, true);
  A.el.classList.add('saindo'); document.documentElement.classList.remove('sem-rolagem');
  setTimeout(() => A.el.remove(), abCalmo() ? 0 : 520);
}
/* ---------- outros anos e o olhinho do globo ---------- */
const AB_SETA_E = ic('<path d="M14.5 6l-6 6 6 6"/>'); const AB_SETA_D = ic('<path d="M9.5 6l6 6-6 6"/>');
function abAnoUi() {
  const A = AB; const box = A.el.querySelector('.ab-ano'); const L = abAnos(); const i = L.indexOf(S.year); box.hidden = L.length < 2;
  box.querySelector('b').textContent = S.year; box.querySelector('[data-ano="-1"]').disabled = i <= 0; box.querySelector('[data-ano="1"]').disabled = i < 0 || i >= L.length - 1;
}
// trocar o ano no globo troca o ano do painel também (ao entrar, o cliente cai no ano que estava vendo); a cena se recompõe
async function abAno(dir) {
  const A = AB; if (!A || A.trocando) return; const L = abAnos(); const y = L[L.indexOf(S.year) + dir]; if (y == null) return;
  A.trocando = true; try { await switchYear(y); } finally { A.trocando = false; } if (AB !== A) return;
  A.D = abDados();
  if (!A.leve) { abCard(null); A.segura = A.sobre = null; A.fix = A.solta = null; abPreparar(); A.ver++; A.zona = null; A.quadroSig = null; if (!A.calmo) A.t0 = performance.now(); abZoomEm(1, 0, 0, 0, 0); }
  clearTimeout(A.tT); clearInterval(A.tV); const tit = A.el.querySelector('.ab-tit'); const viv = A.el.querySelector('.ab-vivo');
  tit.hidden = !A.D.op.titulo; viv.hidden = !A.D.vivo; A.el.querySelector('.ab-tt').textContent = ''; abTamanho();
  if (A.D.op.titulo) abTitulo(); if (A.D.vivo) abVivo(); abAnoUi(); abSimplesTxt();
}
function abOlhoUi() { const b = AB.el.querySelector('.ab-olho'); const r = AB.oc ? 'Mostrar valores' : 'Ocultar valores'; b.innerHTML = AB.oc ? I_OLHO_OFF : I_OLHO; b.setAttribute('aria-pressed', AB.oc); b.setAttribute('aria-label', r); b.title = r; }
// o olho do globo: com "como o olhinho" ele também vale para o painel; com "visíveis" ou "ocultos" fixos, vale só aqui
function abOlho() {
  const A = AB; A.oc = !A.oc; abOlhoUi(); if (A.sel) abCard(A.sel); abSimplesTxt();
  if (A.D.op.valores === 'olho' && S.privado !== A.oc) { S.privado = A.oc; try { localStorage.setItem('fp:privado', S.privado ? '1' : '0'); } catch (e) { /* ignora */ } document.documentElement.dataset.privado = S.privado ? '1' : '0'; render(); }
}
function abTamanho() {
  if (!AB || AB.leve) return; const r = AB.el.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
  AB.W = r.width; AB.H = r.height; AB.cv.width = AB.W * dpr; AB.cv.height = AB.H * dpr; AB.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const estreito = AB.W < 760; AB.estreito = estreito;
  AB.cx = estreito ? AB.W * 0.5 : AB.W * 0.665; AB.cy = estreito ? AB.H * 0.47 : AB.H * 0.47; AB.R = Math.min(AB.W, AB.H) * (estreito ? 0.31 : 0.3);
  // a órbita dos objetivos não invade o texto da esquerda
  const viv = AB.el.querySelector('.ab-vivo'); const lim = estreito ? AB.W / 2 - 34 : AB.cx - viv.getBoundingClientRect().right - 40; AB.OA = Math.max(1.2, Math.min(estreito ? 1.42 : 1.6, lim / AB.R));
}
// pontos do globo, malha, anel, estrelas e as órbitas: calculados uma vez (vetores unitários)
function abPreparar() {
  const A = AB; let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; A.rnd = rnd;
  const N = matchMedia('(max-width: 760px)').matches ? 2600 : 4600; const cls = A.D.classes.length ? A.D.classes : [{ pct: 1, k: 0 }];
  A.pts = []; for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const t = i * 2.39996; const u = (1 - y) / 2 + (rnd() - 0.5) * 0.06;
    let acc = 0; let k = cls[cls.length - 1].k; for (const c of cls) { acc += c.pct; if (u <= acc) { k = c.k; break; } }
    A.pts.push({ v: [Math.cos(t) * r, y, Math.sin(t) * r], k });
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
// junta retângulos por estilo e desenha cada grupo de uma vez (mesmos retângulos, na mesma mistura, só com menos trocas de cor)
function abBalde(estilo) { let b = AB.baldes.get(estilo); if (!b) { b = []; AB.baldes.set(estilo, b); } return b; }
function abDespejar(ctx) { AB.baldes.forEach((b, estilo) => { if (!b.length) return; ctx.fillStyle = estilo; for (let j = 0; j < b.length; j += 3) ctx.fillRect(b[j], b[j + 1], b[j + 2], b[j + 2]); b.length = 0; }); }
function abQuadro(agora) {
  const A = AB; const ctx = A.ctx; const T = A.T; const W = A.W, H = A.H, cx = A.cx, cy = A.cy, R = A.R;
  if (!(W > 0 && H > 0 && A.cv.width > 0)) return; // tela ainda sem tamanho (aba oculta): nada a desenhar
  A.agora = agora;
  // relógio da cena: sempre anda (só o item tocado fica parado, em abFixo)
  if (!A.calmo) A.tc += Math.min(50, agora - A.ult); A.ult = agora; const t = A.tc / 1000;
  const entra = A.calmo ? 1 : Math.max(0, Math.min(1, (agora - A.t0) / 1800)); const e = 1 - Math.pow(1 - entra, 3);
  // giro: sozinho devagar, arraste com inércia (a inércia some de vez quando fica imperceptível)
  if (!A.arr) { A.rotY += (A.calmo ? 0 : 0.0018) + A.vY; A.rotX = Math.max(-1.1, Math.min(1.1, A.rotX + A.vX)); A.vY *= 0.95; A.vX *= 0.95; if (Math.abs(A.vY) < 1e-6) A.vY = 0; if (Math.abs(A.vX) < 1e-6) A.vX = 0; }
  // item preso: o escolhido, o que está sob o dedo ou sob o mouse; ao trocar, o anterior volta deslizando
  const alvo = A.sel || A.segura || A.sobre; const id = alvo ? alvo.id : null;
  if ((A.fix ? A.fix.id : null) !== id) { if (A.fix && A.fix.p) A.solta = { id: A.fix.id, p: A.fix.p, t: agora }; A.fix = id ? { id } : null; }
  // zoom: aproxima dos alvos com suavidade (sem suavidade com "reduzir movimento")
  const kz = A.calmo ? 1 : 0.22; A.z += (A.zA - A.z) * kz; A.ox += (A.oxA - A.ox) * kz; A.oy += (A.oyA - A.oy) * kz;
  if (Math.abs(A.zA - A.z) < 1e-4 && Math.abs(A.oxA - A.ox) < 0.05 && Math.abs(A.oyA - A.oy) < 0.05) { A.z = A.zA; A.ox = A.oxA; A.oy = A.oyA; }
  // nada mudou desde o último quadro (cena parada pelo "reduzir movimento"): não redesenha
  const sig = [A.tc, A.rotY, A.rotX, e, A.sel && A.sel.id, id, A.solta && A.solta.id, W, H, A.ver, A.mouse && A.mouse.join(), abOc(), A.z, A.ox, A.oy].join('|');
  if (sig === A.quadroSig) return; A.quadroSig = sig;
  const dpr = A.cv.width / W; const zoom = A.z !== 1 || A.ox !== 0 || A.oy !== 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); A.alvos = []; ctx.clearRect(0, 0, W, H);
  if (zoom) ctx.setTransform(dpr * A.z, 0, 0, dpr * A.z, dpr * A.ox, dpr * A.oy); // a cena inteira é ampliada; os alvos ficam em coordenadas da cena
  const camada = (nome, fn) => { if (zoom) fn(ctx); else ctx.drawImage(abCamada(nome, fn), 0, 0, W, H); }; // com zoom, desenha direto (camada pronta perderia nitidez)
  ctx.globalCompositeOperation = 'source-over';
  // no escuro, estrelas; no claro, confete nas cores da carteira
  A.estrelas.forEach(([x, y, r, al], i) => { ctx.fillStyle = abRgba(T.escuro ? T.luz : T.poeira[i % 4], al * (T.escuro ? 1 : 0.4) * (0.75 + 0.25 * Math.sin(t * 1.3 + i))); const rr = T.escuro ? r : r * 1.6; ctx.fillRect(x * W, y * H, rr, rr); });
  let g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.8); g.addColorStop(0, abRgba(T.acc, T.escuro ? 0.28 : 0.42)); g.addColorStop(0.45, abRgba(T.escuro ? T.acc : T.acc2, T.escuro ? 0.08 : 0.14)); g.addColorStop(1, abRgba(T.acc, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, 7); ctx.fill();
  g = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.38, R * 0.04, cx, cy, R);
  if (T.escuro) { g.addColorStop(0, abRgba(T.acc, 0.3)); g.addColorStop(0.55, abRgba(T.acc, 0.14)); g.addColorStop(1, abRgba(T.bg, 0.55)); }
  else { g.addColorStop(0, abRgba(T.esfera.brilho, 1)); g.addColorStop(0.5, abRgba(T.esfera.meio, 1)); g.addColorStop(1, abRgba(T.esfera.borda, 1)); }
  // a esfera do tema claro tem uma sombra larga (a operação mais cara do canvas): depois da entrada, ela é desenhada
  // uma vez numa camada do tamanho da tela e só copiada nos quadros seguintes
  const esfera = (c) => { if (!T.escuro) { c.shadowColor = abRgba(T.acc, 0.55); c.shadowBlur = 60; c.shadowOffsetY = 18; }
    c.globalAlpha = T.escuro ? 1 : e; c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * e, 0, 7); c.fill(); c.globalAlpha = 1; c.shadowBlur = 0; c.shadowOffsetY = 0; };
  if (T.escuro || e < 1) esfera(ctx); else camada('esfera', esfera);
  // lente de leitura: em volta do valor do centro, pontos e itens recuam (menores e mais apagados), com transição suave
  const Z = abZona(); const lente = (x, y) => { const dx = (x - Z.x) / Z.rx, dy = (y - Z.y) / Z.ry; const d = Math.sqrt(dx * dx + dy * dy); if (d >= 1) return 1;
    const s = Math.max(0, (d - 0.3) / 0.7); return 0.1 + 0.9 * s * s * (3 - 2 * s); };
  // objetivos (atrás)
  const ob = A.D.objs.map((o, i, arr) => { const q = abOrbita((i / arr.length) * Math.PI * 2 + 0.5 + t * 0.06); const f = abFixo('o' + o.k, q.x, q.y, q.frente ? 1 : 0); return { o, x: f[0], y: f[1], frente: f[2] > 0.5, k: lente(f[0], f[1]) }; });
  abElipse(false); ob.filter((p) => !p.frente).forEach((p) => abCristal(p, t));
  // camadas de trás
  const anel = A.anel.map((q) => abProj(abRot([Math.cos(q.a + t * 0.05) * q.rr, 0, Math.sin(q.a + t * 0.05) * q.rr], 0.42, 0)));
  const div = A.div.map((q, i) => { const p = abProj(abRot([Math.cos(q.fase + t * q.vel) * q.rr, 0, Math.sin(q.fase + t * q.vel) * q.rr], q.inc, q.gir)); return { q, p: abFixo('d' + i, p[0], p[1], p[2]) }; });
  const apo = A.D.apo.map((a, i, arr) => { const p = abProj(abRot([Math.cos((i / arr.length) * Math.PI * 2 + t * 0.12) * 1.3, 0, Math.sin((i / arr.length) * Math.PI * 2 + t * 0.12) * 1.3], 0.95, 0.4)); return { a, p: abFixo('a' + a.mes, p[0], p[1], p[2]) }; });
  ctx.globalCompositeOperation = T.soma;
  anel.forEach((q, i) => { if (q[2] < 0) abBalde(abEstilo(T.acc, A.anel[i].b * 0.7)).push(q[0], q[1], 1.2); }); abDespejar(ctx);
  abTrilha(false, t); div.forEach((d) => { if (d.p[2] < 0) { ctx.globalAlpha = lente(d.p[0], d.p[1]); abDiv(d, false); } }); apo.forEach((a) => { if (a.p[2] < 0) { ctx.globalAlpha = lente(a.p[0], a.p[1]); abLosango(a, false); } }); ctx.globalAlpha = 1;
  // malha
  // (trechos agrupados por transparência só para trocar a cor menos vezes)
  ctx.lineWidth = 1; const tracos = new Map(); A.malha.forEach((L) => { let ant = null; L.forEach((v) => { const p = abProj(v); if (ant) { const prof = (p[2] + ant[2]) / 2; if (prof > -0.05) { const es = abEstilo(T.escuro ? T.acc : T.luz, (T.escuro ? 0.2 : 0.3) * (0.25 + prof * 0.75) * e * lente((p[0] + ant[0]) / 2, (p[1] + ant[1]) / 2)); let l = tracos.get(es); if (!l) tracos.set(es, (l = [])); l.push(ant[0], ant[1], p[0], p[1]); } } ant = p; }); });
  // cada trecho segue com o próprio traço: no tema escuro as pontas que se encostam somam luz, e isso faz parte do desenho
  tracos.forEach((l, es) => { ctx.strokeStyle = es; for (let j = 0; j < l.length; j += 4) { ctx.beginPath(); ctx.moveTo(l[j], l[j + 1]); ctx.lineTo(l[j + 2], l[j + 3]); ctx.stroke(); } });
  // pontos do globo (entram espalhados e se juntam; afastam-se do mouse)
  const mx = A.mouse ? A.mouse[0] : -9999, my = A.mouse ? A.mouse[1] : -9999;
  // projeção feita aqui mesmo (sem criar listas por ponto) e os pontos agrupados por cor antes de pintar
  const cY = Math.cos(A.rotY), sY = Math.sin(A.rotY), cX = Math.cos(A.rotX), sX = Math.sin(A.rotX);
  for (let i = 0; i < A.pts.length; i++) { const pt = A.pts[i]; const v = pt.v;
    const x2 = v[0] * cY - v[2] * sY, z2 = v[0] * sY + v[2] * cY; let sx = cx + x2 * R, sy = cy + (v[1] * cX - z2 * sX) * R; const z = v[1] * sX + z2 * cX;
    if (e < 1) { const k = (1 - e) * (1.6 + (i % 7) * 0.35); sx = cx + (sx - cx) * (1 + k); sy = cy + (sy - cy) * (1 + k); }
    let realce = 0; if (z > 0) { const dx = sx - mx, dy = sy - my, d = Math.hypot(dx, dy); if (d < 110) { const f = (110 - d) / 110; sx += (dx / (d || 1)) * f * 30; sy += (dy / (d || 1)) * f * 30; realce = f; } }
    const kl = lente(sx, sy); const prof = (z + 1) / 2; const tam = (0.5 + prof * 2.1) * (1 + realce * 0.8) * (0.55 + 0.45 * kl); const al = Math.min(1, (0.06 + prof * 0.85) * (1 + realce)) * e * kl;
    abBalde(abEstilo(T.pts[pt.k], al)).push(sx - tam / 2, sy - tam / 2, tam);
  }
  abDespejar(ctx);
  // classes da carteira: orbs que pulsam na superfície, do tamanho da proporção
  A.nos.forEach((n) => { const p0 = abProj([Math.cos(n.la) * Math.cos(n.lo), Math.sin(n.la), Math.cos(n.la) * Math.sin(n.lo)]); const p = abFixo('c' + n.c.k, p0[0], p0[1], p0[2]); if (p[2] < -0.15) return;
    const c = T.cls[n.c.k]; const rr = (6 + Math.sqrt(n.c.pct * 100) * 3) * (0.75 + (p[2] + 1) * 0.15); const pulso = 1 + 0.08 * Math.sin(t * 2.4 + n.lo); ctx.globalAlpha = lente(p[0], p[1]);
    ctx.fillStyle = abRgba(c, 0.2); ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2.4 * pulso, 0, 7); ctx.fill();
    [1.35, 1.75, 2.2].forEach((k, j) => { const fase = (t * 0.6 + j / 3) % 1; ctx.strokeStyle = abRgba(c, (0.55 - j * 0.12) * (1 - fase * 0.6)); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p[0], p[1], rr * (k + fase * 0.4), 0, 7); ctx.stroke(); });
    const gg = ctx.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.4, rr * 0.1, p[0], p[1], rr); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(0.35, abRgba(c, 1)); gg.addColorStop(1, abRgba(c, T.escuro ? 0.45 : 0.75));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], rr * pulso, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    A.alvos.push({ id: 'c' + n.c.k, x: p[0], y: p[1], r: Math.max(16, rr * 1.6), tipo: 'classe', d: n.c });
  });
  // camadas da frente
  ctx.globalCompositeOperation = T.escuro ? 'lighter' : 'source-over';
  anel.forEach((q, i) => { if (q[2] >= 0) abBalde(abEstilo(T.escuro ? T.acc : T.acc2, A.anel[i].b * (T.escuro ? 1 : 1.3) * lente(q[0], q[1]))).push(q[0], q[1], T.escuro ? 1.4 : 1.8); }); abDespejar(ctx);
  ctx.globalCompositeOperation = 'source-over';
  abTrilha(true, t); div.forEach((d) => { if (d.p[2] >= 0) { ctx.globalAlpha = lente(d.p[0], d.p[1]); abDiv(d, true); } }); apo.forEach((a) => { if (a.p[2] >= 0) { ctx.globalAlpha = lente(a.p[0], a.p[1]); abLosango(a, true); } }); ctx.globalAlpha = 1;
  // borda luminosa do globo (sombra larga, igual em todo quadro depois da entrada: camada pronta)
  const borda = (c) => { c.strokeStyle = T.escuro ? abRgba(T.acc, 0.5) : 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.shadowColor = abRgba(T.acc, 1); c.shadowBlur = 20; c.beginPath(); c.arc(cx, cy, R * 1.005 * e, 0, 7); c.stroke(); c.shadowBlur = 0; };
  if (e < 1) borda(ctx); else camada('borda', borda);
  // objetivos (frente)
  abElipse(true); ob.filter((p) => p.frente).forEach((p) => abCristal(p, t));
  if (A.D.op.info) abInfo(t, lente);
  // valor no centro, por cima de tudo: um véu macio em elipse (escuro no tema escuro, o tom profundo da esfera no claro)
  // dá contraste sem moldura; as linhas pequenas ganham uma sombra curta. Depois da entrada vira camada pronta.
  const fonte = A.fonte; const veu = T.escuro ? T.bg : T.esfera.borda;
  const textos = (c) => {
    c.save(); c.globalAlpha = e; c.translate(Z.x, Z.y); c.scale(1, Z.ry / Z.rx); const vg = c.createRadialGradient(0, 0, 0, 0, 0, Z.rx * 1.12);
    vg.addColorStop(0, abRgba(veu, T.escuro ? 0.66 : 0.5)); vg.addColorStop(0.5, abRgba(veu, T.escuro ? 0.44 : 0.32)); vg.addColorStop(1, abRgba(veu, 0)); c.fillStyle = vg; c.beginPath(); c.arc(0, 0, Z.rx * 1.12, 0, 7); c.fill(); c.restore();
    c.textAlign = 'center'; c.globalAlpha = e; c.shadowColor = abRgba(veu, 0.9); c.shadowBlur = 8;
    c.fillStyle = abRgba(T.texto2, 1); c.font = `600 ${Math.max(11, Math.round(R * 0.06))}px ${fonte}`; c.fillText(A.D.rotulo, cx, cy - R * 0.08);
    c.shadowColor = T.escuro ? abRgba(T.acc, 0.85) : abRgba(veu, 0.8); c.shadowBlur = T.escuro ? 24 : 16; c.fillStyle = abRgba(T.texto, 1); c.font = `780 ${Math.round(R * 0.2)}px ${fonte}`; c.fillText(abR(A.D.patr), cx, cy + R * 0.11);
    c.shadowColor = abRgba(veu, 0.9); c.shadowBlur = 8;
    if (Math.abs(A.D.cresc) >= 1) { c.fillStyle = abRgba(A.D.cresc > 0 ? T.sobe : T.neg, 1); c.font = `650 ${Math.max(10.5, Math.round(R * 0.058))}px ${fonte}`; c.fillText(`${A.D.cresc > 0 ? '+' : '−'} ${abR(Math.abs(A.D.cresc))} em ${A.D.ano}`, cx, cy + R * 0.22); }
    c.shadowBlur = 0; c.globalAlpha = 1; };
  if (e < 1) textos(ctx); else camada('textos', textos);
  // o item escolhido fica marcado (a linha não engrossa com o zoom)
  if (A.sel) { const a = A.alvos.find((x) => x.id === A.sel.id) || A.sel;
    ctx.strokeStyle = abRgba(T.escuro ? T.luz : T.ink, 0.85); ctx.lineWidth = 2 / A.z; ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 4, 0, 7); ctx.stroke(); }
  if (zoom || A.sel) abCardPos();
}
// área do texto do centro (largura medida no valor de verdade), guardada enquanto tamanho, tema e valor não mudam
function abZona() {
  const A = AB; const R = A.R; const chave = [R, A.cx, A.cy, A.ver, abOc()].join('|'); if (A.zona && A.zona.chave === chave) return A.zona;
  const c = A.ctx; c.save(); c.font = `780 ${Math.round(R * 0.2)}px ${A.fonte}`; let w = c.measureText(abR(A.D.patr)).width; c.font = `600 ${Math.max(11, Math.round(R * 0.06))}px ${A.fonte}`; w = Math.max(w, c.measureText(A.D.rotulo).width); c.restore();
  A.zona = { chave, x: A.cx, y: A.cy + R * 0.05, rx: Math.max(w / 2, R * 0.32) + R * 0.2, ry: R * 0.3 }; return A.zona;
}
// posição de desenho de um item: o item preso fica onde estava quando foi tocado; o que acabou de ser solto
// volta deslizando (450 ms) para a posição real dele, que continuou andando
function abFixo(id, x, y, z) {
  const A = AB; const f = A.fix;
  if (f && f.id === id) { if (!f.p) f.p = [x, y, z]; return f.p; }
  const s = A.solta; if (s && s.id === id) { const k = A.calmo ? 1 : Math.min(1, (A.agora - s.t) / 450); if (k >= 1) { A.solta = null; return [x, y, z]; }
    const q = 1 - Math.pow(1 - k, 3); return [s.p[0] + (x - s.p[0]) * q, s.p[1] + (y - s.p[1]) * q, z]; }
  return [x, y, z];
}
// camada do tamanho da tela, desenhada uma vez e copiada pixel a pixel enquanto tamanho, tema e valores não mudam
function abCamada(nome, desenha) {
  const A = AB; const chave = [A.cv.width, A.cv.height, A.W, A.cx, A.cy, A.R, A.ver, abOc()].join('|'); A.camadas = A.camadas || {};
  let k = A.camadas[nome]; if (k && k.chave === chave) return k.cv;
  const cv = (k && k.cv) || document.createElement('canvas'); cv.width = A.cv.width; cv.height = A.cv.height; const c = cv.getContext('2d');
  c.setTransform(A.cv.width / A.W, 0, 0, A.cv.height / A.H, 0, 0); c.clearRect(0, 0, A.W, A.H); desenha(c);
  A.camadas[nome] = { chave, cv }; return cv;
}
function abElipse(frente) { const A = AB; const ctx = A.ctx; const OA = A.OA; ctx.save(); ctx.translate(A.cx, A.cy + A.R * 0.06); ctx.rotate(-0.2); ctx.strokeStyle = abRgba(A.T.acc, 0.32); ctx.lineWidth = 1.2; ctx.setLineDash([2, 6]);
  ctx.beginPath(); ctx.ellipse(0, 0, A.R * OA, A.R * 0.46, 0, frente ? 0 : Math.PI, frente ? Math.PI : Math.PI * 2); ctx.stroke(); ctx.restore(); }
function abTrilha(frente, t) { const A = AB; const ctx = A.ctx; if (!A.D.apo.length) return; ctx.strokeStyle = abRgba(A.T.pos, frente ? 0.45 : 0.15); ctx.lineWidth = 1.2; ctx.setLineDash([1, 5]);
  let ant = null; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; const p = abProj(abRot([Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3], 0.95, 0.4)); if (ant && (p[2] >= 0) === frente) { ctx.beginPath(); ctx.moveTo(ant[0], ant[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } ant = p; }
  ctx.setLineDash([]); }
function abDiv(d, frente) { const A = AB; const ctx = A.ctx; const prof = (d.p[2] + 1) / 2; const r = 1.3 + prof * 1.6; ctx.fillStyle = abRgba(A.T.ouro, 0.3 + prof * 0.7);
  if (frente) { ctx.shadowColor = abRgba(A.T.ouro, 1); ctx.shadowBlur = 8; } ctx.beginPath(); ctx.arc(d.p[0], d.p[1], r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  if (frente) A.alvos.push({ id: 'd' + A.div.indexOf(d.q), x: d.p[0], y: d.p[1], r: 10, tipo: 'div', d: d.q.d }); }
function abLosango(a, frente) { const A = AB; const ctx = A.ctx; const prof = (a.p[2] + 1) / 2; const tam = 8 + prof * 7; const al = 0.35 + prof * 0.65;
  ctx.save(); ctx.translate(a.p[0], a.p[1]); ctx.rotate(Math.PI / 4); ctx.fillStyle = abRgba(A.T.pos, al); if (frente) { ctx.shadowColor = abRgba(A.T.pos, 1); ctx.shadowBlur = 14; } ctx.fillRect(-tam / 2, -tam / 2, tam, tam); ctx.shadowBlur = 0;
  ctx.strokeStyle = abRgba(A.T.luz, al); ctx.lineWidth = 1.3; ctx.strokeRect(-tam / 2, -tam / 2, tam, tam); ctx.restore();
  if (frente) A.alvos.push({ id: 'a' + a.a.mes, x: a.p[0], y: a.p[1], r: 15, tipo: 'aporte', d: a.a }); }
const abHexPts = (x, y, rr, gir) => Array.from({ length: 6 }, (_, i) => [x + Math.cos(gir + (i * Math.PI) / 3) * rr, y + Math.sin(gir + (i * Math.PI) / 3) * rr]);
const abHexPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };
// objetivo: cristal hexagonal com facetas, anéis em hexágono pulsando e o progresso desenhado na borda
function abCristal(p, t) {
  const A = AB; const ctx = A.ctx; const o = p.o; const cor = A.T.obj[o.k]; const luz = A.T.luz; const rr = (A.estreito ? 15 : 22) * (p.frente ? 1 : 0.8); const pct = o.status === 'concluido' ? 1 : Math.max(0, Math.min(1, o.progresso || 0)); const al = (p.frente ? 1 : 0.6) * (p.k == null ? 1 : p.k);
  ctx.globalAlpha = al; let gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 3); gg.addColorStop(0, abRgba(cor, 0.47)); gg.addColorStop(1, abRgba(cor, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 3, 0, 7); ctx.fill();
  [1.55, 1.95, 2.4].forEach((k, j) => { const fase = (t * 0.5 + j / 3) % 1; ctx.strokeStyle = abRgba(cor, 1); ctx.globalAlpha = al * (0.5 - j * 0.14) * (1 - fase * 0.5); ctx.lineWidth = 1.3; abHexPath(ctx, abHexPts(p.x, p.y, rr * (k + fase * 0.3), Math.PI / 6)); ctx.stroke(); });
  const Hx = abHexPts(p.x, p.y, rr, Math.PI / 6 + t * 0.15); ctx.shadowColor = abRgba(cor, 1); ctx.shadowBlur = 22;
  Hx.forEach((q, i) => { const q2 = Hx[(i + 1) % 6]; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q[0], q[1]); ctx.lineTo(q2[0], q2[1]); ctx.closePath(); ctx.fillStyle = abRgba(cor, 1); ctx.globalAlpha = al * [0.95, 0.75, 0.45, 0.3, 0.5, 0.8][i]; ctx.fill(); });
  ctx.shadowBlur = 0; ctx.globalAlpha = al; ctx.strokeStyle = abRgba(luz, 0.75); ctx.lineWidth = 1.2; abHexPath(ctx, Hx); ctx.stroke();
  gg = ctx.createRadialGradient(p.x - rr * 0.3, p.y - rr * 0.35, 0, p.x - rr * 0.3, p.y - rr * 0.35, rr * 0.7); gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; abHexPath(ctx, Hx); ctx.fill();
  const anel = abHexPts(p.x, p.y, rr * 1.32, -Math.PI / 2); const lados = 6 * pct; ctx.strokeStyle = abRgba(A.T.escuro ? luz : A.T.ink, 0.14); ctx.lineWidth = 3; abHexPath(ctx, anel); ctx.stroke();
  if (lados > 0) { ctx.strokeStyle = abRgba(cor, 1); ctx.beginPath(); ctx.moveTo(anel[0][0], anel[0][1]); for (let i = 0; i < Math.floor(lados); i++) { const q = anel[(i + 1) % 6]; ctx.lineTo(q[0], q[1]); }
    const resto = lados - Math.floor(lados); if (resto > 0 && lados < 6) { const a = anel[Math.floor(lados) % 6], b = anel[(Math.floor(lados) + 1) % 6]; ctx.lineTo(a[0] + (b[0] - a[0]) * resto, a[1] + (b[1] - a[1]) * resto); } ctx.stroke(); }
  ctx.globalAlpha = 1; A.alvos.push({ id: 'o' + o.k, x: p.x, y: p.y, r: rr * 1.6, tipo: 'objetivo', d: o });
}
// "i" sobrevoando o globo
function abInfo(t, lente) { const A = AB; const ctx = A.ctx; const T = A.T; const ang = -2.25 + t * 0.18; const raio = A.R * 1.22;
  const x0 = A.cx + Math.cos(ang) * raio, y0 = A.cy + Math.sin(ang) * raio; const [x, y] = abFixo('i', x0, y0, 0); const dx = x - x0, dy = y - y0; // a cauda acompanha o "i" quando ele está preso
  ctx.globalAlpha = lente ? lente(x, y) : 1;
  for (let k = 1; k <= 14; k++) { const a = ang - k * 0.035; ctx.fillStyle = abRgba(T.acc, 0.5 - k * 0.033); ctx.beginPath(); ctx.arc(A.cx + Math.cos(a) * raio + dx, A.cy + Math.sin(a) * raio + dy, 2.4 - k * 0.12, 0, 7); ctx.fill(); }
  ctx.shadowColor = abRgba(T.acc, 0.8); ctx.shadowBlur = 18; ctx.fillStyle = abRgba(T.escuro ? T.bg : T.luz, 0.92); ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = abRgba(T.acc, 0.8); ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = abRgba(T.ink, 1); ctx.font = 'italic 700 17px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('i', x, y + 6); ctx.globalAlpha = 1;
  A.alvos.push({ id: 'i', x, y, r: 22, tipo: 'info' }); }

/* ---------- zoom ---------- */
const AB_ZMAX = 3;
const abCena = (sx, sy) => [(sx - AB.ox) / AB.z, (sy - AB.oy) / AB.z]; // da tela para a cena
// mantém a cena cobrindo a tela (sem bordas vazias) e volta ao centro quando o zoom é 1
function abLimita(z, ox, oy) { const A = AB; return [Math.min(0, Math.max(A.W - A.W * z, ox)), Math.min(0, Math.max(A.H - A.H * z, oy))]; }
// zoom ao redor de um ponto da tela (o ponto sob o dedo ou o mouse fica parado)
function abZoom(z, fx, fy) {
  const A = AB; z = Math.max(1, Math.min(AB_ZMAX, z)); const sx = (fx - A.oxA) / A.zA, sy = (fy - A.oyA) / A.zA;
  [A.oxA, A.oyA] = abLimita(z, fx - sx * z, fy - sy * z); A.zA = z; abZoomUi();
}
// leva um ponto da cena para um ponto da tela com o zoom pedido ("Aproximar" no detalhe)
function abZoomEm(z, px, py, tx, ty) { const A = AB; z = Math.max(1, Math.min(AB_ZMAX, z)); [A.oxA, A.oyA] = abLimita(z, tx - px * z, ty - py * z); A.zA = z; abZoomUi(); }
function abZoomUi() { const A = AB; const q = (s) => A.el.querySelector(s); q('[data-z="mais"]').disabled = A.zA >= AB_ZMAX - 0.01; q('[data-z="menos"]').disabled = A.zA <= 1.001; q('[data-z="tudo"]').hidden = A.zA <= 1.001;
  A.el.classList.toggle('ab-ampliado', A.zA > 1.001); }

/* ---------- interação: arrastar, pinça, roda, mouse, tocar para ver o detalhe ---------- */
function abEventos() {
  const A = AB; const cv = A.cv; let ini = null; let andou = 0; const dedos = new Map(); let pinca = null; let ultToque = null;
  const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => { try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ponteiro já solto */ } dedos.set(e.pointerId, local(e));
    if (dedos.size === 2) { // dois dedos: pinça (zoom e deslocamento juntos)
      const [a, b] = [...dedos.values()]; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      pinca = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z0: A.z, s: abCena(m[0], m[1]) }; A.arr = null; A.segura = null; ini = null; return; }
    ini = [e.clientX, e.clientY]; andou = 0; A.arr = [e.clientX, e.clientY]; A.vY = A.vX = 0;
    const p = local(e); A.segura = abAlvo(abCena(p[0], p[1])); // dedo em cima de um item: só ele para até soltar
  });
  cv.addEventListener('pointermove', (e) => {
    const p = local(e); if (dedos.has(e.pointerId)) dedos.set(e.pointerId, p); A.mouse = abCena(p[0], p[1]);
    if (pinca && dedos.size === 2) { const [a, b] = [...dedos.values()]; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const z = Math.max(1, Math.min(AB_ZMAX, pinca.z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinca.d0));
      const [ox, oy] = abLimita(z, m[0] - pinca.s[0] * z, m[1] - pinca.s[1] * z); A.z = A.zA = z; A.ox = A.oxA = ox; A.oy = A.oyA = oy; abZoomUi(); return; }
    if (A.arr) { const dx = e.clientX - A.arr[0], dy = e.clientY - A.arr[1]; andou += Math.abs(dx) + Math.abs(dy); if (andou >= 6) { A.segura = null; if (A.sel) abCard(null); } /* virou arraste: solta */
      if (A.zA > 1.001) { [A.ox, A.oy] = abLimita(A.z, A.ox + dx, A.oy + dy); A.oxA = A.ox; A.oyA = A.oy; } // com zoom, arrastar move a vista
      else { A.rotY += dx * 0.006; A.rotX = Math.max(-1.1, Math.min(1.1, A.rotX + dy * 0.004)); A.vY = dx * 0.0016; A.vX = dy * 0.001; }
      A.arr = [e.clientX, e.clientY]; }
    else { A.sobre = e.pointerType === 'mouse' ? abAlvo(A.mouse) : null; cv.style.cursor = A.sobre ? 'pointer' : 'grab'; }
  });
  // soltar sem arrastar abre o item que estava sob o dedo no começo do toque (ele estava preso, então não saiu do lugar);
  // dois toques rápidos no mesmo lugar aproximam (ou voltam a ver tudo, se já estiver perto)
  const soltar = (e) => { dedos.delete(e.pointerId); if (pinca) { if (dedos.size < 2) pinca = null; A.arr = null; return; }
    if (!A.arr) return; A.arr = null;
    if (andou < 6 && ini) { const p = local(e); const agora = performance.now();
      if (ultToque && agora - ultToque.t < 320 && Math.hypot(p[0] - ultToque.p[0], p[1] - ultToque.p[1]) < 30) { ultToque = null; if (A.zA < 1.9) abZoom(2.2, p[0], p[1]); else abZoomEm(1, 0, 0, 0, 0); }
      else { ultToque = { t: agora, p }; abTocar(A.segura || abAlvo(abCena(p[0], p[1]))); } }
    A.segura = null; ini = null; };
  cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', (e) => { dedos.delete(e.pointerId); pinca = null; A.arr = null; A.segura = null; });
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { A.mouse = null; A.sobre = null; } });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = local(e); abZoom(A.zA * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0018)), p[0], p[1]); }, { passive: false });
  // botões: aproximam e afastam em torno do centro do globo como ele está na tela
  A.el.querySelector('.ab-zoom').addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (!b) return; const gx = A.cx * A.zA + A.oxA, gy = A.cy * A.zA + A.oyA;
    if (b.dataset.z === 'mais') abZoom(A.zA * 1.5, gx, gy); else if (b.dataset.z === 'menos') abZoom(A.zA / 1.5, gx, gy); else abZoomEm(1, 0, 0, 0, 0); });
  abZoomUi();
  A.el.querySelector('.ab-ano').addEventListener('click', (e) => { const b = e.target.closest('[data-ano]'); if (b && !b.disabled) abAno(+b.dataset.ano); });
  A.el.querySelector('.ab-olho').addEventListener('click', abOlho);
  A.tecla = (e) => { if (!AB) return; const k = e.key; if (A.leve && k !== 'Escape') return; const gx = A.cx * A.zA + A.oxA, gy = A.cy * A.zA + A.oyA;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!A.el.querySelector('.ab-card').hidden) abCard(null); else if (A.zA > 1.001) abZoomEm(1, 0, 0, 0, 0); else abFechar(); }
    else if (k === '+' || k === '=') { e.preventDefault(); abZoom(A.zA * 1.5, gx, gy); } else if (k === '-') { e.preventDefault(); abZoom(A.zA / 1.5, gx, gy); } else if (k === '0') { e.preventDefault(); abZoomEm(1, 0, 0, 0, 0); } };
  document.addEventListener('keydown', A.tecla, true);
}
const abAlvo = (pt) => { const A = AB; let melhor = null; let dmin = 1e9; A.alvos.forEach((a) => { const d = Math.hypot(a.x - pt[0], a.y - pt[1]); if (d <= a.r && d < dmin) { dmin = d; melhor = a; } }); return melhor; };
// tocar num item abre o detalhe e deixa só ele preso até fechar; tocar no vazio solta
function abTocar(a) { AB.sel = a || null; abCard(a); }
function abCard(a) {
  const A = AB; const el = A.el.querySelector('.ab-card'); if (!a) { el.hidden = true; A.sel = null; return; }
  const d = a.d; const mes = (i) => MES_LONGO[i].replace(/^./, (c) => c.toUpperCase()); const T = A.T; let cor = T.acc; let h = '';
  if (a.tipo === 'classe') { cor = T.cls[d.k]; h = `<small>Investimento</small><b>${esc(d.nome)}</b><span class="ab-v">${abR(d.valor)}</span><span>${pct(d.pct)} da carteira${d.alvo != null ? ` · alvo ${pct(d.alvo)}` : ''}</span>`; }
  else if (a.tipo === 'aporte') { cor = T.pos; h = `<small>◆ Aporte de ${esc(MES_LONGO[d.mes])}</small><b class="ab-v">${abR(d.valor)}</b>${d.ativo ? `<span>Principal destino: ${esc(d.ativo)}</span>` : ''}${A.D.meta > 0 ? `<span>${d.valor + d.prov >= A.D.meta - 0.5 ? 'Na meta mensal' : 'Meta mensal de ' + abR(A.D.meta)}</span>` : ''}`; }
  else if (a.tipo === 'div') { cor = T.ouro; h = `<small>● Dividendo</small><b class="ab-v">${abR(d.valor)}</b><span>${esc(d.ativo)} · ${esc(mes(d.mes))}</span>`; }
  else if (a.tipo === 'objetivo') { cor = T.obj[d.k]; const ok = d.status === 'concluido'; h = `<small>Objetivo</small><b>${esc(d.nome)}</b><span class="ab-v">${abR(d.saldo)} <em>de ${abR(d.valor)}</em></span><span>${ok ? 'Conquistado' : pct(d.progresso) + ' do caminho'}${!ok && d.previsto ? ` · previsto para ${esc(MES_LONGO[d.previsto.mes])} de ${d.previsto.ano}` : ''}</span>`; }
  else if (a.tipo === 'info') { h = `<small>O que você está vendo</small><ul class="ab-leg"><li><i style="background:var(--c1)"></i>O globo é o seu patrimônio; as cores são as classes da carteira.</li>${A.D.op.classes ? '<li><i class="o"></i>Orbs que pulsam: cada classe, do tamanho da proporção.</li>' : ''}${A.D.apo.length ? '<li><i class="l"></i>Losangos verdes: os aportes de cada mês.</li>' : ''}${A.D.div.length ? '<li><i style="background:var(--c4)"></i>Pontinhos dourados: cada dividendo recebido.</li>' : ''}${A.D.objs.length ? '<li><i class="h"></i>Cristais em órbita: os seus objetivos. Toque para ver o nome e o progresso.</li>' : ''}</ul><span>Arraste para girar. Toque em qualquer ponto para ver o detalhe. Para aproximar, use a roda do mouse, dois dedos, dois toques ou os botões + e −; com zoom, arrastar move a vista.</span>`; }
  const perto = A.zA > 1.9; const zb = a.tipo === 'info' ? '' : `<button class="ab-zbtn" type="button">${perto ? 'Ver tudo' : 'Aproximar'}</button>`;
  el.style.setProperty('--ab-cor', abRgba(cor, 1)); el.innerHTML = `<button class="ab-x" type="button" aria-label="Fechar">×</button>${h}${zb}`; el.hidden = false;
  el.querySelector('.ab-x').addEventListener('click', () => abCard(null));
  const btn = el.querySelector('.ab-zbtn'); if (btn) btn.addEventListener('click', () => { if (perto) abZoomEm(1, 0, 0, 0, 0); else abZoomEm(2.4, a.x, a.y, A.W * (A.estreito ? 0.5 : 0.6), A.H * (A.estreito ? 0.36 : 0.45)); abCard(a); });
  A.cardPos = null; abCardPos();
}
// o detalhe fica ao lado do item, na posição dele na tela (que muda com o zoom)
function abCardPos() {
  const A = AB; const el = A.el.querySelector('.ab-card'); if (el.hidden || !A.sel) return;
  const a = A.alvos.find((x) => x.id === A.sel.id) || A.sel; const X = a.x * A.z + A.ox, Y = a.y * A.z + A.oy, r = a.r * A.z;
  const chave = [Math.round(X), Math.round(Y), el.offsetWidth].join(); if (chave === A.cardPos) return; A.cardPos = chave;
  const w = el.offsetWidth, hh = el.offsetHeight; let x = X + r + 10, y = Y - hh / 2; if (x + w > A.W - 16) x = X - r - 10 - w; x = Math.max(16, Math.min(A.W - w - 16, x)); y = Math.max(16, Math.min(A.H - hh - 90, y));
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
  const conta = () => { if (abOc()) { b.textContent = 'R$ •••'; return; } const s = (Date.now() - ini.getTime()) / 1000; const v = A.D.patr * (Math.pow(1 + AB_TAXA, s / 31557600) - 1);
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
  const globo = [['auto', 'Completa'], ['simples', 'Simples']].map(([v, l]) => `<button class="${op.globo === v ? 'on' : ''}" data-act="ab-globo" data-v="${v}" aria-pressed="${op.globo === v}">${l}</button>`).join('');
  const valores = [['olho', 'Como o olhinho'], ['mostrar', 'Visíveis'], ['ocultar', 'Ocultos']].map(([v, l]) => `<button class="${op.valores === v ? 'on' : ''}" data-act="ab-valores" data-v="${v}" aria-pressed="${op.valores === v}">${l}</button>`).join('');
  return `<section class="dr-sec"><h3>Tela de abertura</h3><p class="mmsg">O seu universo financeiro antes do painel: o globo do patrimônio e, em volta, o que você escolher.</p>
    <label class="chk"><input type="checkbox" data-abf="ligada" ${op.ligada ? 'checked' : ''}><span><b>Mostrar ao entrar</b><small>${pode ? 'Aparece antes da Visão geral.' : 'Aparece quando houver patrimônio registrado.'}</small></span></label>
    <div class="dr-sub"><h4>Quando aparece</h4><div class="seg" role="group" aria-label="Quando a tela de abertura aparece">${quando}</div></div>
    <div class="dr-sub"><h4>Versão do globo</h4><div class="seg" role="group" aria-label="Versão do globo">${globo}</div><small class="mmsg">A completa troca sozinha para a simples quando o aparelho não consegue rodá-la bem.</small></div>
    <div class="dr-sub"><h4>Valores ao abrir</h4><div class="seg" role="group" aria-label="Valores ao abrir o globo">${valores}</div></div>
    <div class="dr-sub"><h4>O que aparece</h4><div class="abas">${AB_CAMADAS.map(([k, l, d]) => `<label class="chk aba"><input type="checkbox" data-abf="${k}" ${op[k] ? 'checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div></div>
    <div class="btn-row"><button class="btn" data-act="ab-ver" ${pode ? '' : 'disabled'}>Ver a tela agora</button></div></section>`;
}
// botão do globo no topo das telas do painel (ao lado do olho e do sino)
const I_GLOBO = ic('<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.4 2.3 3.6 5.2 3.6 8.6s-1.2 6.3-3.6 8.6c-2.4-2.3-3.6-5.2-3.6-8.6S9.6 5.7 12 3.4z"/>');
function aberturaBtnHtml() { return aberturaPode() ? `<button class="ab-ir" data-act="ab-abrir" aria-label="Abrir o globo do patrimônio" title="Abrir o globo">${I_GLOBO}</button>` : ''; }
function aberturaAbrir() { if (!AB && aberturaPode()) abAbrir(); }
function aberturaCampo(t) { S.profile.abertura = Object.assign(abOpcoes(), { [t.dataset.abf]: t.checked }); touch('profile'); }
function aberturaQuando(v, btn) {
  S.profile.abertura = Object.assign(abOpcoes(), { quando: v === 'dia' ? 'dia' : 'sessao' }); touch('profile');
  btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S.profile.abertura.quando; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function aberturaGlobo(v, btn) {
  S.profile.abertura = Object.assign(abOpcoes(), { globo: v === 'simples' ? 'simples' : 'auto' }); touch('profile');
  btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S.profile.abertura.globo; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function aberturaValores(v, btn) {
  S.profile.abertura = Object.assign(abOpcoes(), { valores: ['mostrar', 'ocultar'].includes(v) ? v : 'olho' }); touch('profile');
  btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S.profile.abertura.valores; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
// prévia pelo painel: fecha o painel (um <dialog> aberto ficaria por cima) e abre a cena com as escolhas atuais
function aberturaVer() { if (AB || !aberturaPode()) return; closeAdmin(); if (S.view !== 'geral') { S.view = 'geral'; render(); } abAbrir(); }
