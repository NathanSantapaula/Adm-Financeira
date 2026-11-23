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
  o.visual = iaVisLimpa(o.visual);
  if (o.relatorio) { o.relatorio = iaRelLimpa(o.relatorio); if (o.relatorio && lanc.length) o.relatorio.lanc = lanc.slice(0, 300); }
  return o;
}

/* ---------- relatório: conferência, cartão, PDF e planilha ---------- */
const IAR_TIPOS = ['texto', 'reais', 'pct', 'numero'];
const iarTxt = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const iarNum = (x) => { if (x == null || x === '') return null; const n = typeof x === 'number' ? x : Number(String(x == null ? '' : x).replace(',', '.')); return Number.isFinite(n) && Math.abs(n) < 1e12 ? n : null; };
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
const iarFmt = (v, tp) => (v == null ? '–' : tp === 'reais' ? brl(v) : tp === 'pct' ? (Math.abs(v) < 0.005 ? '0%' : fmtPct(v)) : tp === 'numero' ? (+v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : String(v));
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
const iarSec = (t, h) => (h ? `<div class="iar-sec">${t ? `<small class="iar-st">${esc(t)}</small>` : ''}${h}</div>` : '');
// cartão do relatório: capa, kpis, gráfico, ranking, maiores gastos, sonhos, leitura, análise e a tabela (no chat); na voz, maior e sem tabela
function iaRelHtml(m, i, voz) {
  const r = m.rel; if (!r) return ''; iarPreparar();
  const kp = r.kpis && r.kpis.length ? iavCompHtml({ tipo: 'kpis', unidade: 'reais', itens: r.kpis }) : voz ? iarKpis(r.grafico) : '';
  const rk = r.ranking && r.ranking.length ? iavBarras(r.ranking, 'reais', true) : '';
  const tp = r.top && r.top.length ? `<ol class="iav-tl">${r.top.slice(0, voz ? 5 : 8).map((l, k) => `<li style="--k:${k}"><small>${esc(l.data.split('-').reverse().slice(0, 2).join('/'))} · ${esc(l.categoria)}</small><span>${esc(l.descricao || l.categoria)}</span>${iavB(l.valor, 'reais')}</li>`).join('')}</ol>` : '';
  const mt = r.metas && r.metas.length ? r.metas.map((g) => iavCompHtml({ tipo: 'progresso', unidade: 'reais', rotulo: g.rotulo, atual: g.atual, alvo: g.alvo })).join('') : '';
  const lt = r.leitura && r.leitura.length ? `<ul class="iar-lt">${r.leitura.map((f) => `<li>${iaRealca(esc(iaTxtIa(f)))}</li>`).join('')}</ul>` : '';
  const tab = r.tabela && !voz ? (r.local ? `<details class="iar-d"><summary>Ver mês a mês</summary>${iarTabHtml(r.tabela)}</details>` : iarTabHtml(r.tabela)) : '';
  return `<div class="iar${voz ? ' voz' : ''}"><div class="iar-h"><span class="iar-logo" aria-hidden="true">$</span><div><small>${esc(CFG.marca || 'Cifrão')} · Relatório</small><b>${esc(r.titulo)}</b>${r.comp ? `<em>Comparado com ${esc(r.comp)}</em>` : ''}</div></div>
    ${r.resumo && r.resumo !== m.ai ? `<p class="iar-r">${iaRealca(esc(iaTxtIa(r.resumo)))}</p>` : ''}${kp}
    ${r.grafico ? iarSec(r.local ? 'Entradas e gastos, mês a mês' : '', iarSvg(r.grafico)) : ''}${iarSec('Onde foi o dinheiro', rk)}${iarSec('Maiores gastos', tp)}${iarSec('Seus sonhos', mt)}${iarSec('Leitura do período', lt)}
    ${r.secoes.map((s) => `<div class="iar-s">${s.titulo ? `<b>${esc(s.titulo)}</b>` : ''}<p>${iaRealca(esc(iaTxtIa(s.texto)))}</p></div>`).join('')}${r.analisando ? '<p class="iar-esc">Escrevendo a análise do Cifrão…</p>' : ''}
    ${tab}${iarBts(i)}</div>`;
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
// iPhone: o compartilhar (Salvar em Arquivos, AirDrop, WhatsApp) só funciona dentro do toque, por isso tudo aqui é síncrono até chamar share
function iarSalvar(blob, nome) {
  const f = typeof File === 'function' ? new File([blob], nome, { type: blob.type }) : null;
  const baixa = () => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nome; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: nome }).catch((e) => { if (!e || e.name !== 'AbortError') baixa(); }); return; }
  // iPhone sem compartilhar arquivo: o PDF abre numa aba (ainda dentro do toque); senão, baixa
  if (blob.type === 'application/pdf' && /iPad|iPhone|iPod/.test(navigator.userAgent)) { const u = URL.createObjectURL(blob); if (window.open(u, '_blank')) { setTimeout(() => URL.revokeObjectURL(u), 120000); return; } URL.revokeObjectURL(u); }
  baixa();
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
const iarLibPronta = (act) => (act === 'iar-pdf' ? !!(IAR_LIBS.jspdf[2]() && IAR_LIBS.autotable[2]()) : !!IAR_LIBS.xlsx[2]());
const iarCarregar = (act) => (act === 'iar-pdf' ? iarLib('jspdf').then(() => iarLib('autotable')) : iarLib('xlsx'));
// PDF com cara de relatório de banco digital: capa azul com a marca, kpis em cartões, gráfico, ranking, sonhos, leitura e tabelas zebradas
function iarPdfBlob(r) {
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); const W = 595; const H = 842; const M = 40; const CW = W - M * 2; const T = iarPdfTxt;
  const AZ = [20, 40, 245]; const NAV = [11, 18, 64]; const CIN = [96, 104, 150]; const BR = [255, 255, 255];
  const opac = (o) => { try { doc.setGState(new doc.GState({ opacity: o })); } catch (e) { /* sem transparência: segue opaco */ } };
  const HC = 230; for (let k = 0; k < 80; k++) { const f = k / 79; doc.setFillColor(Math.round(72 - 62 * f), Math.round(122 - 100 * f), Math.round(255 - 130 * f)); doc.rect(0, (HC / 80) * k, W, HC / 80 + 1, 'F'); }
  opac(0.09); doc.setFillColor(...BR); doc.circle(W - 40, 20, 140, 'F'); doc.circle(W - 170, HC + 20, 80, 'F'); opac(1);
  doc.setFillColor(...BR); doc.circle(M + 14, 46, 14, 'F'); doc.setTextColor(...AZ); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('$', M + 14, 52, { align: 'center' });
  doc.setTextColor(...BR); doc.setFontSize(18); doc.text(T(CFG.marca || 'Cifrão'), M + 36, 52); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(T('Relatório financeiro'), W - M, 52, { align: 'right' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); const tl = doc.splitTextToSize(T(r.titulo), CW).slice(0, 2); doc.text(tl, M, 120);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); if (r.comp) doc.text(T(`Comparado com ${r.comp}`), M, 120 + tl.length * 30);
  doc.setFontSize(9); opac(0.8); doc.text(T(`Gerado em ${iarHoje()}`), M, HC - 24); opac(1);
  let y = HC + 34;
  const cabe = (h) => { if (y + h > H - 56) { doc.addPage(); y = 54; } };
  const titulo = (t) => { cabe(46); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...AZ); doc.text(T(t.toUpperCase()), M, y); doc.setDrawColor(222, 229, 255); doc.setLineWidth(1); doc.line(M, y + 7, W - M, y + 7); y += 26; };
  const texto = (t, tam, x0) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(tam); doc.setTextColor(...NAV); doc.splitTextToSize(T(t), CW - (x0 || 0)).forEach((l) => { cabe(tam * 1.5); doc.text(l, M + (x0 || 0), y); y += tam * 1.45; }); };
  if (r.resumo) { texto(r.resumo, 11.5); y += 12; }
  if (r.kpis && r.kpis.length) { const cw = (CW - 20) / 3; const ch = 68; titulo('Resumo do período');
    r.kpis.forEach((k, j) => { const cx = M + (j % 3) * (cw + 10); if (j % 3 === 0) { if (j) y += ch + 10; cabe(ch + 10); }
      doc.setFillColor(243, 246, 255); doc.setDrawColor(222, 229, 255); doc.roundedRect(cx, y, cw, ch, 10, 10, 'FD'); doc.setFillColor(...AZ); doc.roundedRect(cx, y + 14, 3, 20, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...CIN); doc.text(T(k.rotulo), cx + 12, y + 21);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...NAV); doc.text(T(iarFmt(k.valor, k.unidade || 'reais')), cx + 12, y + 42);
      if (k.variacao != null) { const bom = (k.variacao >= 0) !== !!k.inverso; doc.setFontSize(8.5); doc.setTextColor(...(Math.abs(k.variacao) < 0.05 ? CIN : bom ? [22, 150, 96] : [214, 52, 76])); doc.text(T(`${Math.abs(k.variacao) < 0.05 ? 'estável' : `${k.variacao >= 0 ? '+' : '-'}${fmtPct(Math.abs(k.variacao))}`} vs. ${r.comp || 'anterior'}`), cx + 12, y + 57); } });
    y += ch + 26; }
  if (r.grafico) { titulo(r.local ? 'Entradas e gastos, mês a mês' : 'Gráfico'); const cv = iarCanvas(r.grafico); const h = (CW * cv.height) / cv.width; cabe(h + 10); doc.addImage(cv.toDataURL('image/png'), 'PNG', M, y, CW, h); y += h + 24; }
  if (r.ranking && r.ranking.length) { titulo('Onde foi o dinheiro'); const mx = Math.max(1, ...r.ranking.map((x) => x.valor)); const bx = M + 180; const bw = CW - 280;
    r.ranking.forEach((x, k) => { cabe(24); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAV); doc.text(T(`${k + 1}. ${x.rotulo}`.slice(0, 30)), M, y + 9); doc.text(T(iarFmt(x.valor, 'reais')), W - M, y + 9, { align: 'right' });
      doc.setFillColor(233, 238, 255); doc.roundedRect(bx, y + 3, bw, 8, 4, 4, 'F'); doc.setFillColor(...AZ); doc.roundedRect(bx, y + 3, Math.max(6, (bw * x.valor) / mx), 8, 4, 4, 'F');
      if (x.pct != null) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CIN); doc.text(T(fmtPct(x.pct)), bx + bw + 6, y + 10); } y += 22; }); y += 12; }
  if (r.metas && r.metas.length) { titulo('Seus sonhos');
    r.metas.forEach((g) => { cabe(40); const f = g.alvo ? Math.min(1, g.atual / g.alvo) : 0; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...NAV); doc.text(T(g.rotulo), M, y + 9);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...CIN); doc.text(T(`${iarFmt(g.atual, 'reais')} de ${iarFmt(g.alvo, 'reais')} · ${fmtPct(f * 100)}`), W - M, y + 9, { align: 'right' });
      doc.setFillColor(233, 238, 255); doc.roundedRect(M, y + 16, CW, 9, 4.5, 4.5, 'F'); doc.setFillColor(47, 181, 122); doc.roundedRect(M, y + 16, Math.max(9, CW * f), 9, 4.5, 4.5, 'F'); y += 38; }); y += 8; }
  if (r.leitura && r.leitura.length) { titulo('Leitura do período');
    r.leitura.forEach((f) => { cabe(18); doc.setFillColor(...AZ); doc.circle(M + 3, y - 3.5, 2.4, 'F'); texto(f, 10.5, 12); y += 4; }); y += 10; }
  r.secoes.forEach((s) => { titulo(s.titulo || 'Observações'); texto(s.texto, 10.5); y += 12; });
  const tab = (head, body, al) => { cabe(70); doc.autoTable({ startY: y, head: [head.map(T)], body: body.map((l) => l.map(T)), margin: { left: M, right: M, top: 54, bottom: 56 }, theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: NAV, cellPadding: 6 }, headStyles: { fillColor: AZ, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 246, 255] }, columnStyles: al }); y = doc.lastAutoTable.finalY + 26; };
  const dir = (tp) => { const o = {}; tp.forEach((x, k) => { if (x !== 'texto') o[k] = { halign: 'right' }; }); return o; };
  if (r.tabela) { titulo(r.local ? 'Números mês a mês' : 'Dados'); tab(r.tabela.colunas, r.tabela.linhas.map((l) => l.map((v, k) => iarFmt(v, r.tabela.tipos[k]))), dir(r.tabela.tipos)); }
  if (r.lanc && r.lanc.length) { titulo('Lançamentos do período'); tab(['Data', 'Descrição', 'Categoria', 'Valor'], r.lanc.map((l) => [l.data.split('-').reverse().join('/'), l.descricao, l.categoria, iarFmt(l.valor, 'reais')]), { 3: { halign: 'right' } }); }
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setDrawColor(222, 229, 255); doc.setLineWidth(0.8); doc.line(M, H - 40, W - M, H - 40);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CIN); doc.text(T(`${CFG.marca || 'Cifrão'} · ${iarHoje()} · Números do seu planejamento, calculados pelo app. Sem indicação de investimentos.`), M, H - 26); doc.text(`${p} de ${n}`, W - M, H - 26, { align: 'right' }); }
  return doc.output('blob');
}
function iarXlsxBlob(r) {
  const X = window.XLSX; const wb = X.utils.book_new(); const fmtZ = { reais: '"R$" #,##0.00', pct: '0.0%', numero: '#,##0.##' };
  // números de verdade nas células (somáveis), com formato de real ou percentual
  const folha = (cols, tipos, linhas, larg) => { const ws = X.utils.aoa_to_sheet([cols].concat(linhas.map((l) => l.map((v, k) => (tipos[k] === 'pct' && v != null ? v / 100 : v)))));
    linhas.forEach((l, i) => l.forEach((v, k) => { const c = ws[X.utils.encode_cell({ r: i + 1, c: k })]; if (c && c.t === 'n' && fmtZ[tipos[k]]) c.z = fmtZ[tipos[k]]; }));
    ws['!cols'] = cols.map((c, k) => ({ wch: (larg && larg[k]) || (tipos[k] === 'texto' ? 28 : 16) })); return ws; };
  const res = [[r.titulo, ''], [r.comp ? `Comparado com ${r.comp}` : '', ''], ['Gerado em', iarHoje()], []]; const fmts = [];
  if (r.kpis && r.kpis.length) { res.push(['Indicador', 'Valor', 'Variação']); r.kpis.forEach((k) => { fmts.push([res.length, k.unidade || 'reais']); res.push([k.rotulo, k.unidade === 'pct' ? k.valor / 100 : k.valor, k.variacao == null ? '' : k.variacao / 100]); }); res.push([]); }
  if (r.resumo) res.push(['Resumo', r.resumo]);
  (r.leitura || []).forEach((f, k) => res.push([k ? '' : 'Leitura do período', f])); r.secoes.forEach((s) => res.push([s.titulo, s.texto]));
  const w1 = X.utils.aoa_to_sheet(res); fmts.forEach(([row, u]) => { const c = w1[X.utils.encode_cell({ r: row, c: 1 })]; if (c && c.t === 'n') c.z = fmtZ[u]; const v = w1[X.utils.encode_cell({ r: row, c: 2 })]; if (v && v.t === 'n') v.z = '+0.0%;-0.0%'; });
  w1['!cols'] = [{ wch: 26 }, { wch: 90 }, { wch: 12 }]; X.utils.book_append_sheet(wb, w1, 'Resumo');
  const g = r.grafico;
  if (r.tabela) X.utils.book_append_sheet(wb, folha(r.tabela.colunas, r.tabela.tipos, r.tabela.linhas), 'Dados');
  else if (g) X.utils.book_append_sheet(wb, folha([''].concat(g.series.map((s) => s.nome || 'Valor')), ['texto'].concat(g.series.map(() => g.unidade)), g.rotulos.map((rt, k) => [rt].concat(g.series.map((s) => s.valores[k])))), 'Dados');
  if (r.ranking && r.ranking.length) X.utils.book_append_sheet(wb, folha(['Categoria', 'Gasto', '% dos gastos'], ['texto', 'reais', 'pct'], r.ranking.map((c) => [c.rotulo, c.valor, c.pct == null ? null : c.pct])), 'Categorias');
  if (r.lanc && r.lanc.length) X.utils.book_append_sheet(wb, folha(['Data', 'Descrição', 'Categoria', 'Valor'], ['texto', 'texto', 'texto', 'reais'], r.lanc.map((l) => [l.data, l.descricao, l.categoria, l.valor]), [12, 34, 22, 14]), 'Lançamentos');
  if (r.metas && r.metas.length) X.utils.book_append_sheet(wb, folha(['Sonho', 'Juntado', 'Objetivo', 'Progresso'], ['texto', 'reais', 'reais', 'pct'], r.metas.map((m) => [m.rotulo, m.atual, m.alvo, m.alvo ? (m.atual / m.alvo) * 100 : 0])), 'Sonhos');
  return new Blob([X.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function iaRelAcao(act, ds) {
  if (act !== 'iar-pdf' && act !== 'iar-xlsx') return false;
  const m = iaEstado().msgs[+ds.i]; if (!m || !m.rel) return true;
  const bts = [...document.querySelectorAll(`[data-act="${act}"][data-i="${+ds.i}"]`)]; // o mesmo cartão pode estar no chat e na voz
  const avisa = (t) => { bts.forEach((b) => { const av = b.closest('.iar').querySelector('[data-iar-av]'); av.hidden = false; av.textContent = t; }); if (!bts.length) toast(t); };
  // olho fechado: nada de arquivo com valores
  if (oculto()) { avisa('Abra o olho para exportar.'); return true; }
  // biblioteca ainda não chegou: baixa agora e pede um novo toque (o iPhone só compartilha dentro do toque)
  if (!iarLibPronta(act)) { bts.forEach((b) => { b.disabled = true; }); avisa('Preparando o arquivo…');
    iarCarregar(act).then(() => avisa('Pronto! Toque de novo para salvar.'), () => avisa('Não consegui preparar agora. Confira a internet e tente de novo.')).finally(() => bts.forEach((b) => { b.disabled = false; }));
    return true; }
  try { const pdf = act === 'iar-pdf'; iarSalvar(pdf ? iarPdfBlob(m.rel) : iarXlsxBlob(m.rel), iarNomeArq(m.rel, pdf ? 'pdf' : 'xlsx')); } catch (e) { avisa('Não consegui gerar o arquivo. Tente de novo.'); }
  return true;
}
/* ---------- visual da resposta (mostrar_visual): kpis, comparação, progresso, gráfico, ranking, linha do tempo e referências ---------- */
const IAV_TIPOS = ['kpis', 'comparacao', 'progresso', 'grafico', 'ranking', 'linha_tempo'];
const iavUni = (u) => (['reais', 'pct', 'numero'].includes(u) ? u : 'reais');
function iaVisLimpa(v) {
  if (!v || typeof v !== 'object') return null;
  const comps = iarArr(v.componentes, 4).map((c) => { if (!c || !IAV_TIPOS.includes(c.tipo)) return null;
    const b = { tipo: c.tipo, titulo: iarTxt(c.titulo, 60), frase: iarTxt(c.frase, 120), unidade: iavUni(c.unidade) };
    if (c.tipo === 'progresso') { const at = iarNum(c.atual); const al = iarNum(c.alvo); return at == null || !al ? null : Object.assign(b, { rotulo: iarTxt(c.rotulo, 40), atual: at, alvo: al }); }
    if (c.tipo === 'grafico') { const g = (iaRelLimpa({ grafico: c.grafico }) || {}).grafico; return g ? Object.assign(b, { grafico: g }) : null; }
    const itens = iarArr(c.itens, c.tipo === 'linha_tempo' ? 8 : 6).map((x) => ({ rotulo: iarTxt(x && x.rotulo, 40), valor: iarNum(x && x.valor), variacao: iarNum(x && x.variacao), data: iarTxt(x && x.data, 20), unidade: x && x.unidade ? iavUni(x.unidade) : '' }))
      .filter((x) => x.rotulo && (x.valor != null || c.tipo === 'linha_tempo'));
    return itens.length ? Object.assign(b, { itens }) : null; }).filter(Boolean);
  const refs = iarArr(v.referencias, 4).map((r) => ({ rotulo: iarTxt(r && r.rotulo, 50), tela: typeof IAX_TELAS !== 'undefined' && IAX_TELAS[r && r.tela] ? r.tela : '' })).filter((r) => r.rotulo);
  return comps.length || refs.length ? { componentes: comps, referencias: refs } : null;
}
// resposta local (sem nuvem): os números da resposta viram kpis
const IAV_ROT = { receita: 'Entradas', gasto: 'Gastos', sobra: 'Sobra', restante: 'Ainda pode gastar', porDia: 'Por dia', aportado: 'Investido', meta: 'Meta', falta: 'Falta', areaValor: 'Na categoria', noAno: 'No ano', alvo: 'Alvo', media: 'Média', extra: 'Extra', aporte: 'Aporte', livre: 'Livre', restaria: 'Restaria', excesso: 'Passou', parcela: 'Parcela', projecao: 'Previsão', valor: 'Valor', ate: 'Até', pct: 'Percentual', pctArea: 'Das entradas' };
function iaVisLocal(r) {
  const v = (r && r.vars) || {}; const itens = Object.keys(v).filter((k) => IAV_ROT[k] && Number.isFinite(+v[k]) && v[k] !== '' && v[k] != null).slice(0, 4)
    .map((k) => ({ rotulo: IAV_ROT[k], valor: IA_PCT.includes(k) ? +v[k] * 100 : +v[k], unidade: IA_PCT.includes(k) ? 'pct' : 'reais' }));
  return itens.length ? { componentes: [{ tipo: 'kpis', titulo: '', frase: '', unidade: 'reais', itens }], referencias: [] } : null;
}
const iavB = (x, u) => `<b data-conta="${iaqR(x)}" data-f="${u}">${esc(iarFmt(x, u))}</b>`;
const iavBarras = (itens, u, num) => { const mx = Math.max(1e-9, ...itens.map((x) => Math.abs(x.valor || 0)));
  return `<ul class="iav-bar">${itens.map((x, k) => `<li style="--k:${k};--f:${(Math.abs(x.valor || 0) / mx).toFixed(3)}">${num ? `<em>${k + 1}</em>` : ''}<span>${esc(x.rotulo)}</span>${iavB(x.valor, x.unidade || u)}<i></i></li>`).join('')}</ul>`; };
function iavCompHtml(c) {
  const u = c.unidade;
  if (c.tipo === 'kpis') return `<div class="iav-kpi">${c.itens.map((x, k) => `<div style="--k:${k}"><small>${esc(x.rotulo)}</small>${iavB(x.valor, x.unidade || u)}${x.variacao != null ? `<span class="iav-var ${(x.variacao >= 0) !== !!x.inverso ? 'sobe' : 'desce'}">${Math.abs(x.variacao) < 0.05 ? '= estável' : `${x.variacao >= 0 ? '▲' : '▼'} ${esc(fmtPct(Math.abs(x.variacao)))}`}</span>` : ''}</div>`).join('')}</div>`;
  if (c.tipo === 'comparacao' || c.tipo === 'ranking') return iavBarras(c.itens, u, c.tipo === 'ranking');
  if (c.tipo === 'progresso') { const f = c.atual / c.alvo;
    return `<div class="iav-prog${f > 1 ? ' passou' : f > 0.8 ? ' perto' : ''}" style="--f:${Math.min(1, Math.max(0, f)).toFixed(3)}"><div class="iav-prog-n">${iavB(f * 100, 'pct')}<span>${esc(c.rotulo)}</span></div><div class="iav-prog-b"><i></i></div><p>${esc(iarFmt(c.atual, u))} de ${esc(iarFmt(c.alvo, u))}</p></div>`; }
  if (c.tipo === 'grafico') return iarSvg(c.grafico);
  if (c.tipo === 'linha_tempo') return `<ol class="iav-tl">${c.itens.map((x, k) => `<li style="--k:${k}"><small>${esc(x.data)}</small><span>${esc(x.rotulo)}</span>${x.valor != null ? iavB(x.valor, x.unidade || u) : ''}</li>`).join('')}</ol>`;
  return '';
}
// posição (no texto falado) de cada cartão: o trecho "frase" ou o primeiro número dele que aparece no texto
function iavPos(c, txt) {
  const t = iaSemAcento(txt); const f = iaSemAcento(c.frase); let p = f ? t.indexOf(f.slice(0, 40)) : -1;
  if (p < 0 && c.itens) c.itens.some((x) => { const k = t.indexOf(iaSemAcento(x.rotulo)); if (k >= 0) p = k; return k >= 0; });
  return p;
}
function iaVisHtml(m, i, voz) {
  const v = m.vis || (!m.ai && m.r ? iaVisLocal(m.r) : null); if (!v) return '';
  const txt = String(m.ai ? iaTxtIa(m.ai) : '').replace(/\s+/g, ' ').trim();
  const cs = v.componentes.map((c, k) => `<div class="iav" style="--k:${k}" data-c0="${iavPos(c, txt)}">${c.titulo ? `<small class="iav-t">${esc(c.titulo)}</small>` : ''}${iavCompHtml(c)}</div>`).join('');
  const refs = v.referencias.length ? `<div class="iav-refs">${v.referencias.map((r) => (r.tela ? `<button type="button" class="iav-ref" data-act="iav-ref" data-tela="${esc(r.tela)}">${esc(r.rotulo)}<span aria-hidden="true">›</span></button>` : `<span class="iav-ref">${esc(r.rotulo)}</span>`)).join('')}</div>` : '';
  return `<div class="iav-l${voz ? ' voz' : ''}">${cs}${refs}</div>`;
}
// destaque sincronizado com a fala: acende o cartão do trecho que está sendo falado (pos = caractere do texto)
function iaVisAcende(root, pos) {
  const cs = [...root.querySelectorAll('.iav[data-c0]')]; if (!cs.length) return; let on = null;
  cs.forEach((c) => { const p = +c.dataset.c0; if (p >= 0 && p <= pos && (!on || p >= +on.dataset.c0)) on = c; });
  cs.forEach((c) => c.classList.toggle('on', c === on));
}
function iaVisAcao(act, ds) { if (act !== 'iav-ref') return false; if (typeof iaxIr === 'function') iaxIr(ds.tela); return true; }

/* ---------- relatório pronto, feito no app na hora (sem depender da IA); a IA, se responder a tempo, só acrescenta a análise ---------- */
const iarPedido = (qn) => /relatorio|\bpdf\b|planilha|excel|xlsx|resumo d[oa] (mes|periodo|ano|semestre|trimestre)|balanco d|fechamento d/.test(qn);
// período pela pergunta (já sem acento): "últimos 3 meses", "trimestre", "outubro", "março de 2025", "2025", "mês passado", "ano"; padrão: o mês atual
function iarPeriodo(qn) {
  const h = iaqHoje(); const N = { um: 1, dois: 2, tres: 3, quatro: 4, seis: 6, doze: 12 }; let a = h; let b = h; let m;
  const ano = /\b(20\d\d)\b/.exec(qn); const mi = MES_LONGO.findIndex((x) => new RegExp(`\\b${iaSemAcento(x)}\\b`).test(qn));
  if ((m = /ultim[oa]s?\s+(\d{1,2}|um|dois|tres|quatro|seis|doze)\s+mes/.exec(qn))) a = h - Math.min(24, +m[1] || N[m[1]] || 3) + 1;
  else if (/trimestre/.test(qn)) a = h - 2; else if (/semestre/.test(qn)) a = h - 5;
  else if (mi >= 0) { const y = ano ? +ano[1] : mi <= NOW_M ? NOW_Y : NOW_Y - 1; a = b = y * 12 + mi; }
  else if (ano) { a = +ano[1] * 12; b = Math.min(a + 11, h); }
  else if (/mes (passado|anterior)/.test(qn)) a = b = h - 1;
  else if (/\b(ano|anual)\b/.test(qn)) a = NOW_Y * 12;
  // ano (ou parte dele) compara com o mesmo trecho do ano anterior; o resto, com o mesmo tanto de meses antes
  const n = b - a + 1; const anual = a % 12 === 0 && n > 1; const ca = anual ? a - 12 : a - n; const cb = anual ? b - 12 : a - 1;
  const Y = (x) => Math.floor(x / 12);
  const nome = (x, z) => (x === z ? `${MES_LONGO[x % 12]} de ${Y(x)}` : x % 12 === 0 && Y(x) === Y(z) ? (z % 12 === 11 ? String(Y(x)) : `${Y(x)} até ${MES_LONGO[z % 12]}`) : `${E.MES[x % 12].toLowerCase()}/${Y(x)} a ${E.MES[z % 12].toLowerCase()}/${Y(z)}`);
  return { a, b, ca, cb, rot: nome(a, b), comp: nome(ca, cb) };
}
function iaRelLocal(qn) {
  if (!iaqAnos().length) return null; IAQ_C = {};
  const P = iarPeriodo(qn); const de = iaqIso(P.a); const ate = iaqIso(P.b);
  const K = {}; ['entradas', 'gastos', 'sobra', 'investido', 'patrimonio', 'metaInvestir', 'orcamento'].forEach((k) => { K[k] = iaConsultar('comparar', { metrica: k, a_de: de, a_ate: ate, b_de: iaqIso(P.ca), b_ate: iaqIso(P.cb) }); });
  if (Object.values(K).some((x) => x.erro)) return null;
  const va = (k) => K[k].a.valor; const vb = (k) => K[k].b.valor; const vr = (k) => (vb(k) ? K[k].variacao_de_b_para_a_pct : null);
  if (!va('entradas') && !va('gastos') && !va('investido')) return null; // sem números no período: segue a conversa normal
  const kpis = [{ rotulo: 'Entradas', valor: va('entradas'), unidade: 'reais', variacao: vr('entradas') }, { rotulo: 'Gastos', valor: va('gastos'), unidade: 'reais', variacao: vr('gastos'), inverso: true },
    { rotulo: 'Sobra', valor: va('sobra'), unidade: 'reais', variacao: vr('sobra') }, { rotulo: 'Investido', valor: va('investido'), unidade: 'reais', variacao: vr('investido') },
    { rotulo: 'Patrimônio', valor: va('patrimonio'), unidade: 'reais', variacao: vr('patrimonio') }];
  const meta = va('metaInvestir'); if (meta > 0) kpis.push({ rotulo: 'Da meta de investir', valor: Math.round((va('investido') / meta) * 1000) / 10, unidade: 'pct' });
  // gráfico: os meses do período (período curto: os 6 meses até o fim, para ter contexto), no máximo 24
  const g0 = Math.max(P.b - 23, P.b - P.a + 1 < 3 ? P.b - 5 : P.a); const rotM = (iso, longo) => { const [y, mm] = iso.split('-'); return longo ? `${MES_LONGO[+mm - 1]}/${y}` : `${E.MES[+mm - 1]}${y !== String(NOW_Y) ? '/' + y.slice(2) : ''}`; };
  const ser = (k, d0) => new Map((iaConsultar('serie', { metrica: k, de: d0, ate }).serie || []).map((x) => [x.mes, x.valor]));
  const gE = ser('entradas', iaqIso(g0)); const gG = ser('gastos', iaqIso(g0)); const mg = [...gE.keys()];
  const grafico = mg.length ? { tipo: 'barras', unidade: 'reais', rotulos: mg.map((x) => rotM(x)), series: [{ nome: 'Entradas', valores: mg.map((x) => gE.get(x)) }, { nome: 'Gastos', valores: mg.map((x) => gG.get(x) || 0) }] } : null;
  const T4 = ['entradas', 'gastos', 'sobra', 'investido'].map((k) => ser(k, de)); const mp = [...T4[0].keys()];
  const tabela = mp.length ? { colunas: ['Mês', 'Entradas', 'Gastos', 'Sobra', 'Investido'], tipos: ['texto', 'reais', 'reais', 'reais', 'reais'], linhas: mp.map((x) => [rotM(x, true)].concat(T4.map((s) => s.get(x) || 0))) } : null;
  const cats = iaConsultar('por_categoria', { de, ate, top: 8 }); const catsB = iaConsultar('por_categoria', { de: iaqIso(P.ca), ate: iaqIso(P.cb), top: 30 });
  const ranking = (cats.categorias || []).map((c) => ({ rotulo: c.categoria, valor: c.valor, pct: c.pct }));
  const L0 = iaConsultar('lancamentos', { de, ate, ordenar: 'maiores', limite: 100 }).itens || []; const top = L0.slice(0, 8); const lanc = L0.slice().sort((x, y) => (x.data < y.data ? -1 : 1));
  let metas = []; try { metas = ((objAnalise() || {}).itens || []).filter((g) => +g.valor > 0).slice(0, 4).map((g) => ({ rotulo: objNomeDe(g), atual: iaqR(g.saldo), alvo: iaqR(g.valor) })); } catch (e) { metas = []; }
  // leitura do período por regras; reais sem máscara aqui, quem desenha mascara (iaTxtIa) com o olho fechado
  const R = (v) => bf0.format(Math.round(v)); const L = [];
  const muda = (k, nome) => { const p = vr(k); if (p == null) return; L.push(Math.abs(p) < 1 ? `${nome} ficaram estáveis em relação a ${P.comp}.` : `${nome} ${p > 0 ? 'subiram' : 'caíram'} ${fmtPct(Math.abs(p))} em relação a ${P.comp}, de ${R(vb(k))} para ${R(va(k))}.`); };
  muda('gastos', 'Os gastos'); muda('entradas', 'As entradas');
  const so = va('sobra'); if (va('entradas') > 0) L.push(so >= 0 ? `Sobraram ${R(so)}, ${fmtPct((so / va('entradas')) * 100)} das entradas.` : `Os gastos passaram as entradas em ${R(-so)}.`);
  if (ranking[0]) L.push(`${ranking[0].rotulo} foi a maior categoria: ${R(ranking[0].valor)}, ${fmtPct(ranking[0].pct)} dos gastos.`);
  const mB = new Map((catsB.categorias || []).map((c) => [c.categoria, c.valor])); const sobe = ranking.map((c) => [c.rotulo, c.valor - (mB.get(c.rotulo) || 0)]).sort((x, y) => y[1] - x[1])[0];
  if (mB.size && sobe && sobe[1] >= 1) L.push(`A categoria que mais cresceu foi ${sobe[0]}: ${R(sobe[1])} a mais que em ${P.comp}.`);
  const orc = va('orcamento'); if (orc > 0 && va('gastos') > orc) L.push(`Atenção: os gastos passaram o limite planejado em ${R(va('gastos') - orc)}.`);
  if (meta > 0) L.push(va('investido') >= meta ? `Meta de investir batida: ${R(va('investido'))} de ${R(meta)}.` : `Faltaram ${R(meta - va('investido'))} para a meta de investir de ${R(meta)}.`);
  const fala = `Pronto! Montei o relatório de ${P.rot}: entraram ${R(va('entradas'))}, saíram ${R(va('gastos'))} e ${so >= 0 ? `sobraram ${R(so)}` : `faltaram ${R(-so)}`}. Toque em PDF ou Planilha para salvar.`;
  return { local: true, titulo: `Relatório de ${P.rot}`, periodo: P.rot, comp: P.comp, resumo: '', kpis, grafico, ranking, top, lanc, metas, leitura: L, secoes: [], tabela, fala };
}
// análise da IA em paralelo: uma rodada só, sem consultas, com os números já calculados; se não chegar em 30 s, o relatório fica sem ela
function iaRelAnalise(rel) {
  if (typeof iaNuvemOk !== 'function' || !iaNuvemOk()) return; rel.analisando = true;
  const resumo = { relatorio: { periodo: rel.periodo, comparadoCom: rel.comp, kpis: rel.kpis.map((k) => [k.rotulo, k.valor, k.unidade, k.variacao]), categorias: rel.ranking.map((c) => [c.rotulo, c.valor, c.pct]), leitura: rel.leitura, sonhos: rel.metas.map((g) => [g.rotulo, g.atual, g.alvo]) } };
  const fim = () => { rel.analisando = false; iaRefresh(); if (typeof vozVisualRefaz === 'function') vozVisualRefaz(); };
  Promise.race([Store.assistente({ pergunta: `Analise o relatório de ${rel.periodo}.`, resumo, historico: [], rapido: true, analise: true }), new Promise((_, f) => setTimeout(() => f(new Error('demorou')), 30000))])
    .then((o) => { if (o && o.texto) rel.secoes.push({ titulo: 'Análise do Cifrão', texto: iarTxt(o.texto, 1500) }); }, () => {}).finally(fim);
}
