/* Personalização: temas visuais e voz (tom de comunicação) das orientações financeiras.
   Temas = variáveis CSS (assets/css/app.css) escolhidas por data-theme no <html>.
   Voz   = catálogo de frases com marcadores {assim}; o app inteiro fala pela função voz(). */
'use strict';
const TEMAS = {
  auto: { nome: 'Automático', desc: 'Segue o seu aparelho: Light Apple de dia, Dark OLED à noite.', sw: ['#FBFBFD', '#FFFFFF', '#000000', '#0F0F11'] },
  light: { nome: 'Light Apple', desc: 'Claro, limpo e luminoso.', sw: ['#FBFBFD', '#FFFFFF', '#0071E3', '#5E5CE6'] },
  oled: { nome: 'Dark OLED', desc: 'Preto verdadeiro. Elegante e econômico em telas OLED.', sw: ['#000000', '#0F0F11', '#2F9BFF', '#7D7AFF'] },
  midnight: { nome: 'Midnight Blue', desc: 'Azul profundo com vidro de brilho frio.', sw: ['#050A1A', '#0D1730', '#5AA7FF', '#8B7BFF'] },
};
const COR_BARRA = { light: '#FBFBFD', oled: '#000000', midnight: '#050A1A' };
const mqEscuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const temaResolvido = (pref) => (pref === 'light' || pref === 'oled' || pref === 'midnight' ? pref : mqEscuro && mqEscuro.matches ? 'oled' : 'light');
function aplicarTema(pref, animar) {
  pref = TEMAS[pref] ? pref : 'auto'; const r = temaResolvido(pref); const h = document.documentElement;
  if (animar) { h.classList.add('tema-anim'); setTimeout(() => h.classList.remove('tema-anim'), 650); }
  h.dataset.theme = r; h.dataset.themePref = pref;
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', COR_BARRA[r]);
  try { localStorage.setItem('fp:tema', pref); } catch (e) { /* ignora */ }
}
if (mqEscuro && mqEscuro.addEventListener) mqEscuro.addEventListener('change', () => { if ((document.documentElement.dataset.themePref || 'auto') === 'auto') aplicarTema('auto', true); });

