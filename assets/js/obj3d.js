/* Voz Acolhedor: objeto 3D de verdade (WebGL) no card do objetivo, um por tipo de objetivo (visualAtual() === '3d').
   Three.js r128 vem do cdnjs só quando essa voz está escolhida, com verificação de integridade (SRI).
   Um único renderizador é reaproveitado: a cada desenho da tela o canvas muda para o card novo (o3Ligar).
   Estúdio: reflexos de softbox gerados na hora (PMREM), luz principal, contraluz azul, tom ACES e sombra de contato suave.
   Os objetos são modelados aqui com geometria (sem arquivos); cada um tem a sua animação de entrada (userData.entra).
   Arrastar gira o objeto, pinça/roda amplia até 1,5x; ao soltar volta devagar ao repouso.
   Sem WebGL, ou se a biblioteca não carregar, o card volta a mostrar a foto do objetivo. Com "reduzir movimento", o objeto fica parado. */
'use strict';
const O3_LIB = { src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', sri: 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu' };
let O3 = null; let o3Carga = null;
const o3Calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const o3Suporta = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };
function o3Biblioteca() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!o3Carga) {
    o3Carga = new Promise((ok, falha) => {
      const s = document.createElement('script'); s.src = O3_LIB.src; s.integrity = O3_LIB.sri; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
      s.onload = () => (window.THREE ? ok(window.THREE) : falha(new Error('three'))); s.onerror = () => falha(new Error('three')); document.head.appendChild(s);
    });
    o3Carga.catch(() => { o3Carga = null; });
  }
  return o3Carga;
}

/* ---------- materiais ---------- */
function o3Mat() {
  const T = THREE; const fis = (o) => new T.MeshPhysicalMaterial(o);
  return {
    ouro: fis({ color: 0xF4C55A, metalness: 1, roughness: 0.17, clearcoat: 0.5, clearcoatRoughness: 0.08 }),
    rose: fis({ color: 0xF0B49A, metalness: 1, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.08 }),
    platina: fis({ color: 0xE8EDF4, metalness: 1, roughness: 0.14, clearcoat: 0.6 }),
    diamante: fis({ color: 0xF2FAFF, metalness: 0.15, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3.2, flatShading: true }),
    pintura: fis({ color: 0xE3233A, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 }),
    vidro: fis({ color: 0x0A1426, metalness: 0.3, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0 }),
    borracha: new T.MeshStandardMaterial({ color: 0x15171C, roughness: 0.78, metalness: 0 }),
    cromo: new T.MeshStandardMaterial({ color: 0xDDE3EA, metalness: 1, roughness: 0.12 }),
    grafite: fis({ color: 0x2A2F38, metalness: 0.6, roughness: 0.35, clearcoat: 0.5 }),
    farol: new T.MeshStandardMaterial({ color: 0xFFF4D2, emissive: 0xFFE7A8, emissiveIntensity: 1.6 }),
    lanterna: new T.MeshStandardMaterial({ color: 0xFF3B3B, emissive: 0xE0102C, emissiveIntensity: 1.2 }),
    branco: fis({ color: 0xF6F8FB, metalness: 0.05, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 }),
    azul: fis({ color: 0x1F6FE5, metalness: 0.3, roughness: 0.3, clearcoat: 1 }),
    cinza: new T.MeshStandardMaterial({ color: 0xA9B4C4, metalness: 0.7, roughness: 0.3 }),
    nuvem: new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, metalness: 0 }),
    parede: fis({ color: 0xF1E6D6, roughness: 0.6, clearcoat: 0.2, envMapIntensity: 0.6 }),
    lojaParede: fis({ color: 0xFFF1DC, roughness: 0.55, clearcoat: 0.3 }),
    telhado: fis({ color: 0xC2553A, roughness: 0.45, clearcoat: 0.35 }),
    madeira: fis({ color: 0x6E4223, roughness: 0.5, clearcoat: 0.3 }),
    janela: new T.MeshStandardMaterial({ color: 0xFFC86B, emissive: 0xFFB13D, emissiveIntensity: 1.5 }),
    grama: fis({ color: 0x3F9A4E, roughness: 0.75, envMapIntensity: 0.45 }),
    couro: fis({ color: 0x6B3B1C, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    couroEsc: fis({ color: 0x4A2610, roughness: 0.5, clearcoat: 0.4 }),
    marinho: fis({ color: 0x18244A, roughness: 0.5, clearcoat: 0.5 }),
    pelucia: fis({ color: 0x9A5F33, roughness: 0.95, sheen: new T.Color(0xD9A577) }),
    peluciaClara: fis({ color: 0xEBC9A0, roughness: 0.95 }),
    mel: fis({ color: 0xE3A65E, roughness: 0.95, sheen: new T.Color(0xFFE6BF) }),
    melClaro: fis({ color: 0xF8E3C0, roughness: 0.95 }),
    nariz: fis({ color: 0x2B1A12, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
    bochecha: fis({ color: 0xF59A9A, roughness: 0.9 }),
    brilho: new T.MeshBasicMaterial({ color: 0xFFFFFF }),
    olho: fis({ color: 0x0B0B0F, roughness: 0.05, clearcoat: 1 }),
    fita: fis({ color: 0x4D8CFF, roughness: 0.35, clearcoat: 0.6 }),
    rosa: fis({ color: 0xFF6FA5, roughness: 0.35, clearcoat: 0.6 }),
    areia: fis({ color: 0xE8C27E, roughness: 0.9, envMapIntensity: 0.5 }),
    coral: fis({ color: 0xFF5A5F, roughness: 0.38, clearcoat: 0.5, side: T.DoubleSide }),
    lona: fis({ color: 0xFFF8EE, roughness: 0.42, clearcoat: 0.4, side: T.DoubleSide }),
    sol: new T.MeshStandardMaterial({ color: 0xFFC94A, emissive: 0xFFB020, emissiveIntensity: 1.4 }),
    papel: fis({ color: 0xF7F3EA, roughness: 0.8 }),
    pedra: fis({ color: 0xB9BEC6, roughness: 0.75, envMapIntensity: 0.6 }),
    concreto: fis({ color: 0x3A4150, roughness: 0.55, clearcoat: 0.3 }),
    madeiraClara: fis({ color: 0xB9824F, roughness: 0.45, clearcoat: 0.5 }),
    vaso: fis({ color: 0xD9713F, roughness: 0.5, clearcoat: 0.4 }),
    agua: fis({ color: 0x0FA5CF, roughness: 0.12, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.05, emissive: 0x06617F, emissiveIntensity: 0.55, envMapIntensity: 0.55 }),
    folha: fis({ color: 0x2E9C47, roughness: 0.55, clearcoat: 0.25, envMapIntensity: 0.55, side: THREE.DoubleSide }),
    tronco: fis({ color: 0x9A6B3E, roughness: 0.8 }),
    troncoEsc: fis({ color: 0x6E4A28, roughness: 0.85 }),
    coco: fis({ color: 0x5B3A1E, roughness: 0.6, clearcoat: 0.3 }),
    halo: new THREE.MeshBasicMaterial({ color: 0xFFB020, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }),
  };
}
// textura desenhada no aparelho (cifrão da moeda, estampa da nota)
function o3Textura(desenha, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; desenha(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }

/* ---------- ajudantes de forma e de animação ---------- */
const V2 = (x, y) => new THREE.Vector2(x, y);
const o3Faixa = (e, a, b) => Math.min(1, Math.max(0, (e - a) / (b - a)));
const o3Saida = (x) => 1 - Math.pow(1 - x, 3);
const o3Mola = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); // passa um pouco e volta
const o3Quique = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
// guarda a pose de repouso da peça; a entrada parte dela a cada quadro e termina exatamente nela
function o3Pose(m) { m.userData.p0 = m.position.clone(); m.userData.r0 = m.rotation.clone(); m.userData.s0 = m.scale.clone(); return m; }
function o3Repouso(m) { m.position.copy(m.userData.p0); m.rotation.copy(m.userData.r0); m.scale.copy(m.userData.s0); return m; }
function o3RR(w, h, r) {
  const s = new THREE.Shape(); const x = w / 2, y = h / 2; r = Math.max(0.0005, Math.min(r, x * 0.999, y * 0.999));
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5); return s;
}
// caixa com todas as arestas arredondadas (sem RoundedBoxGeometry, que é addon): retângulo arredondado extrudado com bisel
function o3Bloco(w, h, d, r, mat, seg) {
  const b = Math.max(0.001, Math.min(r, d / 2 - 0.002, w / 2 - 0.002, h / 2 - 0.002));
  const geo = new THREE.ExtrudeGeometry(o3RR(w - 2 * b, h - 2 * b, r - b), { depth: Math.max(d - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg || 4, curveSegments: 6 });
  geo.center(); return new THREE.Mesh(geo, mat);
}
// brilho de quatro pontas (sprite aditivo) para anel, estrela e moedas
function o3BrilhoMat() {
  const tx = o3Textura((x, w) => { const c = w / 2; const gr = x.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,244,214,.85)'); gr.addColorStop(1, 'rgba(255,214,140,0)');
    x.fillStyle = gr; x.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = i % 2 ? c * 0.13 : c; x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } x.closePath(); x.fill(); }, 128, 128);
  return new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}
