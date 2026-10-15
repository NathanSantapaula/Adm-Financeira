/* Avatares do perfil: foto enviada pelo cliente (recortada no aparelho) ou um dos 3 avatares da coleção AVEN,
   desenhados em SVG com os gradientes, o vidro e a seta da marca (leves, nítidos em qualquer tamanho).
   Avatares antigos que saíram da coleção mostram a inicial do nome. Imagens próprias: CFG.avatares no config.js. */
'use strict';

const AV_GRUPOS = [
  { id: 'aven', nome: 'Coleção AVEN', perfil: null, desc: 'Desenhados com as cores, o vidro e a seta da marca.' },
];

// [id, nome, grupo, cor inicial, cor final]
const AV_LISTA = [
  ['marca', 'Marca', 'aven', '#0B1B33', '#123E8C'],
  ['aurora', 'Aurora', 'aven', '#06122A', '#1A3F8F'],
  ['camadas', 'Camadas', 'aven', '#2E9BFF', '#4B4FE0'],
];

let avSeq = 0;
// vidro: placa translúcida com borda clara e brilho no topo
const avVidro = (x, y, w, h, r, u, op) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" fill-opacity="${op || 0.16}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${u}v)"/><rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="${h - 1.2}" rx="${r - 0.6}" fill="none" stroke="url(#${u}b)" stroke-width="1.2"/>`;
function avDesenho(id, u) {
  switch (id) {
    // a seta do "A" do AVEN, sobre a placa de vidro, com um brilho azul atrás
    case 'marca': return `<circle cx="50" cy="56" r="30" fill="#0A84FF" fill-opacity=".35" filter="url(#${u}f)"/>${avVidro(20, 20, 60, 60, 16, u, 0.1)}<g transform="translate(29 30) scale(.42)"><path d="M0 100 33 0h26l33 100H67L46 34 25 100Z" fill="#fff"/><path d="M46 56 61 100H31Z" fill="#5AC8FA"/></g>`;
    // curva de crescimento atravessando uma placa de vidro, com luzes da aurora
    case 'aurora': return `<circle cx="24" cy="22" r="26" fill="#5AC8FA" fill-opacity=".45" filter="url(#${u}f)"/><circle cx="82" cy="30" r="24" fill="#5E5CE6" fill-opacity=".5" filter="url(#${u}f)"/>${avVidro(16, 30, 68, 46, 12, u, 0.12)}<path d="M22 68 36 58 48 62 62 46 78 36V76H22Z" fill="url(#${u}a)"/><polyline points="22,68 36,58 48,62 62,46 78,36" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="36" r="4" fill="#fff"/>`;
    // três placas de vidro empilhadas, como os cartões do painel
    case 'camadas': return `${avVidro(30, 18, 46, 30, 9, u, 0.12)}${avVidro(24, 33, 52, 32, 10, u, 0.16)}${avVidro(18, 50, 58, 32, 11, u, 0.24)}<rect x="26" y="60" width="22" height="4" rx="2" fill="#fff" fill-opacity=".95"/><rect x="26" y="69" width="34" height="4" rx="2" fill="#fff" fill-opacity=".55"/>`;
    default: return '';
  }
}
function avSvg(id, seed) {
  const a = AV_LISTA.find((x) => x[0] === id); if (!a) return '';
  const u = 'av' + (++avSeq);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar ${a[1]}"><defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a[3]}"/><stop offset="1" stop-color="${a[4]}"/></linearGradient><radialGradient id="${u}r" cx=".28" cy=".2" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="${u}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient><linearGradient id="${u}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5AC8FA" stop-opacity=".55"/><stop offset="1" stop-color="#5AC8FA" stop-opacity="0"/></linearGradient><filter id="${u}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="100" height="100" fill="url(#${u}g)"/>${avDesenho(id, u)}<rect width="100" height="100" fill="url(#${u}r)"/></svg>`;
}
// Coleção completa: a desenhada + imagens próprias definidas em CFG.avatares [{ id, nome, grupo, src }]
function avColecao() {
  const extra = Array.isArray(CFG.avatares) ? CFG.avatares.filter((x) => x && x.id && x.src) : [];
  return AV_LISTA.map((a) => ({ id: a[0], nome: a[1], grupo: a[2] })).concat(extra.map((x) => ({ id: 'img:' + x.id, nome: x.nome || x.id, grupo: 'aven', src: x.src })));
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
