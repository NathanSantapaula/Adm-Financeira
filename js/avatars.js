/* Avatares do perfil: foto enviada pelo cliente (recortada no aparelho) ou um avatar da coleção.
   A coleção é desenhada em SVG (leve, nítida em qualquer tamanho, combina com os 3 temas) e agrupada
   pelos perfis de investidor. Para usar imagens próprias, veja CFG.avatares no config.js. */
'use strict';

const AV_GRUPOS = [
  { id: 'protecao', nome: 'Proteção', perfil: 'conservador', desc: 'Base sólida, segurança e previsibilidade.' },
  { id: 'equilibrio', nome: 'Equilíbrio', perfil: 'moderado', desc: 'Proteção e crescimento na medida.' },
  { id: 'crescimento', nome: 'Crescimento', perfil: 'agressivo', desc: 'Visão de longo prazo e ousadia.' },
  { id: 'tecnologia', nome: 'Tecnologia', perfil: null, desc: 'Para qualquer perfil.' },
];

// [id, nome, grupo, cor inicial, cor final, desenho]
const AV_LISTA = [
  ['escudo', 'Escudo', 'protecao', '#0B3D91', '#1FA2A6'],
  ['alicerce', 'Alicerce', 'protecao', '#123A6B', '#3A7BD5'],
  ['cofre', 'Cofre', 'protecao', '#0F2C4D', '#2BB5A3'],
  ['horizonte', 'Horizonte', 'protecao', '#1B2A49', '#4C8DFF'],
  ['orbita', 'Órbita', 'equilibrio', '#3B2A8C', '#5AC8FA'],
  ['equilibrio', 'Equilíbrio', 'equilibrio', '#4527A0', '#8E7CFF'],
  ['onda', 'Onda', 'equilibrio', '#1D3E8C', '#7A5CFA'],
  ['constelacao', 'Constelação', 'equilibrio', '#2E1F6B', '#3FB6D9'],
  ['vetor', 'Vetor', 'crescimento', '#C2185B', '#FF8A3D'],
  ['pulso', 'Pulso', 'crescimento', '#B4235A', '#FFB300'],
  ['prisma', 'Prisma', 'crescimento', '#7B1FA2', '#FF4F81'],
  ['ignicao', 'Ignição', 'crescimento', '#D84315', '#FFC046'],
  ['circuito', 'Circuito', 'tecnologia', '#0A0F1F', '#00C2A8'],
  ['grade', 'Grade', 'tecnologia', '#101828', '#6366F1'],
  ['nucleo', 'Núcleo', 'tecnologia', '#111827', '#22D3EE'],
  ['mosaico', 'Mosaico', 'tecnologia', '#0F172A', '#A78BFA'],
];

