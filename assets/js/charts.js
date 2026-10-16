/* Gráficos em SVG puro (sem bibliotecas). As cores vêm de variáveis CSS, então acompanham o tema claro/escuro. */
'use strict';
const niceStep = (raw) => {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
};
const tickFmt = (v) => (typeof oculto === 'function' && oculto() && v !== 0 ? '•••' : Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi' : Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : String(v));
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
// no toque o balão fica até tocar fora do gráfico
document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && !(e.target.closest && e.target.closest('.chart'))) hideTip(); }, true);

/* Barras empilhadas por mês, com marcas opcionais (ex.: meta ou orçamento) */
function chartBars(el, cfg) {
  if (!el) return;
  const W = Math.max(200, Math.floor(el.clientWidth || 640)); const H = cfg.height || 240;
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
  const W = Math.max(200, Math.floor(el.clientWidth || 640)); const H = cfg.height || 240;
  const m = { t: 14, r: 12, b: 24, l: 50 };
  const n = cfg.labels.length; const iw = W - m.l - m.r; const ih = H - m.t - m.b;
  const all = cfg.series.flatMap((s) => s.values.filter((v) => v != null)); if (cfg.goal) all.push(cfg.goal);
  const hiV = Math.max(100, ...all); let loV = Math.min(0, ...all);
  if (cfg.zoom) { const mn = Math.min(...all); if (hiV - mn > hiV * 0.002) loV = Math.max(0, mn - (hiV - mn) * 0.6); }
  const step = niceStep((hiV - loV) / 4); let hi = Math.ceil(hiV / step) * step; const lo = Math.floor(loV / step) * step; if (hi <= lo) hi = lo + step;
  const x = (i) => m.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1)); const y = (v) => m.t + ih * (1 - (v - lo) / (hi - lo));
  let g = ''; const nt = Math.round((hi - lo) / step);
  for (let k = 0; k <= nt; k++) { const v = lo + k * step; g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="${Math.abs(v) < 1e-9 ? 'gz' : 'gl'}"${cfg.suave ? ' stroke-dasharray="3 6"' : ''}/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${tickFmt(+v.toFixed(2))}</text>`; }
  const gid = 'ga-' + (el.id || 'x'); let paths = ''; let defs = ''; let fim = '';
  // cfg.suave: curva sem cantos (Catmull-Rom com os controles presos entre os pontos, para não "passar" do valor real)
  const caminho = (pts) => {
    if (!cfg.suave || pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[i + 2] || p2;
      const lo2 = Math.min(p1[1], p2[1]); const hi2 = Math.max(p1[1], p2[1]); const cl = (v) => Math.max(lo2, Math.min(hi2, v));
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${cl(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${cl(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  if (cfg.brilho) defs += `<filter id="${gid}f" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>`;
  cfg.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean); if (!pts.length) return;
    const d = caminho(pts);
    if (s.area) { defs += `<linearGradient id="${gid}${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity="${cfg.brilho ? '.36' : '.28'}"/>${cfg.brilho ? `<stop offset=".55" stop-color="${s.color}" stop-opacity=".1"/>` : ''}<stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`; paths += `<path d="${d} L${pts[pts.length - 1][0].toFixed(1)} ${y(Math.max(lo, 0))} L${pts[0][0].toFixed(1)} ${y(Math.max(lo, 0))} Z" fill="url(#${gid}${si})"/>`; }
    if (cfg.brilho && !s.dashed) paths += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${(s.w || 2.5) + 5}" stroke-linecap="round" opacity=".35" filter="url(#${gid}f)"/>`;
    paths += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2.5}" stroke-linecap="round" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="2 7"' : ''}/>`;
    // cfg.pontoFinal: o último valor em destaque (ponto com halo)
    // cfg.pontos: uma bolinha em cada mês; com cfg.cur, o mês atual ganha halo e os meses seguintes ficam mais claros
    if (cfg.pontos && si === 0) {
      s.values.forEach((v, i) => {
        if (v == null) return; const cx = x(i).toFixed(1); const cy = y(v).toFixed(1); const fut = cfg.cur >= 0 && i > cfg.cur;
        if (i === cfg.cur) fim += `<circle cx="${cx}" cy="${cy}" r="11" fill="${s.color}" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="5" fill="${s.color}" stroke="var(--surface)" stroke-width="2.5"/>`;
        else fim += `<circle class="lp${fut ? ' fut' : ''}" cx="${cx}" cy="${cy}" r="3.4" fill="var(--surface)" stroke="${s.color}" stroke-width="2"/>`;
      });
    }
    if (cfg.pontoFinal && si === 0 && !(cfg.pontos && cfg.cur >= 0)) { const p = pts[pts.length - 1]; fim += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="10" fill="${s.color}" opacity=".18"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2.5"/>`; }
  });
  const cor0 = (cfg.series[0] && cfg.series[0].color) || 'var(--accent)';
  const goal = cfg.goal ? `<line x1="${m.l}" x2="${W - m.r}" y1="${y(cfg.goal)}" y2="${y(cfg.goal)}" stroke="var(--c4)" stroke-width="1.5" stroke-dasharray="5 5"/><text x="${cfg.goalLeft ? m.l + 6 : W - m.r}" y="${y(cfg.goal) - 6}" text-anchor="${cfg.goalLeft ? 'start' : 'end'}" class="goal-l">${escSvg(cfg.goalLabel || 'Objetivo')}</text>` : '';
  const sparse = cfg.labels.some((l) => l === ''); const stepL = sparse ? 1 : Math.max(1, Math.ceil(n / 12), Math.ceil(n / Math.max(2, Math.floor(iw / (Math.max(...cfg.labels.map((l) => String(l).length)) * 6 + 6))))); /* rótulos não se encostam em telas estreitas */ let lab = '';
  for (let i = 0; i < n; i += stepL) if (cfg.labels[i] !== '') lab += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle"${cfg.cur === i ? ' class="cur-l"' : ''}>${escSvg(cfg.labels[i])}</text>`;
  const hvp = cfg.suave ? `<circle class="hvp" r="5" fill="var(--surface)" stroke="${cor0}" stroke-width="2.5" opacity="0" pointer-events="none"/>` : '';
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escSvg(cfg.aria)}"${cfg.teclado ? ' tabindex="0"' : ''}><defs>${defs}</defs>${g}${goal}${paths}${fim}${lab}<line class="hv" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="var(--ink-3)" stroke-width="1" opacity="0"${cfg.suave ? ' stroke-dasharray="3 4"' : ''}/>${hvp}</svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.hv'); const pt = svg.querySelector('.hvp'); const v0 = (cfg.series[0] && cfg.series[0].values) || [];
  const marca = (i, cx, cy) => {
    hv.setAttribute('x1', x(i)); hv.setAttribute('x2', x(i)); hv.setAttribute('opacity', '.5'); showTip(cfg.tip(i), cx, cy);
    if (pt && v0[i] != null) { pt.setAttribute('cx', x(i).toFixed(1)); pt.setAttribute('cy', y(v0[i]).toFixed(1)); pt.setAttribute('opacity', '1'); }
  };
  const apaga = () => { hideTip(); hv.setAttribute('opacity', '0'); if (pt) pt.setAttribute('opacity', '0'); };
  const mesDe = (e) => { const r = svg.getBoundingClientRect(); const esc0 = r.width / W; return Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / esc0 - m.l) / iw * (n - 1)))); };
  svg.addEventListener('pointermove', (e) => marca(mesDe(e), e.clientX, e.clientY));
  svg.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') marca(mesDe(e), e.clientX, e.clientY); }); // toque: mostra o mês tocado
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') apaga(); });
  // cfg.teclado: setas percorrem os meses com o balão junto do ponto
  if (cfg.teclado) {
    let k = cfg.cur >= 0 ? cfg.cur : n - 1;
    const noPonto = () => { const r = svg.getBoundingClientRect(); const esc0 = r.width / W; marca(k, r.left + x(k) * esc0, r.top + y(v0[k] || 0) * esc0); };
    svg.addEventListener('focus', noPonto); svg.addEventListener('blur', apaga);
    svg.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n }[e.key]; if (d == null) { if (e.key === 'Escape') apaga(); return; }
      e.preventDefault(); k = Math.max(0, Math.min(n - 1, k + d)); noPonto();
    });
  }
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

