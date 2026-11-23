/* Consultas exatas para a IA da nuvem e relatórios do assistente.
   A IA (supabase/functions/assistente) não faz contas: pede consultas (serie, por_categoria, lancamentos, estatistica, comparar),
   o app calcula aqui com os mesmos motores das telas (E.compute, E.gastosAreaPeriodo) e devolve o resultado. Nada é gravado.
   O relatório (criar_relatorio) vira um cartão no chat e na conversa por voz, com PDF (jsPDF) e planilha (SheetJS) sob demanda. */
'use strict';
const IAQ_MET = { entradas: 'receita', gastos: 'despesas', orcamento: 'orcamento', investido: 'aplicado', sobra: 'investAlocado', patrimonio: 'patrimonio', dividendos: 'dividendos', metaInvestir: 'metaAporteMes' };
const IAQ_ESTOQUE = { patrimonio: 1 }; // saldo no fim do mês: compara o último mês, não soma
let IAQ_C = {}; // compute de cada ano, refeito a cada pergunta (iaBase limpa)
const iaqR = (v) => Math.round((+v || 0) * 100) / 100;
const iaqIso = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
const iaqHoje = () => NOW_Y * 12 + NOW_M;
const iaqAnos = () => Object.keys(S.plans || {}).map(Number).filter((y) => y > 1999 && y < 2101 && S.plans[y]).sort((a, b) => a - b);
function iaqAno(y) {
  if (!(y in IAQ_C)) { const p = S.plans && S.plans[y]; try { const ctx = planCtx(y); IAQ_C[y] = p ? { p, C: E.compute(p, ctx), carry: ctx.carry } : null; } catch (e) { IAQ_C[y] = null; } }
  return IAQ_C[y];
}
const iaqVal = (met, i) => { const a = iaqAno(Math.floor(i / 12)); return a ? iaqR(a.C[IAQ_MET[met]][i % 12]) : null; };
// "AAAA-MM" (ou "AAAA" = o ano todo) → índice de mês; fim=true pega dezembro quando vem só o ano
function iaqMes(s, fim) {
  const t = String(s == null ? '' : s).trim(); let m = /^(\d{4})-(\d{1,2})$/.exec(t);
  if (m && +m[2] >= 1 && +m[2] <= 12) return +m[1] * 12 + (+m[2] - 1);
  m = /^(\d{4})$/.exec(t); return m ? +m[1] * 12 + (fim ? 11 : 0) : null;
}
// período validado; sem datas: do primeiro ano com dados até o mês atual
function iaqPer(de, ate) {
  const anos = iaqAnos(); const a = de ? iaqMes(de) : anos.length ? anos[0] * 12 : iaqHoje(); const b = ate ? iaqMes(ate, true) : iaqHoje();
  if (a == null || b == null) return { erro: 'Data inválida: use AAAA-MM.' };
  if (b < a) return { erro: 'O fim do período vem antes do início.' };
  if (b - a > 239) return { erro: 'Período longo demais (máximo 20 anos).' };
  return { a, b, de: iaqIso(a), ate: iaqIso(b), ...(b > iaqHoje() ? { obs: `Meses depois de ${iaqIso(iaqHoje())} são previsão do planejamento, não realizado.` } : {}) };
}
const iaqMetOk = (m) => (Object.prototype.hasOwnProperty.call(IAQ_MET, m) ? null : { erro: `Métrica desconhecida. Use: ${Object.keys(IAQ_MET).join(', ')}.` });
function iaqSerie(met, P) { const out = []; for (let i = P.a; i <= P.b; i++) { const v = iaqVal(met, i); if (v != null) out.push({ mes: iaqIso(i), valor: v }); } return out; }
const iaqNomeCat = (c) => E.norm(String(c || '')).trim();
// gastos por categoria no período (soma ano a ano com o mesmo cálculo da tela de Gastos)
function iaqCats(P) {
  const out = {};
  for (let y = Math.floor(P.a / 12); y <= Math.floor(P.b / 12); y++) { const A = iaqAno(y); if (!A) continue;
    const g = E.gastosAreaPeriodo(A.p, A.carry, y * 12 < P.a ? P.a % 12 : 0, (y + 1) * 12 - 1 > P.b ? P.b % 12 : 11);
    Object.keys(g).forEach((k) => { out[k] = iaqR((out[k] || 0) + g[k]); }); }
  return out;
}
function iaqStats(vals) {
  const v = vals.map((x) => x.valor); const n = v.length; if (!n) return { meses: 0 };
  const s = v.slice().sort((a, b) => a - b); const soma = v.reduce((t, x) => t + x, 0); const med = soma / n;
  const mx = vals.reduce((a, b) => (b.valor > a.valor ? b : a)); const mn = vals.reduce((a, b) => (b.valor < a.valor ? b : a));
  let inc = 0; if (n > 1) { const xm = (n - 1) / 2; let num = 0, den = 0; v.forEach((y, k) => { num += (k - xm) * (y - med); den += (k - xm) * (k - xm); }); inc = num / den; }
  const rel = Math.abs(med) > 0 ? inc / Math.abs(med) : 0;
  return { meses: n, soma: iaqR(soma), media: iaqR(med), mediana: iaqR(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2), maximo: mx, minimo: mn,
    tendencia: n < 3 ? 'poucos meses' : rel > 0.02 ? 'subindo' : rel < -0.02 ? 'caindo' : 'estável', variacaoMediaPorMes: iaqR(inc) };
}
// corta listas até o JSON caber (~8 KB)
function iaqCabe(o) {
  const k = ['itens', 'serie', 'categorias'].find((x) => Array.isArray(o[x]));
  while (k && o[k].length && JSON.stringify(o).length > 8000) { o[k].pop(); o.cortado = true; }
  return JSON.stringify(o).length > 8000 ? { erro: 'Resultado grande demais. Peça um período menor.' } : o;
}
/* executor das consultas que a IA pede; args vêm da IA, então tudo é conferido */
function iaConsultar(fn, args) {
  const a = args && typeof args === 'object' ? args : {};
  try {
    if (fn === 'serie') { const e = iaqMetOk(a.metrica); if (e) return e; const P = iaqPer(a.de, a.ate); if (P.erro) return P;
      return iaqCabe({ metrica: a.metrica, de: P.de, ate: P.ate, serie: iaqSerie(a.metrica, P), obs: P.obs }); }
    if (fn === 'estatistica') { const e = iaqMetOk(a.metrica); if (e) return e; const P = iaqPer(a.de, a.ate); if (P.erro) return P;
      const st = iaqStats(iaqSerie(a.metrica, P)); if (IAQ_ESTOQUE[a.metrica]) delete st.soma;
      return { metrica: a.metrica, de: P.de, ate: P.ate, ...st, obs: P.obs }; }
    if (fn === 'por_categoria') { const P = iaqPer(a.de, a.ate); if (P.erro) return P; const g = iaqCats(P); const tot = Object.values(g).reduce((t, x) => t + x, 0);
      const top = Math.max(1, Math.min(30, +a.top || 10));
      return iaqCabe({ de: P.de, ate: P.ate, totalGastos: iaqR(tot), categorias: Object.entries(g).filter((x) => x[1]).sort((x, y) => y[1] - x[1]).slice(0, top).map(([c, v]) => ({ categoria: c, valor: v, pct: tot ? Math.round((v / tot) * 1000) / 10 : 0 })), obs: P.obs }); }
    if (fn === 'lancamentos') { const P = iaqPer(a.de, a.ate); if (P.erro) return P;
      const cat = iaqNomeCat(a.categoria); const tx = iaqNomeCat(a.texto); const mi = a.minimo == null || a.minimo === '' ? -Infinity : +a.minimo; const ma = a.maximo == null || a.maximo === '' ? Infinity : +a.maximo;
      const L = []; iaqAnos().forEach((y) => { (S.plans[y].lancamentos || []).forEach((l) => { const d = E.parseDataISO(l.data); if (!d || d.ano !== y) return; const i = y * 12 + d.mes; const v = +l.valor || 0;
        if (i < P.a || i > P.b || v < mi || v > ma) return; if (cat && !iaqNomeCat(l.area).includes(cat)) return; if (tx && !iaqNomeCat(l.desc).includes(tx)) return;
        L.push({ data: l.data, valor: iaqR(v), categoria: l.area || 'Outros', descricao: String(l.desc || '').slice(0, 40) }); }); });
      const ord = { maiores: (x, y) => y.valor - x.valor, menores: (x, y) => x.valor - y.valor, antigos: (x, y) => (x.data < y.data ? -1 : 1) }[a.ordenar] || ((x, y) => (x.data < y.data ? 1 : -1));
      L.sort(ord); const lim = Math.max(1, Math.min(100, +a.limite || 30));
      return iaqCabe({ de: P.de, ate: P.ate, encontrados: L.length, somaEncontrados: iaqR(L.reduce((t, x) => t + x.valor, 0)), itens: L.slice(0, lim), obs: 'Só gastos anotados um a um; gastos fixos e parcelas previstos entram em por_categoria e serie.' }); }
    if (fn === 'comparar') {
      const PA = iaqPer(a.a_de, a.a_ate); const PB = iaqPer(a.b_de, a.b_ate); if (PA.erro || PB.erro) return PA.erro ? PA : PB;
      let va, vb, oque;
      if (a.categoria) { const c = iaqNomeCat(a.categoria); const soma = (g) => iaqR(Object.keys(g).filter((k) => iaqNomeCat(k) === c).reduce((t, k) => t + g[k], 0)); va = soma(iaqCats(PA)); vb = soma(iaqCats(PB)); oque = `gastos em ${a.categoria}`; }
      else { const e = iaqMetOk(a.metrica); if (e) return e; oque = a.metrica;
        const v = (P) => { const s = iaqSerie(a.metrica, P); return IAQ_ESTOQUE[a.metrica] ? (s.length ? s[s.length - 1].valor : 0) : iaqR(s.reduce((t, x) => t + x.valor, 0)); }; va = v(PA); vb = v(PB); }
      return { comparando: oque, a: { de: PA.de, ate: PA.ate, valor: va }, b: { de: PB.de, ate: PB.ate, valor: vb }, a_menos_b: iaqR(va - vb), variacao_de_b_para_a_pct: vb ? Math.round(((va - vb) / Math.abs(vb)) * 1000) / 10 : null, obs: PA.obs || PB.obs }; }
    return { erro: 'Consulta desconhecida.' };
  } catch (e) { return { erro: 'Não consegui calcular isso.' }; }
}

