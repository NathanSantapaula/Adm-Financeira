/* Cifrão, o mascote da AVEN. Um modelo de pose (posição, giro, olhar, piscada, achatamento)
   interpolado por quadros-chave, com um controlador de atenção que respira, olha em volta e pisca.
   SVG puro: corpo preto/creme, olhos recortados, sem braços nem pernas (cartilha). */
(() => {
'use strict';
const REPOUSO = {
  x: 0, y: 0, rotation: 0, yaw: 0, pitch: 0, scaleX: 1, scaleY: 1,
  gazeX: 0, gazeY: 0, leftWink: 0, rightWink: 0, leftEyeSmile: 0, rightEyeSmile: 0,
  eyeScaleX: 1, leftEyeScaleY: 1, rightEyeScaleY: 1, eyeSpacing: 1, eyeTilt: 0,
  marcas: 0, duvida: 0, dot: 0, skew: 0, brilho: 0,
};
const FOCO = { ...REPOUSO, x: -.022, y: -.022, rotation: -.08, yaw: -.18, pitch: -.05, gazeX: -.04, gazeY: .05, scaleY: 1.03, eyeScaleX: 1.2, leftEyeScaleY: .78, rightEyeScaleY: .9, eyeTilt: -.06 };
const DURACAO = { notice: 1160, focus: 960, acknowledge: 700, hop: 960, wink: 900, proud: 1120, milestone: 1760, 'glance-left': 1580, 'glance-right': 1580, spin: 1800, flip: 1880, sonolento: 2400, confuso: 1700, irritado: 1300, erro: 1500, gelatina: 1100, cocegas: 1200, timido: 1500, espreguica: 1900, danca: 1800, espirro: 1500, soluco: 1400, derrete: 1700, segue: 2000, brilha: 1600, tonto: 2200 };
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
// Novas reações: forma que balança, cócegas, timidez, espreguiçar, brilhar, dançar, espirrar, soluçar, derreter, seguir algo com os olhos e ficar tonto.
const RISO = { leftEyeSmile: 1, rightEyeSmile: 1, leftEyeScaleY: .62, rightEyeScaleY: .62, eyeScaleX: 1.15 };
Object.assign(K, {
  gelatina: [
    { at: 0, pose: {} },
    { at: 120, pose: { y: .02, scaleX: 1.1, scaleY: .88, leftEyeScaleY: .7, rightEyeScaleY: .7 } },
    { at: 260, pose: { y: -.02, skew: .22, scaleX: .95, scaleY: 1.06, eyeScaleX: 1.2, leftEyeSmile: .5, rightEyeSmile: .5 } },
    { at: 400, pose: { skew: -.17, scaleX: 1.05, scaleY: .95, leftEyeSmile: .5, rightEyeSmile: .5 } },
    { at: 540, pose: { skew: .11, scaleY: 1.02, leftEyeSmile: .4, rightEyeSmile: .4 } },
    { at: 680, pose: { skew: -.06 } }, { at: 820, pose: { skew: .03 } }, { at: 1100, pose: {} },
  ],
  cocegas: [{ at: 0, pose: {} }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ at: 110 + i * 105, pose: { ...RISO, rotation: (i % 2 ? -.08 : .08) * (1 - i / 11), x: (i % 2 ? -.01 : .01), y: i % 2 ? -.012 : .006, scaleX: i % 2 ? .97 : 1.05, scaleY: i % 2 ? 1.04 : .95 } })), { at: 1200, pose: {} }],
  timido: [
    { at: 0, pose: {} },
    { at: 220, pose: { y: .03, rotation: -.07, scaleX: 1.06, scaleY: .9, gazeX: -.02, gazeY: .05, leftEyeSmile: .7, rightEyeSmile: .7, leftEyeScaleY: .7, rightEyeScaleY: .7 } },
    { at: 650, pose: { y: .032, rotation: -.1, scaleX: 1.07, scaleY: .89, gazeX: .025, gazeY: .045, leftEyeSmile: .8, rightEyeSmile: .8, leftEyeScaleY: .66, rightEyeScaleY: .66 } },
    { at: 950, pose: { y: .03, rotation: -.09, scaleX: 1.06, scaleY: .9, gazeX: .03, gazeY: -.01, leftEyeSmile: .8, rightEyeSmile: .8, leftEyeScaleY: .7, rightEyeScaleY: .7 } },
    { at: 1180, pose: { y: -.012, scaleY: 1.03 } }, { at: 1500, pose: {} },
  ],
  espreguica: [
    { at: 0, pose: {} },
    { at: 300, pose: { y: .022, scaleX: 1.08, scaleY: .88, leftEyeScaleY: .5, rightEyeScaleY: .5 } },
    { at: 800, pose: { y: -.05, scaleX: .9, scaleY: 1.13, rotation: .05, leftWink: 1, rightWink: 1 } },
    { at: 1120, pose: { y: -.05, scaleX: .9, scaleY: 1.13, rotation: -.05, leftWink: 1, rightWink: 1 } },
    { at: 1400, pose: { y: .012, scaleX: 1.06, scaleY: .94, leftEyeSmile: .8, rightEyeSmile: .8 } }, { at: 1900, pose: {} },
  ],
  danca: [{ at: 0, pose: {} }, ...Array.from({ length: 8 }, (_, i) => ({ at: 120 + i * 200, pose: { x: (i % 2 ? .02 : -.02), y: i % 2 ? -.03 : .012, rotation: i % 2 ? .12 : -.12, skew: i % 2 ? -.06 : .06, scaleX: i % 2 ? .97 : 1.05, scaleY: i % 2 ? 1.05 : .95, leftEyeSmile: .9, rightEyeSmile: .9, leftEyeScaleY: .7, rightEyeScaleY: .7, gazeX: i % 2 ? .02 : -.02 } })), { at: 1800, pose: {} }],
  espirro: [
    { at: 0, pose: {} },
    { at: 300, pose: { y: -.01, pitch: -.12, scaleY: 1.04, leftEyeScaleY: .55, rightEyeScaleY: .55, gazeY: -.02 } },
    { at: 650, pose: { y: -.025, pitch: -.2, scaleY: 1.08, scaleX: .95, leftEyeScaleY: .3, rightEyeScaleY: .3, eyeTilt: .08 } },
    { at: 760, pose: { y: .03, pitch: .18, scaleX: 1.12, scaleY: .86, leftWink: 1, rightWink: 1, marcas: 1 } },
    { at: 900, pose: { x: -.01, y: .015, rotation: -.05, scaleX: 1.05, scaleY: .95, leftWink: 1, rightWink: 1, marcas: .6 } },
    { at: 1100, pose: { x: .008, rotation: .04, leftEyeScaleY: .8, rightEyeScaleY: .8, eyeScaleX: 1.1 } }, { at: 1500, pose: {} },
  ],
  soluco: [
    { at: 0, pose: {} },
    { at: 200, pose: {} },
    { at: 280, pose: { y: -.05, scaleX: .94, scaleY: 1.08, eyeScaleX: 1.5, leftEyeScaleY: 1.05, rightEyeScaleY: 1.05 } },
    { at: 420, pose: { y: .008, scaleX: 1.04, scaleY: .96, eyeScaleX: 1.2 } },
    { at: 800, pose: { gazeX: -.02, eyeScaleX: 1.1 } },
    { at: 880, pose: { y: -.055, rotation: .05, scaleX: .94, scaleY: 1.08, eyeScaleX: 1.6, leftEyeScaleY: 1.05, rightEyeScaleY: 1.05, duvida: .8 } },
    { at: 1030, pose: { y: .008, scaleX: 1.04, scaleY: .96, duvida: .8 } }, { at: 1400, pose: {} },
  ],
  derrete: [
    { at: 0, pose: {} },
    { at: 450, pose: { y: .05, scaleX: 1.13, scaleY: .82, skew: .04, leftEyeScaleY: .45, rightEyeScaleY: .45, gazeY: .03, eyeScaleX: 1.15 } },
    { at: 900, pose: { y: .06, scaleX: 1.13, scaleY: .78, skew: -.04, leftEyeScaleY: .4, rightEyeScaleY: .4, gazeY: .035, eyeScaleX: 1.2 } },
    { at: 1100, pose: { y: -.06, scaleX: .92, scaleY: 1.12, eyeScaleX: 1.4, leftEyeScaleY: 1, rightEyeScaleY: 1 } },
    { at: 1300, pose: { y: .012, scaleX: 1.05, scaleY: .95 } }, { at: 1700, pose: {} },
  ],
  segue: [
    { at: 0, pose: {} },
    { at: 250, pose: { gazeX: .04, gazeY: -.045, yaw: .2, pitch: -.12, rotation: .05 } },
    { at: 700, pose: { gazeX: -.01, gazeY: -.05, yaw: -.05, pitch: -.16, rotation: -.02 } },
    { at: 1150, pose: { gazeX: -.045, gazeY: .01, yaw: -.25, rotation: -.07 } },
    { at: 1450, pose: { gazeY: .05, pitch: .14, y: .015, scaleY: .95 } },
    { at: 1650, pose: { y: -.03, scaleY: 1.04, leftEyeSmile: .9, rightEyeSmile: .9, leftEyeScaleY: .7, rightEyeScaleY: .7 } }, { at: 2000, pose: {} },
  ],
  brilha: [
    { at: 0, pose: {} },
    { at: 200, pose: { y: .018, scaleX: 1.07, scaleY: .9, leftEyeScaleY: .75, rightEyeScaleY: .75 } },
    { at: 450, pose: { y: -.05, rotation: .06, scaleX: 1.02, scaleY: 1.07, eyeScaleX: 1.2, leftEyeSmile: 1, rightEyeSmile: 1, leftEyeScaleY: .7, rightEyeScaleY: .7, brilho: 1 } },
    { at: 1100, pose: { y: -.04, rotation: .04, scaleY: 1.05, eyeScaleX: 1.2, leftEyeSmile: 1, rightEyeSmile: 1, leftEyeScaleY: .7, rightEyeScaleY: .7, brilho: 1 } },
    { at: 1350, pose: { y: .008, brilho: 0 } }, { at: 1600, pose: {} },
  ],
  tonto: [{ at: 0, pose: {} }, ...Array.from({ length: 9 }, (_, i) => ({ at: 160 + i * 190, pose: { gazeX: Math.cos(i * 1.4) * .045, gazeY: Math.sin(i * 1.4) * .04, rotation: Math.sin(i * .9) * .11, x: Math.sin(i * .9) * .012, skew: Math.sin(i * .9) * .06, eyeScaleX: .85, leftEyeScaleY: .75, rightEyeScaleY: .9, eyeTilt: Math.sin(i) * .1, duvida: i > 5 ? .7 : 0 } })), { at: 2200, pose: {} }],
});
// Nomes da cartilha → sequências.
const EXPRESSOES = { neutro: null, curioso: 'glance-right', animado: 'hop', sonolento: 'sonolento', confuso: 'confuso', irritado: 'irritado', surpreso: 'notice', confiante: 'proud', comemorando: 'milestone', pensando: 'focus', espiando: 'glance-left', desorientado: 'erro', piscadela: 'wink', giro: 'spin', cambalhota: 'flip', gelatina: 'gelatina', cocegas: 'cocegas', timido: 'timido', espreguica: 'espreguica', danca: 'danca', espirro: 'espirro', soluco: 'soluco', derrete: 'derrete', segue: 'segue', brilha: 'brilha', tonto: 'tonto' };
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
// Silhueta do Cifrão fluido, vetorizada do desenho do Nathan (caixa 1000×1000, centro em 500,520). Os olhos são formas à parte, recortadas sobre o corpo.
const CORPO = `<path d="M532.0 108.0 C543.2 107.0 555.1 106.1 566.0 108.1 C576.9 110.1 589.8 113.3 597.4 120.3 C604.9 127.2 610.3 139.6 611.5 150.0 C612.6 160.5 606.2 172.1 604.1 183.0 C601.9 193.9 594.4 208.4 598.5 215.7 C602.7 222.9 618.1 224.9 628.8 226.6 C639.5 228.3 651.5 225.5 662.8 225.7 C674.2 225.9 685.6 226.2 696.8 227.9 C708.0 229.6 719.3 232.1 729.8 236.1 C740.3 240.1 750.9 245.3 759.8 252.0 C768.8 258.7 777.2 267.2 783.3 276.5 C789.5 285.7 794.4 296.8 796.7 307.6 C798.9 318.4 799.1 330.6 796.9 341.4 C794.6 352.2 789.3 363.1 783.0 372.2 C776.6 381.3 767.8 389.3 758.7 395.9 C749.7 402.5 739.0 407.2 728.7 411.9 C718.4 416.7 707.3 419.7 697.0 424.4 C686.7 429.1 673.4 432.5 666.9 440.0 C660.3 447.6 654.9 461.5 657.8 469.8 C660.8 478.1 675.0 484.1 684.6 489.9 C694.2 495.7 705.3 499.2 715.4 504.5 C725.4 509.7 735.6 514.9 744.9 521.3 C754.3 527.7 763.6 534.7 771.3 542.8 C779.0 551.0 786.0 560.4 791.3 570.3 C796.6 580.2 800.8 591.2 803.2 602.1 C805.7 613.1 806.6 624.7 806.0 636.0 C805.4 647.2 802.9 658.6 799.7 669.4 C796.4 680.2 791.9 690.9 786.4 700.7 C780.8 710.5 773.9 719.8 766.3 728.1 C758.7 736.4 749.9 744.0 740.7 750.5 C731.5 757.0 721.2 762.2 711.1 767.3 C700.9 772.3 690.2 776.3 679.8 780.7 C669.3 785.2 658.4 788.7 648.3 793.8 C638.2 798.9 627.0 803.6 619.3 811.3 C611.7 819.1 607.1 830.2 602.3 840.4 C597.6 850.6 596.1 862.5 590.8 872.4 C585.5 882.3 578.6 891.9 570.6 899.6 C562.5 907.2 552.5 913.6 542.4 918.4 C532.3 923.2 521.0 926.4 509.9 928.7 C498.9 930.9 487.4 932.2 476.1 932.0 C464.9 931.8 452.2 931.9 442.4 927.6 C432.7 923.3 421.0 915.3 417.5 906.3 C414.0 897.2 418.3 883.9 421.5 873.3 C424.7 862.8 438.0 851.1 436.7 843.0 C435.4 834.8 423.2 827.1 413.8 824.3 C404.3 821.6 391.1 826.0 379.8 826.6 C368.4 827.1 357.1 827.7 345.7 827.4 C334.4 827.1 322.9 826.7 311.8 824.7 C300.7 822.7 289.4 819.9 279.1 815.5 C268.8 811.1 258.4 805.4 250.0 798.1 C241.5 790.8 233.7 781.6 228.6 771.8 C223.5 762.0 220.0 750.2 219.5 739.3 C218.9 728.3 221.3 716.3 225.3 706.0 C229.2 695.6 235.9 685.6 243.3 677.3 C250.8 669.0 260.2 661.9 269.8 656.1 C279.4 650.3 290.2 645.7 301.0 642.5 C311.7 639.3 323.2 637.4 334.4 636.7 C345.7 636.1 357.2 637.1 368.4 638.5 C379.6 640.0 390.7 643.0 401.7 645.6 C412.7 648.3 423.5 652.2 434.6 654.6 C445.6 657.0 457.0 660.0 468.1 659.9 C479.3 659.8 492.5 659.3 501.3 654.0 C510.2 648.7 520.9 637.0 521.2 628.3 C521.4 619.5 511.2 608.0 502.8 601.6 C494.5 595.1 481.9 592.7 471.1 589.5 C460.2 586.4 448.9 584.5 437.7 582.6 C426.5 580.7 415.2 579.3 404.0 577.9 C392.7 576.4 381.4 575.4 370.1 573.9 C358.9 572.4 347.6 571.0 336.4 569.0 C325.3 567.0 314.0 565.0 303.1 561.8 C292.3 558.7 281.4 555.0 271.2 550.1 C261.0 545.3 250.8 539.7 242.0 532.7 C233.1 525.8 224.8 517.5 218.1 508.5 C211.4 499.6 205.7 489.3 201.6 478.8 C197.6 468.4 195.0 456.9 194.0 445.8 C193.0 434.6 193.6 422.9 195.6 411.9 C197.5 400.8 201.3 389.8 205.9 379.5 C210.6 369.2 216.7 359.4 223.5 350.3 C230.2 341.3 238.1 332.9 246.4 325.2 C254.6 317.5 263.8 310.5 273.0 304.0 C282.3 297.5 292.2 291.9 302.0 286.0 C311.7 280.2 322.1 275.3 331.5 269.0 C340.9 262.8 351.1 256.7 358.5 248.5 C365.9 240.2 370.8 229.6 375.7 219.5 C380.5 209.4 382.3 197.5 387.8 187.8 C393.3 178.0 400.7 168.9 408.7 161.0 C416.7 153.1 426.3 146.5 435.9 140.5 C445.5 134.5 455.8 129.5 466.2 125.1 C476.7 120.7 487.5 117.1 498.5 114.2 C509.5 111.4 520.7 109.0 532.0 108.0 Z"/>`;
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
    <g data-brilhos fill="var(--cif-body)" opacity="0">${'<path d="M0 -60 L13 -13 L60 0 L13 13 L0 60 L-13 13 L-60 0 L-13 -13Z"/>'.repeat(3)}</g>
    <g data-volume>
      <g data-cifrao fill="var(--cif-body)">${CORPO}</g>
      <circle data-dot cx="500" cy="520" r="330" fill="var(--cif-body)" opacity="0"/>
      <circle data-aro cx="500" cy="520" r="250" fill="none" stroke="var(--cif-eyes)" stroke-width="26" opacity="0"/>
      <g clip-path="url(#${id}-c)"><g data-face fill="var(--cif-eyes)"><g data-left><path data-le/></g><g data-right><path data-re/></g></g></g>
    </g>
  </g>`;
  host.appendChild(svg);
  const q = (s) => svg.querySelector(s);
  const ator = { host, svg, atencao: novaAtencao(20261111 + serial * 327), visivel: true, elapsed: 0, seq: 'notice', seqT: 0, gestoEm: 6500 + serial * 1700, gestoI: 0,
    atual: { ...REPOUSO }, origem: { ...REPOUSO }, grupo: q('[data-ator]'), volume: q('[data-volume]'), cifrao: q('[data-cifrao]'), dot: q('[data-dot]'), face: q('[data-face]'),
    marcas: q('[data-marcas]'), aro: q('[data-aro]'), brilhos: q('[data-brilhos]'), duvida: q('[data-duvida]'), left: q('[data-left]'), right: q('[data-right]'), le: q('[data-le]'), re: q('[data-re]') };
  const TOQUE = ['gelatina', 'wink', 'hop', 'brilha', 'spin', 'timido', 'milestone', 'flip', 'proud', 'confuso', 'danca', 'espirro', 'soluco', 'derrete', 'segue', 'notice', 'glance-right'];
  let ultimo = 0, serie = 0, saco = [], antes = '';
  // Cada toque tira uma reação de um saco embaralhado: todas aparecem antes de repetir. Séries rápidas e o toque depois de muito tempo parado têm reação própria.
  const sorteia = () => { if (!saco.length) { saco = TOQUE.slice().sort(() => Math.random() - .5); if (saco[0] === antes) saco.push(saco.shift()); } return (antes = saco.shift()); };
  host.addEventListener('click', () => {
    const agora = performance.now(), parado = ultimo > 0 && agora - ultimo > 20000;
    serie = agora - ultimo < 450 ? serie + 1 : 1; ultimo = agora;
    let s;
    if (serie >= 6) { s = 'tonto'; serie = 0; } else if (serie === 4) s = 'cocegas';
    else if (serie > 1 && ator.seq) return;
    else if (parado || ator.seq === 'sonolento') s = 'espreguica';
    else s = sorteia();
    ator.tocar(s);
  });
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
  a.grupo.setAttribute('transform', `translate(${act.x * 1000} ${act.y * 1000}) translate(500 520) rotate(${act.rotation * 180 / Math.PI}) skewX(${(act.skew || 0) * 57.3}) scale(${Math.min(1.13, act.scaleX)} ${Math.min(1.13, act.scaleY)}) translate(-500 -520)`);
  // Giro em torno do eixo vertical: a silhueta estreita até o perfil; de costas, os olhos somem.
  a.volume.setAttribute('transform', `translate(0 ${-90 * (1 - cp)}) translate(500 520) scale(${.3 + .7 * Math.abs(cy)} ${.94 + .06 * Math.abs(cp)}) translate(-500 -520)`);
  a.cifrao.setAttribute('opacity', String(1 - dot));
  a.cifrao.setAttribute('transform', dot ? `translate(500 520) scale(${1 - dot * .5}) translate(-500 -520)` : '');
  a.dot.setAttribute('opacity', String(dot));
  a.dot.setAttribute('r', String(330 * (.4 + .6 * dot)));
  a.aro.setAttribute('opacity', String(dot)); a.aro.setAttribute('r', String(250 * (.4 + .6 * dot)));
  const b = act.brilho || 0;
  a.brilhos.setAttribute('opacity', String(Math.min(1, b * 1.4)));
  if (b > .01) { const t = performance.now() / 1000; [[830, 250, 1], [170, 340, .7], [870, 720, .55]].forEach(([px, py, k], i) => a.brilhos.children[i].setAttribute('transform', `translate(${px} ${py}) rotate(${t * 60 + i * 30}) scale(${b * k * (.85 + .15 * Math.sin(t * 9 + i * 2))})`)); }
  const vis1 = Math.max(0, Math.min(1, cy * cp / .35));
  a.face.setAttribute('opacity', String(vis1 * vis1 * (3 - 2 * vis1) * (1 - dot)));
  a.face.setAttribute('transform', `translate(${sy * 200} ${-sp * 200}) translate(478 413) scale(${cy} ${cp}) translate(-478 -413)`);
  a.marcas.setAttribute('opacity', String(act.marcas * (1 - dot)));
  a.duvida.setAttribute('opacity', String(act.duvida * (1 - dot)));
  // Olhos ovais e inclinados, como no desenho.
  for (const [side, cx, oy, wink, smile, ey] of [['left', 402.4, 433.4, act.leftWink, act.leftEyeSmile, act.leftEyeScaleY], ['right', 554.3, 392.6, act.rightWink, act.rightEyeSmile, act.rightEyeScaleY]]) {
    const w = Math.max(.5, 90 * act.eyeScaleX), h = Math.max(.5, 154 * ey * Math.max(.06, 1 - wink * .94));
    const sp2 = (side === 'left' ? -70 : 70) * (act.eyeSpacing - 1);
    a[side].setAttribute('transform', `translate(${sp2 + act.gazeX * 1000} ${act.gazeY * 1000}) rotate(${-18.6 + act.eyeTilt * 180 / Math.PI} ${cx} ${oy})`);
    a[side === 'left' ? 'le' : 're'].setAttribute('d', olhoD(cx, oy, w, h, smile));
  }
}
const vis = new IntersectionObserver((es) => { for (const e of es) for (const a of atores) if (a.host === e.target) a.visivel = e.isIntersecting; }, { rootMargin: '80px' });
function montar() {
  for (const a of atores) if (!a.host.isConnected) { vis.unobserve(a.host); atores.delete(a); }
  document.querySelectorAll('.cifrao:not([data-mounted])').forEach((h) => { h.dataset.mounted = '1'; criar(h); });
}
montar();
new MutationObserver((rs) => { if (rs.some((r) => [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1 && (n.matches('.cifrao') || n.querySelector('.cifrao'))))) montar(); }).observe(document.body, { childList: true, subtree: true });
const GESTOS = ['glance-left', 'wink', 'gelatina', 'hop', 'glance-right', 'brilha', 'proud', 'spin', 'confuso', 'sonolento', 'espreguica', 'notice', 'danca', 'flip', 'derrete', 'irritado', 'milestone'];
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