/* Linha do tempo multi-anos: série mensal contínua com divisões entre os anos, ponto em cada dezembro
   (ou no último mês do ano corrente, marcado como "hoje") e rótulo do ano em cada faixa.
   cfg: { pontos: [{ ano, mes, v }], color, height, aria, tip(i), rotuloPonto(v) } */
function chartHistorico(el, cfg) {
  if (!el) return;
  const P = cfg.pontos || []; const n = P.length; if (!n) { el.innerHTML = ''; return; }
  const W = Math.max(200, Math.floor(el.clientWidth || 640)); const H = cfg.height || 260; const cor = cfg.color || 'var(--accent)';
  const m = { t: 26, r: 18, b: 26, l: 52 }; const iw = W - m.l - m.r; const ih = H - m.t - m.b;
  const vals = P.map((p) => +p.v || 0); const hiV = Math.max(100, ...vals); const mn = Math.min(...vals);
  let loV = Math.min(0, mn); if (mn > 0 && hiV - mn < hiV * 0.6) loV = Math.max(0, mn - (hiV - mn) * 0.5); // aproxima quando a curva é estreita
  const step = niceStep((hiV - loV) / 4); let hi = Math.ceil(hiV / step) * step; const lo = Math.floor(loV / step) * step; if (hi <= lo) hi = lo + step;
  const x = (i) => m.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1)); const y = (v) => m.t + ih * (1 - (v - lo) / (hi - lo));
  let g = ''; const nt = Math.round((hi - lo) / step);
  for (let k = 0; k <= nt; k++) { const v = lo + k * step; g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="${Math.abs(v) < 1e-9 ? 'gz' : 'gl'}"/><text x="${m.l - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${tickFmt(+v.toFixed(2))}</text>`; }
  // faixas dos anos: divisória tracejada no início de cada ano e o ano no meio da faixa
  const faixas = []; P.forEach((p, i) => { const f = faixas[faixas.length - 1]; if (!f || f.ano !== p.ano) faixas.push({ ano: p.ano, i0: i, i1: i }); else f.i1 = i; });
  let anos = '';
  faixas.forEach((f, k) => {
    const xa = k === 0 ? m.l : x(f.i0 - 1); const xb = k === faixas.length - 1 ? W - m.r : x(f.i1); // a divisória passa pelo ponto de dezembro
    if (k > 0) anos += `<line x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${m.t - 6}" y2="${m.t + ih}" class="hy-div"/>`;
    if (k % 2 === 1) anos += `<rect x="${xa.toFixed(1)}" y="${m.t - 6}" width="${(xb - xa).toFixed(1)}" height="${(ih + 6).toFixed(1)}" class="hy-band"/>`;
    anos += `<text x="${((xa + xb) / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="hy-ano">${f.ano}</text>`;
  });
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const gid = 'gh-' + (el.id || 'x');
  const area = `<path d="${d} L${pts[n - 1][0].toFixed(1)} ${(m.t + ih).toFixed(1)} L${pts[0][0].toFixed(1)} ${(m.t + ih).toFixed(1)} Z" fill="url(#${gid})"/>`;
  // marcos: fim de cada ano (dezembro) e o mês atual
  let marcos = '';
  faixas.forEach((f, k) => {
    const i = f.i1; const hoje = k === faixas.length - 1 && P[i].mes < 11; const rot = cfg.rotuloPonto ? cfg.rotuloPonto(vals[i]) : '';
    const yy = pts[i][1]; const acima = yy - 10 > m.t - 4;
    marcos += `<circle cx="${pts[i][0].toFixed(1)}" cy="${yy.toFixed(1)}" r="${hoje ? 5.5 : 4}" fill="${hoje ? cor : 'var(--surface)'}" stroke="${cor}" stroke-width="2.5"/>`;
    if (rot && (faixas.length <= 8 || k === faixas.length - 1 || k % 2 === 0)) marcos += `<text x="${Math.min(W - m.r, Math.max(m.l + 14, pts[i][0])).toFixed(1)}" y="${(acima ? yy - 11 : yy + 18).toFixed(1)}" text-anchor="${pts[i][0] > W - m.r - 30 ? 'end' : 'middle'}" class="hy-rot">${escSvg((hoje ? 'Hoje · ' : '') + rot)}</text>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escSvg(cfg.aria || '')}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".26"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>${anos}${g}${area}<path d="${d}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${marcos}<line class="hv" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="var(--ink-3)" stroke-width="1" opacity="0"/><circle class="hp" r="4.5" fill="${cor}" stroke="var(--surface)" stroke-width="2" opacity="0"/></svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.hv'); const hp = svg.querySelector('.hp');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - m.l) / iw) * (n - 1))));
    hv.setAttribute('x1', pts[i][0]); hv.setAttribute('x2', pts[i][0]); hv.setAttribute('opacity', '.45');
    hp.setAttribute('cx', pts[i][0]); hp.setAttribute('cy', pts[i][1]); hp.setAttribute('opacity', '1');
    if (cfg.tip) showTip(cfg.tip(i), e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hideTip(); hv.setAttribute('opacity', '0'); hp.setAttribute('opacity', '0'); });
}

/* Barras agrupadas por ano (lado a lado), com linha opcional por cima (ex.: taxa de poupança não entra aqui; só valores).
   cfg: { labels, series: [{ nome, color, values }], height, aria, tip(i), parcial: índice do ano em andamento } */
function chartAnos(el, cfg) {
  if (!el) return;
  const W = Math.max(200, Math.floor(el.clientWidth || 640)); const H = cfg.height || 240;
  const m = { t: 12, r: 8, b: 26, l: 52 }; const n = cfg.labels.length; const k = cfg.series.length;
  const iw = W - m.l - m.r; const ih = H - m.t - m.b; const band = iw / Math.max(1, n);
  const all = cfg.series.flatMap((s) => s.values.map((v) => +v || 0)); const hiV = Math.max(100, ...all); const loV = Math.min(0, ...all);
  const step = niceStep((hiV - loV) / 4); const hi = Math.ceil(hiV / step) * step; const lo = Math.floor(loV / step) * step;
  const y = (v) => m.t + ih * (1 - (v - lo) / (hi - lo));
  let g = ''; const nt = Math.round((hi - lo) / step);
  for (let q = 0; q <= nt; q++) { const v = lo + q * step; g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="${Math.abs(v) < 1e-9 ? 'gz' : 'gl'}"/><text x="${m.l - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${tickFmt(+v.toFixed(2))}</text>`; }
  const grupo = Math.min(band * 0.72, k * 30); const bw = Math.max(4, grupo / k - 3); let bars = ''; let lab = '';
  for (let i = 0; i < n; i++) {
    const x0 = m.l + band * i + (band - grupo) / 2;
    cfg.series.forEach((s, j) => {
      const v = +s.values[i] || 0; if (Math.abs(v) < 0.005) return; const y1 = y(Math.max(0, v)); const y2 = y(Math.min(0, v));
      bars += `<rect x="${(x0 + j * (bw + 3)).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, y2 - y1).toFixed(1)}" rx="4" fill="${s.color}"${cfg.parcial === i ? ' fill-opacity=".55"' : ''}/>`;
    });
    lab += `<text x="${(m.l + band * i + band / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="${cfg.parcial === i ? 'cur-l' : ''}">${escSvg(cfg.labels[i])}${cfg.parcial === i ? '*' : ''}</text>`;
  }
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escSvg(cfg.aria || '')}">${g}${bars}${lab}<rect class="hv" x="0" y="${m.t}" width="${band}" height="${ih}" opacity="0" pointer-events="none" fill="var(--ink)"/></svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.hv');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const i = Math.floor((e.clientX - r.left - m.l) / band);
    if (i < 0 || i >= n) { hideTip(); hv.setAttribute('opacity', '0'); return; }
    hv.setAttribute('x', (m.l + band * i).toFixed(1)); hv.setAttribute('opacity', '0.05'); if (cfg.tip) showTip(cfg.tip(i), e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hideTip(); hv.setAttribute('opacity', '0'); });
}