/* visão geral de todos os anos (vai no resumo de toda pergunta, para as simples não precisarem de consulta) */
function iaBase(d) {
  IAQ_C = {}; const o = iaResumoNuvem(d); const hj = iaqHoje(); const anos = {};
  iaqAnos().forEach((y) => { const A = iaqAno(y); if (!A) return; const ult = y === NOW_Y ? NOW_M : 11; if (y * 12 > hj) return;
    const ser = {}; Object.keys(IAQ_MET).forEach((k) => { ser[k] = A.C[IAQ_MET[k]].slice(0, ult + 1).map((v) => Math.round(+v || 0)); });
    const soma = (k) => ser[k].reduce((t, x) => t + x, 0); const cats = E.gastosAreaPeriodo(A.p, A.carry, 0, ult);
    anos[y] = { meses: ult + 1, totais: { entradas: soma('entradas'), gastos: soma('gastos'), investido: soma('investido'), sobra: soma('sobra'), dividendos: soma('dividendos'), patrimonioFim: ser.patrimonio[ult] },
      mensal: ser, topCategorias: Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, v]) => [c, Math.round(v)]) }; });
  o.anos = anos; o.metricas = Object.keys(IAQ_MET);
  // limite ~12 KB: os anos mais antigos perdem as séries mensais (os totais ficam; o detalhe vem por consulta)
  const ys = Object.keys(anos).sort();
  for (let k = 0; k < ys.length - 1 && JSON.stringify(o).length > 12000; k++) { delete anos[ys[k]].mensal; delete anos[ys[k]].topCategorias; anos[ys[k]].detalhe = 'use as consultas'; }
  return o;
}

