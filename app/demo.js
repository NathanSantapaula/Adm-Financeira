/* Só para o rascunho em localhost: entra no modo demonstração com dados de exemplo fartos (nada vai para o Supabase).
   Dois anos de rendas, gastos do dia a dia, contas fixas, investimentos, proventos e sonhos, para ver todos os widgets com valores. */
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.FP_CONFIG.supabase = null;
  if (localStorage.getItem('fp:demo') !== '3') {
    let sd = 7; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280); // sempre os mesmos números
    const z = () => Array(12).fill(0); const ate = (ano) => (ano === 2026 ? 10 : 11); // 2026 vai até novembro
    const id = (() => { let n = 0; return () => 'x' + (n++); })();
    const GASTOS = [['Mercado', 'Alimentação', 'nubank', 520, 4], ['Restaurante', 'Lazer', 'nubank', 140, 3], ['iFood', 'Alimentação', 'ifood', 62, 5], ['Uber', 'Transporte', 'xp', 34, 6],
      ['Combustível', 'Transporte', 'itau', 260, 2], ['Farmácia', 'Saúde', 'itau', 88, 1], ['Cinema', 'Lazer', 'xp', 70, 1], ['Roupas', 'Compras', 'nubank', 240, 1], ['Padaria', 'Alimentação', 'nubank', 28, 4], ['Presente', 'Compras', 'xp', 150, 0.4]];
    const plano = (ano) => {
      const L = []; const n = ate(ano);
      for (let m = 0; m <= n; m++) for (const [desc, area, inst, base, vezes] of GASTOS) {
        const k = Math.floor(vezes + rnd()); for (let i = 0; i < k; i++) { const d = 1 + Math.floor(rnd() * 27);
          L.push({ id: id(), origem: 'manual', data: `${ano}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, desc, valor: Math.round(base * (0.6 + rnd() * 0.8) * 100) / 100, cat: '', area, sub: '', inst }); } }
      const v = (f) => z().map((_, m) => (m <= n ? f(m) : 0));
      const rendas = [{ id: 'r1', nome: 'Salário', cat: 'fixa', valores: v(() => (ano === 2026 ? 11800 : 10500)) },
        { id: 'r2', nome: 'Projetos de design', cat: 'extra', valores: v((m) => (m % 3 === 1 ? 2400 + Math.round(rnd() * 1800) : 0)) },
        { id: 'r3', nome: '13º salário', cat: 'extra', valores: v((m) => (m === 11 ? 10500 : 0)) }];
      const despesas = [['Aluguel', 'Casa', 2600, 'itau'], ['Condomínio', 'Casa', 680, 'itau'], ['Internet', 'Casa', 120, 'nubank'], ['Academia', 'Saúde', 129, 'nubank'], ['Streaming', 'Lazer', 55.9, 'nubank'], ['Plano de saúde', 'Saúde', 610, 'xp']]
        .map(([nome, area, val, inst]) => ({ id: id(), nome, area, cat: 'fixa', inst, valores: v(() => val), baixas: {} }));
      const ap = (b, j) => v((m) => Math.round(b * (0.7 + rnd() * j)));
      const ativos = [{ nome: 'Tesouro Selic 2029', tipo: 'Tesouro Direto', classe: 'Renda Fixa', ap: ap(1200, 0.6) }, { nome: 'CDB Banco XP 110% CDI', tipo: 'CDB', classe: 'Renda Fixa', ap: ap(800, 0.5) },
        { nome: 'IVVB11', tipo: 'ETF', classe: 'Exterior', ap: ap(500, 0.8) }, { nome: 'ITSA4', tipo: 'Ação', classe: 'Ações', ap: ap(400, 0.9) }, { nome: 'BBAS3', tipo: 'Ação', classe: 'Ações', ap: ap(300, 0.9) },
        { nome: 'HGLG11', tipo: 'FII', classe: 'Fundos Imobiliários', ap: ap(450, 0.7) }, { nome: 'MXRF11', tipo: 'FII', classe: 'Fundos Imobiliários', ap: ap(250, 0.7) }]
        .map((a) => Object.assign({ id: id(), pr: v(() => (a.classe === 'Fundos Imobiliários' ? 40 + Math.round(rnd() * 60) : a.classe === 'Ações' ? (rnd() > 0.6 ? 30 + Math.round(rnd() * 50) : 0) : 0)) }, a));
      return { v: 2, year: ano, rendas, despesas, ativos, lancamentos: L, orcamento: z(), metasAporte: Array(12).fill(null), settings: { metaAporte: 3500, metaInvAno: 42000, orcPadrao: 9500, patrimonioInicial: null } };
    };
    localStorage.setItem('fp:user', JSON.stringify({ id: 'local', email: 'demo@cifrao.local', nome: 'Nathan' }));
    localStorage.setItem('fp:profile', JSON.stringify({ nome: 'Nathan', onboarded: true, anoRef: 2025, patrimonioInicial: 120000, patrimonioAno: 2025, rendaMensal: 11800, instituicoes: ['xp', 'nubank', 'itau', 'ifood'],
      objetivos: [{ id: 'o1', tipo: 'viagem', nome: 'Japão em família', valor: 45000, ano: 2027, modo: 'fatia', fatia: 40 }, { id: 'o2', tipo: 'imovel', nome: 'Entrada do apartamento', valor: 180000, ano: 2030, modo: 'fatia', fatia: 60 }],
      objetivoFoco: 'o1', limites: {} }));
    localStorage.setItem('fp:plan:2025', JSON.stringify(plano(2025)));
    localStorage.setItem('fp:plan:2026', JSON.stringify(plano(2026)));
    localStorage.setItem('fp:demo', '3');
  }
}
