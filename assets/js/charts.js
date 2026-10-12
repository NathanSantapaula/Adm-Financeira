/* Gráficos em SVG puro (sem bibliotecas). As cores vêm de variáveis CSS, então acompanham o tema claro/escuro. */
'use strict';
const niceStep = (raw) => {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
};
const tickFmt = (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi' : Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : String(v));
const escSvg = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function showTip(html, x, y) {
  const t = document.getElementById('tip'); if (!t) return;
  t.innerHTML = html; t.hidden = false;
  const w = t.offsetWidth; const h = t.offsetHeight;
  let left = x + 14; if (left + w > window.innerWidth - 8) left = x - w - 14;
  let top = y - h - 12; if (top < 8) top = y + 16;
  t.style.left = Math.max(8, left) + 'px'; t.style.top = top + 'px';
}
const hideTip = () => { const t = document.getElementById('tip'); if (t) t.hidden = true; };

/* Barras empilhadas por mês, com marcas opcionais (ex.: meta ou orçamento) */
function chartBars(el, cfg) {
  if (!el) return;
  const W = Math.max(280, Math.floor(el.clientWidth || 640)); const H = cfg.height || 240;
  const m = { t: 10, r: 6, b: 24, l: 44 };
  const n = cfg.labels.length; const iw = W - m.l - m.r; const ih = H - m.t - m.b; const band = iw / n;
  const pos = []; const neg = [];
  for (let i = 0; i < n; i++) { let up = 0; let dn = 0; cfg.bars.forEach((s) => { const v = s.values[i] || 0; if (v > 0) up += v; else dn += v; }); pos.push(up); neg.push(dn); }
  const marks = cfg.marks || [];
  const hiV = Math.max(100, ...pos, ...marks.flatMap((k) => k.values)); const loV = Math.min(0, ...neg);
  const step = niceStep((hiV - loV) / 4); const hi = Math.ceil(hiV / step) * step; const lo = Math.floor(loV / step) * step;
  const y = (v) => m.t + ih * (1 - (v - lo) / (hi - lo));
  let g = ''; const nt = Math.round((hi - lo) / step);
  for (let k = 0; k <= nt; k++) { const v = lo + k * step; const yy = y(v); g += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}" class="${Math.abs(v) < 1e-9 ? 'gz' : 'gl'}"/><text x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${tickFmt(+v.toFixed(2))}</text>`; }
  const bw = Math.min(34, band * 0.6); let bars = ''; let mk = ''; let lab = '';
  for (let i = 0; i < n; i++) {
    const x0 = m.l + band * i + (band - bw) / 2; let up = 0; let dn = 0;
    cfg.bars.forEach((s) => {
      const v = s.values[i] || 0; if (Math.abs(v) < 0.005) return; let y1; let y2;
      if (v > 0) { y1 = y(up + v); y2 = y(up); up += v; } else { y1 = y(dn); y2 = y(dn + v); dn += v; }
      bars += `<rect x="${x0.toFixed(1)}" y="${Math.min(y1, y2).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(y2 - y1)).toFixed(1)}" rx="4" fill="${s.color}" stroke="var(--surface)" stroke-width="1.5"/>`;
    });
    marks.forEach((k) => { if (k.values[i] > 0) mk += `<line x1="${(x0 - 4).toFixed(1)}" x2="${(x0 + bw + 4).toFixed(1)}" y1="${y(k.values[i]).toFixed(1)}" y2="${y(k.values[i]).toFixed(1)}" stroke="${k.color}" stroke-width="3" stroke-linecap="round"/>`; });
    if (band >= 28 || i % 2 === 0 || cfg.cur === i) lab += `<text x="${(m.l + band * i + band / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="${cfg.cur === i ? 'cur-l' : ''}">${escSvg(cfg.labels[i])}</text>`;
  }
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escSvg(cfg.aria)}">${g}${bars}${mk}${lab}<rect class="hv" x="0" y="${m.t}" width="${band}" height="${ih}" opacity="0" pointer-events="none"/></svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.hv');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const i = Math.floor((e.clientX - r.left - m.l) / band);
    if (i < 0 || i >= n) { hideTip(); hv.setAttribute('opacity', '0'); return; }
    hv.setAttribute('x', (m.l + band * i).toFixed(1)); hv.setAttribute('opacity', '0.06'); showTip(cfg.tip(i), e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hideTip(); hv.setAttribute('opacity', '0'); });
  if (cfg.onPick) svg.addEventListener('click', (e) => { const r = svg.getBoundingClientRect(); const i = Math.floor((e.clientX - r.left - m.l) / band); if (i >= 0 && i < n) cfg.onPick(i); });
}

