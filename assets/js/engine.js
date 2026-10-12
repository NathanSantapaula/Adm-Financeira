/* Financial planning: motor de cálculo (puro, sem DOM). Roda no navegador e no Node (testes). */
(function (root) {
  'use strict';
  const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const z = () => new Array(12).fill(0);
  const add = (a, b) => a.map((x, i) => x + (+b[i] || 0));
  const sub = (a, b) => a.map((x, i) => x - (+b[i] || 0));
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const r2 = (x) => Math.round(x * 100) / 100;
  const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const MKEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function monthIndex(s) {
    const n = norm(s);
    if (!n) return -1;
    const i = MKEYS.indexOf(n.slice(0, 3));
    if (i >= 0 && /^[a-z]/.test(n)) return i;
    const k = parseInt(n, 10);
    return k >= 1 && k <= 12 && /^\d+$/.test(n) ? k - 1 : -1;
  }

  /* ---------- valores digitados: "1.234,56", "1234.56", "=100,50+20" ---------- */
  function parseValor(str) {
    if (typeof str === 'number') return isFinite(str) ? str : NaN;
    const s = String(str == null ? '' : str).replace(/R\$|\s/g, '').replace(/^=/, '');
    if (s === '' || s === '-') return 0;
    const parts = s.split(/(?=[+-])/).filter(Boolean);
    let total = 0;
    for (const p of parts) {
      let t = p;
      if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
      else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
      const n = Number(t);
      if (!isFinite(n) || t === '' || t === '+' || t === '-') return NaN;
      total += n;
    }
    return r2(total);
  }

  /* ---------- parcelamento: um único item, valor distribuído pelos meses ---------- */
  function distribuir(total, n) {
    const cents = Math.round(total * 100); const base = Math.trunc(cents / n); let rem = cents - base * n;
    return Array.from({ length: n }, () => { const extra = rem > 0 ? 1 : rem < 0 ? -1 : 0; rem -= extra; return (base + extra) / 100; });
  }
  // devolve os 12 valores do ano `ano` para um parcelamento {total, n, ano, mes}
  function parcelaMeses(p, ano) {
    const out = z(); const parts = distribuir(+p.total || 0, Math.max(1, p.n | 0));
    parts.forEach((v, i) => { const idx = p.ano * 12 + p.mes + i; if (Math.floor(idx / 12) === ano) out[idx % 12] += v; });
    return out.map(r2);
  }
  function parcelaFim(p) { const idx = p.ano * 12 + p.mes + Math.max(1, p.n | 0) - 1; return { ano: Math.floor(idx / 12), mes: idx % 12 }; }
  const parcelaIndice = (p, ano, mes) => { const i = ano * 12 + mes - (p.ano * 12 + p.mes) + 1; return i >= 1 && i <= p.n ? i : 0; };
  const itemValores = (it, ano) => (it.parcel ? parcelaMeses(it.parcel, ano) : it.valores || z());
  // parcelas de anos anteriores que ainda correm no ano `ano` (somente leitura)
  function carryItems(plans, ano) {
    const out = [];
    Object.keys(plans).map(Number).filter((y) => y < ano).sort().forEach((y) => {
      (plans[y].despesas || []).forEach((it) => {
        if (!it.parcel) return;
        const v = parcelaMeses(it.parcel, ano);
        if (v.some((x) => x !== 0)) out.push(Object.assign({}, it, { id: 'carry:' + it.id, herdado: y, valores: v }));
      });
    });
    return out;
  }

  /* ---------- carteira ---------- */
  const TAXONOMIA = {
    'RENDA FIXA': { "CDB's": {}, 'Tesouro Direto': {} },
    'BOLSA DE VALORES': {
      'Ações BR': { Financeiro: [], Utilities: [], Commodities: [] },
      'Ações EUA': {}, Criptoativos: {}, "ETF's": {},
      'Fundos Imobiliários': { 'Fundo de Papel (CRI)': ['High Yield', 'High Grade'], 'Fundo de Tijolo': ['Shoppings Centers', 'Lajes Corporativas', 'Galpões Logísticos'], 'Híbridos': [], FoFs: [] },
    },
  };
  const ASSET_LEVELS = ['tipo', 'classe', 'grupo', 'subgrupo'];
  const ativoKey = (a) => [norm(a.tipo), norm(a.classe), norm(a.grupo), norm(a.subgrupo), norm(a.nome)].join('|');

  function buildAssetTree(ativos, field) {
    const root = { children: [], map: new Map() };
    for (const a of ativos) {
      let node = root, key = '';
      for (const lv of ASSET_LEVELS) {
        const lab = a[lv]; if (!lab) continue;
        key += '/' + lab;
        let ch = node.map.get(lab);
        if (!ch) { ch = { key, label: lab, level: lv, depth: ASSET_LEVELS.indexOf(lv), children: [], map: new Map(), v: z() }; node.map.set(lab, ch); node.children.push(ch); }
        ch.v = add(ch.v, a[field]); node = ch;
      }
      node.children.push({ leaf: true, key: key + '/#' + a.id, label: a.nome, asset: a, v: a[field] });
    }
    return root.children;
  }

  // só compra, nunca vende: o aporte vai primeiro para o que está abaixo do alvo
  function rebalance(items, aporte) {
    const n = items.length;
    const w = items.map((i) => Math.max(0, +i.w || 0)); const v = items.map((i) => Math.max(0, +i.v || 0));
    const W = sum(w); const total = sum(v);
    const zero = { alloc: new Array(n).fill(0), W, total, T: total + Math.max(0, aporte) };
    if (!(aporte > 0) || W <= 0 || n === 0) return zero;
    const T = total + aporte;
    const need = w.map((x, i) => Math.max(0, (x / W) * T - v[i])); const N = sum(need);
    let raw;
    if (N <= 0) raw = w.map((x) => (aporte * x) / W);
    else if (N >= aporte) raw = need.map((x) => (aporte * x) / N);
    else raw = need.map((x, i) => x + ((aporte - N) * w[i]) / W);
    const cents = raw.map((x) => Math.floor(x * 100 + 1e-7));
    let left = Math.round(aporte * 100) - sum(cents);
    const order = raw.map((x, i) => [x * 100 - Math.floor(x * 100 + 1e-7), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; left > 0 && order.length; k = (k + 1) % order.length) { cents[order[k][1]]++; left--; }
    return { alloc: cents.map((c) => c / 100), W, total, T };
  }

  /* ---------- perfil de investidor (questionário simplificado) ---------- */
  const QUIZ = [
    { q: 'Por quanto tempo você pretende manter esse dinheiro investido?', o: [['Menos de 1 ano', 1], ['De 1 a 3 anos', 2], ['De 3 a 7 anos', 3], ['Mais de 7 anos', 4]] },
    { q: 'Qual é o seu principal objetivo ao investir?', o: [['Preservar o que já tenho', 1], ['Ganhar um pouco acima da renda fixa', 2], ['Crescer de forma equilibrada', 3], ['Maximizar o retorno, aceitando oscilações', 4]] },
    { q: 'Sua carteira cai 15% em um mês. O que você faz?', o: [['Vendo tudo para evitar mais perdas', 1], ['Vendo uma parte', 2], ['Mantenho e espero', 3], ['Aproveito para comprar mais', 4]] },
    { q: 'Qual é a sua experiência com investimentos?', o: [['Só poupança', 1], ['Renda fixa: CDB e Tesouro', 2], ['Também ações, FIIs e fundos', 3], ['Diversos ativos de risco, incluindo exterior e cripto', 4]] },
    { q: 'Que parcela do seu patrimônio financeiro esse dinheiro representa?', o: [['Mais de 70%', 1], ['Entre 40% e 70%', 2], ['Entre 10% e 40%', 3], ['Menos de 10%', 4]] },
    { q: 'Você tem reserva de emergência?', o: [['Não tenho', 1], ['Cobre menos de 6 meses de gastos', 2], ['Cobre de 6 a 12 meses', 3], ['Cobre mais de 12 meses', 4]] },
    { q: 'Qual queda anual da carteira você toleraria sem desistir da estratégia?', o: [['Nenhuma', 1], ['Até 5%', 2], ['Até 15%', 3], ['Mais de 15%', 4]] },
  ];
  const PERFIS = {
    conservador: { nome: 'Conservador', desc: 'Você prioriza segurança e previsibilidade. Prefere abrir mão de parte do retorno para não ver o patrimônio oscilar.', alvo: { rendaFixa: 80, bolsa: 20 } },
    moderado: { nome: 'Moderado', desc: 'Você busca equilíbrio entre proteção e crescimento e aceita oscilações moderadas em nome de um retorno maior no longo prazo.', alvo: { rendaFixa: 60, bolsa: 40 } },
    agressivo: { nome: 'Agressivo', desc: 'Você foca em crescimento no longo prazo e tolera oscilações relevantes, entendendo que perdas temporárias fazem parte do caminho.', alvo: { rendaFixa: 30, bolsa: 70 } },
  };
  function scorePerfil(resp) {
    const min = QUIZ.length; const max = QUIZ.length * 4;
    const pontos = resp.reduce((s, i, q) => s + (QUIZ[q] && QUIZ[q].o[i] ? QUIZ[q].o[i][1] : 0), 0);
    const f = (pontos - min) / (max - min);
    return { pontos, resultado: f < 0.34 ? 'conservador' : f < 0.67 ? 'moderado' : 'agressivo' };
  }
  const RETORNO_PADRAO = { conservador: 8, moderado: 10, agressivo: 12 }; // hipóteses editáveis, % ao ano

  /* ---------- projeção de patrimônio (ilustrativa) ---------- */
  function projetar(patr, aporte, retornoAnual, meses) {
    const r = Math.pow(1 + (+retornoAnual || 0) / 100, 1 / 12) - 1; let v = +patr || 0; const out = [];
    for (let i = 1; i <= meses; i++) { v = v * (1 + r) + (+aporte || 0); out.push(v); }
    return out;
  }
  function mesesAteMeta(patr, aporte, retornoAnual, alvo, limite) {
    if (!(alvo > 0)) return null;
    if (patr >= alvo) return 0;
    const r = Math.pow(1 + (+retornoAnual || 0) / 100, 1 / 12) - 1; let v = +patr || 0;
    for (let i = 1; i <= (limite || 1200); i++) { v = v * (1 + r) + (+aporte || 0); if (v >= alvo) return i; }
    return null;
  }

  /* ---------- plano: modelo v2, migração do v1 e cálculo ---------- */
  const CATS_DESP = () => [{ id: 'fixa', nome: 'Despesa fixa' }, { id: 'variavel', nome: 'Despesa variável' }];
  const CATS_RENDA = () => [{ id: 'fixa', nome: 'Renda fixa' }, { id: 'extra', nome: 'Renda extra' }];

  function migratePlan(p, newId) {
    if ((p.v | 0) >= 2) return p;
    const st = p.settings || {};
    const out = { v: 2, year: p.year, updatedAt: p.updatedAt || 0, settings: { metaAporte: +st.metaBase || 0, metaInvAno: +st.metaInvAno || 0, orcPadrao: 0 },
      rendaCats: CATS_RENDA(), rendas: [], catsDesp: CATS_DESP(), despesas: [], orcamento: new Array(12).fill(null), ativos: p.ativos || [] };
    (p.rendas || []).forEach((r) => out.rendas.push({ id: r.id || newId(), cat: r.cat === 'FIXA' ? 'fixa' : 'extra', nome: r.detalhe, fonte: r.area || '', valores: r.v }));
    if ((p.outros || []).some((x) => +x)) { out.rendaCats.push({ id: 'outros', nome: 'Outros' }); out.rendas.push({ id: newId(), cat: 'outros', nome: 'Outros', fonte: '', valores: p.outros }); }
    (p.despesas || []).forEach((d) => {
      const byDesc = new Map();
      (d.lanc || []).forEach((l) => { const k = norm(l.d); if (!byDesc.has(k)) byDesc.set(k, { nome: l.d, valores: z() }); byDesc.get(k).valores[l.m] += +l.v || 0; });
      byDesc.forEach((x) => out.despesas.push({ id: newId(), cat: d.cat === 'FIXA' ? 'fixa' : 'variavel', area: d.area, sub: d.nome, nome: x.nome, valores: x.valores.map(r2) }));
    });
    return out;
  }

  function compute(plan, ctx) {
    ctx = ctx || {};
    const st = plan.settings || {};
    const metaAporte = +st.metaAporte || 0; const orcPad = +st.orcPadrao || 0;
    const rendaCat = {}; (plan.rendaCats || []).forEach((c) => { rendaCat[c.id] = z(); });
    let rendas = z();
    (plan.rendas || []).forEach((r) => { rendaCat[r.cat] = add(rendaCat[r.cat] || z(), r.valores); rendas = add(rendas, r.valores); });
    let dividendos = z(), rentab = z(), aplicado = z();
    (plan.ativos || []).forEach((a) => { aplicado = add(aplicado, a.ap); if (a.tipo === 'RENDA FIXA') rentab = add(rentab, a.pr); else dividendos = add(dividendos, a.pr); });
    const receita = add(rendas, dividendos);
    const despCat = {}; (plan.catsDesp || []).forEach((c) => { despCat[c.id] = z(); });
    let despesas = z();
    (plan.despesas || []).concat(ctx.carry || []).forEach((it) => { const v = itemValores(it, plan.year); despCat[it.cat] = add(despCat[it.cat] || z(), v); despesas = add(despesas, v); });
    const orcamento = z().map((_, m) => (plan.orcamento && plan.orcamento[m] != null ? +plan.orcamento[m] : orcPad));
    const restante = orcamento.map((o, m) => o - despesas[m]);
    const usoOrc = orcamento.map((o, m) => (o > 0 ? despesas[m] / o : null));
    const investAlocado = sub(receita, despesas);
    const poupanca = receita.map((r, m) => (r > 0 ? investAlocado[m] / r : null));
    const aportes = sub(aplicado, dividendos);
    const diferenca = sub(investAlocado, aportes);
    const meta = dividendos.map((d) => metaAporte + d);
    const faturamento = add(dividendos, rentab);
    const patrimonioAnoCustom = st.patrimonioInicial != null && st.patrimonioInicial !== '' ? (+st.patrimonioInicial || 0) : null;
    const base = patrimonioAnoCustom !== null ? patrimonioAnoCustom : ((+ctx.patrimonioInicial || 0) + (+ctx.prevAplicado || 0));

    let acc = base; const patrimonio = aplicado.map((a) => (acc += a));
    const out = { rendaCat, rendas, dividendos, rentab, receita, despCat, despesas, orcamento, restante, usoOrc, investAlocado, poupanca, aplicado, aportes, diferenca, meta, faturamento, patrimonio, patrimonioBase: base };
    const T = {};
    ['rendas', 'dividendos', 'rentab', 'receita', 'despesas', 'orcamento', 'restante', 'investAlocado', 'aplicado', 'aportes', 'diferenca', 'meta', 'faturamento'].forEach((k) => { T[k] = sum(out[k]); });
    T.poupanca = T.receita > 0 ? T.investAlocado / T.receita : null;
    T.usoOrc = T.orcamento > 0 ? T.despesas / T.orcamento : null;
    T.patrimonio = patrimonio[11];
    out.T = T;
    const ma = +st.metaInvAno || 0;
    out.metaAno = ma > 0 ? ma : T.meta; out.metaAnoDefinida = ma > 0;
    return out;
  }

  /* ---------- backup ---------- */
  const FORMATO_BACKUP = 2;
  function makeBackup(perfil, planos) { return { app: 'financial-planning', formato: FORMATO_BACKUP, exportadoEm: new Date().toISOString(), perfil, planos }; }
  function parseBackup(obj, newId) {
    const avisos = [];
    if (!obj || typeof obj !== 'object') return { ok: false, erro: 'O arquivo não é um backup do Financial planning.' };
    let planos = {}; let perfil = null;
    if (obj.app === 'financial-planning' && obj.planos) {
      if ((obj.formato | 0) > FORMATO_BACKUP) return { ok: false, erro: 'Este backup é de uma versão mais nova do sistema.' };
      perfil = obj.perfil || null;
      Object.keys(obj.planos).forEach((y) => { if (obj.planos[y] && Array.isArray(obj.planos[y].ativos || [])) planos[+y] = migratePlan(Object.assign({}, obj.planos[y], { year: +y }), newId); });
    } else if (obj.year && (obj.rendas || obj.ativos)) { // JSON de um único ano (versão anterior)
      planos[+obj.year] = migratePlan(obj, newId); avisos.push('Arquivo de um único ano (versão anterior): somente o planejamento de ' + obj.year + ' será restaurado.');
    } else return { ok: false, erro: 'O arquivo não é um backup do Financial planning.' };
    if (!Object.keys(planos).length) return { ok: false, erro: 'O backup não contém nenhum planejamento.' };
    return { ok: true, perfil, planos, avisos };
  }

  /* ---------- modelo de planilha e importação (.xlsx) ---------- */
  function templateSheets(ano) {
    ano = ano || new Date().getFullYear();
    const M = MES.slice(); const flat = (x) => new Array(12).fill(x); const ramp = (a) => a.concat(new Array(12 - a.length).fill(0));
    return [
      { name: 'Instruções', rows: [
        ['Financial planning: modelo de importação'], [''],
        ['Como usar'],
        ['1. Preencha as abas que quiser: Rendas, Despesas, Parcelados, Investimentos, Proventos e Carteira. Só as abas encontradas são importadas.'],
        ['2. Não altere os nomes das abas nem os cabeçalhos da primeira linha de cada aba.'],
        ['3. Apague as linhas de exemplo antes de preencher com os seus dados. Os exemplos são fictícios e não são recomendação de investimento.'],
        ['4. Números: use ponto ou vírgula como separador decimal (por exemplo, 1234,56). Células vazias contam como zero.'],
        ['5. Ao importar, escolha Mesclar (atualiza e acrescenta) ou Substituir (troca o conteúdo das seções enviadas).'],
        [''], ['O que vai em cada aba'],
        ['Rendas: Categoria (qualquer nome, como Renda fixa, Renda extra ou Aluguéis), Fonte (opcional), Item e o valor de cada mês.'],
        ['Despesas: Categoria (como Despesa fixa ou Despesa variável), Área, Subárea (opcional), Item e o valor de cada mês.'],
        ['Parcelados: um item por linha, com Valor total, número de Parcelas, Mês inicial (Jan a Dez ou 1 a 12) e Ano inicial. O sistema distribui o valor pelos meses.'],
        ['Investimentos: valor aplicado em cada ativo por mês. Negativo é resgate. Tipo: Renda fixa ou Bolsa de valores. Grupo e Subgrupo são opcionais.'],
        ['Proventos: dividendos e rendimentos por ativo e mês, com as mesmas colunas de Investimentos.'],
        ['Carteira: percentual-alvo de cada ativo (Alvo %, somando 100). Valor atual (R$) e Preço (R$) são opcionais.'],
      ] },
      { name: 'Rendas', rows: [['Categoria', 'Fonte', 'Item', ...M],
        ['Renda fixa', 'Empresa Exemplo', 'Salário', ...flat(8000)], ['Renda extra', 'Consultoria', 'Projeto avulso', ...ramp([0, 0, 1500, 0, 0, 2000])]] },
      { name: 'Despesas', rows: [['Categoria', 'Área', 'Subárea', 'Item', ...M],
        ['Despesa fixa', 'Moradia', '', 'Aluguel', ...flat(2200)], ['Despesa fixa', 'Moradia', 'Contas', 'Energia', ...flat(180)],
        ['Despesa variável', 'Pessoal', 'Vestuário', 'Camiseta', ...ramp([90])], ['Despesa variável', 'Lazer', '', 'Restaurantes', ...flat(450)]] },
      { name: 'Parcelados', rows: [['Categoria', 'Área', 'Subárea', 'Item', 'Valor total', 'Parcelas', 'Mês inicial', 'Ano inicial'],
        ['Despesa variável', 'Pessoal', 'Eletrônicos', 'Notebook', 6000, 10, 'Mar', ano]] },
      { name: 'Investimentos', rows: [['Tipo', 'Classe', 'Grupo', 'Subgrupo', 'Ativo', ...M],
        ['Renda fixa', "CDB's", '', '', 'CDB Banco Exemplo', ...ramp([1000, 1000, 1000, 1000])],
        ['Renda fixa', 'Tesouro Direto', '', '', 'Tesouro Selic', ...ramp([800, 800, 800, 800])],
        ['Bolsa de valores', 'Ações BR', 'Financeiro', '', 'ABCD3', ...ramp([0, 600, 0, 600])],
        ['Bolsa de valores', 'Fundos Imobiliários', 'Fundo de Tijolo', 'Galpões Logísticos', 'WXYZ11', ...ramp([400, 400, 400, 400])]] },
      { name: 'Proventos', rows: [['Tipo', 'Classe', 'Grupo', 'Subgrupo', 'Ativo', ...M],
        ['Bolsa de valores', 'Ações BR', 'Financeiro', '', 'ABCD3', ...ramp([0, 0, 12.5, 0, 0, 12.5])],
        ['Bolsa de valores', 'Fundos Imobiliários', 'Fundo de Tijolo', 'Galpões Logísticos', 'WXYZ11', ...ramp([1.8, 1.8, 1.8, 1.8, 1.8, 1.8])]] },
      { name: 'Carteira', rows: [['Tipo', 'Classe', 'Grupo', 'Subgrupo', 'Ativo', 'Alvo %', 'Valor atual (R$)', 'Preço (R$)'],
        ['Renda fixa', "CDB's", '', '', 'CDB Banco Exemplo', 30, '', ''], ['Renda fixa', 'Tesouro Direto', '', '', 'Tesouro Selic', 30, '', ''],
        ['Bolsa de valores', 'Ações BR', 'Financeiro', '', 'ABCD3', 15, '', 32.4], ['Bolsa de valores', 'Fundos Imobiliários', 'Fundo de Tijolo', 'Galpões Logísticos', 'WXYZ11', 25, '', 98.7]] },
    ];
  }

  const normTipo = (s) => {
    const n = norm(s); if (!n) return '';
    if (n.includes('fixa')) return 'RENDA FIXA';
    if (n.includes('bolsa') || n.includes('variavel') || n.includes('acoes') || n.includes('renda var')) return 'BOLSA DE VALORES';
    return String(s).trim().toUpperCase();
  };
  const cellNum = (v, avisos, where) => {
    if (v === '' || v == null) return 0;
    const r = parseValor(typeof v === 'string' ? v.replace('%', '') : v);
    if (Number.isNaN(r)) { avisos.push(`${where}: valor inválido “${v}” foi tratado como zero.`); return 0; }
    return r;
  };
  const sheetByName = (sheets, names) => sheets.find((s) => names.includes(norm(s.name)));
  function readTable(sheet, firstHeader) {
    const rows = sheet.rows || []; const hi = rows.findIndex((r) => norm(r[0]) === firstHeader);
    if (hi < 0) return null;
    return { head: rows[hi], body: rows.slice(hi + 1).map((r, i) => ({ r, line: hi + 2 + i })).filter(({ r }) => r.some((c) => String(c).trim() !== '')) };
  }
  function monthCols(head, from) {
    const cols = new Array(12).fill(-1);
    head.forEach((h, c) => { if (c >= from) { const m = monthIndex(h); if (m >= 0 && cols[m] < 0) cols[m] = c; } });
    if (cols.every((c) => c < 0)) for (let m = 0; m < 12; m++) cols[m] = from + m;
    return cols;
  }

  function parseImport(sheets) {
    const avisos = []; const out = { found: {}, rendas: [], desp: [], parc: [], inv: [], prov: [], cart: [], avisos };
    const tab = (names, first, key, label) => { const sh = sheetByName(sheets, names); const t = sh && readTable(sh, first); if (t) out.found[key] = true; else if (sh) avisos.push(`Aba ${label} encontrada, mas sem o cabeçalho “${first[0].toUpperCase() + first.slice(1)}” na primeira coluna. Aba ignorada.`); return t; };

    let t = tab(['rendas'], 'categoria', 'rendas', 'Rendas');
    if (t) { const cols = monthCols(t.head, 3); t.body.forEach(({ r, line }) => {
      const where = `Rendas, linha ${line}`; const cat = String(r[0]).trim(); const nome = String(r[2]).trim();
      if (!cat || !nome) { avisos.push(`${where}: categoria e item são obrigatórios. Linha ignorada.`); return; }
      out.rendas.push({ cat, fonte: String(r[1]).trim(), nome, v: cols.map((ci) => cellNum(r[ci], avisos, where)) }); }); }

    t = tab(['despesas'], 'categoria', 'desp', 'Despesas');
    if (t) { const cols = monthCols(t.head, 4); t.body.forEach(({ r, line }) => {
      const where = `Despesas, linha ${line}`; const cat = String(r[0]).trim(); const area = String(r[1]).trim(); const nome = String(r[3]).trim();
      if (!cat || !area || !nome) { avisos.push(`${where}: categoria, área e item são obrigatórios. Linha ignorada.`); return; }
      out.desp.push({ cat, area, sub: String(r[2]).trim(), nome, v: cols.map((ci) => cellNum(r[ci], avisos, where)) }); }); }

    t = tab(['parcelados'], 'categoria', 'parc', 'Parcelados');
    if (t) t.body.forEach(({ r, line }) => {
      const where = `Parcelados, linha ${line}`; const cat = String(r[0]).trim(); const area = String(r[1]).trim(); const nome = String(r[3]).trim();
      const total = cellNum(r[4], avisos, where); const n = Math.round(cellNum(r[5], avisos, where)); const mes = monthIndex(r[6]); const ano = parseInt(r[7], 10);
      if (!cat || !area || !nome) { avisos.push(`${where}: categoria, área e item são obrigatórios. Linha ignorada.`); return; }
      if (!(total !== 0) || !(n >= 1 && n <= 120)) { avisos.push(`${where}: informe valor total e parcelas (de 1 a 120). Linha ignorada.`); return; }
      if (mes < 0 || !(ano >= 1990 && ano <= 2100)) { avisos.push(`${where}: mês inicial ou ano inicial inválido. Linha ignorada.`); return; }
      out.parc.push({ cat, area, sub: String(r[2]).trim(), nome, total, n, mes, ano }); });

    const assets = (names, key, label) => {
      const tt = tab(names, 'tipo', key, label); if (!tt) return; const cols = monthCols(tt.head, 5);
      tt.body.forEach(({ r, line }) => {
        const where = `${label}, linha ${line}`; const tipo = normTipo(r[0]); const classe = String(r[1]).trim(); const nome = String(r[4]).trim();
        if (!tipo || !classe || !nome) { avisos.push(`${where}: tipo, classe e ativo são obrigatórios. Linha ignorada.`); return; }
        const grupo = String(r[2]).trim() || null; const subgrupo = String(r[3]).trim() || null;
        if (subgrupo && !grupo) { avisos.push(`${where}: subgrupo sem grupo. Linha ignorada.`); return; }
        out[key].push({ tipo, classe, grupo, subgrupo, nome, v: cols.map((ci) => cellNum(r[ci], avisos, where)) });
      });
    };
    assets(['investimentos'], 'inv', 'Investimentos'); assets(['proventos'], 'prov', 'Proventos');

    const tc = tab(['carteira'], 'tipo', 'cart', 'Carteira');
    if (tc) {
      const hc = (name, d) => { const i = tc.head.findIndex((h) => norm(h).startsWith(name)); return i >= 0 ? i : d; };
      const ci = { alvo: hc('alvo', 5), valor: hc('valor', 6), preco: hc('preco', 7) };
      tc.body.forEach(({ r, line }) => {
        const where = `Carteira, linha ${line}`; const tipo = normTipo(r[0]); const classe = String(r[1]).trim(); const nome = String(r[4]).trim();
        if (!tipo || !classe || !nome) { avisos.push(`${where}: tipo, classe e ativo são obrigatórios. Linha ignorada.`); return; }
        const opt = (c) => (r[c] === '' || r[c] == null ? null : cellNum(r[c], avisos, where));
        out.cart.push({ tipo, classe, grupo: String(r[2]).trim() || null, subgrupo: String(r[3]).trim() || null, nome, alvo: cellNum(r[ci.alvo], avisos, where), valor: opt(ci.valor), preco: opt(ci.preco) });
      });
      const a = out.cart.map((x) => x.alvo);
      if (a.length && Math.max(...a) <= 1 && sum(a) <= 1.0001) { out.cart.forEach((x) => { x.alvo = r2(x.alvo * 100); }); avisos.push('Alvo % estava em fração (0,25 = 25%); foi convertido para percentual.'); }
      else if (a.length && Math.abs(sum(out.cart.map((x) => x.alvo)) - 100) > 0.5) avisos.push(`Os alvos da carteira somam ${r2(sum(out.cart.map((x) => x.alvo)))}%, não 100%. Você poderá normalizar na aba Carteira.`);
    }
    out.counts = { rendas: out.rendas.length, despesas: out.desp.length, parcelados: out.parc.length, investimentos: out.inv.length, proventos: out.prov.length, carteira: out.cart.length };
    out.vazio = !Object.values(out.counts).some((n) => n > 0);
    return out;
  }

  function applyImport(plan, carteira, parsed, mode, newId) {
    const replace = mode === 'replace'; const res = { rendas: 0, despesas: 0, parcelados: 0, ativos: 0, carteira: 0 };
    const cat = (list, nome) => { let c = list.find((x) => norm(x.nome) === norm(nome)); if (!c) { c = { id: newId(), nome }; list.push(c); } return c.id; };
    if (parsed.found.rendas) {
      if (replace) plan.rendas = [];
      parsed.rendas.forEach((x) => {
        const cid = cat(plan.rendaCats, x.cat);
        let r = plan.rendas.find((y) => y.cat === cid && norm(y.nome) === norm(x.nome) && norm(y.fonte) === norm(x.fonte));
        if (!r) { r = { id: newId(), cat: cid, nome: x.nome, fonte: x.fonte, valores: z() }; plan.rendas.push(r); }
        r.valores = x.v.slice(); res.rendas++;
      });
    }
    if (parsed.found.desp || parsed.found.parc) {
      if (replace) plan.despesas = [];
      const find = (cid, x) => plan.despesas.find((y) => y.cat === cid && norm(y.area) === norm(x.area) && norm(y.sub) === norm(x.sub) && norm(y.nome) === norm(x.nome));
      parsed.desp.forEach((x) => {
        const cid = cat(plan.catsDesp, x.cat); let d = find(cid, x);
        if (!d) { d = { id: newId(), cat: cid, area: x.area, sub: x.sub || '', nome: x.nome, valores: z() }; plan.despesas.push(d); }
        delete d.parcel; d.valores = x.v.slice(); res.despesas++;
      });
      parsed.parc.forEach((x) => {
        const cid = cat(plan.catsDesp, x.cat); let d = find(cid, x);
        if (!d) { d = { id: newId(), cat: cid, area: x.area, sub: x.sub || '', nome: x.nome, valores: z() }; plan.despesas.push(d); }
        d.parcel = { total: x.total, n: x.n, ano: x.ano, mes: x.mes }; res.parcelados++;
      });
    }
    const upsert = (x) => {
      const k = ativoKey(x); let a = plan.ativos.find((y) => ativoKey(y) === k);
      if (!a) { a = { id: newId(), tipo: x.tipo, classe: x.classe, grupo: x.grupo || null, subgrupo: x.subgrupo || null, nome: x.nome, ap: z(), pr: z() }; plan.ativos.push(a); res.ativos++; }
      return a;
    };
    if (replace && parsed.found.inv) plan.ativos.forEach((a) => { a.ap = z(); });
    if (replace && parsed.found.prov) plan.ativos.forEach((a) => { a.pr = z(); });
    parsed.inv.forEach((x) => { upsert(x).ap = x.v.slice(); });
    parsed.prov.forEach((x) => { upsert(x).pr = x.v.slice(); });
    if (parsed.found.cart) {
      if (replace) carteira.length = 0;
      parsed.cart.forEach((x) => {
        const a = upsert(x); const k = ativoKey(a); let e = carteira.find((y) => y.k === k);
        if (!e) { e = { k, alvo: 0, valor: null, preco: null }; carteira.push(e); }
        e.alvo = x.alvo; e.valor = x.valor; e.preco = x.preco; res.carteira++;
      });
    }
    return res;
  }

  const api = { MES, MES_LONGO, TAXONOMIA, ASSET_LEVELS, QUIZ, PERFIS, RETORNO_PADRAO, CATS_DESP, CATS_RENDA, FORMATO_BACKUP,
    z, add, sub, sum, r2, norm, monthIndex, parseValor, distribuir, parcelaMeses, parcelaFim, parcelaIndice, itemValores, carryItems,
    ativoKey, buildAssetTree, rebalance, scorePerfil, projetar, mesesAteMeta, migratePlan, compute, makeBackup, parseBackup,
    templateSheets, parseImport, applyImport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FPEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