function o3Brilhos(g, mat, lista) { return lista.map(([x, y, z, s]) => { const b = new THREE.Sprite(mat); b.position.set(x, y, z); b.scale.setScalar(s); g.add(b); return o3Pose(b); }); }
// os brilhos piscam: acendem no fim da entrada e depois cintilam devagar
function o3Cintila(bs, e, t, a) { const f = o3Faixa(e, a, 1); bs.forEach((b, i) => { o3Repouso(b); const k = Math.sin(f * Math.PI) * 1.3 + o3Faixa(e, 0.9, 1) * (0.55 + 0.45 * Math.sin(t * 2.6 + i * 2.1)); b.scale.multiplyScalar(Math.max(0.001, k)); b.material.rotation = t * 0.4; }); }

/* ---------- objetos ---------- */
// moeda: corpo com aro em relevo, borda serrilhada e cifrão em relevo; o kit é compartilhado por todas as moedas da cena
function o3MoedaKit(M) {
  const T = THREE;
  const relevo = o3Textura((x, w) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, w); x.fillStyle = '#fff'; x.font = `800 ${w * 0.58}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', w / 2, w * 0.53);
    x.strokeStyle = '#fff'; x.lineWidth = w * 0.03; x.beginPath(); x.arc(w / 2, w / 2, w * 0.42, 0, Math.PI * 2); x.stroke(); }, 256, 256);
  const serra = o3Textura((x, w, h) => { for (let i = 0; i < w; i += 4) { x.fillStyle = '#fff'; x.fillRect(i, 0, 2, h); x.fillStyle = '#000'; x.fillRect(i + 2, 0, 2, h); } }, 512, 4);
  const face = M.ouro.clone(); face.bumpMap = relevo; face.bumpScale = 0.025; const borda = M.ouro.clone(); borda.bumpMap = serra; borda.bumpScale = 0.012;
  const perfil = [V2(0, -0.05), V2(0.41, -0.05), V2(0.43, -0.075), V2(0.475, -0.075), V2(0.5, -0.05), V2(0.5, 0.05), V2(0.475, 0.075), V2(0.43, 0.075), V2(0.41, 0.05), V2(0, 0.05)];
  return { corpo: new T.LatheGeometry(perfil, 64), disco: new T.CircleGeometry(0.41, 48), aro: new T.CylinderGeometry(0.503, 0.503, 0.075, 96, 1, true), face, borda };
}
function o3Moeda(M, kit, ambas) {
  const T = THREE; const g = new T.Group(); kit = kit || o3MoedaKit(M); ambas = ambas !== false && (ambas || !kit.pilha);
  g.add(new T.Mesh(kit.corpo, M.ouro), new T.Mesh(kit.aro, kit.borda));
  (ambas ? [1, -1] : [1]).forEach((ld) => { const d = new T.Mesh(kit.disco, kit.face); d.rotation.x = (-ld * Math.PI) / 2; d.position.y = ld * 0.0505; g.add(d); });
  return g;
}
const O3_OBJ = {
  // par de alianças entrelaçadas (ouro e ouro rosé), solitário lapidado com garras; entra girando e o diamante brilha
  casamento(M) {
    const T = THREE; const g = new T.Group(); const par = new T.Group(); g.add(par);
    const perfil = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); perfil.push(V2(0.6 + 0.07 * Math.sign(c) * Math.pow(Math.abs(c), 0.55), 0.12 * Math.sign(s) * Math.pow(Math.abs(s), 0.55))); }
    const aroG = new T.LatheGeometry(perfil, 128); aroG.rotateX(Math.PI / 2); // aro de seção arredondada, eixo em z
    const a1 = new T.Group(); a1.add(new T.Mesh(aroG, M.ouro));
    const cesto = new T.Mesh(new T.LatheGeometry([V2(0.05, 0), V2(0.1, 0.04), V2(0.14, 0.12), V2(0.12, 0.135), V2(0, 0.1)], 32), M.ouro); cesto.position.y = 0.63; a1.add(cesto);
    const gema = new T.Mesh(new T.LatheGeometry([V2(0, -0.2), V2(0.24, 0), V2(0.24, 0.03), V2(0.15, 0.12), V2(0, 0.12)], 10), M.diamante); gema.position.y = 0.83; a1.add(gema);
    for (let i = 0; i < 4; i++) { const ang = (i / 4) * Math.PI * 2 + Math.PI / 4; const p = new T.Mesh(new T.CylinderGeometry(0.02, 0.024, 0.24, 10), M.ouro); p.position.set(Math.cos(ang) * 0.19, 0.8, Math.sin(ang) * 0.19); p.rotation.z = -Math.cos(ang) * 0.3; p.rotation.x = Math.sin(ang) * 0.3; a1.add(p); }
    const a2 = new T.Mesh(aroG, M.rose); a2.position.set(0.44, -0.36, -0.05); a2.rotation.set(0.25, 1.2, 0.2);
    par.add(a1, a2); o3Pose(par);
    const bs = o3Brilhos(g, o3BrilhoMat(), [[0.12, 1.0, 0.3, 0.42], [-0.32, 0.9, 0.2, 0.22], [0.75, 0.1, 0.4, 0.2]]);
    g.rotation.set(0.15, -0.35, 0); g.userData.dur = 1.9;
    g.userData.entra = (e, t) => { const f = o3Faixa(e, 0, 0.75); o3Repouso(par); par.rotation.y += (1 - o3Saida(f)) * Math.PI * 4; par.scale.setScalar(Math.max(0.001, o3Mola(f))); par.rotation.z += Math.sin(t * 0.7) * 0.04 * e; o3Cintila(bs, e, t, 0.62); };
    return g;
  },
  // pilha de moedas, uma segunda pilha atrás, uma moeda encostada de frente e outra no ar; as moedas caem e empilham
  reserva(M) {
    const T = THREE; const g = new T.Group(); const kit = o3MoedaKit(M); const pilha = [];
    const empilha = (x, z, n, a0) => { kit.pilha = true; for (let i = 0; i < n; i++) { const m = o3Moeda(M, kit); m.position.set(x + Math.sin(i * 2.1 + x * 7) * 0.025, 0.075 + i * 0.152, z + Math.cos(i * 1.7 + z * 5) * 0.025); m.rotation.y = i * 0.9; g.add(o3Pose(m)); pilha.push([m, a0 + i * 0.075]); } kit.pilha = false; };
    empilha(-0.28, 0, 7, 0); empilha(0.66, -0.45, 4, 0.04);
    const heroi = o3Moeda(M, kit, true); heroi.position.set(-0.2, 0.47, 0.8); heroi.rotation.set(1.15, 0, 0.12); g.add(o3Pose(heroi));
    const voa = o3Moeda(M, kit, true); voa.position.set(0.82, 1.38, 0.2); voa.rotation.set(1.05, 0.3, -0.55); g.add(o3Pose(voa));
    const bs = o3Brilhos(g, o3BrilhoMat(), [[-0.55, 1.25, 0.5, 0.26], [1.15, 1.75, 0.3, 0.2]]);
    g.rotation.set(0.28, -0.38, 0); g.userData.dur = 2.1;
    g.userData.entra = (e, t) => {
      pilha.forEach(([m, a]) => { const f = o3Faixa(e, a, a + 0.22); o3Repouso(m); m.position.y += (1 - o3Quique(f)) * 3; m.visible = f > 0; });
      const h = o3Faixa(e, 0.5, 0.78); o3Repouso(heroi); heroi.scale.setScalar(Math.max(0.001, o3Mola(h))); heroi.rotation.z += (1 - o3Saida(h)) * Math.PI * 3;
      const v = o3Faixa(e, 0.62, 1); o3Repouso(voa); voa.position.y += (1 - o3Saida(v)) * 2.2 + Math.sin(t * 1.6) * 0.05 * e; voa.rotation.x += (1 - o3Saida(v)) * 9; voa.rotation.y += Math.sin(t * 1.1) * 0.3 * e; voa.visible = v > 0;
      o3Cintila(bs, e, t, 0.75);
    };
    return g;
  },
  // blocos de dinheiro: maços de notas verdes cintados, empilhados em pirâmide, e um maço solto no ar; os maços chegam deslizando dos lados
  independencia(M) {
    const T = THREE; const g = new T.Group();
    const nota = o3Textura((x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2BCB63'); gr.addColorStop(0.5, '#0E8A3C'); gr.addColorStop(1, '#055C26'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(220,255,232,.7)'; x.lineWidth = 5; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = 'rgba(220,255,232,.85)'; x.beginPath(); x.ellipse(w * 0.72, h / 2, h * 0.3, h * 0.3, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#E6FFEE'; x.font = `800 ${h * 0.26}px Arial, sans-serif`; x.textBaseline = 'middle'; x.fillText('100', w * 0.08, h * 0.3); x.font = `700 ${h * 0.16}px Arial, sans-serif`; x.fillText('REAIS', w * 0.08, h * 0.72);
      x.fillStyle = '#0B6B2F'; x.font = `800 ${h * 0.24}px Arial, sans-serif`; x.textAlign = 'center'; x.fillText('R$', w * 0.72, h * 0.53); }, 512, 240);
    // lateral do maço: as bordas das notas empilhadas
    const borda = o3Textura((x, w, h) => { for (let i = 0; i < h; i += 2) { x.fillStyle = i % 4 ? '#3FB868' : '#0A6E30'; x.fillRect(0, i, w, 2); } }, 64, 128);
    const topo = new T.MeshPhysicalMaterial({ map: nota, roughness: 0.7, envMapIntensity: 0.35 }); const lado = new T.MeshPhysicalMaterial({ map: borda, roughness: 0.9, envMapIntensity: 0.3 }); // pouco reflexo: o verde fica forte
    const cinta = new T.MeshPhysicalMaterial({ color: 0xE9C877, roughness: 0.4, clearcoat: 0.5 }); const L = 1.0, A = 0.2, P = 0.46; const macoG = new T.BoxGeometry(L, A, P);
    const maco = () => { const m = new T.Group(); m.add(new T.Mesh(macoG, [lado, lado, topo, topo, lado, lado])); m.add(o3Bloco(0.17, A + 0.016, P + 0.016, 0.008, cinta)); return m; };
    const pos = [[0, -0.42, -0.5, 0.04], [0, -0.42, 0, -0.03], [0, -0.42, 0.5, 0.05], [0.02, -0.21, -0.25, -0.06], [-0.02, -0.21, 0.25, 0.04], [0, 0, 0, 0.08]];
    const macos = pos.map(([x, y, z, r]) => { const m = maco(); m.position.set(x, y, z); m.rotation.y = r; g.add(o3Pose(m)); return m; });
    const solto = maco(); solto.position.set(0.55, 0.42, 0.15); solto.rotation.set(0.5, 0.6, 0.35); g.add(o3Pose(solto));
    g.rotation.set(0.32, -0.6, 0); g.userData.dur = 1.9;
    g.userData.entra = (e, t) => {
      macos.forEach((m, i) => { const f = o3Saida(o3Faixa(e, i * 0.09, i * 0.09 + 0.3)); o3Repouso(m); m.position.x += (i % 2 ? 1 : -1) * (1 - f) * 2.6; m.position.y += (1 - f) * 0.35; m.rotation.y += (1 - f) * (i % 2 ? 1.4 : -1.4); m.visible = f > 0; });
      const s = o3Faixa(e, 0.58, 1); o3Repouso(solto); solto.position.y += (1 - o3Saida(s)) * 1.8 + Math.sin(t * 1.4) * 0.04 * e; solto.rotation.x += (1 - o3Saida(s)) * Math.PI * 2; solto.rotation.z += Math.sin(t * 0.9) * 0.06 * e; solto.visible = s > 0;
    };
    return g;
  },
  // carro compacto de pintura vermelha envernizada, cabine de vidro, teto e colunas na cor, rodas com raios; entra andando e freia
  carro(M) {
    const T = THREE; const g = new T.Group(); const chassi = new T.Group(); const lata = new T.Group(); g.add(chassi); chassi.add(lata);
    // perfil lateral (o bisel de 0,09 engorda tudo: as caixas de roda aqui são maiores do que ficam)
    const s = new T.Shape(); s.moveTo(-1.0, -0.02); s.lineTo(-0.92, -0.02); s.absarc(-0.58, -0.02, 0.34, Math.PI, 0, true); s.lineTo(0.24, -0.02); s.absarc(0.58, -0.02, 0.34, Math.PI, 0, true);
    s.lineTo(1.0, -0.02); s.quadraticCurveTo(1.06, 0.12, 0.98, 0.26); s.quadraticCurveTo(0.9, 0.34, 0.6, 0.36); s.lineTo(-0.7, 0.38); s.quadraticCurveTo(-0.98, 0.37, -1.0, 0.2); s.lineTo(-1.0, -0.02);
    const corpo = new T.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 6, curveSegments: 24 }); corpo.translate(0, 0, -0.4); lata.add(new T.Mesh(corpo, M.pintura));
    const c = new T.Shape(); c.moveTo(-0.78, 0.4); c.lineTo(0.28, 0.4); c.quadraticCurveTo(0.1, 0.72, -0.1, 0.76); c.lineTo(-0.5, 0.76); c.quadraticCurveTo(-0.74, 0.74, -0.78, 0.4);
    const cab = new T.ExtrudeGeometry(c, { depth: 0.66, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 5, curveSegments: 16 }); cab.translate(0, 0, -0.33); lata.add(new T.Mesh(cab, M.vidro));
    const peca = (m, x, y, z) => { m.position.set(x, y, z); lata.add(m); return m; };
    peca(o3Bloco(0.58, 0.07, 0.84, 0.035, M.pintura), -0.3, 0.81, 0); // teto
    peca(o3Bloco(0.08, 0.4, 0.8, 0.03, M.pintura), -0.27, 0.58, 0); // coluna do meio
    peca(o3Bloco(0.16, 0.11, 1.0, 0.05, M.grafite), 1.1, -0.05, 0); peca(o3Bloco(0.16, 0.11, 1.0, 0.05, M.grafite), -1.1, -0.05, 0); // para-choques
    peca(o3Bloco(0.05, 0.08, 0.44, 0.03, M.grafite), 1.11, 0.1, 0); // grade
    [1, -1].forEach((d) => { const f = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.05, 24), M.farol); f.rotation.z = Math.PI / 2; peca(f, 1.1, 0.24, d * 0.3);
      peca(o3Bloco(0.05, 0.09, 0.2, 0.03, M.lanterna), -1.1, 0.27, d * 0.3); peca(o3Bloco(0.1, 0.07, 0.08, 0.03, M.pintura), 0.22, 0.5, d * 0.47); });
    const pneuG = new T.LatheGeometry([V2(0.12, -0.1), V2(0.19, -0.1), V2(0.215, -0.085), V2(0.228, -0.04), V2(0.23, 0), V2(0.228, 0.04), V2(0.215, 0.085), V2(0.19, 0.1), V2(0.12, 0.1)], 48);
    const aroG = new T.CylinderGeometry(0.14, 0.14, 0.17, 32); const raioG = new T.BoxGeometry(0.035, 0.02, 0.25); const cuboG = new T.CylinderGeometry(0.045, 0.045, 0.03, 20); const rodas = [];
    [[-0.58, 1], [0.58, 1], [-0.58, -1], [0.58, -1]].forEach(([x, d]) => { const r = new T.Group(); r.position.set(x, -0.06, d * 0.44); r.rotation.x = (d * Math.PI) / 2; // y local = eixo, para fora
      r.add(new T.Mesh(pneuG, M.borracha), new T.Mesh(aroG, M.grafite)); for (let i = 0; i < 5; i++) { const k = new T.Mesh(raioG, M.cromo); k.position.y = 0.088; k.rotation.y = (i / 5) * Math.PI; r.add(k); }
      const cubo = new T.Mesh(cuboG, M.cromo); cubo.position.y = 0.095; r.add(cubo); chassi.add(r); rodas.push([r, d]); });
    g.rotation.set(0.2, -0.62, 0); g.userData.dur = 1.7;
    g.userData.entra = (e) => { const f = o3Saida(o3Faixa(e, 0, 0.62)); const dx = -(1 - f) * 4.2; chassi.position.x = dx; rodas.forEach(([r, d]) => { r.rotation.y = (-d * dx) / 0.23; });
      const b = o3Faixa(e, 0.5, 1); lata.rotation.z = -Math.sin(b * Math.PI * 2) * (1 - b) * 0.07; lata.position.y = (1 - f) * Math.abs(Math.sin(dx * 3)) * 0.03; };
    return g;
  },
  // casa moderna em dois volumes, janelas acesas por dentro, piscina, árvores, caminho de pedras e a chave dourada no ar; a casa sobe do chão
  imovel(M) {
    const T = THREE; const g = new T.Group(); const casa = new T.Group(); casa.position.y = -0.61; g.add(o3Pose(casa));
    const caixa = (w, h, d, mat, x, y, z, pai = casa, r = 0.025) => { const m = o3Bloco(w, h, d, r, mat); m.position.set(x, pai === casa ? y + 0.61 : y, z); pai.add(m); return m; };
    const base = new T.Mesh(new T.CylinderGeometry(1.18, 1.24, 0.1, 72), M.grama); base.position.y = -0.66; g.add(base);
    const borda = new T.Mesh(new T.CylinderGeometry(1.25, 1.28, 0.08, 72), M.pedra); borda.position.y = -0.74; g.add(borda);
    caixa(1.1, 0.46, 0.78, M.parede, -0.12, -0.38, -0.05); // térreo
    caixa(1.22, 0.05, 0.9, M.concreto, -0.12, -0.13, -0.05); // laje do térreo
    caixa(0.78, 0.4, 0.62, M.madeiraClara, 0.12, 0.09, -0.1); // andar de cima, revestido de madeira
    caixa(0.94, 0.06, 0.76, M.concreto, 0.12, 0.315, -0.1); // telhado
    caixa(0.52, 0.3, 0.02, M.janela, -0.3, -0.38, 0.345); caixa(0.02, 0.3, 0.46, M.janela, 0.435, -0.38, -0.02); // vidros do térreo
    caixa(0.5, 0.2, 0.02, M.janela, 0.12, 0.1, 0.21); caixa(0.02, 0.2, 0.36, M.janela, 0.51, 0.1, -0.1); // faixa de vidro de cima
    caixa(0.18, 0.34, 0.03, M.madeira, 0.18, -0.44, 0.35); // porta
    caixa(0.6, 0.03, 0.3, M.madeiraClara, -0.3, -0.595, 0.5, g); // deck de madeira, acima da grama (na mesma altura, as duas superfícies brigavam e piscavam)
    caixa(0.62, 0.05, 0.38, M.pedra, 0.52, -0.6, 0.55, g); const agua = caixa(0.54, 0.04, 0.3, M.agua, 0.52, -0.57, 0.55, g); o3Pose(agua); // piscina
    [[-0.08, -0.6, 0.72], [0.02, -0.6, 0.88], [-0.12, -0.6, 1.0]].forEach(([x, y, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.02, 20), M.pedra); p.position.set(x, y, z); g.add(p); });
    const arvores = []; const arvore = (x, z, s) => { const a = new T.Group(); const tr = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.3, 10), M.tronco); tr.position.y = 0.15; a.add(tr);
      [[0, 0.42, 0, 0.2], [0.09, 0.34, 0.04, 0.14], [-0.08, 0.36, -0.03, 0.15]].forEach(([fx, fy, fz, r]) => { const f = new T.Mesh(new T.SphereGeometry(r, 24, 16), M.folha); f.position.set(fx, fy, fz); a.add(f); });
      a.position.set(x, -0.61, z); a.scale.setScalar(s); g.add(o3Pose(a)); arvores.push(a); };
    arvore(-0.85, 0.35, 1); arvore(-0.75, -0.55, 0.8); arvore(0.85, -0.45, 0.9);
    const chave = new T.Group(); const arg = new T.Mesh(new T.TorusGeometry(0.11, 0.035, 24, 64), M.ouro); const haste = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.42, 16), M.ouro);
    haste.rotation.z = Math.PI / 2; haste.position.x = 0.32; const d1 = o3Bloco(0.05, 0.1, 0.04, 0.012, M.ouro); d1.position.set(0.45, -0.06, 0); const d2 = o3Bloco(0.05, 0.08, 0.04, 0.012, M.ouro); d2.position.set(0.36, -0.05, 0);
    chave.add(arg, haste, d1, d2); chave.position.set(0.5, 0.72, 0.25); chave.rotation.set(0.4, -0.5, 0.5); g.add(o3Pose(chave));
    g.rotation.set(0.32, -0.62, 0); g.userData.zoom = 1.08; g.userData.dur = 1.9;
    g.userData.entra = (e, t) => {
      const f = o3Faixa(e, 0.05, 0.55); o3Repouso(casa); casa.scale.set(1 + (1 - f) * 0.15, Math.max(0.001, o3Mola(f)), 1 + (1 - f) * 0.15); casa.visible = f > 0;
      o3Repouso(agua); agua.scale.set(Math.max(0.001, o3Saida(o3Faixa(e, 0.2, 0.5))), 1, 1);
      arvores.forEach((a, i) => { const k = o3Faixa(e, 0.35 + i * 0.1, 0.6 + i * 0.1); o3Repouso(a); a.scale.multiplyScalar(Math.max(0.001, o3Mola(k))); });
      const c = o3Faixa(e, 0.6, 1); o3Repouso(chave); chave.position.y += (1 - o3Quique(c)) * 1.6 + Math.sin(t * 1.5) * 0.04 * e; chave.rotation.y += (1 - c) * 6 + Math.sin(t * 0.8) * 0.3 * e; chave.visible = c > 0;
    };
    return g;
  },
  // avião de linha gordinho: fuselagem lisa, janelas em fila (instanciadas), asas com winglets, motores e nuvens fofas; entra voando em curva e inclinando
  viagem(M) {
    const T = THREE; const g = new T.Group(); const av = new T.Group(); av.rotation.order = 'YZX'; const S = new T.SphereGeometry(1, 32, 20);
    const perfil = new T.SplineCurve([V2(0, -1.12), V2(0.1, -1.04), V2(0.2, -0.75), V2(0.27, -0.3), V2(0.285, 0.25), V2(0.27, 0.62), V2(0.21, 0.92), V2(0.1, 1.08), V2(0, 1.13)]).getPoints(48);
    const raio = (x) => perfil.reduce((a, p) => (Math.abs(p.y - x) < Math.abs(a.y - x) ? p : a)).x;
    const fus = new T.Mesh(new T.LatheGeometry(perfil, 56), M.branco); fus.rotation.z = -Math.PI / 2; av.add(fus); // eixo da fuselagem em x, nariz para +x
    const cab = new T.Mesh(S, M.vidro); cab.scale.set(0.2, 0.1, 0.19); cab.position.set(0.84, 0.12, 0); cab.rotation.z = -0.55; av.add(cab);
    const jg = new T.CylinderGeometry(0.042, 0.042, 0.03, 20); jg.rotateX(Math.PI / 2); const xs = [-0.55, -0.4, -0.25, -0.1, 0.05, 0.2, 0.35, 0.5];
    const jan = new T.InstancedMesh(jg, M.vidro, xs.length * 2); const mx = new T.Matrix4(); let n = 0;
    xs.forEach((x) => [1, -1].forEach((d) => { const r = raio(x); mx.makeTranslation(x, 0.09, d * Math.sqrt(r * r - 0.0081)); jan.setMatrixAt(n++, mx); })); av.add(jan);
    const asa = new T.Shape(); asa.moveTo(-0.28, 0); asa.lineTo(0.32, 0); asa.quadraticCurveTo(0.1, 0.55, -0.12, 0.98); asa.quadraticCurveTo(-0.2, 1.06, -0.3, 1.0); asa.lineTo(-0.28, 0);
    const asaG = new T.ExtrudeGeometry(asa, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 12 }); asaG.rotateX(-Math.PI / 2); asaG.translate(0, -0.02, 0);
    const est = new T.Shape(); est.moveTo(-1.02, 0); est.lineTo(-0.76, 0); est.quadraticCurveTo(-0.86, 0.2, -0.95, 0.36); est.quadraticCurveTo(-1.0, 0.41, -1.06, 0.36); est.lineTo(-1.02, 0);
    const estG = new T.ExtrudeGeometry(est, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 10 }); estG.rotateX(-Math.PI / 2);
    const nac = new T.LatheGeometry([V2(0.07, -0.18), V2(0.09, -0.15), V2(0.105, -0.05), V2(0.105, 0.1), V2(0.097, 0.17), V2(0.08, 0.19), V2(0.068, 0.17)], 32);
    [1, -1].forEach((d) => { const a = new T.Mesh(asaG, M.branco); a.position.y = -0.12; a.scale.z = d; av.add(a);
      const e2 = new T.Mesh(estG, M.branco); e2.position.y = 0.04; e2.scale.z = d; av.add(e2);
      const wl = o3Bloco(0.2, 0.22, 0.04, 0.02, M.azul); wl.position.set(-0.24, -0.02, -d * 1.0); wl.rotation.z = 0.35; av.add(wl);
      const mot = new T.Group(); const casco = new T.Mesh(nac, M.cinza); casco.rotation.z = -Math.PI / 2; mot.add(casco);
      const boca = new T.Mesh(new T.CircleGeometry(0.07, 24), M.borracha); boca.rotation.y = Math.PI / 2; boca.position.x = 0.16; mot.add(boca);
      const cone = new T.Mesh(new T.ConeGeometry(0.035, 0.07, 16), M.cromo); cone.rotation.z = -Math.PI / 2; cone.position.x = 0.18; mot.add(cone);
      const lab = new T.Mesh(new T.TorusGeometry(0.086, 0.016, 12, 32), M.azul); lab.rotation.y = Math.PI / 2; lab.position.x = 0.18; mot.add(lab);
      const pil = o3Bloco(0.16, 0.08, 0.03, 0.012, M.branco); pil.position.set(0.0, 0.1, 0); mot.add(pil); mot.position.set(0.12, -0.25, -d * 0.48); av.add(mot); });
    const ld = new T.Shape(); ld.moveTo(-1.0, 0.12); ld.lineTo(-0.62, 0.12); ld.quadraticCurveTo(-0.85, 0.35, -0.95, 0.62); ld.quadraticCurveTo(-1.0, 0.68, -1.06, 0.62); ld.lineTo(-1.0, 0.12);
    const ldG = new T.ExtrudeGeometry(ld, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 12 }); ldG.translate(0, 0, -0.015); av.add(new T.Mesh(ldG, M.azul));
    av.rotation.set(-0.12, -0.55, 0.1); g.add(o3Pose(av));
    const nuvem = (x, y, z, s) => { const nv = new T.Group(); [[0, 0, 0, 0.3], [0.3, -0.06, 0.02, 0.22], [-0.3, -0.07, 0.03, 0.2], [0.1, 0.15, -0.03, 0.22], [-0.12, 0.1, 0.06, 0.18], [0, -0.12, 0, 0.12]].forEach(([a, b, c, r], i) => {
      const m = new T.Mesh(S, M.nuvem); m.position.set(a, b, c); if (i === 5) m.scale.set(0.5, r, 0.22); else m.scale.setScalar(r); nv.add(m); }); nv.position.set(x, y, z); nv.scale.setScalar(s); g.add(o3Pose(nv)); return nv; };
    const nuvens = [nuvem(-0.95, -0.72, -0.3, 0.9), nuvem(1.0, 0.62, -0.5, 0.65)];
    g.rotation.set(0.12, 0, 0); g.userData.dur = 2.0;
    g.userData.entra = (e, t) => { const u = 1 - o3Saida(o3Faixa(e, 0, 0.8)); o3Repouso(av); const arco = Math.sin(Math.PI * u);
      av.position.x -= 3.0 * u; av.position.y += -1.4 * u * u + 0.7 * arco; av.position.z += 0.8 * arco;
      av.rotation.y += u * 0.9; av.rotation.x += arco * 0.9 + Math.sin(t * 0.9) * 0.06 * e; av.rotation.z += u * 0.35;
      nuvens.forEach((nv, i) => { const f = o3Faixa(e, 0.3 + i * 0.15, 0.75 + i * 0.15); o3Repouso(nv); nv.scale.multiplyScalar(Math.max(0.001, o3Mola(f))); nv.position.x += Math.sin(t * 0.4 + i * 2) * 0.06 * e; }); };
    return g;
  },
  // pilha de livros com capa arredondada, lombada com filetes dourados e capelo de formatura; os livros caem e o capelo vem girando
  educacao(M) {
    const T = THREE; const g = new T.Group(); const livros = [];
    let y = -0.75; [[0x2E5AAC, 1.12, 0.17, 0.82], [0xD2453A, 1.04, 0.15, 0.76], [0x2FA36B, 1.08, 0.16, 0.8]].forEach(([cor, w, h, d], i) => {
      const capa = new T.MeshPhysicalMaterial({ color: cor, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.15 }); const l = new T.Group();
      [1, -1].forEach((sd) => { const c = o3Bloco(w, 0.03, d, 0.015, capa); c.position.y = sd * (h / 2 - 0.015); l.add(c); const fi = new T.Mesh(new T.BoxGeometry(0.056, 0.016, d - 0.01), M.ouro); fi.position.set(-w / 2 + 0.025, sd * h * 0.26, 0); l.add(fi); });
      const lomb = o3Bloco(0.05, h, d, 0.024, capa); lomb.position.x = -w / 2 + 0.025; l.add(lomb);
      l.add(new T.Mesh(new T.BoxGeometry(w - 0.06, h - 0.05, d - 0.04), M.papel));
      l.position.set(i % 2 ? 0.05 : -0.04, y + h / 2, 0); l.rotation.y = (i - 1) * 0.2; g.add(o3Pose(l)); livros.push(l); y += h; });
    const chapeu = new T.Group(); const tampa = o3Bloco(1.2, 0.05, 1.2, 0.03, M.marinho); tampa.rotation.y = Math.PI / 4; tampa.position.y = 0.3;
    const copa = new T.Mesh(new T.CylinderGeometry(0.4, 0.44, 0.3, 64), M.marinho); copa.position.y = 0.13;
    const botao = new T.Mesh(new T.SphereGeometry(0.05, 24, 16), M.ouro); botao.position.y = 0.34;
    const cordao = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.84, 8), M.ouro); cordao.rotation.z = Math.PI / 2; cordao.position.set(0.42, 0.34, 0);
    const pend = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.3, 8), M.ouro); pend.position.set(0.84, 0.2, 0); const borla = new T.Mesh(new T.ConeGeometry(0.06, 0.18, 24), M.ouro); borla.position.set(0.84, 0.02, 0);
    chapeu.add(tampa, copa, botao, cordao, pend, borla); chapeu.position.y = y + 0.05; chapeu.rotation.set(0.12, 0.3, -0.08); g.add(o3Pose(chapeu));
    g.rotation.set(0.25, -0.5, 0); g.userData.dur = 1.9;
    g.userData.entra = (e, t) => {
      livros.forEach((l, i) => { const f = o3Faixa(e, i * 0.12, i * 0.12 + 0.3); o3Repouso(l); l.position.y += (1 - o3Quique(f)) * 2.6; l.rotation.z += (1 - f) * 0.4 * (i % 2 ? 1 : -1); l.visible = f > 0; });
      const c = o3Faixa(e, 0.45, 1); o3Repouso(chapeu); chapeu.position.y += (1 - o3Quique(c)) * 2.2; chapeu.rotation.y += (1 - o3Saida(c)) * 7 + Math.sin(t * 0.9) * 0.12 * e; chapeu.rotation.x += Math.sin(c * Math.PI) * 0.6; chapeu.visible = c > 0;
    };
    return g;
  },
  // dois ursinhos de pelúcia sentados (um grande e um pequeno), focinho, nariz brilhante, olhos com reflexo, bochechas e gravata-borboleta; chegam pulando
  filhos(M) {
    const T = THREE; const g = new T.Group(); const S = new T.SphereGeometry(1, 40, 28); const C = new T.ConeGeometry(1, 1, 28);
    const urso = (pel, clara, laco) => {
      const u = new T.Group(); const b = (mat, x, y, z, sx, sy = sx, sz = sx, geo = S) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); u.add(m); return m; };
      b(pel, 0, 0.5, 0, 0.5, 0.52, 0.45); b(clara, 0, 0.46, 0.26, 0.3, 0.32, 0.22); // corpo e barriga
      b(pel, 0, 1.18, 0.04, 0.44, 0.4, 0.4); b(clara, 0, 1.06, 0.36, 0.19, 0.14, 0.12); b(M.nariz, 0, 1.13, 0.47, 0.07, 0.05, 0.045); // cabeça, focinho, nariz
      b(M.brilho, 0.02, 1.15, 0.51, 0.015); b(laco, 0, 0.86, 0.39, 0.05);
      [-1, 1].forEach((d) => {
        b(pel, d * 0.3, 0.17, 0.24, 0.2, 0.17, 0.27); b(clara, d * 0.3, 0.17, 0.5, 0.12, 0.11, 0.04); // pernas e solas
        b(pel, d * 0.47, 0.58, 0.14, 0.14, 0.25, 0.14).rotation.z = d * 0.45; // braços
        b(pel, d * 0.33, 1.5, 0, 0.15, 0.15, 0.09); b(clara, d * 0.33, 1.5, 0.07, 0.09, 0.09, 0.04); // orelhas
        b(M.olho, d * 0.16, 1.27, 0.385, 0.055, 0.065, 0.04); b(M.brilho, d * 0.16 + 0.02, 1.295, 0.42, 0.016); b(M.bochecha, d * 0.27, 1.1, 0.33, 0.07, 0.05, 0.03);
        b(laco, d * 0.1, 0.86, 0.37, 0.1, 0.18, 0.06, C).rotation.z = (d * Math.PI) / 2; // gravata-borboleta
      });
      return u;
    };
    const ua = urso(M.pelucia, M.peluciaClara, M.fita); ua.position.set(-0.42, 0, 0); ua.rotation.y = 0.28;
    const ub = urso(M.mel, M.melClaro, M.rosa); ub.position.set(0.62, 0, 0.32); ub.rotation.y = -0.4; ub.scale.setScalar(0.68);
    g.add(o3Pose(ua), o3Pose(ub)); g.rotation.set(0.12, 0, 0); g.userData.dur = 1.8;
    const pula = (u, a0, dx, e, t) => { const f = o3Faixa(e, a0, a0 + 0.6); const s = o3Faixa(e, a0 + 0.6, a0 + 0.85); o3Repouso(u); const k = u.userData.s0.x;
      const h = Math.abs(Math.sin(f * Math.PI * 2)) * 0.6 * (1 - f * 0.4); u.position.x += (1 - f) * dx; u.position.y += h;
      const sq = f < 1 ? 1 + 0.1 * Math.min(1, h / 0.2) : 1 - 0.16 * Math.sin(s * Math.PI) * (1 - s * 0.3); // estica no ar, amassa ao pousar
      u.scale.set(k / Math.sqrt(sq), k * sq, k / Math.sqrt(sq)); u.rotation.z += Math.sin(f * Math.PI * 4) * (1 - f) * 0.15 * Math.sign(dx) + Math.sin(t * 1.6 + a0 * 10) * 0.05 * e; };
    g.userData.entra = (e, t) => { pula(ua, 0, -2.3, e, t); pula(ub, 0.15, 2.0, e, t); };
    return g;
  },
  // ilha tropical: água turquesa, areia, coqueiro de tronco curvo com cocos, espreguiçadeira, guarda-sol e um sol que brilha; a ilha sobe do mar e o coqueiro cresce
  aposentadoria(M) {
    const T = THREE; const g = new T.Group();
    const mar = new T.Mesh(new T.CylinderGeometry(1.0, 1.04, 0.08, 72), M.agua); mar.position.y = -0.72; g.add(mar);
    const areia = new T.Mesh(new T.SphereGeometry(0.95, 64, 24, 0, Math.PI * 2, 0, 0.62), M.areia); areia.scale.y = 0.32; areia.position.y = -0.85; g.add(o3Pose(areia));
    // coqueiro: tronco curvo com anéis, folhas caídas em leque e três cocos (num grupo com a base na areia, para crescer dali)
    const pe = new T.Vector3(-0.25, -0.62, 0); const palma = new T.Group(); palma.position.copy(pe); g.add(o3Pose(palma)); const P = (x, y, z) => new T.Vector3(x, y, z).sub(pe);
    const curva = new T.CatmullRomCurve3([P(-0.25, -0.62, 0), P(-0.2, -0.2, 0.02), P(-0.05, 0.22, 0.04), P(0.12, 0.58, 0.05)]);
    palma.add(new T.Mesh(new T.TubeGeometry(curva, 40, 0.055, 14), M.tronco));
    for (let i = 1; i < 10; i++) { const t = i / 10; const p = curva.getPointAt(t); const tg = curva.getTangentAt(t); const anel = new T.Mesh(new T.TorusGeometry(0.058, 0.012, 8, 20), M.troncoEsc);
      anel.position.copy(p); anel.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tg); palma.add(anel); }
    const topo = curva.getPointAt(1); const folhaS = new T.Shape(); folhaS.moveTo(0, 0); folhaS.quadraticCurveTo(0.2, 0.17, 0.72, -0.02); folhaS.quadraticCurveTo(0.2, -0.13, 0, 0);
    const folhaG = new T.ExtrudeGeometry(folhaS, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 2 }); const folhas = [];
    for (let i = 0; i < 8; i++) { const f = new T.Mesh(folhaG, M.folha); f.rotation.x = Math.PI / 2; const caida = new T.Group(); caida.rotation.z = -(0.3 + (i % 2) * 0.3); caida.add(f); const piv = new T.Group(); piv.position.copy(topo); piv.rotation.y = (i / 8) * Math.PI * 2; piv.add(caida); palma.add(piv); folhas.push(o3Pose(caida)); }
    [[0.04, -0.07, 0.04], [-0.05, -0.08, -0.02], [0.02, -0.09, -0.06]].forEach(([x, y, z]) => { const c = new T.Mesh(new T.SphereGeometry(0.05, 20, 14), M.coco); c.position.set(topo.x + x, topo.y + y, topo.z + z); palma.add(c); });
    // espreguiçadeira listrada
    const esp = new T.Group(); esp.add(o3Bloco(0.42, 0.03, 0.2, 0.012, M.coral));
    const encosto = o3Bloco(0.2, 0.03, 0.2, 0.012, M.lona); encosto.position.set(-0.27, 0.07, 0); encosto.rotation.z = 0.7; esp.add(encosto);
    [[-0.17, 0.09], [-0.17, -0.09], [0.17, 0.09], [0.17, -0.09]].forEach(([x, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.08, 8), M.madeira); p.position.set(x, -0.05, z); esp.add(p); });
    esp.position.set(0.35, -0.5, 0.35); esp.rotation.y = -0.5; g.add(o3Pose(esp));
    // guarda-sol com gomos alternados
    const gs = new T.Group(); for (let i = 0; i < 8; i++) gs.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.36, 0.14, 6, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? M.lona : M.coral));
    const mastro = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.55, 10), M.madeira); mastro.position.y = -0.3; gs.add(mastro); gs.position.set(0.62, -0.08, 0.05); gs.rotation.z = 0.18; g.add(o3Pose(gs));
    // sol com halo
    const sol = new T.Group(); sol.add(new T.Mesh(new T.SphereGeometry(0.17, 40, 28), M.sol)); const halo = new T.Mesh(new T.SphereGeometry(0.3, 32, 20), M.halo); sol.add(o3Pose(halo)); sol.position.set(0.82, 0.68, -0.55); g.add(o3Pose(sol));
    g.rotation.set(0.26, -0.45, 0); g.userData.zoom = 1.08; g.userData.dur = 2.0;
    g.userData.entra = (e, t) => {
      const a = o3Saida(o3Faixa(e, 0, 0.35)); o3Repouso(areia); areia.scale.y *= Math.max(0.001, a);
      const p = o3Faixa(e, 0.2, 0.65); o3Repouso(palma); palma.scale.setScalar(Math.max(0.001, o3Mola(p))); palma.rotation.z += Math.sin(t * 1.2) * 0.03 * e;
      folhas.forEach((f, i) => { o3Repouso(f); f.rotation.z += (1 - o3Saida(o3Faixa(e, 0.45, 0.85))) * 1.1 + Math.sin(t * 1.8 + i) * 0.04 * e; });
      [esp, gs].forEach((m, i) => { const k = o3Faixa(e, 0.5 + i * 0.1, 0.75 + i * 0.1); o3Repouso(m); m.scale.multiplyScalar(Math.max(0.001, o3Mola(k))); });
      const s = o3Faixa(e, 0.55, 1); o3Repouso(sol); sol.position.y -= (1 - o3Saida(s)) * 0.9; sol.visible = s > 0; o3Repouso(halo); halo.scale.multiplyScalar(1 + Math.sin(t * 2) * 0.08 * e);
    };
    return g;
  },
  // negócio próprio: lojinha com toldo listrado arredondado, placa dourada, vitrine acesa, porta, vasos e uma moeda no ar; a loja brota do chão, o toldo abre e a placa salta
  negocio(M) {
    const T = THREE; const g = new T.Group(); const predio = new T.Group(); g.add(o3Pose(predio));
    const bl = (w, h, d, r, mat, x, y, z, pai = predio) => { const m = o3Bloco(w, h, d, r, mat); m.position.set(x, y, z); pai.add(m); return m; };
    bl(1.9, 0.08, 1.3, 0.04, M.pedra, 0, -0.04, 0.1, g); // calçada
    bl(1.5, 1.1, 0.9, 0.06, M.lojaParede, 0, 0.55, 0); bl(1.56, 0.1, 0.96, 0.04, M.marinho, 0, 0.05, 0); bl(1.64, 0.14, 1.0, 0.06, M.marinho, 0, 1.13, 0); // paredes, rodapé, marquise
    bl(0.72, 0.52, 0.05, 0.05, M.marinho, -0.36, 0.4, 0.45); bl(0.62, 0.42, 0.05, 0.04, M.janela, -0.36, 0.4, 0.47); // vitrine
    bl(0.4, 0.68, 0.05, 0.05, M.marinho, 0.4, 0.38, 0.45); bl(0.32, 0.6, 0.05, 0.04, M.fita, 0.4, 0.36, 0.47); bl(0.2, 0.22, 0.03, 0.03, M.janela, 0.4, 0.5, 0.5); // porta
    const mac = new T.Mesh(new T.SphereGeometry(0.028, 16, 12), M.ouro); mac.position.set(0.51, 0.32, 0.51); predio.add(mac);
    // toldo: gomos em quarto de cilindro (listras coral e creme) com abas redondas; gira a partir da parede
    const toldo = new T.Group(); toldo.position.set(0, 1.03, 0.45); predio.add(o3Pose(toldo));
    const gomo = new T.CylinderGeometry(0.3, 0.3, 0.25, 16, 1, true, 0, Math.PI / 2); gomo.rotateZ(Math.PI / 2); const aba = new T.CircleGeometry(0.125, 20, Math.PI, Math.PI);
    for (let i = 0; i < 6; i++) { const mat = i % 2 ? M.lona : M.coral; const x = -0.625 + i * 0.25; const f = new T.Mesh(gomo, mat); f.position.set(x, -0.3, 0); const a = new T.Mesh(aba, mat); a.position.set(x, -0.3, 0.3); toldo.add(f, a); }
    // placa dourada em cima da marquise
    const placa = new T.Group(); placa.position.set(0, 1.2, 0.3); predio.add(o3Pose(placa));
    const tx = o3Textura((x, w, h) => { x.fillStyle = '#18244A'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFD36B'; x.font = `800 ${h * 0.62}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LOJA', w / 2, h * 0.56); }, 256, 80);
    const moldura = o3Bloco(0.9, 0.3, 0.07, 0.05, M.ouro); moldura.position.y = 0.15; placa.add(moldura);
    const letreiro = new T.Mesh(new T.PlaneGeometry(0.8, 0.22), new T.MeshStandardMaterial({ map: tx, roughness: 0.4, metalness: 0.1 })); letreiro.position.set(0, 0.15, 0.037); placa.add(letreiro);
    const vasos = [-0.84, 0.84].map((x) => { const v = new T.Group(); v.add(new T.Mesh(new T.LatheGeometry([V2(0, 0), V2(0.09, 0), V2(0.11, 0.15), V2(0.125, 0.17), V2(0.12, 0.19), V2(0, 0.19)], 24), M.vaso));
      [[0, 0.3, 0, 0.13], [0.06, 0.24, 0.05, 0.1], [-0.07, 0.25, -0.02, 0.1]].forEach(([a, b, c, r]) => { const f = new T.Mesh(new T.SphereGeometry(r, 20, 14), M.folha); f.position.set(a, b, c); v.add(f); });
      v.position.set(x, 0, 0.6); g.add(o3Pose(v)); return v; });
    const moeda = o3Moeda(M); moeda.scale.setScalar(0.5); moeda.position.set(0.95, 1.62, 0.2); moeda.rotation.set(1.2, 0.2, 0.4); g.add(o3Pose(moeda));
    g.rotation.set(0.2, -0.45, 0); g.userData.dur = 1.9;
    g.userData.entra = (e, t) => {
      const f = o3Faixa(e, 0, 0.42); o3Repouso(predio); predio.scale.set(1 + (1 - f) * 0.12, Math.max(0.001, o3Mola(f)), 1 + (1 - f) * 0.12); predio.visible = f > 0;
      o3Repouso(toldo); toldo.rotation.x -= (1 - o3Mola(o3Faixa(e, 0.32, 0.7))) * 1.4;
      const p = o3Faixa(e, 0.5, 0.8); o3Repouso(placa); placa.scale.setScalar(Math.max(0.001, o3Mola(p))); placa.rotation.z += Math.sin(t * 1.3) * 0.02 * e;
      vasos.forEach((v, i) => { const k = o3Faixa(e, 0.58 + i * 0.08, 0.82 + i * 0.08); o3Repouso(v); v.scale.multiplyScalar(Math.max(0.001, o3Mola(k))); });
      const m = o3Faixa(e, 0.65, 1); o3Repouso(moeda); moeda.position.y += (1 - o3Saida(m)) * 1.5 + Math.sin(t * 1.6) * 0.04 * e; moeda.rotation.z += (1 - o3Saida(m)) * 10 + Math.sin(t * 1.1) * 0.3 * e; moeda.visible = m > 0;
    };
    return g;
  },
  // coletânea para o objetivo "Outro" (o cliente escolhe o objeto em Meus objetivos)
  cartao(M) { // cartão Legacy da XP: metal preto, chip dourado e gravação clara
    const T = THREE; const w = 1.7, h = 1.07, r = 0.09; const s = new T.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const geo = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 10 }); geo.center();
    const metal = new T.MeshPhysicalMaterial({ color: 0x15171B, metalness: 0.85, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
    const g = new T.Group(); g.add(new T.Mesh(geo, metal));
    const face = o3Textura((x, W, H) => { x.clearRect(0, 0, W, H);
      const lu = x.createLinearGradient(0, 0, W, H); lu.addColorStop(0, 'rgba(255,255,255,0)'); lu.addColorStop(0.45, 'rgba(255,255,255,.07)'); lu.addColorStop(0.55, 'rgba(255,255,255,0)'); x.fillStyle = lu; x.fillRect(0, 0, W, H);
      x.fillStyle = '#ECEFF3'; x.font = `800 ${H * 0.2}px Arial, sans-serif`; x.textBaseline = 'top'; x.fillText('XP', W * 0.07, H * 0.09);
      x.font = `600 ${H * 0.075}px Arial, sans-serif`; x.fillStyle = '#C9CED6'; const t = 'L E G A C Y'; x.fillText(t, W * 0.07, H * 0.8);
      x.strokeStyle = '#C9CED6'; x.lineWidth = H * 0.018; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(W * 0.86, H * 0.47, H * (0.05 + i * 0.045), -0.7, 0.7); x.stroke(); } }, 512, 322);
    const pl = new T.Mesh(new T.PlaneGeometry(w * 0.98, h * 0.98), new T.MeshBasicMaterial({ map: face, transparent: true })); pl.position.z = 0.0285; g.add(pl);
    const chip = o3Bloco(0.22, 0.17, 0.012, 0.03, M.ouro); chip.position.set(-0.52, 0.02, 0.028); g.add(chip);
    g.rotation.set(-0.3, 0.45, 0.08); g.userData.zoom = 0.78; return g; // largo: um pouco menor para não cobrir o título do card
  },
  trofeu(M) {
    const T = THREE; const g = new T.Group();
    g.add(new T.Mesh(new T.LatheGeometry([V2(0, 0.05), V2(0.5, 0.95), V2(0.56, 1.05), V2(0.52, 1.07), V2(0.44, 0.97), V2(0, 0.2)].map((v) => V2(v.x, v.y - 0.3)), 64), M.ouro));
    [-1, 1].forEach((d) => { const a = new T.Mesh(new T.TorusGeometry(0.2, 0.04, 16, 40, Math.PI * 1.2), M.ouro); a.position.set(d * 0.5, 0.42, 0); a.rotation.z = d > 0 ? -0.6 : Math.PI + 0.6; g.add(a); });
    const haste = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 0.4, 24), M.ouro); haste.position.y = -0.45; g.add(haste);
    const base = o3Bloco(0.62, 0.18, 0.62, 0.05, M.marinho); base.position.y = -0.72; g.add(base);
    g.rotation.set(0.15, -0.3, 0); return g;
  },
  presente(M) {
    const T = THREE; const g = new T.Group();
    g.add(o3Bloco(1, 0.8, 1, 0.06, M.azul));
    const tampa = o3Bloco(1.08, 0.2, 1.08, 0.05, M.azul); tampa.position.y = 0.48; g.add(tampa);
    [[0.14, 1.02, 1.1], [1.1, 1.02, 0.14]].forEach(([x, y, z]) => { const f = o3Bloco(x, y, z, 0.03, M.ouro); f.position.y = 0.1; g.add(f); });
    [-1, 1].forEach((d) => { const l = new T.Mesh(new T.TorusGeometry(0.17, 0.05, 16, 40), M.ouro); l.position.set(d * 0.16, 0.7, 0); l.rotation.set(0, d * 0.5, d * 0.5); g.add(l); });
    g.rotation.set(0.35, -0.6, 0); return g;
  },
  diamante(M) {
    const T = THREE; const g = new T.Group();
    g.add(new T.Mesh(new T.LatheGeometry([V2(0, -0.85), V2(0.78, 0.12), V2(0.8, 0.2), V2(0.5, 0.48), V2(0, 0.5)], 12), M.diamante));
    [[0.95, 0.6, 0.2, 0.12], [-0.95, -0.3, -0.2, 0.09]].forEach(([x, y, z, r]) => { const b = new T.Mesh(new T.OctahedronGeometry(r, 0), M.diamante); b.position.set(x, y, z); g.add(b); });
    g.rotation.set(0.3, 0.2, 0); return g;
  },
  // estrela dourada fofinha com pedrinhas e brilhos; entra girando duas voltas e cintila
  outro(M) {
    const T = THREE; const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.42 : 0.95; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.13, bevelSegments: 12, curveSegments: 4 }); geo.center();
    const g = new T.Group(); const ouro = M.ouro.clone(); ouro.metalness = 0.75; ouro.roughness = 0.24; const estrela = new T.Mesh(geo, ouro); g.add(o3Pose(estrela)); // menos espelho: a face grande não reflete o fundo escuro
    const pedras = [[0.95, 0.7, 0.2, 0.12], [-0.9, 0.55, -0.2, 0.09], [0.75, -0.75, 0.3, 0.07]].map(([x, y, z, r]) => { const b = new T.Mesh(new T.OctahedronGeometry(r, 0), M.diamante); b.position.set(x, y, z); g.add(b); return o3Pose(b); });
    const bs = o3Brilhos(g, o3BrilhoMat(), [[0.32, 0.58, 0.35, 0.36], [-0.7, -0.5, 0.3, 0.24]]);
    g.rotation.set(-0.42, -0.35, 0); g.userData.dur = 1.7; // inclinada para trás: a face reflete o softbox de cima e o ouro acende
    g.userData.entra = (e, t) => { const f = o3Faixa(e, 0, 0.7); o3Repouso(estrela); estrela.rotation.y += (1 - o3Saida(f)) * Math.PI * 4; estrela.scale.setScalar(Math.max(0.001, o3Mola(f)));
      pedras.forEach((b, i) => { const k = o3Faixa(e, 0.45 + i * 0.1, 0.7 + i * 0.1); o3Repouso(b); b.scale.setScalar(Math.max(0.001, o3Mola(k))); b.rotation.y += t * 0.8 + i; b.position.y += Math.sin(t * 1.4 + i * 2) * 0.04 * e; });
      o3Cintila(bs, e, t, 0.6); };
    return g;
  },
};