/* Linha/área: várias séries (a tracejada serve para projeção) e linha de meta opcional */
function chartLine(el, cfg) {
  if (!el) return;
  const W = Math.max(280, Math.floor(el.clientWidth || 640)); const H = cfg.height || 240;
  const m = { t: 14, r: 12, b: 24, l: 50 };
  const n = cfg.labels.length; const iw = W - m.l - m.r; const ih = H - m.t - m.b;
  const all = cfg.series.flatMap((s) => s.values.filter((v) => v != null)); if (cfg.goal) all.push(cfg.goal);
  const hiV = Math.max(100, ...all); let loV = Math.min(0, ...all);
  if (cfg.zoom) { const mn = Math.min(...all); if (hiV - mn > hiV * 0.002) loV = Math.max(0, mn - (hiV - mn) * 0.6); }
  const step = niceStep((hiV - loV) / 4); let hi = Math.ceil(hiV / step) * step; const lo = Math.floor(loV / step) * step; if (hi <= lo) hi = lo + step;
  const x = (i) => m.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1)); const y = (v) => m.t + ih * (1 - (v - lo) / (hi - lo));
  let g = ''; const nt = Math.round((hi - lo) / step);
  for (let k = 0; k <= nt; k++) { const v = lo + k * step; g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="${Math.abs(v) < 1e-9 ? 'gz' : 'gl'}"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${tickFmt(+v.toFixed(2))}</text>`; }
  const gid = 'ga-' + (el.id || 'x'); let paths = ''; let defs = '';
  cfg.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    if (s.area) { defs += `<linearGradient id="${gid}${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`; paths += `<path d="${d} L${pts[pts.length - 1][0].toFixed(1)} ${y(Math.max(lo, 0))} L${pts[0][0].toFixed(1)} ${y(Math.max(lo, 0))} Z" fill="url(#${gid}${si})"/>`; }
    paths += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2.5}" stroke-linecap="round" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="2 7"' : ''}/>`;
  });
  const goal = cfg.goal ? `<line x1="${m.l}" x2="${W - m.r}" y1="${y(cfg.goal)}" y2="${y(cfg.goal)}" stroke="var(--c4)" stroke-width="1.5" stroke-dasharray="5 5"/><text x="${W - m.r}" y="${y(cfg.goal) - 6}" text-anchor="end" class="goal-l">${escSvg(cfg.goalLabel || 'Objetivo')}</text>` : '';
  const sparse = cfg.labels.some((l) => l === ''); const stepL = sparse ? 1 : Math.max(1, Math.ceil(n / 12)); let lab = '';
  for (let i = 0; i < n; i += stepL) if (cfg.labels[i] !== '') lab += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${escSvg(cfg.labels[i])}</text>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escSvg(cfg.aria)}"><defs>${defs}</defs>${g}${goal}${paths}${lab}<line class="hv" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="var(--ink-3)" stroke-width="1" opacity="0"/></svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.hv');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - m.l) / iw) * (n - 1))));
    hv.setAttribute('x1', x(i)); hv.setAttribute('x2', x(i)); hv.setAttribute('opacity', '.5'); showTip(cfg.tip(i), e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hideTip(); hv.setAttribute('opacity', '0'); });
}

/* Rosca com título no centro */
function chartDonut(el, cfg) {
  if (!el) return;
  const S = Math.min(220, Math.max(150, Math.floor(el.clientWidth || 200))); const R = S / 2 - 12; const C = 2 * Math.PI * R; const total = cfg.items.reduce((a, b) => a + Math.max(0, b.value), 0);
  let off = 0; let arcs = '';
  if (total > 0) cfg.items.forEach((it) => { const f = Math.max(0, it.value) / total; if (f <= 0) return; const len = Math.max(0, f * C - 2); arcs += `<circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="none" stroke="${it.color}" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${S / 2} ${S / 2})"><title>${escSvg(it.label)}</title></circle>`; off += f * C; });
  else arcs = `<circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="none" stroke="var(--line)" stroke-width="22"/>`;
  el.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="${escSvg(cfg.aria)}">${arcs}<text x="${S / 2}" y="${S / 2 - 2}" text-anchor="middle" class="dn-t">${escSvg(cfg.title || '')}</text><text x="${S / 2}" y="${S / 2 + 16}" text-anchor="middle" class="dn-s">${escSvg(cfg.sub || '')}</text></svg>`;
}

/* Anel de progresso (devolve SVG como texto) */
function ring(p, o) {
  o = o || {}; const S = o.size || 120; const sw = o.stroke || 12; const R = S / 2 - sw; const C = 2 * Math.PI * R; const f = Math.max(0, Math.min(1, p || 0));
  return `<svg class="ring" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="${escSvg(o.aria || '')}"><circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="none" stroke="var(--line)" stroke-width="${sw}"/><circle cx="${S / 2}" cy="${S / 2}" r="${R}" fill="none" stroke="${o.color || 'var(--accent)'}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 ${S / 2} ${S / 2})"/><text x="${S / 2}" y="${S / 2 + (o.sub ? -1 : 6)}" text-anchor="middle" class="ring-t">${escSvg(o.label || '')}</text>${o.sub ? `<text x="${S / 2}" y="${S / 2 + 17}" text-anchor="middle" class="ring-s">${escSvg(o.sub)}</text>` : ''}</svg>`;
}

/* Barras horizontais em HTML: items = [{label, value, color?}] */
function hbars(items, fmtv) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return `<ul class="hbars">${items.map((i) => `<li><span class="hb-l">${escSvg(i.label)}</span><span class="hb-t"><i style="width:${Math.max(2, (i.value / max) * 100).toFixed(1)}%;${i.color ? 'background:' + i.color : ''}"></i></span><span class="hb-v">${fmtv(i.value)}</span></li>`).join('')}</ul>`;
}