/* ---------------- voz ---------------- */
const VOZES = {
  consultivo: { nome: 'Consultivo', desc: 'Equilibrado e prático, como uma conversa com o seu assessor.' },
  formal: { nome: 'Executivo', desc: 'Preciso e impessoal, em linguagem de relatório.' },
  direto: { nome: 'Direto', desc: 'Curto, objetivo e sem rodeios.' },
  acolhedor: { nome: 'Acolhedor', desc: 'Caloroso e encorajador, celebra cada avanço.' },
};
const VOZ = {
  consultivo: {
    deficit: 'Em {ano}, os gastos superaram as entradas registradas em {valor}. Falta registrar alguma renda?',
    saudacao: '{saud}, {nome}.', titulo: 'Seu planejamento de {ano}, em um relance.',
    orc_ok: 'Você usou {pct} do orçamento de {mes}. Ainda restam {restante}.',
    orc_estourou: 'Você passou do orçamento de {mes} em {valor}. Vale rever os gastos do mês.',
    orc_definir: 'Defina um orçamento para {mes} e acompanhe quanto ainda pode gastar.',
    poupanca: 'Em {ano}, {pct} da sua renda sobrou para investir ({valor}).',
    aporte_mes: 'Em {mes} você aportou {valor}, {pct} da meta mensal de {meta}.',
    carteira_desvio: '{ativo} está {pp} p.p. abaixo do alvo. O próximo aporte deve priorizá-lo.',
    sem_dados: 'Comece registrando suas rendas e seus gastos, ou importe um extrato. Em poucos minutos o painel mostra para onde vai o seu dinheiro.',
    ingest_ok: 'Importação concluída: {resumo}.', mes_vazio: 'Nenhum lançamento neste mês ainda. Importe um extrato ou adicione o primeiro gasto.',
    exemplo: 'Você usou 78% do orçamento de março. Ainda restam R$ 1.320.',
  },
  formal: {
    deficit: 'No exercício de {ano}, os gastos superaram as entradas registradas em {valor}. Verifique se há rendas não lançadas.',
    saudacao: '{saud}, {nome}.', titulo: 'Posição consolidada de {ano}.',
    orc_ok: 'O orçamento de {mes} foi utilizado em {pct}, restando {restante}.',
    orc_estourou: 'O orçamento de {mes} foi excedido em {valor}. Recomenda-se revisar os gastos do período.',
    orc_definir: 'Não há orçamento definido para {mes}. Recomenda-se estabelecê-lo para acompanhamento.',
    poupanca: 'No exercício de {ano}, {pct} da renda foi destinada à poupança ({valor}).',
    aporte_mes: 'Em {mes}, os aportes somaram {valor}, equivalentes a {pct} da meta mensal de {meta}.',
    carteira_desvio: '{ativo} encontra-se {pp} p.p. abaixo da alocação-alvo. Sugere-se priorizá-lo no próximo aporte.',
    sem_dados: 'Não há lançamentos registrados. Registre rendas e gastos ou importe um extrato para iniciar a análise.',
    ingest_ok: 'Importação concluída: {resumo}.', mes_vazio: 'Não há lançamentos registrados neste mês.',
    exemplo: 'O orçamento de março foi utilizado em 78%, restando R$ 1.320.',
  },
  direto: {
    deficit: 'Gastos {valor} acima das entradas em {ano}. Falta lançar renda?',
    saudacao: 'Olá, {nome}.', titulo: '{ano}: onde você está.',
    orc_ok: '{pct} do orçamento de {mes} usado. Restam {restante}.', orc_estourou: 'Estourou {valor} em {mes}. Reveja os gastos.',
    orc_definir: 'Sem orçamento em {mes}. Defina um.', poupanca: '{pct} da renda sobrou em {ano} ({valor}).',
    aporte_mes: '{mes}: {valor} aportados, {pct} da meta de {meta}.', carteira_desvio: '{ativo}: {pp} p.p. abaixo do alvo. Priorize no aporte.',
    sem_dados: 'Sem dados. Importe um extrato ou lance rendas e gastos.', ingest_ok: 'Importado: {resumo}.', mes_vazio: 'Mês vazio. Importe ou lance.',
    exemplo: '78% do orçamento de março usado. Restam R$ 1.320.',
  },
  acolhedor: {
    deficit: 'Em {ano}, os gastos passaram das entradas registradas em {valor}. Será que falta lançar alguma renda?',
    saudacao: '{saud}, {nome}! Que bom ter você aqui.', titulo: 'Vamos ver como está o seu {ano}?',
    orc_ok: 'Tudo certo por aqui: você usou {pct} do orçamento de {mes} e ainda tem {restante} disponíveis.',
    orc_estourou: 'O orçamento de {mes} passou em {valor}. Acontece! Que tal olhar com calma onde dá para ajustar?',
    orc_definir: 'Que tal definir um orçamento para {mes}? Ele ajuda a saber quanto ainda cabe no mês.',
    poupanca: 'Boa notícia: {pct} da sua renda de {ano} sobrou para investir ({valor}).',
    aporte_mes: 'Em {mes} você aportou {valor}, {pct} da sua meta de {meta}. Cada aporte conta!',
    carteira_desvio: '{ativo} está {pp} p.p. abaixo do alvo. No próximo aporte, ele merece um carinho extra.',
    sem_dados: 'Vamos começar? Registre suas rendas e gastos ou importe um extrato, e o painel mostra para onde vai o seu dinheiro.',
    ingest_ok: 'Pronto! {resumo}.', mes_vazio: 'Este mês ainda está em branco. Importe um extrato ou adicione o primeiro gasto.',
    exemplo: 'Tudo certo: você usou 78% do orçamento de março e ainda tem R$ 1.320.',
  },
};
const tomAtual = () => (typeof S !== 'undefined' && S.profile && S.profile.prefs && VOZ[S.profile.prefs.voz] ? S.profile.prefs.voz : 'consultivo');
function voz(chave, vars) {
  const t = VOZ[tomAtual()][chave] != null ? VOZ[tomAtual()][chave] : VOZ.consultivo[chave] || '';
  return t.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
}
const saudacaoHora = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ---------------- ações e interface de preferências ---------------- */
function definirTema(pref) { if (!S.profile) return; S.profile.prefs.tema = pref; touch('profile'); aplicarTema(pref, true); if (S.adminOpen) renderAdmin(); }
function definirVoz(v) { if (!S.profile || !VOZ[v]) return; S.profile.prefs.voz = v; touch('profile'); render(); if (S.adminOpen) renderAdmin(); toast('Voz alterada: ' + VOZES[v].nome + '.'); }
function prefsHtml() {
  const p = S.profile.prefs;
  const temas = Object.keys(TEMAS).map((k) => `<button class="theme-card" data-act="tema" data-tema="${k}" aria-pressed="${p.tema === k}"><span class="theme-sw">${TEMAS[k].sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span><b>${TEMAS[k].nome}</b><small>${TEMAS[k].desc}</small></button>`).join('');
  const vozes = Object.keys(VOZES).map((k) => `<button class="voice-card" data-act="voz" data-voz="${k}" aria-pressed="${p.voz === k}"><b>${VOZES[k].nome}</b><small>${VOZES[k].desc}</small><q>${VOZ[k].exemplo}</q></button>`).join('');
  return `<section class="dr-sec"><h3>Aparência</h3><p class="mmsg">Escolha o visual do seu painel. A troca é imediata e fica salva na sua conta.</p><div class="themes">${temas}</div></section>
    <section class="dr-sec"><h3>Voz do painel</h3><p class="mmsg">Define o tom dos destaques, avisos e orientações financeiras.</p><div class="voices">${vozes}</div></section>`;
}
