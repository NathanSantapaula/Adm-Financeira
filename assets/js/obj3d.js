/* Voz Acolhedor: objeto 3D de verdade (WebGL) no card do objetivo, um por tipo de objetivo (visualAtual() === '3d').
   Three.js r128 vem do cdnjs só quando essa voz está escolhida, com verificação de integridade (SRI).
   Um único renderizador é reaproveitado: a cada desenho da tela o canvas muda para o card novo (o3Ligar).
   Estúdio: reflexos de softbox gerados na hora (PMREM), luz principal, contraluz azul e tom ACES.
   Os objetos são modelados aqui com geometria (sem arquivos). Sem WebGL, ou se a biblioteca não carregar,
   o card volta a mostrar a foto do objetivo, como no visual normal. Com "reduzir movimento", o objeto fica parado. */
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
    pintura: fis({ color: 0xC4102C, metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04 }),
    vidro: fis({ color: 0x0A1426, metalness: 0.3, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0 }),
    borracha: new T.MeshStandardMaterial({ color: 0x111317, roughness: 0.85, metalness: 0 }),
    cromo: new T.MeshStandardMaterial({ color: 0xDDE3EA, metalness: 1, roughness: 0.12 }),
    farol: new T.MeshStandardMaterial({ color: 0xFFF4D2, emissive: 0xFFE7A8, emissiveIntensity: 1.6 }),
    lanterna: new T.MeshStandardMaterial({ color: 0xFF3B3B, emissive: 0xE0102C, emissiveIntensity: 1.2 }),
    branco: fis({ color: 0xF6F8FB, metalness: 0.05, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 }),
    azul: fis({ color: 0x1F6FE5, metalness: 0.3, roughness: 0.3, clearcoat: 1 }),
    cinza: new T.MeshStandardMaterial({ color: 0xA9B4C4, metalness: 0.7, roughness: 0.3 }),
    nuvem: new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, metalness: 0 }),
    parede: fis({ color: 0xF1E6D6, roughness: 0.6, clearcoat: 0.2, envMapIntensity: 0.6 }),
    telhado: fis({ color: 0xC2553A, roughness: 0.45, clearcoat: 0.35 }),
    madeira: fis({ color: 0x6E4223, roughness: 0.5, clearcoat: 0.3 }),
    janela: new T.MeshStandardMaterial({ color: 0xFFC86B, emissive: 0xFFB13D, emissiveIntensity: 1.5 }),
    grama: fis({ color: 0x3F9A4E, roughness: 0.75, envMapIntensity: 0.45 }),
    couro: fis({ color: 0x6B3B1C, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    couroEsc: fis({ color: 0x4A2610, roughness: 0.5, clearcoat: 0.4 }),
    marinho: fis({ color: 0x18244A, roughness: 0.62, clearcoat: 0.25 }),
    pelucia: fis({ color: 0xB57B4C, roughness: 0.95, sheen: new T.Color(0xFFD2A6) }),
    peluciaClara: fis({ color: 0xEBC9A0, roughness: 0.95 }),
    olho: fis({ color: 0x0B0B0F, roughness: 0.05, clearcoat: 1 }),
    fita: fis({ color: 0x4D8CFF, roughness: 0.35, clearcoat: 0.6 }),
    areia: fis({ color: 0xE8C27E, roughness: 0.9, envMapIntensity: 0.5 }),
    coral: fis({ color: 0xFF5A5F, roughness: 0.38, clearcoat: 0.5, side: T.DoubleSide }),
    lona: fis({ color: 0xFFF8EE, roughness: 0.42, clearcoat: 0.4, side: T.DoubleSide }),
    sol: new T.MeshStandardMaterial({ color: 0xFFC94A, emissive: 0xFFB020, emissiveIntensity: 1.4 }),
    papel: fis({ color: 0xF7F3EA, roughness: 0.8 }),
    pedra: fis({ color: 0xB9BEC6, roughness: 0.75, envMapIntensity: 0.6 }),
    concreto: fis({ color: 0x3A4150, roughness: 0.55, clearcoat: 0.3 }),
    madeiraClara: fis({ color: 0xB9824F, roughness: 0.45, clearcoat: 0.5 }),
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

/* ---------- objetos ---------- */
const V2 = (x, y) => new THREE.Vector2(x, y);
function o3Moeda(M) {
  const T = THREE; const g = new T.Group();
  const perfil = [V2(0, -0.075), V2(0.47, -0.075), V2(0.5, -0.05), V2(0.5, 0.05), V2(0.47, 0.075), V2(0.42, 0.075), V2(0.4, 0.052), V2(0, 0.052)];
  g.add(new T.Mesh(new T.LatheGeometry(perfil, 72), M.ouro));
  const relevo = o3Textura((x, w) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, w); x.fillStyle = '#fff'; x.font = `800 ${w * 0.58}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', w / 2, w * 0.53);
    x.strokeStyle = '#fff'; x.lineWidth = w * 0.03; x.beginPath(); x.arc(w / 2, w / 2, w * 0.42, 0, Math.PI * 2); x.stroke(); }, 256, 256);
  const face = M.ouro.clone(); face.bumpMap = relevo; face.bumpScale = 0.02;
  const disco = new T.Mesh(new T.CircleGeometry(0.4, 64), face); disco.rotation.x = -Math.PI / 2; disco.position.y = 0.053; g.add(disco);
  return g;
}
const O3_OBJ = {
  casamento(M) {
    const T = THREE; const g = new T.Group();
    const anel = (mat) => new T.Mesh(new T.TorusGeometry(0.62, 0.1, 64, 200), mat);
    const a1 = anel(M.ouro); a1.rotation.set(0.25, 0.55, -0.1); a1.position.set(-0.2, -0.12, 0);
    const a2 = anel(M.ouro); a2.rotation.set(1.25, -0.35, 0.35); a2.position.set(0.34, 0.02, 0.05);
    const gema = new T.Mesh(new T.LatheGeometry([V2(0, -0.22), V2(0.2, -0.03), V2(0.22, 0.02), V2(0.14, 0.12), V2(0, 0.13)], 14), M.diamante);
    gema.position.set(0, 0.86, 0); a1.add(gema);
    for (let i = 0; i < 4; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.018, 0.026, 0.2, 10), M.ouro); const ang = (i / 4) * Math.PI * 2 + Math.PI / 4; p.position.set(Math.cos(ang) * 0.17, 0.78, Math.sin(ang) * 0.17); p.rotation.z = -Math.cos(ang) * 0.35; p.rotation.x = Math.sin(ang) * 0.35; a1.add(p); }
    g.add(a1, a2); return g;
  },
  reserva(M) {
    const T = THREE; const g = new T.Group();
    for (let i = 0; i < 6; i++) { const m = o3Moeda(M); m.position.set(Math.sin(i * 1.7) * 0.04, -0.55 + i * 0.15, Math.cos(i * 2.3) * 0.04); m.rotation.y = i * 0.6; g.add(m); }
    const v1 = o3Moeda(M); v1.position.set(0.85, 0.45, 0.1); v1.rotation.set(1.1, 0.3, 0.5); g.add(v1);
    const v2 = o3Moeda(M); v2.position.set(-0.75, 0.7, -0.1); v2.rotation.set(0.6, -0.4, -0.9); v2.scale.setScalar(0.75); g.add(v2);
    g.rotation.x = 0.35; return g;
  },
  // blocos de dinheiro: maços de notas verdes cintados, empilhados em pirâmide, e um maço solto no ar
  independencia(M) {
    const T = THREE; const g = new T.Group();
    const nota = o3Textura((x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2BCB63'); gr.addColorStop(0.5, '#0E8A3C'); gr.addColorStop(1, '#055C26'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(220,255,232,.7)'; x.lineWidth = 5; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = 'rgba(220,255,232,.85)'; x.beginPath(); x.ellipse(w * 0.72, h / 2, h * 0.3, h * 0.3, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#E6FFEE'; x.font = `800 ${h * 0.26}px Arial, sans-serif`; x.textBaseline = 'middle'; x.fillText('100', w * 0.08, h * 0.3); x.font = `700 ${h * 0.16}px Arial, sans-serif`; x.fillText('REAIS', w * 0.08, h * 0.72);
      x.fillStyle = '#0B6B2F'; x.font = `800 ${h * 0.24}px Arial, sans-serif`; x.textAlign = 'center'; x.fillText('R$', w * 0.72, h * 0.53); }, 512, 240);
    // lateral do maço: as bordas das notas empilhadas
    const borda = o3Textura((x, w, h) => { for (let i = 0; i < h; i += 2) { x.fillStyle = i % 4 ? '#3FB868' : '#0A6E30'; x.fillRect(0, i, w, 2); } }, 64, 128);
    const topo = new T.MeshPhysicalMaterial({ map: nota, roughness: 0.7, envMapIntensity: 0.35 }); const lado = new T.MeshPhysicalMaterial({ map: borda, roughness: 0.9, envMapIntensity: 0.3 }); // pouco reflexo: o verde fica forte
    const cinta = new T.MeshPhysicalMaterial({ color: 0xE9C877, roughness: 0.5, clearcoat: 0.3 });
    const maco = () => { const m = new T.Group(); const L = 1.0; const A = 0.2; const P = 0.46;
      m.add(new T.Mesh(new T.BoxGeometry(L, A, P), [lado, lado, topo, topo, lado, lado]));
      const c = new T.Mesh(new T.BoxGeometry(0.16, A + 0.012, P + 0.012), cinta); m.add(c); return m; };
    const pos = [[0, -0.42, -0.5, 0.04], [0, -0.42, 0, -0.03], [0, -0.42, 0.5, 0.05], [0.02, -0.21, -0.25, -0.06], [-0.02, -0.21, 0.25, 0.04], [0, 0, 0, 0.08]];
    pos.forEach(([x, y, z, r]) => { const m = maco(); m.position.set(x, y, z); m.rotation.y = r; g.add(m); });
    const solto = maco(); solto.position.set(0.55, 0.42, 0.15); solto.rotation.set(0.5, 0.6, 0.35); g.add(solto);
    g.rotation.set(0.32, -0.6, 0); return g;
  },
  carro(M) {
    const T = THREE; const g = new T.Group(); const s = new T.Shape();
    s.moveTo(-1.12, -0.18); s.lineTo(-0.92, -0.18); s.absarc(-0.7, -0.18, 0.24, Math.PI, 0, true); s.lineTo(0.46, -0.18); s.absarc(0.7, -0.18, 0.24, Math.PI, 0, true);
    s.lineTo(1.12, -0.18); s.quadraticCurveTo(1.18, 0.02, 1.02, 0.12); s.lineTo(0.5, 0.2); s.quadraticCurveTo(0.34, 0.24, 0.2, 0.44); s.quadraticCurveTo(0.12, 0.5, -0.05, 0.5);
    s.lineTo(-0.4, 0.49); s.quadraticCurveTo(-0.55, 0.47, -0.68, 0.22); s.lineTo(-1.02, 0.17); s.quadraticCurveTo(-1.16, 0.12, -1.12, -0.18);
    const corpo = new T.ExtrudeGeometry(s, { depth: 0.84, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 10, curveSegments: 32 }); corpo.center();
    g.add(new T.Mesh(corpo, M.pintura));
    const j = new T.Shape(); j.moveTo(-0.55, 0.23); j.quadraticCurveTo(-0.45, 0.43, -0.36, 0.44); j.lineTo(-0.04, 0.45); j.quadraticCurveTo(0.1, 0.45, 0.17, 0.39); j.lineTo(0.33, 0.23); j.lineTo(-0.55, 0.23);
    const jan = new T.ExtrudeGeometry(j, { depth: 1.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }); jan.center();
    const vid = new T.Mesh(jan, M.vidro); vid.position.set(-0.06, 0.12, 0); g.add(vid);
    [[-0.7, 0.47], [0.7, 0.47], [-0.7, -0.47], [0.7, -0.47]].forEach(([x, z]) => {
      const r = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.17, 48), M.borracha); r.rotation.x = Math.PI / 2; r.position.set(x, -0.2, z);
      const aro = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.18, 32), M.cromo); aro.rotation.x = Math.PI / 2; aro.position.set(x, -0.2, z); g.add(r, aro);
    });
    [0.3, -0.3].forEach((z) => { const f = new T.Mesh(new T.BoxGeometry(0.04, 0.07, 0.2), M.farol); f.position.set(1.17, 0.02, z); g.add(f); const l = new T.Mesh(new T.BoxGeometry(0.04, 0.06, 0.2), M.lanterna); l.position.set(-1.16, 0.08, z); g.add(l); });
    g.rotation.set(0.18, -0.65, 0); return g;
  },
  // casa moderna em dois volumes, janelas acesas por dentro, piscina, árvores, caminho de pedras e a chave dourada no ar
  imovel(M) {
    const T = THREE; const g = new T.Group(); const caixa = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
    const base = new T.Mesh(new T.CylinderGeometry(1.18, 1.24, 0.1, 72), M.grama); base.position.y = -0.66; g.add(base);
    const borda = new T.Mesh(new T.CylinderGeometry(1.25, 1.28, 0.08, 72), M.pedra); borda.position.y = -0.74; g.add(borda);
    caixa(1.1, 0.46, 0.78, M.parede, -0.12, -0.38, -0.05); // térreo
    caixa(1.22, 0.05, 0.9, M.concreto, -0.12, -0.13, -0.05); // laje do térreo
    caixa(0.78, 0.4, 0.62, M.madeiraClara, 0.12, 0.09, -0.1); // andar de cima, revestido de madeira
    caixa(0.94, 0.05, 0.76, M.concreto, 0.12, 0.315, -0.1); // telhado
    caixa(0.52, 0.3, 0.02, M.janela, -0.3, -0.38, 0.345); caixa(0.02, 0.3, 0.46, M.janela, 0.435, -0.38, -0.02); // vidros do térreo
    caixa(0.5, 0.2, 0.02, M.janela, 0.12, 0.1, 0.21); caixa(0.02, 0.2, 0.36, M.janela, 0.51, 0.1, -0.1); // faixa de vidro de cima
    caixa(0.18, 0.34, 0.03, M.madeira, 0.18, -0.44, 0.35); // porta
    caixa(0.6, 0.03, 0.3, M.madeiraClara, -0.3, -0.595, 0.5); // deck de madeira, acima da grama (na mesma altura, as duas superfícies brigavam e piscavam)
    const borPisc = caixa(0.62, 0.05, 0.38, M.pedra, 0.52, -0.6, 0.55); borPisc.scale.set(1, 1, 1);
    caixa(0.54, 0.04, 0.3, M.agua, 0.52, -0.57, 0.55); // piscina
    [[-0.08, -0.6, 0.72], [0.02, -0.6, 0.88], [-0.12, -0.6, 1.0]].forEach(([x, y, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.02, 20), M.pedra); p.position.set(x, y, z); g.add(p); });
    const arvore = (x, z, s) => { const a = new T.Group(); const tr = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.3, 10), M.tronco); tr.position.y = 0.15; a.add(tr);
      [[0, 0.42, 0, 0.2], [0.09, 0.34, 0.04, 0.14], [-0.08, 0.36, -0.03, 0.15]].forEach(([fx, fy, fz, r]) => { const f = new T.Mesh(new T.SphereGeometry(r, 24, 16), M.folha); f.position.set(fx, fy, fz); a.add(f); });
      a.position.set(x, -0.61, z); a.scale.setScalar(s); g.add(a); };
    arvore(-0.85, 0.35, 1); arvore(-0.75, -0.55, 0.8); arvore(0.85, -0.45, 0.9);
    const chave = new T.Group(); const arg = new T.Mesh(new T.TorusGeometry(0.11, 0.035, 24, 64), M.ouro); const haste = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.42, 16), M.ouro);
    haste.rotation.z = Math.PI / 2; haste.position.x = 0.32; const d1 = new T.Mesh(new T.BoxGeometry(0.05, 0.1, 0.04), M.ouro); d1.position.set(0.45, -0.06, 0); const d2 = d1.clone(); d2.position.x = 0.36;
    chave.add(arg, haste, d1, d2); chave.position.set(0.5, 0.72, 0.25); chave.rotation.set(0.4, -0.5, 0.5); g.add(chave);
    g.rotation.set(0.32, -0.62, 0); g.userData.zoom = 1.22; return g; // cena larga e baixa: um pouco mais de zoom
  },
  viagem(M) {
    const T = THREE; const g = new T.Group(); const av = new T.Group();
    const fus = new T.Mesh(new T.LatheGeometry([V2(0, -1.15), V2(0.08, -1.1), V2(0.17, -0.85), V2(0.21, -0.4), V2(0.21, 0.5), V2(0.17, 0.85), V2(0.09, 1.08), V2(0, 1.14)], 64), M.branco);
    fus.rotation.z = -Math.PI / 2; av.add(fus);
    const cab = new T.Mesh(new T.SphereGeometry(0.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.vidro); cab.position.set(0.92, 0.09, 0); cab.rotation.z = -0.9; cab.scale.set(1, 0.6, 1.25); av.add(cab);
    const asaS = new T.Shape(); asaS.moveTo(-0.28, 0); asaS.lineTo(0.3, 0); asaS.lineTo(-0.05, 1.05); asaS.lineTo(-0.24, 1.05); asaS.lineTo(-0.28, 0);
    const asaG = new T.ExtrudeGeometry(asaS, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 4 });
    [1, -1].forEach((ld) => { const a = new T.Mesh(asaG, M.branco); a.rotation.x = (ld * Math.PI) / 2; a.position.set(0.05, -0.04, 0); av.add(a);
      const ponta = new T.Mesh(new T.BoxGeometry(0.2, 0.06, 0.03), M.azul); ponta.position.set(-0.15, -0.02, ld * 1.06); av.add(ponta);
      const mot = new T.Mesh(new T.CylinderGeometry(0.075, 0.065, 0.32, 32), M.cinza); mot.rotation.z = Math.PI / 2; mot.position.set(0.15, -0.14, ld * 0.48); av.add(mot); });
    const caudaS = new T.Shape(); caudaS.moveTo(-0.15, 0); caudaS.lineTo(0.18, 0); caudaS.lineTo(-0.02, 0.48); caudaS.lineTo(-0.17, 0.48); caudaS.lineTo(-0.15, 0);
    const cauda = new T.Mesh(new T.ExtrudeGeometry(caudaS, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.015, bevelSegments: 3 }), M.azul); cauda.position.set(-0.92, 0.08, -0.015); av.add(cauda);
    const estS = new T.Shape(); estS.moveTo(-0.12, 0); estS.lineTo(0.12, 0); estS.lineTo(-0.02, 0.36); estS.lineTo(-0.12, 0.36); estS.lineTo(-0.12, 0);
    const estG = new T.ExtrudeGeometry(estS, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2 });
    [1, -1].forEach((ld) => { const e = new T.Mesh(estG, M.branco); e.rotation.x = (ld * Math.PI) / 2; e.position.set(-0.95, 0.05, 0); av.add(e); });
    const faixa = new T.Mesh(new T.CylinderGeometry(0.212, 0.212, 1.3, 64, 1, true, -0.25, 0.5), M.azul); faixa.rotation.z = Math.PI / 2; faixa.position.x = 0.05; faixa.rotation.y = Math.PI / 2; av.add(faixa);
    av.rotation.set(0.15, -0.55, 0.28); g.add(av);
    const nuvem = (x, y, z, s) => { const n = new T.Group(); [[0, 0, 0, 0.32], [0.3, -0.04, 0, 0.24], [-0.3, -0.05, 0.02, 0.22], [0.12, 0.14, -0.04, 0.22]].forEach(([a, b, c, r]) => { const b2 = new T.Mesh(new T.SphereGeometry(r, 32, 24), M.nuvem); b2.position.set(a, b, c); n.add(b2); }); n.position.set(x, y, z); n.scale.setScalar(s); return n; };
    g.add(nuvem(-0.9, -0.75, -0.4, 0.8), nuvem(1.0, 0.75, -0.6, 0.6)); return g;
  },
  educacao(M) {
    const T = THREE; const g = new T.Group();
    const livros = [[0x2E5AAC, 0.9, 0.16], [0xB8322F, 0.82, 0.14], [0x2F8F5B, 0.86, 0.15]]; let y = -0.75;
    livros.forEach(([cor, w, h], i) => { const capa = new T.MeshPhysicalMaterial({ color: cor, roughness: 0.45, clearcoat: 0.5 }); const l = new T.Mesh(new T.BoxGeometry(w * 1.3, h, w), capa); l.position.set(i % 2 ? 0.05 : -0.04, y + h / 2, 0); l.rotation.y = (i - 1) * 0.18;
      const pg = new T.Mesh(new T.BoxGeometry(w * 1.3 - 0.04, h - 0.04, w - 0.04), M.papel); pg.position.copy(l.position); pg.position.z += 0.025; pg.rotation.y = l.rotation.y; g.add(l, pg); y += h; });
    const chapeu = new T.Group(); const tampa = new T.Mesh(new T.BoxGeometry(1.25, 0.05, 1.25), M.marinho); tampa.rotation.y = Math.PI / 4; tampa.position.y = 0.3;
    const copa = new T.Mesh(new T.CylinderGeometry(0.4, 0.44, 0.32, 64), M.marinho); copa.position.y = 0.13;
    const botao = new T.Mesh(new T.SphereGeometry(0.05, 24, 16), M.ouro); botao.position.y = 0.34;
    const cordao = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.62, 8), M.ouro); cordao.rotation.z = Math.PI / 2; cordao.position.set(0.31, 0.34, 0);
    const pend = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.3, 8), M.ouro); pend.position.set(0.62, 0.2, 0); const borla = new T.Mesh(new T.ConeGeometry(0.06, 0.18, 24), M.ouro); borla.position.set(0.62, 0.02, 0);
    chapeu.add(tampa, copa, botao, cordao, pend, borla); chapeu.position.y = y + 0.05; chapeu.rotation.set(0.12, 0.3, -0.08); g.add(chapeu);
    g.rotation.set(0.25, -0.5, 0); return g;
  },
  filhos(M) {
    const T = THREE; const g = new T.Group(); const esf = (r, mat, x, y, z, sx, sy, sz) => { const m = new T.Mesh(new T.SphereGeometry(r, 48, 32), mat); m.position.set(x, y, z); if (sx) m.scale.set(sx, sy, sz); g.add(m); return m; };
    esf(0.55, M.pelucia, 0, -0.42, 0, 1, 1.05, 0.9); esf(0.32, M.peluciaClara, 0, -0.38, 0.33, 1, 1.1, 0.5);
    esf(0.46, M.pelucia, 0, 0.38, 0.02); esf(0.17, M.pelucia, -0.36, 0.72, 0); esf(0.17, M.pelucia, 0.36, 0.72, 0); esf(0.09, M.peluciaClara, -0.36, 0.72, 0.09); esf(0.09, M.peluciaClara, 0.36, 0.72, 0.09);
    esf(0.19, M.peluciaClara, 0, 0.27, 0.38, 1.2, 0.9, 0.8); esf(0.055, M.olho, 0, 0.33, 0.53, 1.3, 1, 1); esf(0.05, M.olho, -0.17, 0.48, 0.4); esf(0.05, M.olho, 0.17, 0.48, 0.4);
    esf(0.2, M.pelucia, -0.55, -0.25, 0.12, 0.9, 1.3, 0.9); esf(0.2, M.pelucia, 0.55, -0.25, 0.12, 0.9, 1.3, 0.9); esf(0.24, M.pelucia, -0.32, -0.88, 0.22, 1, 0.85, 1.1); esf(0.24, M.pelucia, 0.32, -0.88, 0.22, 1, 0.85, 1.1);
    const laco = new T.Group(); [-1, 1].forEach((ld) => { const c = new T.Mesh(new T.ConeGeometry(0.11, 0.2, 32), M.fita); c.rotation.z = (ld * Math.PI) / 2; c.position.x = ld * 0.1; laco.add(c); }); laco.add(new T.Mesh(new T.SphereGeometry(0.05, 24, 16), M.fita)); laco.position.set(0, -0.02, 0.4); g.add(laco);
    g.rotation.set(0.1, -0.3, 0); return g;
  },
  // ilha tropical: água turquesa, areia, coqueiro de tronco curvo com cocos, espreguiçadeira, guarda-sol e um sol que brilha
  aposentadoria(M) {
    const T = THREE; const g = new T.Group();
    const mar = new T.Mesh(new T.CylinderGeometry(1.0, 1.04, 0.08, 72), M.agua); mar.position.y = -0.72; g.add(mar);
    const areia = new T.Mesh(new T.SphereGeometry(0.95, 64, 24, 0, Math.PI * 2, 0, 0.62), M.areia); areia.scale.y = 0.32; areia.position.y = -0.85; g.add(areia);
    // coqueiro: tronco curvo com anéis, folhas caídas em leque e três cocos
    const curva = new T.CatmullRomCurve3([new T.Vector3(-0.25, -0.62, 0), new T.Vector3(-0.2, -0.2, 0.02), new T.Vector3(-0.05, 0.22, 0.04), new T.Vector3(0.12, 0.58, 0.05)]);
    g.add(new T.Mesh(new T.TubeGeometry(curva, 40, 0.055, 14), M.tronco));
    for (let i = 1; i < 10; i++) { const t = i / 10; const p = curva.getPointAt(t); const tg = curva.getTangentAt(t); const anel = new T.Mesh(new T.TorusGeometry(0.058, 0.012, 8, 20), M.troncoEsc);
      anel.position.copy(p); anel.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tg); g.add(anel); }
    const topo = curva.getPointAt(1); const folhaS = new T.Shape(); folhaS.moveTo(0, 0); folhaS.quadraticCurveTo(0.2, 0.17, 0.72, -0.02); folhaS.quadraticCurveTo(0.2, -0.13, 0, 0);
    const folhaG = new T.ExtrudeGeometry(folhaS, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 2 });
    for (let i = 0; i < 8; i++) { const f = new T.Mesh(folhaG, M.folha); f.rotation.x = Math.PI / 2; const caida = new T.Group(); caida.rotation.z = -(0.3 + (i % 2) * 0.3); caida.add(f); const piv = new T.Group(); piv.position.copy(topo); piv.rotation.y = (i / 8) * Math.PI * 2; piv.add(caida); g.add(piv); }
    [[0.04, -0.07, 0.04], [-0.05, -0.08, -0.02], [0.02, -0.09, -0.06]].forEach(([x, y, z]) => { const c = new T.Mesh(new T.SphereGeometry(0.05, 20, 14), M.coco); c.position.set(topo.x + x, topo.y + y, topo.z + z); g.add(c); });
    // espreguiçadeira listrada
    const esp = new T.Group(); const assento = new T.Mesh(new T.BoxGeometry(0.42, 0.03, 0.2), M.coral); esp.add(assento);
    const encosto = new T.Mesh(new T.BoxGeometry(0.2, 0.03, 0.2), M.lona); encosto.position.set(-0.27, 0.07, 0); encosto.rotation.z = 0.7; esp.add(encosto);
    [[-0.17, 0.09], [-0.17, -0.09], [0.17, 0.09], [0.17, -0.09]].forEach(([x, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.08, 8), M.madeira); p.position.set(x, -0.05, z); esp.add(p); });
    esp.position.set(0.35, -0.5, 0.35); esp.rotation.y = -0.5; g.add(esp);
    // guarda-sol com gomos alternados
    const gs = new T.Group(); for (let i = 0; i < 8; i++) gs.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.36, 0.14, 6, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? M.lona : M.coral));
    const mastro = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.55, 10), M.madeira); mastro.position.y = -0.3; gs.add(mastro); gs.position.set(0.62, -0.08, 0.05); gs.rotation.z = 0.18; g.add(gs);
    // sol com halo
    const sol = new T.Mesh(new T.SphereGeometry(0.17, 40, 28), M.sol); sol.position.set(0.82, 0.68, -0.55); g.add(sol);
    const halo = new T.Mesh(new T.SphereGeometry(0.3, 32, 20), M.halo); halo.position.copy(sol.position); g.add(halo);
    g.rotation.set(0.26, -0.45, 0); g.userData.zoom = 1.2; return g;
  },
  negocio(M) {
    const T = THREE; const g = new T.Group(); const w = 1.5; const h = 1.02; const r = 0.14; const s = new T.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const corpo = new T.ExtrudeGeometry(s, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 8, curveSegments: 16 }); corpo.center(); g.add(new T.Mesh(corpo, M.couro));
    const faixa = new T.Mesh(new T.BoxGeometry(w + 0.13, 0.04, 0.54), M.couroEsc); faixa.position.y = 0.16; g.add(faixa);
    const alca = new T.Mesh(new T.TorusGeometry(0.22, 0.045, 24, 48, Math.PI), M.couroEsc); alca.position.y = h / 2 + 0.06; g.add(alca);
    [-0.42, 0.42].forEach((x) => { const f = new T.Mesh(new T.BoxGeometry(0.16, 0.11, 0.05), M.ouro); f.position.set(x, 0.16, 0.27); g.add(f); });
    const m1 = o3Moeda(M); m1.scale.setScalar(0.55); m1.position.set(0.95, 0.75, 0.2); m1.rotation.set(1.2, 0.2, 0.4); g.add(m1);
    g.rotation.set(0.25, -0.5, 0); return g;
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
    const chip = new T.Mesh(new T.BoxGeometry(0.22, 0.17, 0.012), M.ouro); chip.position.set(-0.52, 0.02, 0.028); g.add(chip);
    g.rotation.set(-0.3, 0.45, 0.08); return g;
  },
  trofeu(M) {
    const T = THREE; const g = new T.Group();
    g.add(new T.Mesh(new T.LatheGeometry([V2(0, 0.05), V2(0.5, 0.95), V2(0.56, 1.05), V2(0.52, 1.07), V2(0.44, 0.97), V2(0, 0.2)].map((v) => V2(v.x, v.y - 0.3)), 64), M.ouro));
    [-1, 1].forEach((d) => { const a = new T.Mesh(new T.TorusGeometry(0.2, 0.04, 16, 40, Math.PI * 1.2), M.ouro); a.position.set(d * 0.5, 0.42, 0); a.rotation.z = d > 0 ? -0.6 : Math.PI + 0.6; g.add(a); });
    const haste = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 0.4, 24), M.ouro); haste.position.y = -0.45; g.add(haste);
    const base = new T.Mesh(new T.BoxGeometry(0.62, 0.18, 0.62), M.marinho || M.ouro); base.position.y = -0.72; g.add(base);
    g.rotation.set(0.15, -0.3, 0); return g;
  },
  presente(M) {
    const T = THREE; const g = new T.Group();
    g.add(new T.Mesh(new T.BoxGeometry(1, 0.8, 1), M.azul));
    const tampa = new T.Mesh(new T.BoxGeometry(1.08, 0.2, 1.08), M.azul); tampa.position.y = 0.48; g.add(tampa);
    [[0.14, 1.02, 1.1], [1.1, 1.02, 0.14]].forEach(([x, y, z]) => { const f = new T.Mesh(new T.BoxGeometry(x, y, z), M.ouro); f.position.y = 0.1; g.add(f); });
    [-1, 1].forEach((d) => { const l = new T.Mesh(new T.TorusGeometry(0.17, 0.05, 16, 40), M.ouro); l.position.set(d * 0.16, 0.7, 0); l.rotation.set(0, d * 0.5, d * 0.5); g.add(l); });
    g.rotation.set(0.35, -0.6, 0); return g;
  },
  diamante(M) {
    const T = THREE; const g = new T.Group();
    g.add(new T.Mesh(new T.LatheGeometry([V2(0, -0.85), V2(0.78, 0.12), V2(0.8, 0.2), V2(0.5, 0.48), V2(0, 0.5)], 12), M.diamante));
    [[0.95, 0.6, 0.2, 0.12], [-0.95, -0.3, -0.2, 0.09]].forEach(([x, y, z, r]) => { const b = new T.Mesh(new T.OctahedronGeometry(r, 0), M.diamante); b.position.set(x, y, z); g.add(b); });
    g.rotation.set(0.3, 0.2, 0); return g;
  },
  outro(M) {
    const T = THREE; const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.38 : 0.95; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 10, curveSegments: 4 }); geo.center();
    const g = new T.Group(); g.add(new T.Mesh(geo, M.ouro));
    [[0.95, 0.7, 0.2, 0.12], [-0.9, 0.55, -0.2, 0.09], [0.75, -0.75, 0.3, 0.07]].forEach(([x, y, z, r]) => { const b = new T.Mesh(new T.OctahedronGeometry(r, 0), M.diamante); b.position.set(x, y, z); g.add(b); });
    g.rotation.set(0.15, -0.35, 0); return g;
  },
};

/* ---------- estúdio ---------- */
function o3Estudio(renderer) {
  const T = THREE; const pm = new T.PMREMGenerator(renderer); const s = new T.Scene();
  s.add(new T.Mesh(new T.BoxGeometry(12, 12, 12), new T.MeshBasicMaterial({ color: 0x0A1530, side: T.BackSide })));
  const caixa = (cor, f, w, h, x, y, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(cor).multiplyScalar(f), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  caixa(0xFFFFFF, 7, 5, 2.2, 0, 5.5, 1.5); caixa(0xFFFFFF, 3.2, 2, 5, -5.5, 1, 2); caixa(0x8EC5FF, 4.5, 2, 5, 5.5, 0.5, -1.5); caixa(0xFFE0B0, 2.4, 4, 1.2, 0, -3, 5.5); caixa(0xB5A8FF, 2, 3, 3, -2, 2, -5.5);
  const t = pm.fromScene(s, 0.03).texture; pm.dispose(); return t;
}
function o3Criar() {
  const T = THREE;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98; renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene(); scene.environment = o3Estudio(renderer);
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 50); camera.position.set(0, 0, 5);
  const key = new T.DirectionalLight(0xFFFFFF, 1.6); key.position.set(3, 4, 5); const rim = new T.DirectionalLight(0x6CB4FF, 2.2); rim.position.set(-4, 2, -4);
  scene.add(key, rim, new T.HemisphereLight(0xD6E8FF, 0x0B1630, 0.5));
  const pivo = new T.Group(); scene.add(pivo);
  renderer.domElement.className = 'ob3d-canvas';
  O3 = { renderer, scene, camera, pivo, obj: null, tipo: null, M: o3Mat(), alvo: [0, 0], atual: [0, 0], t0: 0, entrada: 0, raf: 0, visivel: true, host: null };
  document.addEventListener('visibilitychange', o3Rodar);
  O3.io = new IntersectionObserver((es) => { O3.visivel = es.some((e) => e.isIntersecting); o3Rodar(); });
  O3.ro = new ResizeObserver(o3Tamanho);
}
function o3Descartar(o) { o.traverse((n) => { if (n.geometry) n.geometry.dispose(); const ms = Array.isArray(n.material) ? n.material : n.material ? [n.material] : []; ms.forEach((m) => { if (m.bumpMap) m.bumpMap.dispose(); if (m.map) m.map.dispose(); if (!Object.values(O3.M).includes(m)) m.dispose(); }); }); }
function o3Objeto(tipo) {
  if (O3.tipo === tipo && O3.obj) return; const T = THREE;
  if (O3.obj) { O3.pivo.remove(O3.obj); o3Descartar(O3.obj); }
  const o = (O3_OBJ[tipo] || O3_OBJ.outro)(O3.M);
  // as cores foram escritas em sRGB (como no CSS); o renderizador trabalha em linear: converte uma vez por material
  o.traverse((n) => { (Array.isArray(n.material) ? n.material : n.material ? [n.material] : []).forEach((m) => {
    if (m.userData.lin) return; m.userData.lin = true; ['color', 'emissive', 'sheen'].forEach((k) => { if (m[k] && m[k].isColor) m[k].convertSRGBToLinear(); }); }); });
  // enquadra: o objeto ocupa sempre o mesmo espaço, centralizado
  const cx = new T.Box3().setFromObject(o); const tam = cx.getSize(new T.Vector3()); const centro = cx.getCenter(new T.Vector3());
  const k = (2.05 / Math.max(tam.x, tam.y, tam.z * 0.8)) * (o.userData.zoom || 1); const roda = new T.Group(); o.position.sub(centro); roda.add(o); roda.scale.setScalar(k);
  O3.pivo.add(roda); O3.obj = roda; O3.tipo = tipo; O3.entrada = performance.now();
}
function o3Tamanho() { if (!O3 || !O3.host) return; const w = O3.host.clientWidth; const h = O3.host.clientHeight; if (!w || !h) return; O3.renderer.setSize(w, h, false); O3.camera.aspect = w / h; O3.camera.updateProjectionMatrix(); o3Quadro(performance.now()); }
const o3Saida = (x) => 1 - Math.pow(1 - x, 3);
function o3Quadro(agora) {
  if (!O3 || !O3.obj) return; const calmo = o3Calmo(); const t = (agora - O3.t0) / 1000;
  O3.atual = O3.atual.map((v, i) => v + (O3.alvo[i] - v) * 0.08);
  O3.pivo.rotation.y = O3.atual[0] * 0.55; O3.pivo.rotation.x = O3.atual[1] * 0.35;
  const e = calmo ? 1 : o3Saida(Math.min(1, (agora - O3.entrada) / 1100)); // entra voando de dentro do card
  O3.obj.position.set((1 - e) * -1.6, (1 - e) * -1.1 + (calmo ? 0 : Math.sin(t * 1.3) * 0.07), 0); O3.obj.rotation.y = calmo ? 0 : (1 - e) * -1.4 + Math.sin(t * 0.45) * 0.35; O3.obj.rotation.z = calmo ? 0 : Math.sin(t * 0.8) * 0.04;
  const esc = 0.55 + 0.45 * e; O3.pivo.scale.setScalar(esc);
  O3.renderer.render(O3.scene, O3.camera);
}
function o3Rodar() {
  if (!O3) return; const deve = O3.host && O3.visivel && !document.hidden && !o3Calmo();
  if (deve && !O3.raf) { const laco = (a) => { o3Quadro(a); O3.raf = requestAnimationFrame(laco); }; O3.raf = requestAnimationFrame(laco); }
  else if (!deve && O3.raf) { cancelAnimationFrame(O3.raf); O3.raf = 0; }
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
    if (!card.dataset.o3m) { card.dataset.o3m = '1';
      card.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'mouse' || !O3) return; const r = card.getBoundingClientRect(); O3.alvo = [((ev.clientX - r.left) / r.width) * 2 - 1, ((ev.clientY - r.top) / r.height) * 2 - 1]; });
      card.addEventListener('pointerleave', () => { if (O3) O3.alvo = [0, 0]; }); }
  }).catch(() => falhou());
}