/* ---------- estúdio ---------- */
function o3Estudio(renderer) {
  const T = THREE; const pm = new T.PMREMGenerator(renderer); const s = new T.Scene();
  s.add(new T.Mesh(new T.BoxGeometry(12, 12, 12), new T.MeshBasicMaterial({ color: 0x0A1530, side: T.BackSide })));
  const caixa = (cor, f, w, h, x, y, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(cor).multiplyScalar(f), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  caixa(0xFFFFFF, 7, 5, 2.2, 0, 5.5, 1.5); caixa(0xFFFFFF, 3.2, 2, 5, -5.5, 1, 2); caixa(0x8EC5FF, 4.5, 2, 5, 5.5, 0.5, -1.5); caixa(0xFFE0B0, 2.4, 4, 1.2, 0, -3, 5.5); caixa(0xB5A8FF, 2, 3, 3, -2, 2, -5.5); caixa(0xFFF3DC, 1.6, 3, 1.6, 1.2, 1.6, 5.5); // softbox frontal: faces planas de metal não ficam escuras
  const t = pm.fromScene(s, 0.03).texture; pm.dispose(); return t;
}
// sombra de contato: mancha radial suave sob o objeto (barata, sem mapa de sombras)
function o3Sombra() {
  const tx = o3Textura((x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.45, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); }, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.rotation.x = -1.25; m.renderOrder = -1; return m;
}
function o3Assenta(sombra, ud, z, sobe) { sombra.position.y = (ud.base - 0.05) * z; const k = ud.larg * z * (1 - sobe * 1.5); sombra.scale.set(k * 0.95, k * 0.6, 1); }
function o3Camera() { const c = new THREE.PerspectiveCamera(30, 1, 0.1, 50); c.position.set(0, 0.6, 5); c.lookAt(0, 0, 0); return c; }
function o3Criar() {
  const T = THREE;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98; renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene(); scene.environment = o3Estudio(renderer);
  const camera = o3Camera();
  const key = new T.DirectionalLight(0xFFFFFF, 1.6); key.position.set(3, 4, 5); const rim = new T.DirectionalLight(0x6CB4FF, 2.2); rim.position.set(-4, 2, -4);
  scene.add(key, rim, new T.HemisphereLight(0xD6E8FF, 0x0B1630, 0.5));
  const pivo = new T.Group(); scene.add(pivo); const sombra = o3Sombra(); scene.add(sombra);
  renderer.domElement.className = 'ob3d-canvas';
  O3 = { renderer, scene, camera, pivo, sombra, obj: null, tipo: null, M: o3Mat(), gesto: { x: 0, y: 0, z: 1, vx: 0, vy: 0, ativo: false, tz: 0 }, t0: 0, entrada: 0, raf: 0, visivel: true, host: null };
  document.addEventListener('visibilitychange', o3Rodar);
  O3.io = new IntersectionObserver((es) => { O3.visivel = es.some((e) => e.isIntersecting); o3Rodar(); });
  O3.ro = new ResizeObserver(o3Tamanho);
}
function o3Descartar(o) { o.traverse((n) => { if (n.geometry) n.geometry.dispose(); const ms = Array.isArray(n.material) ? n.material : n.material ? [n.material] : []; ms.forEach((m) => { if (m.bumpMap) m.bumpMap.dispose(); if (m.map) m.map.dispose(); if (!Object.values(O3.M).includes(m)) m.dispose(); }); }); }
// monta um objeto pronto para a cena: cores convertidas e enquadrado (sempre o mesmo espaço, centralizado)
function o3Montar(tipo, M) {
  const T = THREE; const o = (O3_OBJ[tipo] || O3_OBJ.outro)(M);
  // as cores foram escritas em sRGB (como no CSS); o renderizador trabalha em linear: converte uma vez por material
  o.traverse((n) => { (Array.isArray(n.material) ? n.material : n.material ? [n.material] : []).forEach((m) => {
    if (m.userData.lin) return; m.userData.lin = true; ['color', 'emissive', 'sheen'].forEach((k) => { if (m[k] && m[k].isColor) m[k].convertSRGBToLinear(); }); }); });
  const cx = new T.Box3().setFromObject(o); const tam = cx.getSize(new T.Vector3()); const centro = cx.getCenter(new T.Vector3());
  // largura vista de frente já com o giro ocioso (±0,3 rad em Y) e a profundidade que vira altura com a câmera um pouco acima: nada sai do quadro
  const k = (2.3 / Math.max(tam.x * 0.95 + tam.z * 0.32, tam.y + tam.z * 0.14)) * (o.userData.zoom || 1);
  const mola = new T.Group(); o.position.sub(centro); mola.add(o); const roda = new T.Group(); roda.add(mola); roda.scale.setScalar(k);
  roda.userData = { entra: o.userData.entra, dur: o.userData.dur || 1.2, mola, base: (-tam.y * k) / 2, larg: Math.max(tam.x, tam.z) * k };
  return roda;
}
function o3Objeto(tipo) {
  if (O3.tipo === tipo && O3.obj) return;
  if (O3.obj) { O3.pivo.remove(O3.obj); o3Descartar(O3.obj); }
  const roda = o3Montar(tipo, O3.M); O3.pivo.add(roda); O3.obj = roda; O3.tipo = tipo; O3.entrada = performance.now();
}
// miniaturas para escolher o objeto do "Outro": cada um desenhado uma vez num renderizador pequeno à parte e guardado como imagem
const O3_MINI = new Map();
function o3Miniaturas(tipos) {
  if (!o3Suporta()) return Promise.resolve(O3_MINI);
  return o3Biblioteca().then(() => {
    const falta = tipos.filter((t) => !O3_MINI.has(t)); if (!falta.length) return O3_MINI; const T = THREE;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(256, 256, false); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.setClearColor(0x000000, 0);
    const sc = new T.Scene(); sc.environment = o3Estudio(r); const cam = o3Camera(); const sombra = o3Sombra(); sombra.material.opacity = 0.6; sc.add(sombra);
    const luz = new T.DirectionalLight(0xFFFFFF, 1.6); luz.position.set(3, 4, 5); sc.add(luz, new T.HemisphereLight(0xD6E8FF, 0x0B1630, 0.5)); const M = o3Mat();
    falta.forEach((t) => { const o = o3Montar(t, M); o3Assenta(sombra, o.userData, 1, 0); sc.add(o); r.render(sc, cam); O3_MINI.set(t, r.domElement.toDataURL('image/png')); sc.remove(o); });
    r.dispose(); r.forceContextLoss(); return O3_MINI;
  }).catch(() => O3_MINI);
}
function o3Tamanho() { if (!O3 || !O3.host) return; const w = O3.host.clientWidth; const h = O3.host.clientHeight; if (!w || !h) return; O3.renderer.setSize(w, h, false); O3.camera.aspect = w / h; O3.camera.updateProjectionMatrix(); o3Quadro(performance.now()); }
function o3Quadro(agora) {
  if (!O3 || !O3.obj) return; const calmo = o3Calmo(); const t = (agora - O3.t0) / 1000; const ud = O3.obj.userData; const G = O3.gesto;
  if (!G.ativo) { // solto: segue girando com a inércia, depois volta devagar ao repouso (pelo caminho mais curto)
    G.y += G.vy; G.x += G.vx; G.vy *= 0.94; G.vx *= 0.85;
    if (Math.abs(G.vy) < 0.004) { G.y = Math.atan2(Math.sin(G.y), Math.cos(G.y)) * 0.9; G.vy = 0; } G.x *= 0.9;
    if (agora - G.tz > 600) G.z += (1 - G.z) * 0.1;
    if (calmo) { G.x = G.y = G.vx = G.vy = 0; if (agora - G.tz > 600) G.z = 1; }
  }
  O3.pivo.rotation.set(G.x, G.y, 0); O3.pivo.scale.setScalar(G.z);
  const e = calmo ? 1 : Math.min(1, (agora - O3.entrada) / (ud.dur * 1000)); const tt = calmo ? 0 : t;
  if (ud.entra) ud.entra(e, tt); else { ud.mola.scale.setScalar(Math.max(0.001, o3Mola(e))); ud.mola.rotation.y = (1 - o3Saida(e)) * -1.6; } // entrada padrão: salta girando
  const amp = calmo ? 0 : o3Faixa(e, 0.6, 1); const sobe = Math.sin(t * 1.3) * 0.06 * amp; // flutuar leve depois da entrada
  O3.obj.position.y = sobe; O3.obj.rotation.y = Math.sin(t * 0.45) * 0.3 * amp; O3.obj.rotation.z = Math.sin(t * 0.8) * 0.03 * amp;
  o3Assenta(O3.sombra, ud, G.z, sobe); O3.sombra.material.opacity = calmo ? 0.85 : 0.85 * o3Faixa(e, 0, 0.5);
  O3.renderer.render(O3.scene, O3.camera);
}
function o3Rodar() {
  if (!O3) return; const deve = O3.host && O3.visivel && !document.hidden && !o3Calmo();
  if (deve && !O3.raf) { const laco = (a) => { o3Quadro(a); O3.raf = requestAnimationFrame(laco); }; O3.raf = requestAnimationFrame(laco); }
  else if (!deve && O3.raf) { cancelAnimationFrame(O3.raf); O3.raf = 0; }
}
// gesto no palco: arrastar gira (Y e um pouco X) com inércia; pinça com dois dedos ou roda do mouse ampliam até 1,5x; ao soltar volta ao repouso
function o3Gesto(card) {
  const pts = new Map(); let d0 = 1, z0 = 1, ult = 0, andou = 0;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; };
  const desenha = () => { if (o3Calmo()) o3Quadro(performance.now()); }; // sem o laço de animação, desenha a cada toque
  card.addEventListener('pointerdown', (ev) => { if (!O3 || (ev.pointerType === 'mouse' && ev.button !== 0)) return; pts.set(ev.pointerId, [ev.clientX, ev.clientY]); try { card.setPointerCapture(ev.pointerId); } catch (e) { /* sem captura: segue sem ela */ }
    const G = O3.gesto; G.ativo = true; G.vx = G.vy = 0; if (pts.size === 1) andou = 0; if (pts.size === 2) { d0 = dist(); z0 = G.z; } });
  card.addEventListener('pointermove', (ev) => { const p = pts.get(ev.pointerId); if (!p || !O3) return; const G = O3.gesto; const dx = ev.clientX - p[0], dy = ev.clientY - p[1]; p[0] = ev.clientX; p[1] = ev.clientY; andou += Math.abs(dx) + Math.abs(dy);
    if (pts.size > 1) { G.z = Math.min(1.5, Math.max(1, (z0 * dist()) / d0)); G.tz = performance.now(); }
    else { const w = card.clientWidth || 230; const ay = (dx / w) * 4.5, ax = (dy / w) * 2.2; G.y += ay; G.x = Math.max(-0.6, Math.min(0.6, G.x + ax)); G.vy = G.vy * 0.4 + ay * 0.6; G.vx = G.vx * 0.4 + ax * 0.6; ult = performance.now(); }
    desenha(); });
  const fim = (ev) => { if (!pts.delete(ev.pointerId) || !O3) return; if (pts.size) return; const G = O3.gesto; G.ativo = false; if (performance.now() - ult > 90) G.vx = G.vy = 0; G.tz = performance.now(); desenha(); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((n) => card.addEventListener(n, fim));
  card.addEventListener('click', (ev) => { if (andou > 8) { ev.preventDefault(); ev.stopPropagation(); } }, true); // arrastar não conta como toque (o palco pode estar dentro de um botão)
  card.addEventListener('wheel', (ev) => { if (!O3) return; ev.preventDefault(); const G = O3.gesto; G.z = Math.min(1.5, Math.max(1, G.z * Math.exp(-ev.deltaY * 0.0015))); G.tz = performance.now(); desenha();
    if (o3Calmo()) { clearTimeout(O3.volta); O3.volta = setTimeout(() => o3Quadro(performance.now()), 700); } }, { passive: false });
  card.addEventListener('gesturestart', (ev) => ev.preventDefault()); // Safari: a pinça amplia o objeto, não a página
}
// liga o 3D ao card do objetivo desenhado agora (chamado a cada desenho da Visão geral e ao trocar de objetivo)
function o3Ligar(card, tipo, falhou) {
  const host = card.querySelector('.ob3d-gl'); if (!host) return;
  if (!o3Suporta()) { falhou(); return; }
  o3Biblioteca().then(() => {
    if (!host.isConnected) return;
    try { if (!O3) { o3Criar(); O3.t0 = performance.now(); } } catch (e) { falhou(); return; }
    if (O3.host && O3.host !== host) { O3.io.unobserve(O3.host); O3.ro.unobserve(O3.host); }
    O3.host = host; host.appendChild(O3.renderer.domElement); O3.io.observe(host); O3.ro.observe(host);
    o3Objeto(tipo); o3Tamanho(); host.closest('.ob3d').classList.add('gl-ok'); o3Rodar();
    if (!card.dataset.o3m) { card.dataset.o3m = '1'; o3Gesto(card); }
  }).catch(() => falhou());
}
