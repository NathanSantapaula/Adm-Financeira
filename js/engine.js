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
  const itemValores = (it, ano) => {
    const v = it.parcel ? parcelaMeses(it.parcel, ano) : (it.valores || z()); const b = it.baixas;
    return b ? v.map((x, m) => (b[ano + '-' + m] ? 0 : x)) : v; // baixa = mês já realizado por um lançamento real
  };
  const parseDataISO = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? { ano: +m[1], mes: +m[2] - 1, dia: +m[3] } : null; };
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
  /* Simulador "E se?": compara o cenário atual com outro aporte e outro retorno, mês a mês (juros compostos).
     o: { patrimonio, aporte (atual, por mês), extra (somado ao aporte), retornoBase e retorno (% ao ano), alvo, limite (meses, padrão 600) } */
  function simularObjetivo(o) {
    const lim = Math.max(12, o.limite || 600); const alvo = +o.alvo || 0; const p = Math.max(0, +o.patrimonio || 0);
    const cen = (aporte, ret) => {
      aporte = Math.max(0, +aporte || 0); ret = +ret || 0;
      const meses = mesesAteMeta(p, aporte, ret, alvo, lim); const c = { aporte, retorno: ret, meses, aportado: null, juros: null, final: null };
      if (meses > 0) { const f = projetar(p, aporte, ret, meses)[meses - 1]; c.final = f; c.aportado = p + aporte * meses; c.juros = f - c.aportado; }
      return c;
    };
    const base = cen(o.aporte, o.retornoBase); const sim = cen((+o.aporte || 0) + (+o.extra || 0), o.retorno);
    const maior = Math.max(base.meses || 0, sim.meses || 0);
    const anos = base.meses == null && sim.meses == null ? 30 : Math.min(Math.ceil(lim / 12), Math.max(5, Math.ceil(maior / 12) + 1));
    const serie = (c) => { const pr = projetar(p, c.aporte, c.retorno, anos * 12); return [p].concat(pr.filter((_, i) => i % 12 === 11)); };
    return { alvo, patrimonio: p, base, sim, anos, serieBase: serie(base), serieSim: serie(sim), limite: lim,
      diferenca: base.meses != null && sim.meses != null ? base.meses - sim.meses : null };
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
    const lancQtd = new Array(12).fill(0); let despReais = z();
    (plan.lancamentos || []).forEach((l) => {
      const d = parseDataISO(l.data); if (!d || d.ano !== plan.year) return;
      const vec = z(); vec[d.mes] = +l.valor || 0; despCat[l.cat] = add(despCat[l.cat] || z(), vec); despesas = add(despesas, vec); despReais = add(despReais, vec); lancQtd[d.mes]++;
    });
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
    const out = { rendaCat, rendas, dividendos, rentab, receita, despCat, despesas, orcamento, restante, usoOrc, investAlocado, poupanca, aplicado, aportes, diferenca, meta, faturamento, patrimonio, patrimonioBase: base, lancQtd, despReais };
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
    if (!obj || typeof obj !== 'object') return { ok: false, erro: 'O arquivo não é um backup do AVEN.' };
    let planos = {}; let perfil = null;
    if (obj.app === 'financial-planning' && obj.planos) {
      if ((obj.formato | 0) > FORMATO_BACKUP) return { ok: false, erro: 'Este backup é de uma versão mais nova do sistema.' };
      perfil = obj.perfil || null;
      Object.keys(obj.planos).forEach((y) => { if (obj.planos[y] && Array.isArray(obj.planos[y].ativos || [])) planos[+y] = migratePlan(Object.assign({}, obj.planos[y], { year: +y }), newId); });
    } else if (obj.year && (obj.rendas || obj.ativos)) { // JSON de um único ano (versão anterior)
      planos[+obj.year] = migratePlan(obj, newId); avisos.push('Arquivo de um único ano (versão anterior): somente o planejamento de ' + obj.year + ' será restaurado.');
    } else return { ok: false, erro: 'O arquivo não é um backup do AVEN.' };
    if (!Object.keys(planos).length) return { ok: false, erro: 'O backup não contém nenhum planejamento.' };
    return { ok: true, perfil, planos, avisos };
  }

  /* ---------- modelo de planilha e importação (.xlsx) ---------- */
  function templateSheets(ano) {
    ano = ano || new Date().getFullYear();
    const M = MES.slice(); const flat = (x) => new Array(12).fill(x); const ramp = (a) => a.concat(new Array(12 - a.length).fill(0));
    return [
      { name: 'Instruções', rows: [
        ['AVEN Financial Planning: modelo de importação'], [''],
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

  /* ---------- planos e permissões ---------- */
  const PLANOS = {
    gratis: { id: 'gratis', rank: 0, nome: 'Organização', slogan: 'Fluxo de caixa simples' },
    investidor: { id: 'investidor', rank: 1, nome: 'Investidor', slogan: 'Organização mais investimentos' },
    completo: { id: 'completo', rank: 2, nome: 'Assessoria', slogan: 'Ecossistema com o seu assessor' },
  };
  // recurso -> plano mínimo que o libera
  const RECURSOS = {
    fluxo: 'gratis', orcamento: 'gratis', ingestao: 'gratis', backup: 'gratis',
    investimentos: 'investidor', proventos: 'investidor', patrimonio: 'investidor', carteira: 'investidor', ingestao_invest: 'investidor', importar: 'investidor',
    carteira_recomendada: 'completo', relatorios: 'completo', ia_pdf: 'completo', visao_consultor: 'completo',
  };
  const ABA_RECURSO = { geral: 'fluxo', rendas: 'fluxo', despesas: 'fluxo', inv: 'investimentos', pro: 'proventos', cart: 'carteira', relatorio: 'relatorios' };
  const planoNorm = (p) => (PLANOS[p] ? p : 'gratis');
  const planoPermite = (plano, recurso) => !RECURSOS[recurso] || PLANOS[planoNorm(plano)].rank >= PLANOS[RECURSOS[recurso]].rank;
  const planoMinimo = (recurso) => RECURSOS[recurso] || 'gratis';

  /* ---------- Análise de investimentos e proventos (métricas de estudo) ----------
     itens: [{ nome, tipo, classe, valor (posição atual), ap[12], pr[12] }]
     C: saída de compute() do ano. meses: meses já decorridos no ano (1 a 12). Tudo a custo, sem cotação de mercado. */
  function analiseInvest(o) {
    const C = o.C; const meses = Math.max(1, Math.min(12, o.meses || 12)); const meta = +o.metaAporte || 0;
    const ate = (arr) => arr.slice(0, meses).reduce((s, v) => s + (+v || 0), 0);
    const itens = (o.itens || []).map((i) => ({ nome: i.nome, tipo: i.tipo, classe: i.classe || 'Outros', valor: Math.max(0, +i.valor || 0), ap: i.ap || z(), pr: i.pr || z() }));
    const total = itens.reduce((s, i) => s + i.valor, 0);
    // aportes
    const aportesAte = ate(C.aportes); const mesesComAporte = C.aportes.slice(0, meses).filter((v) => v > 0.5).length;
    const metaAte = meta * meses;
    const aporte = { ano: sum(C.aportes), ateAgora: r2(aportesAte), mediaMes: r2(aportesAte / meses), mesesComAporte, meses, constancia: mesesComAporte / meses,
      meta, metaAte, ritmo: metaAte > 0 ? aportesAte / metaAte : null, faltaMeta: metaAte > 0 ? r2(Math.max(0, metaAte - aportesAte)) : null,
      porMes: C.aportes.map((v, m) => m < meses && v > 0.5) };
    // composição e concentração
    const pos = itens.filter((i) => i.valor > 0).map((i) => Object.assign(i, { peso: total > 0 ? i.valor / total : 0 })).sort((a, b) => b.valor - a.valor);
    const hhi = pos.reduce((s, i) => s + i.peso * i.peso, 0);
    const classes = {}; pos.forEach((i) => { classes[i.classe] = (classes[i.classe] || 0) + i.valor; });
    const porClasse = Object.keys(classes).map((k) => ({ label: k, value: classes[k], peso: total > 0 ? classes[k] / total : 0 })).sort((a, b) => b.value - a.value);
    const rf = pos.filter((i) => i.tipo === 'RENDA FIXA').reduce((s, i) => s + i.valor, 0);
    const carteira = { total: r2(total), n: pos.length, posicoes: pos, porClasse, maior: pos[0] || null, hhi, nEfetivo: hhi > 0 ? 1 / hhi : 0, pesoRF: total > 0 ? rf / total : 0, pesoBolsa: total > 0 ? 1 - rf / total : 0 };
    // proventos
    const provAte = ate(C.faturamento); const despAte = ate(C.despesas);
    const mediaProv = provAte / meses; const mediaDesp = despAte / meses; const anual = mediaProv * 12;
    const yoc = total > 0 && anual > 0 ? anual / total : null;
    const pagadores = itens.map((i) => { const recebido = i.pr.reduce((s, v) => s + (+v || 0), 0); const ateI = ate(i.pr);
      return { nome: i.nome, tipo: i.tipo, classe: i.classe, recebido: r2(recebido), mesesPagos: i.pr.filter((v) => v > 0).length, pr: i.pr, yoc: i.valor > 0 && ateI > 0 ? (ateI / meses * 12) / i.valor : null }; })
      .filter((x) => x.recebido > 0).sort((a, b) => b.recebido - a.recebido);
    const proventos = { ano: sum(C.faturamento), dividendos: sum(C.dividendos), rentab: sum(C.rentab), ateAgora: r2(provAte), mediaMes: r2(mediaProv), porDia: r2(mediaProv / 30),
      anualizado: r2(anual), yoc, cobertura: mediaDesp > 0 ? mediaProv / mediaDesp : null, gastoMedio: r2(mediaDesp),
      capitalLiberdade: yoc && mediaDesp > 0 ? r2((mediaDesp * 12) / yoc) : null, pagadores,
      mesesComProvento: C.faturamento.slice(0, meses).filter((v) => v > 0).length };
    return { aporte, carteira, proventos };
  }

  /* ---------- Análise da renda: fontes, previsibilidade, estabilidade, poupança e comprometimento ----------
     C: compute() do ano; rendas/rendaCats: do plano; meses: meses decorridos (1 a 12). */
  function analiseRenda(o) {
    const C = o.C; const meses = Math.max(1, Math.min(12, o.meses || 12)); const ate = (arr) => (arr || []).slice(0, meses).reduce((s, v) => s + (+v || 0), 0);
    const cats = {}; (o.rendaCats || []).forEach((c) => { cats[c.id] = c.nome; });
    const minRec = Math.max(1, Math.ceil(meses * 0.75));
    const fontes = (o.rendas || []).map((r) => { const v = r.valores || z(); const a = ate(v); const n = v.slice(0, meses).filter((x) => x > 0).length; const seguidos = meses >= 3 && v.slice(meses - 3, meses).every((x) => x > 0);
      return { id: r.id, nome: r.nome, cat: r.cat, catNome: cats[r.cat] || 'Outras', total: sum(v), ate: r2(a), mesesCom: n, recorrente: n >= minRec || seguidos, valores: v }; })
      .filter((f) => f.total > 0 || f.ate > 0).sort((a, b) => b.ate - a.ate || b.total - a.total);
    const rendasAte = ate(C.rendas); const divAte = ate(C.dividendos); const receitaAte = ate(C.receita); const despAte = ate(C.despesas);
    const recorrenteAte = fontes.filter((f) => f.recorrente).reduce((s, f) => s + f.ate, 0);
    const mensal = C.receita.slice(0, meses); const comRenda = mensal.filter((v) => v > 0);
    const media = comRenda.length ? comRenda.reduce((s, v) => s + v, 0) / comRenda.length : 0;
    const dp = comRenda.length ? Math.sqrt(comRenda.reduce((s, v) => s + (v - media) * (v - media), 0) / comRenda.length) : 0;
    const fixaAte = ate((C.despCat || {}).fixa); const gastoMedio = despAte / meses; const recMes = recorrenteAte / meses;
    return {
      meses, ateAgora: r2(receitaAte), rendasAte: r2(rendasAte), dividendosAte: r2(divAte), mediaMes: r2(receitaAte / meses), anoPrevisto: sum(C.receita),
      fontes, nFontes: fontes.length, maior: fontes[0] || null, pesoMaior: fontes[0] && rendasAte > 0 ? fontes[0].ate / rendasAte : null,
      previsibilidade: rendasAte > 0 ? recorrenteAte / rendasAte : null, recorrenteMes: r2(recMes),
      min: comRenda.length ? Math.min(...comRenda) : 0, max: comRenda.length ? Math.max(...comRenda) : 0, media: r2(media),
      cv: comRenda.length >= 3 && media > 0 ? dp / media : null, mesesSemRenda: mensal.filter((v) => !(v > 0)).length,
      poupanca: receitaAte > 0 ? (receitaAte - despAte) / receitaAte : null, sobraMes: r2((receitaAte - despAte) / meses),
      passiva: receitaAte > 0 ? divAte / receitaAte : null, passivaMes: r2(divAte / meses), coberturaPassiva: despAte > 0 ? divAte / despAte : null,
      comprometimento: recMes > 0 && fixaAte > 0 ? (fixaAte / meses) / recMes : null, fixosMes: r2(fixaAte / meses),
      gastoMedio: r2(gastoMedio), reserva: [r2(gastoMedio * 6), r2(gastoMedio * 12)],
      porCat: (o.rendaCats || []).map((c) => ({ id: c.id, nome: c.nome, valores: (C.rendaCat || {})[c.id] || z() })).filter((c) => sum(c.valores) > 0),
    };
  }

  /* ---------- Múltiplos objetivos ----------
     Cada objetivo: { id, tipo, nome, valor, ano (limite), pct }. pct é a fatia (0 a 100) do patrimônio e do aporte mensal
     reservada para ele; a soma fica em até 100% e o que sobra aparece como "sem destino". */
  const OBJ_TIPOS = [['independencia', 'Independência financeira'], ['aposentadoria', 'Aposentadoria'], ['imovel', 'Imóvel'], ['carro', 'Carro'], ['viagem', 'Viagem'],
    ['filhos', 'Filhos'], ['educacao', 'Educação'], ['reserva', 'Reserva de emergência'], ['casamento', 'Casamento'], ['negocio', 'Negócio próprio'], ['outro', 'Outro objetivo']];
  const tipoObjValido = (t) => OBJ_TIPOS.some((x) => x[0] === t);
  // reparte 100 (ou o total pedido) em inteiros proporcionais aos pesos, sem perder unidades (maiores restos)
  function repartir(pesos, total) {
    const W = sum(pesos); if (!(W > 0)) return pesos.map(() => 0);
    const raw = pesos.map((w) => (w / W) * total); const out = raw.map(Math.floor); let falta = total - sum(out);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (falta > 0) { out[i]++; falta--; } });
    return out;
  }
  function normObjetivos(perfil, newId) {
    perfil = perfil || {}; newId = newId || (() => 'o' + Math.random().toString(36).slice(2, 10));
    let lista = Array.isArray(perfil.objetivos) ? perfil.objetivos : null;
    if (!lista) { const o = perfil.objetivo; lista = o && +o.valor > 0 ? [{ tipo: o.tipo, valor: o.valor, ano: o.ano, pct: 100 }] : []; } // perfil antigo: um objetivo só
    const out = lista.filter((x) => x && typeof x === 'object').slice(0, 12).map((x) => ({
      id: typeof x.id === 'string' && x.id ? x.id.slice(0, 40) : newId(), tipo: tipoObjValido(x.tipo) ? x.tipo : 'outro',
      nome: typeof x.nome === 'string' ? x.nome.trim().slice(0, 60) : '', valor: Math.max(0, +x.valor || 0),
      ano: Number.isInteger(+x.ano) && +x.ano >= 1990 && +x.ano <= 2100 && x.ano !== null && x.ano !== '' ? +x.ano : null,
      pct: Math.max(0, Math.min(100, Math.round(+x.pct || 0))) }));
    const tot = sum(out.map((x) => x.pct)); if (tot > 100) { const nv = repartir(out.map((x) => x.pct), 100); out.forEach((x, i) => { x.pct = nv[i]; }); }
    return out;
  }
  const prazoMeses = (ano, h) => (ano ? (ano - h.ano) * 12 + (11 - h.mes) : null); // até dezembro do ano limite
  // aporte mensal que leva "saldo" a "valor" em n meses, com juros compostos
  function aporteNecessario(saldo, valor, ret, n) {
    if (!(valor > saldo)) return 0; if (!(n > 0)) return valor - saldo;
    const r = Math.pow(1 + (+ret || 0) / 100, 1 / 12) - 1; const f = Math.pow(1 + r, n);
    return r === 0 ? (valor - saldo) / n : Math.max(0, ((valor - saldo * f) * r) / (f - 1));
  }
  /* o: { objetivos, patrimonio, aporte (mensal), retorno (% a.a.), hoje: Date | {ano, mes} } */
  function analiseObjetivos(o) {
    const h = o.hoje instanceof Date ? { ano: o.hoje.getFullYear(), mes: o.hoje.getMonth() } : (o.hoje || { ano: 2000, mes: 0 });
    const patr = Math.max(0, +o.patrimonio || 0); const ap = Math.max(0, +o.aporte || 0); const ret = +o.retorno || 0;
    const itens = (o.objetivos || []).map((g) => {
      const f = (+g.pct || 0) / 100; const saldo = patr * f; const aporte = ap * f; const valor = +g.valor || 0; const prazo = prazoMeses(g.ano, h);
      const meses = valor > 0 ? mesesAteMeta(saldo, aporte, ret, valor, 1200) : null;
      const prev = meses != null ? { ano: h.ano + Math.floor((h.mes + meses) / 12), mes: (h.mes + meses) % 12 } : null;
      const necessario = valor > 0 && prazo != null ? aporteNecessario(saldo, valor, ret, prazo) : null;
      let status;
      if (!(valor > 0)) status = 'sem-valor'; else if (saldo >= valor) status = 'concluido'; else if (!(f > 0)) status = 'sem-divisao';
      else if (meses == null) status = 'fora'; else if (prazo == null) status = 'sem-prazo'; else if (meses <= prazo) status = 'no-prazo'; else status = 'atrasado';
      return Object.assign({}, g, { saldo: r2(saldo), aporte: r2(aporte), progresso: valor > 0 ? Math.min(1, saldo / valor) : 0, falta: r2(Math.max(0, valor - saldo)), prazo, meses, previsto: prev,
        necessario: necessario == null ? null : r2(necessario), extra: necessario == null ? null : r2(Math.max(0, necessario - aporte)), status,
        atraso: status === 'atrasado' ? meses - prazo : 0, folga: status === 'no-prazo' ? prazo - meses : 0 });
    });
    const pctAlocado = sum(itens.map((g) => +g.pct || 0));
    return { itens, pctAlocado, livre: Math.max(0, 100 - pctAlocado), valorTotal: r2(sum(itens.map((g) => +g.valor || 0))),
      noPrazo: itens.filter((g) => g.status === 'no-prazo' || g.status === 'concluido').length,
      atrasados: itens.filter((g) => g.status === 'atrasado' || g.status === 'fora').length,
      extraTotal: r2(sum(itens.map((g) => g.extra || 0))) };
  }
  /* Divisão sugerida: proporcional ao aporte mensal que cada objetivo pediria partindo do zero até o prazo
     (o mais urgente e mais caro recebe mais). Sem prazo, considera 20 anos. Devolve { id: pct } somando 100. */
  function sugerirDivisao(o) {
    const h = o.hoje instanceof Date ? { ano: o.hoje.getFullYear(), mes: o.hoje.getMonth() } : (o.hoje || { ano: 2000, mes: 0 });
    const lista = o.objetivos || [];
    const pesos = lista.map((g) => { const v = +g.valor || 0; if (!(v > 0)) return 0; const n = prazoMeses(g.ano, h); return aporteNecessario(0, v, o.retorno, n == null ? 240 : Math.max(1, n)); });
    const pct = repartir(pesos, 100); const out = {}; lista.forEach((g, i) => { out[g.id] = pct[i]; }); return out;
  }

  /* Contexto de cálculo de um ano: parcelas herdadas e patrimônio de partida.
     O patrimônio informado no diagnóstico vale para o início do "ano âncora" (o ano do diagnóstico).
     Anos seguintes somam os aportes registrados desde a âncora; anos anteriores (cadastrados depois) descontam os aportes
     até a âncora. Assim, registrar um ano passado não infla o patrimônio de hoje. */
  function aplicadoDoAno(plan) { return ((plan && plan.ativos) || []).reduce((s, a) => s + sum(a.ap || []), 0); }
  function ctxAno(plans, ano, patrimonioInicial, ancora) {
    const anos = Object.keys(plans || {}).map(Number).filter((y) => Number.isFinite(y));
    const a = Number.isFinite(+ancora) && ancora !== null && ancora !== '' ? +ancora : (anos.length ? Math.min(...anos) : ano);
    const pi = +patrimonioInicial || 0; let prev = 0;
    anos.forEach((y) => { const ap = aplicadoDoAno(plans[y]); if (y >= a && y < ano) prev += ap; else if (y >= ano && y < a) prev -= ap; });
    if (pi + prev < 0) prev = -pi; // antes da âncora, o patrimônio de partida não fica negativo
    return { carry: carryItems(plans, ano), prevAplicado: prev, patrimonioInicial: pi };
  }

  /* ---------- Linha do tempo multi-anos (histórico consolidado) ----------
     plans: { ano: plano }, o: { patrimonioInicial (do diagnóstico), ancora (ano do diagnóstico), hoje: Date | {ano, mes} }.
     Encadeia os anos em ordem (o patrimônio de cada ano parte do anterior, como em compute), corta o ano corrente
     no mês de hoje e ignora anos futuros. Valores a custo (patrimônio = inicial + aportes), sem variação de mercado. */
  function historico(plans, o) {
    o = o || {}; plans = plans || {};
    const h = o.hoje instanceof Date ? { ano: o.hoje.getFullYear(), mes: o.hoje.getMonth() } : (o.hoje || { ano: 9999, mes: 11 });
    const anosTodos = Object.keys(plans).map(Number).filter((y) => Number.isFinite(y)).sort((a, b) => a - b);
    const linhas = [];
    anosTodos.forEach((ano) => {
      const plan = plans[ano]; if (!plan) return;
      const C = compute(plan, ctxAno(plans, ano, o.patrimonioInicial, o.ancora));
      if (ano > h.ano) return;
      const ult = ano === h.ano ? h.mes : 11; const fat = (arr) => (arr || []).slice(0, ult + 1).reduce((a, v) => a + (+v || 0), 0);
      const entradas = fat(C.receita); const gastos = fat(C.despesas); const aplicado = fat(C.aplicado); const proventos = fat(C.faturamento);
      const preenchido = entradas > 0 || gastos > 0 || aplicado > 0 || proventos > 0;
      const st = plan.settings || {}; const ajuste = st.patrimonioInicial != null && st.patrimonioInicial !== '';
      linhas.push({ ano, C, ult, parcial: ano === h.ano && ult < 11, meses: ult + 1, preenchido, ajuste,
        entradas: r2(entradas), rendas: r2(fat(C.rendas)), proventos: r2(proventos), gastos: r2(gastos), sobra: r2(entradas - gastos),
        poupanca: entradas > 0 ? (entradas - gastos) / entradas : null, aportes: r2(fat(C.aportes)), aplicado: r2(aplicado),
        patrimonioInicio: r2(C.patrimonioBase), patrimonioFim: r2(C.patrimonio[ult]) });
    });
    // anos vazios antes do primeiro ano com dados não entram na linha do tempo
    const i0 = linhas.findIndex((l) => l.preenchido); const anos = i0 < 0 ? [] : linhas.slice(i0);
    anos.forEach((l, i) => {
      const ant = anos[i - 1]; l.variacao = r2(l.patrimonioFim - (ant ? ant.patrimonioFim : l.patrimonioInicio));
      const baseV = ant ? ant.patrimonioFim : l.patrimonioInicio; l.variacaoPct = baseV > 0 ? l.variacao / baseV : null;
      l.lacuna = !!(ant && l.ano - ant.ano > 1);
      if (ant) { l.entradasVar = ant.entradas > 0 && !l.parcial && !ant.parcial ? l.entradas / ant.entradas - 1 : null; l.gastosVar = ant.gastos > 0 && !l.parcial && !ant.parcial ? l.gastos / ant.gastos - 1 : null; }
    });
    const serie = []; anos.forEach((l) => { for (let m = 0; m <= l.ult; m++) serie.push({ ano: l.ano, mes: m, patrimonio: r2(l.C.patrimonio[m]), entradas: r2(l.C.receita[m]), gastos: r2(l.C.despesas[m]) }); delete l.C; });
    linhas.forEach((l) => { delete l.C; });
    const tot = (k) => r2(anos.reduce((a, l) => a + (l[k] || 0), 0));
    const totais = { anos: anos.length, meses: serie.length, entradas: tot('entradas'), gastos: tot('gastos'), sobra: tot('sobra'), aportes: tot('aportes'), aplicado: tot('aplicado'), proventos: tot('proventos'),
      patrimonioInicio: anos.length ? anos[0].patrimonioInicio : 0, patrimonioAtual: anos.length ? anos[anos.length - 1].patrimonioFim : 0 };
    totais.poupanca = totais.entradas > 0 ? totais.sobra / totais.entradas : null;
    totais.crescimento = r2(totais.patrimonioAtual - totais.patrimonioInicio); totais.crescimentoPct = totais.patrimonioInicio > 0 ? totais.crescimento / totais.patrimonioInicio : null;
    const completos = anos.filter((l) => !l.parcial && l.preenchido);
    const melhor = (k) => completos.concat(anos.filter((l) => l.parcial && l.preenchido)).reduce((b, l) => (l[k] != null && (!b || l[k] > b[k]) ? l : b), null);
    const mp = melhor('poupanca'); const ma = melhor('aportes');
    const destaques = { melhorPoupanca: mp ? { ano: mp.ano, v: mp.poupanca, parcial: mp.parcial } : null, maiorAporte: ma && ma.aportes > 0 ? { ano: ma.ano, v: ma.aportes, parcial: ma.parcial } : null,
      rendaCresc: completos.length >= 2 && completos[0].entradas > 0 ? { de: completos[0].ano, para: completos[completos.length - 1].ano, pct: completos[completos.length - 1].entradas / completos[0].entradas - 1 } : null,
      gastosCresc: completos.length >= 2 && completos[0].gastos > 0 ? { de: completos[0].ano, para: completos[completos.length - 1].ano, pct: completos[completos.length - 1].gastos / completos[0].gastos - 1 } : null,
      lacunas: anos.filter((l) => l.lacuna).map((l) => l.ano) };
    return { anos, serie, totais, destaques, temHistorico: anos.filter((l) => l.preenchido).length >= 2, anosFuturos: anosTodos.filter((y) => y > h.ano) };
  }

  /* ---------- Central de notificações: regras automáticas (puro, sem DOM) ----------
     o: { C: compute() do ano corrente, plan, carry (parcelas herdadas), hoje: Date | {ano, mes, dia}, recursos: {investimentos, carteira},
          carteira: {itens: [{nome, pctAtual, pctAlvo, sug}], somaAlvo, aporte} | null }
     Cada aviso tem id estável no período (o mesmo aviso não volta como novo no mesmo mês; se a situação piora, o id muda),
     uma chave de texto com variáveis numéricas (a interface formata e aplica a voz) e uma ação direta (cta). */
  const NIVEL_PESO = { critico: 5, alerta: 4, oportunidade: 3, info: 2, positivo: 1 };
  function notificacoes(o) {
    const C = o && o.C; const plan = (o && o.plan) || {}; if (!C || !plan.year) return [];
    const h = o.hoje instanceof Date ? { ano: o.hoje.getFullYear(), mes: o.hoje.getMonth(), dia: o.hoje.getDate() } : o.hoje;
    if (!h || plan.year !== h.ano) return [];
    const m = h.mes; const dia = h.dia; const diasMes = new Date(h.ano, m + 1, 0).getDate(); const faltam = diasMes - dia;
    const per = h.ano + '-' + String(m + 1).padStart(2, '0'); const rec = o.recursos || {}; const out = [];
    const push = (id, grupo, nivel, chave, vars, cta) => out.push({ id, grupo, nivel, chave, vars: Object.assign({ mes: MES_LONGO[m] }, vars), cta: cta || null, periodo: per });
    const nav = (rotulo, view, mes) => ({ rotulo, acao: 'nav', view, mes: mes == null ? null : mes });
    const T = C.T || {};
    if (!(T.receita > 0) && !(T.despesas > 0) && !(T.aplicado > 0)) {
      push('comecar:' + h.ano, 'lembrete', 'info', 'n_comecar', {}, { rotulo: 'Importar extrato', acao: 'ingest' });
      return out;
    }

    // 1) Orçamento do mês (Conta corrente)
    const orc = +C.orcamento[m] || 0; const gasto = +C.despesas[m] || 0; let alertaOrc = false;
    if (orc > 0) {
      const uso = gasto / orc;
      const reais = +(C.despReais || [])[m] || 0; const proj = (gasto - reais) + (dia > 0 ? (reais / dia) * diasMes : 0);
      if (uso > 1) { alertaOrc = true; push(`orc:${per}:100`, 'orcamento', 'critico', 'n_orc_estouro', { valor: gasto - orc, pct: uso, dias: faltam }, nav('Ver gastos', 'despesas', m)); }
      else if (uso >= 0.9) { alertaOrc = true; push(`orc:${per}:90`, 'orcamento', 'alerta', 'n_orc_90', { pct: uso, restante: orc - gasto, dias: faltam }, nav('Ver gastos', 'despesas', m)); }
      else if (dia >= 7 && faltam >= 3 && reais > 0 && proj > orc * 1.05) { alertaOrc = true; push(`orc:${per}:ritmo`, 'orcamento', 'alerta', 'n_orc_ritmo', { projecao: proj, excesso: proj - orc, porDia: (orc - gasto) / Math.max(1, faltam + 1) }, nav('Ver gastos', 'despesas', m)); }
      else if (uso >= 0.75) push(`orc:${per}:75`, 'orcamento', 'info', 'n_orc_75', { pct: uso, restante: orc - gasto, dias: faltam }, nav('Ver gastos', 'despesas', m));
    } else if (gasto > 0) push(`orcdef:${per}`, 'orcamento', 'info', 'n_orc_definir', {}, nav('Definir orçamento', 'despesas', m));

    // gasto atípico: área de gasto do mês 40% (e ao menos R$ 200) acima da média dos meses anteriores com gasto
    if (m >= 3) {
      const areas = {}; const somar = (nome, v) => { const k = nome || 'Outros'; areas[k] = add(areas[k] || z(), v); };
      (plan.despesas || []).concat(o.carry || []).forEach((it) => somar(it.area, itemValores(it, plan.year)));
      (plan.lancamentos || []).forEach((l) => { const d = parseDataISO(l.data); if (!d || d.ano !== plan.year) return; const v = z(); v[d.mes] = +l.valor || 0; somar(l.area, v); });
      let pior = null;
      Object.keys(areas).forEach((nome) => {
        const v = areas[nome]; const ant = v.slice(0, m).filter((x) => x > 0); if (ant.length < 3) return;
        const media = sum(ant) / ant.length; const atual = +v[m] || 0;
        if (atual > media * 1.4 && atual - media >= 200 && (!pior || atual / media > pior.r)) pior = { nome, atual, media, r: atual / media };
      });
      if (pior) push(`area:${per}:${norm(pior.nome).replace(/[^a-z0-9]+/g, '-')}`, 'orcamento', 'alerta', 'n_area_alta', { area: pior.nome, valor: pior.atual, media: pior.media, pct: pior.r - 1 }, nav('Ver gastos', 'despesas', m));
    }

    // 2) Lembretes do calendário
    const entradas = +C.receita[m] || 0;
    if (dia >= 5) {
      if (!(entradas > 0)) push(`lem:entr:${per}`, 'lembrete', 'alerta', 'n_entradas_falta', {}, nav('Registrar entradas', 'rendas'));
      else if (dia <= 9) push(`lem:entrok:${per}`, 'lembrete', 'info', 'n_entradas_conferir', { valor: entradas }, nav('Conferir rendas', 'rendas'));
    }
    if (dia >= 8 && !(+(C.lancQtd || [])[m] > 0)) push(`lem:extr:${per}`, 'lembrete', 'info', 'n_extrato', {}, { rotulo: 'Importar extrato', acao: 'ingest' });
    if (dia >= 20 && !alertaOrc) {
      if (orc > 0) push(`lem:fech:${per}`, 'lembrete', 'info', 'n_fechamento', { dias: faltam, restante: orc - gasto, porDia: (orc - gasto) / Math.max(1, faltam + 1) }, nav('Ver fechamento', 'despesas', m));
      else push(`lem:fech:${per}`, 'lembrete', 'info', 'n_fechamento_livre', { dias: faltam, valor: gasto }, nav('Ver fechamento', 'despesas', m));
    }
    if (dia <= 5 && m > 0) {
      const mp = m - 1; const sobra = (+C.receita[mp] || 0) - (+C.despesas[mp] || 0);
      if (C.receita[mp] > 0 || C.despesas[mp] > 0) push(`resumo:${h.ano}-${String(mp + 1).padStart(2, '0')}`, 'lembrete', sobra >= 0 ? 'positivo' : 'alerta', sobra >= 0 ? 'n_resumo_sobra' : 'n_resumo_deficit', { mesAnt: MES_LONGO[mp], valor: Math.abs(sobra), pct: C.receita[mp] > 0 ? sobra / C.receita[mp] : 0 }, nav('Ver o mês', 'despesas', mp));
    }

    // 3) Aportes e proventos
    if (rec.investimentos) {
      const meta = +((plan.settings || {}).metaAporte) || 0; const apl = +C.aplicado[m] || 0; const aporte = +C.aportes[m] || 0;
      const sobraAnt = m > 0 ? (+C.receita[m - 1] || 0) - (+C.despesas[m - 1] || 0) : 0;
      if (!(apl > 0)) {
        if (dia >= 10) push(`lem:ap:${per}`, 'lembrete', sobraAnt > 0 ? 'oportunidade' : 'info', sobraAnt > 0 ? 'n_aporte_sobra' : meta > 0 ? 'n_aporte_meta' : 'n_aporte', { meta, sobra: sobraAnt, mesAnt: m > 0 ? MES_LONGO[m - 1] : '' }, nav('Aportar agora', 'inv'));
      } else if (meta > 0) {
        if (aporte >= meta) push(`meta:${per}`, 'conquista', 'positivo', 'n_meta_batida', { valor: aporte, meta }, nav('Ver aportes', 'inv'));
        else if (dia >= 20) push(`lem:apfalta:${per}`, 'lembrete', 'info', 'n_aporte_falta', { valor: aporte, meta, falta: meta - aporte }, nav('Aportar agora', 'inv'));
      }
      const prov = (+C.dividendos[m] || 0) + (+C.rentab[m] || 0);
      if (prov > 0) push(`prov:${per}`, 'conquista', 'positivo', 'n_proventos', { valor: prov, cobre: gasto > 0 ? prov / gasto : 0 }, nav('Ver proventos', 'pro'));
    }

    // 4) Oportunidades da carteira (rebalanceamento: só compra, nunca vende)
    const K = rec.carteira ? o.carteira : null;
    if (K && K.itens && K.itens.length) {
      if (!(K.somaAlvo > 0)) push(`cart:semalvo:${per}`, 'oportunidade', 'info', 'n_cart_sem_alvo', {}, nav('Definir alvos', 'cart'));
      else {
        if (Math.abs(K.somaAlvo - 100) > 0.05) push(`cart:alvo:${per}`, 'oportunidade', 'alerta', 'n_cart_alvo', { soma: K.somaAlvo }, nav('Ajustar alvos', 'cart'));
        const temValor = K.itens.some((i) => i.pctAtual > 0);
        if (temValor) {
          const dv = K.itens.map((i) => Object.assign({}, i, { d: (+i.pctAtual || 0) - (+i.pctAlvo || 0) }));
          const abaixo = dv.filter((i) => i.pctAlvo > 0 && i.d <= -3).sort((a, b) => a.d - b.d);
          const acima = dv.filter((i) => i.d >= 5).sort((a, b) => b.d - a.d);
          const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, '-');
          if (abaixo[0]) { const a = abaixo[0]; push(`cart:abaixo:${per}:${slug(a.nome)}`, 'oportunidade', 'oportunidade', a.sug > 0 ? 'n_cart_abaixo_sug' : 'n_cart_abaixo', { ativo: a.nome, pp: -a.d, valor: +a.sug || 0, aporte: +K.aporte || 0, outros: abaixo.length - 1 }, nav('Ver onde investir', 'cart')); }
          if (acima[0]) { const a = acima[0]; push(`cart:acima:${per}:${slug(a.nome)}`, 'oportunidade', 'info', 'n_cart_acima', { ativo: a.nome, pp: a.d }, nav('Ver carteira', 'cart')); }
        }
      }
    }
    return out.map((n, i) => [n, i]).sort((a, b) => (NIVEL_PESO[b[0].nivel] - NIVEL_PESO[a[0].nivel]) || a[1] - b[1]).map((x) => x[0]);
  }

  const api = { PLANOS, RECURSOS, ABA_RECURSO, planoPermite, planoMinimo, planoNorm, parseDataISO, MES, MES_LONGO, TAXONOMIA, ASSET_LEVELS, QUIZ, PERFIS, RETORNO_PADRAO, CATS_DESP, CATS_RENDA, FORMATO_BACKUP,
    z, add, sub, sum, r2, norm, monthIndex, parseValor, distribuir, parcelaMeses, parcelaFim, parcelaIndice, itemValores, carryItems,
    ativoKey, buildAssetTree, rebalance, analiseInvest, analiseRenda, historico, ctxAno, OBJ_TIPOS, normObjetivos, analiseObjetivos, sugerirDivisao, aporteNecessario, notificacoes, scorePerfil, projetar, mesesAteMeta, simularObjetivo, migratePlan, compute, makeBackup, parseBackup,
    templateSheets, parseImport, applyImport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FPEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