let avSeq = 0;
const avW = (o) => `stroke="#fff" stroke-opacity="${o}"`;
function avDesenho(id, seed) {
  switch (id) {
    case 'escudo': return `<path d="M50 17 76 27v22c0 17-11 28-26 34-15-6-26-17-26-34V27Z" fill="#fff" fill-opacity=".14" ${avW(0.95)} stroke-width="2.6" stroke-linejoin="round"/><path d="M50 29 66 35v14c0 10-7 17-16 21-9-4-16-11-16-21V35Z" fill="none" ${avW(0.5)} stroke-width="2"/><path d="m42 49 6 6 11-12" fill="none" ${avW(0.95)} stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'alicerce': return [24, 12, 0].map((dy, i) => `<path d="M50 ${30 + dy} 76 ${43 + dy} 50 ${56 + dy} 24 ${43 + dy}Z" fill="#fff" fill-opacity="${[0.28, 0.55, 0.95][i]}" ${avW(0.9)} stroke-width="1.2" stroke-linejoin="round"/>`).join('');
    case 'cofre': return `<rect x="22" y="22" width="56" height="56" rx="14" fill="#fff" fill-opacity=".1" ${avW(0.85)} stroke-width="2.4"/><circle cx="50" cy="50" r="15" fill="none" ${avW(0.95)} stroke-width="2.6"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; const r1 = 19; const r2 = i % 3 ? 22 : 24; return `<line x1="${(50 + r1 * Math.cos(a)).toFixed(1)}" y1="${(50 + r1 * Math.sin(a)).toFixed(1)}" x2="${(50 + r2 * Math.cos(a)).toFixed(1)}" y2="${(50 + r2 * Math.sin(a)).toFixed(1)}" ${avW(0.7)} stroke-width="1.6" stroke-linecap="round"/>`; }).join('')}<line x1="50" y1="50" x2="58" y2="42" ${avW(0.95)} stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#fff"/>`;
    case 'horizonte': return `<circle cx="50" cy="60" r="19" fill="#fff" fill-opacity=".92"/><rect x="0" y="60" width="100" height="40" fill="#000" fill-opacity=".18"/>${[64, 68, 73, 79, 86].map((y, i) => `<line x1="10" y1="${y}" x2="90" y2="${y}" ${avW(0.8 - i * 0.13)} stroke-width="1.6"/>`).join('')}<line x1="6" y1="60" x2="94" y2="60" ${avW(0.95)} stroke-width="2"/>`;
    case 'orbita': return `<ellipse cx="50" cy="50" rx="36" ry="13" transform="rotate(-22 50 50)" fill="none" ${avW(0.85)} stroke-width="2"/><ellipse cx="50" cy="50" rx="36" ry="13" transform="rotate(38 50 50)" fill="none" ${avW(0.45)} stroke-width="1.6"/><circle cx="50" cy="50" r="13" fill="#fff" fill-opacity=".95"/><circle cx="80" cy="39" r="4" fill="#fff"/><circle cx="29" cy="74" r="2.6" fill="#fff" fill-opacity=".8"/>`;
    case 'equilibrio': return `<circle cx="40" cy="50" r="22" fill="#fff" fill-opacity=".9"/><circle cx="60" cy="50" r="22" fill="#fff" fill-opacity=".12" ${avW(0.95)} stroke-width="2.4"/><line x1="18" y1="80" x2="82" y2="80" ${avW(0.7)} stroke-width="2" stroke-linecap="round"/><path d="M50 74 44 80h12Z" fill="#fff" fill-opacity=".8"/>`;
    case 'onda': return [[30, 0.95, 3], [44, 0.6, 2.4], [58, 0.35, 2]].map(([y, o, w], i) => `<path d="M8 ${y + 16} C 22 ${y - 4}, 36 ${y - 4}, 50 ${y + 16} S 78 ${y + 36}, 92 ${y + 16}" fill="none" ${avW(o)} stroke-width="${w}" stroke-linecap="round" transform="translate(0 ${i * 2})"/>`).join('');
    case 'constelacao': { const pts = [[24, 30], [44, 22], [62, 36], [78, 26], [70, 58], [48, 66], [30, 56]]; const ln = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 0], [1, 6]];
      return ln.map(([a, b]) => `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" ${avW(0.55)} stroke-width="1.4"/>`).join('') + pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 5 : 2.8}" fill="#fff" fill-opacity="${i === 2 ? 1 : 0.85}"/>`).join(''); }
    case 'vetor': return `<path d="M18 74 34 60 48 66 64 44 80 30V80H18Z" fill="#fff" fill-opacity=".16"/><polyline points="18,74 34,60 48,66 64,44 80,30" fill="none" ${avW(0.95)} stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 28h11v11" fill="none" ${avW(0.95)} stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="80" x2="84" y2="80" ${avW(0.5)} stroke-width="1.6"/>`;
    case 'pulso': return `${[34, 24, 14].map((r, i) => `<circle cx="50" cy="50" r="${r}" fill="none" ${avW(0.18 + i * 0.12)} stroke-width="1.4"/>`).join('')}<path d="M10 52h22l6-15 9 30 8-38 6 23h29" fill="none" ${avW(0.97)} stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'prisma': return `<path d="M50 22 78 72H22Z" fill="#fff" fill-opacity=".14" ${avW(0.95)} stroke-width="2.4" stroke-linejoin="round"/><line x1="8" y1="56" x2="38" y2="50" ${avW(0.95)} stroke-width="2.4" stroke-linecap="round"/>${[['#7DF9FF', 42], ['#FFE066', 50], ['#FFFFFF', 58]].map(([c, y]) => `<line x1="62" y1="${46 + (y - 50) / 4}" x2="94" y2="${y}" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".95"/>`).join('')}`;
    case 'ignicao': return `${Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8; const r2 = i % 2 ? 26 : 36; return `<line x1="${(50 + 14 * Math.cos(a)).toFixed(1)}" y1="${(50 + 14 * Math.sin(a)).toFixed(1)}" x2="${(50 + r2 * Math.cos(a)).toFixed(1)}" y2="${(50 + r2 * Math.sin(a)).toFixed(1)}" ${avW(i % 2 ? 0.55 : 0.95)} stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}<circle cx="50" cy="50" r="9" fill="#fff"/>`;
    case 'circuito': return `<path d="M38 44H26l-6-6M62 44h12l6-8M44 62v10l-6 6M56 62v6h14M50 38V22M62 54h18" fill="none" ${avW(0.85)} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>${[[20, 38], [80, 36], [38, 78], [70, 68], [50, 20], [82, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#0B0F1A" fill-opacity=".55" ${avW(0.95)} stroke-width="2"/>`).join('')}<rect x="38" y="38" width="24" height="24" rx="5" fill="#fff" fill-opacity=".95"/><rect x="44" y="44" width="12" height="12" rx="2.5" fill="#00C2A8" fill-opacity=".85"/>`;
    case 'grade': return `${[-60, -36, -18, -6, 6, 18, 36, 60].map((dx) => `<line x1="50" y1="44" x2="${50 + dx * 1.4}" y2="100" ${avW(0.45)} stroke-width="1.2"/>`).join('')}${[50, 56, 65, 78, 96].map((y, i) => `<line x1="0" y1="${y}" x2="100" y2="${y}" ${avW(0.25 + i * 0.12)} stroke-width="1.2"/>`).join('')}<circle cx="50" cy="30" r="12" fill="#fff" fill-opacity=".9"/><line x1="0" y1="44" x2="100" y2="44" ${avW(0.9)} stroke-width="1.8"/>`;
    case 'nucleo': return `${[0, 60, 120].map((r) => `<ellipse cx="50" cy="50" rx="34" ry="12" transform="rotate(${r} 50 50)" fill="none" ${avW(0.8)} stroke-width="2"/>`).join('')}<circle cx="50" cy="50" r="7" fill="#fff"/><circle cx="84" cy="50" r="3" fill="#fff" fill-opacity=".9"/>`;
    case 'mosaico': { // identicon simétrico gerado pelo nome do cliente: cada pessoa tem o seu
      let h = 2166136261; String(seed || 'fp').split('').forEach((c) => { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; });
      let out = ''; for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) { const bit = (h >>> (y * 3 + x)) & 1; if (!bit) continue; const op = 0.55 + (((h >>> (x + y)) & 3) * 0.15);
        [x, 4 - x].filter((v, i, a) => a.indexOf(v) === i).forEach((cx) => { out += `<rect x="${18 + cx * 13}" y="${18 + y * 13}" width="11" height="11" rx="3" fill="#fff" fill-opacity="${op.toFixed(2)}"/>`; }); }
      return out || '<rect x="44" y="44" width="12" height="12" rx="3" fill="#fff"/>'; }
    default: return '';
  }
}
function avSvg(id, seed) {
  const a = AV_LISTA.find((x) => x[0] === id); if (!a) return '';
  const u = 'av' + (++avSeq);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar ${a[1]}"><defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a[3]}"/><stop offset="1" stop-color="${a[4]}"/></linearGradient><radialGradient id="${u}r" cx=".28" cy=".2" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#${u}g)"/>${avDesenho(id, seed)}<rect width="100" height="100" fill="url(#${u}r)"/></svg>`;
}
// Coleção completa: a desenhada + imagens próprias definidas em CFG.avatares [{ id, nome, grupo, src }]
function avColecao() {
  const extra = Array.isArray(CFG.avatares) ? CFG.avatares.filter((x) => x && x.id && x.src) : [];
  return AV_LISTA.map((a) => ({ id: a[0], nome: a[1], grupo: a[2] })).concat(extra.map((x) => ({ id: 'img:' + x.id, nome: x.nome || x.id, grupo: x.grupo || 'tecnologia', src: x.src })));
}
const FOTO_OK = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
function avatarHtml(p, cls) {
  p = p || {}; const a = p.avatar; const c = 'av' + (cls ? ' ' + cls : '');
  if (a && a.tipo === 'foto' && FOTO_OK.test(a.data || '')) return `<span class="${c} img"><img src="${a.data}" alt=""></span>`;
  if (a && a.tipo === 'preset') {
    const it = avColecao().find((x) => x.id === a.id);
    if (it && it.src) return `<span class="${c} img"><img src="${esc(it.src)}" alt=""></span>`;
    if (it) return `<span class="${c} preset">${avSvg(it.id, p.nome || p.email)}</span>`;
  }
  return `<span class="${c}">${esc(((p.apelido || p.nome || 'C').trim().charAt(0) || 'C').toUpperCase())}</span>`;
}
// Recorta a foto em quadrado (levemente acima do centro em retratos, onde costuma estar o rosto) e reduz para 320 px.
async function fotoParaAvatar(file) {
  if (!file || !/^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type || '')) throw new Error('tipo');
  if (file.size > 15 * 1024 * 1024) throw new Error('grande');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('ler')); i.src = url; });
    const w = img.naturalWidth; const h = img.naturalHeight; const s = Math.min(w, h); if (!s) throw new Error('ler');
    const sx = (w - s) / 2; const sy = h > w ? (h - s) * 0.3 : (h - s) / 2;
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 320; const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, sx, sy, s, s, 0, 0, 320, 320);
    let q = 0.86; let data = cv.toDataURL('image/webp', q); if (!/^data:image\/webp/.test(data)) data = cv.toDataURL('image/jpeg', q);
    while (data.length > 140000 && q > 0.5) { q -= 0.12; data = cv.toDataURL(/^data:image\/webp/.test(data) ? 'image/webp' : 'image/jpeg', q); }
    return data;
  } finally { URL.revokeObjectURL(url); }
}
