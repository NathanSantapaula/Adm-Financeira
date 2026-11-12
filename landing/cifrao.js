/* Cifrão, o mascote da AVEN. Um modelo de pose (posição, giro, olhar, piscada, achatamento)
   interpolado por quadros-chave, com um controlador de atenção que respira, olha em volta e pisca.
   SVG puro: corpo preto/creme, olhos recortados, sem braços nem pernas (cartilha). */
(() => {
'use strict';
const REPOUSO = {
  x: 0, y: 0, rotation: 0, yaw: 0, pitch: 0, scaleX: 1, scaleY: 1,
  gazeX: 0, gazeY: 0, leftWink: 0, rightWink: 0, leftEyeSmile: 0, rightEyeSmile: 0,
  eyeScaleX: 1, leftEyeScaleY: 1, rightEyeScaleY: 1, eyeSpacing: 1, eyeTilt: 0,
  marcas: 0, duvida: 0, dot: 0,
};
const FOCO = { ...REPOUSO, x: -.022, y: -.022, rotation: -.08, yaw: -.18, pitch: -.05, gazeX: -.04, gazeY: .05, scaleY: 1.03, eyeScaleX: 1.2, leftEyeScaleY: .78, rightEyeScaleY: .9, eyeTilt: -.06 };
const DURACAO = { notice: 1160, focus: 960, acknowledge: 700, hop: 960, wink: 900, proud: 1120, milestone: 1760, 'glance-left': 1580, 'glance-right': 1580, spin: 1800, flip: 1880, sonolento: 2400, confuso: 1700, irritado: 1300, erro: 1500 };
const K = {
  'glance-left': [
    { at: 0, pose: {} },
    { at: 160, pose: { gazeX: -.055, gazeY: -.012, eyeScaleX: 1.1, leftEyeScaleY: .88, rightEyeScaleY: 1.05 } },
    { at: 400, pose: { yaw: -.62, x: -.016, rotation: -.055, gazeX: -.035, gazeY: -.014, eyeScaleX: 1.12, leftEyeScaleY: .84, rightEyeScaleY: 1.04 } },
    { at: 810, pose: { yaw: -.58, pitch: -.08, x: -.013, rotation: -.04, gazeX: -.044, gazeY: -.025, eyeScaleX: 1.16, leftEyeScaleY: .9, rightEyeScaleY: 1.1 } },
    { at: 1000, pose: { yaw: -.46, x: -.01, gazeX: .022, gazeY: .005, eyeScaleX: 1.1, leftEyeScaleY: .92, rightEyeScaleY: .96 } },
    { at: 1270, pose: { yaw: .07, rotation: .025, gazeX: .009 } },
    { at: 1580, pose: {} },
  ],
  spin: [
    { at: 0, pose: {} },
    { at: 200, pose: { yaw: -.3, x: -.024, y: .018, rotation: -.065, scaleX: 1.07, scaleY: .9, gazeX: -.045, leftEyeScaleY: .76, rightEyeScaleY: .88 } },
    { at: 400, pose: { yaw: Math.PI * .36, y: -.046, rotation: .035, scaleX: .98, scaleY: 1.05, gazeX: .035, eyeScaleX: 1.22 } },
    { at: 690, pose: { yaw: Math.PI, y: -.063, scaleX: 1.025, scaleY: .99 } },
    { at: 980, pose: { yaw: Math.PI * 1.7, y: -.04, rotation: .035, scaleX: .99, scaleY: 1.025, gazeX: -.025 } },
    { at: 1220, pose: { yaw: Math.PI * 2 + .13, y: .015, rotation: .07, scaleX: 1.07, scaleY: .92, gazeX: .014, eyeScaleX: 1.2, leftEyeScaleY: .84, rightEyeScaleY: .84 } },
    { at: 1450, pose: { yaw: Math.PI * 2, y: -.018, rotation: -.035, rightWink: 1, eyeScaleX: 1.16 } },
    { at: 1800, pose: { yaw: Math.PI * 2 } },
  ],
  flip: [
    { at: 0, pose: {} },
    { at: 210, pose: { pitch: -.24, y: .026, scaleX: 1.1, scaleY: .84, gazeY: .03, leftEyeScaleY: .62, rightEyeScaleY: .62 } },
    { at: 410, pose: { pitch: Math.PI * .35, y: -.068, scaleX: .94, scaleY: 1.09, gazeY: -.035, eyeScaleX: 1.3 } },
    { at: 710, pose: { pitch: Math.PI, y: -.1, rotation: .04 } },
    { at: 1020, pose: { pitch: Math.PI * 1.7, y: -.055, scaleX: .98, scaleY: 1.04, gazeY: .018 } },
    { at: 1260, pose: { pitch: Math.PI * 2 + .12, y: .026, scaleX: 1.12, scaleY: .84, leftEyeScaleY: .57, rightEyeScaleY: .57 } },
    { at: 1480, pose: { pitch: Math.PI * 2 - .035, y: -.027, scaleX: .98, scaleY: 1.035, eyeScaleX: 1.2, gazeY: -.012 } },
    { at: 1660, pose: { pitch: Math.PI * 2, y: .006, scaleX: 1.02, scaleY: .98 } },
    { at: 1880, pose: { pitch: Math.PI * 2 } },
  ],
  // Surpreso: olha de lado, percebe, salta com os olhos arregalados e as marcas "//".
  notice: [
    { at: 0, pose: {} },
    { at: 170, pose: { x: -.022, rotation: -.09, gazeX: -.046, gazeY: -.008, eyeScaleX: .95, leftEyeScaleY: .83, rightEyeScaleY: .83, eyeTilt: -.05 } },
    { at: 370, pose: { x: -.026, rotation: -.11, gazeX: -.05, gazeY: -.012, eyeScaleX: .95, leftEyeScaleY: .8, rightEyeScaleY: .8, eyeTilt: -.05 } },
    { at: 470, pose: { x: .022, y: -.055, rotation: .1, scaleX: .97, scaleY: 1.06, gazeX: .005, gazeY: -.018, eyeScaleX: 1.95, leftEyeScaleY: .89, rightEyeScaleY: .89, eyeSpacing: 1.03, marcas: 1 } },
    { at: 660, pose: { x: .012, y: -.035, rotation: .06, scaleX: 1.02, scaleY: 1.02, gazeY: -.008, eyeScaleX: 1.88, leftEyeScaleY: .87, rightEyeScaleY: .87, eyeSpacing: 1.03, marcas: 1 } },
    { at: 870, pose: { y: .012, scaleX: 1.04, scaleY: .95, eyeScaleX: 1.12, leftEyeScaleY: .92, rightEyeScaleY: .92 } },
    { at: 1160, pose: {} },
  ],
  focus: [
    { at: 0, pose: {} },
    { at: 180, pose: { x: -.018, y: -.018, rotation: -.07, gazeX: -.038, gazeY: .04, yaw: -.09, pitch: -.025, scaleY: 1.03, eyeScaleX: 1.08, leftEyeScaleY: .86, rightEyeScaleY: .86 } },
    { at: 370, pose: { x: -.025, y: -.027, rotation: -.1, gazeX: -.043, gazeY: .05, yaw: -.2, pitch: -.06, scaleY: 1.04, eyeScaleX: 1.2, leftEyeScaleY: .78, rightEyeScaleY: .9, eyeTilt: -.06 } },
    { at: 570, pose: FOCO }, { at: 960, pose: FOCO },
  ],
  acknowledge: [
    { at: 0, pose: {} },
    { at: 110, pose: { y: -.018, scaleY: 1.04, gazeY: -.014, eyeScaleX: 1.15 } },
    { at: 245, pose: { y: .025, rotation: -.035, scaleX: 1.07, scaleY: .88, gazeY: .032, leftEyeScaleY: .68, rightEyeScaleY: .68 } },
    { at: 370, pose: { y: -.033, rotation: .035, scaleX: .97, scaleY: 1.05, gazeY: -.017, eyeScaleX: 1.17, leftEyeScaleY: .91, rightEyeScaleY: .91 } },
    { at: 500, pose: { y: .009, scaleX: 1.03, scaleY: .97 } },
    { at: 700, pose: {} },
  ],
  // Animado / Bounce: agacha, salta e aterrissa com squash & stretch.
  hop: [
    { at: 0, pose: {} },
    { at: 160, pose: { y: .02, scaleX: 1.1, scaleY: .86, gazeY: .022, leftEyeScaleY: .65, rightEyeScaleY: .65 } },
    { at: 275, pose: { x: -.009, y: -.075, rotation: -.06, scaleX: .94, scaleY: 1.09, gazeY: -.026, eyeScaleX: 1.45, leftEyeScaleY: .91, rightEyeScaleY: .91 } },
    { at: 405, pose: { x: .008, y: -.1, rotation: .13, scaleX: 1.04, scaleY: .97, gazeY: -.012, eyeScaleX: 1.4, leftEyeScaleY: .9, rightEyeScaleY: .9 } },
    { at: 550, pose: { x: .012, y: -.03, rotation: .07, scaleX: .97, scaleY: 1.04, gazeY: .024 } },
    { at: 640, pose: { y: .022, rotation: -.035, scaleX: 1.1, scaleY: .86, leftEyeScaleY: .56, rightEyeScaleY: .56 } },
    { at: 770, pose: { y: -.028, scaleX: .98, scaleY: 1.03 } },
    { at: 960, pose: {} },
  ],
  wink: [
    { at: 0, pose: {} },
    { at: 170, pose: { x: -.018, y: .006, rotation: -.09, scaleX: 1.04, scaleY: .95, gazeX: -.015, eyeScaleX: 1.08 } },
    { at: 330, pose: { x: .027, y: -.04, rotation: .16, scaleX: 1.02, scaleY: 1.03, gazeX: .018, rightWink: 1, eyeScaleX: 1.2, leftEyeScaleY: .9, eyeTilt: .07 } },
    { at: 485, pose: { x: .025, y: -.03, rotation: .14, gazeX: .016, rightWink: 1, eyeScaleX: 1.18, leftEyeScaleY: .9, eyeTilt: .06 } },
    { at: 645, pose: { x: -.007, y: .01, rotation: -.035, scaleY: .97 } },
    { at: 900, pose: {} },
  ],
  // Confiante: peito estufado, olhos semicerrados sorrindo.
  proud: [
    { at: 0, pose: {} },
    { at: 170, pose: { y: .019, rotation: -.05, scaleX: 1.07, scaleY: .91, gazeY: .022, leftEyeScaleY: .8, rightEyeScaleY: .8 } },
    { at: 355, pose: { x: -.015, y: -.057, rotation: -.12, scaleX: 1.07, scaleY: 1.05, gazeX: .015, gazeY: -.03, eyeScaleX: 1.23, leftEyeScaleY: .74, rightEyeScaleY: .74, eyeTilt: -.055, leftEyeSmile: .6, rightEyeSmile: .6 } },
    { at: 680, pose: { x: -.015, y: -.047, rotation: -.1, scaleX: 1.06, scaleY: 1.04, gazeX: .015, gazeY: -.025, eyeScaleX: 1.23, leftEyeScaleY: .74, rightEyeScaleY: .74, eyeTilt: -.04, leftEyeSmile: .6, rightEyeSmile: .6 } },
    { at: 890, pose: { y: .012, rotation: .035, scaleX: 1.03, scaleY: .96 } },
    { at: 1120, pose: {} },
  ],
  // Comemorando: preparação, salto com marcas, aterrissagem e piscadela de "conseguimos".
  milestone: [
    { at: 0, pose: {} },
    { at: 190, pose: { y: .022, rotation: -.04, scaleX: 1.1, scaleY: .84, gazeY: .025, leftEyeScaleY: .58, rightEyeScaleY: .58 } },
    { at: 335, pose: { x: -.016, y: -.072, rotation: -.12, scaleX: .95, scaleY: 1.09, gazeY: -.03, eyeScaleX: 1.65, leftEyeScaleY: .91, rightEyeScaleY: .91, marcas: 1 } },
    { at: 480, pose: { x: .009, y: -.1, rotation: .15, scaleX: 1.06, gazeY: -.015, eyeScaleX: 1.48, leftEyeScaleY: .88, rightEyeScaleY: .88, marcas: 1, leftEyeSmile: .8, rightEyeSmile: .8 } },
    { at: 660, pose: { x: .015, y: -.075, rotation: .1, scaleX: 1.09, scaleY: 1.02, eyeScaleX: 1.36, leftEyeScaleY: .8, rightEyeScaleY: .8, marcas: 1, leftEyeSmile: .8, rightEyeSmile: .8 } },
    { at: 830, pose: { y: .023, rotation: -.055, scaleX: 1.1, scaleY: .85, gazeY: .015, leftEyeScaleY: .55, rightEyeScaleY: .55 } },
    { at: 1050, pose: { x: -.02, y: -.054, rotation: -.14, scaleX: 1.07, scaleY: 1.05, gazeY: -.025, gazeX: .018, eyeScaleX: 1.28, leftEyeScaleY: .8, rightEyeScaleY: .8, eyeTilt: -.055 } },
    { at: 1160, pose: { x: -.018, y: -.049, rotation: -.12, scaleX: 1.06, scaleY: 1.04, gazeY: -.02, gazeX: .018, rightWink: 1, eyeScaleX: 1.28, leftEyeScaleY: .85, eyeTilt: -.04 } },
    { at: 1320, pose: { x: -.016, y: -.043, rotation: -.1, scaleX: 1.05, scaleY: 1.03, gazeY: -.016, gazeX: .015, rightWink: 1, eyeScaleX: 1.23, leftEyeScaleY: .85, eyeTilt: -.04 } },
    { at: 1510, pose: { y: .012, rotation: .04, scaleX: 1.04, scaleY: .95 } },
    { at: 1760, pose: {} },
  ],
  // Sonolento / Descansando: afunda, olhos quase fechados, cabeça pende e volta.
  sonolento: [
    { at: 0, pose: {} },
    { at: 500, pose: { y: .02, scaleY: .96, scaleX: 1.03, rotation: .06, pitch: .1, gazeY: .05, leftEyeScaleY: .35, rightEyeScaleY: .4, eyeScaleX: 1.1 } },
    { at: 1300, pose: { y: .028, scaleY: .95, scaleX: 1.04, rotation: .1, pitch: .14, gazeY: .06, leftEyeScaleY: .22, rightEyeScaleY: .3, eyeScaleX: 1.1 } },
    { at: 1650, pose: { y: -.02, scaleY: 1.04, rotation: -.03, eyeScaleX: 1.5, leftEyeScaleY: 1.05, rightEyeScaleY: 1.05 } },
    { at: 2400, pose: {} },
  ],
  // Confuso / Desorientado: inclina, olhos desiguais, interrogação.
  confuso: [
    { at: 0, pose: {} },
    { at: 250, pose: { rotation: .12, yaw: .2, gazeX: .03, gazeY: -.03, leftEyeScaleY: 1.1, rightEyeScaleY: .6, eyeTilt: .1, duvida: 1 } },
    { at: 800, pose: { rotation: .14, yaw: .25, gazeX: -.03, gazeY: -.02, leftEyeScaleY: 1.12, rightEyeScaleY: .55, eyeTilt: .12, duvida: 1 } },
    { at: 1250, pose: { rotation: -.08, yaw: -.15, gazeX: .02, leftEyeScaleY: .9, rightEyeScaleY: 1.05, eyeTilt: -.05, duvida: .6 } },
    { at: 1700, pose: {} },
  ],
  // Irritado: olhos achatados, tremor curto e um sopro (achata).
  irritado: [
    { at: 0, pose: {} },
    { at: 200, pose: { leftEyeScaleY: .42, rightEyeScaleY: .42, eyeTilt: .13, eyeScaleX: 1.2, gazeY: .01, scaleY: .98 } },
    { at: 330, pose: { x: -.012, leftEyeScaleY: .4, rightEyeScaleY: .4, eyeTilt: .13, eyeScaleX: 1.2, scaleY: .98 } },
    { at: 460, pose: { x: .012, leftEyeScaleY: .4, rightEyeScaleY: .4, eyeTilt: .13, eyeScaleX: 1.2, scaleY: .98 } },
    { at: 590, pose: { x: -.008, leftEyeScaleY: .4, rightEyeScaleY: .4, eyeTilt: .13, eyeScaleX: 1.2, scaleY: .98 } },
    { at: 900, pose: { leftEyeScaleY: .45, rightEyeScaleY: .45, eyeTilt: .1, scaleY: .94, scaleX: 1.05, y: .02 } },
    { at: 1300, pose: {} },
  ],
  // Error: algo deu errado. Sobressalto, confusão e "?".
  erro: [
    { at: 0, pose: {} },
    { at: 150, pose: { y: -.04, scaleY: 1.06, scaleX: .96, eyeScaleX: 1.6, leftEyeScaleY: 1.1, rightEyeScaleY: 1.1, marcas: 1 } },
    { at: 450, pose: { rotation: .12, yaw: .2, gazeX: .03, leftEyeScaleY: 1.1, rightEyeScaleY: .6, eyeTilt: .1, duvida: 1 } },
    { at: 1000, pose: { rotation: -.1, yaw: -.2, gazeX: -.03, leftEyeScaleY: .6, rightEyeScaleY: 1.1, eyeTilt: -.1, duvida: 1 } },
    { at: 1500, pose: {} },
  ],
};
K['glance-right'] = K['glance-left'].map(({ at, pose }) => {
  const p = { ...pose };
  for (const k of ['yaw', 'x', 'rotation', 'gazeX']) if (k in p) p[k] = -p[k];
  if ('leftEyeScaleY' in p || 'rightEyeScaleY' in p) [p.leftEyeScaleY, p.rightEyeScaleY] = [p.rightEyeScaleY ?? 1, p.leftEyeScaleY ?? 1];
  return { at, pose: p };
});
// Nomes da cartilha → sequências.
const EXPRESSOES = { neutro: null, curioso: 'glance-right', animado: 'hop', sonolento: 'sonolento', confuso: 'confuso', irritado: 'irritado', surpreso: 'notice', confiante: 'proud', comemorando: 'milestone', pensando: 'focus', espiando: 'glance-left', desorientado: 'erro', piscadela: 'wink', giro: 'spin', cambalhota: 'flip' };
const CHAVES = Object.keys(REPOUSO);
const ANG = (k) => k === 'yaw' || k === 'pitch';
function seq(nome, t) {
  const frames = K[nome], total = DURACAO[nome];
  const el = Math.max(0, Math.min(total, t));
  let a = frames[0], b = frames[frames.length - 1];
  for (let i = 1; i < frames.length; i++) if (frames[i].at >= el) { a = frames[i - 1]; b = frames[i]; break; }
  const span = b.at - a.at, raw = span <= 0 ? 1 : (el - a.at) / span, w = raw * raw * (3 - 2 * raw);
  const out = {};
  for (const k of CHAVES) {
    const from = a.pose[k] ?? REPOUSO[k], to = b.pose[k] ?? REPOUSO[k];
    out[k] = from + (to - from) * w;
  }
  return out;
}
function mistura(from, to, amount) {
  const w = Math.min(1, Math.max(0, amount)), e = w * w * (3 - 2 * w), r = { ...to };
  for (const k of CHAVES) {
    const raw = (to[k] ?? REPOUSO[k]) - (from[k] ?? REPOUSO[k]);
    const d = ANG(k) ? Math.atan2(Math.sin(raw), Math.cos(raw)) : raw;
    r[k] = (from[k] ?? REPOUSO[k]) + d * e;
  }
  return r;
}

/* Atenção: olha para alvos, corrige o olhar, troca expressão, respira e pisca.
   Avança só em fronteiras de atenção; a taxa de quadros nunca escolhe nada. */
const ALVOS = [{ id: 'f', x: 0, y: 0 }, { id: 'u', x: 0, y: -1 }, { id: 'd', x: 0, y: 1 }, { id: 'ul', x: -.8, y: -.85 }, { id: 'ur', x: .8, y: -.85 }, { id: 'dl', x: -.8, y: .85 }, { id: 'dr', x: .8, y: .85 }, { id: 'l', x: -1, y: 0 }, { id: 'r', x: 1, y: 0 }];
const EXPR = ['open', 'smile', 'surprised', 'soft', 'skeptical'];
const olhos = (p) => ({ eyeScaleX: p.eyeScaleX, leftEyeScaleY: p.leftEyeScaleY, rightEyeScaleY: p.rightEyeScaleY, eyeSpacing: p.eyeSpacing, eyeTilt: p.eyeTilt, leftEyeSmile: p.leftEyeSmile, rightEyeSmile: p.rightEyeSmile });
const sorteio = (r) => { r.seed = (r.seed * 16807) % 2147483647; return (r.seed - 1) / 2147483646; };
const lim = (v, l = 1) => Math.min(l, Math.max(-l, v));
const ease = (v) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
function escolheExpressao(r) {
  const start = Math.floor(sorteio(r) * EXPR.length);
  let kind = EXPR[start];
  if (kind === r.exprKind) kind = EXPR[(start + 1) % EXPR.length];
  const side = sorteio(r) > .5 ? 1 : -1, a = sorteio(r), focused = r.mode === 'curious';
  r.exprKind = kind; r.exprFrom = olhos(r.pose); r.exprElapsed = 0;
  r.exprDuration = 190 + sorteio(r) * 190; r.exprNext = 720 + sorteio(r) * (focused ? 790 : 620);
  const e = { eyeScaleX: 1.04 + a * .12, leftEyeScaleY: 1.02 + side * .035, rightEyeScaleY: 1.02 - side * .035, eyeSpacing: .96 + a * .045, eyeTilt: side * .025, leftEyeSmile: 0, rightEyeSmile: 0 };
  if (kind === 'smile') Object.assign(e, { eyeScaleX: 1.19 + a * .18, leftEyeScaleY: .92 + a * .13, rightEyeScaleY: 1.02 - a * .12, leftEyeSmile: .81 + a * .19, rightEyeSmile: .96 - a * .12, eyeTilt: side * .065 });
  else if (kind === 'surprised') Object.assign(e, { eyeScaleX: focused ? 1.23 : 1.39 + a * .17, leftEyeScaleY: 1.19 + a * .12, rightEyeScaleY: 1.24 - a * .05, eyeSpacing: 1.04 });
  else if (kind === 'skeptical') Object.assign(e, { eyeScaleX: 1.18 + a * .11, leftEyeScaleY: side < 0 ? .47 : 1.08, rightEyeScaleY: side > 0 ? .47 : 1.08, eyeTilt: side * .13, leftEyeSmile: side < 0 ? .17 : 0, rightEyeSmile: side > 0 ? .17 : 0 });
  else if (kind === 'soft') Object.assign(e, { eyeScaleX: 1.12 + a * .09, leftEyeScaleY: .79 + a * .08, rightEyeScaleY: .84 - a * .06, leftEyeSmile: .3 + a * .13, rightEyeSmile: .43 - a * .13 });
  r.exprTarget = e;
}
function comecaAlvo(r, id, pt, kind) {
  const x = lim(pt.x), y = lim(pt.y), follow = Math.max(0, Math.min(1, pt.bodyFollow ?? .85));
  const eyesOnly = kind === 'eyes' || follow === 0;
  r.prevGoal = r.goalId; r.goalId = id; r.goalKind = kind; r.goalElapsed = 0;
  r.goalDuration = (1100 + sorteio(r) * 1250) + (kind === 'profile' ? 350 : 0);
  r.bodyDelay = 170 + sorteio(r) * 210; r.bodyDuration = 410 + sorteio(r) * 310;
  r.eyeDuration = 85 + sorteio(r) * 65; r.eyeElapsed = 0;
  r.eyeFromX = r.pose.gazeX; r.eyeFromY = r.pose.gazeY;
  r.eyeToX = x * (.052 + sorteio(r) * .01); r.eyeToY = y * (.062 + sorteio(r) * .011);
  r.correctionAt = 320 + sorteio(r) * 230; r.profileRedirected = false;
  r.semVertical = Math.abs(y) > .5 ? 0 : r.semVertical + 1;
  r.semOlhos = eyesOnly ? 0 : r.semOlhos + 1;
  r.semPerfil = kind === 'profile' ? 0 : r.semPerfil + 1;
  r.from = { ...r.pose };
  const yaw = kind === 'profile' ? x * (.79 + sorteio(r) * .1) : x * .65 * follow;
  const squint = kind === 'profile' ? .06 : y > .5 ? .07 : -.035;
  r.target = { ...REPOUSO, yaw: eyesOnly ? r.pose.yaw : yaw, pitch: eyesOnly ? r.pose.pitch : -y * .22 * follow,
    rotation: eyesOnly ? r.pose.rotation : x * .045 - y * .015, x: eyesOnly ? r.pose.x : x * .014 * follow,
    y: eyesOnly ? lim(r.pose.y, .012) : -.006 - Math.abs(y) * .006, gazeX: r.eyeToX, gazeY: r.eyeToY,
    eyeScaleX: 1.04 + sorteio(r) * .13, leftEyeScaleY: 1 - squint + x * .055, rightEyeScaleY: 1 - squint - x * .055,
    eyeSpacing: 1 - Math.abs(x) * .045, eyeTilt: x * .035 };
  if (r.exprElapsed >= r.exprDuration || r.elapsed === 0) escolheExpressao(r);
}
function escolheAlvo(r) {
  const start = Math.floor(sorteio(r) * ALVOS.length), focused = r.mode === 'curious';
  const needsV = r.semVertical >= 2, needsP = !focused && !needsV && r.semPerfil >= 5;
  let sel;
  for (let pass = 0; pass < 2 && !sel; pass++) for (let o = 0; o < ALVOS.length; o++) {
    const c = ALVOS[(start + o) % ALVOS.length];
    if (c.id === r.goalId || c.id === r.prevGoal) continue;
    if (focused && c.y < .5) continue;
    if (pass === 0 && needsV && Math.abs(c.y) < .5) continue;
    if (pass === 0 && needsP && Math.abs(c.x) < 1) continue;
    sel = c; break;
  }
  if (!sel) return;
  const side = Math.abs(sel.x) === 1, profile = !focused && side && (needsP || sorteio(r) > .35);
  const eyesOnly = focused || (!profile && (r.semOlhos >= 2 || sorteio(r) < .42));
  comecaAlvo(r, sel.id, sel, profile ? 'profile' : eyesOnly ? 'eyes' : 'look');
}
function novaAtencao(seed = 1) {
  const r = { seed: Math.abs(Math.floor(seed)) % 2147483646 + 1, mode: 'idle', elapsed: 0, goalId: 'f', prevGoal: 'f', goalKind: 'look',
    goalElapsed: 0, goalDuration: 0, semVertical: 0, semOlhos: 0, semPerfil: 0, from: { ...REPOUSO }, target: { ...REPOUSO }, pose: { ...REPOUSO },
    bodyDelay: 0, bodyDuration: 1, eyeElapsed: 0, eyeDuration: 1, eyeFromX: 0, eyeFromY: 0, eyeToX: 0, eyeToY: 0, correctionAt: 0, profileRedirected: false,
    exprKind: 'open', exprFrom: olhos(REPOUSO), exprTarget: olhos(REPOUSO), exprElapsed: 0, exprDuration: 1, exprNext: 0,
    blinkWait: 0, blinkElapsed: -1, blinkDuration: 200, doubleBlink: false, breathPeriod: 0, breathPhase: 0 };
  r.blinkWait = 950 + sorteio(r) * 2450; r.breathPeriod = 3100 + sorteio(r) * 1450; r.breathPhase = sorteio(r) * Math.PI * 2;
  escolheAlvo(r);
  return r;
}
function dirigeAtencao(cur, alvo) { const r = { ...cur }; comecaAlvo(r, 'ctx', alvo, 'context'); return r; }
function passoAtencao(cur, dt) {
  const r = { ...cur }, d = Math.max(0, Math.min(80, dt));
  r.elapsed += d; r.goalElapsed += d; r.eyeElapsed += d; r.exprElapsed += d;
  if (r.goalElapsed >= r.goalDuration) escolheAlvo(r);
  if (r.exprElapsed >= r.exprNext) escolheExpressao(r);
  if (r.goalElapsed >= r.correctionAt) {
    r.eyeFromX = r.pose.gazeX; r.eyeFromY = r.pose.gazeY; r.eyeElapsed = 0; r.eyeDuration = 65 + sorteio(r) * 65;
    if (r.goalKind === 'profile' && !r.profileRedirected && r.goalElapsed >= r.bodyDelay + r.bodyDuration) {
      const s = r.target.yaw < 0 ? -1 : 1;
      r.eyeToX = -s * (.02 + sorteio(r) * .025); r.eyeToY = (sorteio(r) > .5 ? 1 : -1) * (.037 + sorteio(r) * .026); r.profileRedirected = true;
    } else { r.eyeToX = lim(r.target.gazeX + (sorteio(r) - .5) * .027, .063); r.eyeToY = lim(r.target.gazeY + (sorteio(r) - .5) * .03, .072); }
    r.correctionAt += 310 + sorteio(r) * 310;
  }
  let blink = 0;
  if (r.blinkElapsed < 0) { r.blinkWait -= d; if (r.blinkWait <= 0) { r.blinkElapsed = 0; r.blinkDuration = 170 + sorteio(r) * 65; } }
  else {
    r.blinkElapsed += d;
    const p = r.blinkElapsed / r.blinkDuration;
    blink = p < .32 ? ease(p / .32) : 1 - ease((p - .32) / .68);
    if (p >= 1) {
      r.blinkElapsed = -1;
      if (r.doubleBlink) { r.doubleBlink = false; r.blinkWait = 2000 + sorteio(r) * 4200; }
      else if (sorteio(r) < .21) { r.doubleBlink = true; r.blinkWait = 85 + sorteio(r) * 100; }
      else r.blinkWait = 2000 + sorteio(r) * 4200;
    }
  }
  const body = ease((r.goalElapsed - r.bodyDelay) / r.bodyDuration), ex = ease(r.exprElapsed / r.exprDuration), ey = ease(r.eyeElapsed / r.eyeDuration);
  const f = r.from, t = r.target, ef = r.exprFrom, et = r.exprTarget;
  const breath = Math.sin(r.elapsed / r.breathPeriod * Math.PI * 2 + r.breathPhase);
  const dx = Math.sin(r.elapsed / 293 + r.breathPhase) * .002, dy = Math.sin(r.elapsed / 367 + r.breathPhase * .7) * .0027, ap = Math.sin(r.elapsed / 241 + r.breathPhase) * .025;
  const L = (a, b, w) => a + (b - a) * w;
  r.pose = { ...REPOUSO, yaw: L(f.yaw, t.yaw, body), pitch: L(f.pitch, t.pitch, body), rotation: L(f.rotation, t.rotation, body), x: L(f.x, t.x, body), y: L(f.y, t.y, body),
    scaleX: 1 - breath * .004, scaleY: 1 + breath * .007,
    gazeX: lim(L(r.eyeFromX, r.eyeToX, ey) + dx, .065), gazeY: lim(L(r.eyeFromY, r.eyeToY, ey) + dy, .075),
    eyeScaleX: L(ef.eyeScaleX, et.eyeScaleX, ex) + ap * .5, leftEyeScaleY: L(ef.leftEyeScaleY, et.leftEyeScaleY, ex) + ap, rightEyeScaleY: L(ef.rightEyeScaleY, et.rightEyeScaleY, ex) - ap * .7,
    eyeSpacing: L(ef.eyeSpacing, et.eyeSpacing, ex), eyeTilt: L(ef.eyeTilt, et.eyeTilt, ex), leftEyeSmile: L(ef.leftEyeSmile, et.leftEyeSmile, ex), rightEyeSmile: L(ef.rightEyeSmile, et.rightEyeSmile, ex),
    leftWink: blink, rightWink: blink };
  return r;
}

/* Desenho. Caixa 1000×1000, centro do corpo em (500, 520). */
const NS = 'http://www.w3.org/2000/svg';
const menos = window.matchMedia('(prefers-reduced-motion: reduce)');
const atores = new Set();
let serial = 0;
// clipPath não aceita <g>: o caminho entra direto.
// Silhueta do Cifrão vetorizada da cartilha (caixa 1000×1000, centro em 500,520). Os olhos são formas à parte, recortadas sobre o corpo.
const CORPO = `<path d="M533.8 927.8 C564.0 920.9 583.3 902.9 590.7 875.0 C592.4 868.5 592.7 863.6 592.6 844.4 L592.3 821.5 L604.5 819.6 C629.7 815.6 663.2 805.7 685.5 795.7 C745.7 768.7 782.0 728.6 796.5 673.1 C800.1 659.3 801.5 644.6 800.8 626.2 C799.8 599.3 795.9 583.6 784.5 560.6 C763.9 519.1 732.8 491.7 680.8 469.4 C669.1 464.4 665.6 460.8 665.6 454.0 C665.6 447.0 668.4 444.9 680.6 442.8 C723.5 435.3 754.7 413.6 767.3 382.5 C772.0 370.8 773.4 363.4 773.5 350.6 C773.5 324.3 763.2 301.9 741.3 280.0 C713.4 252.2 668.6 232.6 609.4 222.1 L595.0 219.6 L595.0 194.5 C595.0 169.9 594.9 169.3 591.9 160.6 C590.2 155.7 587.2 149.0 585.2 145.7 C580.2 137.3 568.1 126.3 558.7 121.6 C529.6 106.9 474.5 106.4 444.7 120.5 C415.6 134.3 402.9 160.5 405.0 202.4 L405.8 217.7 L403.2 218.2 C401.7 218.5 393.6 220.1 385.0 221.7 C320.1 234.2 271.0 263.7 240.9 308.3 C228.0 327.5 218.6 350.6 214.9 372.7 C212.2 389.0 213.2 417.5 217.1 432.9 C230.1 484.5 266.7 524.3 325.0 550.3 C355.6 564.0 390.1 573.2 448.0 583.3 C514.8 595.0 538.7 601.0 558.9 611.1 C576.1 619.7 583.3 628.2 584.2 640.9 C585.4 658.4 573.3 670.7 548.9 676.4 C536.9 679.2 501.1 679.1 487.8 676.3 C455.5 669.3 430.0 656.5 387.8 626.0 C356.9 603.6 342.3 595.6 322.8 590.3 C313.1 587.7 309.7 587.3 296.1 587.4 C277.5 587.4 268.5 589.5 252.9 597.2 C229.5 608.9 213.2 627.8 204.2 653.5 C200.7 663.6 200.6 664.5 200.6 681.7 C200.6 702.5 202.3 710.3 210.6 727.0 C237.2 780.0 299.4 814.3 390.1 825.9 L409.4 828.4 L409.5 849.5 C409.6 873.3 410.4 877.9 417.7 892.8 C425.5 908.8 440.4 920.3 460.6 926.0 C475.0 930.1 483.7 931.0 505.0 930.6 C518.9 930.2 526.5 929.5 533.8 927.8 Z"/>`;
function olhoD(cx, cy, w, h, smile) {
  const a = Math.min(1, Math.max(0, smile)), hw = w / 2 * (1 + a * .5), hh = h / 2;
  const side = hh * a * .32, top = -hh * (1 - a * .42), bottom = hh * (1 - a * 1.12), up = -hh * (.552 - a * .26), lo = hh * (.552 - a * .06);
  return `M${cx - hw} ${cy + side} C${cx - hw} ${cy + up} ${cx - hw * .552} ${cy + top} ${cx} ${cy + top} C${cx + hw * .552} ${cy + top} ${cx + hw} ${cy + up} ${cx + hw} ${cy + side} C${cx + hw} ${cy + lo} ${cx + hw * .552} ${cy + bottom} ${cx} ${cy + bottom} C${cx - hw * .552} ${cy + bottom} ${cx - hw} ${cy + lo} ${cx - hw} ${cy + side} Z`;
}
function criar(host) {
  const id = `cifrao-${++serial}`;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 1000'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.innerHTML = `<defs><clipPath id="${id}-c">${CORPO}</clipPath></defs>
  <g data-ator>
    <g data-marcas fill="none" stroke="var(--cif-body)" stroke-width="34" stroke-linecap="round" opacity="0"><path d="M760 215 815 150M815 275 890 245M700 165 712 95"/></g>
    <text data-duvida x="850" y="230" font-size="300" font-weight="800" font-family="-apple-system, Inter, sans-serif" fill="var(--cif-body)" text-anchor="middle" opacity="0">?</text>
    <g data-volume>
      <g data-cifrao fill="var(--cif-body)">${CORPO}</g>
      <circle data-dot cx="500" cy="520" r="330" fill="var(--cif-body)" opacity="0"/>
      <g clip-path="url(#${id}-c)"><g data-face fill="var(--cif-eyes)"><g data-left><path data-le/></g><g data-right><path data-re/></g></g></g>
    </g>
  </g>`;
  host.appendChild(svg);
  const q = (s) => svg.querySelector(s);
  const ator = { host, svg, atencao: novaAtencao(20261111 + serial * 327), visivel: true, elapsed: 0, seq: 'notice', seqT: 0, gestoEm: 6500 + serial * 1700, gestoI: 0,
    atual: { ...REPOUSO }, origem: { ...REPOUSO }, grupo: q('[data-ator]'), volume: q('[data-volume]'), cifrao: q('[data-cifrao]'), dot: q('[data-dot]'), face: q('[data-face]'),
    marcas: q('[data-marcas]'), duvida: q('[data-duvida]'), left: q('[data-left]'), right: q('[data-right]'), le: q('[data-le]'), re: q('[data-re]') };
  const TOQUE = ['wink', 'hop', 'milestone', 'spin', 'confuso', 'flip', 'proud', 'irritado', 'sonolento', 'notice'];
  host.addEventListener('click', () => ator.tocar(TOQUE[ator.gestoI++ % TOQUE.length]));
  host.addEventListener('pointerenter', () => { ator.atencao = dirigeAtencao(ator.atencao, { x: 0, y: -.25, bodyFollow: .5 }); });
  ator.tocar = (nome) => { const s = EXPRESSOES[nome] ?? nome; if (!K[s]) return; ator.origem = { ...ator.atual }; ator.seq = s; ator.seqT = 0; };
  host.addEventListener('cifrao:expressao', (e) => ator.tocar(e.detail));
  host.addEventListener('cifrao:read-pose', (e) => { e.detail.pose = { ...ator.atual }; });
  host.addEventListener('cifrao:scroll-pose', (e) => { ator.atual = { ...REPOUSO, ...e.detail }; ator.seq = null; desenhar(ator, ator.atual); });
  host.cifrao = ator;
  atores.add(ator); vis.observe(host);
  desenhar(ator, REPOUSO);
}
function desenhar(a, act) {
  const cy = Math.cos(act.yaw), cp = Math.cos(act.pitch), sy = Math.sin(act.yaw), sp = Math.sin(act.pitch), dot = act.dot || 0;
  a.grupo.setAttribute('transform', `translate(${act.x * 1000} ${act.y * 1000}) translate(500 520) rotate(${act.rotation * 180 / Math.PI}) scale(${Math.min(1.13, act.scaleX)} ${Math.min(1.13, act.scaleY)}) translate(-500 -520)`);
  // Giro em torno do eixo vertical: a silhueta estreita até o perfil; de costas, os olhos somem.
  a.volume.setAttribute('transform', `translate(0 ${-90 * (1 - cp)}) translate(500 520) scale(${.3 + .7 * Math.abs(cy)} ${.94 + .06 * Math.abs(cp)}) translate(-500 -520)`);
  a.cifrao.setAttribute('opacity', String(1 - dot));
  a.cifrao.setAttribute('transform', dot ? `translate(500 520) scale(${1 - dot * .5}) translate(-500 -520)` : '');
  a.dot.setAttribute('opacity', String(dot));
  a.dot.setAttribute('r', String(330 * (.4 + .6 * dot)));
  const vis1 = Math.max(0, Math.min(1, cy * cp / .35));
  a.face.setAttribute('opacity', String(vis1 * vis1 * (3 - 2 * vis1) * (1 - dot)));
  a.face.setAttribute('transform', `translate(${sy * 200} ${-sp * 200}) translate(500 414) scale(${cy} ${cp}) translate(-500 -414)`);
  a.marcas.setAttribute('opacity', String(act.marcas * (1 - dot)));
  a.duvida.setAttribute('opacity', String(act.duvida * (1 - dot)));
  for (const [side, cx, wink, smile, ey] of [['left', 433, act.leftWink, act.leftEyeSmile, act.leftEyeScaleY], ['right', 573, act.rightWink, act.rightEyeSmile, act.rightEyeScaleY]]) {
    const w = Math.max(.5, 80 * act.eyeScaleX), h = Math.max(.5, 138 * ey * Math.max(.06, 1 - wink * .94));
    const sp2 = (side === 'left' ? -70 : 70) * (act.eyeSpacing - 1);
    a[side].setAttribute('transform', `translate(${sp2 + act.gazeX * 1000} ${act.gazeY * 1000}) rotate(${act.eyeTilt * 180 / Math.PI} ${cx} 414)`);
    a[side === 'left' ? 'le' : 're'].setAttribute('d', olhoD(cx, 414, w, h, smile));
  }
}
const vis = new IntersectionObserver((es) => { for (const e of es) for (const a of atores) if (a.host === e.target) a.visivel = e.isIntersecting; }, { rootMargin: '80px' });
function montar() {
  for (const a of atores) if (!a.host.isConnected) { vis.unobserve(a.host); atores.delete(a); }
  document.querySelectorAll('.cifrao:not([data-mounted])').forEach((h) => { h.dataset.mounted = '1'; criar(h); });
}
montar();
new MutationObserver((rs) => { if (rs.some((r) => [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1 && (n.matches('.cifrao') || n.querySelector('.cifrao'))))) montar(); }).observe(document.body, { childList: true, subtree: true });
const GESTOS = ['glance-left', 'wink', 'hop', 'glance-right', 'proud', 'spin', 'confuso', 'sonolento', 'notice', 'flip', 'irritado', 'milestone'];
// O olhar segue o ponteiro: cada ator olha na direção do cursor em relação ao próprio centro.
let ultimoPonteiro = 0;
addEventListener('pointermove', (e) => {
  const t = performance.now(); if (t - ultimoPonteiro < 140 || menos.matches) return; ultimoPonteiro = t;
  for (const a of atores) {
    if (!a.visivel || a.host.hasAttribute('data-scroll-suspended')) continue;
    const r = a.host.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (innerWidth / 2), dy = (e.clientY - cy) / (innerHeight / 2);
    if (Math.abs(dx) < .02 && Math.abs(dy) < .02) continue;
    a.atencao = dirigeAtencao(a.atencao, { x: lim(dx * 1.6), y: lim(dy * 1.6), bodyFollow: .7 });
  }
}, { passive: true });
let prev = 0;
function quadro(t) {
  const dt = Math.max(0, Math.min(prev ? t - prev : 16.67, 40));
  prev = t;
  if (!document.hidden) for (const a of atores) {
    if (!a.visivel || a.host.hasAttribute('data-scroll-suspended')) continue;
    if (menos.matches) { if (!a.reduzido) desenhar(a, REPOUSO); a.reduzido = true; continue; }
    a.reduzido = false; a.elapsed += dt;
    a.atencao = passoAtencao(a.atencao, dt);
    let act = a.atencao.pose;
    if (!a.seq && a.elapsed >= a.gestoEm) { a.origem = { ...a.atual }; a.seq = GESTOS[a.gestoI++ % GESTOS.length]; a.seqT = 0; }
    if (a.seq) {
      a.seqT += dt;
      const dur = DURACAO[a.seq], l = a.seqT, cena = seq(a.seq, l);
      act = l < 150 ? mistura(a.origem, cena, l / 150) : l > dur - 190 ? mistura(cena, act, (l - dur + 190) / 190) : cena;
      const e = a.atencao.pose;
      act.gazeX = act.gazeX * .55 + e.gazeX * .45; act.gazeY = act.gazeY * .55 + e.gazeY * .45;
      act.leftWink = Math.max(act.leftWink, e.leftWink); act.rightWink = Math.max(act.rightWink, e.rightWink);
      act.leftEyeSmile = Math.max(act.leftEyeSmile, e.leftEyeSmile); act.rightEyeSmile = Math.max(act.rightEyeSmile, e.rightEyeSmile);
      act.eyeScaleX *= .75 + e.eyeScaleX * .25;
      if (l >= dur) { a.seq = null; a.gestoEm = a.elapsed + 4300 + (a.gestoI % 4) * 1300; }
    }
    const next = { ...act };
    for (const k of CHAVES) {
      const follow = 1 - Math.exp(-52 * dt / 1000), raw = act[k] - a.atual[k];
      const d = ANG(k) ? Math.atan2(Math.sin(raw), Math.cos(raw)) : raw;
      next[k] = Math.abs(d) < .0001 ? act[k] : a.atual[k] + d * follow;
    }
    a.atual = next;
    desenhar(a, next);
  }
  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
window.Cifrao = Object.freeze({ REPOUSO, EXPRESSOES, expressao: (host, nome) => host?.cifrao?.tocar(nome) });
})();
