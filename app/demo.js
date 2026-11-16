/* Só para o rascunho em localhost: entra no modo demonstração com dados de exemplo (nada vai para o Supabase). */
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.FP_CONFIG.supabase = null;
  if (!localStorage.getItem('fp:user')) {
    const L = [['2026-11-02', 'Aluguel', 1800, 'Casa', 'xp'], ['2026-11-04', 'Mercado', 620, 'Alimentação', 'nubank'], ['2026-11-06', 'Combustível', 280, 'Transporte', 'xp'],
      ['2026-11-08', 'Restaurante', 190, 'Lazer', 'nubank'], ['2026-11-09', 'Farmácia', 96, 'Saúde', 'itau'], ['2026-11-10', 'Cinema', 80, 'Lazer', 'itau'],
      ['2026-11-12', 'Padaria', 42, 'Alimentação', 'nubank'], ['2026-11-13', 'Uber', 58, 'Transporte', 'xp']];
    localStorage.setItem('fp:user', JSON.stringify({ id: 'local', email: 'demo@aven.local', nome: 'Nathan' }));
    localStorage.setItem('fp:profile', JSON.stringify({ nome: 'Nathan', onboarded: true, anoRef: 2026, patrimonioInicial: 150000, patrimonioAno: 2026, rendaMensal: 9000, objetivos: [], instituicoes: ['xp', 'nubank', 'itau'] }));
    localStorage.setItem('fp:plan:2026', JSON.stringify({ v: 2, year: 2026, lancamentos: L.map(([data, desc, valor, area, inst], i) => ({ id: 'd' + i, origem: 'manual', data, desc, valor, cat: '', area, sub: '', inst })) }));
    localStorage.setItem('fp:interface', 'basico');
  }
}