/* conversa com a nuvem: até 4 rodadas de consultas, cada uma calculada aqui */
async function iaNuvemPerguntar(body, aviso) {
  const lanc = []; let o = await Store.assistente(body);
  for (let r = 0; o.consultas && r < 4; r++) {
    if (aviso) aviso();
    const resultados = o.consultas.map((c) => { const res = iaConsultar(String(c.nome), c.args); if (c.nome === 'lancamentos' && res.itens) lanc.push(...res.itens); return { id: c.id, nome: c.nome, resultado: res }; });
    o = await Store.assistente(Object.assign({}, body, { contexto: o.contexto, resultados }));
  }
  if (!o.texto) throw new Error('A IA não terminou a resposta.');
  if (o.relatorio) { o.relatorio = iaRelLimpa(o.relatorio); if (o.relatorio && lanc.length) o.relatorio.lanc = lanc.slice(0, 300); }
  return o;
}

/* ---------- relatório: conferência, cartão, PDF e planilha ---------- */
const IAR_TIPOS = ['texto', 'reais', 'pct', 'numero'];
const iarTxt = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const iarNum = (x) => { const n = typeof x === 'number' ? x : Number(String(x == null ? '' : x).replace(',', '.')); return Number.isFinite(n) && Math.abs(n) < 1e12 ? n : null; };
const iarArr = (x, n) => (Array.isArray(x) ? x.slice(0, n) : []);
// o servidor já confere; aqui confere de novo porque vira HTML e arquivo
function iaRelLimpa(r) {
  if (!r || typeof r !== 'object') return null;
  const o = { titulo: iarTxt(r.titulo, 80) || 'Relatório', resumo: iarTxt(r.resumo, 600), secoes: iarArr(r.secoes, 6).map((s) => ({ titulo: iarTxt(s && s.titulo, 60), texto: iarTxt(s && s.texto, 900) })).filter((s) => s.titulo || s.texto) };
  const t = r.tabela; const cols = iarArr(t && t.colunas, 8).map((c) => iarTxt(c, 30));
  if (cols.length) { const tp = cols.map((_, k) => (IAR_TIPOS.includes(t.tipos && t.tipos[k]) ? t.tipos[k] : 'texto'));
    o.tabela = { colunas: cols, tipos: tp, linhas: iarArr(t.linhas, 200).filter(Array.isArray).map((l) => cols.map((_, k) => (tp[k] === 'texto' ? iarTxt(l[k], 80) : iarNum(l[k])))) }; }
  const g = r.grafico; const rot = iarArr(g && g.rotulos, 36).map((x) => iarTxt(x, 24));
  const ser = iarArr(g && g.series, 4).map((s) => ({ nome: iarTxt(s && s.nome, 30), valores: rot.map((_, k) => iarNum(s && s.valores && s.valores[k]) || 0) }));
  if (rot.length && ser.length && ['barras', 'linha', 'pizza'].includes(g.tipo)) o.grafico = { tipo: g.tipo, unidade: ['reais', 'pct', 'numero'].includes(g.unidade) ? g.unidade : 'reais', rotulos: rot, series: g.tipo === 'pizza' ? ser.slice(0, 1) : ser };
  return o;
}
const iarFmt = (v, tp) => (v == null ? '–' : tp === 'reais' ? brl(v) : tp === 'pct' ? fmtPct(v) : tp === 'numero' ? (+v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : String(v));
const iarCurto = (v, tp) => (tp === 'reais' ? brlCurto(v) : iarFmt(v, tp));
const IAR_COR = ['#FFFFFF', '#8FB0FF', '#7BE3B0', '#FFC94D'];
// gráfico em SVG (sem biblioteca): barras crescem, linhas se desenham, a pizza abre
function iarSvg(g) {
  const W = 320; const H = 160; const n = g.rotulos.length; const u = g.unidade;
  if (g.tipo === 'pizza') {
    const v = g.series[0].valores.map((x) => Math.max(0, x)); const tot = v.reduce((t, x) => t + x, 0) || 1; let ac = 0; const r = 52; const L = 2 * Math.PI * r;
    const cor = (k) => `hsl(${222 + k * 37} 95% ${78 - (k % 4) * 9}%)`;
    const fat = v.map((x, k) => { const f = x / tot; const s = `<circle r="${r}" cx="70" cy="80" style="--k:${k};stroke:${cor(k)};stroke-dasharray:${(f * L).toFixed(2)} ${L.toFixed(2)};stroke-dashoffset:${(-ac * L).toFixed(2)}"/>`; ac += f; return s; }).join('');
    const leg = g.rotulos.slice(0, 8).map((l, k) => `<g transform="translate(150 ${22 + k * 17})"><rect width="9" height="9" rx="3" fill="${cor(k)}"/><text x="15" y="8.5">${esc(l)} · ${Math.round((v[k] / tot) * 100)}%</text></g>`).join('');
    return `<svg class="iar-g pizza" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de pizza">${fat}${leg}</svg>`;
  }
  const all = g.series.flatMap((s) => s.valores); const mx = Math.max(0, ...all); const mn = Math.min(0, ...all); const rg = mx - mn || 1;
  const l = 8; const t = 14; const ih = H - t - 26; const iw = W - l * 2; const y = (v) => t + ((mx - v) / rg) * ih; const passo = n > 12 ? Math.ceil(n / 12) : 1;
  const eixo = g.rotulos.map((r, k) => (k % passo ? '' : `<text x="${(l + (iw / n) * (k + 0.5)).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(r.slice(0, 7))}</text>`)).join('');
  const zero = `<line x1="${l}" x2="${W - l}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="z"/>`;
  const topo = `<text x="${l}" y="9" class="mx">${esc(iarCurto(mx, u))}</text>`;
  let marcas = '';
  if (g.tipo === 'linha') marcas = g.series.map((s, j) => `<polyline pathLength="1" style="--k:${j};stroke:${IAR_COR[j]}" points="${s.valores.map((v, k) => `${(l + (iw / Math.max(1, n - 1)) * k).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}"/>`).join('');
  else { const bw = iw / n; const b = (bw * 0.72) / g.series.length;
    marcas = g.series.map((s, j) => s.valores.map((v, k) => { const x = l + bw * k + bw * 0.14 + b * j; const y0 = y(Math.max(0, v)); const h = Math.max(1, Math.abs(y(v) - y(0)));
      return `<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${Math.max(1, b - 1.5).toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(4, b / 3).toFixed(1)}" style="--k:${k};fill:${IAR_COR[j]}"/>`; }).join('')).join(''); }
  const leg = g.series.length > 1 ? `<div class="iar-leg">${g.series.map((s, j) => `<span style="--c:${IAR_COR[j]}">${esc(s.nome)}</span>`).join('')}</div>` : '';
  return `<svg class="iar-g ${g.tipo}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico">${zero}${marcas}${eixo}${topo}</svg>${leg}`;
}
function iarTabHtml(t) {
  return `<div class="iar-t" tabindex="0"><table><thead><tr>${t.colunas.map((c, k) => `<th class="${t.tipos[k] === 'texto' ? '' : 'n'}">${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${t.linhas.map((l) => `<tr>${l.map((v, k) => `<td class="${t.tipos[k] === 'texto' ? '' : 'n'}">${esc(iarFmt(v, t.tipos[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const iarBts = (i) => `<div class="iar-bts"><button type="button" class="iax-b pri" data-act="iar-pdf" data-i="${i}">PDF</button><button type="button" class="iax-b" data-act="iar-xlsx" data-i="${i}">Planilha</button></div><p class="iar-av" data-iar-av hidden></p>`;
// números-chave do gráfico (total, maior, média) que contam na tela
function iarKpis(g) {
  if (!g || g.tipo === 'linha' && g.unidade === 'pct') return '';
  const v = g.series[0].valores; if (!v.length) return ''; const k = v.indexOf(Math.max(...v)); const est = g.unidade !== 'reais' && g.unidade !== 'numero';
  const it = [est ? null : ['Total', v.reduce((t, x) => t + x, 0)], [`Maior · ${g.rotulos[k]}`, v[k]], ['Média', v.reduce((t, x) => t + x, 0) / v.length]].filter(Boolean);
  return `<div class="iar-k">${it.map(([r, x], j) => `<div style="--k:${j}"><small>${esc(r)}</small><b data-conta="${iaqR(x)}" data-f="${g.unidade}">${esc(iarFmt(x, g.unidade))}</b></div>`).join('')}</div>`;
}
function iaRelHtml(m, i, voz) {
  const r = m.rel; if (!r) return ''; iarPreparar();
  return `<div class="iar${voz ? ' voz' : ''}"><div class="iar-h"><span class="iax-ic" aria-hidden="true">${I.chart || I.inv || ''}</span><div><small>Relatório</small><b>${esc(r.titulo)}</b></div></div>
    ${r.resumo && r.resumo !== m.ai ? `<p class="iar-r">${iaRealca(esc(iaTxtIa(r.resumo)))}</p>` : ''}${voz ? iarKpis(r.grafico) : ''}${r.grafico ? iarSvg(r.grafico) : ''}
    ${r.secoes.map((s) => `<div class="iar-s">${s.titulo ? `<b>${esc(s.titulo)}</b>` : ''}<p>${iaRealca(esc(iaTxtIa(s.texto)))}</p></div>`).join('')}
    ${r.tabela && !voz ? iarTabHtml(r.tabela) : ''}${iarBts(i)}</div>`;
}
// conversa por voz, resposta comum: os valores do texto viram fichas que contam
function iaVozChipsHtml(m) {
  const t = String(m.ai || ''); const re = /((?:[A-Za-zÀ-ú]+\s){0,3})(R\$\s?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|-?\d+(?:,\d+)?\s?%)/g; const out = []; let x;
  while ((x = re.exec(t)) && out.length < 4) { const v = x[2]; const ehR = /^R/.test(v); const n = ehR ? parseReais(v.replace(/R\$\s?/, '')) : +v.replace('%', '').replace(',', '.');
    if (Number.isFinite(n)) out.push([iarTxt(x[1], 28) || (ehR ? 'Valor' : 'Percentual'), n, ehR ? 'reais' : 'pct']); }
  if (out.length < 2) return ''; // um valor só já aparece grande no topo
  return `<div class="vzv iar-chips">${out.map(([r, n, f], k) => `<div style="--k:${k}"><small>${esc(r)}</small><b data-conta="${n}" data-f="${f}">${esc(iarFmt(n, f))}</b></div>`).join('')}</div>`;
}
// números que contam de 0 até o valor (sem animação com movimento reduzido)
function iaRelConta(root) {
  if (!root || iaRapido()) return;
  root.querySelectorAll('[data-conta]').forEach((b, j) => { const alvo = +b.dataset.conta; const f = b.dataset.f; const t0 = performance.now() + j * 120;
    const passo = (n) => { const k = Math.max(0, Math.min(1, (n - t0) / 900)); b.textContent = iarFmt(alvo * (1 - Math.pow(1 - k, 3)), f); if (k < 1 && b.isConnected) requestAnimationFrame(passo); };
    requestAnimationFrame(passo); });
}

/* ---------- exportar ---------- */
const IAR_LIBS = {
  jspdf: ['jspdf/2.5.1/jspdf.umd.min.js', 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', () => window.jspdf],
  autotable: ['jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', 'sha384-fCAW/rDWORTbQXSiB7mOg0QtQ5c+r0f544y6XoKjuVva0nMBlCpNUjiFeG5iMdS3', () => window.jspdf && window.jspdf.jsPDF.API.autoTable],
  xlsx: ['xlsx/0.18.5/xlsx.full.min.js', 'sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw', () => window.XLSX],
};
const IAR_CARGA = {};
function iarLib(n) {
  if (IAR_CARGA[n]) return IAR_CARGA[n];
  IAR_CARGA[n] = new Promise((ok, falha) => { const [p, h, pronto] = IAR_LIBS[n]; if (pronto()) { ok(); return; }
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/' + p; s.integrity = h; s.crossOrigin = 'anonymous';
    s.onload = () => (pronto() ? ok() : falha(new Error(n))); s.onerror = () => { delete IAR_CARGA[n]; falha(new Error(n)); }; document.head.appendChild(s); });
  return IAR_CARGA[n];
}
// baixa as bibliotecas logo que aparece um relatório: no iPhone o compartilhar precisa sair perto do toque
let iarPrep = false;
function iarPreparar() { if (iarPrep) return; iarPrep = true; setTimeout(() => { iarLib('jspdf').then(() => iarLib('autotable')).catch(() => {}); iarLib('xlsx').catch(() => {}); }, 1200); }
const iarNomeArq = (r, ext) => `${(r.titulo || 'relatorio').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'relatorio'}.${ext}`;
async function iarSalvar(blob, nome) {
  const f = typeof File === 'function' ? new File([blob], nome, { type: blob.type }) : null;
  if (f && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: nome }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
}
// Helvetica do PDF só tem o latim básico: troca o resto por equivalentes
const iarPdfTxt = (s) => String(s == null ? '' : s).replace(/[–—−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[•·]/g, '-').replace(/[^\x00-\xFF]/g, '');
// gráfico do PDF: desenhado num canvas branco (mesmo desenho do cartão, nas cores do Cifrão)
function iarCanvas(g) {
  const W = 1000; const H = 420; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  const cores = ['#1428F5', '#5B8CFF', '#2FB57A', '#F5A623']; const n = g.rotulos.length; x.font = '22px Helvetica, Arial, sans-serif';
  if (g.tipo === 'pizza') {
    const v = g.series[0].valores.map((a) => Math.max(0, a)); const tot = v.reduce((t, a) => t + a, 0) || 1; let a0 = -Math.PI / 2;
    v.forEach((a, k) => { const a1 = a0 + (a / tot) * 2 * Math.PI; x.beginPath(); x.moveTo(210, 210); x.arc(210, 210, 180, a0, a1); x.closePath(); x.fillStyle = `hsl(${226 + k * 37} 85% ${45 + (k % 4) * 9}%)`; x.fill(); a0 = a1;
      if (k < 10) { x.fillRect(460, 40 + k * 36, 22, 22); x.fillStyle = '#0B1240'; x.fillText(`${g.rotulos[k]}  ${Math.round((a / tot) * 100)}%  ${iarFmt(a, g.unidade)}`, 494, 59 + k * 36); } });
    x.beginPath(); x.arc(210, 210, 90, 0, 2 * Math.PI); x.fillStyle = '#fff'; x.fill(); return cv;
  }
  const all = g.series.flatMap((s) => s.valores); const mx = Math.max(0, ...all); const mn = Math.min(0, ...all); const rg = mx - mn || 1; const l = 110; const t = 30; const ih = H - t - 60; const iw = W - l - 20;
  const y = (v) => t + ((mx - v) / rg) * ih; x.strokeStyle = '#E3E8FF'; x.lineWidth = 2; x.fillStyle = '#5A6390'; x.textAlign = 'right';
  for (let k = 0; k <= 4; k++) { const v = mn + (rg * k) / 4; x.beginPath(); x.moveTo(l, y(v)); x.lineTo(W - 20, y(v)); x.stroke(); x.fillText(iarCurto(v, g.unidade), l - 12, y(v) + 7); }
  x.textAlign = 'center'; const passo = n > 12 ? Math.ceil(n / 12) : 1; g.rotulos.forEach((r, k) => { if (!(k % passo)) x.fillText(r.slice(0, 9), l + (iw / n) * (k + 0.5), H - 22); });
  if (g.tipo === 'linha') g.series.forEach((s, j) => { x.strokeStyle = cores[j]; x.lineWidth = 5; x.lineJoin = 'round'; x.beginPath(); s.valores.forEach((v, k) => { const px = l + (iw / n) * (k + 0.5); if (k) x.lineTo(px, y(v)); else x.moveTo(px, y(v)); }); x.stroke(); });
  else { const bw = iw / n; const b = (bw * 0.7) / g.series.length; g.series.forEach((s, j) => { x.fillStyle = cores[j]; s.valores.forEach((v, k) => { const y0 = y(Math.max(0, v)); x.fillRect(l + bw * k + bw * 0.15 + b * j, y0, Math.max(2, b - 3), Math.max(2, Math.abs(y(v) - y(0)))); }); }); }
  if (g.series.length > 1) { x.textAlign = 'left'; g.series.forEach((s, j) => { x.fillStyle = cores[j]; x.fillRect(l + j * 220, 2, 18, 18); x.fillStyle = '#0B1240'; x.fillText(s.nome, l + j * 220 + 26, 19); }); }
  return cv;
}
const iarHoje = () => new Date().toLocaleDateString('pt-BR');
async function iarPdf(r) {
  await iarLib('jspdf'); await iarLib('autotable');
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); const W = 595; const M = 40; const T = iarPdfTxt;
  // faixa do topo em degradê (o azul do Cifrão), feita de tiras finas
  for (let k = 0; k < 60; k++) { const f = k / 59; doc.setFillColor(Math.round(59 - 49 * f), Math.round(108 - 86 * f), Math.round(255 - 111 * f)); doc.rect((W / 60) * k, 0, W / 60 + 1, 110, 'F'); }
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(T(`${CFG.marca || 'Cifrão'} · Relatório`), M, 36);
  doc.setFontSize(22); doc.text(doc.splitTextToSize(T(r.titulo), W - M * 2).slice(0, 2), M, 66); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(T(`Gerado em ${iarHoje()}`), M, 98);
  let y = 140; doc.setTextColor(11, 18, 64);
  const bloco = (txt, tam, neg) => { doc.setFont('helvetica', neg ? 'bold' : 'normal'); doc.setFontSize(tam); const ls = doc.splitTextToSize(T(txt), W - M * 2); ls.forEach((l) => { if (y > 790) { doc.addPage(); y = 50; } doc.text(l, M, y); y += tam * 1.4; }); };
  if (r.resumo) { bloco(r.resumo, 12); y += 8; }
  if (r.grafico) { const cv = iarCanvas(r.grafico); const h = ((W - M * 2) * cv.height) / cv.width; if (y + h > 790) { doc.addPage(); y = 50; }
    doc.setDrawColor(227, 232, 255); doc.roundedRect(M - 6, y - 6, W - M * 2 + 12, h + 12, 10, 10, 'S'); doc.addImage(cv.toDataURL('image/png'), 'PNG', M, y, W - M * 2, h); y += h + 26; }
  r.secoes.forEach((s) => { if (s.titulo) { doc.setTextColor(20, 40, 245); bloco(s.titulo, 13, true); doc.setTextColor(11, 18, 64); } bloco(s.texto, 11); y += 8; });
  const tab = (head, body, al) => { doc.autoTable({ startY: y, head: [head.map(T)], body: body.map((l) => l.map(T)), margin: { left: M, right: M }, theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, textColor: [11, 18, 64], lineColor: [227, 232, 255], lineWidth: 0.5, cellPadding: 5 }, headStyles: { fillColor: [20, 40, 245], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] }, columnStyles: al }); y = doc.lastAutoTable.finalY + 24; };
  const dir = (tp) => { const o = {}; tp.forEach((x, k) => { if (x !== 'texto') o[k] = { halign: 'right' }; }); return o; };
  if (r.tabela) tab(r.tabela.colunas, r.tabela.linhas.map((l) => l.map((v, k) => iarFmt(v, r.tabela.tipos[k]))), dir(r.tabela.tipos));
  if (r.lanc && r.lanc.length) { bloco('Lançamentos consultados', 13, true); tab(['Data', 'Descrição', 'Categoria', 'Valor'], r.lanc.map((l) => [l.data.split('-').reverse().join('/'), l.descricao, l.categoria, brl(l.valor)]), { 3: { halign: 'right' } }); }
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 128, 170);
    doc.text(T('Números do seu planejamento no app, calculados pelo app. Material educativo, sem indicação de investimentos.'), M, 820); doc.text(`${p}/${n}`, W - M, 820, { align: 'right' }); }
  await iarSalvar(doc.output('blob'), iarNomeArq(r, 'pdf'));
}
async function iarXlsx(r) {
  await iarLib('xlsx'); const X = window.XLSX; const wb = X.utils.book_new();
  const res = [[r.titulo], [r.resumo || ''], [], ['Gerado em', iarHoje()], []].concat(r.secoes.map((s) => [s.titulo, s.texto]));
  const w1 = X.utils.aoa_to_sheet(res); w1['!cols'] = [{ wch: 28 }, { wch: 90 }]; X.utils.book_append_sheet(wb, w1, 'Resumo');
  // números de verdade nas células (somáveis), com formato de real ou percentual
  const fmtZ = { reais: '"R$" #,##0.00', pct: '0.0%', numero: '#,##0.##' };
  const folha = (cols, tipos, linhas) => { const ws = X.utils.aoa_to_sheet([cols].concat(linhas.map((l) => l.map((v, k) => (tipos[k] === 'pct' && v != null ? v / 100 : v)))));
    linhas.forEach((l, i) => l.forEach((v, k) => { const c = ws[X.utils.encode_cell({ r: i + 1, c: k })]; if (c && c.t === 'n' && fmtZ[tipos[k]]) c.z = fmtZ[tipos[k]]; }));
    ws['!cols'] = cols.map((c, k) => ({ wch: tipos[k] === 'texto' ? 26 : 16 })); return ws; };
  const g = r.grafico;
  if (r.tabela) X.utils.book_append_sheet(wb, folha(r.tabela.colunas, r.tabela.tipos, r.tabela.linhas), 'Dados');
  else if (g) X.utils.book_append_sheet(wb, folha([''].concat(g.series.map((s) => s.nome || 'Valor')), ['texto'].concat(g.series.map(() => g.unidade)), g.rotulos.map((rt, k) => [rt].concat(g.series.map((s) => s.valores[k])))), 'Dados');
  if (r.lanc && r.lanc.length) X.utils.book_append_sheet(wb, folha(['Data', 'Descrição', 'Categoria', 'Valor'], ['texto', 'texto', 'texto', 'reais'], r.lanc.map((l) => [l.data, l.descricao, l.categoria, l.valor])), 'Lançamentos');
  const buf = X.write(wb, { bookType: 'xlsx', type: 'array' });
  await iarSalvar(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), iarNomeArq(r, 'xlsx'));
}
function iaRelAcao(act, ds) {
  if (act !== 'iar-pdf' && act !== 'iar-xlsx') return false;
  const m = iaEstado().msgs[+ds.i]; if (!m || !m.rel) return true;
  const bts = [...document.querySelectorAll(`[data-act="${act}"][data-i="${+ds.i}"]`)]; // o mesmo cartão pode estar no chat e na voz
  // olho fechado: nada de arquivo com valores
  if (oculto()) { bts.forEach((b) => { const av = b.closest('.iar').querySelector('[data-iar-av]'); av.hidden = false; av.textContent = 'Abra o olho para exportar.'; }); if (!bts.length) toast('Abra o olho para exportar.'); return true; }
  if (bts.some((b) => b.disabled)) return true;
  bts.forEach((b) => { b.disabled = true; b.dataset.rot = b.textContent; b.textContent = 'Gerando…'; });
  (act === 'iar-pdf' ? iarPdf(m.rel) : iarXlsx(m.rel)).catch(() => toast('Não consegui gerar o arquivo agora. Confira a internet e tente de novo.'))
    .finally(() => bts.forEach((b) => { b.disabled = false; b.textContent = b.dataset.rot; }));
  return true;
}
