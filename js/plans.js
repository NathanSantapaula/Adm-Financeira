/* Planos e permissões por perfil.
   Três planos (Organização, Investidor, Assessoria) e dois papéis (cliente e consultor).
   A regra fica em E.PLANOS / E.RECURSOS (engine.js, testada); aqui está só a ligação com a tela. */
'use strict';
const PLANOS = E.PLANOS;
const ALIAS_RECURSO = { cart: 'carteira' };
const planoAtual = () => (Store.mode === 'local' || S.isAdmin ? 'completo' : S.assinatura && S.assinatura.status === 'ativo' ? E.planoNorm(S.assinatura.plano) : 'gratis');
const planoMinimoDe = (r) => (CFG.recursos && CFG.recursos[r]) || E.planoMinimo(r);
const temRecurso = (r) => PLANOS[planoAtual()].rank >= PLANOS[E.planoNorm(planoMinimoDe(ALIAS_RECURSO[r] || r))].rank;
const gated = (r) => !temRecurso(r);
const abaLiberada = (k) => temRecurso(E.ABA_RECURSO[k] || 'fluxo');
const visibleTabs = () => (S.profile ? S.profile.abas : ABA_KEYS);
const nomePlano = (id) => PLANOS[E.planoNorm(id)].nome;
const precoPlano = (id) => (id === 'gratis' ? 0 : id === 'investidor' ? +CFG.precoInvestidor || 0 : +CFG.precoPor || 0);
const precoTxt = (id) => (id === 'gratis' ? 'R$ 0' : precoPlano(id) > 0 ? brl(precoPlano(id)) : 'Sob consulta');
const pendente = () => { const ped = S.profile && S.profile.planoSolicitado; return ped && PLANOS[ped].rank > PLANOS[planoAtual()].rank ? ped : null; };
function planLabel() {
  if (S.isAdmin) return 'Consultor'; if (Store.mode === 'local') return 'Demonstração';
  const ped = pendente(); return 'Plano ' + nomePlano(planoAtual()) + (ped ? `, ${nomePlano(ped)} aguardando` : '');
}
function infoPlano(id) {
  const c = primeiroNome(); const ia = CFG.ingestao && CFG.ingestao.iaAtiva;
  return {
    gratis: { tag: '', resumo: 'Para colocar a casa em ordem.', itens: ['Entradas, conta corrente e despesas', 'Orçamento mensal, mês a mês', 'Importação automática de extratos (CSV e OFX)', 'Diagnóstico de perfil e backup completo'] },
    investidor: { tag: '', resumo: 'Para quem também investe.', itens: ['Tudo do plano Organização', 'Investimentos, proventos e patrimônio', 'Aba Carteira: onde investir a cada aporte', 'Aportes e proventos direto do extrato', 'Importação de planilhas .xlsx'] },
    completo: { tag: `Com o ${c}`, resumo: `Planejamento completo com ${CFG.consultor}.`, itens: ['Tudo do plano Investidor', `Assessoria exclusiva com ${CFG.consultor}, via XP Inc.`, 'Carteira recomendada pelo seu assessor', 'Relatórios avançados para imprimir ou levar à reunião'].concat(ia ? ['Leitura de PDFs e faturas com IA'] : []) },
  }[id];
}
const UPSELL = {
  investimentos: ['Investimentos e patrimônio', 'Registre o que aplica em cada ativo, acompanhe o patrimônio e veja a evolução ao longo do ano.'],
  proventos: ['Proventos', 'Acompanhe dividendos e rendimentos recebidos de cada ativo, mês a mês.'],
  carteira: ['Carteira e rebalanceamento', 'Defina o percentual-alvo de cada ativo e veja, a cada aporte, exatamente onde investir para manter a carteira equilibrada.'],
  importar: ['Importação de planilhas', 'Importe seus dados de um arquivo .xlsx, inclusive a carteira montada pelo seu assessor. O modelo pode ser baixado abaixo.'],
  relatorios: ['Relatórios avançados', 'Um relatório mensal pronto para imprimir ou levar à reunião, com resultado do mês, orçamento, carteira e a recomendação do assessor.'],
  carteira_recomendada: ['Carteira recomendada', 'Receba do seu assessor a carteira recomendada e aplique no seu painel com um clique.'],
  ingestao_invest: ['Aportes e proventos pelo extrato', 'Reconheça compras de ativos, aplicações e dividendos no extrato e leve cada um para a aba certa.'],
  ia_pdf: ['Leitura de PDFs com IA', 'Envie faturas e relatórios em PDF e deixe a IA extrair e categorizar os lançamentos.'],
};
function lockedHtml(recurso) {
  const r = ALIAS_RECURSO[recurso] || recurso; const min = E.planoNorm(planoMinimoDe(r)); const t = UPSELL[r] || ['Recurso de plano superior', 'Disponível em um plano acima do seu.'];
  return `<div class="locked"><div class="lock-ic">${I.lock}</div><div><h3>${esc(t[0])}: plano ${esc(nomePlano(min))}</h3><p>${esc(t[1])}</p><div class="btn-row"><button class="btn primary" data-act="upgrade" data-plano="${min}">Conhecer o plano ${esc(nomePlano(min))}</button><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></div></div>`;
}
function iniciarCheckout(plano) {
  plano = plano === 'investidor' ? 'investidor' : 'completo';
  if (S.profile && (!S.profile.planoSolicitado || PLANOS[plano].rank > PLANOS[S.profile.planoSolicitado].rank)) { S.profile.planoSolicitado = plano; touch('profile'); }
  S.checkoutPlano = plano; closeAdmin(); S.screen = 'checkout'; render();
}
